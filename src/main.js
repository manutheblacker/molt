import { ROSTER, getSpecimen } from "./roster.js";
import { Fighter, GROUND_Y } from "./fighter.js";
import { drawFighter, drawSpecimen } from "./draw.js";
import { drawStage } from "./stage.js";
import { Effects } from "./effects.js";
import { Input } from "./input.js";
import { Sound } from "./audio.js";
import { createAI, updateAI } from "./ai.js";
import {
  ACTIONS,
  settings,
  loadSettings,
  setBinding,
  resetControls,
  resetAudio,
  keyLabel,
} from "./config.js";

const W = 1280;
const H = 720;
const CREAM = "#F2E8D5";
const INK = "#0C0B10";
const PAPER = "#E9DCC1";
const P1_COLOR = "#F2C14E";
const P2_COLOR = "#7FD1C1";
const ACCENT = "#E4572E";
const DISPLAY = "Anton, sans-serif";
const MONO = "'Space Mono', monospace";

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const DPR = Math.min(2, window.devicePixelRatio || 1);
canvas.width = W * DPR;
canvas.height = H * DPR;

loadSettings();

const input = new Input();
input.attach();
const sound = new Sound();
const fx = new Effects();
input.onFirstGesture = () => sound.init();

const EMPTY = {
  x: 0,
  down: false,
  pressedUp: false,
  pressedLight: false,
  pressedHeavy: false,
  pressedSpecial: false,
};

const CARD_W = 204;
const CARD_H = 372;
const CARD_GAP = 16;
const CARDS_X = (W - (CARD_W * 5 + CARD_GAP * 4)) / 2;
const CARD_Y = 148;

const G = {
  mode: "title",
  time: 0,
  screenT: 0,
  fade: 1,
  titleIndex: 0,
  mode2p: false,
  select: null,
  match: null,
  result: null,
  options: null,
  paused: false,
  frozen: false,
};

document.addEventListener("visibilitychange", () => {
  if (document.hidden && G.mode === "fight" && !G.paused) togglePause();
});

/* --------------------------------- text ---------------------------------- */

function text(str, x, y, size, color, opts = {}) {
  const {
    display = false,
    align = "left",
    tracking = 0,
    alpha = 1,
    outline = null,
    outlineWidth = 4,
    shadow = null,
    shadowX = 6,
    shadowY = 6,
    weight = 400,
    baseline = "alphabetic",
  } = opts;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.font = display ? `${size}px ${DISPLAY}` : `${weight} ${size}px ${MONO}`;
  ctx.textBaseline = baseline;
  ctx.textAlign = "left";

  const chars = [...str];
  let total = 0;
  for (const ch of chars) total += ctx.measureText(ch).width;
  total += tracking * Math.max(0, chars.length - 1);
  let cursor = x;
  if (align === "center") cursor = x - total / 2;
  else if (align === "right") cursor = x - total;

  const paint = (fill, offsetX = 0, offsetY = 0) => {
    let cx = cursor + offsetX;
    ctx.fillStyle = fill;
    for (const ch of chars) {
      ctx.fillText(ch, cx, y + offsetY);
      cx += ctx.measureText(ch).width + tracking;
    }
  };

  if (shadow) paint(shadow, shadowX, shadowY);
  if (outline) {
    ctx.lineJoin = "round";
    ctx.strokeStyle = outline;
    ctx.lineWidth = outlineWidth;
    ctx.lineCap = "round";
    let cx = cursor;
    for (const ch of chars) {
      ctx.strokeText(ch, cx, y);
      cx += ctx.measureText(ch).width + tracking;
    }
  }
  paint(color);
  ctx.restore();
  return total;
}

function wrapText(str, maxWidth, size, weight = 400, display = false) {
  ctx.save();
  ctx.font = display ? `${size}px ${DISPLAY}` : `${weight} ${size}px ${MONO}`;
  const words = str.split(" ");
  const lines = [];
  let line = "";
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  ctx.restore();
  return lines;
}

/* -------------------------------- shapes --------------------------------- */

function panel(x, y, w, h, { fill = "rgba(12,11,16,0.72)", stroke = "rgba(242,232,213,0.16)", line = 1.5 } = {}) {
  ctx.save();
  ctx.fillStyle = fill;
  ctx.fillRect(x, y, w, h);
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = line;
    ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  }
  ctx.restore();
}

function rule(x1, y, x2, color = CREAM, alpha = 0.25) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x1, y);
  ctx.lineTo(x2, y);
  ctx.stroke();
  ctx.restore();
}

function barPath(x, y, w, h, mirror = false) {
  ctx.beginPath();
  if (!mirror) {
    ctx.moveTo(x, y);
    ctx.lineTo(x + w - 14, y);
    ctx.lineTo(x + w, y + h);
    ctx.lineTo(x, y + h);
  } else {
    ctx.moveTo(x + 14, y);
    ctx.lineTo(x + w, y);
    ctx.lineTo(x + w, y + h);
    ctx.lineTo(x, y + h);
  }
  ctx.closePath();
}

function healthBar(f, x, y, w, h, mirror, accent) {
  const ratio = Math.max(0, f.hp / f.def.hp);
  const ghost = Math.max(ratio, f.hpShown / f.def.hp);
  const critical = ratio < 0.25;

  ctx.save();
  barPath(x, y, w, h, mirror);
  ctx.fillStyle = "rgba(6,5,9,0.8)";
  ctx.fill();
  ctx.clip();

  const ghostW = w * ghost;
  ctx.fillStyle = "rgba(242,232,213,0.24)";
  if (!mirror) ctx.fillRect(x, y, ghostW, h);
  else ctx.fillRect(x + w - ghostW, y, ghostW, h);

  const fillW = w * ratio;
  let color = accent;
  if (critical) {
    const pulse = 0.55 + Math.sin(G.time * 16) * 0.45;
    color = pulse > 0.45 ? "#FF6B4A" : accent;
  }
  ctx.fillStyle = color;
  if (!mirror) ctx.fillRect(x, y, fillW, h);
  else ctx.fillRect(x + w - fillW, y, fillW, h);

  // top gloss
  ctx.globalAlpha = 0.32;
  ctx.fillStyle = CREAM;
  if (!mirror) ctx.fillRect(x, y + 2, fillW, 3);
  else ctx.fillRect(x + w - fillW, y + 2, fillW, 3);

  // segments
  ctx.globalAlpha = 0.22;
  ctx.fillStyle = INK;
  for (let i = 1; i < 10; i++) {
    ctx.fillRect(x + (w / 10) * i, y, 1.5, h);
  }
  ctx.restore();

  barPath(x, y, w, h, mirror);
  ctx.save();
  ctx.strokeStyle = "rgba(242,232,213,0.5)";
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.restore();
}

function meterBar(f, x, y, w, h, mirror, accent) {
  const ratio = f.meter / 100;
  const ready = f.meter >= 50;
  ctx.save();
  ctx.fillStyle = "rgba(6,5,9,0.8)";
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = "rgba(242,232,213,0.28)";
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);

  const fillW = w * ratio;
  const fx0 = mirror ? x + w - fillW : x;
  const grad = ctx.createLinearGradient(x, y, x + w, y);
  grad.addColorStop(0, accent);
  grad.addColorStop(1, ready ? CREAM : accent);
  ctx.fillStyle = grad;
  ctx.fillRect(fx0, y + 1, fillW, h - 2);

  ctx.globalAlpha = 0.35;
  ctx.fillStyle = INK;
  for (let i = 1; i < 10; i++) ctx.fillRect(x + (w / 10) * i, y, 1, h);
  ctx.globalAlpha = 1;
  // 50% spend mark
  ctx.fillStyle = CREAM;
  ctx.globalAlpha = 0.5;
  ctx.fillRect(x + w * 0.5 - 1, y - 3, 2, h + 6);
  ctx.globalAlpha = 1;

  if (ready) {
    const pulse = 0.6 + Math.sin(G.time * 7) * 0.4;
    text("SP READY", mirror ? x + w : x, y - 10, 9, accent, {
      display: false,
      align: mirror ? "right" : "left",
      tracking: 2,
      alpha: pulse,
    });
  }
  ctx.restore();
}

