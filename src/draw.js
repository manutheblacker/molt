import { GROUND_Y } from "./fighter.js";

const TAU = Math.PI * 2;
const CREAM = "#F2E8D5";

const BUILD = {
  blate: { arm: 13, leg: 15, chestRX: 27, chestRY: 26, hipRX: 25, hipRY: 26, headRX: 17, headRY: 15, bend: 10 },
  antix: { arm: 8, leg: 9, chestRX: 17, chestRY: 25, hipRX: 21, hipRY: 23, headRX: 18, headRY: 16, bend: 8 },
  skut: { arm: 8, leg: 9, chestRX: 24, chestRY: 23, hipRX: 26, hipRY: 21, headRX: 15, headRY: 13, bend: 8 },
  gex: { arm: 12, leg: 13, chestRX: 23, chestRY: 27, hipRX: 20, hipRY: 22, headRX: 21, headRY: 17, bend: 9 },
  skito: { arm: 5, leg: 5.5, chestRX: 14, chestRY: 23, hipRX: 12, hipRY: 20, headRX: 12, headRY: 12, bend: 6 },
};

function clamp(v, a, b) {
  return v < a ? a : v > b ? b : v;
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function easeInOut(t) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

function poly(ctx, points) {
  ctx.beginPath();
  ctx.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; i++) ctx.lineTo(points[i][0], points[i][1]);
}

function limb(ctx, points, width, color, ink, outline = 3.5) {
  const path = () => {
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y);
  };
  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  path();
  ctx.strokeStyle = ink;
  ctx.lineWidth = width + outline * 2;
  ctx.stroke();
  path();
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.stroke();
  ctx.restore();
}

function blob(ctx, x, y, rx, ry, rot, fill, pal, outline = 4) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot || 0);
  ctx.beginPath();
  ctx.ellipse(0, 0, rx, ry, 0, 0, TAU);
  ctx.fillStyle = fill;
  ctx.fill();
  if (outline > 0) {
    ctx.lineWidth = outline;
    ctx.strokeStyle = pal.ink;
    ctx.lineJoin = "round";
    ctx.stroke();
  }
  ctx.restore();
}

function curve(ctx, pts, width, color, ink, outline = 0) {
  const path = () => {
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    if (pts.length === 3) ctx.quadraticCurveTo(pts[1][0], pts[1][1], pts[2][0], pts[2][1]);
    else if (pts.length === 4) ctx.bezierCurveTo(pts[1][0], pts[1][1], pts[2][0], pts[2][1], pts[3][0], pts[3][1]);
    else {
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
    }
  };
  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  if (outline > 0) {
    path();
    ctx.strokeStyle = ink;
    ctx.lineWidth = width + outline * 2;
    ctx.stroke();
  }
  path();
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.stroke();
  ctx.restore();
}

function eye(ctx, x, y, r, pal, opts = {}) {
  const angry = opts.angry !== false;
  const dead = !!opts.dead;
  const look = opts.look ?? 1.5;
  ctx.save();
  if (dead) {
    ctx.strokeStyle = pal.ink;
    ctx.lineWidth = Math.max(2, r * 0.5);
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(x - r * 0.7, y - r * 0.7);
    ctx.lineTo(x + r * 0.7, y + r * 0.7);
    ctx.moveTo(x + r * 0.7, y - r * 0.7);
    ctx.lineTo(x - r * 0.7, y + r * 0.7);
    ctx.stroke();
    ctx.restore();
    return;
  }
  ctx.beginPath();
  ctx.ellipse(x, y, r * 1.08, r, 0.15, 0, TAU);
  ctx.fillStyle = pal.eye;
  ctx.fill();
  ctx.lineWidth = 2.2;
  ctx.strokeStyle = pal.ink;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x + look, y + r * 0.05, r * 0.52, 0, TAU);
  ctx.fillStyle = pal.ink;
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x + look - r * 0.2, y - r * 0.24, Math.max(1, r * 0.2), 0, TAU);
  ctx.fillStyle = CREAM;
  ctx.fill();
  if (angry) {
    ctx.beginPath();
    ctx.moveTo(x - r * 1.1, y - r * 1.05);
    ctx.lineTo(x + r * 0.85, y - r * 0.64);
    ctx.strokeStyle = pal.ink;
    ctx.lineWidth = Math.max(2.2, r * 0.34);
    ctx.lineCap = "round";
    ctx.stroke();
  }
  ctx.restore();
}

function antenna(ctx, x, y, dir, len, curl, pal, color, width = 2) {
  ctx.save();
  ctx.lineCap = "round";
  const tipX = x + dir * len * 0.55 + curl * 0.2;
  const tipY = y - len;
  const path = () => {
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(x + dir * len * 0.7, y - len * 0.55, tipX + curl, tipY);
  };
  path();
  ctx.strokeStyle = pal.ink;
  ctx.lineWidth = width + 2.5;
  ctx.stroke();
  path();
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(tipX + curl, tipY, width * 1.2, 0, TAU);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.restore();
}

function foot(ctx, x, y, pal, cfg, flip = 1, gecko = false) {
  ctx.save();
  ctx.translate(x, y);
  if (gecko) {
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.arc(4 + i * 4, -1 + (i === 1 ? -2 : 0) + (i === 2 ? 1 : 0), 2.6, 0, TAU);
      ctx.fillStyle = pal.shell;
      ctx.fill();
      ctx.lineWidth = 1.3;
      ctx.strokeStyle = pal.ink;
      ctx.stroke();
    }
  } else {
    ctx.beginPath();
    ctx.ellipse(2, -1, 8, 4.5, 0.08, 0, TAU);
    ctx.fillStyle = pal.dark;
    ctx.fill();
    ctx.lineWidth = 2.2;
    ctx.strokeStyle = pal.ink;
    ctx.stroke();
    ctx.strokeStyle = pal.ink;
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    for (let i = 0; i < 2; i++) {
      ctx.beginPath();
      ctx.moveTo(6, -2 + i * 2);
      ctx.lineTo(11 + i * 1.5, -3 + i * 2.6);
      ctx.stroke();
    }
  }
  ctx.restore();
}

