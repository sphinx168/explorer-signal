const canvas = document.querySelector("#game");
const context = canvas.getContext("2d");
const scoreElement = document.querySelector("#score");
const timeElement = document.querySelector("#time");
const overlay = document.querySelector("#overlay");
const statusElement = document.querySelector("#status");
const messageElement = document.querySelector("#message");
const startButton = document.querySelector("#startButton");

const missionLength = 60;
const keys = new Set();
const pointer = { active: false, x: 0 };

let width = 900;
let height = 560;
let animationId = 0;
let lastTime = 0;
let spawnTimer = 0;
let score = 0;
let remaining = missionLength;
let running = false;

const player = {
  x: 450,
  y: 490,
  width: 72,
  height: 34,
  speed: 430,
};

const signals = [];
const stars = Array.from({ length: 90 }, () => ({
  x: Math.random(),
  y: Math.random(),
  size: 1 + Math.random() * 2,
  speed: 10 + Math.random() * 26,
  glow: Math.random() > 0.72,
}));

function resizeCanvas() {
  const frame = canvas.parentElement.getBoundingClientRect();
  const scale = window.devicePixelRatio || 1;
  width = Math.max(320, Math.floor(frame.width));
  height = Math.max(360, Math.floor(frame.height));
  canvas.width = Math.floor(width * scale);
  canvas.height = Math.floor(height * scale);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  context.setTransform(scale, 0, 0, scale, 0, 0);
  player.y = height - 70;
  player.x = Math.min(Math.max(player.x, player.width / 2), width - player.width / 2);
  drawScene(0);
}

function startMission() {
  score = 0;
  remaining = missionLength;
  spawnTimer = 0;
  signals.length = 0;
  player.x = width / 2;
  running = true;
  lastTime = performance.now();
  updateHud();
  overlay.classList.add("hidden");
  cancelAnimationFrame(animationId);
  animationId = requestAnimationFrame(loop);
}

function endMission() {
  running = false;
  cancelAnimationFrame(animationId);
  statusElement.textContent = "任務完成";
  messageElement.textContent = `你接收了 ${score} 道訊號。第一個 repo 已留下航跡。`;
  startButton.textContent = "再玩一次";
  overlay.classList.remove("hidden");
  drawScene(0);
}

function loop(now) {
  const delta = Math.min(0.033, (now - lastTime) / 1000);
  lastTime = now;
  update(delta);
  drawScene(delta);

  if (running) {
    animationId = requestAnimationFrame(loop);
  }
}

function update(delta) {
  remaining = Math.max(0, remaining - delta);
  spawnTimer -= delta;

  if (spawnTimer <= 0) {
    spawnSignal();
    spawnTimer = Math.max(0.28, 0.85 - score * 0.012);
  }

  if (keys.has("ArrowLeft") || keys.has("KeyA")) {
    player.x -= player.speed * delta;
  }

  if (keys.has("ArrowRight") || keys.has("KeyD")) {
    player.x += player.speed * delta;
  }

  if (pointer.active) {
    player.x += (pointer.x - player.x) * Math.min(1, delta * 12);
  }

  player.x = Math.min(Math.max(player.x, player.width / 2), width - player.width / 2);

  for (let index = signals.length - 1; index >= 0; index -= 1) {
    const signal = signals[index];
    signal.y += signal.speed * delta;
    signal.pulse += delta * 7;

    if (isCaught(signal)) {
      score += signal.value;
      signals.splice(index, 1);
      continue;
    }

    if (signal.y - signal.radius > height + 20) {
      signals.splice(index, 1);
    }
  }

  updateHud();

  if (remaining <= 0) {
    endMission();
  }
}

function spawnSignal() {
  const radius = 10 + Math.random() * 8;
  signals.push({
    x: radius + Math.random() * (width - radius * 2),
    y: -radius,
    radius,
    speed: 120 + Math.random() * 150 + score * 0.8,
    value: Math.random() > 0.86 ? 3 : 1,
    pulse: Math.random() * Math.PI,
  });
}

function isCaught(signal) {
  const playerLeft = player.x - player.width / 2;
  const playerRight = player.x + player.width / 2;
  const playerTop = player.y - player.height / 2;
  const playerBottom = player.y + player.height / 2;
  return (
    signal.x + signal.radius > playerLeft &&
    signal.x - signal.radius < playerRight &&
    signal.y + signal.radius > playerTop &&
    signal.y - signal.radius < playerBottom
  );
}

