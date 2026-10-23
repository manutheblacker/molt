// Editable defaults + saved user preferences.
// Commands are defined here, then can be rebound live in OPTIONS.

export const ACTIONS = [
  { id: "left", label: "MOVE LEFT" },
  { id: "right", label: "MOVE RIGHT" },
  { id: "up", label: "JUMP" },
  { id: "down", label: "CROUCH" },
  { id: "light", label: "LIGHT ATTACK" },
  { id: "heavy", label: "HEAVY ATTACK" },
  { id: "special", label: "SPECIAL" },
];

export const DEFAULT_CONTROLS = {
  p1: {
    left: "KeyA",
    right: "KeyD",
    up: "KeyW",
    down: "KeyS",
    light: "KeyF",
    heavy: "KeyG",
    special: "KeyH",
  },
  p2: {
    left: "ArrowLeft",
    right: "ArrowRight",
    up: "ArrowUp",
    down: "ArrowDown",
    light: "Comma",
    heavy: "Period",
    special: "Slash",
  },
};

export const DEFAULT_AUDIO = {
  music: true,
  sfx: true,
  muted: false,
};

const STORAGE_KEY = "molt.settings.v1";
const RESERVED_KEYS = {
  Escape: "pause",
  KeyM: "mute",
  Backspace: "back",
};

function cloneControls() {
  return {
    p1: { ...DEFAULT_CONTROLS.p1 },
    p2: { ...DEFAULT_CONTROLS.p2 },
  };
}

export const settings = {
  controls: cloneControls(),
  audio: { ...DEFAULT_AUDIO },
};

function isCode(value) {
  return typeof value === "string" && value.length > 0 && value.length < 40;
}

export function loadSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return settings;
    const data = JSON.parse(raw);
    for (const player of ["p1", "p2"]) {
      const saved = data?.controls?.[player];
      if (!saved) continue;
      for (const action of ACTIONS) {
        if (isCode(saved[action.id])) settings.controls[player][action.id] = saved[action.id];
      }
    }
    if (typeof data?.audio?.music === "boolean") settings.audio.music = data.audio.music;
    if (typeof data?.audio?.sfx === "boolean") settings.audio.sfx = data.audio.sfx;
    if (typeof data?.audio?.muted === "boolean") settings.audio.muted = data.audio.muted;
  } catch {
    // corrupt or unavailable storage: defaults are fine
  }
  return settings;
}

export function saveSettings() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // private mode or blocked storage: the game still runs
  }
}

export function setBinding(player, action, code) {
  if (!settings.controls[player] || !ACTIONS.some((a) => a.id === action)) {
    return { ok: false, reason: "UNKNOWN ACTION" };
  }
  if (!isCode(code)) return { ok: false, reason: "UNAVAILABLE KEY" };
  if (RESERVED_KEYS[code]) {
    return { ok: false, reason: `${keyLabel(code)} IS RESERVED FOR ${RESERVED_KEYS[code].toUpperCase()}` };
  }

  const other = player === "p1" ? "p2" : "p1";
  if (Object.values(settings.controls[other]).includes(code)) {
    return { ok: false, reason: `${keyLabel(code)} BELONGS TO ${other.toUpperCase()}` };
  }

  // A key already used by another action on the same pad swaps places.
  const current = settings.controls[player][action];
  for (const a of ACTIONS) {
    if (a.id !== action && settings.controls[player][a.id] === code) {
      settings.controls[player][a.id] = current;
    }
  }
  settings.controls[player][action] = code;
  saveSettings();
  return { ok: true };
}

export function resetControls() {
  settings.controls = cloneControls();
  saveSettings();
}

export function resetAudio() {
  settings.audio = { ...DEFAULT_AUDIO };
  saveSettings();
}

export function keyLabel(code) {
  if (!code) return "—";
  const special = {
    ArrowLeft: "←",
    ArrowRight: "→",
    ArrowUp: "↑",
    ArrowDown: "↓",
    Comma: ",",
    Period: ".",
    Slash: "/",
    Space: "SPACE",
    Enter: "ENTER",
    Escape: "ESC",
    Backspace: "BKSP",
    Tab: "TAB",
    ShiftLeft: "L SHIFT",
    ShiftRight: "R SHIFT",
    ControlLeft: "L CTRL",
    ControlRight: "R CTRL",
    AltLeft: "L ALT",
    AltRight: "R ALT",
    Semicolon: ";",
    Quote: "'",
    BracketLeft: "[",
    BracketRight: "]",
    Backslash: "\\",
    Minus: "-",
    Equal: "=",
    Backquote: "`",
    CapsLock: "CAPS",
    NumpadEnter: "NUM ENTER",
    NumpadAdd: "NUM +",
    NumpadSubtract: "NUM −",
    NumpadMultiply: "NUM ×",
    NumpadDivide: "NUM /",
    NumpadDecimal: "NUM .",
  };
  if (special[code]) return special[code];
  if (code.startsWith("Key")) return code.slice(3);
  if (code.startsWith("Digit")) return code.slice(5);
  if (code.startsWith("Numpad")) return "NUM " + code.slice(6);
  return code.toUpperCase();
}
