(function () {
  'use strict';

  const canvas = document.getElementById('game-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let W, H, dpr;
  const TILE = 48;
  const COLS = 45;
  const ROWS = 35;
  const WORLD_W = COLS * TILE;
  const WORLD_H = ROWS * TILE;

  const FLOOR = 0, WALL = 1, DOOR = 2, TABLE = 3, CHAIR = 4,
        BOOKSHELF = 5, BED = 6, CABINET = 7, EXIT = 8, ITEM = 9;

  let map = [];
  let itemsOnMap = [];
  let particles = [];
  let collectedItems = [];
  let gameState = 'start';
  let darkMeter = 100;
  let hasStarted = false;
  let isMobile = /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768;
  let foundItemQueue = [];

  const keys = {};
  let mouseX = W / 2, mouseY = H / 2;
  let joystickDir = { x: 0, y: 0 };

  const player = {
    x: 0, y: 0,
    w: 20, h: 20,
    speed: 130,
    angle: 0,
    moving: false
  };

  const camera = {
    x: 0, y: 0,
    targetX: 0, targetY: 0
  };

  const LIGHT = {
    ambientRadius: 70,
    flashlightAngle: 0.5,
    flashlightLength: 280,
    flashlightWidth: 0.35
  };

  let lastTime = 0;
  let audioCtx = null;
  let ambientOsc = null;
  let ambientGain = null;
  let footstepTimer = 0;

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);
  }

  function generateMap() {
    for (let y = 0; y < ROWS; y++) {
      map[y] = new Array(COLS).fill(WALL);
    }

    const rooms = [
      { x: 2, y: 2, w: 9, h: 8, name: 'entrance' },
      { x: 13, y: 2, w: 8, h: 7, name: 'living' },
      { x: 23, y: 2, w: 9, h: 6, name: 'library' },
      { x: 34, y: 2, w: 9, h: 8, name: 'office' },
      { x: 3, y: 13, w: 8, h: 8, name: 'kitchen' },
      { x: 13, y: 12, w: 9, h: 9, name: 'dining' },
      { x: 24, y: 11, w: 9, h: 9, name: 'bedroom' },
      { x: 35, y: 13, w: 8, h: 8, name: 'bathroom' },
      { x: 4, y: 24, w: 7, h: 7, name: 'basement_stairs' },
      { x: 14, y: 24, w: 15, h: 7, name: 'storage' },
      { x: 31, y: 24, w: 10, h: 7, name: 'cellar' },
    ];

    rooms.forEach(r => {
      for (let y = r.y; y < r.y + r.h && y < ROWS; y++) {
        for (let x = r.x; x < r.x + r.w && x < COLS; x++) {
          map[y][x] = FLOOR;
        }
      }
    });

    const corridors = [
      [{ x: 11, y: 2 }, { x: 11, y: 8 }],
      [{ x: 21, y: 2 }, { x: 21, y: 7 }],
      [{ x: 32, y: 2 }, { x: 32, y: 8 }],
      [{ x: 11, y: 8 }, { x: 21, y: 8 }],
      [{ x: 21, y: 7 }, { x: 32, y: 7 }],
      [{ x: 4, y: 10 }, { x: 4, y: 13 }],
      [{ x: 11, y: 8 }, { x: 11, y: 12 }],
      [{ x: 21, y: 8 }, { x: 21, y: 11 }],
      [{ x: 32, y: 8 }, { x: 32, y: 13 }],
      [{ x: 4, y: 21 }, { x: 4, y: 24 }],
      [{ x: 11, y: 21 }, { x: 11, y: 24 }],
      [{ x: 21, y: 20 }, { x: 21, y: 24 }],
      [{ x: 32, y: 21 }, { x: 32, y: 24 }],
      [{ x: 41, y: 10 }, { x: 41, y: 24 }],
      [{ x: 4, y: 10 }, { x: 41, y: 10 }],
      [{ x: 4, y: 21 }, { x: 41, y: 21 }],
    ];

    corridors.forEach(seg => {
      const a = seg[0], b = seg[1];
      for (let x = Math.min(a.x, b.x); x <= Math.max(a.x, b.x); x++) {
        if (x >= 0 && x < COLS) {
          for (let y = Math.min(a.y, b.y); y <= Math.max(a.y, b.y); y++) {
            if (y >= 0 && y < ROWS && map[y][x] === WALL) {
              map[y][x] = FLOOR;
            }
          }
        }
      }
    });

    const furniture = [
      { x: 15, y: 4, w: 2, h: 1, type: TABLE },
      { x: 16, y: 5, w: 1, h: 1, type: CHAIR },
      { x: 25, y: 3, w: 1, h: 3, type: BOOKSHELF },
      { x: 26, y: 3, w: 1, h: 3, type: BOOKSHELF },
      { x: 35, y: 3, w: 2, h: 1, type: TABLE },
      { x: 36, y: 3, w: 1, h: 1, type: CHAIR },
      { x: 5, y: 15, w: 2, h: 2, type: TABLE },
      { x: 5, y: 18, w: 1, h: 1, type: CHAIR },
      { x: 15, y: 14, w: 3, h: 1, type: TABLE },
      { x: 16, y: 15, w: 1, h: 1, type: CHAIR },
      { x: 26, y: 13, w: 2, h: 2, type: BED },
      { x: 26, y: 17, w: 1, h: 1, type: CABINET },
      { x: 36, y: 15, w: 1, h: 1, type: CABINET },
      { x: 6, y: 26, w: 2, h: 1, type: TABLE },
      { x: 16, y: 26, w: 1, h: 2, type: CABINET },
      { x: 33, y: 26, w: 2, h: 1, type: TABLE },
    ];

    furniture.forEach(f => {
      for (let y = f.y; y < f.y + f.h && y < ROWS; y++) {
        for (let x = f.x; x < f.x + f.w && x < COLS; x++) {
          if (map[y][x] === FLOOR) map[y][x] = f.type;
        }
      }
    });

    player.x = 6.5 * TILE;
    player.y = 5.5 * TILE;

    map[30][37] = EXIT;

    const itemPositions = [
      { x: 16, y: 5, text: 'A torn photograph of the Wilmington family. The faces are scratched out.', icon: '\uD83D\uDCF7' },
      { x: 25, y: 4, text: 'A journal entry: "The echoes are getting louder. She speaks through the walls."', icon: '\uD83D\uDCD6' },
      { x: 36, y: 4, text: 'A rusty key labeled "BASEMENT".', icon: '\uD83D\uDD11' },
      { x: 7, y: 16, text: 'A child\'s drawing. A stick figure with red eyes stands in the corner.', icon: '\uD83D\uDD8A\uFE0F' },
      { x: 16, y: 16, text: 'A wine glass with lipstick stains. It\'s still wet.', icon: '\uD83C\uDF77' },
      { x: 27, y: 18, text: 'A locket containing a lock of white hair. It pulses with warmth.', icon: '\uD83D\uDC9B' },
      { x: 6, y: 27, text: 'A faded newspaper clipping: "CHAMPION\'S DAUGHTER VANISHES"', icon: '\uD83D\uDCF0' },
      { x: 17, y: 27, text: 'An antique music box. It plays when no one is touching it.', icon: '\uD83C\uDFB6' },
      { x: 34, y: 27, text: 'A mirror fragment. In the reflection, someone stands behind you.', icon: '\uD83E\uDEA9' },
    ];

    itemPositions.forEach((ip, idx) => {
      if (map[ip.y] && map[ip.y][ip.x] === FLOOR) {
        map[ip.y][ip.x] = ITEM;
        itemsOnMap.push({ x: ip.x, y: ip.y, text: ip.text, icon: ip.icon, collected: false, id: idx });
      }
    });
  }

  function isSolid(col, row) {
    if (row < 0 || row >= ROWS || col < 0 || col >= COLS) return true;
    const t = map[row][col];
    return t === WALL || t === TABLE || t === BOOKSHELF || t === BED || t === CABINET;
  }

  function canMoveTo(x, y) {
    const margin = 2;
    const corners = [
      { cx: x - player.w / 2 + margin, cy: y - player.h / 2 + margin },
      { cx: x + player.w / 2 - margin, cy: y - player.h / 2 + margin },
      { cx: x - player.w / 2 + margin, cy: y + player.h / 2 - margin },
      { cx: x + player.w / 2 - margin, cy: y + player.h / 2 - margin },
    ];
    for (const c of corners) {
      const col = Math.floor(c.cx / TILE);
      const row = Math.floor(c.cy / TILE);
      if (isSolid(col, row)) return false;
    }
    return true;
  }

  function findClosestTile(targetCol, targetRow, startCol, startRow, maxDist) {
    for (let d = 0; d <= maxDist; d++) {
      for (let dx = -d; dx <= d; dx++) {
        for (let dy = -d; dy <= d; dy++) {
          if (Math.abs(dx) !== d && Math.abs(dy) !== d) continue;
          const c = startCol + dx, r = startRow + dy;
          if (c >= 0 && c < COLS && r >= 0 && r < ROWS && map[r][c] === targetCol) {
            return { x: c, y: r };
          }
        }
      }
    }
    return null;
  }

  function distance(x1, y1, x2, y2) {
    return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
  }

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function updatePlayer(dt) {
    if (gameState !== 'playing') return;

    let dx = 0, dy = 0;
    if (!isMobile) {
      if (keys['w'] || keys['arrowup']) dy = -1;
      if (keys['s'] || keys['arrowdown']) dy = 1;
      if (keys['a'] || keys['arrowleft']) dx = -1;
      if (keys['d'] || keys['arrowright']) dx = 1;
    } else {
      dx = joystickDir.x;
      dy = joystickDir.y;
    }

    if (dx !== 0 && dy !== 0) {
      const len = Math.sqrt(dx * dx + dy * dy);
      dx /= len;
      dy /= len;
    }

    const speed = player.speed * dt;
    let newX = player.x + dx * speed;
    let newY = player.y + dy * speed;

    if (canMoveTo(newX, player.y)) player.x = newX;
    if (canMoveTo(player.x, newY)) player.y = newY;

    player.moving = (dx !== 0 || dy !== 0);

    if (player.moving) {
      player.angle = Math.atan2(dy, dx);
      footstepTimer += dt;
      if (footstepTimer > 0.4 && audioCtx) {
        footstepTimer = 0;
        playFootstep();
      }
    } else {
      footstepTimer = 0.3;
    }

    const pCol = Math.floor(player.x / TILE);
    const pRow = Math.floor(player.y / TILE);

    const itemHere = itemsOnMap.find(it => it.x === pCol && it.y === pRow && !it.collected);
    if (itemHere) {
      itemHere.collected = true;
      collectedItems.push(itemHere);
      foundItemQueue.push(itemHere);
      if (foundItemQueue.length === 1) {
        showFoundItem(itemHere);
      }
    }

    if (map[pRow] && map[pRow][pCol] === EXIT) {
      endGame(true);
    }

    darkMeter = Math.min(100, darkMeter + dt * 0.5);
    if (player.moving) darkMeter = Math.max(0, darkMeter - dt * 1.5);

    document.getElementById('darkness-fill').style.width = darkMeter + '%';
    document.getElementById('item-count').textContent = collectedItems.length + ' / ' + itemsOnMap.length;

    const exitLoc = findClosestTile(EXIT, EXIT, pCol, pRow, 30);
    if (exitLoc) {
      const angle = Math.atan2(exitLoc.y - pRow, exitLoc.x - pCol);
      document.getElementById('compass-needle').style.transform = 'rotate(' + (angle * 180 / Math.PI + 90) + 'deg)';
    }

    if (darkMeter >= 100) {
      endGame(false);
    }
  }

  function showFoundItem(item) {
    const overlay = document.getElementById('game-found-screen');
    const text = document.getElementById('found-text');
    text.textContent = item.text;
    overlay.style.display = 'flex';
    document.getElementById('game-hud').style.display = 'none';
  }

  function updateCamera() {
    const targetX = player.x - W / 2;
    const targetY = player.y - H / 2;

    camera.targetX = Math.max(0, Math.min(WORLD_W - W, targetX));
    camera.targetY = Math.max(0, Math.min(WORLD_H - H, targetY));

    camera.x = lerp(camera.x, camera.targetX, 0.08);
    camera.y = lerp(camera.y, camera.targetY, 0.08);
  }

  function drawWorld() {
    ctx.save();

    const startCol = Math.max(0, Math.floor(camera.x / TILE) - 1);
    const endCol = Math.min(COLS, Math.ceil((camera.x + W) / TILE) + 1);
    const startRow = Math.max(0, Math.floor(camera.y / TILE) - 1);
    const endRow = Math.min(ROWS, Math.ceil((camera.y + H) / TILE) + 1);

    for (let row = startRow; row < endRow; row++) {
      for (let col = startCol; col < endCol; col++) {
        const t = map[row][col];
        const sx = col * TILE - camera.x;
        const sy = row * TILE - camera.y;

        if (t === WALL) {
          ctx.fillStyle = '#1a1a1e';
          ctx.fillRect(sx, sy, TILE, TILE);
          ctx.strokeStyle = '#222228';
          ctx.lineWidth = 0.5;
          ctx.strokeRect(sx, sy, TILE, TILE);
          const brick = (row * 7 + col * 13) % 5;
          ctx.fillStyle = '#1e1e24';
          ctx.fillRect(sx + 4, sy + brick * 3 + 2, TILE - 8, 2);
        } else if (t === FLOOR) {
          const shade = ((row + col) % 2 === 0) ? '#1c1c1e' : '#1a1a1c';
          ctx.fillStyle = shade;
          ctx.fillRect(sx, sy, TILE, TILE);
          ctx.strokeStyle = '#1e1e20';
          ctx.lineWidth = 0.3;
          ctx.strokeRect(sx, sy, TILE, TILE);
        } else if (t === DOOR) {
          ctx.fillStyle = '#2a2018';
          ctx.fillRect(sx, sy, TILE, TILE);
          ctx.fillStyle = '#3a2a1a';
          ctx.fillRect(sx + 8, sy + 4, 4, TILE - 8);
        } else if (t === TABLE) {
          ctx.fillStyle = '#1c1c1e';
          ctx.fillRect(sx, sy, TILE, TILE);
          ctx.fillStyle = '#2a1a10';
          ctx.fillRect(sx + 4, sy + TILE / 2 - 2, TILE - 8, 4);
          ctx.fillRect(sx + TILE / 2 - 2, sy + 6, 4, TILE / 2);
        } else if (t === CHAIR) {
          ctx.fillStyle = '#1c1c1e';
          ctx.fillRect(sx, sy, TILE, TILE);
          ctx.fillStyle = '#221810';
          ctx.fillRect(sx + 8, sy + 8, TILE - 22, TILE - 16);
          ctx.fillRect(sx + 8, sy + 8, 4, TILE - 16);
        } else if (t === BOOKSHELF) {
          ctx.fillStyle = '#1e1a14';
          ctx.fillRect(sx, sy, TILE, TILE);
          ctx.fillStyle = '#2a2018';
          for (let i = 0; i < 4; i++) {
            ctx.fillRect(sx + 3, sy + 4 + i * 10, TILE - 6, 8);
          }
        } else if (t === BED) {
          ctx.fillStyle = '#1c1c1e';
          ctx.fillRect(sx, sy, TILE, TILE);
          ctx.fillStyle = '#221e1a';
          ctx.fillRect(sx + 2, sy + TILE / 2, TILE - 4, TILE / 2 - 2);
        } else if (t === CABINET) {
          ctx.fillStyle = '#1e1a14';
          ctx.fillRect(sx, sy, TILE, TILE);
          ctx.fillStyle = '#2a2018';
          ctx.fillRect(sx + 6, sy + 4, TILE - 12, TILE - 8);
        } else if (t === EXIT) {
          ctx.fillStyle = '#0a1a0a';
          ctx.fillRect(sx, sy, TILE, TILE);
          ctx.fillStyle = '#1a3a1a';
          ctx.fillRect(sx + 4, sy + 4, TILE - 8, TILE - 8);
          ctx.fillStyle = 'rgba(50, 200, 80, 0.15)';
          ctx.fillRect(sx, sy, TILE, TILE);
        } else if (t === ITEM) {
          ctx.fillStyle = '#1c1c1e';
          ctx.fillRect(sx, sy, TILE, TILE);
          ctx.fillStyle = 'rgba(255, 204, 136, 0.08)';
          ctx.fillRect(sx + 4, sy + 4, TILE - 8, TILE - 8);
        }
      }
    }

    ctx.restore();
  }

  function drawPlayer() {
    ctx.save();
    const sx = player.x - camera.x;
    const sy = player.y - camera.y;

    const shadow = ctx.createRadialGradient(sx, sy + 6, 2, sx, sy + 6, 14);
    shadow.addColorStop(0, 'rgba(0,0,0,0.3)');
    shadow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = shadow;
    ctx.beginPath();
    ctx.arc(sx, sy + 6, 14, 0, Math.PI * 2);
    ctx.fill();

    const px = sx;
    const py = sy;
    const bw = player.w;
    const bh = player.h;

    ctx.fillStyle = '#2a2a30';
    ctx.beginPath();
    ctx.ellipse(px, py - 4, bw * 0.35, bh * 0.3, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#222228';
    ctx.fillRect(px - bw * 0.2, py + 2, bw * 0.4, bh * 0.3);

    ctx.fillStyle = '#1e1e24';
    ctx.fillRect(px - bw * 0.35, py + bh * 0.2, bw * 0.15, bh * 0.25);
    ctx.fillRect(px + bw * 0.2, py + bh * 0.2, bw * 0.15, bh * 0.25);

    if (player.moving) {
      const legOffset = Math.sin(Date.now() / 120) * 2;
      ctx.fillStyle = '#1a1a20';
      ctx.fillRect(px - bw * 0.2, py + bh * 0.45 + legOffset, bw * 0.15, bh * 0.2);
      ctx.fillRect(px + bw * 0.05, py + bh * 0.45 - legOffset, bw * 0.15, bh * 0.2);
    } else {
      ctx.fillStyle = '#1a1a20';
      ctx.fillRect(px - bw * 0.2, py + bh * 0.45, bw * 0.15, bh * 0.2);
      ctx.fillRect(px + bw * 0.05, py + bh * 0.45, bw * 0.15, bh * 0.2);
    }

    const headBob = player.moving ? Math.sin(Date.now() / 150) * 1.5 : 0;
    ctx.fillStyle = '#2e2a30';
    ctx.beginPath();
    ctx.arc(px, py - bh * 0.35 + headBob, bw * 0.25, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#3a3a3a';
    ctx.fillRect(px - 1, py - bh * 0.4 + headBob, 1, 2);
    ctx.fillRect(px + 1, py - bh * 0.4 + headBob, 1, 2);

    ctx.restore();
  }

  function drawLighting() {
    ctx.save();

    const px = player.x - camera.x;
    const py = player.y - camera.y;

    const flashlightTargetX = mouseX;
    const flashlightTargetY = mouseY;

    const fdx = flashlightTargetX - px;
    const fdy = flashlightTargetY - py;
    const fdist = Math.sqrt(fdx * fdx + fdy * fdy);

    let flashlightAngle = player.angle;
    if (fdist > 10) {
      flashlightAngle = Math.atan2(fdy, fdx);
    }

    const darkGrad = ctx.createRadialGradient(px, py, 5, px, py, LIGHT.ambientRadius);
    darkGrad.addColorStop(0, 'rgba(0,0,0,0)');
    darkGrad.addColorStop(0.6, 'rgba(0,0,0,0.15)');
    darkGrad.addColorStop(1, 'rgba(0,0,0,0.85)');

    ctx.fillStyle = 'rgba(0,0,0,0.92)';
    ctx.fillRect(0, 0, W, H);

    ctx.globalCompositeOperation = 'destination-out';

    const grad = ctx.createRadialGradient(px, py, 0, px, py, LIGHT.ambientRadius);
    grad.addColorStop(0, 'rgba(0,0,0,1)');
    grad.addColorStop(0.4, 'rgba(0,0,0,1)');
    grad.addColorStop(0.7, 'rgba(0,0,0,0.8)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(px, py, LIGHT.ambientRadius, 0, Math.PI * 2);
    ctx.fill();

    const coneLen = LIGHT.flashlightLength;
    const coneAngle = LIGHT.flashlightWidth;

    ctx.beginPath();
    ctx.moveTo(px, py);
    const a1 = flashlightAngle - coneAngle;
    const a2 = flashlightAngle + coneAngle;
    ctx.lineTo(px + Math.cos(a1) * coneLen, py + Math.sin(a1) * coneLen);
    ctx.arc(px, py, coneLen, a1, a2);
    ctx.closePath();

    const coneGrad = ctx.createRadialGradient(px, py, 0, px, py, coneLen);
    coneGrad.addColorStop(0, 'rgba(0,0,0,1)');
    coneGrad.addColorStop(0.5, 'rgba(0,0,0,0.95)');
    coneGrad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = coneGrad;
    ctx.fill();

    ctx.globalCompositeOperation = 'source-over';

    ctx.restore();
  }

  function drawParticles() {
    ctx.save();
    const px = player.x - camera.x;
    const py = player.y - camera.y;

    for (const p of particles) {
      const sx = p.x - camera.x;
      const sy = p.y - camera.y;

      const distToPlayer = distance(sx, sy, px, py);
      if (distToPlayer > LIGHT.flashlightLength + 50) continue;

      const alpha = Math.max(0, 1 - distToPlayer / (LIGHT.flashlightLength + 50)) * p.alpha * 0.3;
      ctx.fillStyle = 'rgba(200, 200, 200, ' + alpha + ')';
      ctx.beginPath();
      ctx.arc(sx, sy, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function updateParticles(dt) {
    const targetCount = isMobile ? 30 : 60;
    while (particles.length < targetCount) {
      spawnParticle();
    }
    while (particles.length > targetCount) {
      particles.pop();
    }

    for (const p of particles) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.alpha += (0.3 - p.alpha) * 0.02;

      if (p.x < 0 || p.x > WORLD_W || p.y < 0 || p.y > WORLD_H) {
        p.x = Math.random() * WORLD_W;
        p.y = Math.random() * WORLD_H;
        p.vx = (Math.random() - 0.5) * 8;
        p.vy = (Math.random() - 0.5) * 6 - 3;
      }
    }
  }

  function spawnParticle() {
    const px = player.x;
    const py = player.y;
    const spawnDist = 300 + Math.random() * 200;
    const angle = Math.random() * Math.PI * 2;
    particles.push({
      x: px + Math.cos(angle) * spawnDist,
      y: py + Math.sin(angle) * spawnDist,
      vx: (Math.random() - 0.5) * 8,
      vy: (Math.random() - 0.5) * 6 - 2,
      size: 0.5 + Math.random() * 1.5,
      alpha: Math.random() * 0.3
    });
  }

  function drawVignette() {
    const grad = ctx.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, H * 0.8);
    grad.addColorStop(0, 'rgba(0,0,0,0)');
    grad.addColorStop(0.6, 'rgba(0,0,0,0)');
    grad.addColorStop(1, 'rgba(0,0,0,0.5)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
  }

  function drawScanlines() {
    ctx.save();
    ctx.globalAlpha = 0.03;
    for (let y = 0; y < H; y += 3) {
      ctx.fillStyle = '#000';
      ctx.fillRect(0, y, W, 1);
    }
    ctx.restore();
  }

  function drawCrosshair() {
    ctx.save();
    const size = 6;
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(mouseX - size, mouseY);
    ctx.lineTo(mouseX + size, mouseY);
    ctx.moveTo(mouseX, mouseY - size);
    ctx.lineTo(mouseX, mouseY + size);
    ctx.stroke();
    ctx.restore();
  }

  // Audio
  function initAudio() {
    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      ambientGain = audioCtx.createGain();
      ambientGain.gain.value = 0.05;
      ambientGain.connect(audioCtx.destination);

      ambientOsc = audioCtx.createOscillator();
      ambientOsc.type = 'sawtooth';
      ambientOsc.frequency.value = 55;
      ambientOsc.connect(ambientGain);
      ambientOsc.start();

      const filter = audioCtx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 100;
      ambientGain.disconnect();
      ambientGain.connect(filter);
      filter.connect(audioCtx.destination);
    } catch (e) {
      audioCtx = null;
    }
  }

  function playFootstep() {
    if (!audioCtx) return;
    try {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.value = 80 + Math.random() * 40;
      gain.gain.setValueAtTime(0.02, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.08);
    } catch (e) {}
  }

  // Game loop
  function gameLoop(timestamp) {
    const dt = Math.min((timestamp - lastTime) / 1000, 0.05);
    lastTime = timestamp;

    if (gameState === 'playing' && hasStarted) {
      updatePlayer(dt);
      updateParticles(dt);
      updateCamera();
    }

    render();
    requestAnimationFrame(gameLoop);
  }

  function render() {
    ctx.fillStyle = '#0a0a0c';
    ctx.fillRect(0, 0, W, H);

    drawWorld();
    drawParticles();
    drawPlayer();
    drawLighting();
    drawVignette();
    drawScanlines();
    if (!isMobile) drawCrosshair();

    if (gameState === 'playing') {
      drawItemNearby();
    }
  }

  function drawItemNearby() {
    const pCol = Math.floor(player.x / TILE);
    const pRow = Math.floor(player.y / TILE);

    for (const item of itemsOnMap) {
      if (item.collected) continue;
      const dist = distance(pCol, pRow, item.x, item.y);
      if (dist < 4) {
        ctx.save();
        const sx = item.x * TILE + TILE / 2 - camera.x;
        const sy = item.y * TILE - 8 - camera.y;
        const pulse = 0.5 + Math.sin(Date.now() / 400) * 0.3;
        ctx.globalAlpha = pulse;
        ctx.fillStyle = 'rgba(255, 204, 136, 0.6)';
        ctx.font = '16px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(item.icon || '\uD83D\uDCE6', sx, sy);
        ctx.restore();
      }
    }
  }

  // Input
  function initInput() {
    document.addEventListener('keydown', e => {
      keys[e.key.toLowerCase()] = true;
    });
    document.addEventListener('keyup', e => {
      keys[e.key.toLowerCase()] = false;
    });
    document.addEventListener('mousemove', e => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    });

    if (isMobile) {
      setupTouchControls();
    }
  }

  function setupTouchControls() {
    const joystickZone = document.getElementById('touch-joystick');
    const knob = document.getElementById('joystick-knob');

    function handleJoystick(e) {
      e.preventDefault();
      const touch = e.touches ? e.touches[0] : e;
      const rect = joystickZone.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const maxR = rect.width / 2 - 25;

      let dx = touch.clientX - cx;
      let dy = touch.clientY - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist > maxR) {
        dx = dx / dist * maxR;
        dy = dy / dist * maxR;
      }

      knob.style.transform = 'translate(' + (dx - 25 + 2) + 'px, ' + (dy - 25 + 2) + 'px)';
      knob.style.left = '50%';
      knob.style.top = '50%';

      if (dist < 10) {
        joystickDir.x = 0;
        joystickDir.y = 0;
      } else {
        joystickDir.x = dx / maxR;
        joystickDir.y = dy / maxR;
      }
    }

    function resetJoystick() {
      joystickDir.x = 0;
      joystickDir.y = 0;
      knob.style.transform = 'translate(-50%, -50%)';
      knob.style.left = '50%';
      knob.style.top = '50%';
    }

    joystickZone.addEventListener('touchstart', handleJoystick);
    joystickZone.addEventListener('touchmove', handleJoystick);
    joystickZone.addEventListener('touchend', resetJoystick);
    joystickZone.addEventListener('touchcancel', resetJoystick);

    joystickZone.addEventListener('mousedown', e => {
      function onMove(ev) { handleJoystick(ev); }
      function onUp() {
        resetJoystick();
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
      }
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    });

    const actionBtn = document.getElementById('touch-action');
    actionBtn.addEventListener('touchstart', e => {
      e.preventDefault();
      toggleFlashlightClick();
    });
    actionBtn.addEventListener('mousedown', toggleFlashlightClick);
  }

  let flashLightBoost = false;
  let boostTimer = 0;

  function toggleFlashlightClick() {
    flashLightBoost = true;
    boostTimer = 0.3;
  }

  // Game states
  function startGame() {
    document.getElementById('game-start-screen').style.display = 'none';
    document.getElementById('game-hud').style.display = 'flex';
    if (isMobile) document.getElementById('mobile-controls').style.display = 'block';

    if (!hasStarted) {
      resize();
      generateMap();
      camera.x = player.x - W / 2;
      camera.y = player.y - H / 2;
      hasStarted = true;
      spawnParticles();
      initAudio();
    }

    gameState = 'playing';
  }

  function endGame(won) {
    gameState = 'end';
    document.getElementById('game-hud').style.display = 'none';
    if (isMobile) document.getElementById('mobile-controls').style.display = 'none';

    const overlay = document.getElementById('game-end-screen');
    const title = overlay.querySelector('.game-title');
    const text = document.getElementById('game-result-text');

    if (won) {
      title.textContent = 'YOU ESCAPED';
      title.className = 'game-title escape-title';
      text.textContent = 'You escaped the Wilmington Mansion with ' + collectedItems.length + ' evidence' + (collectedItems.length !== 1 ? 's' : '') + '.\n\nThe truth about the echoes remains buried... for now.';
    } else {
      title.textContent = 'CONSUMED BY DARKNESS';
      title.className = 'game-title';
      title.style.color = '#ff4444';
      title.style.textShadow = '0 0 40px rgba(255, 68, 68, 0.3)';
      text.textContent = 'The darkness swallowed you whole.\n\nThe mansion claims another soul.';
    }

    overlay.style.display = 'flex';
  }

  function restartGame() {
    collectedItems = [];
    itemsOnMap = [];
    particles = [];
    foundItemQueue = [];
    darkMeter = 100;

    document.getElementById('game-end-screen').style.display = 'none';
    document.getElementById('game-found-screen').style.display = 'none';

    generateMap();
    camera.x = player.x - W / 2;
    camera.y = player.y - H / 2;
    gameState = 'playing';
    document.getElementById('game-hud').style.display = 'flex';
    if (isMobile) document.getElementById('mobile-controls').style.display = 'block';

    document.getElementById('darkness-fill').style.width = '100%';
    document.getElementById('item-count').textContent = '0 / ' + itemsOnMap.length;
  }

  function spawnParticles() {
    for (let i = 0; i < (isMobile ? 30 : 60); i++) {
      particles.push({
        x: Math.random() * WORLD_W,
        y: Math.random() * WORLD_H,
        vx: (Math.random() - 0.5) * 8,
        vy: (Math.random() - 0.5) * 6 - 2,
        size: 0.5 + Math.random() * 1.5,
        alpha: Math.random() * 0.3
      });
    }
  }

  function init() {
    resize();
    window.addEventListener('resize', resize);

    document.getElementById('game-start-btn').addEventListener('click', startGame);
    document.getElementById('game-restart-btn').addEventListener('click', restartGame);
    document.getElementById('game-continue-btn').addEventListener('click', () => {
      document.getElementById('game-found-screen').style.display = 'none';
      document.getElementById('game-hud').style.display = 'flex';
      if (isMobile) document.getElementById('mobile-controls').style.display = 'block';

      foundItemQueue.shift();
      if (foundItemQueue.length > 0) {
        showFoundItem(foundItemQueue[0]);
      }
    });

    initInput();
    requestAnimationFrame(gameLoop);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
