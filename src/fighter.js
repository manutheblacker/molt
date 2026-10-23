import { buildMoves } from "./roster.js";

export const GROUND_Y = 604;
export const ARENA_LEFT = 94;
export const ARENA_RIGHT = 1186;
const GRAVITY = 2480;

const STAND_H = 116;
const CROUCH_H = 84;
const AIR_H = 102;
const BODY_W = 56;

function clamp(v, a, b) {
  return v < a ? a : v > b ? b : v;
}

function rectsOverlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

export class Fighter {
  constructor(def, index, x, facing) {
    this.def = def;
    this.index = index;
    this.moves = buildMoves(def);
    this.meter = 0;
    this.ai = null;
    this.reset(x, facing, true);
  }

  reset(x, facing, keepMeter = true) {
    const meter = keepMeter ? this.meter : 0;
    this.x = x;
    this.y = GROUND_Y;
    this.vx = 0;
    this.vy = 0;
    this.facing = facing;
    this.onGround = true;
    this.hp = this.def.hp;
    this.hpShown = this.def.hp;
    this.hpDelay = 0;
    this.meter = meter;
    this.state = "idle";
    this.stateT = 0;
    this.anim = Math.random() * 10;
    this.walkPhase = 0;
    this.crouchAmt = 0;
    this.crouching = false;
    this.guardHeld = false;
    this.attack = null;
    this.attackT = 0;
    this.hitDone = false;
    this.hitsDone = 0;
    this.lastHitAt = -99;
    this.stun = 0;
    this.invuln = 0;
    this.flash = 0;
    this.combo = 0;
    this.comboT = 0;
    this.buffer = null;
    this.bufferT = 0;
    this.koLanded = false;
    this.downT = 0;
    this.airAttackUsed = false;
    this.locked = false;
  }

  get alive() {
    return this.hp > 0 && this.state !== "ko";
  }

  get busy() {
    return this.state === "attack" || this.state === "hurt" || this.state === "blockstun" || this.state === "down" || this.state === "ko";
  }

  get hurtHeight() {
    if (this.crouching) return CROUCH_H;
    if (!this.onGround) return AIR_H;
    return STAND_H;
  }

  hurtbox() {
    if (this.state === "ko" || this.state === "down" || this.invuln > 0) return null;
    const h = this.hurtHeight;
    const w = this.crouching ? 64 : BODY_W;
    return { x: this.x - w / 2, y: this.y - h, w, h };
  }

  hitbox(move = this.attack) {
    if (!move) return null;
    return {
      x: this.x + this.facing * move.ox - move.w / 2,
      y: this.y - move.hy - move.h / 2,
      w: move.w,
      h: move.h,
    };
  }

  setBuffer(kind) {
    this.buffer = kind;
    this.bufferT = 0.17;
  }

  canStartAttack(kind) {
    if (kind === "special") return this.meter >= this.moves.special.cost;
    return true;
  }

  startAttack(kind, ctrl, game) {
    if (!this.canStartAttack(kind)) {
      this.buffer = null;
      this.bufferT = 0;
      if (game?.onDenied) game.onDenied(this);
      return false;
    }

    let move;
    if (kind === "special") {
      move = this.moves.special;
      if (!this.onGround && !move.airOk) return false;
      this.meter = Math.max(0, this.meter - move.cost);
      game?.onSpecial?.(this, move);
    } else if (!this.onGround) {
      if (kind === "light") move = this.moves.airLight;
      else if (kind === "heavy") move = this.moves.airHeavy;
      else return false;
    } else {
      if (kind === "light") move = ctrl.down ? this.moves.lightCrouch : this.moves.light;
      else if (kind === "heavy") move = ctrl.down ? this.moves.sweep : this.moves.heavy;
      else return false;
    }

    this.state = "attack";
    this.stateT = 0;
    this.attack = move;
    this.attackT = 0;
    this.hitDone = false;
    this.hitsDone = 0;
    this.lastHitAt = -99;
    this.buffer = null;
    this.bufferT = 0;
    if (this.onGround) {
      this.vx = 0;
      this.crouching = move.kind === "lightCrouch" || move.kind === "sweep" || ctrl.down;
    }
    if (move.kind === "dive" && !this.onGround) {
      this.vy = 620;
      this.vx = this.facing * move.dash * 0.72;
    }
    game?.onWhoosh?.(this, move);
    return true;
  }

