use std::fs;
use std::io::{Write, BufRead, BufReader};
use std::path::{Path, PathBuf};
use std::process::{Command, Stdio};
use std::sync::{Arc, Mutex};

use serde::Serialize;
use tauri::{AppHandle, Emitter, Manager, State};

// ── file I/O ──────────────────────────────────────────────────────────────────

#[tauri::command]
fn read_file(path: String) -> Result<String, String> {
    fs::read_to_string(&path).map_err(|e| format!("Failed to read {}: {}", path, e))
}

#[tauri::command]
fn write_file(path: String, content: String) -> Result<(), String> {
    fs::write(&path, content).map_err(|e| format!("Failed to write {}: {}", path, e))
}

#[derive(serde::Serialize)]
struct DirEntry {
    name: String,
    path: String,
    is_dir: bool,
}

#[tauri::command]
fn read_dir(path: String) -> Result<Vec<DirEntry>, String> {
    let mut entries = Vec::new();
    let read = fs::read_dir(&path).map_err(|e| format!("Failed to read dir {}: {}", path, e))?;
    for entry in read.flatten() {
        let p: PathBuf = entry.path();
        entries.push(DirEntry {
            name: entry.file_name().to_string_lossy().into_owned(),
            path: p.to_string_lossy().into_owned(),
            is_dir: p.is_dir(),
        });
    }
    entries.sort_by(|a, b| match (a.is_dir, b.is_dir) {
        (true, false) => std::cmp::Ordering::Less,
        (false, true) => std::cmp::Ordering::Greater,
        _ => a.name.to_lowercase().cmp(&b.name.to_lowercase()),
    });
    Ok(entries)
}

// ── terminal ──────────────────────────────────────────────────────────────────

#[derive(serde::Serialize)]
struct TermResult {
    stdout: String,
    stderr: String,
    code: Option<i32>,
}

fn resolve_cwd(cwd: &Option<String>) -> PathBuf {
    cwd.as_ref()
        .map(PathBuf::from)
        .unwrap_or_else(|| std::env::current_dir().unwrap_or_else(|_| PathBuf::from(".")))
}

#[tauri::command]
fn term_cd(path: String, cwd: Option<String>) -> Result<String, String> {
    let base = resolve_cwd(&cwd);
    let target = if Path::new(&path).is_absolute() {
        PathBuf::from(&path)
    } else {
        base.join(&path)
    };
    let canonical = target
        .canonicalize()
        .map_err(|e| format!("cd: {}: {}", path, e))?;
    if !canonical.is_dir() {
        return Err(format!("cd: not a directory: {}", path));
    }
    Ok(canonical.to_string_lossy().into_owned())
}

#[tauri::command]
fn term_run(cmd: String, cwd: Option<String>) -> Result<TermResult, String> {
    let working_dir = resolve_cwd(&cwd);

    #[cfg(target_os = "windows")]
    let output = Command::new("cmd")
        .args(["/C", &cmd])
        .current_dir(&working_dir)
        .output();

    #[cfg(not(target_os = "windows"))]
    let output = Command::new("sh")
        .args(["-c", &cmd])
        .current_dir(&working_dir)
        .output();

    match output {
        Ok(o) => Ok(TermResult {
            stdout: String::from_utf8_lossy(&o.stdout).to_string(),
            stderr: String::from_utf8_lossy(&o.stderr).to_string(),
            code: o.status.code(),
        }),
        Err(e) => Err(format!("Failed to run command: {}", e)),
    }
}

// ── Minecraft server state ────────────────────────────────────────────────────

pub struct McState {
    dir: Option<PathBuf>,
    stdin_tx: Option<std::sync::mpsc::Sender<String>>,
    running: bool,
    players: Vec<String>,
}

impl McState {
    fn new() -> Self {
        McState { dir: None, stdin_tx: None, running: false, players: Vec::new() }
    }
}

// Use Arc so it can be cloned into threads
type SharedMcState = Arc<Mutex<McState>>;

fn server_dir_path(app: &AppHandle) -> PathBuf {
    app.path()
        .app_data_dir()
        .unwrap_or_else(|_| PathBuf::from("."))
        .join("minecraft_server")
}

fn is_installed(dir: &Path) -> bool {
    dir.join("paper.jar").exists()
}

// ── event helpers ─────────────────────────────────────────────────────────────

