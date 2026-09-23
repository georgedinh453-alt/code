const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const gemCountEl = document.getElementById('gem-count');
const buildStatusEl = document.getElementById('build-status');

const world = {
  width: canvas.width,
  height: canvas.height,
  gravity: 0.55,
  buildMode: true,
  gems: 0,
  blocks: [],
};

const keys = {};
const pointer = { x: 0, y: 0, down: false };

const player = {
  x: 70,
  y: 330,
  w: 28,
  h: 42,
  vx: 0,
  vy: 0,
  speed: 4.2,
  jumpPower: 12.5,
  onGround: false,
};

const platforms = [
  { x: 0, y: 470, w: 960, h: 70 },
  { x: 120, y: 395, w: 180, h: 18 },
  { x: 390, y: 350, w: 200, h: 18 },
  { x: 670, y: 300, w: 170, h: 18 },
  { x: 250, y: 250, w: 150, h: 18 },
  { x: 540, y: 210, w: 180, h: 18 },
];

const pickups = [
  { x: 188, y: 349, r: 10 },
  { x: 480, y: 304, r: 10 },
  { x: 740, y: 254, r: 10 },
  { x: 312, y: 204, r: 10 },
  { x: 610, y: 164, r: 10 },
];

function rectsIntersect(a, b) {
  return (
    a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y < b.y + b.h &&
    a.y + a.h > b.y
  );
}

function circleRectCollision(circle, rect) {
  const closestX = Math.max(rect.x, Math.min(circle.x, rect.x + rect.w));
  const closestY = Math.max(rect.y, Math.min(circle.y, rect.y + rect.h));
  const dx = circle.x - closestX;
  const dy = circle.y - closestY;
  return dx * dx + dy * dy < circle.r * circle.r;
}

function resetPlayer() {
  player.x = 70;
  player.y = 330;
  player.vx = 0;
  player.vy = 0;
}

function updateHud() {
  gemCountEl.textContent = String(world.gems);
  buildStatusEl.textContent = world.buildMode ? 'ON' : 'OFF';
}

function addBlock(x, y) {
  const block = {
    x: Math.round(x / 24) * 24,
    y: Math.round(y / 24) * 24,
    w: 24,
    h: 24,
  };

  const collides = [...platforms, ...world.blocks].some((obj) => rectsIntersect(block, obj));
  if (!collides && block.x >= 0 && block.x <= world.width - 24 && block.y >= 0 && block.y <= world.height - 24) {
    world.blocks.push(block);
  }
}

function handleInput() {
  if (keys['ArrowLeft'] || keys['a']) {
    player.vx = -player.speed;
  } else if (keys['ArrowRight'] || keys['d']) {
    player.vx = player.speed;
  } else {
    player.vx *= 0.75;
    if (Math.abs(player.vx) < 0.1) player.vx = 0;
  }

  if ((keys['ArrowUp'] || keys['w'] || keys[' ']) && player.onGround) {
    player.vy = -player.jumpPower;
    player.onGround = false;
  }
}

function updatePlayer() {
  handleInput();

  player.vy += world.gravity;
  player.x += player.vx;
  player.y += player.vy;

  player.onGround = false;

  const solids = [...platforms, ...world.blocks];
  for (const solid of solids) {
    if (rectsIntersect(player, solid)) {
      const prevBottom = player.y - player.vy + player.h;
      const prevTop = player.y - player.vy;
      const prevRight = player.x - player.vx + player.w;
      const prevLeft = player.x - player.vx;

      const wasAbove = prevBottom <= solid.y + 4 && player.vy >= 0;
      const wasBelow = prevTop >= solid.y + solid.h - 4 && player.vy < 0;
      const wasLeft = prevRight <= solid.x + 4 && player.vx > 0;
      const wasRight = prevLeft >= solid.x + solid.w - 4 && player.vx < 0;

      if (wasAbove) {
        player.y = solid.y - player.h;
        player.vy = 0;
        player.onGround = true;
      } else if (wasBelow) {
        player.y = solid.y + solid.h;
        player.vy = 0;
      } else if (wasLeft) {
        player.x = solid.x - player.w;
        player.vx = 0;
      } else if (wasRight) {
        player.x = solid.x + solid.w;
        player.vx = 0;
      }
    }
  }

  if (player.y > world.height + 200) {
    resetPlayer();
  }

  if (player.x < 0) player.x = 0;
  if (player.x + player.w > world.width) {
    player.x = world.width - player.w;
  }

  for (let i = pickups.length - 1; i >= 0; i--) {
    const pickup = pickups[i];
    if (circleRectCollision(pickup, player)) {
      pickups.splice(i, 1);
      world.gems += 1;
      updateHud();
    }
  }
}

