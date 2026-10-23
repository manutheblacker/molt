// ROOFTOP 07 — one sun, two hundred windows, zero witnesses.

const CREAM = "#F2E8D5";
const SUN_X = 902;
const SUN_Y = 402;
const SUN_R = 238;
const GROUND = 604;

function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function makeBuildings() {
  const r = rng(20261022);
  const far = [
    { x: -40, w: 138, h: 205 },
    { x: 92, w: 92, h: 142 },
    { x: 176, w: 156, h: 246 },
    { x: 322, w: 112, h: 176 },
    { x: 428, w: 180, h: 214 },
    { x: 600, w: 108, h: 152 },
    { x: 700, w: 168, h: 234 },
    { x: 860, w: 128, h: 190 },
    { x: 980, w: 160, h: 220 },
    { x: 1130, w: 190, h: 252 },
  ];
  for (const b of far) {
    b.windows = [];
    const cols = Math.floor((b.w - 22) / 16);
    const rows = Math.floor((b.h - 24) / 22);
    for (let i = 0; i < cols; i++) {
      for (let j = 0; j < rows; j++) {
        if (r() < 0.17) {
          b.windows.push({
            x: b.x + 12 + i * 16,
            y: GROUND - b.h + 16 + j * 22,
            a: 0.25 + r() * 0.6,
          });
        }
      }
    }
  }

  const near = [
    { x: -80, w: 220, h: 165, roof: "vents" },
    { x: 118, w: 130, h: 120, roof: "antenna" },
    { x: 236, w: 190, h: 210, roof: "step" },
    { x: 414, w: 120, h: 140, roof: "ac" },
    { x: 528, w: 210, h: 185, roof: "billboard" },
    { x: 728, w: 138, h: 128, roof: "tank" },
    { x: 854, w: 196, h: 170, roof: "sign" },
    { x: 1042, w: 270, h: 215, roof: "water" },
  ];
  for (const b of near) {
    b.windows = [];
    const cols = Math.floor((b.w - 26) / 26);
    const rows = Math.floor((b.h - 30) / 30);
    for (let i = 0; i < cols; i++) {
      for (let j = 0; j < rows; j++) {
        const lit = r();
        if (lit < 0.3) {
          b.windows.push({
            x: b.x + 16 + i * 26,
            y: GROUND - b.h + 20 + j * 30,
            w: 8,
            h: 11,
            a: 0.15 + lit * 1.4,
          });
        }
      }
    }
  }
  return { far, near };
}

const SKYLINE = makeBuildings();

const MOTES = Array.from({ length: 28 }, (_, i) => {
  const r = rng(900 + i * 13);
  return {
    x: 30 + r() * 1220,
    y: 140 + r() * 440,
    size: 0.8 + r() * 2,
    speed: 4 + r() * 12,
    phase: r() * Math.PI * 2,
    drift: -5 + r() * 10,
  };
});

let grain = null;
function makeGrain() {
  const c = document.createElement("canvas");
  c.width = 160;
  c.height = 160;
  const g = c.getContext("2d");
  const img = g.createImageData(160, 160);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = Math.random() * 255;
    img.data[i] = v;
    img.data[i + 1] = v;
    img.data[i + 2] = v;
    img.data[i + 3] = Math.random() < 0.5 ? 0 : Math.random() * 26;
  }
  g.putImageData(img, 0, 0);
  return c;
}