  jump(game) {
    this.vy = -this.def.jump;
    this.y -= 1;
    this.onGround = false;
    this.airAttackUsed = false;
    this.state = "air";
    this.stateT = 0;
    this.vx = clamp(this.vx * 0.2, -this.def.speed, this.def.speed);
    game?.onJump?.(this);
  }

  update(dt, opp, ctrl, game) {
    this.anim += dt;
    this.stateT += dt;
    if (this.flash > 0) this.flash -= dt;
    if (this.invuln > 0) this.invuln -= dt;
    if (this.comboT > 0) {
      this.comboT -= dt;
      if (this.comboT <= 0) this.combo = 0;
    }
    if (this.bufferT > 0) {
      this.bufferT -= dt;
      if (this.bufferT <= 0) this.buffer = null;
    }
    this.crouchAmt += ((this.crouching ? 1 : 0) - this.crouchAmt) * Math.min(1, dt * 17);
    if (this.hpDelay > 0) {
      this.hpDelay -= dt;
    } else if (this.hpShown > this.hp) {
      this.hpShown = Math.max(this.hp, this.hpShown - (this.def.hp * 0.55 + 18) * dt);
      if (this.hpShown - this.hp < 0.5) this.hpShown = this.hp;
    } else {
      this.hpShown = this.hp;
    }

    // buttons get buffered so mashing feels like a fighting game, not a spreadsheet
    if (!["hurt", "down", "ko", "blockstun"].includes(this.state)) {
      if (ctrl.pressedLight) this.setBuffer("light");
      if (ctrl.pressedHeavy) this.setBuffer("heavy");
      if (ctrl.pressedSpecial) this.setBuffer("special");
    }

    if (this.state === "ko") {
      this.updateKO(dt);
      return;
    }
    if (this.state === "win") {
      this.vx *= Math.exp(-8 * dt);
      this.physics(dt);
      return;
    }
    if (this.state === "down") {
      this.updateDown(dt, game);
      return;
    }
    if (this.state === "hurt") {
      this.stun -= dt;
      this.crouching = false;
      this.guardHeld = false;
      this.physics(dt, game);
      if (this.stun <= 0) {
        this.state = this.onGround ? "idle" : "air";
        this.stateT = 0;
        if (this.onGround) this.vx = 0;
      }
      return;
    }
    if (this.state === "blockstun") {
      this.stun -= dt;
      this.crouching = ctrl.down && this.onGround;
      this.guardHeld = this.onGround && ctrl.x === -this.facing;
      this.physics(dt, game);
      if (this.stun <= 0) {
        this.state = "idle";
        this.vx = 0;
      }
      return;
    }

    // turn to face the other bug when free to do so
    if (!["attack"].includes(this.state)) {
      const dir = Math.sign(opp.x - this.x);
      if (dir !== 0) this.facing = dir;
    }

    this.guardHeld =
      this.onGround &&
      ctrl.x === -this.facing &&
      this.state !== "attack" &&
      this.state !== "hurt";

    if (this.state === "attack") {
      this.updateAttack(dt, opp, ctrl, game);
      this.physics(dt, game);
      return;
    }

    this.crouching = this.onGround && ctrl.down;
    if (this.onGround) {
      if (ctrl.pressedUp) {
        this.jump(game);
        this.physics(dt, game);
        return;
      }
      if (this.buffer) {
        const kind = this.buffer;
        if (this.startAttack(kind, ctrl, game)) {
          this.physics(dt, game);
          return;
        }
      }
      if (this.crouching) {
        this.vx = 0;
        this.state = "crouch";
      } else if (ctrl.x !== 0) {
        this.vx = ctrl.x * this.def.speed;
        this.state = "walk";
        this.walkPhase += Math.abs(this.vx) * dt * 0.048;
      } else {
        this.vx *= Math.exp(-18 * dt);
        this.state = "idle";
      }
    } else {
      if (this.buffer) {
        const kind = this.buffer;
        if (kind === "light" || kind === "heavy" || kind === "special") {
          if (this.startAttack(kind, ctrl, game)) {
            this.physics(dt, game);
            return;
          }
        }
      }
      this.vx += ctrl.x * this.def.speed * 2.1 * dt;
      this.vx = clamp(this.vx, -this.def.speed * 1.15, this.def.speed * 1.15);
      this.state = "air";
    }

    this.physics(dt, game);
  }