function drawBackground() {
  ctx.fillStyle = '#7dd3fc';
  ctx.fillRect(0, 0, world.width, world.height);

  ctx.fillStyle = 'rgba(255,255,255,0.18)';
  for (let i = 0; i < 6; i++) {
    const x = 90 + i * 160;
    const y = 70 + (i % 2) * 24;
    ctx.beginPath();
    ctx.arc(x, y, 26, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawPlatforms() {
  for (const platform of [...platforms, ...world.blocks]) {
    ctx.fillStyle = platform === world.blocks[world.blocks.length - 1] ? '#34d399' : '#334155';
    ctx.fillRect(platform.x, platform.y, platform.w, platform.h);
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.strokeRect(platform.x + 0.5, platform.y + 0.5, platform.w - 1, platform.h - 1);
  }
}

function drawPickups() {
  for (const pickup of pickups) {
    ctx.fillStyle = '#67e8f9';
    ctx.beginPath();
    ctx.moveTo(pickup.x, pickup.y - pickup.r);
    ctx.lineTo(pickup.x + pickup.r, pickup.y);
    ctx.lineTo(pickup.x, pickup.y + pickup.r);
    ctx.lineTo(pickup.x - pickup.r, pickup.y);
    ctx.closePath();
    ctx.fill();
  }
}

function drawPlayer() {
  ctx.fillStyle = '#fbbf24';
  ctx.fillRect(player.x, player.y, player.w, player.h);

  ctx.fillStyle = '#111827';
  ctx.fillRect(player.x + 8, player.y + 10, 5, 5);
  ctx.fillRect(player.x + 15, player.y + 10, 5, 5);
  ctx.fillRect(player.x + 9, player.y + 22, 10, 5);
}

function drawBuildCursor() {
  if (!world.buildMode) return;

  const blockX = Math.floor(pointer.x / 24) * 24;
  const blockY = Math.floor(pointer.y / 24) * 24;

  ctx.strokeStyle = 'rgba(52, 211, 153, 0.9)';
  ctx.lineWidth = 2;
  ctx.strokeRect(blockX, blockY, 24, 24);
  ctx.fillStyle = 'rgba(52, 211, 153, 0.15)';
  ctx.fillRect(blockX, blockY, 24, 24);
}

function render() {
  drawBackground();
  drawPlatforms();
  drawPickups();
  drawPlayer();
  drawBuildCursor();
}

function gameLoop() {
  updatePlayer();
  render();
  requestAnimationFrame(gameLoop);
}

document.addEventListener('keydown', (event) => {
  keys[event.key] = true;
  if (event.key === 'b' || event.key === 'B') {
    world.buildMode = !world.buildMode;
    updateHud();
  }
  if (event.key === 'r' || event.key === 'R') {
    resetPlayer();
  }
});

document.addEventListener('keyup', (event) => {
  keys[event.key] = false;
});

canvas.addEventListener('mousemove', (event) => {
  const rect = canvas.getBoundingClientRect();
  pointer.x = ((event.clientX - rect.left) / rect.width) * canvas.width;
  pointer.y = ((event.clientY - rect.top) / rect.height) * canvas.height;
});

canvas.addEventListener('mousedown', () => {
  if (world.buildMode) {
    addBlock(pointer.x, pointer.y);
  }
});

updateHud();
gameLoop();