function drawScene(delta) {
  context.clearRect(0, 0, width, height);
  drawStars(delta);
  drawGrid();
  drawSignals();
  drawPlayer();
}

function drawStars(delta) {
  for (const star of stars) {
    star.y += (star.speed * delta) / height;
    if (star.y > 1) {
      star.y = 0;
      star.x = Math.random();
    }

    context.fillStyle = star.glow ? "rgba(109, 255, 181, 0.85)" : "rgba(236, 246, 255, 0.72)";
    context.fillRect(star.x * width, star.y * height, star.size, star.size);
  }
}

function drawGrid() {
  context.strokeStyle = "rgba(109, 255, 181, 0.08)";
  context.lineWidth = 1;

  for (let x = 0; x <= width; x += 42) {
    context.beginPath();
    context.moveTo(x, 0);
    context.lineTo(x, height);
    context.stroke();
  }

  for (let y = 0; y <= height; y += 42) {
    context.beginPath();
    context.moveTo(0, y);
    context.lineTo(width, y);
    context.stroke();
  }
}

function drawSignals() {
  for (const signal of signals) {
    const glow = 0.45 + Math.sin(signal.pulse) * 0.18;
    context.beginPath();
    context.arc(signal.x, signal.y, signal.radius * 2.2, 0, Math.PI * 2);
    context.fillStyle = `rgba(109, 255, 181, ${glow * 0.22})`;
    context.fill();

    context.beginPath();
    context.arc(signal.x, signal.y, signal.radius, 0, Math.PI * 2);
    context.fillStyle = signal.value > 1 ? "#f8c35f" : "#6dffb5";
    context.fill();

    context.beginPath();
    context.arc(signal.x, signal.y, signal.radius * 0.45, 0, Math.PI * 2);
    context.fillStyle = "#05120d";
    context.fill();
  }
}

function drawPlayer() {
  const left = player.x - player.width / 2;
  const top = player.y - player.height / 2;

  context.save();
  context.translate(left, top);
  context.fillStyle = "#152437";
  context.strokeStyle = "#6dffb5";
  context.lineWidth = 2;

  context.beginPath();
  context.moveTo(player.width / 2, 0);
  context.lineTo(player.width, player.height * 0.68);
  context.lineTo(player.width * 0.68, player.height);
  context.lineTo(player.width * 0.32, player.height);
  context.lineTo(0, player.height * 0.68);
  context.closePath();
  context.fill();
  context.stroke();

  context.fillStyle = "#d2ffe8";
  context.fillRect(player.width * 0.42, player.height * 0.3, player.width * 0.16, player.height * 0.22);

  context.fillStyle = "rgba(248, 195, 95, 0.9)";
  context.fillRect(player.width * 0.24, player.height * 0.88, player.width * 0.16, player.height * 0.18);
  context.fillRect(player.width * 0.6, player.height * 0.88, player.width * 0.16, player.height * 0.18);
  context.restore();
}

function updateHud() {
  scoreElement.textContent = score.toString();
  timeElement.textContent = Math.ceil(remaining).toString();
}

function setPointerPosition(event) {
  const rect = canvas.getBoundingClientRect();
  pointer.x = event.clientX - rect.left;
}

startButton.addEventListener("click", startMission);

window.addEventListener("keydown", (event) => {
  if (["ArrowLeft", "ArrowRight", "KeyA", "KeyD", "Space", "Enter"].includes(event.code)) {
    event.preventDefault();
  }

  if ((event.code === "Space" || event.code === "Enter") && !running) {
    startMission();
  }

  keys.add(event.code);
});

window.addEventListener("keyup", (event) => {
  keys.delete(event.code);
});

canvas.addEventListener("pointerdown", (event) => {
  pointer.active = true;
  setPointerPosition(event);
  canvas.setPointerCapture(event.pointerId);
});

canvas.addEventListener("pointermove", (event) => {
  if (pointer.active) {
    setPointerPosition(event);
  }
});

canvas.addEventListener("pointerup", () => {
  pointer.active = false;
});

canvas.addEventListener("pointercancel", () => {
  pointer.active = false;
});

window.addEventListener("resize", resizeCanvas);
resizeCanvas();
updateHud();