#[derive(Serialize, Clone)]
struct ProgressPayload { step: String, percent: u32 }

#[derive(Serialize, Clone)]
struct LogPayload { text: String, level: String }

fn emit_prog(app: &AppHandle, step: &str, pct: u32) {
    let _ = app.emit("mc-progress", ProgressPayload { step: step.to_string(), percent: pct });
}

fn emit_log(app: &AppHandle, text: &str, level: &str) {
    let _ = app.emit("mc-log", LogPayload { text: text.to_string(), level: level.to_string() });
}

// ── mc_check_java ─────────────────────────────────────────────────────────────

#[tauri::command]
fn mc_check_java() -> Result<String, String> {
    let out = Command::new("java")
        .arg("-version")
        .output()
        .map_err(|_| "java not found in PATH — install Java 21 from adoptium.net".to_string())?;
    let text = String::from_utf8_lossy(&out.stderr).to_string()
        + &String::from_utf8_lossy(&out.stdout);
    let line = text.lines().next().unwrap_or("java (version unknown)").to_string();
    Ok(line)
}

// ── helpers: HTTP download ────────────────────────────────────────────────────

async fn http_get_json(url: &str) -> Result<serde_json::Value, String> {
    let client = reqwest::Client::builder()
        .user_agent("SkStudio/1.0")
        .timeout(std::time::Duration::from_secs(30))
        .build()
        .map_err(|e| e.to_string())?;
    let resp = client.get(url)
        .header("Accept", "application/vnd.github.v3+json")
        .send().await.map_err(|e| format!("GET {}: {}", url, e))?;
    if !resp.status().is_success() {
        return Err(format!("HTTP {} for {}", resp.status(), url));
    }
    resp.json().await.map_err(|e| format!("JSON parse: {}", e))
}

async fn http_post_json(url: &str, body: serde_json::Value) -> Result<serde_json::Value, String> {
    let client = reqwest::Client::builder()
        .user_agent("SkStudio/1.0")
        .timeout(std::time::Duration::from_secs(30))
        .build()
        .map_err(|e| e.to_string())?;
    let resp = client.post(url).json(&body).send().await
        .map_err(|e| format!("POST {}: {}", url, e))?;
    if !resp.status().is_success() {
        return Err(format!("HTTP {} for {}", resp.status(), url));
    }
    resp.json().await.map_err(|e| format!("JSON parse: {}", e))
}

async fn download_file(url: &str, dest: &Path) -> Result<(), String> {
    let client = reqwest::Client::builder()
        .user_agent("SkStudio/1.0")
        .timeout(std::time::Duration::from_secs(300))
        .build()
        .map_err(|e| e.to_string())?;
    let resp = client.get(url).send().await
        .map_err(|e| format!("download {}: {}", url, e))?;
    if !resp.status().is_success() {
        return Err(format!("HTTP {} downloading {}", resp.status(), url));
    }
    let bytes = resp.bytes().await.map_err(|e| e.to_string())?;
    fs::write(dest, &bytes).map_err(|e| format!("write {}: {}", dest.display(), e))?;
    Ok(())
}

// Get latest Paper 26.1.2 build download URL via PaperMC GraphQL API
async fn get_paper_url() -> Result<String, String> {
    let gql = serde_json::json!({
        "query": r#"query {
            project(key: "paper") {
                version(key: "26.1.2") {
                    builds(first: 10, orderBy: { direction: DESC }) {
                        edges {
                            node {
                                number
                                channel
                                download(key: "server:default") {
                                    name
                                    url
                                    checksums { sha256 }
                                }
                            }
                        }
                    }
                }
            }
        }"#
    });

    let json = http_post_json("https://fill.papermc.io/graphql", gql).await?;

    let edges = json.pointer("/data/project/version/builds/edges")
        .and_then(|v| v.as_array())
        .ok_or_else(|| format!("PaperMC: no builds found. Response: {}", json))?;

    // Prefer STABLE/RECOMMENDED, else take first build
    let node = edges.iter()
        .find(|e| {
            e.pointer("/node/channel")
                .and_then(|c| c.as_str())
                .map(|c| c.eq_ignore_ascii_case("stable") || c.eq_ignore_ascii_case("recommended") || c.eq_ignore_ascii_case("default"))
                .unwrap_or(false)
        })
        .or_else(|| edges.first())
        .and_then(|e| e.get("node"))
        .ok_or("PaperMC: no suitable build found")?;

    node.pointer("/download/url")
        .and_then(|v| v.as_str())
        .map(|s| s.to_string())
        .ok_or_else(|| format!("PaperMC: no download URL in response. Node: {}", node))
}

