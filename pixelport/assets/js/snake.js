/* Neon Snake — the playable demo on the Arcade page. */
(function () {
  "use strict";

  var canvas = document.getElementById("board");
  if (!canvas) return;

  var ctx = canvas.getContext("2d");
  var CELLS = 20;
  var STORE_KEY = "pixelport.snake.best";

  var scoreEl = document.getElementById("score");
  var bestEl = document.getElementById("best");
  var stateEl = document.getElementById("state");
  var startBtn = document.getElementById("start");

  var snake, dir, queued, food, score, best, tickMs, timer, running, paused;

  function readBest() {
    try { return parseInt(localStorage.getItem(STORE_KEY), 10) || 0; }
    catch (e) { return 0; }
  }

  function writeBest(value) {
    try { localStorage.setItem(STORE_KEY, String(value)); } catch (e) { /* ignore */ }
  }

  function resize() {
    var size = Math.floor(canvas.clientWidth);
    var dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    draw();
  }

  function placeFood() {
    var spot;
    do {
      spot = {
        x: Math.floor(Math.random() * CELLS),
        y: Math.floor(Math.random() * CELLS)
      };
    } while (snake.some(function (s) { return s.x === spot.x && s.y === spot.y; }));
    food = spot;
  }

  function reset() {
    snake = [{ x: 9, y: 10 }, { x: 8, y: 10 }, { x: 7, y: 10 }];
    dir = { x: 1, y: 0 };
    queued = [];
    score = 0;
    tickMs = 130;
    placeFood();
    updateHud("Press Start");
  }

  function updateHud(state) {
    scoreEl.textContent = score;
    bestEl.textContent = best;
    stateEl.textContent = state;
  }

  function step() {
    if (queued.length) dir = queued.shift();

    var head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };

    var hitWall = head.x < 0 || head.y < 0 || head.x >= CELLS || head.y >= CELLS;
    var hitSelf = snake.some(function (s) { return s.x === head.x && s.y === head.y; });
    if (hitWall || hitSelf) return gameOver();

    snake.unshift(head);

    if (head.x === food.x && head.y === food.y) {
      score += 10;
      if (score > best) { best = score; writeBest(best); }
      if (tickMs > 65) tickMs -= 3;
      clearInterval(timer);
      timer = setInterval(step, tickMs);
      placeFood();
    } else {
      snake.pop();
    }

    updateHud("Playing");
    draw();
  }

  function draw() {
    if (!snake) return;
    var size = canvas.clientWidth;
    var cell = size / CELLS;

    ctx.clearRect(0, 0, size, size);

    ctx.strokeStyle = "rgba(255,255,255,0.045)";
    ctx.lineWidth = 1;
    for (var i = 1; i < CELLS; i++) {
      ctx.beginPath();
      ctx.moveTo(i * cell, 0);
      ctx.lineTo(i * cell, size);
      ctx.moveTo(0, i * cell);
      ctx.lineTo(size, i * cell);
      ctx.stroke();
    }

    ctx.fillStyle = "#ff5c7c";
    ctx.shadowColor = "#ff5c7c";
    ctx.shadowBlur = 14;
    ctx.fillRect(food.x * cell + cell * 0.2, food.y * cell + cell * 0.2, cell * 0.6, cell * 0.6);
    ctx.shadowBlur = 0;

    snake.forEach(function (part, index) {
      ctx.fillStyle = index === 0 ? "#3ec7a8" : "rgba(124,92,255," + Math.max(0.35, 1 - index / snake.length) + ")";
      ctx.fillRect(part.x * cell + 1, part.y * cell + 1, cell - 2, cell - 2);
    });
  }

  function gameOver() {
    clearInterval(timer);
    running = false;
    paused = false;
    startBtn.textContent = "Play again";
    updateHud("Game over — " + score + " points");
  }

  function start() {
    clearInterval(timer);
    reset();
    running = true;
    paused = false;
    startBtn.textContent = "Restart";
    updateHud("Playing");
    timer = setInterval(step, tickMs);
    draw();
    canvas.focus();
  }

  function turn(x, y) {
    var last = queued.length ? queued[queued.length - 1] : dir;
    if (last.x === -x && last.y === -y) return;   // no instant 180s
    if (last.x === x && last.y === y) return;
    if (queued.length < 2) queued.push({ x: x, y: y });
  }

  var KEYS = {
    ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0],
    w: [0, -1], s: [0, 1], a: [-1, 0], d: [1, 0]
  };

  document.addEventListener("keydown", function (event) {
    var move = KEYS[event.key];
    if (move) {
      event.preventDefault();
      if (running) turn(move[0], move[1]);
      return;
    }
    if (event.key === " ") {
      event.preventDefault();
      if (running) {
        clearInterval(timer);
        running = false;
        paused = true;
        updateHud("Paused");
      } else if (paused) {
        paused = false;
        running = true;
        timer = setInterval(step, tickMs);
        updateHud("Playing");
      } else {
        start();
      }
    }
  });

  /* touch swipe */
  var touchStart = null;
  canvas.addEventListener("touchstart", function (e) {
    touchStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }, { passive: true });

  canvas.addEventListener("touchmove", function (e) {
    if (!touchStart || !running) return;
    var dx = e.touches[0].clientX - touchStart.x;
    var dy = e.touches[0].clientY - touchStart.y;
    if (Math.abs(dx) < 24 && Math.abs(dy) < 24) return;
    if (Math.abs(dx) > Math.abs(dy)) turn(dx > 0 ? 1 : -1, 0);
    else turn(0, dy > 0 ? 1 : -1);
    touchStart = null;
    e.preventDefault();
  }, { passive: false });

  startBtn.addEventListener("click", start);
  window.addEventListener("resize", resize);

  best = readBest();
  reset();
  resize();
})();
