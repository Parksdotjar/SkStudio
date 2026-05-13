// Skript Block Definitions

export const CATEGORIES = [
  { id: 'events',     label: 'Events',     color: '#e74c3c', icon: '⚡' },
  { id: 'control',    label: 'Control',    color: '#e67e22', icon: '🔀' },
  { id: 'effects',    label: 'Effects',    color: '#3498db', icon: '✨' },
  { id: 'conditions', label: 'Conditions', color: '#9b59b6', icon: '❓' },
  { id: 'variables',  label: 'Variables',  color: '#27ae60', icon: '📦' },
  { id: 'players',    label: 'Players',    color: '#16a085', icon: '👤' },
  { id: 'items',      label: 'Items',      color: '#d35400', icon: '🎒' },
  { id: 'text',       label: 'Text',       color: '#8e44ad', icon: '📝' },
  { id: 'math',       label: 'Math',       color: '#2980b9', icon: '🔢' },
  { id: 'world',      label: 'World',      color: '#1a6b4a', icon: '🌍' },
];

// Input types: text, number, variable, select, boolean-inline
// Block types:
//   hat         – event block, no top connector
//   statement   – normal action, top + bottom connector
//   statement-end – terminal (stop/exit), no bottom connector
//   c-block     – if / loop, has inner section
//   c-block-else – if/else, has inner + else section