/* -------------------------------- audio ---------------------------------- */

function ensureSound() {
  sound.init();
  if (sound.ctx?.state === "suspended") sound.resume();
}

function ui(name) {
  sound.sfx(name);
}

/* -------------------------------- states --------------------------------- */

function goTitle() {
  input.cancelCapture();
  G.mode = "title";
  G.screenT = 0;
  G.fade = 1;
  G.titleIndex = 0;
  G.match = null;
  G.result = null;
  G.options = null;
  G.paused = false;
  sound.stopMusic();
  fx.reset();
}

function goOptions() {
  input.cancelCapture();
  G.mode = "options";
  G.screenT = 0;
  G.fade = 1;
  G.options = {
    tab: 0,
    index: 0,
    waiting: null,
    message: "",
    messageT: 0,
    messageKind: "ok",
  };
  G.match = null;
  G.result = null;
  sound.stopMusic();
  fx.reset();
  ui("confirm");
}

function goSelect(twoPlayer) {
  input.cancelCapture();
  ensureSound();
  G.mode2p = !!twoPlayer;
  G.mode = "select";
  G.screenT = 0;
  G.fade = 1;
  G.select = {
    p1: 0,
    p2: 4,
    p1Locked: false,
    p2Locked: false,
    cpuState: "idle",
    cpuT: 0,
    spinT: 0,
    countdown: 0,
    ready: false,
  };
  G.match = null;
  G.result = null;
  G.options = null;
  sound.stopMusic();
  fx.reset();
  ui("confirm");
}

function beginRound(n) {
  const m = G.match;
  m.round = n;
  m.timer = 60;
  m.phase = "intro";
  m.phaseT = 0;
  m.winner = null;
  m.method = null;
  m.celebrated = false;
  m.fightFlash = 0;
  m.hitstop = 0;
  m.timeScale = 1;
  m.p1.reset(404, 1, true);
  m.p2.reset(876, -1, true);
  m.p1.invuln = 0.2;
  m.p2.invuln = 0.2;
  fx.reset();
  ui("round");
}

function startFight(p1Index, p2Index, twoPlayer) {
  ensureSound();
  const p1 = new Fighter(ROSTER[p1Index], 0, 404, 1);
  const p2 = new Fighter(ROSTER[p2Index], 1, 876, -1);
  if (!twoPlayer) p2.ai = createAI();
  G.match = {
    p1,
    p2,
    twoPlayer: !!twoPlayer,
    rounds: [0, 0],
    round: 1,
    timer: 60,
    phase: "intro",
    phaseT: 0,
    winner: null,
    method: null,
    fought: false,
    hitstop: 0,
    timeScale: 1,
    fightFlash: 0,
    celebrated: false,
    stats: {
      damage: [0, 0],
      maxCombo: [0, 0],
      specials: [0, 0],
    },
    stall: 0,
  };
  G.mode = "fight";
  G.screenT = 0;
  G.fade = 1;
  G.paused = false;
  G.result = null;
  G.options = null;
  beginRound(1);
  sound.startMusic();
}

function showResult() {
  const m = G.match;
  const winnerIndex = m.rounds[0] > m.rounds[1] ? 0 : 1;
  G.result = {
    winner: winnerIndex === 0 ? m.p1.def : m.p2.def,
    loser: winnerIndex === 0 ? m.p2.def : m.p1.def,
    winnerIndex,
    score: [...m.rounds],
    stats: m.stats,
    twoPlayer: m.twoPlayer,
    index: 0,
    p1Index: ROSTER.indexOf(m.p1.def),
    p2Index: ROSTER.indexOf(m.p2.def),
  };
  G.mode = "result";
  G.screenT = 0;
  G.fade = 1;
  sound.stopMusic();
  sound.sfx("win");
}

function rematch() {
  if (!G.result) return;
  startFight(G.result.p1Index, G.result.p2Index, G.result.twoPlayer);
  ui("confirm");
}

function goSelectFromResult() {
  if (!G.result) return;
  goSelect(G.result.twoPlayer);
}

function togglePause() {
  if (G.mode !== "fight" || !G.match) return;
  G.paused = !G.paused;
  if (G.paused) {
    sound.stopMusic();
    ui("ui");
  } else {
    sound.startMusic();
    ui("ui");
  }
}

/* -------------------------------- fight api ------------------------------ */

const api = {
  onJump(f) {
    sound.sfx("jump");
    fx.dust(f.x, GROUND_Y, 0, 4, 0.9);
  },
  onLand(f) {
    sound.sfx("land");
    fx.dust(f.x, GROUND_Y, 0, f.vy > 500 ? 8 : 5, 1);
  },
  onWhoosh(f, move) {
    if (move.cost) return;
    sound.sfx("whiff");
  },
  onSpecial(f, move) {
    sound.sfx("special");
    if (G.match) G.match.stats.specials[f.index] += 1;
    fx.flashScreen(0.08);
  },
  onDenied(f) {
    if (!f._deniedAt || G.time - f._deniedAt > 0.25) {
      f._deniedAt = G.time;
      sound.sfx("deny");
    }
  },
  onHit(attacker, defender, move, blocked, result) {
    const m = G.match;
    if (!m) return;
    const hb = attacker.hitbox(move);
    const cx = hb ? hb.x + hb.w * 0.55 : defender.x;
    const cy = defender.y - (defender.crouching ? 48 : 84);
    const accent = attacker.def.colors.accent;

    if (blocked) {
      sound.sfx("block");
      fx.spark(defender.x, cy, "#9CE6D5", attacker.facing, 0.55, true);
      fx.text(defender.x, cy - 66, "BLOCK", P2_COLOR, 19);
      m.hitstop = Math.max(m.hitstop, 0.035);
      fx.shake(2.2);
      return;
    }

    const power = Math.min(2.2, 0.6 + result.damage / 15);
    sound.sfx(result.damage > 10 || move.kind === "special" ? "heavy" : "light", power);
    fx.spark(cx, cy, accent, attacker.facing, power, false);
    fx.shake(3 + result.damage * 0.5);
    fx.flashScreen(result.ko ? 0.4 : 0.06);
    m.hitstop = Math.max(m.hitstop, (move.hitstop || 0.05) + (result.ko ? 0.12 : 0));

    if (result.counter) fx.text(defender.x, cy - 70, "COUNTER", CREAM, 22);
    else if (result.armor) fx.text(defender.x, cy - 70, "ARMOR", attacker.def.colors.shell, 18);

    m.stats.damage[attacker.index] += result.damage;
    m.stats.maxCombo[attacker.index] = Math.max(m.stats.maxCombo[attacker.index], attacker.combo);

    if (result.ko) {
      fx.shake(20);
      fx.text(defender.x, cy - 90, "K.O.", CREAM, 48);
      m.hitstop = Math.max(m.hitstop, 0.2);
    }
  },
};

/* -------------------------------- update --------------------------------- */

function update(dt) {
  if (input.just("KeyM")) {
    ensureSound();
    sound.toggleMute();
  }

  switch (G.mode) {
    case "title":
      updateTitle(dt);
      break;
    case "select":
      updateSelect(dt);
      break;
    case "options":
      updateOptions(dt);
      break;
    case "fight":
      updateFight(dt);
      break;
    case "result":
      updateResult(dt);
      break;
    default:
      break;
  }
  fx.update(dt);
  sound.update();
}

function updateTitle(dt) {
  G.screenT += dt;
  if (input.menuUp()) {
    G.titleIndex = (G.titleIndex + 2) % 3;
    ui("ui");
  }
  if (input.menuDown()) {
    G.titleIndex = (G.titleIndex + 1) % 3;
    ui("ui");
  }
  if (input.confirm() || input.actionJust("p1", "light")) {
    ensureSound();
    if (G.titleIndex === 0) goSelect(false);
    else if (G.titleIndex === 1) goSelect(true);
    else goOptions();
  }
}

