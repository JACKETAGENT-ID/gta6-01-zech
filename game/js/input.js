// Keyboard + mouse input, with edge-triggered "just pressed" keys.
export class Input {
  constructor(canvas) {
    this.keys = {};
    this.justPressed = {};
    this.mouse = { x: 0, y: 0, down: false, clicked: false };
    this.canvas = canvas;
    window.addEventListener('keydown', (e) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault();
      if (!this.keys[e.code]) this.justPressed[e.code] = true;
      this.keys[e.code] = true;
    });
    window.addEventListener('keyup', (e) => { this.keys[e.code] = false; });
    canvas.addEventListener('mousemove', (e) => {
      const r = canvas.getBoundingClientRect();
      this.mouse.x = (e.clientX - r.left) * (canvas.width / r.width);
      this.mouse.y = (e.clientY - r.top) * (canvas.height / r.height);
    });
    canvas.addEventListener('mousedown', (e) => {
      this.mouse.down = true;
      this.mouse.clicked = true;
      const r = canvas.getBoundingClientRect();
      this.mouse.x = (e.clientX - r.left) * (canvas.width / r.width);
      this.mouse.y = (e.clientY - r.top) * (canvas.height / r.height);
    });
    window.addEventListener('mouseup', () => { this.mouse.down = false; });
    window.addEventListener('blur', () => { this.keys = {}; });
  }

  down(...codes) { return codes.some(c => this.keys[c]); }
  pressed(...codes) { return codes.some(c => this.justPressed[c]); }
  endFrame() { this.justPressed = {}; this.mouse.clicked = false; }
}