// Get latest release JAR URL from a GitHub repo
async fn get_github_jar(repo: &str) -> Result<String, String> {
    let url = format!("https://api.github.com/repos/{}/releases/latest", repo);
    let json = http_get_json(&url).await?;

    let assets = json["assets"].as_array().ok_or("no assets array")?;
    assets.iter()
        .find(|a| {
            a["name"].as_str()
                .map(|n| n.ends_with(".jar") && !n.contains("javadoc") && !n.contains("sources") && !n.contains("api"))
                .unwrap_or(false)
        })
        .and_then(|a| a["browser_download_url"].as_str())
        .map(|s| s.to_string())
        .ok_or_else(|| format!("no .jar asset in latest release of {}", repo))
}

// ── mc_install ────────────────────────────────────────────────────────────────

#[tauri::command]
async fn mc_install(app: AppHandle, state: State<'_, SharedMcState>) -> Result<(), String> {
    let dir = server_dir_path(&app);
    fs::create_dir_all(&dir).map_err(|e| format!("mkdir server: {}", e))?;
    fs::create_dir_all(dir.join("plugins")).map_err(|e| format!("mkdir plugins: {}", e))?;
    fs::create_dir_all(dir.join("plugins/Skript/scripts"))
        .map_err(|e| format!("mkdir scripts: {}", e))?;

    // ── 1. Paper ──────────────────────────────────────────────────────────────
    emit_prog(&app, "Querying PaperMC API for 26.1.2...", 5);
    let paper_url = get_paper_url().await
        .map_err(|e| format!("PaperMC API error: {}", e))?;

    emit_prog(&app, "Downloading Paper 26.1.2...", 10);
    download_file(&paper_url, &dir.join("paper.jar")).await
        .map_err(|e| format!("Paper download: {}", e))?;
    emit_prog(&app, "Paper downloaded.", 38);

    // ── 2. Skript ─────────────────────────────────────────────────────────────
    emit_prog(&app, "Downloading Skript...", 40);
    let skript_url = get_github_jar("SkriptLang/Skript").await
        .unwrap_or_else(|_| "https://github.com/SkriptLang/Skript/releases/download/2.11.0/Skript-2.11.0.jar".to_string());
    download_file(&skript_url, &dir.join("plugins/Skript.jar")).await
        .map_err(|e| format!("Skript download: {}", e))?;
    emit_prog(&app, "Skript downloaded.", 58);

    // ── 3. SkBee ──────────────────────────────────────────────────────────────
    emit_prog(&app, "Downloading SkBee...", 60);
    let skbee_url = get_github_jar("ShaneBeee/SkBee").await
        .unwrap_or_else(|_| "https://github.com/ShaneBeee/SkBee/releases/download/3.23.0/SkBee-3.23.0.jar".to_string());
    download_file(&skbee_url, &dir.join("plugins/SkBee.jar")).await
        .map_err(|e| format!("SkBee download: {}", e))?;
    emit_prog(&app, "SkBee downloaded.", 75);

    // ── 4. skript-reflect ─────────────────────────────────────────────────────
    emit_prog(&app, "Downloading skript-reflect...", 77);
    let reflect_url = get_github_jar("TPGamesNL/skript-reflect").await
        .unwrap_or_else(|_| "https://github.com/TPGamesNL/skript-reflect/releases/download/2.6.3/skript-reflect-2.6.3.jar".to_string());
    download_file(&reflect_url, &dir.join("plugins/skript-reflect.jar")).await
        .map_err(|e| format!("skript-reflect download: {}", e))?;
    emit_prog(&app, "skript-reflect downloaded.", 88);

    // ── 5. Configure ─────────────────────────────────────────────────────────
    emit_prog(&app, "Configuring server...", 90);

    fs::write(dir.join("eula.txt"), "eula=true\n")
        .map_err(|e| format!("eula.txt: {}", e))?;

    fs::write(dir.join("server.properties"), concat!(
        "online-mode=false\n",
        "server-port=25565\n",
        "motd=SkStudio Local Server\n",
        "max-players=20\n",
        "view-distance=8\n",
        "spawn-protection=0\n",
        "enable-command-block=true\n",
        "level-seed=\n",
    )).map_err(|e| format!("server.properties: {}", e))?;

    // Starter Skript file
    let _ = fs::write(
        dir.join("plugins/Skript/scripts/starter.sk"),
        "# Welcome to SkStudio!\n# Your scripts go in this folder.\n\non join:\n    send \"&aWelcome, %player%!\" to player\n",
    );

    // Store dir
    state.inner().lock().unwrap().dir = Some(dir.clone());

    emit_prog(&app, "Installation complete!", 100);
    Ok(())
}

