// The rooftop's other tenant. It has seen things. It wants a turn.

const BLANK = () => ({
  x: 0,
  down: false,
  pressedUp: false,
  pressedLight: false,
  pressedHeavy: false,
  pressedSpecial: false,
});

function rand(a, b) {
  return a + Math.random() * (b - a);
}

export function createAI() {
  return {
    decideCd: 0,
    intent: "neutral",
    intentT: 0,
    intentDir: 1,
    guardLow: false,
    atkCd: 0.6,
    reactionCd: 0,
    airCd: 0,
    press: null,
    aggro: 0.58 + Math.random() * 0.25,
  };
}

export function updateAI(ai, f, opp, dt) {
  const ctrl = BLANK();
  if (!f.alive || f.state === "ko" || f.state === "down") return ctrl;

  ai.atkCd -= dt;
  ai.reactionCd -= dt;
  ai.airCd -= dt;
  ai.intentT -= dt;
  ai.decideCd -= dt;

  const dir = Math.sign(opp.x - f.x) || 1;
  const away = -dir;
  const dist = Math.abs(opp.x - f.x);

  if (!f.onGround) {
    // steer the jump, throw something on the way down
    if (dist > 76) ctrl.x = dir;
    if (f.vy > 40 && dist < 150 && ai.airCd <= 0) {
      ctrl.pressedHeavy = true;
      ai.airCd = 0.9;
    } else if (f.vy > 120 && dist < 110 && ai.airCd <= 0) {
      ctrl.pressedLight = true;
      ai.airCd = 0.9;
    }
    return ctrl;
  }

  if (!["idle", "walk", "crouch", "air"].includes(f.state)) return ctrl;

  const oppAttacking =
    opp.state === "attack" &&
    (opp.attackT || 0) < (opp.attack?.startup || 0) + (opp.attack?.active || 0) + 0.16;
  const threat = oppAttacking && dist < 185;

  // react to danger with a guard, sometimes a low guard, sometimes a bad idea
  if (threat && ai.reactionCd <= 0) {
    ai.reactionCd = 0.42;
    if (Math.random() < 0.58) {
      ai.intent = "guard";
      ai.intentT = rand(0.24, 0.42);
      ai.guardLow = Math.random() < 0.45;
    } else if (Math.random() < 0.22) {
      ai.intent = "retreat";
      ai.intentT = rand(0.16, 0.3);
    }
  }

  if (dist > 220 && ai.atkCd <= 0 && ai.intentT <= 0) {
    // occasional jump-in from range
    if (Math.random() < 0.1) {
      ai.press = "jump";
      ai.atkCd = 0.7;
    }
  }

  if (ai.decideCd <= 0 && ai.intentT <= 0) {
    ai.decideCd = rand(0.1, 0.2);
    decide(ai, f, opp, dist, dir, away);
  }

  if (ai.press) {
    if (ai.press === "light") ctrl.pressedLight = true;
    else if (ai.press === "heavy") ctrl.pressedHeavy = true;
    else if (ai.press === "special") ctrl.pressedSpecial = true;
    else if (ai.press === "jump") ctrl.pressedUp = true;
    ai.press = null;
  }

  if (ai.intent === "approach") {
    ctrl.x = dist > 64 ? dir : 0;
    ai.intentDir = dir;
  } else if (ai.intent === "retreat") {
    ctrl.x = away;
    ai.intentDir = away;
  } else if (ai.intent === "guard") {
    ctrl.x = away;
    ctrl.down = ai.guardLow;
  } else if (ai.intent === "crouch") {
    ctrl.down = true;
  } else {
    ctrl.x = 0;
  }

  // guard against jump-ins even if not currently "threatened"
  if (!opp.onGround && dist < 135 && Math.random() < 0.012) {
    ai.intent = "guard";
    ai.intentT = 0.22;
    ai.guardLow = false;
  }

  return ctrl;
}

function decide(ai, f, opp, dist, dir, away) {
  const reach = f.def.reach;
  const canSpecial = f.meter >= f.moves.special.cost;
  const cornered = f.x < 160 || f.x > 1120;

  // anti-air
  if (!opp.onGround && dist < 190) {
    if (Math.random() < 0.45) {
      ai.intent = "guard";
      ai.intentT = rand(0.24, 0.4);
      ai.guardLow = false;
    } else if (dist < 150 && ai.atkCd <= 0) {
      ai.press = "heavy";
      ai.atkCd = rand(0.55, 0.9);
      ai.intent = "neutral";
      ai.intentT = 0.2;
    } else {
      ai.intent = "approach";
      ai.intentT = rand(0.14, 0.3);
    }
    return;
  }

  if (dist > 260) {
    ai.intent = "approach";
    ai.intentT = rand(0.3, 0.5);
    if (Math.random() < 0.06) ai.press = "jump";
    return;
  }

  if (dist > 145 * reach) {
    const roll = Math.random();
    if (canSpecial && dist < 230 && roll < 0.18) {
      ai.press = "special";
      ai.atkCd = rand(0.8, 1.2);
      ai.intent = "neutral";
      ai.intentT = 0.2;
    } else if (roll < 0.72) {
      ai.intent = "approach";
      ai.intentT = rand(0.16, 0.34);
    } else if (roll < 0.86) {
      ai.intent = "guard";
      ai.intentT = rand(0.18, 0.34);
      ai.guardLow = Math.random() < 0.4;
    } else {
      ai.intent = "retreat";
      ai.intentT = 0.16;
    }
    return;
  }

  if (dist < 150 * reach && ai.atkCd <= 0) {
    const roll = Math.random();
    const aggro = ai.aggro + (cornered ? 0.08 : 0);
    if (canSpecial && dist < 190 && roll < 0.24) {
      ai.press = "special";
      ai.atkCd = rand(0.8, 1.15);
      ai.intent = "neutral";
      ai.intentT = 0.2;
    } else if (roll < 0.24 + aggro * 0.3) {
      ai.press = "light";
      ai.atkCd = rand(0.24, 0.45);
      ai.intent = "neutral";
      ai.intentT = 0.14;
    } else if (roll < 0.52 + aggro * 0.2) {
      ai.press = "heavy";
      ai.atkCd = rand(0.5, 0.78);
      ai.intent = "neutral";
      ai.intentT = 0.2;
    } else if (roll < 0.68 + aggro * 0.1) {
      // sweep, then a smug pause
      ai.press = "heavy";
      ai.intent = "crouch";
      ai.intentT = 0.3;
      ai.atkCd = rand(0.65, 0.9);
    } else if (roll < 0.82) {
      ai.intent = "retreat";
      ai.intentT = rand(0.16, 0.3);
    } else {
      ai.intent = "guard";
      ai.intentT = rand(0.2, 0.4);
      ai.guardLow = Math.random() < 0.5;
    }
    return;
  }

  const roll = Math.random();
  if (roll < 0.45) {
    ai.intent = "approach";
    ai.intentT = rand(0.12, 0.24);
  } else if (roll < 0.72) {
    ai.intent = "retreat";
    ai.intentT = rand(0.12, 0.26);
  } else {
    ai.intent = "guard";
    ai.intentT = rand(0.14, 0.3);
    ai.guardLow = Math.random() < 0.4;
  }
}