function drawArm(ctx, shoulder, fist, cfg, color, pal, bend = 9, cuff = true) {
  const dx = fist.x - shoulder.x;
  const dy = fist.y - shoulder.y;
  const d = Math.hypot(dx, dy) || 1;
  const nx = -dy / d;
  const ny = dx / d;
  const elbow = {
    x: (shoulder.x + fist.x) / 2 + nx * bend,
    y: (shoulder.y + fist.y) / 2 + ny * bend,
  };
  limb(ctx, [shoulder, elbow, fist], cfg.arm, color, pal.ink, 2.6);
  // forearm band
  if (cuff) {
    const bx = lerp(elbow.x, fist.x, 0.72);
    const by = lerp(elbow.y, fist.y, 0.72);
    ctx.save();
    ctx.translate(bx, by);
    ctx.rotate(Math.atan2(dy, dx));
    ctx.fillStyle = pal.accent;
    ctx.fillRect(-1.5, -cfg.arm * 0.62, 3.5, cfg.arm * 1.24);
    ctx.strokeStyle = pal.ink;
    ctx.lineWidth = 1.6;
    ctx.strokeRect(-1.5, -cfg.arm * 0.62, 3.5, cfg.arm * 1.24);
    ctx.restore();
  }
  // fist
  ctx.beginPath();
  ctx.arc(fist.x, fist.y, cfg.arm * 0.88, 0, TAU);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = pal.ink;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(fist.x + 1, fist.y - 1.5, cfg.arm * 0.36, 0, TAU);
  ctx.fillStyle = pal.shell;
  ctx.globalAlpha = 0.5;
  ctx.fill();
  ctx.globalAlpha = 1;
}

function drawLeg(ctx, hip, footPos, cfg, color, pal, bend = 1, gecko = false) {
  const mx = (hip.x + footPos.x) / 2;
  const my = (hip.y + footPos.y) / 2;
  const knee = {
    x: mx + 8 * bend + (footPos.x > hip.x ? 4 : -2),
    y: my - 2,
  };
  limb(ctx, [hip, knee, footPos], cfg.leg, color, pal.ink, 2.8);
  foot(ctx, footPos.x, footPos.y, pal, cfg, 1, gecko);
}

function drawTail(ctx, hip, pal, time, air) {
  const sway = Math.sin(time * 2.2) * 7 + (air ? -8 : 0);
  const pts = [
    [hip.x - 10, hip.y + 2],
    [hip.x - 38, hip.y + 18 + sway],
    [hip.x - 66, hip.y + 12 - sway * 0.8],
    [hip.x - 86, hip.y + 26 + sway * 0.4],
  ];
  curve(ctx, pts, 9, pal.body, pal.ink, 3.2);
  ctx.save();
  ctx.fillStyle = pal.dark;
  for (let i = 0; i < 4; i++) {
    const x = hip.x - 28 - i * 14;
    const y = hip.y + 8 + Math.sin(time * 2.2 + i) * 4 + i * 1.5;
    ctx.beginPath();
    ctx.ellipse(x, y, 3.6, 2.4, 0.5, 0, TAU);
    ctx.fill();
  }
  ctx.restore();
}

function drawWing(ctx, x, y, rx, ry, rot, pal, alpha = 0.32) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.beginPath();
  ctx.ellipse(0, 0, rx, ry, 0, 0, TAU);
  ctx.fillStyle = pal.shell;
  ctx.globalAlpha = alpha;
  ctx.fill();
  ctx.globalAlpha = Math.min(1, alpha + 0.35);
  ctx.strokeStyle = pal.ink;
  ctx.lineWidth = 1.7;
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(0, -ry * 0.75);
  ctx.quadraticCurveTo(rx * 0.35, 0, 0, ry * 0.75);
  ctx.strokeStyle = pal.ink;
  ctx.globalAlpha = 0.4;
  ctx.lineWidth = 1.2;
  ctx.stroke();
  ctx.restore();
}

/* ---------------------------------- bodies -------------------------------- */

function bodyBlate(ctx, pose, pal, time, air, guard) {
  const { chest, hip } = pose;
  blob(ctx, hip.x - 7, hip.y - 2, 25, 27, -0.2, pal.dark, pal, 4);
  // elytra split
  ctx.save();
  ctx.strokeStyle = pal.ink;
  ctx.globalAlpha = 0.55;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(hip.x - 9, hip.y - 24);
  ctx.quadraticCurveTo(hip.x - 18, hip.y, hip.x - 9, hip.y + 22);
  ctx.stroke();
  ctx.restore();

  blob(ctx, chest.x, chest.y, 28, 26, -0.05, pal.body, pal, 4.5);
  // shoulder plates
  blob(ctx, chest.x - 16, chest.y - 4, 11, 12, -0.4, pal.dark, pal, 3);
  blob(ctx, chest.x + 9, chest.y + 2, 20, 18, 0.2, pal.body, pal, 0);
  // chest shell
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(chest.x + 1, chest.y - 5, 20, 15, 0.08, 0, TAU);
  ctx.fillStyle = pal.shell;
  ctx.globalAlpha = 0.95;
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.strokeStyle = pal.ink;
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(chest.x - 17, chest.y - 3);
  ctx.quadraticCurveTo(chest.x, chest.y + 12, chest.x + 19, chest.y + 1);
  ctx.strokeStyle = pal.ink;
  ctx.globalAlpha = 0.25;
  ctx.lineWidth = 1.4;
  ctx.stroke();
  ctx.restore();
  // rivets
  ctx.save();
  ctx.fillStyle = pal.ink;
  for (const [dx, dy] of [[-12, 7], [12, 10], [-4, 15]]) {
    ctx.beginPath();
    ctx.arc(chest.x + dx, chest.y + dy, 1.4, 0, TAU);
    ctx.fill();
  }
  ctx.restore();
  // fight scrape
  ctx.save();
  ctx.strokeStyle = pal.shell;
  ctx.globalAlpha = 0.8;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(hip.x + 4, hip.y - 12);
  ctx.lineTo(hip.x + 9, hip.y - 2);
  ctx.stroke();
  ctx.restore();
}