export const BLOCKS = [
  // ─── EVENTS ───────────────────────────────────────────────────
  {
    id: 'on_join', category: 'events', type: 'hat',
    label: 'on player join',
    inputs: [],
    generate: () => 'on join:',
  },
  {
    id: 'on_quit', category: 'events', type: 'hat',
    label: 'on player leave',
    inputs: [],
    generate: () => 'on quit:',
  },
  {
    id: 'on_chat', category: 'events', type: 'hat',
    label: 'on chat message',
    inputs: [],
    generate: () => 'on chat:',
  },
  {
    id: 'on_damage', category: 'events', type: 'hat',
    label: 'on entity damage',
    inputs: [],
    generate: () => 'on damage:',
  },
  {
    id: 'on_death', category: 'events', type: 'hat',
    label: 'on player death',
    inputs: [],
    generate: () => 'on death:',
  },
  {
    id: 'on_respawn', category: 'events', type: 'hat',
    label: 'on player respawn',
    inputs: [],
    generate: () => 'on respawn:',
  },
  {
    id: 'on_right_click', category: 'events', type: 'hat',
    label: 'on right click',
    inputs: [],
    generate: () => 'on right click:',
  },
  {
    id: 'on_left_click', category: 'events', type: 'hat',
    label: 'on left click',
    inputs: [],
    generate: () => 'on left click:',
  },
  {
    id: 'on_break', category: 'events', type: 'hat',
    label: 'on block break',
    inputs: [],
    generate: () => 'on break:',
  },
  {
    id: 'on_place', category: 'events', type: 'hat',
    label: 'on block place',
    inputs: [],
    generate: () => 'on place:',
  },
  {
    id: 'on_first_join', category: 'events', type: 'hat',
    label: 'on first join',
    inputs: [],
    generate: () => 'on first join:',
  },
  {
    id: 'on_command', category: 'events', type: 'hat',
    label: 'on command',
    inputs: [{ id: 'cmd', type: 'text', label: 'command', default: 'mycommand' }],
    generate: (i) => `on command "/${i.cmd || 'mycommand'}":`,
  },
  {
    id: 'on_move', category: 'events', type: 'hat',
    label: 'on player move',
    inputs: [],
    generate: () => 'on move:',
  },
  {
    id: 'on_drop', category: 'events', type: 'hat',
    label: 'on item drop',
    inputs: [],
    generate: () => 'on drop:',
  },
  {
    id: 'on_pickup', category: 'events', type: 'hat',
    label: 'on item pickup',
    inputs: [],
    generate: () => 'on pickup:',
  },
  {
    id: 'on_craft', category: 'events', type: 'hat',
    label: 'on craft',
    inputs: [],
    generate: () => 'on craft:',
  },
  {
    id: 'on_level_change', category: 'events', type: 'hat',
    label: 'on level change',
    inputs: [],
    generate: () => 'on level change:',
  },
  {
    id: 'on_gamemode_change', category: 'events', type: 'hat',
    label: 'on gamemode change',
    inputs: [],
    generate: () => 'on gamemode change:',
  },

  // ─── CONTROL ──────────────────────────────────────────────────
  {
    id: 'if_block', category: 'control', type: 'c-block',
    label: 'if',
    inputs: [{ id: 'condition', type: 'text', label: 'condition', default: 'player is op' }],
    generate: (i) => `if ${i.condition || 'player is op'}:`,
  },
  {
    id: 'if_else', category: 'control', type: 'c-block-else',
    label: 'if / else',
    inputs: [{ id: 'condition', type: 'text', label: 'condition', default: 'player is op' }],
    generate: (i) => `if ${i.condition || 'player is op'}:`,
  },
  {
    id: 'loop_times', category: 'control', type: 'c-block',
    label: 'loop times',
    inputs: [{ id: 'times', type: 'number', label: 'times', default: '5' }],
    generate: (i) => `loop ${i.times || '5'} times:`,
  },
  {
    id: 'loop_players', category: 'control', type: 'c-block',
    label: 'loop all players',
    inputs: [],
    generate: () => 'loop all players:',
  },
  {
    id: 'loop_list', category: 'control', type: 'c-block',
    label: 'loop items in list',
    inputs: [{ id: 'list', type: 'variable', label: 'list', default: '{list::*}' }],
    generate: (i) => `loop ${i.list || '{list::*}'}:`,
  },
  {
    id: 'loop_blocks', category: 'control', type: 'c-block',
    label: 'loop blocks in region',
    inputs: [{ id: 'region', type: 'text', label: 'region', default: 'region' }],
    generate: (i) => `loop blocks in ${i.region || 'region'}:`,
  },
  {
    id: 'function_def', category: 'control', type: 'hat',
    label: 'function',
    inputs: [
      { id: 'name',   type: 'text', label: 'name',   default: 'myFunction' },
      { id: 'params', type: 'text', label: 'params', default: '' },
    ],
    generate: (i) => `function ${i.name || 'myFunction'}(${i.params || ''}):`,
  },
  {
    id: 'stop_block', category: 'control', type: 'statement-end',
    label: 'stop',
    inputs: [],
    generate: () => 'stop',
  },
  {
    id: 'cancel_event', category: 'control', type: 'statement',
    label: 'cancel event',
    inputs: [],
    generate: () => 'cancel event',
  },
  {
    id: 'exit_loop', category: 'control', type: 'statement-end',
    label: 'exit loop',
    inputs: [],
    generate: () => 'exit loop',
  },
  {
    id: 'return_val', category: 'control', type: 'statement-end',
    label: 'return',
    inputs: [{ id: 'value', type: 'text', label: 'value', default: 'true' }],
    generate: (i) => `return ${i.value || 'true'}`,
  },

  // ─── EFFECTS ──────────────────────────────────────────────────
  {
    id: 'send_message', category: 'effects', type: 'statement',
    label: 'send message to player',
    inputs: [{ id: 'msg', type: 'text', label: 'message', default: '&aHello, %player%!' }],
    generate: (i) => `send "${i.msg || 'Hello!'}" to player`,
  },
  {
    id: 'send_title', category: 'effects', type: 'statement',
    label: 'send title to player',
    inputs: [
      { id: 'title',    type: 'text', label: 'title',    default: '&6Title' },
      { id: 'subtitle', type: 'text', label: 'subtitle', default: '&7Subtitle' },
    ],
    generate: (i) => `send title "${i.title || 'Title'}" with subtitle "${i.subtitle || ''}" to player`,
  },
  {
    id: 'send_action_bar', category: 'effects', type: 'statement',
    label: 'send action bar',
    inputs: [{ id: 'msg', type: 'text', label: 'message', default: '&eAction bar!' }],
    generate: (i) => `send action bar "${i.msg || 'Action bar!'}" to player`,
  },
  {
    id: 'broadcast', category: 'effects', type: 'statement',
    label: 'broadcast message',
    inputs: [{ id: 'msg', type: 'text', label: 'message', default: '&eHello everyone!' }],
    generate: (i) => `broadcast "${i.msg || 'Hello!'}"`,
  },
  {
    id: 'teleport', category: 'effects', type: 'statement',
    label: 'teleport player to',
    inputs: [{ id: 'location', type: 'text', label: 'location', default: 'spawn' }],
    generate: (i) => `teleport player to ${i.location || 'spawn'}`,
  },
  {
    id: 'give_item', category: 'effects', type: 'statement',
    label: 'give player item',
    inputs: [
      { id: 'amount', type: 'number', label: 'amount', default: '1' },
      { id: 'item',   type: 'text',   label: 'item',   default: 'diamond' },
    ],
    generate: (i) => `give player ${i.amount || '1'} ${i.item || 'diamond'}`,
  },
  {
    id: 'take_item', category: 'effects', type: 'statement',
    label: 'take item from player',
    inputs: [
      { id: 'amount', type: 'number', label: 'amount', default: '1' },
      { id: 'item',   type: 'text',   label: 'item',   default: 'diamond' },
    ],
    generate: (i) => `take ${i.amount || '1'} ${i.item || 'diamond'} from player`,
  },
  {
    id: 'kill_player', category: 'effects', type: 'statement',
    label: 'kill player',
    inputs: [],
    generate: () => 'kill player',
  },
  {
    id: 'set_health', category: 'effects', type: 'statement',
    label: 'set player health',
    inputs: [{ id: 'health', type: 'number', label: 'health', default: '20' }],
    generate: (i) => `set player's health to ${i.health || '20'}`,
  },
  {
    id: 'set_food', category: 'effects', type: 'statement',
    label: 'set player food level',
    inputs: [{ id: 'food', type: 'number', label: 'food', default: '20' }],
    generate: (i) => `set player's food level to ${i.food || '20'}`,
  },
  {
    id: 'set_gamemode', category: 'effects', type: 'statement',
    label: 'set gamemode',
    inputs: [{
      id: 'gm', type: 'select', label: 'gamemode', default: 'survival',
      options: ['survival', 'creative', 'adventure', 'spectator'],
    }],
    generate: (i) => `set player's gamemode to ${i.gm || 'survival'}`,
  },
  {
    id: 'play_sound', category: 'effects', type: 'statement',
    label: 'play sound to player',
    inputs: [{
      id: 'sound', type: 'select', label: 'sound', default: 'level up',
      options: ['level up', 'entity.player.levelup', 'block.note_block.pling',
        'entity.experience_orb.pickup', 'block.chest.open', 'block.chest.close',
        'entity.villager.yes', 'entity.villager.no', 'ui.button.click',
        'entity.arrow.hit_player', 'entity.player.hurt'],
    }],
    generate: (i) => `play sound "${i.sound || 'level up'}" to player`,
  },
  {
    id: 'spawn_particle', category: 'effects', type: 'statement',
    label: 'spawn particle at player',
    inputs: [
      {
        id: 'particle', type: 'select', label: 'particle', default: 'flame',
        options: ['flame', 'smoke', 'heart', 'crit', 'magic crit', 'note', 'portal',
          'explosion', 'firework spark', 'water splash', 'snowball', 'slime',
          'villager happy', 'villager angry', 'witch magic', 'lava', 'cloud'],
      },
      { id: 'amount', type: 'number', label: 'count', default: '10' },
    ],
    generate: (i) => `spawn ${i.amount || '10'} "${i.particle || 'flame'}" particles at player`,
  },
  {
    id: 'apply_potion', category: 'effects', type: 'statement',
    label: 'apply potion effect',
    inputs: [
      {
        id: 'effect', type: 'select', label: 'effect', default: 'speed',
        options: ['speed', 'slowness', 'haste', 'mining fatigue', 'strength',
          'instant health', 'instant damage', 'jump boost', 'nausea', 'regeneration',
          'resistance', 'fire resistance', 'water breathing', 'invisibility',
          'blindness', 'night vision', 'hunger', 'weakness', 'poison', 'wither',
          'health boost', 'absorption', 'saturation', 'glowing', 'levitation'],
      },
      { id: 'duration',  type: 'number', label: 'seconds', default: '30' },
      { id: 'amplifier', type: 'number', label: 'level',   default: '1' },
    ],
    generate: (i) => `apply ${i.effect || 'speed'} ${i.amplifier || '1'} to player for ${i.duration || '30'} seconds`,
  },
  {
    id: 'execute_cmd', category: 'effects', type: 'statement',
    label: 'execute console command',
    inputs: [{ id: 'cmd', type: 'text', label: 'command', default: 'say Hello' }],
    generate: (i) => `execute console command "/${i.cmd || 'say Hello'}"`,
  },
  {
    id: 'wait', category: 'effects', type: 'statement',
    label: 'wait',
    inputs: [
      { id: 'time', type: 'number', label: 'amount', default: '20' },
      {
        id: 'unit', type: 'select', label: 'unit', default: 'ticks',
        options: ['ticks', 'seconds', 'minutes'],
      },
    ],
    generate: (i) => `wait ${i.time || '20'} ${i.unit || 'ticks'}`,
  },
  {
    id: 'log_console', category: 'effects', type: 'statement',
    label: 'log to console',
    inputs: [{ id: 'msg', type: 'text', label: 'message', default: 'Debug message' }],
    generate: (i) => `log "${i.msg || 'Debug'}"`,
  },
  {
    id: 'kick_player', category: 'effects', type: 'statement',
    label: 'kick player',
    inputs: [{ id: 'reason', type: 'text', label: 'reason', default: 'You were kicked.' }],
    generate: (i) => `kick player due to "${i.reason || 'You were kicked.'}"`,
  },
  {
    id: 'set_xp_level', category: 'effects', type: 'statement',
    label: 'set player XP level',
    inputs: [{ id: 'level', type: 'number', label: 'level', default: '10' }],
    generate: (i) => `set player's level to ${i.level || '10'}`,
  },
  {
    id: 'heal_player', category: 'effects', type: 'statement',
    label: 'heal player',
    inputs: [],
    generate: () => `heal player`,
  },
  {
    id: 'feed_player', category: 'effects', type: 'statement',
    label: 'feed player',
    inputs: [],
    generate: () => `feed player`,
  },

  // ─── CONDITIONS ───────────────────────────────────────────────
  {
    id: 'has_permission', category: 'conditions', type: 'c-block',
    label: 'if player has permission',
    inputs: [{ id: 'perm', type: 'text', label: 'permission', default: 'example.use' }],
    generate: (i) => `if player has permission "${i.perm || 'example.use'}":`,
  },
  {
    id: 'is_op', category: 'conditions', type: 'c-block',
    label: 'if player is op',
    inputs: [],
    generate: () => 'if player is op:',
  },
  {
    id: 'is_not_op', category: 'conditions', type: 'c-block',
    label: 'if player is not op',
    inputs: [],
    generate: () => 'if player is not op:',
  },
  {
    id: 'is_online', category: 'conditions', type: 'c-block',
    label: 'if player is online',
    inputs: [{ id: 'name', type: 'text', label: 'player name', default: '%player%' }],
    generate: (i) => `if ${i.name || '%player%'} is online:`,
  },
  {
    id: 'is_holding', category: 'conditions', type: 'c-block',
    label: 'if player is holding',
    inputs: [{ id: 'item', type: 'text', label: 'item', default: 'diamond sword' }],
    generate: (i) => `if player is holding ${i.item || 'diamond sword'}:`,
  },
  {
    id: 'has_item', category: 'conditions', type: 'c-block',
    label: 'if player has item',
    inputs: [
      { id: 'amount', type: 'number', label: 'amount', default: '1' },
      { id: 'item',   type: 'text',   label: 'item',   default: 'diamond' },
    ],
    generate: (i) => `if player's inventory contains ${i.amount || '1'} ${i.item || 'diamond'}:`,
  },
  {
    id: 'var_is_set', category: 'conditions', type: 'c-block',
    label: 'if variable is set',
    inputs: [{ id: 'var', type: 'variable', label: 'variable', default: '{var}' }],
    generate: (i) => `if ${i.var || '{var}'} is set:`,
  },
  {
    id: 'compare_num', category: 'conditions', type: 'c-block',
    label: 'if number comparison',
    inputs: [
      { id: 'a',  type: 'text',   label: 'value A',  default: '1' },
      { id: 'op', type: 'select', label: 'op',        default: '=',
        options: ['=', '!=', '>', '>=', '<', '<='] },
      { id: 'b',  type: 'text',   label: 'value B',  default: '1' },
    ],
    generate: (i) => {
      const opMap = { '=': 'is', '!=': 'is not', '>': '>', '>=': '>=', '<': '<', '<=': '<=' };
      return `if ${i.a || '1'} ${opMap[i.op] || 'is'} ${i.b || '1'}:`;
    },
  },
  {
    id: 'compare_text', category: 'conditions', type: 'c-block',
    label: 'if text equals',
    inputs: [
      { id: 'a', type: 'text', label: 'text A', default: 'hello' },
      { id: 'b', type: 'text', label: 'text B', default: 'hello' },
    ],
    generate: (i) => `if "${i.a || 'hello'}" is "${i.b || 'hello'}":`,
  },
  {
    id: 'is_sneaking', category: 'conditions', type: 'c-block',
    label: 'if player is sneaking',
    inputs: [],
    generate: () => 'if player is sneaking:',
  },
  {
    id: 'is_flying', category: 'conditions', type: 'c-block',
    label: 'if player is flying',
    inputs: [],
    generate: () => 'if player is flying:',
  },
  {
    id: 'in_world', category: 'conditions', type: 'c-block',
    label: 'if player is in world',
    inputs: [{ id: 'world', type: 'text', label: 'world', default: 'world' }],
    generate: (i) => `if player's world is "${i.world || 'world'}":`,
  },

  // ─── VARIABLES ────────────────────────────────────────────────
  {
    id: 'set_var', category: 'variables', type: 'statement',
    label: 'set variable',
    inputs: [
      { id: 'var',   type: 'variable', label: 'variable', default: '{var}' },
      { id: 'value', type: 'text',     label: 'value',    default: '"hello"' },
    ],
    generate: (i) => `set ${i.var || '{var}'} to ${i.value || '"hello"'}`,
  },
  {
    id: 'add_to_var', category: 'variables', type: 'statement',
    label: 'add to variable',
    inputs: [
      { id: 'amount', type: 'text',     label: 'amount',   default: '1' },
      { id: 'var',    type: 'variable', label: 'variable', default: '{var}' },
    ],
    generate: (i) => `add ${i.amount || '1'} to ${i.var || '{var}'}`,
  },
  {
    id: 'remove_from_var', category: 'variables', type: 'statement',
    label: 'remove from variable',
    inputs: [
      { id: 'amount', type: 'text',     label: 'amount',   default: '1' },
      { id: 'var',    type: 'variable', label: 'variable', default: '{var}' },
    ],
    generate: (i) => `remove ${i.amount || '1'} from ${i.var || '{var}'}`,
  },
  {
    id: 'delete_var', category: 'variables', type: 'statement',
    label: 'delete variable',
    inputs: [{ id: 'var', type: 'variable', label: 'variable', default: '{var}' }],
    generate: (i) => `delete ${i.var || '{var}'}`,
  },
  {
    id: 'add_to_list', category: 'variables', type: 'statement',
    label: 'add to list',
    inputs: [
      { id: 'value', type: 'text',     label: 'value',    default: '"item"' },
      { id: 'var',   type: 'variable', label: 'list var', default: '{list::*}' },
    ],
    generate: (i) => `add ${i.value || '"item"'} to ${i.var || '{list::*}'}`,
  },
  {
    id: 'clear_list', category: 'variables', type: 'statement',
    label: 'clear list',
    inputs: [{ id: 'var', type: 'variable', label: 'list var', default: '{list::*}' }],
    generate: (i) => `clear ${i.var || '{list::*}'}`,
  },

  // ─── PLAYERS ──────────────────────────────────────────────────
  {
    id: 'set_display_name', category: 'players', type: 'statement',
    label: 'set player display name',
    inputs: [{ id: 'name', type: 'text', label: 'name', default: '&a%player%' }],
    generate: (i) => `set player's display name to "${i.name || '%player%'}"`,
  },
  {
    id: 'set_tab_name', category: 'players', type: 'statement',
    label: 'set player tab name',
    inputs: [{ id: 'name', type: 'text', label: 'name', default: '&a%player%' }],
    generate: (i) => `set tab list name of player to "${i.name || '%player%'}"`,
  },
  {
    id: 'fly_player', category: 'players', type: 'statement',
    label: 'allow player to fly',
    inputs: [],
    generate: () => `allow player to fly`,
  },
  {
    id: 'no_fly', category: 'players', type: 'statement',
    label: 'prevent player from flying',
    inputs: [],
    generate: () => `prevent player from flying`,
  },
  {
    id: 'clear_inventory', category: 'players', type: 'statement',
    label: 'clear player inventory',
    inputs: [],
    generate: () => `clear player's inventory`,
  },
  {
    id: 'set_inventory_slot', category: 'players', type: 'statement',
    label: 'set inventory slot',
    inputs: [
      { id: 'slot', type: 'number', label: 'slot', default: '0' },
      { id: 'item', type: 'text',   label: 'item', default: 'diamond' },
    ],
    generate: (i) => `set slot ${i.slot || '0'} of player's inventory to ${i.item || 'diamond'}`,
  },

  // ─── ITEMS ────────────────────────────────────────────────────
  {
    id: 'drop_item', category: 'items', type: 'statement',
    label: 'drop item at player',
    inputs: [
      { id: 'amount', type: 'number', label: 'amount', default: '1' },
      { id: 'item',   type: 'text',   label: 'item',   default: 'diamond' },
    ],
    generate: (i) => `drop ${i.amount || '1'} ${i.item || 'diamond'} at player's location`,
  },
  {
    id: 'enchant_item', category: 'items', type: 'statement',
    label: 'enchant held item',
    inputs: [
      {
        id: 'enchant', type: 'select', label: 'enchantment', default: 'sharpness',
        options: ['sharpness', 'smite', 'bane of arthropods', 'knockback', 'fire aspect',
          'looting', 'sweeping edge', 'efficiency', 'silk touch', 'unbreaking',
          'fortune', 'power', 'punch', 'flame', 'infinity', 'protection',
          'fire protection', 'blast protection', 'projectile protection', 'thorns',
          'feather falling', 'respiration', 'depth strider', 'frost walker',
          'aqua affinity', 'mending', 'curse of binding', 'curse of vanishing'],
      },
      { id: 'level', type: 'number', label: 'level', default: '1' },
    ],
    generate: (i) => `enchant player's tool with ${i.enchant || 'sharpness'} ${i.level || '1'}`,
  },

  // ─── TEXT ─────────────────────────────────────────────────────
  {
    id: 'set_var_text', category: 'text', type: 'statement',
    label: 'set variable to text',
    inputs: [
      { id: 'var',  type: 'variable', label: 'variable', default: '{text}' },
      { id: 'text', type: 'text',     label: 'text',     default: 'Hello %player%!' },
    ],
    generate: (i) => `set ${i.var || '{text}'} to "${i.text || 'Hello!'}"`,
  },
  {
    id: 'replace_text', category: 'text', type: 'statement',
    label: 'replace in variable',
    inputs: [
      { id: 'find',    type: 'text',     label: 'find',     default: 'foo' },
      { id: 'replace', type: 'text',     label: 'replace',  default: 'bar' },
      { id: 'in',      type: 'variable', label: 'in var',   default: '{text}' },
    ],
    generate: (i) => `replace all "${i.find || 'foo'}" in ${i.in || '{text}'} with "${i.replace || 'bar'}"`,
  },
  {
    id: 'set_var_format', category: 'text', type: 'statement',
    label: 'set variable to colored text',
    inputs: [
      { id: 'var', type: 'variable', label: 'variable', default: '{msg}' },
      {
        id: 'color', type: 'select', label: 'color code', default: '&a',
        options: ['&0','&1','&2','&3','&4','&5','&6','&7','&8','&9',
                  '&a','&b','&c','&d','&e','&f','&l','&o','&n','&m','&r'],
      },
      { id: 'text', type: 'text', label: 'text', default: 'Hello!' },
    ],
    generate: (i) => `set ${i.var || '{msg}'} to "${i.color || '&a'}${i.text || 'Hello!'}"`,
  },

  // ─── MATH ─────────────────────────────────────────────────────
  {
    id: 'math_set', category: 'math', type: 'statement',
    label: 'set variable to math',
    inputs: [
      { id: 'var', type: 'variable', label: 'variable', default: '{result}' },
      { id: 'a',   type: 'text',     label: 'value A',  default: '10' },
      {
        id: 'op', type: 'select', label: 'operator', default: '+',
        options: ['+', '-', '*', '/'],
      },
      { id: 'b', type: 'text', label: 'value B', default: '5' },
    ],
    generate: (i) => `set ${i.var || '{result}'} to (${i.a || '0'} ${i.op || '+'} ${i.b || '0'})`,
  },
  {
    id: 'math_random', category: 'math', type: 'statement',
    label: 'set variable to random number',
    inputs: [
      { id: 'var', type: 'variable', label: 'variable', default: '{rand}' },
      { id: 'min', type: 'number',   label: 'min',      default: '1' },
      { id: 'max', type: 'number',   label: 'max',      default: '100' },
    ],
    generate: (i) => `set ${i.var || '{rand}'} to random integer between ${i.min || '1'} and ${i.max || '100'}`,
  },
  {
    id: 'math_floor', category: 'math', type: 'statement',
    label: 'floor variable',
    inputs: [{ id: 'var', type: 'variable', label: 'variable', default: '{num}' }],
    generate: (i) => `set ${i.var || '{num}'} to floor(${i.var || '{num}'})`,
  },
  {
    id: 'math_ceil', category: 'math', type: 'statement',
    label: 'ceil variable',
    inputs: [{ id: 'var', type: 'variable', label: 'variable', default: '{num}' }],
    generate: (i) => `set ${i.var || '{num}'} to ceil(${i.var || '{num}'})`,
  },

  // ─── WORLD ────────────────────────────────────────────────────
  {
    id: 'set_block', category: 'world', type: 'statement',
    label: 'set block at location',
    inputs: [
      { id: 'location', type: 'text', label: 'location', default: "player's location" },
      { id: 'block',    type: 'text', label: 'block',    default: 'stone' },
    ],
    generate: (i) => `set block at ${i.location || "player's location"} to ${i.block || 'stone'}`,
  },
  {
    id: 'strike_lightning', category: 'world', type: 'statement',
    label: 'strike lightning at location',
    inputs: [{ id: 'location', type: 'text', label: 'location', default: "player's location" }],
    generate: (i) => `strike lightning at ${i.location || "player's location"}`,
  },
  {
    id: 'create_explosion', category: 'world', type: 'statement',
    label: 'create explosion',
    inputs: [
      { id: 'location', type: 'text',   label: 'location', default: "player's location" },
      { id: 'power',    type: 'number', label: 'power',    default: '4' },
    ],
    generate: (i) => `create a ${i.power || '4'} power explosion at ${i.location || "player's location"}`,
  },
  {
    id: 'spawn_mob', category: 'world', type: 'statement',
    label: 'spawn mob at location',
    inputs: [
      {
        id: 'mob', type: 'select', label: 'mob', default: 'zombie',
        options: ['zombie', 'skeleton', 'creeper', 'spider', 'enderman', 'blaze',
          'witch', 'villager', 'pig', 'cow', 'sheep', 'chicken', 'wolf',
          'cat', 'horse', 'iron golem', 'snow golem', 'wither', 'ender dragon'],
      },
      { id: 'location', type: 'text', label: 'location', default: "player's location" },
    ],
    generate: (i) => `spawn ${i.mob || 'zombie'} at ${i.location || "player's location"}`,
  },
];