function building(ctx, b, color, rim, windows) {
  const top = GROUND - b.h;
  ctx.fillStyle = color;
  ctx.fillRect(b.x, top, b.w, b.h);

  if (rim) {
    ctx.fillStyle = rim;
    ctx.globalAlpha = 0.4;
    ctx.fillRect(b.x, top, b.w, 1.5);
    ctx.globalAlpha = 1;
  }

  for (const w of windows) {
    ctx.fillStyle = "#F0A85E";
    ctx.globalAlpha = w.a;
    ctx.fillRect(w.x, w.y, w.w || 3, w.h || 5);
  }
  ctx.globalAlpha = 1;

  // rooftop clutter silhouette
  ctx.fillStyle = color;
  if (b.roof === "water") {
    // water tower
    const tx = b.x + b.w * 0.62;
    const ty = top - 74;
    ctx.fillRect(tx - 26, ty + 20, 5, 56);
    ctx.fillRect(tx + 21, ty + 20, 5, 56);
    ctx.beginPath();
    ctx.moveTo(tx - 34, ty + 22);
    ctx.lineTo(tx - 26, ty);
    ctx.lineTo(tx + 26, ty);
    ctx.lineTo(tx + 34, ty + 22);
    ctx.closePath();
    ctx.fill();
    ctx.fillRect(tx - 34, ty + 20, 68, 8);
    ctx.beginPath();
    ctx.moveTo(tx - 28, ty - 2);
    ctx.lineTo(tx, ty - 22);
    ctx.lineTo(tx + 28, ty - 2);
    ctx.fill();
    ctx.fillStyle = rim;
    ctx.globalAlpha = 0.3;
    ctx.fillRect(tx - 34, ty + 20, 68, 1.2);
    ctx.globalAlpha = 1;
  } else if (b.roof === "antenna") {
    ctx.fillRect(b.x + 28, top - 62, 3, 62);
    ctx.fillRect(b.x + 16, top - 44, 30, 2);
    ctx.fillRect(b.x + 22, top - 54, 18, 2);
  } else if (b.roof === "step") {
    ctx.fillRect(b.x + 34, top - 26, 42, 26);
    ctx.fillRect(b.x + 44, top - 38, 24, 12);
    ctx.fillRect(b.x + 62, top - 51, 2.5, 15);
  } else if (b.roof === "ac") {
    ctx.fillRect(b.x + 18, top - 22, 48, 22);
    ctx.fillRect(b.x + 26, top - 28, 22, 6);
    ctx.strokeStyle = rim;
    ctx.globalAlpha = 0.25;
    ctx.lineWidth = 1;
    ctx.strokeRect(b.x + 23, top - 17, 38, 11);
    ctx.globalAlpha = 1;
  } else if (b.roof === "tank") {
    ctx.fillRect(b.x + 18, top - 34, 4, 34);
    ctx.fillRect(b.x + 48, top - 34, 4, 34);
    ctx.beginPath();
    ctx.ellipse(b.x + 35, top - 42, 20, 12, 0, 0, Math.PI * 2);
    ctx.fill();
  } else if (b.roof === "billboard") {
    ctx.fillRect(b.x + 30, top - 92, 3, 92);
    ctx.fillRect(b.x + 96, top - 100, 3, 100);
    ctx.fillRect(b.x + 20, top - 92, 92, 42);
    ctx.fillStyle = "#1A1219";
    ctx.fillRect(b.x + 26, top - 86, 80, 30);
    ctx.fillStyle = "#D96B45";
    ctx.globalAlpha = 0.6;
    ctx.font = "18px Anton, sans-serif";
    ctx.fillText("MOLT", b.x + 32, top - 64);
    ctx.globalAlpha = 1;
  } else if (b.roof === "sign") {
    ctx.fillRect(b.x + 18, top - 54, 2, 54);
    ctx.fillStyle = "#1A1118";
    ctx.fillRect(b.x + 4, top - 54, 30, 58);
    ctx.strokeStyle = "#E4572E";
    ctx.globalAlpha = 0.75;
    ctx.lineWidth = 1;
    ctx.strokeRect(b.x + 5, top - 53, 28, 56);
    ctx.font = "9px 'Space Mono', monospace";
    ctx.fillStyle = "#F0A85E";
    ctx.textAlign = "center";
    ctx.fillText("HOTEL", b.x + 19, top - 38);
    ctx.fillText("VAC", b.x + 19, top - 25);
    ctx.globalAlpha = 1;
    ctx.textAlign = "left";
  } else if (b.roof === "vents") {
    ctx.fillRect(b.x + 120, top - 28, 24, 28);
    ctx.fillRect(b.x + 150, top - 17, 18, 17);
  }
}