function bodyAntix(ctx, pose, pal, time, air, guard) {
  const { chest, hip } = pose;
  // abdomen
  blob(ctx, hip.x - 10, hip.y - 2, 22, 24, -0.45, pal.dark, pal, 4);
  ctx.save();
  ctx.strokeStyle = pal.accent;
  ctx.globalAlpha = 0.8;
  ctx.lineWidth = 2.2;
  for (let i = 0; i < 2; i++) {
    ctx.beginPath();
    ctx.arc(hip.x - 10, hip.y - 4, 13 + i * 4, -0.5, 1.4);
    ctx.stroke();
  }
  ctx.restore();
  // waist
  limb(ctx, [{ x: hip.x + 1, y: hip.y - 14 }, { x: chest.x, y: chest.y + 18 }], 8, pal.dark, pal.ink, 2.4);
  blob(ctx, chest.x, chest.y, 18, 24, 0.05, pal.body, pal, 4);
  // thorax highlight
  ctx.save();
  ctx.strokeStyle = pal.shell;
  ctx.globalAlpha = 0.35;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(chest.x, chest.y - 2, 10, -2.3, 0.5);
  ctx.stroke();
  ctx.restore();
  // sternum plates
  ctx.save();
  ctx.strokeStyle = pal.ink;
  ctx.globalAlpha = 0.5;
  ctx.lineWidth = 1.5;
  for (let i = 0; i < 2; i++) {
    ctx.beginPath();
    ctx.moveTo(chest.x - 10, chest.y + 5 + i * 6);
    ctx.quadraticCurveTo(chest.x, chest.y + 9 + i * 6, chest.x + 10, chest.y + 4 + i * 6);
    ctx.stroke();
  }
  ctx.restore();
}

function bodySkut(ctx, pose, pal, time, air, guard) {
  const { chest, hip } = pose;
  blob(ctx, hip.x - 8, hip.y - 4, 28, 22, 0.18, pal.dark, pal, 4);
  blob(ctx, chest.x, chest.y, 24, 23, 0.05, pal.body, pal, 4);
  // folded wings
  const spread = air ? 0.9 : 0.15;
  const flutter = Math.sin(time * 28) * (air ? 0.08 : 0);
  ctx.save();
  ctx.translate(chest.x - 4, chest.y + 4);
  ctx.rotate(-spread * 0.35 + flutter);
  for (let i = 0; i < 2; i++) {
    ctx.beginPath();
    ctx.ellipse(-10 - i * 4 - spread * 8, 8 + i * 5, 12 + spread * 5, 26, -0.25 - spread * 0.4 + flutter, 0, TAU);
    ctx.fillStyle = pal.shell;
    ctx.globalAlpha = 0.9;
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.strokeStyle = pal.ink;
    ctx.lineWidth = 2.6;
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.moveTo(chest.x - 2, chest.y);
  ctx.quadraticCurveTo(chest.x - 20, chest.y + 22, hip.x - 6, hip.y + 16);
  ctx.strokeStyle = pal.ink;
  ctx.globalAlpha = 0.5;
  ctx.lineWidth = 1.4;
  ctx.stroke();
  ctx.restore();
  // shell shine
  ctx.save();
  ctx.strokeStyle = pal.accent;
  ctx.globalAlpha = 0.55;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(chest.x, chest.y - 4, 11, -2.1, 0.3);
  ctx.stroke();
  ctx.restore();
}

function bodyGex(ctx, pose, pal, time, air, guard) {
  const { chest, hip } = pose;
  // belly
  blob(ctx, hip.x + 4, hip.y + 2, 20, 22, 0.1, pal.body, pal, 4);
  blob(ctx, hip.x + 10, hip.y + 4, 12, 18, 0.1, pal.shell, pal, 0);
  // spots
  ctx.save();
  ctx.fillStyle = pal.dark;
  ctx.globalAlpha = 0.75;
  const spots = [[-6, -14, 3.2], [8, -22, 2.4], [-12, 4, 2.8], [4, 12, 2.2], [11, -6, 2.5]];
  for (const [dx, dy, r] of spots) {
    ctx.beginPath();
    ctx.arc(hip.x + dx, hip.y + dy, r, 0, TAU);
    ctx.fill();
  }
  ctx.restore();
  blob(ctx, chest.x, chest.y, 24, 27, 0.06, pal.body, pal, 4.5);
  // chest highlight
  blob(ctx, chest.x + 6, chest.y + 3, 12, 18, 0.1, pal.shell, pal, 0);
  ctx.save();
  ctx.fillStyle = pal.dark;
  ctx.globalAlpha = 0.6;
  for (const [dx, dy, r] of [[-8, -10, 2.8], [4, -16, 2], [-13, 6, 2.4], [-3, 16, 2]]) {
    ctx.beginPath();
    ctx.arc(chest.x + dx, chest.y + dy, r, 0, TAU);
    ctx.fill();
  }
  ctx.restore();
  // dorsal ridge
  ctx.save();
  ctx.strokeStyle = pal.dark;
  ctx.globalAlpha = 0.55;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(chest.x - 12, chest.y - 20);
  ctx.quadraticCurveTo(chest.x - 20, chest.y, chest.x - 10, chest.y + 20);
  ctx.stroke();
  ctx.restore();
}

function bodySkito(ctx, pose, pal, time, air, guard) {
  const { chest, hip } = pose;
  // wings behind
  const spread = air || pose.dash ? 1.15 : 0.55;
  const flutter = Math.sin(time * 34) * 0.1;
  drawWing(ctx, chest.x - 10, chest.y - 6, 8.5, 22, -0.95 - spread * 0.25 + flutter, pal, 0.32);
  drawWing(ctx, chest.x - 6, chest.y - 2, 7, 17, -0.55 - spread * 0.3 - flutter, pal, 0.26);
  // abdomen
  blob(ctx, hip.x - 7, hip.y, 11, 24, 0.55, pal.body, pal, 3.5);
  ctx.save();
  ctx.strokeStyle = pal.dark;
  ctx.globalAlpha = 0.75;
  ctx.lineWidth = 2;
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.moveTo(hip.x - 15, hip.y - 8 + i * 9);
    ctx.quadraticCurveTo(hip.x - 4, hip.y - 6 + i * 9, hip.x + 3, hip.y - 10 + i * 9);
    ctx.stroke();
  }
  ctx.restore();
  // thorax
  blob(ctx, chest.x, chest.y, 14, 22, 0.05, pal.body, pal, 4);
  blob(ctx, chest.x + 3, chest.y - 2, 6, 14, 0.05, pal.shell, pal, 0);
  ctx.save();
  ctx.strokeStyle = pal.ink;
  ctx.globalAlpha = 0.5;
  ctx.lineWidth = 1.3;
  ctx.beginPath();
  ctx.moveTo(chest.x - 6, chest.y - 10);
  ctx.quadraticCurveTo(chest.x + 7, chest.y, chest.x - 3, chest.y + 12);
  ctx.stroke();
  ctx.restore();
}