function updateSelect(dt) {
  G.screenT += dt;
  const s = G.select;
  if (!s) return;

  if (input.back()) {
    goTitle();
    return;
  }

  if (s.countdown > 0) {
    s.countdown -= dt;
    if (s.countdown <= 0) {
      startFight(s.p1, s.p2, G.mode2p);
    }
    return;
  }

  const p1Nav = {
    left: input.actionJust("p1", "left") || (!G.mode2p && input.just("ArrowLeft")),
    right: input.actionJust("p1", "right") || (!G.mode2p && input.just("ArrowRight")),
  };

  if (!s.p1Locked && p1Nav.left) {
    s.p1 = (s.p1 + ROSTER.length - 1) % ROSTER.length;
    ui("ui");
  }
  if (!s.p1Locked && p1Nav.right) {
    s.p1 = (s.p1 + 1) % ROSTER.length;
    ui("ui");
  }
  if (!s.p1Locked && (input.actionJust("p1", "light") || input.just("Enter") || input.just("Space"))) {
    s.p1Locked = true;
    ui("confirm");
    if (!G.mode2p) {
      s.cpuState = "spin";
      s.spinT = 0;
    }
  }

  if (G.mode2p) {
    if (!s.p2Locked && input.actionJust("p2", "left")) {
      s.p2 = (s.p2 + ROSTER.length - 1) % ROSTER.length;
      ui("ui");
    }
    if (!s.p2Locked && input.actionJust("p2", "right")) {
      s.p2 = (s.p2 + 1) % ROSTER.length;
      ui("ui");
    }
    if (!s.p2Locked && input.actionJust("p2", "light")) {
      s.p2Locked = true;
      ui("confirm");
    }
  } else if (s.cpuState === "spin") {
    s.spinT += dt;
    s.cpuT += dt;
    if (s.cpuT > 0.07) {
      s.cpuT = 0;
      s.p2 = Math.floor(Math.random() * ROSTER.length);
    }
    if (s.spinT > 0.9) {
      s.p2 = Math.floor(Math.random() * ROSTER.length);
      s.p2Locked = true;
      s.cpuState = "done";
      ui("confirm");
    }
  }

  if (s.p1Locked && s.p2Locked && s.countdown <= 0) {
    s.countdown = 1.15;
    ui("fight");
  }
}

function optionRowCount(tab) {
  return tab < 2 ? ACTIONS.length + 1 : 4;
}

function optionsMessage(message, kind = "ok") {
  const o = G.options;
  if (!o) return;
  o.message = message;
  o.messageKind = kind;
  o.messageT = 3.5;
}

function activateOptionsRow() {
  const o = G.options;
  if (!o || o.waiting) return;
  ensureSound();

  if (o.tab < 2) {
    const player = o.tab === 0 ? "p1" : "p2";
    if (o.index < ACTIONS.length) {
      const action = ACTIONS[o.index].id;
      o.waiting = { player, action };
      optionsMessage(`PRESS A KEY FOR ${player.toUpperCase()} ${ACTIONS[o.index].label} · ESC CANCELS`);
      input.captureNextKey(finishRebind);
      ui("ui");
    } else {
      resetControls();
      optionsMessage("CONTROLS RESET TO DEFAULTS");
      ui("confirm");
    }
    return;
  }

  if (o.index === 0) {
    sound.setMusicEnabled(!settings.audio.music);
    optionsMessage(settings.audio.music ? "MUSIC ON" : "MUSIC OFF");
  } else if (o.index === 1) {
    sound.setSfxEnabled(!settings.audio.sfx);
    optionsMessage(settings.audio.sfx ? "SFX ON" : "SFX OFF");
  } else if (o.index === 2) {
    sound.setMuted(!settings.audio.muted);
    optionsMessage(settings.audio.muted ? "ALL AUDIO MUTED" : "AUDIO UNMUTED");
  } else {
    resetAudio();
    sound.applyMix();
    optionsMessage("AUDIO RESET TO DEFAULTS");
  }
  ui("confirm");
}

function finishRebind(code) {
  const o = G.options;
  if (!o?.waiting) return;
  const { player, action } = o.waiting;
  o.waiting = null;

  if (code === "Escape") {
    optionsMessage("REBIND CANCELLED", "warn");
    ui("deny");
    return;
  }

  const result = setBinding(player, action, code);
  if (result.ok) {
    optionsMessage(`${keyLabel(code)} ASSIGNED TO ${player.toUpperCase()} ${action.toUpperCase()}`);
    ui("confirm");
  } else {
    optionsMessage(result.reason, "warn");
    ui("deny");
  }
}

function updateOptions(dt) {
  G.screenT += dt;
  const o = G.options;
  if (!o) return;

  if (o.messageT > 0) {
    o.messageT -= dt;
    if (o.messageT <= 0) o.message = "";
  }

  if (o.waiting) return;

  if (input.back()) {
    goTitle();
    return;
  }

  let tabChanged = false;
  if (input.menuLeft()) {
    o.tab = (o.tab + 2) % 3;
    tabChanged = true;
  }
  if (input.menuRight()) {
    o.tab = (o.tab + 1) % 3;
    tabChanged = true;
  }
  if (tabChanged) {
    o.index = 0;
    o.message = "";
    o.messageT = 0;
    ui("ui");
    return;
  }

  const count = optionRowCount(o.tab);
  if (input.menuUp()) {
    o.index = (o.index + count - 1) % count;
    ui("ui");
  }
  if (input.menuDown()) {
    o.index = (o.index + 1) % count;
    ui("ui");
  }

  if (input.confirm() || input.actionJust("p1", "light")) {
    activateOptionsRow();
  }
}

function updateFight(dt) {
  const m = G.match;
  if (!m) return;
  G.screenT += dt;

  if (G.paused) {
    if (input.pausePressed() || input.just("Enter")) {
      togglePause();
      return;
    }
    if (input.just("KeyQ")) {
      goTitle();
      return;
    }
    if (input.just("KeyR")) {
      togglePause();
      startFight(ROSTER.indexOf(m.p1.def), ROSTER.indexOf(m.p2.def), m.twoPlayer);
      return;
    }
    return;
  }

  if (input.pausePressed()) {
    togglePause();
    return;
  }

  if (m.hitstop > 0) {
    m.hitstop -= dt;
    return;
  }

  if (m.phase === "intro") {
    m.phaseT += dt;
    m.p1.update(dt, m.p2, EMPTY, api);
    m.p2.update(dt, m.p1, EMPTY, api);
    separate(m.p1, m.p2);
    if (m.phaseT >= 1.95) {
      m.phase = "fight";
      m.phaseT = 0;
      m.timer = 60;
      m.fightFlash = 0.8;
      sound.sfx("fight");
    }
    return;
  }

  if (m.phase === "fight") {
    m.phaseT += dt;
    m.timer -= dt;
    m.fightFlash = Math.max(0, m.fightFlash - dt);
    const c1 = input.p1();
    const c2 = m.twoPlayer ? input.p2() : updateAI(m.p2.ai, m.p2, m.p1, dt);
    m.p1.update(dt, m.p2, c1, api);
    m.p2.update(dt, m.p1, c2, api);
    m.p1.checkHit(m.p2, api);
    m.p2.checkHit(m.p1, api);
    separate(m.p1, m.p2);

    if (!m.p1.alive || !m.p2.alive) {
      const winner = !m.p1.alive && !m.p2.alive ? -1 : !m.p1.alive ? 1 : 0;
      finishRound(winner, "KO");
    } else if (m.timer <= 0) {
      m.timer = 0;
      const r1 = m.p1.hp / m.p1.def.hp;
      const r2 = m.p2.hp / m.p2.def.hp;
      const winner = Math.abs(r1 - r2) < 0.02 ? -1 : r1 > r2 ? 0 : 1;
      finishRound(winner, "TIME");
    }
    return;
  }

  if (m.phase === "roundover") {
    m.phaseT += dt;
    const slow = m.phaseT < 1.0 ? 0.32 : 1;
    m.p1.update(dt * slow, m.p2, EMPTY, api);
    m.p2.update(dt * slow, m.p1, EMPTY, api);
    separate(m.p1, m.p2);

    if (!m.celebrated && m.phaseT > 1.05) {
      m.celebrated = true;
      if (m.winner >= 0) {
        const wf = m.winner === 0 ? m.p1 : m.p2;
        if (wf.alive) wf.celebrate();
      }
    }

    if (m.phaseT > 3.2) {
      if (m.rounds[0] >= 2 || m.rounds[1] >= 2) {
        showResult();
      } else {
        beginRound(m.round + 1);
      }
    }
  }
}