export function drawStage(ctx, time, opts = {}) {
  if (!grain) grain = makeGrain();
  const dim = opts.dim || 0;

  // ---------------- sky
  const sky = ctx.createLinearGradient(0, 0, 0, GROUND);
  sky.addColorStop(0, "#08080e");
  sky.addColorStop(0.32, "#171120");
  sky.addColorStop(0.6, "#3a1d2a");
  sky.addColorStop(0.82, "#7c3831");
  sky.addColorStop(1, "#b8583b");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, 1280, GROUND);

  // sun halo
  const halo = ctx.createRadialGradient(SUN_X, SUN_Y, SUN_R * 0.4, SUN_X, SUN_Y, SUN_R * 1.9);
  halo.addColorStop(0, "rgba(240,156,96,0.24)");
  halo.addColorStop(0.5, "rgba(228,87,46,0.08)");
  halo.addColorStop(1, "rgba(228,87,46,0)");
  ctx.fillStyle = halo;
  ctx.fillRect(0, 0, 1280, GROUND);

  // sun
  ctx.save();
  ctx.globalAlpha = 0.96;
  const sunGrad = ctx.createLinearGradient(0, SUN_Y - SUN_R, 0, SUN_Y + SUN_R);
  sunGrad.addColorStop(0, "#F6E9CB");
  sunGrad.addColorStop(0.6, "#F0D4A5");
  sunGrad.addColorStop(1, "#E8AE7B");
  ctx.fillStyle = sunGrad;
  ctx.beginPath();
  ctx.arc(SUN_X, SUN_Y, SUN_R, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 0.18;
  ctx.strokeStyle = "#E4572E";
  ctx.lineWidth = 1.5;
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.arc(SUN_X, SUN_Y, SUN_R + 14 + i * 13, 0, Math.PI * 2);
    ctx.stroke();
  }
  // graphic haze bands
  ctx.globalAlpha = 0.1;
  ctx.fillStyle = "#3a1d2a";
  for (let i = 0; i < 4; i++) {
    ctx.fillRect(SUN_X - SUN_R, SUN_Y + 30 + i * 34, SUN_R * 2, 5 + i * 1.5);
  }
  ctx.restore();

  // thin clouds
  ctx.save();
  ctx.globalAlpha = 0.16;
  ctx.fillStyle = "#F5D9B0";
  for (let i = 0; i < 3; i++) {
    const y = 210 + i * 52;
    const x = ((time * (2 + i) + i * 310) % 1600) - 160;
    ctx.fillRect(x, y, 220 + i * 60, 2.5);
    ctx.fillRect(x + 60, y + 7, 120, 1.5);
  }
  ctx.restore();

  // birds
  ctx.save();
  ctx.strokeStyle = "#1A1118";
  ctx.globalAlpha = 0.55;
  ctx.lineWidth = 1.7;
  ctx.lineCap = "round";
  for (let i = 0; i < 3; i++) {
    const bx = 610 + i * 34 + Math.sin(time * 0.15 + i) * 8;
    const by = 236 + i * 14 + Math.cos(time * 0.3 + i) * 3;
    const flap = Math.sin(time * 3 + i * 2) * 3;
    ctx.beginPath();
    ctx.moveTo(bx - 7, by + flap);
    ctx.quadraticCurveTo(bx - 3, by - 4, bx, by);
    ctx.quadraticCurveTo(bx + 3, by - 4, bx + 7, by + flap);
    ctx.stroke();
  }
  ctx.restore();

  // ---------------- far skyline
  for (const b of SKYLINE.far) {
    building(ctx, b, "#241724", "#D07A50", b.windows);
  }

  // horizon haze
  const haze = ctx.createLinearGradient(0, 430, 0, GROUND);
  haze.addColorStop(0, "rgba(224,121,75,0)");
  haze.addColorStop(0.62, "rgba(224,121,75,0.12)");
  haze.addColorStop(1, "rgba(23,14,22,0.5)");
  ctx.fillStyle = haze;
  ctx.fillRect(0, 430, 1280, GROUND - 430);

  // ---------------- near skyline
  for (const b of SKYLINE.near) {
    building(ctx, b, "#100d15", "#B76A48", b.windows);
  }

  // ---------------- hanging cable + lanterns
  ctx.save();
  ctx.strokeStyle = "#0B0910";
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(760, 284);
  ctx.quadraticCurveTo(1020, 330, 1280, 300);
  ctx.stroke();
  for (let i = 0; i < 3; i++) {
    const lx = 872 + i * 132;
    const ly = 303 + i * 3;
    const sway = Math.sin(time * 1.1 + i) * 1.4;
    ctx.strokeStyle = "#0B0910";
    ctx.beginPath();
    ctx.moveTo(lx, ly);
    ctx.lineTo(lx + sway, ly + 17);
    ctx.stroke();
    ctx.fillStyle = "#E4572E";
    ctx.globalAlpha = 0.75;
    ctx.beginPath();
    ctx.ellipse(lx + sway, ly + 25, 5, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 0.18;
    ctx.fillStyle = "#F6C87B";
    ctx.beginPath();
    ctx.arc(lx + sway, ly + 24, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
  ctx.restore();

  // ---------------- rooftop
  ctx.fillStyle = "#0B0910";
  ctx.fillRect(0, GROUND, 1280, 720 - GROUND);

  // rim light on the ledge
  const rim = ctx.createLinearGradient(0, GROUND - 3, 0, GROUND + 2);
  rim.addColorStop(0, "rgba(242,232,213,0)");
  rim.addColorStop(0.5, "rgba(242,232,213,0.5)");
  rim.addColorStop(1, "rgba(242,232,213,0.08)");
  ctx.fillStyle = rim;
  ctx.fillRect(0, GROUND - 3, 1280, 5);

  // roof texture
  ctx.save();
  ctx.strokeStyle = "#221923";
  ctx.globalAlpha = 0.7;
  ctx.lineWidth = 1;
  for (let i = 0; i < 9; i++) {
    const y = GROUND + 16 + i * 12;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(1280, y);
    ctx.stroke();
  }
  ctx.globalAlpha = 0.35;
  ctx.strokeStyle = "#3a2830";
  for (let i = 0; i < 14; i++) {
    const x = 40 + i * 96;
    ctx.beginPath();
    ctx.moveTo(x, GROUND + 4);
    ctx.lineTo(x + 18, 720);
    ctx.stroke();
  }
  ctx.restore();

  // stage stencil
  ctx.save();
  ctx.fillStyle = CREAM;
  ctx.globalAlpha = 0.24;
  ctx.font = "11px 'Space Mono', monospace";
  ctx.textAlign = "left";
  ctx.fillText("ROOFTOP 07", 24, GROUND + 34);
  ctx.globalAlpha = 0.14;
  ctx.fillText("NO SMOKING / NO WITNESSES", 24, GROUND + 50);
  ctx.textAlign = "right";
  ctx.fillText("SECTOR 05", 1256, GROUND + 34);
  ctx.restore();

  // foreground vent left
  ctx.save();
  ctx.fillStyle = "#08070b";
  ctx.fillRect(-8, GROUND - 54, 78, 54);
  ctx.fillRect(10, GROUND - 76, 46, 22);
  ctx.strokeStyle = "#241922";
  ctx.lineWidth = 1.4;
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.moveTo(6, GROUND - 44 + i * 9);
    ctx.lineTo(60, GROUND - 44 + i * 9);
    ctx.stroke();
  }
  ctx.fillStyle = "#B76A48";
  ctx.globalAlpha = 0.35;
  ctx.fillRect(-8, GROUND - 54, 78, 1.2);
  ctx.restore();

  // foreground chain right
  ctx.save();
  ctx.strokeStyle = "#08070b";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(1218, GROUND);
  ctx.lineTo(1218, GROUND - 60);
  ctx.stroke();
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = "#1d1520";
  for (let i = 0; i < 6; i++) {
    ctx.beginPath();
    ctx.ellipse(1218, GROUND - 8 - i * 9, 4.5, 6, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();

  // ---------------- dust motes
  ctx.save();
  for (const m of MOTES) {
    const x = m.x + Math.sin(time * 0.22 + m.phase) * 18 + time * m.drift * 0.22;
    const y = (m.y - time * m.speed * 0.12) % 470;
    const yy = y < 0 ? y + 470 : y;
    ctx.globalAlpha = 0.07 + 0.12 * (0.5 + 0.5 * Math.sin(time * 1.4 + m.phase));
    ctx.fillStyle = "#F5D9B0";
    ctx.beginPath();
    ctx.arc(x, 130 + yy, m.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // ---------------- grain
  ctx.save();
  const pat = ctx.createPattern(grain, "repeat");
  ctx.globalAlpha = 0.08;
  ctx.fillStyle = pat;
  ctx.fillRect(0, 0, 1280, 720);
  ctx.restore();

  // ---------------- vignette / dim
  const vig = ctx.createRadialGradient(640, 340, 280, 640, 340, 780);
  vig.addColorStop(0, "rgba(4,3,6,0)");
  vig.addColorStop(0.72, "rgba(4,3,6,0.12)");
  vig.addColorStop(1, "rgba(4,3,6,0.55)");
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, 1280, 720);

  if (dim > 0) {
    ctx.fillStyle = `rgba(6,5,9,${dim})`;
    ctx.fillRect(0, 0, 1280, 720);
  }
}

export const STAGE_COLORS = { CREAM, SUN_X, SUN_Y, SUN_R, GROUND };