  updateAttack(dt, opp, ctrl, game) {
    const a = this.attack;
    if (!a) {
      this.state = "idle";
      return;
    }
    this.attackT += dt;
    const total = a.startup + a.active + a.recovery;

    if (this.onGround) this.crouching = a.kind === "lightCrouch" || a.kind === "sweep";

    if (a.kind === "dive" && !this.onGround) {
      this.vy = Math.max(this.vy, 300);
    }

    if (a.dash) {
      const dashEnd = a.startup + a.active + 0.1;
      if (this.attackT <= dashEnd) {
        this.vx = this.facing * a.dash;
        if (a.kind === "dive" && !this.onGround) this.vy = Math.max(this.vy, 660);
      } else if (this.onGround) {
        this.vx *= Math.exp(-16 * dt);
      }
    }

    // cancel the tail of a normal into the next button
    if (a.cancelable && this.buffer && this.attackT > a.startup + a.active) {
      const kind = this.buffer;
      if (kind === "light" || kind === "heavy" || kind === "special") {
        if (this.startAttack(kind, ctrl, game)) return;
      }
    }

    if (this.attackT >= total) {
      this.attack = null;
      this.state = this.onGround ? "idle" : "air";
      this.stateT = 0;
      this.vx = this.onGround ? 0 : this.vx * 0.9;
      if (this.buffer) {
        const kind = this.buffer;
        if (kind === "light" || kind === "heavy" || kind === "special") {
          if (this.startAttack(kind, ctrl, game)) return;
        }
      }
    }
  }

  updateDown(dt, game) {
    this.crouching = false;
    this.physics(dt, game);
    if (this.onGround) {
      this.downT -= dt;
      this.vx *= Math.exp(-5 * dt);
      if (this.downT <= 0) {
        this.state = "idle";
        this.stateT = 0;
        this.invuln = 0.28;
        this.vx = 0;
      }
    }
  }

  updateKO(dt) {
    this.physics(dt);
    if (this.onGround) {
      this.koLanded = true;
      this.vx *= Math.exp(-3.2 * dt);
      this.vy = 0;
    }
  }

  physics(dt, game) {
    if (!this.onGround) this.vy += GRAVITY * dt;
    this.x += this.vx * dt;
    this.y += this.vy * dt;

    if (this.x < ARENA_LEFT) {
      this.x = ARENA_LEFT;
      if (this.vx < 0) this.vx = 0;
    } else if (this.x > ARENA_RIGHT) {
      this.x = ARENA_RIGHT;
      if (this.vx > 0) this.vx = 0;
    }

    if (!this.onGround && this.y >= GROUND_Y && this.vy >= 0) {
      const wasFalling = this.vy > 250;
      this.y = GROUND_Y;
      this.vy = 0;
      this.onGround = true;
      this.crouchAmt = 0;
      if (this.state === "attack" && this.attack?.air) {
        this.attack = null;
        this.state = "idle";
        this.stateT = 0;
        this.vx = 0;
      } else if (this.state === "air") {
        this.state = "idle";
        this.stateT = 0;
      } else if (this.state === "hurt") {
        this.vx *= 0.4;
        if (this.stun <= 0) this.state = "idle";
      }
      if (wasFalling) game?.onLand?.(this);
    }

    if (this.onGround) {
      this.y = GROUND_Y;
      if (this.state === "ko" || this.state === "down" || this.state === "hurt" || this.state === "blockstun") {
        this.vx *= Math.exp(-4 * dt);
      }
    }
  }