const BODIES = {
  blate: bodyBlate,
  antix: bodyAntix,
  skut: bodySkut,
  gex: bodyGex,
  skito: bodySkito,
};

/* ---------------------------------- heads --------------------------------- */

function headBlate(ctx, pose, pal, opts) {
  const { head } = pose;
  const cfg = BUILD.blate;
  // horn lives behind the head silhouette
  const charge = opts.charge || 0;
  ctx.save();
  ctx.translate(head.x + 2, head.y - 3);
  ctx.rotate(-0.1 + charge * 0.35);
  curve(
    ctx,
    [
      [-3, -10],
      [2 + charge * 6, -33],
      [27 + charge * 8, -39 - charge * 3],
    ],
    9,
    pal.shell,
    pal.ink,
    3.2
  );
  // horn prongs
  curve(ctx, [[25 + charge * 8, -39], [28 + charge * 8, -50], [36 + charge * 8, -48]], 4, pal.shell, pal.ink, 2);
  curve(ctx, [[23 + charge * 8, -37], [21 + charge * 8, -47], [15 + charge * 8, -47]], 3.4, pal.shell, pal.ink, 2);
  ctx.restore();

  // neck
  limb(ctx, [{ x: head.x - 6, y: head.y + 12 }, { x: head.x + 1, y: head.y + 3 }], 13, pal.dark, pal.ink, 2.2);
  blob(ctx, head.x + 2, head.y, cfg.headRX, cfg.headRY, 0.05, pal.body, pal, 4);
  // cheek plate
  blob(ctx, head.x + 9, head.y + 5, 7, 8, 0.2, pal.dark, pal, 0);
  eye(ctx, head.x + 11, head.y - 2, 4.6, pal, { look: 1.4, angry: !opts.hurt });
  // mouth
  ctx.save();
  ctx.strokeStyle = pal.ink;
  ctx.lineWidth = 2.2;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(head.x + 10, head.y + 9);
  ctx.quadraticCurveTo(head.x + 15, head.y + 12, head.x + 18, head.y + 8);
  ctx.stroke();
  ctx.restore();
  // mandible
  curve(ctx, [[head.x + 14, head.y + 9], [head.x + 22, head.y + 9], [head.x + 20, head.y + 2]], 2.4, pal.shell, pal.ink, 1.2);
}

function headAntix(ctx, pose, pal, opts) {
  const { head } = pose;
  antenna(ctx, head.x + 3, head.y - 10, 1, 30, -8, pal, pal.accent, 2);
  antenna(ctx, head.x - 4, head.y - 11, -1, 27, 10, pal, pal.accent, 1.8);
  limb(ctx, [{ x: head.x - 2, y: head.y + 12 }, { x: head.x + 1, y: head.y + 2 }], 9, pal.dark, pal.ink, 2);
  blob(ctx, head.x, head.y, 19, 17, -0.05, pal.body, pal, 4.2);
  // compound eye
  blob(ctx, head.x + 9, head.y - 3, 8, 8.5, 0.2, pal.ink, pal, 0);
  ctx.save();
  ctx.fillStyle = pal.accent;
  ctx.globalAlpha = 0.85;
  ctx.beginPath();
  ctx.arc(head.x + 11, head.y - 5, 3.2, 0, TAU);
  ctx.fill();
  ctx.fillStyle = pal.eye;
  ctx.globalAlpha = 0.8;
  ctx.beginPath();
  ctx.arc(head.x + 9, head.y - 7, 1.3, 0, TAU);
  ctx.fill();
  ctx.restore();
  // mandibles
  curve(ctx, [[head.x + 13, head.y + 8], [head.x + 24, head.y + 11], [head.x + 20, head.y + 2]], 3, pal.accent, pal.ink, 1.6);
  curve(ctx, [[head.x + 8, head.y + 11], [head.x + 17, head.y + 16], [head.x + 13, head.y + 5]], 2.4, pal.accent, pal.ink, 1.4);
  // brow
  ctx.save();
  ctx.strokeStyle = pal.ink;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(head.x - 2, head.y - 8);
  ctx.lineTo(head.x + 6, head.y - 6);
  ctx.stroke();
  ctx.restore();
}