function finishRound(winner, method) {
  const m = G.match;
  if (!m || m.phase === "roundover") return;
  m.phase = "roundover";
  m.phaseT = 0;
  m.winner = winner;
  m.method = method;
  m.celebrated = false;
  if (winner >= 0) m.rounds[winner] += 1;
  if (method === "KO") {
    sound.sfx("ko");
    fx.shake(16);
    m.hitstop = Math.max(m.hitstop, 0.16);
  } else {
    sound.sfx("round");
  }
}

function separate(a, b) {
  if (!a.onGround || !b.onGround) return;
  if (["ko", "down"].includes(a.state) || ["ko", "down"].includes(b.state)) return;
  const dx = b.x - a.x;
  const d = Math.abs(dx);
  const min = 58;
  if (d < min && d > 0.001) {
    const push = (min - d) / 2;
    const dir = Math.sign(dx) || 1;
    a.x -= push * dir;
    b.x += push * dir;
    a.x = Math.max(94, Math.min(1186, a.x));
    b.x = Math.max(94, Math.min(1186, b.x));
    if (Math.abs(b.x - a.x) < min) {
      if (a.x <= 96) b.x = a.x + min;
      else if (b.x >= 1184) a.x = b.x - min;
    }
  }
}

function updateResult(dt) {
  G.screenT += dt;
  const r = G.result;
  if (!r) return;
  if (input.menuLeft() || input.menuUp()) {
    r.index = (r.index + 2) % 3;
    ui("ui");
  }
  if (input.menuRight() || input.menuDown()) {
    r.index = (r.index + 1) % 3;
    ui("ui");
  }
  if (input.just("KeyC")) {
    goSelectFromResult();
    return;
  }
  if (input.back()) {
    goTitle();
    return;
  }
  if (input.confirm() || input.actionJust("p1", "light")) {
    if (r.index === 0) rematch();
    else if (r.index === 1) goSelectFromResult();
    else goTitle();
  }
}

/* -------------------------------- render --------------------------------- */

function render() {
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = "#07060a";
  ctx.fillRect(0, 0, W, H);

  switch (G.mode) {
    case "title":
      renderTitle();
      break;
    case "select":
      renderSelect();
      break;
    case "options":
      renderOptions();
      break;
    case "fight":
      renderFight();
      break;
    case "result":
      renderResult();
      break;
    default:
      break;
  }

  if (G.fade > 0) {
    ctx.save();
    ctx.globalAlpha = Math.min(1, G.fade);
    ctx.fillStyle = "#060509";
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
    G.fade = Math.max(0, G.fade - 0.055);
  }
}

function renderTitle() {
  drawStage(ctx, G.time, { dim: 0.12 });
  const t = G.time;
  const bob = Math.sin(t * 1.6) * 2;

  // oversized specimens flanking the type
  drawSpecimen(ctx, ROSTER[0], 246, 640 + bob, 2.05, 1, t, { state: "idle" });
  drawSpecimen(ctx, ROSTER[4], 1034, 640 - bob, 2.05, -1, t + 1.3, { state: "idle" });

  // labels
  text("A MINIMALIST BUG FIGHTER", 54, 54, 9, CREAM, { tracking: 3, alpha: 0.62 });
  text("ONE ROOF / FIVE PROBLEMS", 1226, 54, 9, CREAM, { tracking: 3, alpha: 0.62, align: "right" });
  text("SPECIMEN 01 — 05", 54, 72, 8, CREAM, { tracking: 2, alpha: 0.34 });

  // title block
  rule(320, 206, 960, CREAM, 0.18);
  text("MOLT", 640, 382, 252, CREAM, {
    display: true,
    align: "center",
    tracking: 7,
    shadow: ACCENT,
    shadowX: 10,
    shadowY: 11,
    outline: INK,
    outlineWidth: 9,
  });

  ctx.save();
  ctx.globalAlpha = 0.85;
  text("STREET SPECIMENS", 640, 424, 13, CREAM, { tracking: 9, align: "center" });
  ctx.restore();
  rule(470, 450, 810, CREAM, 0.22);

  // menu
  const items = ["VS CPU", "2 PLAYERS", "OPTIONS"];
  for (let i = 0; i < items.length; i++) {
    const y = 484 + i * 44;
    const selected = i === G.titleIndex;
    const w = 300;
    const x = 640 - w / 2;
    if (selected) {
      ctx.save();
      ctx.fillStyle = P1_COLOR;
      ctx.beginPath();
      ctx.moveTo(x + 12, y - 31);
      ctx.lineTo(x + w, y - 31);
      ctx.lineTo(x + w - 12, y + 9);
      ctx.lineTo(x, y + 9);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
      text("▶", x - 26, y - 6, 13, P1_COLOR, { alpha: 0.9 });
      text(items[i], 640, y - 2, 26, INK, { display: true, align: "center", tracking: 3 });
      text(String(i + 1).padStart(2, "0"), x + 18, y - 5, 9, "rgba(12,11,16,0.65)", { tracking: 1 });
    } else {
      text(items[i], 640, y - 2, 24, CREAM, { display: true, align: "center", tracking: 3, alpha: 0.66 });
      text(String(i + 1).padStart(2, "0"), x + 18, y - 5, 9, CREAM, { tracking: 1, alpha: 0.4 });
    }
  }
  text("ENTER SELECT", 640, 620, 9, CREAM, {
    tracking: 4,
    align: "center",
    alpha: 0.45 + Math.sin(t * 3) * 0.18,
  });

  // corner ticks
  drawFrameMarks();

  // bottom line
  rule(54, 676, 280, CREAM, 0.18);
  text("NO BUGS WERE HARMED", 54, 696, 8, CREAM, { tracking: 2, alpha: 0.35 });
  text("↑↓ NAVIGATE   ·   ENTER SELECT   ·   M MUTE", 1226, 696, 8, CREAM, {
    tracking: 2,
    alpha: 0.35,
    align: "right",
  });
}