// ── mc_get_status ─────────────────────────────────────────────────────────────

#[derive(Serialize)]
struct McStatus {
    installed: bool,
    running: bool,
    dir: String,
    players: Vec<String>,
}

#[tauri::command]
fn mc_get_status(app: AppHandle, state: State<'_, SharedMcState>) -> McStatus {
    let mut s = state.inner().lock().unwrap();
    if s.dir.is_none() {
        s.dir = Some(server_dir_path(&app));
    }
    let dir = s.dir.clone().unwrap();
    McStatus {
        installed: is_installed(&dir),
        running: s.running,
        dir: dir.to_string_lossy().into_owned(),
        players: s.players.clone(),
    }
}

// ── mc_start ──────────────────────────────────────────────────────────────────

#[tauri::command]
async fn mc_start(app: AppHandle, state: State<'_, SharedMcState>) -> Result<(), String> {
    let dir = {
        let mut s = state.inner().lock().unwrap();
        if s.running { return Err("Server already running".into()); }
        if s.dir.is_none() { s.dir = Some(server_dir_path(&app)); }
        s.dir.clone().unwrap()
    };

    if !is_installed(&dir) {
        return Err("Server not installed — run mc_install first".into());
    }

    let (tx, rx) = std::sync::mpsc::channel::<String>();
    {
        let mut s = state.inner().lock().unwrap();
        s.stdin_tx = Some(tx);
        s.running = true;
        s.players.clear();
    }

    let state_arc = state.inner().clone();
    let app2 = app.clone();

    std::thread::spawn(move || {
        let mut child = match Command::new("java")
            .args(["-Xmx1G", "-Xms512M", "-jar", "paper.jar", "--nogui"])
            .current_dir(&dir)
            .stdin(Stdio::piped())
            .stdout(Stdio::piped())
            .stderr(Stdio::null())
            .spawn()
        {
            Ok(c) => c,
            Err(e) => {
                emit_log(&app2, &format!("[SkStudio] Failed to start java: {}", e), "error");
                let mut s = state_arc.lock().unwrap();
                s.running = false;
                s.stdin_tx = None;
                let _ = app2.emit("mc-stopped", ());
                return;
            }
        };

        // Forward stdin commands
        let stdin = child.stdin.take().unwrap();
        std::thread::spawn(move || {
            let mut stdin = stdin;
            for cmd in rx {
                let _ = stdin.write_all(format!("{}\n", cmd).as_bytes());
                let _ = stdin.flush();
            }
        });

        // Stream stdout → mc-log events
        if let Some(stdout) = child.stdout.take() {
            let app3 = app2.clone();
            let state3 = state_arc.clone();
            std::thread::spawn(move || {
                let reader = BufReader::new(stdout);
                for line in reader.lines().flatten() {
                    let level = classify_log(&line);
                    emit_log(&app3, &line, level);

                    // Track online players
                    let mut s = state3.lock().unwrap();
                    if line.contains("joined the game") {
                        if let Some(name) = extract_player_name(&line) {
                            if !s.players.contains(&name) {
                                s.players.push(name);
                            }
                        }
                    } else if line.contains("left the game") || line.contains("lost connection") {
                        if let Some(name) = extract_player_name(&line) {
                            s.players.retain(|p| p != &name);
                        }
                    }
                    let players = s.players.clone();
                    drop(s);
                    let _ = app3.emit("mc-players", players);
                }
            });
        }

        child.wait().ok();

        let mut s = state_arc.lock().unwrap();
        s.running = false;
        s.stdin_tx = None;
        s.players.clear();
        drop(s);
        let _ = app2.emit("mc-stopped", ());
    });

    Ok(())
}