  checkHit(opp, game) {
    if (this.state !== "attack" || !this.attack) return;
    if (!opp.alive) return;
    const a = this.attack;
    const t = this.attackT;
    if (t < a.startup || t > a.startup + a.active) return;

    if (a.hits) {
      if (this.hitsDone >= a.hits) return;
      if (this.hitsDone > 0 && t - this.lastHitAt < (a.hitInterval || 0.05)) return;
    } else if (this.hitDone) {
      return;
    }

    const hb = this.hitbox(a);
    const hu = opp.hurtbox();
    if (!hb || !hu || !rectsOverlap(hb, hu)) return;

    const blocked = opp.canBlock(a);
    this.hitDone = true;
    this.hitsDone += 1;
    this.lastHitAt = t;

    const result = opp.receiveHit(this, a, blocked);
    game?.onHit?.(this, opp, a, blocked, result);
  }

  canBlock(move) {
    if (!this.onGround) return false;
    if (!this.guardHeld) return false;
    if (this.state === "ko" || this.state === "down" || this.state === "hurt") return false;
    if (this.state === "attack") return false;
    if (this.crouching) return move.type !== "high";
    return move.type !== "low";
  }

  receiveHit(attacker, move, blocked) {
    const weight = this.def.weight || 1;

    if (blocked) {
      const chip = Math.max(0.8, move.dmg * 0.13);
      this.hp = Math.max(1, this.hp - chip);
      this.state = "blockstun";
      this.stateT = 0;
      this.stun = move.blockstun;
      this.guardHeld = true;
      this.vx = (attacker.facing * move.kb * 0.5) / weight;
      this.flash = 0.045;
      this.hpDelay = 0.1;
      attacker.meter = clamp(attacker.meter + move.dmg * 0.3 + 2, 0, 100);
      this.meter = clamp(this.meter + 2, 0, 100);
      attacker.combo = 0;
      attacker.comboT = 0;
      return { blocked: true, damage: chip, ko: false, counter: false, armor: false };
    }

    const armored =
      this.state === "attack" &&
      this.attack?.armor &&
      this.attackT <= this.attack.startup + this.attack.active;

    const counter = this.state === "attack" && this.attackT < (this.attack?.startup || 0);
    const scaling = Math.max(0.55, 1 - attacker.combo * 0.055);
    let dmg = move.dmg * (counter ? 1.15 : 1) * scaling;
    if (armored) dmg *= 0.55;

    this.hp -= dmg;
    if (this.hp < 0) this.hp = 0;
    this.flash = 0.12;
    this.hpDelay = 0.26;
    this.invuln = 0;

    if (!armored) {
      const kb = (move.kb * (counter ? 1.12 : 1)) / weight;
      this.vx = attacker.facing * kb;
      this.combo = 0;
      attacker.combo += 1;
      attacker.comboT = 1.1;

      if (this.hp <= 0) {
        this.state = "ko";
        this.stateT = 0;
        this.koLanded = false;
        this.vy = -380;
        this.vx = (attacker.facing * 420) / weight;
        this.onGround = false;
        this.y -= 2;
      } else if (move.knockdown) {
        this.state = "down";
        this.stateT = 0;
        this.downT = 0.6;
        this.vy = -330;
        this.vx = (attacker.facing * 300) / weight;
        this.onGround = false;
        this.y -= 2;
      } else {
        this.state = "hurt";
        this.stateT = 0;
        this.stun = move.hitstun * (counter ? 1.15 : 1);
        if (!this.onGround) {
          this.vy = Math.min(this.vy, -150);
        }
      }
    } else {
      this.flash = 0.08;
    }

    if (move.lifesteal) {
      attacker.hp = Math.min(attacker.def.hp, attacker.hp + dmg * move.lifesteal);
      attacker.hpShown = Math.max(attacker.hpShown, attacker.hp);
    }

    attacker.meter = clamp(attacker.meter + dmg * 1.35, 0, 100);
    this.meter = clamp(this.meter + dmg * 0.85, 0, 100);

    return { blocked: false, damage: dmg, ko: this.hp <= 0, counter, armor: armored };
  }

  celebrate() {
    if (this.state === "ko" || this.state === "down") return;
    this.state = "win";
    this.stateT = 0;
    this.attack = null;
    this.vx = 0;
  }

  halt() {
    this.attack = null;
    this.state = this.state === "ko" ? "ko" : "idle";
    this.vx = 0;
  }
}
