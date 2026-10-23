const TAU = Math.PI * 2;
const CREAM = "#F2E8D5";

function rand(a, b) {
  return a + Math.random() * (b - a);
}

export class Effects {
  constructor() {
    this.parts = [];
    this.texts = [];
    this.shakeAmt = 0;
    this.flash = 0;
  }

  reset() {
    this.parts.length = 0;
    this.texts.length = 0;
    this.shakeAmt = 0;
    this.flash = 0;
  }

  shake(amount) {
    this.shakeAmt = Math.max(this.shakeAmt, amount);
  }

  spark(x, y, color, facing, power = 1, blocked = false) {
    const n = blocked ? 5 : Math.round(7 + power * 6);
    for (let i = 0; i < n; i++) {
      const a = blocked
        ? rand(-0.9, 0.9) + (facing > 0 ? Math.PI : 0) + rand(-0.6, 0.6)
        : rand(0, TAU);
      const spd = rand(90, 380) * (blocked ? 0.55 : 1) * (0.7 + power * 0.5);
      const life = rand(0.14, 0.4);
      this.parts.push({
        type: "spark",
        x,
        y,
        vx: Math.cos(a) * spd,
        vy: Math.sin(a) * spd - rand(20, 110),
        life,
        max: life,
        len: rand(4, 15) * (0.6 + power * 0.5),
        color: Math.random() < 0.35 ? CREAM : color,
        ink: true,
        grav: 900,
      });
    }
    this.parts.push({ type: "ring", x, y, r: blocked ? 6 : 4, grow: blocked ? 120 : 210, life: 0.2, max: 0.2, color: blocked ? "#9CE6D5" : CREAM });
    if (!blocked) {
      this.parts.push({ type: "flash", x, y, r: 20 * power + 12, life: 0.1, max: 0.1, color: "#FFF8E7" });
      for (let i = 0; i < 3; i++) {
        this.parts.push({
          type: "shard",
          x: x + rand(-8, 8),
          y: y + rand(-8, 8),
          vx: facing * rand(80, 320) + rand(-100, 100),
          vy: rand(-300, -70),
          rot: rand(0, TAU),
          vr: rand(-14, 14),
          size: rand(3, 9),
          life: rand(0.3, 0.6),
          max: 0.6,
          color: Math.random() < 0.5 ? color : CREAM,
        });
      }
    }
    this.shake((blocked ? 2 : 4 + power * 4) * (power > 1.25 ? 1.6 : 1));
  }

  dust(x, y, dir = 0, count = 5, scale = 1) {
    for (let i = 0; i < count; i++) {
      const life = rand(0.25, 0.6);
      this.parts.push({
        type: "dust",
        x: x + rand(-12, 12) * scale,
        y: y + rand(-4, 2),
        vx: rand(-40, 40) + dir * rand(20, 90),
        vy: rand(-60, -10),
        r: rand(2, 6) * scale,
        life,
        max: life,
        color: "rgba(242,232,213,0.28)",
      });
    }
  }

  speedLine(x, y, facing, color) {
    for (let i = 0; i < 4; i++) {
      const life = rand(0.12, 0.28);
      this.parts.push({
        type: "line",
        x: x + rand(-20, 30),
        y: y + rand(-100, -20),
        vx: -facing * rand(200, 420),
        vy: rand(-30, 30),
        len: rand(18, 52),
        life,
        max: life,
        color,
        facing,
      });
    }
  }

  text(x, y, str, color = CREAM, size = 30, ink = "#121014") {
    this.texts.push({
      x,
      y,
      str,
      color,
      size,
      ink,
      life: 0.85,
      max: 0.85,
      vy: -44,
      rot: rand(-0.05, 0.05),
    });
  }

  flashScreen(amount = 0.3) {
    this.flash = Math.max(this.flash, amount);
  }

  update(dt) {
    this.shakeAmt *= Math.exp(-9 * dt);
    if (this.shakeAmt < 0.15) this.shakeAmt = 0;
    this.flash = Math.max(0, this.flash - dt * 2.6);

    for (let i = this.parts.length - 1; i >= 0; i--) {
      const p = this.parts[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.parts.splice(i, 1);
        continue;
      }
      if (p.type === "spark") {
        p.vy += p.grav * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vx *= Math.exp(-2.5 * dt);
      } else if (p.type === "shard") {
        p.vy += 1700 * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.rot += p.vr * dt;
        if (p.y > 606) {
          p.y = 606;
          p.vy *= -0.35;
          p.vx *= 0.6;
        }
      } else if (p.type === "dust") {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += 30 * dt;
        p.r += 9 * dt;
      } else if (p.type === "ring" || p.type === "flash") {
        p.r += p.grow ? p.grow * dt : 0;
      } else if (p.type === "line") {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
      }
    }

    for (let i = this.texts.length - 1; i >= 0; i--) {
      const t = this.texts[i];
      t.life -= dt;
      t.y += t.vy * dt;
      t.vy *= Math.exp(-3 * dt);
      if (t.life <= 0) this.texts.splice(i, 1);
    }
  }

  draw(ctx) {
    ctx.save();
    for (const p of this.parts) {
      const a = Math.min(1, p.life / (p.max * 0.6));
      if (p.type === "spark") {
        ctx.globalAlpha = a;
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 2.6;
        ctx.lineCap = "round";
        const mag = Math.hypot(p.vx, p.vy) || 1;
        const nx = p.vx / mag;
        const ny = p.vy / mag;
        ctx.beginPath();
        ctx.moveTo(p.x - nx * p.len, p.y - ny * p.len);
        ctx.lineTo(p.x, p.y);
        ctx.stroke();
      } else if (p.type === "shard") {
        ctx.globalAlpha = a;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 3, p.size, p.size * 0.66);
        ctx.restore();
      } else if (p.type === "ring") {
        ctx.globalAlpha = a * 0.9;
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, TAU);
        ctx.stroke();
      } else if (p.type === "flash") {
        ctx.globalAlpha = a * 0.8;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * (1.4 - a * 0.4), 0, TAU);
        ctx.fill();
      } else if (p.type === "dust") {
        ctx.globalAlpha = a * 0.55;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, TAU);
        ctx.fill();
      } else if (p.type === "line") {
        ctx.globalAlpha = a * 0.55;
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x - p.facing * p.len, p.y);
        ctx.stroke();
      }
    }
    ctx.restore();

    ctx.save();
    for (const t of this.texts) {
      const a = Math.min(1, t.life / (t.max * 0.4));
      const pop = t.life > t.max * 0.8 ? 1.15 : 1;
      ctx.save();
      ctx.globalAlpha = a;
      ctx.translate(t.x, t.y);
      ctx.rotate(t.rot);
      ctx.scale(pop, pop);
      ctx.font = `${t.size}px Anton, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.lineWidth = t.size * 0.18;
      ctx.strokeStyle = t.ink;
      ctx.lineJoin = "round";
      ctx.strokeText(t.str, 0, 0);
      ctx.fillStyle = t.color;
      ctx.fillText(t.str, 0, 0);
      ctx.restore();
    }
    ctx.restore();
  }
}