function headSkut(ctx, pose, pal, opts) {
  const { head } = pose;
  const wiggle = Math.sin(opts.time * 3.1) * 5;
  antenna(ctx, head.x + 2, head.y - 8, 1, 46, wiggle, pal, pal.shell, 2.3);
  antenna(ctx, head.x - 3, head.y - 9, -1, 40, -wiggle, pal, pal.shell, 2);
  limb(ctx, [{ x: head.x - 4, y: head.y + 10 }, { x: head.x, y: head.y + 2 }], 10, pal.dark, pal.ink, 2);
  blob(ctx, head.x + 1, head.y, 15, 13, 0.1, pal.body, pal, 4);
  blob(ctx, head.x + 9, head.y + 2, 8, 7, 0.25, pal.dark, pal, 0);
  eye(ctx, head.x + 8, head.y - 2, 3.6, pal, { look: 1, angry: !opts.hurt });
  // grubby little mouth
  ctx.save();
  ctx.strokeStyle = pal.ink;
  ctx.lineWidth = 1.8;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(head.x + 9, head.y + 8);
  ctx.lineTo(head.x + 14, head.y + 9);
  ctx.stroke();
  ctx.restore();
}

function headGex(ctx, pose, pal, opts) {
  const { head } = pose;
  limb(ctx, [{ x: head.x - 5, y: head.y + 13 }, { x: head.x - 1, y: head.y + 3 }], 12, pal.body, pal.ink, 2.2);
  // head + jaw
  blob(ctx, head.x + 1, head.y, 21, 17, 0.04, pal.body, pal, 4.4);
  blob(ctx, head.x + 11, head.y + 8, 11, 9, 0.15, pal.shell, pal, 0);
  // crest spikes
  ctx.save();
  ctx.fillStyle = pal.dark;
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.moveTo(head.x - 10 + i * 6, head.y - 12);
    ctx.lineTo(head.x - 7 + i * 6, head.y - 19 - (i === 1 ? 2 : 0));
    ctx.lineTo(head.x - 3 + i * 6, head.y - 11);
    ctx.fill();
  }
  ctx.restore();
  // eye
  blob(ctx, head.x + 8, head.y - 5, 8, 9, 0.1, pal.eye, pal, 2);
  ctx.save();
  ctx.fillStyle = pal.ink;
  ctx.beginPath();
  ctx.ellipse(head.x + 10, head.y - 5, 2.2, 6.3, 0.05, 0, TAU);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(head.x + 7, head.y - 8, 1.4, 0, TAU);
  ctx.fillStyle = "#FFFDF4";
  ctx.fill();
  ctx.restore();
  // smile
  ctx.save();
  ctx.strokeStyle = pal.ink;
  ctx.lineWidth = 2;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(head.x + 4, head.y + 10);
  ctx.quadraticCurveTo(head.x + 15, head.y + 15, head.x + 21, head.y + 8);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(head.x + 21, head.y + 5, 1.2, 0, TAU);
  ctx.fillStyle = pal.ink;
  ctx.fill();
  ctx.restore();
  // nostril
  ctx.save();
  ctx.fillStyle = pal.ink;
  ctx.beginPath();
  ctx.arc(head.x + 18, head.y + 1, 1, 0, TAU);
  ctx.fill();
  ctx.restore();
}

function headSkito(ctx, pose, pal, opts) {
  const { head } = pose;
  antenna(ctx, head.x, head.y - 7, 1, 20, 4, pal, pal.accent, 1.3);
  antenna(ctx, head.x - 3, head.y - 8, -1, 18, -3, pal, pal.accent, 1.2);
  limb(ctx, [{ x: head.x - 4, y: head.y + 12 }, { x: head.x, y: head.y + 2 }], 7, pal.dark, pal.ink, 1.8);
  blob(ctx, head.x, head.y, 12, 12, 0.05, pal.body, pal, 3.5);
  // compound eyes
  blob(ctx, head.x + 5, head.y - 3, 7.5, 8, 0.25, pal.dark, pal, 1.4);
  blob(ctx, head.x - 4, head.y - 4, 5, 6, 0.2, pal.dark, pal, 1.2);
  ctx.save();
  ctx.fillStyle = pal.accent;
  ctx.globalAlpha = 0.9;
  ctx.beginPath();
  ctx.arc(head.x + 7, head.y - 5, 2.2, 0, TAU);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(head.x - 3, head.y - 6, 1.4, 0, TAU);
  ctx.fill();
  ctx.globalAlpha = 0.5;
  ctx.fillStyle = CREAM;
  ctx.beginPath();
  ctx.arc(head.x + 9, head.y - 7, 1, 0, TAU);
  ctx.fill();
  ctx.restore();
  // proboscis
  const extend = opts.charge || 0;
  ctx.save();
  ctx.strokeStyle = pal.ink;
  ctx.lineWidth = 3.4;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(head.x + 6, head.y + 5);
  ctx.lineTo(head.x + 24 + extend * 8, head.y + 11 + extend * 2);
  ctx.stroke();
  ctx.strokeStyle = pal.accent;
  ctx.lineWidth = 1.2;
  ctx.stroke();
  ctx.restore();
}

const HEADS = {
  blate: headBlate,
  antix: headAntix,
  skut: headSkut,
  gex: headGex,
  skito: headSkito,
};

/* ----------------------------------- rig ---------------------------------- */

