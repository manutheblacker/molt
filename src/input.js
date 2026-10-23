import { settings } from "./config.js";

const PREVENT = new Set([
  "ArrowLeft",
  "ArrowRight",
  "ArrowUp",
  "ArrowDown",
  "Space",
  "Slash",
  "Comma",
  "Period",
  "Escape",
]);

const MENU_LEFT = ["ArrowLeft", "KeyA"];
const MENU_RIGHT = ["ArrowRight", "KeyD"];
const MENU_UP = ["ArrowUp", "KeyW"];
const MENU_DOWN = ["ArrowDown", "KeyS"];

export class Input {
  constructor() {
    this.held = new Set();
    this.pressed = new Set();
    this.released = new Set();
    this.virtual = new Set();
    this.pressedVirtual = new Set();
    this.onFirstGesture = null;
    this.gestured = false;
    this.captureHandler = null;
  }

  attach() {
    window.addEventListener("keydown", (e) => {
      if (PREVENT.has(e.code)) e.preventDefault();
      this.gesture();
      if (e.repeat) return;
      this.held.add(e.code);
      this.pressed.add(e.code);
    });

    window.addEventListener("keyup", (e) => {
      if (PREVENT.has(e.code)) e.preventDefault();
      this.held.delete(e.code);
      this.released.add(e.code);
    });

    window.addEventListener("blur", () => this.clear());
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) this.clear();
    });

    window.addEventListener("pointerdown", () => this.gesture(), { passive: true });

    const touch = document.getElementById("touch");
    if (touch) {
      touch.querySelectorAll("[data-action]").forEach((btn) => {
        const action = btn.dataset.action;
        const press = (e) => {
          e.preventDefault();
          this.gesture();
          btn.classList.add("active");
          this.virtual.add(action);
          this.pressedVirtual.add(action);
        };
        const release = (e) => {
          e.preventDefault();
          btn.classList.remove("active");
          this.virtual.delete(action);
        };
        btn.addEventListener("pointerdown", press);
        btn.addEventListener("pointerup", release);
        btn.addEventListener("pointercancel", release);
        btn.addEventListener("pointerleave", release);
        btn.addEventListener("contextmenu", (e) => e.preventDefault());
      });
    }
  }

  gesture() {
    if (this.gestured) return;
    this.gestured = true;
    this.onFirstGesture?.();
  }

  down(code) {
    return this.held.has(code) || this.virtual.has(code);
  }

  just(code) {
    return this.pressed.has(code);
  }

  actionDown(player, action) {
    const code = settings.controls[player]?.[action];
    if (code && this.down(code)) return true;
    return player === "p1" && this.virtual.has(action);
  }

  actionJust(player, action) {
    const code = settings.controls[player]?.[action];
    if (code && this.just(code)) return true;
    return player === "p1" && this.pressedVirtual.has(action);
  }

  p1() {
    return {
      x: (this.actionDown("p1", "right") ? 1 : 0) - (this.actionDown("p1", "left") ? 1 : 0),
      down: this.actionDown("p1", "down"),
      pressedUp: this.actionJust("p1", "up"),
      pressedLight: this.actionJust("p1", "light"),
      pressedHeavy: this.actionJust("p1", "heavy"),
      pressedSpecial: this.actionJust("p1", "special"),
    };
  }

  p2() {
    return {
      x: (this.actionDown("p2", "right") ? 1 : 0) - (this.actionDown("p2", "left") ? 1 : 0),
      down: this.actionDown("p2", "down"),
      pressedUp: this.actionJust("p2", "up"),
      pressedLight: this.actionJust("p2", "light"),
      pressedHeavy: this.actionJust("p2", "heavy"),
      pressedSpecial: this.actionJust("p2", "special"),
    };
  }

  menuUp() {
    return MENU_UP.some((c) => this.just(c)) || this.pressedVirtual.has("up") || this.actionJust("p1", "up");
  }

  menuDown() {
    return MENU_DOWN.some((c) => this.just(c)) || this.pressedVirtual.has("down") || this.actionJust("p1", "down");
  }

  menuLeft() {
    return MENU_LEFT.some((c) => this.just(c)) || this.pressedVirtual.has("left") || this.actionJust("p1", "left");
  }

  menuRight() {
    return MENU_RIGHT.some((c) => this.just(c)) || this.pressedVirtual.has("right") || this.actionJust("p1", "right");
  }

  confirm() {
    return (
      this.just("Enter") ||
      this.just("Space") ||
      this.just("NumpadEnter") ||
      this.pressedVirtual.has("light")
    );
  }

  back() {
    return this.just("Escape") || this.just("Backspace") || this.pressedVirtual.has("pause");
  }

  pausePressed() {
    return this.just("Escape") || this.just("KeyP") || this.pressedVirtual.has("pause");
  }

  captureNextKey(cb) {
    this.cancelCapture();
    const handler = (e) => {
      e.preventDefault();
      e.stopImmediatePropagation();
      this.cancelCapture();
      cb(e.code);
    };
    this.captureHandler = handler;
    window.addEventListener("keydown", handler, true);
  }

  cancelCapture() {
    if (this.captureHandler) {
      window.removeEventListener("keydown", this.captureHandler, true);
      this.captureHandler = null;
    }
  }

  endFrame() {
    this.pressed.clear();
    this.released.clear();
    this.pressedVirtual.clear();
  }

  clear() {
    this.held.clear();
    this.pressed.clear();
    this.released.clear();
    this.virtual.clear();
    this.pressedVirtual.clear();
  }
}