function renderSelect() {
  drawStage(ctx, G.time, { dim: 0.55 });
  const s = G.select;
  if (!s) return;

  // heading
  text("SELECT YOUR SPECIMEN", 70, 78, 11, CREAM, { tracking: 4, alpha: 0.72 });
  text("01 / 05", 1210, 78, 11, CREAM, { tracking: 3, alpha: 0.5, align: "right" });
  rule(70, 92, 1210, CREAM, 0.16);

  for (let i = 0; i < ROSTER.length; i++) {
    const def = ROSTER[i];
    const x = CARDS_X + i * (CARD_W + CARD_GAP);
    const y = CARD_Y;
    const isP1 = s.p1 === i;
    const isP2 = s.p2 === i;
    const accent = def.colors.accent;
    const selected = (isP1 && !s.p1Locked) || (isP2 && !s.p2Locked) || isP1 || isP2;

    ctx.save();
    ctx.fillStyle = selected ? "rgba(243,235,216,0.055)" : "rgba(8,7,11,0.55)";
    ctx.fillRect(x, y, CARD_W, CARD_H);
    ctx.strokeStyle = selected ? "rgba(242,232,213,0.5)" : "rgba(242,232,213,0.13)";
    ctx.lineWidth = selected ? 1.6 : 1;
    ctx.strokeRect(x + 0.5, y + 0.5, CARD_W - 1, CARD_H - 1);
    ctx.restore();

    // faint number
    text(String(i + 1).padStart(2, "0"), x + 14, y + 32, 13, accent, { alpha: selected ? 0.9 : 0.4, tracking: 1 });
    text(def.species, x + CARD_W - 12, y + 30, 7, CREAM, { tracking: 1.4, alpha: 0.4, align: "right" });

    // portrait
    const pscale = 1.28;
    const anim = G.time + i * 0.7;
    drawSpecimen(ctx, def, x + CARD_W / 2, y + 300, pscale, 1, anim, { state: "idle" });

    // accent foot
    ctx.save();
    ctx.globalAlpha = selected ? 0.95 : 0.35;
    ctx.fillStyle = accent;
    ctx.fillRect(x, y + CARD_H - 76, CARD_W, 2);
    ctx.restore();

    text(def.name, x + 14, y + CARD_H - 40, 30, selected ? CREAM : "rgba(242,232,213,0.72)", {
      display: true,
      tracking: 1.5,
    });
    text(def.tagline, x + 14, y + CARD_H - 22, 7, accent, { tracking: 1.3, alpha: 0.75 });

    if (isP1) {
      tag(x + CARD_W - 42, y + 12, "P1", P1_COLOR);
    }
    if (isP2) {
      tag(x + CARD_W - 42, y + 12 + (isP1 ? 20 : 0), G.mode2p ? "P2" : "CPU", P2_COLOR);
    }
    if ((isP1 && s.p1Locked) || (isP2 && s.p2Locked)) {
      text("LOCKED IN", x + CARD_W - 14, y + CARD_H - 94, 7, accent, {
        tracking: 2,
        alpha: 0.9,
        align: "right",
      });
    }
  }

  // info panel
  const infoY = 536;
  panel(70, infoY, 1140, 128, { fill: "rgba(8,7,11,0.82)", stroke: "rgba(242,232,213,0.2)" });
  const p1def = ROSTER[s.p1];
  text(p1def.name, 94, infoY + 47, 38, CREAM, { display: true, tracking: 2 });
  text(p1def.species, 94, infoY + 68, 8, p1def.colors.accent, { tracking: 2 });
  text(p1def.tagline, 94, infoY + 92, 8, CREAM, { tracking: 1.4, alpha: 0.5 });

  ctx.save();
  ctx.strokeStyle = "rgba(242,232,213,0.15)";
  ctx.beginPath();
  ctx.moveTo(376, infoY + 18);
  ctx.lineTo(376, infoY + 108);
  ctx.stroke();
  ctx.restore();

  text("SPECIAL / " + p1def.special.name, 400, infoY + 38, 9, p1def.colors.accent, { tracking: 2 });
  const blurbLines = wrapText(p1def.special.blurb, 390, 8);
  for (let i = 0; i < blurbLines.length; i++) {
    text(blurbLines[i], 400, infoY + 58 + i * 14, 8, CREAM, { alpha: 0.66 });
  }
  text("COST 50 METER", 400, infoY + 104, 8, CREAM, { tracking: 1.5, alpha: 0.35 });

  // stats
  const sx = 850;
  const stats = [
    ["PWR", p1def.stats.pow],
    ["SPD", p1def.stats.spd],
    ["RCH", p1def.stats.rch],
    ["GIM", p1def.stats.gimmick],
  ];
  for (let i = 0; i < stats.length; i++) {
    const yy = infoY + 30 + i * 22;
    text(stats[i][0], sx, yy, 8, CREAM, { tracking: 2, alpha: 0.5 });
    for (let j = 0; j < 5; j++) {
      ctx.save();
      ctx.fillStyle = j < stats[i][1] ? p1def.colors.accent : "rgba(242,232,213,0.12)";
      ctx.fillRect(sx + 48 + j * 26, yy - 8, 18, 6);
      ctx.restore();
    }
  }

  // bottom hint
  const p1 = settings.controls.p1;
  const p2 = settings.controls.p2;
  if (G.mode2p) {
    text(`P1  ${keyLabel(p1.left)} / ${keyLabel(p1.right)}  ·  ${keyLabel(p1.light)} LOCK`, 70, 694, 9, P1_COLOR, {
      tracking: 1.8,
      alpha: 0.9,
    });
    text(`P2  ${keyLabel(p2.left)} / ${keyLabel(p2.right)}  ·  ${keyLabel(p2.light)} LOCK`, 1210, 694, 9, P2_COLOR, {
      tracking: 1.8,
      alpha: 0.9,
      align: "right",
    });
  } else {
    text(`${keyLabel(p1.left)} / ${keyLabel(p1.right)} CHOOSE  ·  ${keyLabel(p1.light)} / ENTER LOCK`, 70, 694, 9, P1_COLOR, {
      tracking: 1.8,
      alpha: 0.85,
    });
    text("CPU PICKS WHEN YOU DO", 1210, 694, 9, P2_COLOR, { tracking: 1.8, alpha: 0.7, align: "right" });
  }
  text("ESC BACK", 640, 694, 8, CREAM, { tracking: 2, align: "center", alpha: 0.35 });

  if (s.p1Locked && s.p2Locked) {
    const pulse = 1 + Math.max(0, 0.15 - s.countdown) * 3;
    ctx.save();
    ctx.fillStyle = "rgba(6,5,9,0.55)";
    ctx.fillRect(0, 0, W, H);
    ctx.translate(640, 330);
    ctx.scale(pulse, pulse);
    text("VS", 0, 0, 110, CREAM, {
      display: true,
      align: "center",
      shadow: ACCENT,
      shadowX: 5,
      shadowY: 6,
      outline: INK,
      outlineWidth: 7,
    });
    ctx.restore();
    text(`${ROSTER[s.p1].name}  /  ${ROSTER[s.p2].name}`, 640, 372, 12, CREAM, {
      align: "center",
      tracking: 5,
      alpha: 0.72,
    });
  } else if (!G.mode2p && s.cpuState === "spin") {
    text("CPU IS CHOOSING...", 640, 694, 8, P2_COLOR, { tracking: 2, align: "center", alpha: 0.7 });
  }

  drawFrameMarks();
}

