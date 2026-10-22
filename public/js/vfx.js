/*
 * 《戈克世界：流脉牌局》VFX 层
 * 单 Canvas、贴图粒子、持续状态 overlay。
 * 设计为“可选增强”：加载失败时旧动画仍可工作。
 */
(function (root) {
  "use strict";

  const BASE = "assets/vfx/";
  const ASSET_VERSION = "20261020e24.3";
  const CELL = 128;
  const FRAMES = {
    glow: 0, spark: 1, smoke: 2, dust: 3,
    ring: 4, shockwave: 5, shard: 6, ember: 7
  };
  const STATUS = {
    frozen:   { image: "status-freeze",  emit: "shard", every: 260, alpha: .52, order: 10, label: "冻结" },
    silenced: { image: "status-silence", emit: "smoke", every: 420, alpha: .52, order: 20, label: "沉默" },
    shielded: { image: "status-shield",  emit: "glow",  every: 380, alpha: .50, order: 30, label: "护幕" },
    poisoned: { image: "status-poison",  emit: "smoke", every: 390, alpha: .32, order: 40, label: "蚀毒" },
    stealthed:{ image: "status-stealth", emit: "smoke", every: 480, alpha: .38, order: 50, label: "隐匿" },
    rebirthed:{ image: "status-reborn",  emit: "shard", every: 360, alpha: .30, order: 60, label: "回潮" },
    taunted:  { image: "status-taunt",   emit: null,    every: 0,   alpha: .22, order: 70, label: "拦截" },
    bountied: { image: "status-bounty",  emit: "glow",  every: 520, alpha: .58, order: 80, label: "悬赏" }
  };
  const FACTION_COLOR = {
    pus: [95, 211, 196], academy: [111, 155, 209], xizhao: [192, 80, 77],
    republic: [214, 178, 95], empire: [179, 141, 98], greyharbor: [125, 177, 118],
    neutral: [201, 168, 106]
  };
  const ICON_MAP = {
    "登场": "battlecry", "余响": "deathrattle", "拦截": "taunt", "突进": "charge",
    "被动": "passive", "冻结": "freeze", "沉默": "silence", "隐匿": "stealth",
    "引脉": "vein", "检索": "discover", "采掘": "excavate", "血祭": "blood",
    "吞噬": "damage", "护幕": "armor", "连动": "charge", "蚀毒": "deathrattle",
    "汲取": "heal", "袭扰": "charge", "回潮": "passive", "反噬": "summon",
    "悬赏": "damage", "遗物": "passive"
  };

  const VFX = {
    canvas: null, ctx: null, dpr: 1, w: 0, h: 0,
    images: {}, ready: false, enabled: true, inited: false,
    particles: [], slashes: [], last: 0, statusLast: new Map(), statusPrev: new Map(), timeScale: 1,
    icons: {}, iconFx: [], beams: [], streams: [],
    getGame: function () { return root.GokApp && root.GokApp.game; },
    _tints: {},
    _classes: new WeakMap()
  };

  function rand(a, b) { return a + Math.random() * (b - a); }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

  VFX.init = function () {
    if (this.inited || !document.body) return;
    this.inited = true;
    const c = document.createElement("canvas");
    c.id = "gok-vfx-layer";
    c.setAttribute("aria-hidden", "true");
    Object.assign(c.style, {
      position: "fixed", inset: "0", width: "100%", height: "100%",
      pointerEvents: "none", zIndex: "185"
    });
    document.body.appendChild(c);
    this.canvas = c;
    this.ctx = c.getContext("2d", { alpha: true });
    this.resize();
    window.addEventListener("resize", () => this.resize());
    this.loadImages();
    this.last = performance.now();
    requestAnimationFrame((t) => this.loop(t));
  };

  VFX.resize = function () {
    if (!this.canvas) return;
    this.dpr = Math.min(2, window.devicePixelRatio || 1);
    this.w = window.innerWidth;
    this.h = window.innerHeight;
    this.canvas.width = Math.round(this.w * this.dpr);
    this.canvas.height = Math.round(this.h * this.dpr);
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    this.ctx.imageSmoothingEnabled = true;
    this.ctx.imageSmoothingQuality = "high";
  };

  VFX.loadImages = function () {
    const files = {
      particles: BASE + "particles.png",
      slash: BASE + "slash.png"
    };
    for (const [k, v] of Object.entries(STATUS)) files[k] = BASE + v.image + ".png";
    let left = Object.keys(files).length;
    for (const [key, src] of Object.entries(files)) {
      const img = new Image();
      img.decoding = "async";
      img.onload = () => {
        this.images[key] = img;
        if (--left === 0) this.ready = true;
      };
      img.onerror = () => {
        if (--left === 0) this.ready = true;
      };
      img.src = src + "?v=" + ASSET_VERSION;
    }
    const iconNames = Array.from(new Set(Object.values(ICON_MAP)));
    for (const name of iconNames) {
      const img = new Image();
      img.decoding = "async";
      img.onload = () => { this.icons[name] = img; };
      img.src = "assets/icons/" + name + ".svg?v=" + ASSET_VERSION;
    }
  };

  VFX.clear = function () {
    this.particles.length = 0;
    this.slashes.length = 0;
    this.iconFx.length = 0;
    this.beams.length = 0;
    this.streams.length = 0;
    this.statusLast.clear();
    this.statusPrev.clear();
    if (this.ctx) this.ctx.clearRect(0, 0, this.w, this.h);
  };

  VFX.setEnabled = function (on) {
    this.enabled = !!on;
    if (!this.enabled) this.clear();
  };

  // ===== 粒子 =====
  VFX.tint = function (key, color, slot) {
    const at = this.images.particles;
    if (!at) return null;
    const idx = FRAMES[key] == null ? 0 : FRAMES[key];
    const ck = key + "|" + color.join(",") + "|" + (slot || 0);
    if (this._tints[ck]) return this._tints[ck];
    const c = document.createElement("canvas");
    c.width = CELL; c.height = CELL;
    const x = c.getContext("2d");
    x.drawImage(at, idx * CELL, 0, CELL, CELL, 0, 0, CELL, CELL);
    x.globalCompositeOperation = "source-in";
    x.fillStyle = "rgb(" + color.join(",") + ")";
    x.fillRect(0, 0, CELL, CELL);
    this._tints[ck] = c;
    return c;
  };

  VFX.emit = function (x, y, opts) {
    if (!this.enabled || !this.ready) return;
    opts = opts || {};
    const color = opts.color || [255, 220, 155];
    const key = opts.texture || "spark";
    const tinted = opts.tint === false ? null : this.tint(key, color);
    const life = opts.life == null ? rand(.35, .75) : opts.life;
    const angle = opts.angle == null ? rand(0, Math.PI * 2) : opts.angle;
    const speed = opts.speed == null ? rand(60, 230) : opts.speed;
    this.particles.push({
      x, y,
      vx: Math.cos(angle) * speed + (opts.vx || 0),
      vy: Math.sin(angle) * speed + (opts.vy || 0),
      life, maxLife: life,
      size: opts.size == null ? rand(16, 42) : opts.size,
      endSize: opts.endSize == null ? 4 : opts.endSize,
      rot: opts.rot == null ? rand(0, Math.PI * 2) : opts.rot,
      rotSpeed: opts.rotSpeed == null ? rand(-5, 5) : opts.rotSpeed,
      gravity: opts.gravity == null ? 0 : opts.gravity,
      drag: opts.drag == null ? .98 : opts.drag,
      alpha: opts.alpha == null ? 1 : opts.alpha,
      blend: opts.blend || "lighter",
      img: tinted,
      frame: !tinted ? key : null
    });
    if (this.particles.length > 420) this.particles.splice(0, this.particles.length - 420);
  };

  VFX.burst = function (x, y, o) {
    o = o || {};
    const n = o.count == null ? 12 : o.count;
    const texs = o.textures || ["spark", "ember", "glow"];
    for (let i = 0; i < n; i++) {
      this.emit(x + rand(-(o.spread || 10), o.spread || 10), y + rand(-(o.spread || 10), o.spread || 10), {
        texture: texs[i % texs.length],
        color: o.color,
        angle: o.angle == null ? rand(0, Math.PI * 2) : o.angle + rand(-.7, .7),
        speed: rand((o.speed || 100) * .5, o.speed || 240),
        size: rand((o.size || 22) * .55, o.size || 46),
        endSize: o.endSize == null ? 2 : o.endSize,
        life: rand((o.life || .55) * .7, (o.life || .55) * 1.25),
        gravity: o.gravity == null ? 110 : o.gravity,
        blend: o.blend || "lighter",
        alpha: o.alpha == null ? .95 : o.alpha
      });
    }
  };

  VFX.slash = function (x1, y1, x2, y2, o) {
    if (!this.enabled) return;
    o = o || {};
    this.slashes.push({
      x1, y1, x2, y2,
      life: o.life || .22, maxLife: o.life || .22,
      width: o.width || 1, alpha: o.alpha == null ? 1 : o.alpha,
      color: o.color || [255, 225, 165]
    });
    this.burst((x1 + x2) / 2, (y1 + y2) / 2, {
      count: o.sparks == null ? 10 : o.sparks,
      color: o.color,
      speed: 280,
      size: 34,
      life: .32,
      spread: 12
    });
  };

  // ===== 状态 =====
  VFX.statusList = function (m) {
    const out = [];
    if (m.frozenTurns > 0) out.push("frozen");
    if (m.silenced) out.push("silenced");
    if (m.divineShield) out.push("shielded");
    if (m.poisonous) out.push("poisoned");
    if (m.stealth) out.push("stealthed");
    if (m.reborn) out.push("rebirthed");
    if (m.taunt) out.push("taunted");
    if (m.bounty) out.push("bountied");
    return out;
  };

  VFX.eachMinion = function (game, fn) {
    if (!game) return;
    for (const p of game.players) {
      for (const z of ["left", "center", "right"]) {
        for (const m of (p.board[z] || [])) if (!m.dead) fn(m, p, z);
      }
    }
  };

  VFX.drawStatus = function (now) {
    if (!this.ready) return;
    const game = this.getGame();
    if (!game) return;
    const seen = new Set();
    const cards = document.querySelectorAll(".board-card[data-minion]");
    const byUid = new Map();
    this.eachMinion(game, (m) => byUid.set(m.uid, m));
    for (const el of cards) {
      const uid = el.getAttribute("data-minion");
      const m = byUid.get(uid);
      if (!m) continue;
      seen.add(uid);
      const statuses = this.statusList(m);
      const attr = statuses.join(" ");
      if ((el.getAttribute("data-vfx") || "") !== attr) el.setAttribute("data-vfx", attr);
      const r = el.getBoundingClientRect();
      if (r.width < 8 || r.bottom < -80 || r.top > this.h + 80) continue;
      const prev = this.statusPrev.get(uid) || [];
      if (!statuses.length) {
        for (const status of prev) {
          if (status === "frozen") this.burst(r.left + r.width / 2, r.top + r.height / 2, { count: 18, textures: ["shard", "glow", "smoke"], color: [175, 240, 255], speed: 190, size: 26, life: .7, gravity: 120 });
          else if (status === "shielded") this.burst(r.left + r.width / 2, r.top + r.height / 2, { count: 16, textures: ["shard", "spark"], color: [255, 225, 145], speed: 220, size: 24, life: .6, gravity: 160 });
        }
        this.statusPrev.delete(uid);
        continue;
      }
      const added = statuses.filter(s => prev.indexOf(s) < 0);
      const removed = prev.filter(s => statuses.indexOf(s) < 0);
      if (added.length) {
        for (const status of added) {
          const def = STATUS[status];
          if (def && def.label) this.keyword(def.label, r.left + r.width / 2, r.top + r.height / 2, status);
        }
      }
      if (removed.length) {
        for (const status of removed) {
          const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
          if (status === "frozen") {
            this.burst(cx, cy, { count: 18, textures: ["shard", "glow", "smoke"], color: [175, 240, 255], speed: 190, size: 26, life: .7, gravity: 120 });
          } else if (status === "shielded") {
            this.burst(cx, cy, { count: 16, textures: ["shard", "spark"], color: [255, 225, 145], speed: 220, size: 24, life: .6, gravity: 160 });
          } else if (status === "silenced") {
            this.burst(cx, cy, { count: 10, textures: ["smoke"], color: [140, 140, 138], speed: 65, size: 36, life: .7, gravity: -20, blend: "source-over", alpha: .4 });
          } else if (status === "rebirthed") {
            this.burst(cx, cy, { count: 20, textures: ["shard", "glow", "spark"], color: [130, 235, 255], speed: 210, size: 24, life: .75, gravity: -40 });
          }
        }
      }
      this.statusPrev.set(uid, statuses);
      const ctx = this.ctx;
      const radius = Math.max(3, Math.min(9, r.width * .045));
      for (const key of statuses) {
        const def = STATUS[key];
        if (!def) continue;
        const img = this.images[key];
        if (!img) continue;
        ctx.save();
        ctx.globalCompositeOperation = "source-over";
        ctx.globalAlpha = def.alpha;
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(r.left - 2, r.top - 2, r.width + 4, r.height + 4, radius);
        else ctx.rect(r.left - 2, r.top - 2, r.width + 4, r.height + 4);
        ctx.clip();
        ctx.drawImage(img, r.left - 2, r.top - 2, r.width + 4, r.height + 4);
        ctx.restore();
      }
      if (statuses.indexOf("frozen") >= 0) {
        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        ctx.globalAlpha = .55;
        ctx.strokeStyle = "rgba(175,240,255,.9)";
        ctx.lineWidth = 1.5;
        ctx.shadowColor = "rgba(120,220,255,.8)";
        ctx.shadowBlur = 12;
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(r.left + 1, r.top + 1, r.width - 2, r.height - 2, radius);
        else ctx.rect(r.left + 1, r.top + 1, r.width - 2, r.height - 2);
        ctx.stroke();
        ctx.restore();
      }
      // 持续环境粒子
      const ambient = statuses.map(s => STATUS[s]).filter(s => s.emit);
      if (ambient.length && !document.body.classList.contains("simple-fx")) {
        const last = this.statusLast.get(uid) || 0;
        const def = ambient[0];
        if (now - last > def.every) {
          this.statusLast.set(uid, now);
          const edge = Math.floor(rand(0, 4));
          let x = r.left + rand(4, r.width - 4), y = r.top + rand(4, r.height - 4);
          if (edge === 0) y = r.top + 2; else if (edge === 1) x = r.right - 2;
          else if (edge === 2) y = r.bottom - 2; else x = r.left + 2;
          const primaryKey = statuses.find(s => STATUS[s] && STATUS[s].emit) || statuses[0];
          const color = primaryKey === "frozen" ? [170, 235, 255] : primaryKey === "silenced" ? [155, 155, 150] : [255, 220, 150];
          this.emit(x, y, {
            texture: def.emit, color, speed: rand(4, 18),
            angle: edge === 0 ? Math.PI / 2 : edge === 2 ? -Math.PI / 2 : edge === 1 ? Math.PI : 0,
            size: rand(8, 24), endSize: 2, life: rand(.5, 1.1), gravity: -8, blend: "source-over", alpha: .55
          });
        }
      }
    }
    for (const uid of this.statusLast.keys()) if (!seen.has(uid)) this.statusLast.delete(uid);
    for (const uid of this.statusPrev.keys()) if (!seen.has(uid)) this.statusPrev.delete(uid);
  };

  VFX.summon = function (x, y, o) {
    o = o || {};
    const color = o.reborn ? [130, 235, 255] : (FACTION_COLOR[o.faction] || [242, 198, 109]);
    this.emit(x, y, { texture: "ring", color, size: 16, endSize: 170, life: .55, speed: 0, alpha: .8 });
    this.emit(x, y, { texture: "shockwave", color, size: 22, endSize: 210, life: .42, speed: 0, alpha: .65 });
    this.beams.push({ x, y, height: 145, life: .62, maxLife: .62, color });
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      this.emit(x + Math.cos(a) * 26, y + 18 + Math.sin(a) * 8, {
        texture: i % 3 === 0 ? "shard" : "glow", color,
        angle: -Math.PI / 2 + Math.cos(a) * .35, speed: rand(24, 55),
        size: rand(10, 28), endSize: 2, life: rand(.45, .8), gravity: -28, alpha: .6
      });
    }
    this.burst(x, y, { count: o.count || 10, textures: ["dust", "smoke"], color: [185, 165, 130], speed: 100, size: 38, life: .55, gravity: 50, blend: "source-over", alpha: .4 });
    setTimeout(() => this.landing(x, y, o), o.landingDelay || 220);
  };

  VFX.landing = function (x, y, o) {
    o = o || {};
    const color = FACTION_COLOR[o.faction] || [242, 198, 109];
    this.emit(x, y, { texture: "ring", color, size: 34, endSize: 180, life: .38, speed: 0, gravity: 0, blend: "lighter", alpha: .75 });
    this.emit(x, y, { texture: "shockwave", color, size: 40, endSize: 220, life: .3, speed: 0, gravity: 0, blend: "lighter", alpha: .75 });
    this.burst(x, y + 8, { count: o.count || 14, textures: ["dust", "smoke"], color: [185, 165, 130], speed: 130, size: 42, life: .55, gravity: 80, blend: "source-over", alpha: .55 });
    this.burst(x, y, { count: 8, textures: ["spark", "glow"], color, speed: 150, size: 28, life: .4, gravity: 130 });
    if (o.reborn) {
      this.burst(x, y, { count: 18, textures: ["shard", "glow"], color: [130, 235, 255], speed: 180, size: 30, life: .7, gravity: -30 });
    }
  };

  VFX.drawBeams = function (dt) {
    const ctx = this.ctx;
    for (let i = this.beams.length - 1; i >= 0; i--) {
      const b = this.beams[i];
      b.life -= dt;
      if (b.life <= 0) { this.beams.splice(i, 1); continue; }
      const t = 1 - b.life / b.maxLife;
      const alpha = Math.sin(Math.min(1, t * 1.5) * Math.PI) * .55;
      const h = b.height * (.5 + t * .8);
      const g = ctx.createLinearGradient(b.x, b.y, b.x, b.y - h);
      g.addColorStop(0, "rgba(" + b.color.join(",") + ",.6)");
      g.addColorStop(.55, "rgba(" + b.color.join(",") + ",.18)");
      g.addColorStop(1, "rgba(" + b.color.join(",") + ",0)");
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.globalAlpha = alpha;
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.ellipse(b.x, b.y, 22 + t * 16, h, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  };

  VFX.cast = function (x, y, o) {
    o = o || {};
    const color = o.freeze ? [145, 225, 255] : o.blood ? [220, 95, 85] : [125, 190, 255];
    this.emit(x, y, { texture: "ring", color, size: 18, endSize: 130, life: .42, speed: 0, alpha: .7 });
    this.burst(x, y, { count: 12, textures: ["glow", "spark"], color, speed: 110, size: 32, life: .55, gravity: -18 });
    this.emit(x, y, { texture: "smoke", color: [200, 210, 220], size: 60, endSize: 130, life: .65, speed: 0, alpha: .22, blend: "source-over" });
  };

  VFX.impact = function (x, y, o) {
    o = o || {};
    const color = o.freeze ? [150, 225, 255] : o.blood ? [220, 80, 75] : [255, 205, 135];
    this.emit(x, y, { texture: "shockwave", color, size: 26, endSize: 160, life: .26, speed: 0, alpha: .9 });
    this.emit(x, y, { texture: "glow", color, size: 54, endSize: 8, life: .22, speed: 0, alpha: 1 });
    this.burst(x, y, { count: o.count || 16, textures: ["spark", "ember"], color, speed: 300, size: 38, life: .38, gravity: 260, spread: 8 });
    this.burst(x, y, { count: 5, textures: ["dust", "smoke"], color: [180, 160, 130], speed: 90, size: 40, life: .55, gravity: 60, blend: "source-over", alpha: .4 });
    if (o.freeze) {
      this.burst(x, y, { count: 14, textures: ["shard", "glow"], color: [170, 240, 255], speed: 250, size: 26, life: .6, gravity: 150 });
    }
  };

  // 汲取/生命流：从起点沿曲线流回终点。
  VFX.drain = function (x1, y1, x2, y2, o) {
    o = o || {};
    const color = o.color || [110, 220, 150];
    this.streams.push({ x1, y1, x2, y2, life: o.life || .52, maxLife: o.life || .52, color });
    const dx = x2 - x1, dy = y2 - y1;
    for (let i = 0; i < 18; i++) {
      const t = rand(.05, .95);
      this.emit(x1 + dx * t, y1 + dy * t, {
        texture: i % 3 === 0 ? "spark" : "glow", color,
        angle: Math.atan2(dy, dx) + rand(-.25, .25),
        speed: rand(90, 210), size: rand(8, 22), endSize: 2,
        life: rand(.25, .55), gravity: 0, alpha: .7
      });
    }
  };

  // 回潮：粒子从外圈向中心聚拢。
  VFX.implode = function (x, y, o) {
    o = o || {};
    const color = o.color || [120, 225, 255];
    const n = o.count || 18;
    for (let i = 0; i < n; i++) {
      const a = rand(0, Math.PI * 2), r = rand(54, 150);
      const sx = x + Math.cos(a) * r, sy = y + Math.sin(a) * r * .7;
      this.emit(sx, sy, {
        texture: i % 3 === 0 ? "shard" : "glow", color,
        angle: Math.atan2(y - sy, x - sx), speed: r * rand(1.7, 2.4),
        size: rand(12, 28), endSize: 1, life: rand(.3, .55),
        gravity: 0, alpha: .8
      });
    }
    this.emit(x, y, { texture: "ring", color, size: 100, endSize: 20, life: .4, speed: 0, alpha: .65 });
  };

  VFX.drawStreams = function (dt) {
    const ctx = this.ctx;
    for (let i = this.streams.length - 1; i >= 0; i--) {
      const s = this.streams[i];
      s.life -= dt;
      if (s.life <= 0) { this.streams.splice(i, 1); continue; }
      const t = 1 - s.life / s.maxLife;
      const alpha = Math.sin(t * Math.PI) * .72;
      const mx = (s.x1 + s.x2) / 2, my = (s.y1 + s.y2) / 2 - 34;
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = "rgba(" + s.color.join(",") + ",.9)";
      ctx.lineWidth = 4 * (1 - t * .5);
      ctx.beginPath();
      ctx.moveTo(s.x1, s.y1);
      ctx.quadraticCurveTo(mx, my, s.x2, s.y2);
      ctx.stroke();
      ctx.strokeStyle = "rgba(255,255,255,.45)";
      ctx.lineWidth = 1.4;
      ctx.stroke();
      for (let k = 0; k < 4; k++) {
        const u = (t * 1.8 + k / 4) % 1;
        const bx = (1 - u) * (1 - u) * s.x1 + 2 * (1 - u) * u * mx + u * u * s.x2;
        const by = (1 - u) * (1 - u) * s.y1 + 2 * (1 - u) * u * my + u * u * s.y2;
        ctx.fillStyle = "rgba(" + s.color.join(",") + ",.85)";
        ctx.beginPath(); ctx.arc(bx, by, 3.5, 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore();
    }
  };

  VFX.keyword = function (label, x, y, tone) {
    const map = {
      "冻结": { c: [150, 225, 255], tex: ["shard", "glow"], n: 20, size: 92, from: .42, to: 1.18, rise: -10, rot: .16, ring: true },
      "沉默": { c: [145, 145, 145], tex: ["smoke", "glow"], n: 12, size: 108, from: 1.45, to: .72, rise: 4, rot: 0, ring: false, stamp: true },
      "护幕": { c: [255, 225, 145], tex: ["spark", "glow"], n: 18, size: 94, from: .45, to: 1.14, rise: -4, rot: -.1, ring: true },
      "蚀毒": { c: [135, 210, 90], tex: ["smoke", "spark"], n: 16, size: 88, from: .55, to: 1.08, rise: -8, rot: .12, ring: true },
      "汲取": { c: [110, 220, 150], tex: ["glow", "spark"], n: 18, size: 86, from: .5, to: 1.1, rise: -6, rot: -.08, ring: true },
      "拦截": { c: [230, 190, 110], tex: ["spark", "shockwave"], n: 16, size: 100, from: 1.5, to: .92, rise: 2, rot: 0, ring: true, stamp: true },
      "余响": { c: [175, 140, 230], tex: ["smoke", "shard"], n: 20, size: 88, from: .55, to: 1.05, rise: -34, rot: -.12, ring: true },
      "回潮": { c: [120, 225, 255], tex: ["shard", "glow"], n: 22, size: 90, from: .2, to: 1.1, rise: -10, rot: .2, ring: true },
      "悬赏": { c: [255, 210, 110], tex: ["glow", "spark"], n: 16, size: 88, from: .65, to: 1.16, rise: -6, rot: .3, ring: true },
      "引脉": { c: [95, 220, 200], tex: ["glow", "spark"], n: 16, size: 86, from: .5, to: 1.1, rise: -8, rot: -.1, ring: true },
      "连动": { c: [255, 190, 120], tex: ["spark"], n: 22, size: 78, from: .4, to: 1.16, rise: -4, rot: -.18, ring: true },
      "突进": { c: [255, 135, 90], tex: ["spark"], n: 20, size: 82, from: .35, to: 1.08, rise: -4, rot: .12, ring: true },
      "袭扰": { c: [255, 155, 95], tex: ["spark"], n: 16, size: 82, from: .35, to: 1.08, rise: -4, rot: .12, ring: true },
      "血祭": { c: [220, 75, 80], tex: ["smoke", "spark"], n: 16, size: 88, from: .5, to: 1.1, rise: -6, rot: .1, ring: true },
      "登场": { c: [255, 215, 130], tex: ["glow", "spark"], n: 16, size: 90, from: .5, to: 1.12, rise: -10, rot: -.1, ring: true }
    };
    const m = map[label] || { c: [235, 195, 120], tex: ["glow", "spark"], n: 12, size: 82, from: .5, to: 1.08, rise: -4, rot: 0, ring: true };
    this.emit(x, y, { texture: "ring", color: m.c, size: 16, endSize: m.stamp ? 140 : 100, life: m.stamp ? .44 : .35, speed: 0, alpha: .65 });
    if (m.ring) this.emit(x, y, { texture: "shockwave", color: m.c, size: 20, endSize: 110, life: .28, speed: 0, alpha: .5 });
    this.icon(label, x, y, m);
    if (label === "连动") setTimeout(() => this.icon(label, x - 28, y + 4, Object.assign({}, m, { size: m.size * .75, rot: -.4 })), 70);
    if (label === "回潮") this.implode(x, y, { color: m.c, count: 22 });
    if (label === "突进" || label === "袭扰") this.slash(x - 95, y, x + 95, y, { color: m.c, sparks: 8, life: .28 });
    if (label === "汲取") this.drain(x - 80, y + 30, x + 70, y - 20, { color: m.c });
    this.burst(x, y, { count: m.n, textures: m.tex, color: m.c, speed: 210, size: 30, life: .55, gravity: 30, spread: 8 });
  };

  VFX.icon = function (label, x, y, o) {
    const name = ICON_MAP[label];
    if (!name || !this.icons[name]) return;
    o = o || {};
    this.iconFx.push({
      img: this.icons[name], x, y,
      life: o.life == null ? .62 : o.life,
      maxLife: o.life == null ? .62 : o.life,
      size: o.size || 88,
      from: o.from == null ? .4 : o.from,
      to: o.to == null ? 1.12 : o.to,
      rise: o.rise == null ? -10 : o.rise,
      rot: o.rot || 0,
      alpha: o.alpha == null ? .95 : o.alpha,
      color: o.color || [255, 220, 150]
    });
  };

  VFX.drawIcons = function (dt) {
    const ctx = this.ctx;
    for (let i = this.iconFx.length - 1; i >= 0; i--) {
      const f = this.iconFx[i];
      f.life -= dt;
      if (f.life <= 0) { this.iconFx.splice(i, 1); continue; }
      const t = 1 - f.life / f.maxLife;
      const ease = 1 - Math.pow(1 - t, 3);
      const size = f.size * (f.from + (f.to - f.from) * ease);
      const alpha = f.alpha * (t < .12 ? t / .12 : (1 - t) ** .85);
      const yy = f.y + f.rise * ease;
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.globalAlpha = clamp(alpha, 0, 1) * .45;
      const g = ctx.createRadialGradient(f.x, yy, 0, f.x, yy, size * .9);
      g.addColorStop(0, "rgba(" + f.color.join(",") + ",.55)");
      g.addColorStop(1, "rgba(" + f.color.join(",") + ",0)");
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(f.x, yy, size * .9, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = clamp(alpha, 0, 1);
      ctx.translate(f.x, yy);
      ctx.rotate(f.rot * ease);
      ctx.drawImage(f.img, -size / 2, -size / 2, size, size);
      ctx.restore();
    }
  };

  VFX.death = function (x, y, o) {
    o = o || {};
    this.emit(x, y, { texture: "shockwave", color: [175, 145, 110], size: 24, endSize: 130, life: .45, speed: 0, alpha: .45, blend: "source-over" });
    this.burst(x, y, { count: 24, textures: ["smoke", "dust"], color: [130, 120, 110], speed: 110, size: 54, life: 1.0, gravity: -25, blend: "source-over", alpha: .5 });
    this.burst(x, y, { count: 14, textures: ["shard", "ember"], color: [180, 150, 110], speed: 190, size: 24, life: .7, gravity: 180 });
    if (o.frozen) {
      this.burst(x, y, { count: 18, textures: ["shard", "glow"], color: [160, 235, 255], speed: 220, size: 26, life: .75, gravity: 120 });
    }
  };

  // ===== 主循环 =====
  VFX.loop = function (now) {
    const rawDt = Math.min(.05, Math.max(0, (now - this.last) / 1000));
    this.last = now;
    const dt = rawDt * (this.timeScale == null ? 1 : this.timeScale);
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.w, this.h);
    if (!this.enabled) {
      requestAnimationFrame((t) => this.loop(t));
      return;
    }
    if (this.ready) this.drawStatus(now);
    this.drawParticles(dt);
    this.drawBeams(dt);
    this.drawStreams(dt);
    this.drawIcons(dt);
    this.drawSlashes(dt);
    requestAnimationFrame((t) => this.loop(t));
  };

  VFX.drawParticles = function (dt) {
    const ctx = this.ctx;
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      if (p.life <= 0) { this.particles.splice(i, 1); continue; }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= Math.pow(p.drag, dt * 60);
      p.vy = p.vy * Math.pow(p.drag, dt * 60) + p.gravity * dt;
      p.rot += p.rotSpeed * dt;
      const t = 1 - p.life / p.maxLife;
      const alpha = p.alpha * (t < .15 ? t / .15 : (1 - t) ** .7);
      const size = p.size + (p.endSize - p.size) * t;
      ctx.save();
      ctx.globalAlpha = clamp(alpha, 0, 1);
      ctx.globalCompositeOperation = p.blend;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      const src = p.img || this.images.particles;
      if (src) {
        if (p.img) ctx.drawImage(src, -size / 2, -size / 2, size, size);
        else {
          const idx = FRAMES[p.frame] || 0;
          ctx.drawImage(src, idx * CELL, 0, CELL, CELL, -size / 2, -size / 2, size, size);
        }
      }
      ctx.restore();
    }
  };

  VFX.drawSlashes = function (dt) {
    const ctx = this.ctx;
    for (let i = this.slashes.length - 1; i >= 0; i--) {
      const s = this.slashes[i];
      s.life -= dt;
      if (s.life <= 0) { this.slashes.splice(i, 1); continue; }
      const t = 1 - s.life / s.maxLife;
      const dx = s.x2 - s.x1, dy = s.y2 - s.y1;
      const ang = Math.atan2(dy, dx);
      const dist = Math.sqrt(dx * dx + dy * dy);
      ctx.save();
      ctx.globalAlpha = s.alpha * (1 - t) ** .7;
      ctx.globalCompositeOperation = "lighter";
      ctx.translate((s.x1 + s.x2) / 2, (s.y1 + s.y2) / 2);
      ctx.rotate(ang);
      // 即使 slash 贴图加载慢，也先有一条清晰的方向性刀光。
      const g = ctx.createLinearGradient(-dist / 2, 0, dist / 2, 0);
      g.addColorStop(0, "rgba(255,190,110,0)");
      g.addColorStop(.25, "rgba(255,220,160,.55)");
      g.addColorStop(.62, "rgba(255,250,225,.95)");
      g.addColorStop(1, "rgba(255,180,100,0)");
      ctx.strokeStyle = g;
      ctx.lineCap = "round";
      ctx.lineWidth = 8 * (1 - t * .5);
      ctx.beginPath();
      ctx.moveTo(-dist / 2, 0);
      ctx.quadraticCurveTo(0, -12, dist / 2, 0);
      ctx.stroke();
      if (this.images.slash) {
        ctx.drawImage(this.images.slash, -dist * .55, -52, dist * 1.1, 104);
      }
      ctx.restore();
    }
  };

  VFX.attack = function (ax, ay, bx, by, o) {
    o = o || {};
    this.slash(ax, ay, bx, by, { color: o.color || [255, 220, 160], sparks: 14, life: .28 });
    this.emit((ax + bx) / 2, (ay + by) / 2, { texture: "glow", color: [255, 210, 130], size: 44, endSize: 4, life: .28, speed: 0 });
    this.burst(bx, by, { count: 10, textures: ["spark", "ember"], color: [255, 200, 120], speed: 240, size: 30, life: .4, gravity: 200 });
  };

  // 初始化
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => VFX.init(), { once: true });
  } else {
    VFX.init();
  }

  root.GokVFX = VFX;
})(typeof window !== "undefined" ? window : globalThis);