fn classify_log(line: &str) -> &'static str {
    let l = line.to_ascii_lowercase();
    if l.contains("[warn") || l.contains("warn:") { "warn" }
    else if l.contains("[error") || l.contains("error:") || l.contains("exception") { "error" }
    else { "info" }
}

fn extract_player_name(line: &str) -> Option<String> {
    // Paper format: [HH:MM:SS INFO]: PlayerName joined the game
    let part = line.rfind("]: ").map(|i| &line[i + 3..])?;
    let name = part.split_whitespace().next()?.to_string();
    if name.len() >= 2 && name.len() <= 16 && name.chars().all(|c| c.is_alphanumeric() || c == '_') {
        Some(name)
    } else {
        None
    }
}

// ── mc_stop ───────────────────────────────────────────────────────────────────

#[tauri::command]
fn mc_stop(state: State<'_, SharedMcState>) -> Result<(), String> {
    let s = state.inner().lock().unwrap();
    if let Some(tx) = &s.stdin_tx {
        tx.send("stop".into()).ok();
        Ok(())
    } else {
        Err("Server is not running".into())
    }
}

// ── mc_send_command ───────────────────────────────────────────────────────────

#[tauri::command]
fn mc_send_command(cmd: String, state: State<'_, SharedMcState>) -> Result<(), String> {
    let s = state.inner().lock().unwrap();
    if let Some(tx) = &s.stdin_tx {
        tx.send(cmd).ok();
        Ok(())
    } else {
        Err("Server is not running".into())
    }
}

// ── mc_get_local_ip ───────────────────────────────────────────────────────────

#[tauri::command]
fn mc_get_local_ip() -> String {
    use std::net::UdpSocket;
    if let Ok(sock) = UdpSocket::bind("0.0.0.0:0") {
        if sock.connect("8.8.8.8:80").is_ok() {
            if let Ok(addr) = sock.local_addr() {
                return addr.ip().to_string();
            }
        }
    }
    "127.0.0.1".to_string()
}

// ── mc_open_folder ────────────────────────────────────────────────────────────

#[tauri::command]
fn mc_open_folder(path: String) -> Result<(), String> {
    #[cfg(target_os = "windows")]
    Command::new("explorer").arg(&path).spawn().map_err(|e| e.to_string())?;
    #[cfg(target_os = "macos")]
    Command::new("open").arg(&path).spawn().map_err(|e| e.to_string())?;
    #[cfg(target_os = "linux")]
    Command::new("xdg-open").arg(&path).spawn().map_err(|e| e.to_string())?;
    Ok(())
}

// ── mc_delete ─────────────────────────────────────────────────────────────────

#[tauri::command]
fn mc_delete(state: State<'_, SharedMcState>) -> Result<(), String> {
    let dir = {
        let mut s = state.inner().lock().unwrap();
        if s.running {
            if let Some(tx) = &s.stdin_tx {
                let _ = tx.send("stop".into());
            }
        }
        s.running = false;
        s.stdin_tx = None;
        s.players.clear();
        s.dir.take()
    };

    if let Some(dir) = dir {
        if dir.exists() {
            std::thread::sleep(std::time::Duration::from_millis(1200));
            fs::remove_dir_all(&dir).map_err(|e| format!("delete: {}", e))?;
        }
    }
    Ok(())
}

// ── updater ───────────────────────────────────────────────────────────────────

#[tauri::command]
async fn download_update(url: String) -> Result<String, String> {
    let dest = std::env::temp_dir().join("skstudio_update_installer.exe");
    download_file(&url, &dest).await?;
    Ok(dest.to_string_lossy().into_owned())
}

#[tauri::command]
fn apply_update(installer_path: String) -> Result<(), String> {
    Command::new(&installer_path)
        .spawn()
        .map_err(|e| format!("Failed to launch installer: {}", e))?;
    std::process::exit(0);
}

// ── run ───────────────────────────────────────────────────────────────────────

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .manage(Arc::new(Mutex::new(McState::new())) as SharedMcState)
        .invoke_handler(tauri::generate_handler![
            read_file, write_file, read_dir,
            term_cd, term_run,
            mc_check_java, mc_install, mc_start, mc_stop,
            mc_get_status, mc_send_command, mc_get_local_ip,
            mc_open_folder, mc_delete,
            download_update, apply_update,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