function renderOptions() {
  drawStage(ctx, G.time, { dim: 0.68 });
  const o = G.options;
  if (!o) return;

  ctx.save();
  ctx.fillStyle = "rgba(4,3,7,0.52)";
  ctx.fillRect(0, 0, W, H);
  ctx.restore();

  panel(126, 72, 1028, 584, { fill: "rgba(10,9,14,0.95)", stroke: "rgba(242,232,213,0.24)", line: 1.5 });
  text("MOLT / SYSTEM", 158, 110, 9, CREAM, { tracking: 3, alpha: 0.55 });
  text("ESC — BACK TO TITLE", 1122, 110, 8, CREAM, { tracking: 2, alpha: 0.38, align: "right" });
  text("OPTIONS", 640, 190, 72, CREAM, {
    display: true,
    align: "center",
    tracking: 4,
    shadow: ACCENT,
    shadowX: 6,
    shadowY: 7,
  });

  const tabs = [
    { label: "P1 KEYS", color: P1_COLOR },
    { label: "P2 KEYS", color: P2_COLOR },
    { label: "AUDIO", color: CREAM },
  ];
  const tabW = 188;
  const tabGap = 10;
  const tabX = 640 - (tabW * tabs.length + tabGap * (tabs.length - 1)) / 2;
  const tabY = 216;
  for (let i = 0; i < tabs.length; i++) {
    const x = tabX + i * (tabW + tabGap);
    const selected = o.tab === i;
    ctx.save();
    ctx.fillStyle = selected ? tabs[i].color : "rgba(242,232,213,0.035)";
    ctx.fillRect(x, tabY, tabW, 34);
    ctx.strokeStyle = selected ? tabs[i].color : "rgba(242,232,213,0.18)";
    ctx.lineWidth = selected ? 1.5 : 1;
    ctx.strokeRect(x + 0.5, tabY + 0.5, tabW - 1, 33);
    ctx.restore();
    text(tabs[i].label, x + tabW / 2, tabY + 22, 10, selected ? INK : CREAM, {
      tracking: 2.5,
      align: "center",
      alpha: selected ? 1 : 0.45,
    });
    text(String(i + 1).padStart(2, "0"), x + 14, tabY + 14, 7, selected ? INK : CREAM, {
      tracking: 1,
      alpha: selected ? 0.45 : 0.2,
    });
  }
  rule(176, 270, 1104, CREAM, 0.16);

  const accent = o.tab === 0 ? P1_COLOR : o.tab === 1 ? P2_COLOR : CREAM;

  if (o.tab < 2) {
    const player = o.tab === 0 ? "p1" : "p2";
    for (let i = 0; i < ACTIONS.length; i++) {
      const y = 302 + i * 36;
      const selected = o.index === i;
      const rowX = 176;
      const rowW = 928;
      const rowH = 30;
      if (selected) {
        ctx.save();
        ctx.fillStyle = "rgba(242,232,213,0.075)";
        ctx.fillRect(rowX, y - rowH / 2, rowW, rowH);
        ctx.fillStyle = accent;
        ctx.fillRect(rowX, y - rowH / 2, 3, rowH);
        ctx.restore();
      }

      text(String(i + 1).padStart(2, "0"), 194, y + 4, 8, accent, {
        tracking: 1,
        alpha: selected ? 0.85 : 0.28,
      });
      text(ACTIONS[i].label, 228, y + 4, 10, CREAM, {
        tracking: 2,
        alpha: selected ? 0.95 : 0.5,
      });

      const boxX = 874;
      const boxW = 208;
      const boxH = 26;
      const waiting = o.waiting?.player === player && o.waiting?.action === ACTIONS[i].id;
      ctx.save();
      ctx.fillStyle = waiting ? accent : selected ? "rgba(242,232,213,0.12)" : "rgba(242,232,213,0.025)";
      ctx.fillRect(boxX, y - boxH / 2, boxW, boxH);
      ctx.strokeStyle = selected || waiting ? accent : "rgba(242,232,213,0.15)";
      ctx.lineWidth = 1;
      ctx.strokeRect(boxX + 0.5, y - boxH / 2 + 0.5, boxW - 1, boxH - 1);
      ctx.restore();
      if (waiting) {
        text("PRESS ANY KEY...", boxX + boxW / 2, y + 4, 9, INK, {
          tracking: 1.5,
          align: "center",
          alpha: 0.65 + Math.sin(G.time * 8) * 0.35,
        });
      } else {
        text(keyLabel(settings.controls[player][ACTIONS[i].id]), boxX + boxW / 2, y + 4, 10, selected ? accent : CREAM, {
          tracking: 1.2,
          align: "center",
          alpha: selected ? 1 : 0.55,
        });
      }
    }

    const y = 556;
    const selected = o.index === ACTIONS.length;
    const rowX = 176;
    const rowW = 928;
    const rowH = 30;
    if (selected) {
      ctx.save();
      ctx.fillStyle = "rgba(242,232,213,0.075)";
      ctx.fillRect(rowX, y - rowH / 2, rowW, rowH);
      ctx.fillStyle = ACCENT;
      ctx.fillRect(rowX, y - rowH / 2, 3, rowH);
      ctx.restore();
    }
    text("RESET CONTROLS", 228, y + 4, 10, CREAM, { tracking: 2, alpha: selected ? 0.95 : 0.45 });
    text("RESTORE BOTH PLAYER DEFAULTS", 640, y + 4, 8, CREAM, {
      tracking: 1.2,
      align: "center",
      alpha: 0.24,
    });
    text("DEFAULT", 978, y + 4, 9, selected ? ACCENT : CREAM, {
      tracking: 1.2,
      align: "center",
      alpha: selected ? 1 : 0.35,
    });
  } else {
    const audioRows = [
      { label: "MUSIC", hint: "SYNTHESIZED FIGHT LOOP", on: settings.audio.music, color: P1_COLOR },
      { label: "SFX", hint: "HITS · BLOCKS · UI", on: settings.audio.sfx, color: P2_COLOR },
      { label: "MUTE ALL", hint: "MASTER MUTE — ALSO BOUND TO M", on: settings.audio.muted, color: ACCENT },
    ];
    for (let i = 0; i < audioRows.length; i++) {
      const y = 316 + i * 58;
      const selected = o.index === i;
      const row = audioRows[i];
      const rowX = 176;
      const rowW = 928;
      const rowH = 46;
      if (selected) {
        ctx.save();
        ctx.fillStyle = "rgba(242,232,213,0.075)";
        ctx.fillRect(rowX, y - rowH / 2, rowW, rowH);
        ctx.fillStyle = row.color;
        ctx.fillRect(rowX, y - rowH / 2, 3, rowH);
        ctx.restore();
      }
      text(row.label, 228, y - 2, 15, CREAM, { display: true, tracking: 2, alpha: selected ? 0.98 : 0.55 });
      text(row.hint, 228, y + 16, 7, CREAM, { tracking: 1.3, alpha: selected ? 0.48 : 0.22 });

      const boxW = 148;
      const boxX = 934;
      ctx.save();
      ctx.fillStyle = row.on ? `${row.color}33` : "rgba(242,232,213,0.035)";
      ctx.fillRect(boxX, y - 16, boxW, 32);
      ctx.strokeStyle = selected ? row.color : row.on ? `${row.color}99` : "rgba(242,232,213,0.17)";
      ctx.lineWidth = 1;
      ctx.strokeRect(boxX + 0.5, y - 15.5, boxW - 1, 31);
      ctx.restore();
      text(row.on ? "ON" : "OFF", boxX + boxW / 2, y + 6, 14, row.on ? row.color : CREAM, {
        display: true,
        tracking: 2,
        align: "center",
        alpha: row.on ? 1 : 0.36,
      });
    }

    const y = 514;
    const selected = o.index === 3;
    const rowX = 176;
    const rowW = 928;
    const rowH = 36;
    if (selected) {
      ctx.save();
      ctx.fillStyle = "rgba(242,232,213,0.075)";
      ctx.fillRect(rowX, y - rowH / 2, rowW, rowH);
      ctx.fillStyle = ACCENT;
      ctx.fillRect(rowX, y - rowH / 2, 3, rowH);
      ctx.restore();
    }
    text("RESET AUDIO", 228, y + 4, 10, CREAM, { tracking: 2, alpha: selected ? 0.95 : 0.45 });
    text("DEFAULT", 978, y + 4, 9, selected ? ACCENT : CREAM, {
      tracking: 1.2,
      align: "center",
      alpha: selected ? 1 : 0.35,
    });
  }

  const message = o.waiting ? "LISTENING FOR A KEY · ESC CANCELS" : o.message;
  if (message) {
    text(message, 640, 604, 8, o.messageKind === "warn" ? "#FF9B7A" : accent, {
      align: "center",
      tracking: 1.8,
      alpha: o.waiting ? 0.62 + Math.sin(G.time * 7) * 0.28 : 0.9,
    });
  } else {
    text("SETTINGS SAVE AUTOMATICALLY TO THIS BROWSER", 640, 604, 7, CREAM, {
      align: "center",
      tracking: 1.8,
      alpha: 0.24,
    });
  }

  rule(176, 624, 1104, CREAM, 0.12);
  text("↑ ↓ SELECT   ·   ← → TAB   ·   ENTER CHANGE   ·   ESC BACK", 640, 642, 7, CREAM, {
    align: "center",
    tracking: 1.6,
    alpha: 0.34,
  });
  text("PAUSE BUTTON = BACK ON TOUCH", 1226, 688, 7, CREAM, {
    align: "right",
    tracking: 1.8,
    alpha: 0.26,
  });
  drawFrameMarks();
}

