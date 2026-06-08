/* ============================================================
 * 坦克大战 · Tank Battle
 * HTML5 Canvas + 纯 JavaScript 实现
 * ============================================================ */

(() => {
  "use strict";

  // ---- 基本配置 ----------------------------------------------------------
  const TILE = 48;            // 一个格子的像素大小
  const COLS = 13;            // 地图列数
  const ROWS = 13;            // 地图行数
  const W = TILE * COLS;      // 画布宽 624
  const H = TILE * ROWS;      // 画布高 624

  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");

  // UI 元素
  const ui = {
    stage: document.getElementById("uiStage"),
    score: document.getElementById("uiScore"),
    lives: document.getElementById("uiLives"),
    enemies: document.getElementById("uiEnemies"),
  };
  const overlay = document.getElementById("overlay");
  const ovTitle = document.getElementById("ovTitle");
  const ovText = document.getElementById("ovText");
  const startBtn = document.getElementById("startBtn");

  // ---- 地砖类型 ----------------------------------------------------------
  const T = {
    EMPTY: 0,
    BRICK: 1,   // 砖墙：可被子弹打掉
    STEEL: 2,   // 钢墙：不可摧毁
    GRASS: 3,   // 草丛：可穿越、遮挡视觉
    WATER: 4,   // 河流：坦克不能过，子弹可过
    BASE: 5,    // 基地（老巢）
  };

  const DIR = { UP: 0, RIGHT: 1, DOWN: 2, LEFT: 3 };
  const DVEC = {
    [DIR.UP]:    { x: 0, y: -1 },
    [DIR.RIGHT]: { x: 1, y: 0 },
    [DIR.DOWN]:  { x: 0, y: 1 },
    [DIR.LEFT]:  { x: -1, y: 0 },
  };

  // ---- 关卡布局 ----------------------------------------------------------
  // 关卡用字符串描述，长度 = COLS*ROWS。
  //   '.' 空地  'B' 砖  'S' 钢  'G' 草  'W' 水  'X' 基地
  // 基地固定在底部中间，其周围由墙保护。
  const LEVELS = [
    // 关卡 1
    [
      ".............",
      ".BB.SS.SS.BB.",
      ".BB.S..S.BB..",
      "....B..B.....",
      ".SS.BB.BB.SS.",
      ".S.........S.",
      "..B.GG.GG.B..",
      ".S.........S.",
      ".SS.BB.BB.SS.",
      "....B..B.....",
      ".BB.S..S.BB..",
      "....BBBBB....",
      ".....BXB.....",
    ],
    // 关卡 2
    [
      "..S.......S..",
      ".BBB.WW.BBB..",
      ".B.B.WW.B.B..",
      "....GGGGG....",
      ".SS.B...B.SS.",
      ".S..B.S.B..S.",
      "..BBB.S.BBB..",
      ".S..B.S.B..S.",
      ".SS.B...B.SS.",
      "....GGGGG....",
      ".B.B.WW.B.B..",
      ".BBB.BBB.BBB.",
      ".....BXB.....",
    ],
    // 关卡 3
    [
      "S...S...S...S",
      ".BBBBB.BBBBB.",
      ".B.WWW.WWW.B.",
      ".B.W.....W.B.",
      "...W.GGG.W...",
      ".S.W.G.G.W.S.",
      "...W.G.G.W...",
      ".S.W.G.G.W.S.",
      "...W.GGG.W...",
      ".B.W.....W.B.",
      ".B.WWW.WWW.B.",
      ".BBBB.B.BBBB.",
      ".....BXB.....",
    ],
  ];

  // ---- 游戏状态 ----------------------------------------------------------
  const State = { MENU: 0, PLAYING: 1, PAUSED: 2, OVER: 3, WIN: 4 };

  const game = {
    state: State.MENU,
    grid: [],            // 二维瓦片数组
    player: null,
    enemies: [],
    bullets: [],
    effects: [],         // 爆炸特效
    stage: 1,
    score: 0,
    lives: 3,
    baseAlive: true,
    spawnQueue: 0,       // 本关还需生成的敌人数
    maxEnemies: 4,       // 同屏最大敌人数
    spawnTimer: 0,
    keys: {},
    lastTime: 0,
    spawnPoints: [],     // 敌人出生点（格坐标）
    basePos: { col: 6, row: 12 },
  };

  // ---- 工具函数 ----------------------------------------------------------
  const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);
  const rectsOverlap = (a, b) =>
    a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

  function tileAt(px, py) {
    const c = Math.floor(px / TILE);
    const r = Math.floor(py / TILE);
    if (c < 0 || c >= COLS || r < 0 || r >= ROWS) return T.STEEL; // 边界当钢墙
    return game.grid[r][c];
  }

  // ---- 地图加载 ----------------------------------------------------------
  function loadLevel(stageNum) {
    const layout = LEVELS[(stageNum - 1) % LEVELS.length];
    const charMap = { ".": T.EMPTY, "B": T.BRICK, "S": T.STEEL, "G": T.GRASS, "W": T.WATER, "X": T.BASE };
    game.grid = [];
    for (let r = 0; r < ROWS; r++) {
      const row = [];
      const line = layout[r] || ".".repeat(COLS);
      for (let c = 0; c < COLS; c++) {
        const ch = line[c] || ".";
        row.push(charMap[ch] ?? T.EMPTY);
        if (ch === "X") game.basePos = { col: c, row: r };
      }
      game.grid.push(row);
    }
    // 敌人出生点：顶部三处
    game.spawnPoints = [
      { col: 0, row: 0 },
      { col: 6, row: 0 },
      { col: 12, row: 0 },
    ];
  }

  // ---- 实体：坦克 --------------------------------------------------------
  function makeTank(col, row, opts) {
    return Object.assign(
      {
        x: col * TILE + 4,
        y: row * TILE + 4,
        w: TILE - 8,
        h: TILE - 8,
        dir: DIR.UP,
        speed: 1.6,
        isPlayer: false,
        cooldown: 0,
        fireDelay: 600,    // 毫秒
        moveTimer: 0,      // AI 换方向计时
        invincible: 0,     // 无敌帧（毫秒）
        alive: true,
      },
      opts
    );
  }

  function spawnPlayer() {
    const col = 4, row = 12;
    game.player = makeTank(col, row, {
      isPlayer: true,
      dir: DIR.UP,
      speed: 2.2,
      fireDelay: 300,
      color: "#f5c518",
      invincible: 1500,
    });
  }

  function spawnEnemy() {
    if (game.spawnQueue <= 0) return;
    if (game.enemies.length >= game.maxEnemies) return;
    // 选一个未被占用的出生点
    const points = game.spawnPoints.slice().sort(() => 0.5 - Math.random());
    for (const p of points) {
      const test = { x: p.col * TILE + 4, y: p.row * TILE + 4, w: TILE - 8, h: TILE - 8 };
      const blocked = game.enemies.some((e) => rectsOverlap(test, e));
      if (!blocked) {
        const fast = Math.random() < 0.3;
        const e = makeTank(p.col, p.row, {
          dir: DIR.DOWN,
          speed: fast ? 1.9 : 1.2,
          fireDelay: 900 + Math.random() * 800,
          color: fast ? "#7ee0d8" : "#d77",
          moveTimer: 400,
          invincible: 400,
        });
        game.enemies.push(e);
        game.spawnQueue--;
        updateUI();
        return;
      }
    }
  }

  // ---- 移动 & 碰撞 -------------------------------------------------------
  // 检查坦克放到 (nx, ny) 是否合法（不撞墙、水、其它坦克）
  function canMoveTo(tank, nx, ny) {
    const box = { x: nx, y: ny, w: tank.w, h: tank.h };
    if (nx < 0 || ny < 0 || nx + tank.w > W || ny + tank.h > H) return false;

    // 采样四角对应的瓦片
    const corners = [
      [box.x, box.y],
      [box.x + box.w - 1, box.y],
      [box.x, box.y + box.h - 1],
      [box.x + box.w - 1, box.y + box.h - 1],
    ];
    for (const [cx, cy] of corners) {
      const t = tileAt(cx, cy);
      if (t === T.BRICK || t === T.STEEL || t === T.WATER || t === T.BASE) return false;
    }
    // 与其它坦克碰撞
    const others = [game.player, ...game.enemies].filter((o) => o && o !== tank && o.alive);
    for (const o of others) {
      if (rectsOverlap(box, o)) return false;
    }
    return true;
  }

  function moveTank(tank, dt) {
    const v = DVEC[tank.dir];
    const dist = tank.speed * (dt / 16.67);
    const nx = tank.x + v.x * dist;
    const ny = tank.y + v.y * dist;
    if (canMoveTo(tank, nx, ny)) {
      tank.x = nx;
      tank.y = ny;
    } else {
      // 撞墙时对齐到网格，避免卡缝
      tank.x = Math.round(tank.x / 4) * 4;
      tank.y = Math.round(tank.y / 4) * 4;
    }
  }

  // ---- 子弹 --------------------------------------------------------------
  function fire(tank) {
    if (tank.cooldown > 0) return;
    tank.cooldown = tank.fireDelay;
    const v = DVEC[tank.dir];
    const cx = tank.x + tank.w / 2;
    const cy = tank.y + tank.h / 2;
    game.bullets.push({
      x: cx - 3 + v.x * (tank.w / 2),
      y: cy - 3 + v.y * (tank.h / 2),
      w: 6,
      h: 6,
      dir: tank.dir,
      speed: 6,
      owner: tank.isPlayer ? "player" : "enemy",
      alive: true,
    });
  }

  function updateBullets(dt) {
    const step = dt / 16.67;
    for (const b of game.bullets) {
      const v = DVEC[b.dir];
      b.x += v.x * b.speed * step;
      b.y += v.y * b.speed * step;

      // 出界
      if (b.x < 0 || b.y < 0 || b.x > W || b.y > H) {
        b.alive = false;
        continue;
      }

      // 撞墙
      const t = tileAt(b.x + 3, b.y + 3);
      const c = Math.floor((b.x + 3) / TILE);
      const r = Math.floor((b.y + 3) / TILE);
      if (t === T.BRICK) {
        game.grid[r][c] = T.EMPTY;
        b.alive = false;
        addExplosion(b.x, b.y, 12);
        continue;
      }
      if (t === T.STEEL) {
        b.alive = false;
        addExplosion(b.x, b.y, 10);
        continue;
      }
      if (t === T.BASE) {
        game.grid[r][c] = T.EMPTY;
        b.alive = false;
        destroyBase();
        continue;
      }

      // 撞坦克
      if (b.owner === "player") {
        for (const e of game.enemies) {
          if (e.alive && e.invincible <= 0 && rectsOverlap(b, e)) {
            e.alive = false;
            b.alive = false;
            addExplosion(e.x, e.y, 28);
            game.score += 100;
            updateUI();
            break;
          }
        }
      } else {
        const p = game.player;
        if (p && p.alive && rectsOverlap(b, p)) {
          b.alive = false;
          if (p.invincible <= 0) playerHit();
        }
        // 敌方子弹也能打基地周围的砖（已在上面处理 BASE）
      }
    }
    game.bullets = game.bullets.filter((b) => b.alive);
  }

  // ---- 爆炸特效 ----------------------------------------------------------
  function addExplosion(x, y, size) {
    game.effects.push({ x, y, size, t: 0, dur: 300 });
  }

  function updateEffects(dt) {
    for (const e of game.effects) e.t += dt;
    game.effects = game.effects.filter((e) => e.t < e.dur);
  }

  // ---- 玩家与基地受击 ----------------------------------------------------
  function playerHit() {
    addExplosion(game.player.x, game.player.y, 30);
    game.lives--;
    updateUI();
    if (game.lives <= 0) {
      game.player.alive = false;
      endGame(false);
    } else {
      spawnPlayer();
    }
  }

  function destroyBase() {
    if (!game.baseAlive) return;
    game.baseAlive = false;
    addExplosion(game.basePos.col * TILE, game.basePos.row * TILE, 40);
    endGame(false);
  }

  // ---- 敌人 AI -----------------------------------------------------------
  function updateEnemyAI(e, dt) {
    e.moveTimer -= dt;
    if (e.moveTimer <= 0) {
      // 一定概率朝基地/玩家方向，否则随机
      e.moveTimer = 500 + Math.random() * 1500;
      if (Math.random() < 0.55) {
        const target = Math.random() < 0.6 ? game.basePos : null;
        if (target) {
          const tx = target.col * TILE;
          const ty = target.row * TILE;
          e.dir = Math.abs(tx - e.x) > Math.abs(ty - e.y)
            ? (tx > e.x ? DIR.RIGHT : DIR.LEFT)
            : (ty > e.y ? DIR.DOWN : DIR.UP);
        } else if (game.player && game.player.alive) {
          const tx = game.player.x, ty = game.player.y;
          e.dir = Math.abs(tx - e.x) > Math.abs(ty - e.y)
            ? (tx > e.x ? DIR.RIGHT : DIR.LEFT)
            : (ty > e.y ? DIR.DOWN : DIR.UP);
        }
      } else {
        e.dir = Math.floor(Math.random() * 4);
      }
    }
    moveTank(e, dt);
    // 开火
    if (Math.random() < 0.02) fire(e);
  }

  // ---- 输入 --------------------------------------------------------------
  const KEYMAP = {
    ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right",
    KeyW: "up", KeyS: "down", KeyA: "left", KeyD: "right",
    Space: "fire", KeyP: "pause",
  };

  window.addEventListener("keydown", (e) => {
    const k = KEYMAP[e.code];
    if (!k) return;
    e.preventDefault();
    if (k === "pause") {
      if (game.state === State.PLAYING) pauseGame();
      else if (game.state === State.PAUSED) resumeGame();
      return;
    }
    game.keys[k] = true;
  });
  window.addEventListener("keyup", (e) => {
    const k = KEYMAP[e.code];
    if (k && k !== "pause") game.keys[k] = false;
  });

  function handlePlayerInput(dt) {
    const p = game.player;
    if (!p || !p.alive) return;
    let moved = false;
    if (game.keys.up) { p.dir = DIR.UP; moveTank(p, dt); moved = true; }
    else if (game.keys.down) { p.dir = DIR.DOWN; moveTank(p, dt); moved = true; }
    else if (game.keys.left) { p.dir = DIR.LEFT; moveTank(p, dt); moved = true; }
    else if (game.keys.right) { p.dir = DIR.RIGHT; moveTank(p, dt); moved = true; }
    if (game.keys.fire) fire(p);
    return moved;
  }

  // ---- 绘制 --------------------------------------------------------------
  function draw() {
    // 背景
    ctx.fillStyle = "#0b0e14";
    ctx.fillRect(0, 0, W, H);

    // 地砖（草要最后画以覆盖坦克）
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const t = game.grid[r][c];
        if (t === T.EMPTY || t === T.GRASS) continue;
        drawTile(t, c * TILE, r * TILE);
      }
    }

    // 子弹
    for (const b of game.bullets) {
      ctx.fillStyle = "#fff";
      ctx.fillRect(b.x, b.y, b.w, b.h);
    }

    // 坦克
    if (game.player && game.player.alive) drawTank(game.player);
    for (const e of game.enemies) if (e.alive) drawTank(e);

    // 草丛（覆盖在坦克之上，形成遮挡）
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (game.grid[r][c] === T.GRASS) drawTile(T.GRASS, c * TILE, r * TILE);
      }
    }

    // 爆炸
    for (const e of game.effects) drawExplosion(e);
  }

  function drawTile(t, x, y) {
    if (t === T.BRICK) {
      ctx.fillStyle = "#8b4a2f";
      ctx.fillRect(x, y, TILE, TILE);
      ctx.fillStyle = "#a85c3a";
      // 砖纹
      for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 2; j++) {
          const bx = x + j * (TILE / 2) + (i % 2) * (TILE / 4);
          ctx.fillRect(bx + 1, y + i * (TILE / 4) + 1, TILE / 2 - 2, TILE / 4 - 2);
        }
      }
    } else if (t === T.STEEL) {
      ctx.fillStyle = "#9aa7b8";
      ctx.fillRect(x, y, TILE, TILE);
      ctx.fillStyle = "#c5d0dc";
      ctx.fillRect(x + 4, y + 4, TILE / 2 - 6, TILE / 2 - 6);
      ctx.fillRect(x + TILE / 2 + 2, y + TILE / 2 + 2, TILE / 2 - 6, TILE / 2 - 6);
      ctx.fillStyle = "#6f7d8c";
      ctx.fillRect(x + TILE / 2 + 2, y + 4, TILE / 2 - 6, TILE / 2 - 6);
      ctx.fillRect(x + 4, y + TILE / 2 + 2, TILE / 2 - 6, TILE / 2 - 6);
    } else if (t === T.WATER) {
      ctx.fillStyle = "#15527a";
      ctx.fillRect(x, y, TILE, TILE);
      ctx.fillStyle = "#2a7bb0";
      ctx.fillRect(x + 4, y + 10, TILE - 8, 4);
      ctx.fillRect(x + 8, y + 26, TILE - 16, 4);
    } else if (t === T.GRASS) {
      ctx.fillStyle = "rgba(40, 140, 60, 0.85)";
      ctx.fillRect(x, y, TILE, TILE);
      ctx.fillStyle = "rgba(60, 170, 80, 0.9)";
      for (let i = 0; i < 5; i++) {
        const gx = x + (i * 11) % TILE;
        const gy = y + ((i * 17) % TILE);
        ctx.fillRect(gx, gy, 6, 6);
      }
    } else if (t === T.BASE) {
      drawBase(x, y);
    }
  }

  function drawBase(x, y) {
    if (game.baseAlive) {
      ctx.fillStyle = "#f5c518";
      ctx.fillRect(x + 8, y + 8, TILE - 16, TILE - 16);
      ctx.fillStyle = "#1a1a1a";
      // 简易的鹰/星标志
      ctx.beginPath();
      ctx.moveTo(x + TILE / 2, y + 12);
      ctx.lineTo(x + TILE - 14, y + TILE - 12);
      ctx.lineTo(x + 14, y + TILE - 12);
      ctx.closePath();
      ctx.fill();
    } else {
      ctx.fillStyle = "#444";
      ctx.fillRect(x + 8, y + 8, TILE - 16, TILE - 16);
      ctx.fillStyle = "#222";
      ctx.fillRect(x + 12, y + 20, TILE - 24, 6);
    }
  }

  function drawTank(t) {
    ctx.save();
    const cx = t.x + t.w / 2;
    const cy = t.y + t.h / 2;
    ctx.translate(cx, cy);
    ctx.rotate((t.dir * Math.PI) / 2); // 0=上，顺时针
    const w = t.w, h = t.h;

    // 无敌闪烁
    if (t.invincible > 0 && Math.floor(t.invincible / 100) % 2 === 0) {
      ctx.globalAlpha = 0.4;
    }

    const body = t.color || (t.isPlayer ? "#f5c518" : "#d77");
    // 履带
    ctx.fillStyle = "#3a3a3a";
    ctx.fillRect(-w / 2, -h / 2, w * 0.22, h);
    ctx.fillRect(w / 2 - w * 0.22, -h / 2, w * 0.22, h);
    // 车身
    ctx.fillStyle = body;
    ctx.fillRect(-w * 0.28, -h * 0.4, w * 0.56, h * 0.8);
    // 炮塔
    ctx.fillStyle = shade(body, -20);
    ctx.beginPath();
    ctx.arc(0, 0, w * 0.22, 0, Math.PI * 2);
    ctx.fill();
    // 炮管（朝上）
    ctx.fillStyle = "#222";
    ctx.fillRect(-3, -h / 2 - 2, 6, h * 0.5);

    ctx.restore();
  }

  function drawExplosion(e) {
    const p = e.t / e.dur;
    const radius = e.size * (0.4 + p * 0.8);
    const alpha = 1 - p;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = "#ffd34d";
    ctx.beginPath();
    ctx.arc(e.x + 3, e.y + 3, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ff7a18";
    ctx.beginPath();
    ctx.arc(e.x + 3, e.y + 3, radius * 0.55, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // 颜色明暗调整
  function shade(hex, amt) {
    const h = hex.replace("#", "");
    const num = parseInt(h.length === 3 ? h.split("").map((x) => x + x).join("") : h, 16);
    let r = clamp((num >> 16) + amt, 0, 255);
    let g = clamp(((num >> 8) & 0xff) + amt, 0, 255);
    let b = clamp((num & 0xff) + amt, 0, 255);
    return `rgb(${r},${g},${b})`;
  }

  // ---- 主循环 ------------------------------------------------------------
  function update(dt) {
    // 冷却 & 无敌计时
    const allTanks = [game.player, ...game.enemies].filter(Boolean);
    for (const tk of allTanks) {
      if (tk.cooldown > 0) tk.cooldown -= dt;
      if (tk.invincible > 0) tk.invincible -= dt;
    }

    handlePlayerInput(dt);
    for (const e of game.enemies) if (e.alive) updateEnemyAI(e, dt);

    updateBullets(dt);
    updateEffects(dt);

    // 清理死亡敌人
    game.enemies = game.enemies.filter((e) => e.alive);

    // 生成敌人
    game.spawnTimer -= dt;
    if (game.spawnTimer <= 0) {
      game.spawnTimer = 1500;
      spawnEnemy();
    }
    updateUI();

    // 胜利判定：队列清空且场上无敌人
    if (game.spawnQueue <= 0 && game.enemies.length === 0) {
      nextStage();
    }
  }

  let rafId = null;
  function loop(now) {
    if (game.state !== State.PLAYING) return;
    const dt = Math.min(now - game.lastTime, 50); // 防止切后台后大跳
    game.lastTime = now;

    update(dt);
    draw();

    rafId = requestAnimationFrame(loop);
  }

  // ---- 流程控制 ----------------------------------------------------------
  function startStage(stageNum) {
    game.stage = stageNum;
    loadLevel(stageNum);
    game.enemies = [];
    game.bullets = [];
    game.effects = [];
    game.baseAlive = true;
    game.spawnQueue = 8 + (stageNum - 1) * 2;   // 每关敌人数递增
    game.maxEnemies = Math.min(4 + Math.floor((stageNum - 1) / 2), 6);
    game.spawnTimer = 500;
    spawnPlayer();
    updateUI();
  }

  function newGame() {
    game.score = 0;
    game.lives = 3;
    startStage(1);
    game.state = State.PLAYING;
    overlay.classList.add("hidden");
    game.lastTime = performance.now();
    rafId = requestAnimationFrame(loop);
  }

  function nextStage() {
    if (game.stage >= 99) { endGame(true); return; }
    game.state = State.MENU;
    cancelAnimationFrame(rafId);
    showOverlay(
      `第 ${game.stage} 关完成！`,
      `当前得分：${game.score}<br/>准备进入第 ${game.stage + 1} 关`,
      "进入下一关",
      () => {
        startStage(game.stage + 1);
        game.state = State.PLAYING;
        overlay.classList.add("hidden");
        game.lastTime = performance.now();
        rafId = requestAnimationFrame(loop);
      }
    );
  }

  function endGame(win) {
    game.state = win ? State.WIN : State.OVER;
    cancelAnimationFrame(rafId);
    draw(); // 画最后一帧
    showOverlay(
      win ? "胜利！" : "游戏结束",
      win
        ? `恭喜通关！最终得分：${game.score}`
        : `${game.baseAlive ? "你的坦克被击毁了" : "基地被摧毁了"}<br/>最终得分：${game.score} · 到达第 ${game.stage} 关`,
      "再来一局",
      newGame
    );
  }

  function pauseGame() {
    game.state = State.PAUSED;
    cancelAnimationFrame(rafId);
    showOverlay("已暂停", "按 <b>P</b> 或点击按钮继续", "继续", resumeGame);
  }

  function resumeGame() {
    game.state = State.PLAYING;
    overlay.classList.add("hidden");
    game.lastTime = performance.now();
    rafId = requestAnimationFrame(loop);
  }

  // ---- 覆盖层 & UI -------------------------------------------------------
  function showOverlay(title, text, btnLabel, onClick) {
    ovTitle.innerHTML = title;
    ovText.innerHTML = text;
    startBtn.textContent = btnLabel;
    startBtn.onclick = onClick;
    overlay.classList.remove("hidden");
  }

  function updateUI() {
    ui.stage.textContent = game.stage;
    ui.score.textContent = game.score;
    ui.lives.textContent = Math.max(0, game.lives);
    ui.enemies.textContent = game.spawnQueue + game.enemies.length;
  }

  // ---- 启动 --------------------------------------------------------------
  startBtn.onclick = newGame;
  // 初始画一张静态地图作为预览
  loadLevel(1);
  draw();
  updateUI();
})();
