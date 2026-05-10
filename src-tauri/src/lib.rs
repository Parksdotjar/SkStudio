use std::fs;
use std::path::{Path, PathBuf};
use std::process::Command;

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

// === Terminal commands ===

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

    // Use the platform shell so users can type natural commands
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

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![
            read_file,
            write_file,
            read_dir,
            term_cd,
            term_run
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