function tag(x, y, label, color) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.fillRect(x, y, 32, 15);
  ctx.fillStyle = INK;
  ctx.font = `700 8px ${MONO}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label, x + 16, y + 8);
  ctx.restore();
}

function drawFrameMarks() {
  ctx.save();
  ctx.strokeStyle = "rgba(242,232,213,0.3)";
  ctx.lineWidth = 1;
  const m = 22;
  const l = 16;
  for (const [x, y, sx, sy] of [
    [m, m, 1, 1],
    [W - m, m, -1, 1],
    [m, H - m, 1, -1],
    [W - m, H - m, -1, -1],
  ]) {
    ctx.beginPath();
    ctx.moveTo(x + sx * l, y);
    ctx.lineTo(x, y);
    ctx.lineTo(x, y + sy * l);
    ctx.stroke();
  }
  ctx.restore();
}

function renderFight() {
  const m = G.match;
  if (!m) return;

  ctx.save();
  const shake = fx.shakeAmt;
  const ox = (Math.random() * 2 - 1) * shake;
  const oy = (Math.random() * 2 - 1) * shake;
  ctx.translate(ox, oy);
  drawStage(ctx, G.time, { dim: 0.05 });

  // loser behind, winner/attacker in front-ish
  const fighters = [m.p1, m.p2].sort((a, b) => {
    if (a.state === "ko" && b.state !== "ko") return -1;
    if (b.state === "ko" && a.state !== "ko") return 1;
    return a.x - b.x;
  });
  for (const f of fighters) drawFighter(ctx, f, G.time);
  fx.draw(ctx);
  ctx.restore();

  drawHUD(m);
  drawFightOverlays(m);

  if (G.paused) drawPause(m);
}

function drawHUD(m) {
  const p1 = m.p1;
  const p2 = m.p2;

  const topFade = ctx.createLinearGradient(0, 0, 0, 148);
  topFade.addColorStop(0, "rgba(5,4,8,0.78)");
  topFade.addColorStop(1, "rgba(5,4,8,0)");
  ctx.fillStyle = topFade;
  ctx.fillRect(0, 0, W, 148);

  healthBar(p1, 64, 38, 500, 18, false, P1_COLOR);
  healthBar(p2, 716, 38, 500, 18, true, P2_COLOR);

  // labels above the bars
  text("P1", 64, 26, 8, P1_COLOR, { tracking: 2, alpha: 0.9 });
  text(m.twoPlayer ? "P2" : "CPU", 1216, 26, 8, P2_COLOR, { tracking: 2, alpha: 0.9, align: "right" });
  text(`ROUND ${m.round}`, 640, 26, 8, CREAM, { tracking: 3, align: "center", alpha: 0.5 });

  // round pips (first to two)
  for (let i = 0; i < 2; i++) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(526 + i * 19, 70, 5, 0, Math.PI * 2);
    ctx.fillStyle = m.rounds[0] > i ? P1_COLOR : "rgba(242,232,213,0.15)";
    ctx.fill();
    ctx.strokeStyle = "rgba(242,232,213,0.45)";
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(735 + i * 19, 70, 5, 0, Math.PI * 2);
    ctx.fillStyle = m.rounds[1] > i ? P2_COLOR : "rgba(242,232,213,0.15)";
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  // names
  text(p1.def.name, 64, 80, 21, CREAM, { display: true, tracking: 1.5 });
  text(p1.def.species, 64, 93, 7, CREAM, { tracking: 1.4, alpha: 0.4 });
  text(p2.def.name, 1216, 80, 21, CREAM, { display: true, tracking: 1.5, align: "right" });
  text(p2.def.species, 1216, 93, 7, CREAM, { tracking: 1.4, alpha: 0.4, align: "right" });

  // timer
  const timeLeft = Math.ceil(m.timer);
  const low = timeLeft <= 10 && m.phase === "fight";
  text(String(Math.max(0, timeLeft)).padStart(2, "0"), 640, 94, 50, low ? "#FF6B4A" : CREAM, {
    display: true,
    align: "center",
    tracking: 1,
  });
  text("TIME", 640, 110, 7, CREAM, { tracking: 4, align: "center", alpha: 0.35 });

  // combo counters
  if (p1.combo >= 2 && p1.comboT > 0) {
    const pop = 1 + Math.max(0, p1.comboT - 0.9) * 1.6;
    ctx.save();
    ctx.translate(118, 180);
    ctx.scale(pop, pop);
    text(`${p1.combo}`, 0, 0, 54, P1_COLOR, { display: true, shadow: INK, shadowX: 3, shadowY: 3 });
    text("HIT", 8, 20, 10, CREAM, { tracking: 2, alpha: 0.7 });
    ctx.restore();
  }
  if (p2.combo >= 2 && p2.comboT > 0) {
    const pop = 1 + Math.max(0, p2.comboT - 0.9) * 1.6;
    ctx.save();
    ctx.translate(1162, 180);
    ctx.scale(pop, pop);
    text(`${p2.combo}`, 0, 0, 54, P2_COLOR, { display: true, align: "right", shadow: INK, shadowX: 3, shadowY: 3 });
    text("HIT", -8, 20, 10, CREAM, { tracking: 2, alpha: 0.7, align: "right" });
    ctx.restore();
  }

  // meters
  meterBar(p1, 64, 684, 330, 9, false, P1_COLOR);
  meterBar(p2, 886, 684, 330, 9, true, P2_COLOR);
  text(p1.def.special.name, 64, 706, 7, CREAM, { tracking: 1.5, alpha: 0.3 });
  text(p2.def.special.name, 1216, 706, 7, CREAM, { tracking: 1.5, alpha: 0.3, align: "right" });
  text("MOLT", 640, 702, 11, CREAM, { display: true, tracking: 3, align: "center", alpha: 0.28 });
  text("ESC PAUSE · M MUTE", 640, 714, 6, CREAM, { tracking: 1.5, align: "center", alpha: 0.22 });
}

function drawFightOverlays(m) {
  const t = m.phaseT;

  if (m.phase === "intro") {
    const inP = Math.min(1, t / 0.25);
    const scale = 0.8 + inP * 0.2;
    ctx.save();
    ctx.translate(640, 324);
    ctx.scale(scale, scale);
    text(`ROUND ${m.round}`, 0, 0, 108, CREAM, {
      display: true,
      align: "center",
      tracking: 3,
      shadow: ACCENT,
      shadowX: 7,
      shadowY: 8,
      outline: INK,
      outlineWidth: 8,
    });
    ctx.restore();
    text(`${m.p1.def.name}  VS  ${m.p2.def.name}`, 640, 360, 11, CREAM, {
      align: "center",
      tracking: 6,
      alpha: 0.65 * inP,
    });
  } else if (m.phase === "fight" && m.fightFlash > 0) {
    const k = m.fightFlash / 0.8;
    ctx.save();
    ctx.globalAlpha = Math.min(1, k * 2);
    ctx.translate(640, 330);
    ctx.scale(1 + (1 - k) * 0.2, 1 + (1 - k) * 0.2);
    text("FIGHT", 0, 0, 120, P1_COLOR, {
      display: true,
      align: "center",
      tracking: 4,
      shadow: INK,
      shadowX: 6,
      shadowY: 6,
      outline: CREAM,
      outlineWidth: 4,
    });
    ctx.restore();
  } else if (m.phase === "roundover") {
    ctx.save();
    ctx.fillStyle = "rgba(5,4,8,0.45)";
    ctx.fillRect(0, 0, W, H);
    ctx.restore();

    const isKO = m.method === "KO";
    const label = isKO ? "K.O." : "TIME";
    const k = Math.min(1, t / 0.3);
    const scale = 1.35 - k * 0.35;
    ctx.save();
    ctx.translate(640, 310);
    ctx.scale(scale, scale);
    text(label, 0, 0, isKO ? 174 : 150, isKO ? ACCENT : CREAM, {
      display: true,
      align: "center",
      tracking: 4,
      shadow: INK,
      shadowX: 8,
      shadowY: 9,
      outline: CREAM,
      outlineWidth: isKO ? 3 : 0,
    });
    ctx.restore();

    const winnerName = m.winner >= 0 ? (m.winner === 0 ? m.p1.def.name : m.p2.def.name) : null;
    if (winnerName) {
      text(`${winnerName} TAKES THE ROUND`, 640, 350, 11, CREAM, {
        align: "center",
        tracking: 4,
        alpha: Math.min(1, t * 1.2),
      });
    } else {
      text("DOUBLE K.O. — NOBODY WINS", 640, 350, 11, CREAM, { align: "center", tracking: 4 });
    }
    text(`${m.rounds[0]}  —  ${m.rounds[1]}`, 640, 400, 34, CREAM, {
      display: true,
      align: "center",
      tracking: 5,
      alpha: 0.8,
    });
    if (m.rounds[0] === 1 || m.rounds[1] === 1) {
      const who = m.rounds[0] === 1 ? "P1" : m.twoPlayer ? "P2" : "CPU";
      text(`${who} AT MATCH POINT`, 640, 428, 8, ACCENT, {
        align: "center",
        tracking: 3,
        alpha: 0.6 + Math.sin(G.time * 6) * 0.3,
      });
    }
  }
}

function drawPause(m) {
  ctx.save();
  ctx.fillStyle = "rgba(5,4,8,0.78)";
  ctx.fillRect(0, 0, W, H);
  ctx.restore();

  panel(310, 140, 660, 450, { fill: "rgba(11,10,15,0.95)", stroke: "rgba(242,232,213,0.28)", line: 1.5 });
  text("PAUSED", 640, 214, 76, CREAM, {
    display: true,
    align: "center",
    tracking: 4,
    shadow: ACCENT,
    shadowX: 5,
    shadowY: 6,
  });
  rule(360, 240, 920, CREAM, 0.18);

  const c1 = settings.controls.p1;
  const c2 = settings.controls.p2;
  const k = keyLabel;
  const lines = [
    ["P1", `${k(c1.left)} ${k(c1.right)} MOVE · ${k(c1.up)} JUMP · ${k(c1.down)} CROUCH`, P1_COLOR],
    ["", `HOLD BACK TO BLOCK · ${k(c1.light)} LIGHT · ${k(c1.heavy)} HEAVY · ${k(c1.special)} SPECIAL`, CREAM],
    G.match?.twoPlayer
      ? ["P2", `${k(c2.left)} ${k(c2.right)} MOVE · ${k(c2.up)} JUMP · ${k(c2.down)} CROUCH · ${k(c2.light)} ${k(c2.heavy)} ${k(c2.special)} ATTACK`, P2_COLOR]
      : ["CPU", "IT HAS BEEN PRACTICING.", P2_COLOR],
    ["", "SPECIALS COST 50 METER. HOLD DOWN + HEAVY FOR A SWEEP.", CREAM],
    ["", "CROUCH BLOCKS LOW · STANDING BLOCKS OVERHEAD.", CREAM],
  ];
  let y = 282;
  for (const [tagLabel, line, color] of lines) {
    if (tagLabel) {
      text(tagLabel, 370, y, 9, color, { tracking: 2 });
      text(line, 420, y, 8, color, { tracking: 1.2, alpha: 0.8 });
    } else {
      text(line, 370, y, 8, color, { tracking: 1.2, alpha: 0.5 });
    }
    y += 30;
  }

  rule(360, 450, 920, CREAM, 0.16);
  text("ESC / P  RESUME      R  RESTART      Q  QUIT", 640, 486, 9, CREAM, {
    align: "center",
    tracking: 2.5,
    alpha: 0.8,
  });
  text("M  MUTE", 640, 512, 8, CREAM, { align: "center", tracking: 2.5, alpha: 0.35 });

  // little portrait
  const def = m.p1.def;
  drawSpecimen(ctx, def, 640, 570, 0.9, 1, G.time, { state: "idle" });
}

function renderResult() {
  drawStage(ctx, G.time, { dim: 0.5 });
  const r = G.result;
  if (!r) return;
  const t = G.screenT;

  // Quiet the stage behind the report column so the type stays readable.
  const shade = ctx.createLinearGradient(560, 0, 760, 0);
  shade.addColorStop(0, "rgba(6,5,9,0)");
  shade.addColorStop(0.5, "rgba(6,5,9,0.72)");
  shade.addColorStop(1, "rgba(6,5,9,0.72)");
  ctx.fillStyle = shade;
  ctx.fillRect(560, 96, 720, 620);

  // composition marks
  ctx.save();
  ctx.strokeStyle = r.winner.colors.accent;
  ctx.globalAlpha = 0.3;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(332, 430, 228, 0, Math.PI * 2);
  ctx.stroke();
  ctx.globalAlpha = 0.15;
  ctx.beginPath();
  ctx.arc(332, 430, 252, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  const bob = Math.sin(t * 2) * 2;
  drawSpecimen(ctx, r.winner, 330, 648 + bob, 2.5, 1, G.time, { state: "win" });

  text("MATCH COMPLETE", 660, 172, 9, CREAM, { tracking: 4, alpha: 0.55 });
  text(r.winner.name, 654, 294, 100, CREAM, {
    display: true,
    tracking: 2,
    shadow: r.winner.colors.accent,
    shadowX: 7,
    shadowY: 8,
  });
  text("WINS", 660, 342, 46, r.winner.colors.accent, { display: true, tracking: 5 });
  text(`VS ${r.loser.name}  ·  ${r.score[0]} — ${r.score[1]}`, 662, 370, 9, CREAM, {
    tracking: 3,
    alpha: 0.7,
  });

  rule(660, 396, 1210, CREAM, 0.22);

  const stats = [
    ["DAMAGE DEALT", Math.round(r.stats.damage[r.winnerIndex])],
    ["BEST COMBO", r.stats.maxCombo[r.winnerIndex]],
    ["SPECIALS", r.stats.specials[r.winnerIndex]],
  ];
  for (let i = 0; i < stats.length; i++) {
    const x = 660 + i * 186;
    text(stats[i][0], x, 430, 7, CREAM, { tracking: 1.8, alpha: 0.4 });
    text(String(stats[i][1]).padStart(2, "0"), x, 462, 30, CREAM, { display: true, tracking: 1 });
  }

  text(r.winner.special.name, 660, 512, 8, r.winner.colors.accent, { tracking: 2, alpha: 0.75 });
  text(r.winner.tagline, 660, 530, 8, CREAM, { tracking: 1.4, alpha: 0.35 });

  // menu
  const options = ["REMATCH", "CHANGE FIGHTERS", "TITLE"];
  for (let i = 0; i < options.length; i++) {
    const y = 578 + i * 34;
    const selected = i === r.index;
    if (selected) {
      ctx.save();
      ctx.fillStyle = r.winner.colors.accent;
      ctx.fillRect(654, y - 21, 360, 30);
      ctx.restore();
      text(options[i], 670, y, 20, INK, { display: true, tracking: 2 });
      text("▶", 1030, y - 1, 11, INK);
    } else {
      text(options[i], 670, y, 18, CREAM, { display: true, tracking: 2, alpha: 0.5 });
    }
    text(["ENTER", "C", "ESC"][i], 1210, y - 2, 7, CREAM, {
      align: "right",
      tracking: 1.5,
      alpha: selected ? 0.7 : 0.25,
    });
  }

  text("A / D SELECT · ENTER CONFIRM", 660, 690, 7, CREAM, { tracking: 2, alpha: 0.3 });
  text(r.twoPlayer ? "LOCAL VERSUS" : "VERSUS CPU", 1210, 142, 8, CREAM, {
    tracking: 2,
    align: "right",
    alpha: 0.3,
  });
  drawFrameMarks();
}

/* --------------------------------- loop ---------------------------------- */

let last = performance.now();
function loop(now) {
  const dt = Math.min(0.045, Math.max(0.001, (now - last) / 1000));
  last = now;
  G.time += dt;
  if (!G.frozen) update(dt);
  render();
  input.endFrame();
  requestAnimationFrame(loop);
}

// Small debug handle for testing and for anyone who wants to poke at the fight.
window.__MOLT = { G, startFight, goSelect, goTitle, goOptions, showResult, ROSTER, input, sound, settings };

document.fonts?.ready?.then(() => {
  // canvas picks the fonts up on the next frame automatically
});

if (document.fonts?.load) {
  document.fonts.load(`16px Anton`).catch(() => {});
  document.fonts.load(`16px "Space Mono"`).catch(() => {});
}

requestAnimationFrame(loop);