function drawRig(ctx, f, time, pal, opts = {}) {
  const def = f.def;
  const cfg = BUILD[def.id];
  const state = f.state;
  const a = f.attack;
  const attackT = f.attackT || 0;
  const attackKind = a?.kind || "";
  const airborne = !f.onGround && state !== "ko" && state !== "down";
  const lying = (state === "ko" || state === "down") && f.onGround;
  const isKO = state === "ko";

  let crouch = lying ? 0 : (f.crouchAmt || 0);
  if (a && (attackKind === "lightCrouch" || attackKind === "sweep")) crouch = Math.max(crouch, 0.85);
  if (a && attackKind === "charge") crouch = Math.max(crouch, 0.42);
  if (a && attackKind === "skitter") crouch = Math.max(crouch, 0.72);
  if (state === "blockstun") crouch = Math.max(crouch, 0.12);

  let ext = 0;
  if (a) {
    const su = a.startup;
    const ac = a.active;
    const rc = a.recovery || 0.1;
    if (attackT < su) ext = -0.36 * Math.sin(clamp(attackT / Math.max(su, 0.001), 0, 1) * (Math.PI / 2));
    else if (attackT < su + ac) ext = 1;
    else ext = Math.max(0, 1 - (attackT - su - ac) / rc);
  }

  const walk = state === "walk" && !lying;
  const phase = f.walkPhase || 0;
  const stride = walk ? Math.sin(phase) * 15 : 0;
  const liftF = walk ? Math.max(0, Math.sin(phase)) * 8 : 0;
  const liftB = walk ? Math.max(0, Math.sin(phase + Math.PI)) * 7 : 0;
  const bob = lying ? 0 : walk ? Math.abs(Math.cos(phase)) * 1.5 : Math.sin((f.anim || time) * 2.25) * 1.1;
  const airTuck = airborne ? 5 : 0;

  let lean = 0;
  if (a) {
    if (attackKind === "heavy") lean = ext * 7;
    else if (attackKind === "charge") lean = ext * 13 + (ext > 0 ? 6 : 0);
    else if (attackKind === "flurry") lean = ext * 4;
    else if (attackKind === "tongue") lean = 3 + ext * 4;
    else if (attackKind === "dive") lean = 8;
    else if (attackKind === "skitter") lean = 9;
    else if (attackKind === "sweep") lean = 4;
    else lean = ext * 4;
  }
  if (state === "hurt") lean = -8;
  if (state === "blockstun" || f.guardHeld) lean = -2;
  if (state === "win") lean = -2;

  const hip = {
    x: -2 + lean * 0.25 + (state === "hurt" ? -8 : 0),
    y: -50 + crouch * 18 + bob - airTuck,
  };
  const chest = {
    x: lean * 0.65 + (state === "hurt" ? -5 : 0),
    y: -86 + crouch * 31 + bob * 1.1 - airTuck - 3,
  };
  const head = {
    x: chest.x + 7 + (state === "hurt" ? -4 : 0) + (attackKind === "charge" ? ext * 8 : 0),
    y: -106 + crouch * 39 + bob * 1.2 - airTuck - 5,
  };

  // leg placement
  let frontFoot = { x: 16, y: 0 };
  let backFoot = { x: -16, y: 0 };
  if (walk) {
    frontFoot = { x: 16 + stride, y: -liftF };
    backFoot = { x: -16 - stride, y: -liftB };
  }
  if (crouch > 0.05) {
    frontFoot = { x: 24 + crouch * 4, y: 0 };
    backFoot = { x: -21 - crouch * 5, y: 0 };
  }
  if (airborne) {
    frontFoot = { x: 17, y: -19 };
    backFoot = { x: -3, y: -30 };
  }
  if (attackKind === "sweep" && !lying) {
    frontFoot = { x: 59 + ext * 15, y: -8 - ext * 5 };
    backFoot = { x: -20, y: 0 };
  }
  if (state === "hurt") {
    frontFoot = { x: 22, y: -2 };
    backFoot = { x: -10, y: 0 };
  }
  if (state === "down" && !f.onGround) {
    frontFoot = { x: 22, y: -14 };
    backFoot = { x: -8, y: -22 };
  }

  // arm targets
  const frontGuard = { x: chest.x + 22, y: chest.y + 11 };
  const backGuard = { x: chest.x + 5, y: chest.y + 18 };
  let frontFist = { ...frontGuard };
  let backFist = { ...backGuard };
  let frontBend = 9;
  let backBend = 10;

  const guard = f.guardHeld || state === "blockstun";
  if (guard && !a) {
    frontFist = { x: chest.x + 17, y: head.y + 9 };
    backFist = { x: chest.x + 7, y: head.y + 22 };
    frontBend = 7;
    backBend = 8;
  }

  if (a) {
    if (["light", "heavy", "lightCrouch", "airLight", "airHeavy"].includes(attackKind)) {
      const hits = {
        light: { x: 47, y: chest.y + 7 },
        lightCrouch: { x: 46, y: chest.y + 25 },
        heavy: { x: 68, y: chest.y + 2 },
        airLight: { x: 49, y: chest.y + 16 },
        airHeavy: { x: 61, y: chest.y + 30 },
      };
      const hit = hits[attackKind];
      const e = clamp(ext, 0, 1);
      frontFist = {
        x: lerp(frontGuard.x, hit.x + lean, e) - (ext < 0 ? -ext * 18 : 0),
        y: lerp(frontGuard.y, hit.y, e),
      };
      if (ext < 0) {
        frontFist.x = frontGuard.x + ext * 16;
        frontFist.y = frontGuard.y + 5;
      }
      if (attackKind === "heavy") {
        backFist = { x: backGuard.x - 11 * Math.max(0, ext), y: backGuard.y + 3 };
        backBend = 6;
        frontBend = 13;
      }
      if (attackKind === "airHeavy") {
        frontBend = 4;
      }
    } else if (attackKind === "sweep") {
      frontFist = { x: chest.x + 28, y: chest.y + 6 };
      backFist = { x: chest.x - 18, y: chest.y + 14 };
      frontBend = 5;
      backBend = 12;
    } else if (attackKind === "flurry") {
      const interval = a.hitInterval || 0.05;
      const alt = Math.floor(Math.max(0, attackT - a.startup) / interval) % 2;
      const e = clamp(ext, 0, 1);
      const hitF = { x: 45, y: chest.y + 8 };
      const hitB = { x: 33, y: chest.y - 1 };
      if (alt === 0) {
        frontFist = { x: lerp(frontGuard.x, hitF.x, e), y: lerp(frontGuard.y, hitF.y, e) };
        backFist = { x: backGuard.x, y: backGuard.y };
        frontBend = 4;
      } else {
        backFist = { x: lerp(backGuard.x, hitB.x, e), y: lerp(backGuard.y, hitB.y, e) };
        frontFist = { x: frontGuard.x + 4, y: frontGuard.y - 2 };
        backBend = 3;
      }
    } else if (attackKind === "charge") {
      frontFist = { x: chest.x - 15 - ext * 8, y: chest.y + 15 };
      backFist = { x: chest.x - 25 - ext * 6, y: chest.y + 22 };
      frontBend = 4;
      backBend = 5;
    } else if (attackKind === "tongue") {
      frontFist = { x: chest.x + 30, y: chest.y + 9 };
      backFist = { x: backGuard.x, y: backGuard.y + 2 };
      frontBend = 6;
    } else if (attackKind === "skitter") {
      frontFist = { x: chest.x - 13, y: chest.y + 13 };
      backFist = { x: chest.x - 23, y: chest.y + 20 };
      frontBend = 4;
    } else if (attackKind === "dive") {
      frontFist = { x: chest.x + 36, y: chest.y - 2 };
      backFist = { x: chest.x - 8, y: chest.y + 12 };
      frontBend = 4;
    }
  }

  if (state === "hurt") {
    frontFist = { x: chest.x - 3, y: chest.y - 2 };
    backFist = { x: chest.x - 16, y: chest.y + 10 };
  }
  if (state === "win") {
    const pump = Math.sin(time * 4) * 3;
    frontFist = { x: chest.x + 27, y: head.y - 26 + pump };
    backFist = { x: chest.x - 23, y: head.y - 21 - pump };
    frontBend = 7;
    backBend = 8;
  }

  const shoulderF = { x: chest.x + 5, y: chest.y + 1 };
  const shoulderB = { x: chest.x - 6, y: chest.y + 5 };

  // ---- draw order ----
  if (def.id === "gex") drawTail(ctx, hip, pal, time, airborne);

  // extra little insect legs tucked behind
  if (["blate", "antix", "skut"].includes(def.id)) {
    ctx.save();
    ctx.globalAlpha = 0.75;
    curve(
      ctx,
      [
        [hip.x - 12, hip.y - 6],
        [hip.x - 30, hip.y - 12 - crouch * 4],
        [hip.x - 34, hip.y + 8],
      ],
      2.5,
      pal.dark,
      pal.ink,
      1.4
    );
    curve(
      ctx,
      [
        [hip.x - 15, hip.y + 2],
        [hip.x - 32, hip.y + 5],
        [hip.x - 37, hip.y + 18],
      ],
      2.2,
      pal.dark,
      pal.ink,
      1.2
    );
    ctx.restore();
  }

  drawLeg(ctx, hip, backFoot, { ...cfg, leg: cfg.leg * 0.92 }, pal.dark, pal, 0.6, def.id === "gex");
  drawArm(ctx, shoulderB, backFist, cfg, pal.dark, pal, backBend, false);

  // roach wings need to sit behind body, mosquito done in bodySkito
  BODIES[def.id](ctx, { chest, hip, crouch, lean, dash: !!a?.dash }, pal, time, airborne, guard);

  drawLeg(ctx, hip, frontFoot, cfg, pal.body, pal, 1.25, def.id === "gex");

  HEADS[def.id](ctx, { head, chest, hip }, pal, {
    time,
    hurt: state === "hurt",
    charge: attackKind === "charge" && ext > 0.2 ? 1 : 0,
    dead: isKO,
    guard,
  });

  drawArm(ctx, shoulderF, frontFist, cfg, pal.body, pal, frontBend, true);

  // ---- attack fx ----
  if (a && ext > 0.15) {
    if (attackKind === "heavy") {
      ctx.save();
      ctx.globalAlpha = 0.4 * ext;
      ctx.strokeStyle = pal.accent;
      ctx.lineWidth = 3;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.arc(shoulderF.x + 2, shoulderF.y - 4, 56, -0.7, 0.35);
      ctx.stroke();
      ctx.restore();
    }
    if (attackKind === "flurry") {
      ctx.save();
      ctx.globalAlpha = 0.28 * ext;
      ctx.fillStyle = pal.accent;
      ctx.beginPath();
      ctx.arc(frontFist.x + 12, frontFist.y + 1, cfg.arm * 0.9, 0, TAU);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(frontFist.x + 24, frontFist.y + 3, cfg.arm * 0.7, 0, TAU);
      ctx.fill();
      ctx.restore();
    }
    if (attackKind === "sweep") {
      ctx.save();
      ctx.globalAlpha = 0.35 * ext;
      ctx.strokeStyle = pal.accent;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, -8, 58 + ext * 18, -0.4, 0.55);
      ctx.stroke();
      ctx.restore();
    }
    if (attackKind === "charge") {
      ctx.save();
      ctx.globalAlpha = 0.5;
      ctx.strokeStyle = pal.accent;
      ctx.lineWidth = 2.4;
      ctx.lineCap = "round";
      for (let i = 0; i < 4; i++) {
        const y = -38 - i * 17;
        ctx.beginPath();
        ctx.moveTo(-38 - i * 8, y);
        ctx.lineTo(-74 - i * 12, y + 2);
        ctx.stroke();
      }
      ctx.restore();
    }
    if (attackKind === "skitter") {
      ctx.save();
      ctx.globalAlpha = 0.25;
      ctx.strokeStyle = pal.accent;
      ctx.lineWidth = 2;
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(-28 - i * 18, -28 - i * 9);
        ctx.lineTo(-48 - i * 18, -28 - i * 9);
        ctx.stroke();
      }
      ctx.restore();
    }
    if (attackKind === "dive") {
      ctx.save();
      ctx.globalAlpha = 0.4;
      ctx.strokeStyle = pal.accent;
      ctx.lineWidth = 2;
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(-18 - i * 12, -86 + i * 14);
        ctx.lineTo(-46 - i * 18, -76 + i * 14);
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  // gecko tongue drawn above the arm
  if (a && attackKind === "tongue") {
    const su = a.startup;
    const ac = a.active;
    const rc = a.recovery;
    let e = 0;
    if (attackT < su) e = 0;
    else if (attackT < su + ac) e = (attackT - su) / ac;
    else e = Math.max(0, 1 - (attackT - su - ac) / rc);
    if (e > 0.02) {
      const reach = (a.ox + a.w * 0.5) * 0.94;
      const tipX = head.x + 16 + reach * e;
      const tipY = head.y + 16 + Math.sin(e * Math.PI) * -4;
      ctx.save();
      ctx.lineCap = "round";
      ctx.strokeStyle = pal.ink;
      ctx.lineWidth = 6.5;
      ctx.beginPath();
      ctx.moveTo(head.x + 12, head.y + 10);
      ctx.quadraticCurveTo(head.x + reach * 0.45 * e, head.y + 20, tipX, tipY);
      ctx.stroke();
      ctx.strokeStyle = "#E87987";
      ctx.lineWidth = 3.6;
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(tipX, tipY);
      ctx.lineTo(tipX + 5, tipY - 5);
      ctx.moveTo(tipX, tipY);
      ctx.lineTo(tipX + 5, tipY + 4);
      ctx.strokeStyle = "#E87987";
      ctx.lineWidth = 2.5;
      ctx.stroke();
      ctx.restore();
    }
  }

  // guard glint
  if (guard && !a) {
    ctx.save();
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = CREAM;
    ctx.beginPath();
    ctx.arc(frontFist.x + 6, frontFist.y - 6, 2, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  if (isKO) {
    ctx.save();
    ctx.globalAlpha = 0.8;
    ctx.fillStyle = pal.accent;
    for (let i = 0; i < 3; i++) {
      const a0 = time * 2 + (i * TAU) / 3;
      ctx.beginPath();
      ctx.arc(head.x + Math.cos(a0) * 20, head.y - 20 + Math.sin(a0) * 5, 2.2, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  // win flourish
  if (state === "win") {
    ctx.save();
    ctx.globalAlpha = 0.55;
    ctx.fillStyle = pal.accent;
    for (let i = 0; i < 4; i++) {
      const px = chest.x + Math.sin(time * 2 + i * 2) * 34;
      const py = head.y - 34 - ((time * 24 + i * 28) % 60);
      ctx.beginPath();
      ctx.arc(px, py, 2.2, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }
}

export function drawSpecimen(ctx, def, x, y, scale, facing, time, opts = {}) {
  const dummy = {
    def,
    x,
    y,
    facing,
    state: opts.state || "idle",
    anim: time,
    walkPhase: time * 6,
    crouchAmt: 0,
    onGround: true,
    attack: null,
    attackT: 0,
    flash: 0,
    guardHeld: false,
    koLanded: true,
  };
  const pal = def.colors;
  // shadow
  ctx.save();
  ctx.globalAlpha = 0.32;
  ctx.fillStyle = "#050407";
  ctx.beginPath();
  ctx.ellipse(x, y + 4, 34 * scale, 7 * scale, 0, 0, TAU);
  ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale * facing, scale);
  drawRig(ctx, dummy, time, pal);
  ctx.restore();
}

export function drawFighter(ctx, f, time) {
  const pal = f.flash > 0 && Math.floor(f.flash * 40) % 2 === 0 ? flashPalette(f.def.colors) : f.def.colors;
  const height = GROUND_Y - f.y;
  const airFactor = clamp(1 - height / 380, 0.25, 1);
  ctx.save();
  ctx.globalAlpha = 0.36 * airFactor;
  ctx.fillStyle = "#050407";
  ctx.beginPath();
  ctx.ellipse(f.x, GROUND_Y + 5, 40 * airFactor + 8, 8 * airFactor + 1.5, 0, 0, TAU);
  ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.translate(f.x, f.y);
  ctx.scale(f.facing, 1);

  const isLie = (f.state === "ko" || f.state === "down") && (f.onGround || f.stateT > 0.5);
  if (isLie) {
    const rot = f.onGround ? -1.34 : -Math.min(1.34, Math.max(0.2, f.stateT * 2.6));
    ctx.translate(0, f.onGround ? -7 : -2);
    ctx.rotate(rot);
  } else if (f.state === "ko" || f.state === "down") {
    ctx.rotate(-0.2);
  }

  drawRig(ctx, f, time, pal, { lying: isLie });
  ctx.restore();
}

function flashPalette(pal) {
  return {
    body: "#FFF7E7",
    dark: "#E9D9BF",
    shell: "#FFFFFF",
    accent: "#FFE0B0",
    ink: pal.ink,
    eye: "#FFFFFF",
  };
}
