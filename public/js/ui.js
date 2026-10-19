/* 《戈克世界：流脉牌局》测试版 UI
 * 原生 DOM，无框架；负责屏幕切换、渲染、输入与音效。
 */
(function (global) {
  "use strict";
  const D = global.GokData;
  const E = global.GokEngine;
  const AI = global.GokAI;
  const ART_VERSION = "20261020ds";

  // 经典模式：每个阵营首次开局播放一段对应 CG（可跳过）
  const CLASSIC_CG = {
    pus: { clip: "ch1.mp4", title: "地脉与潮雾", text: "普卫岛守着地脉的入口，也守着最后一座不熄灯的港。" },
    academy: { clip: "ch2.mp4", title: "钟塔的算式", text: "学院的钟停在零点，所有算式都指向同一个答案。" },
    xizhao: { clip: "ch3.mp4", title: "赤潮的来客", text: "血潮越过旧边墙，来客没有名字，只带着一枚烧黑的流脉徽记。" },
    republic: { clip: "ch4.mp4", title: "铁誓与议会", text: "共和国把誓言铸进铁里，也把代价写进议案。" },
    empire: { clip: "ch5.mp4", title: "最后一炉", text: "帝国锻炉再次点火，炉火照亮每一张等待命令的脸。" }
  };

  const $ = (id) => document.getElementById(id);
  function el(tag, cls, text) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  function clear(n) { while (n && n.firstChild) n.removeChild(n.firstChild); }
  function factionIcon(f) { return D.FACTIONS[f] ? D.FACTIONS[f].icon : "旅"; }
  function factionName(f) { return D.FACTIONS[f] ? D.FACTIONS[f].name : "中立"; }
  function genericArtStyle(def) {
    const f = def.faction || "neutral";
    const bg = f === "xizhao" ? "xizhao" : f === "academy" ? "menu" : "battle";
    const tint = f === "pus" ? "rgba(12,48,48,0.24)" : f === "academy" ? "rgba(18,36,66,0.26)" : f === "xizhao" ? "rgba(58,16,20,0.22)" : f === "republic" ? "rgba(52,42,18,0.22)" : f === "empire" ? "rgba(48,36,18,0.24)" : "rgba(5,10,15,0.18)";
    return "linear-gradient(180deg, rgba(5,10,15,0.12), " + tint + " 55%, rgba(5,10,15,0.7)), url('assets/backgrounds/" + bg + ".webp')";
  }

  function genericGlyph(def) {
    if (!def) return "minion";
    const kw = def.keywords || [];
    if (kw.indexOf("battlecry") >= 0) return "battlecry";
    if (kw.indexOf("deathrattle") >= 0) return "deathrattle";
    if (kw.indexOf("taunt") >= 0) return "taunt";
    if (kw.indexOf("charge") >= 0) return "charge";
    if (def.passive) return "passive";
    if (def.type === "spell" && def.spell) {
      if (["damage"].indexOf(def.spell.type) >= 0) return "charge";
      if (["freeze", "freezeAll", "freezeDraw"].indexOf(def.spell.type) >= 0) return "freeze";
      if (["buffHeal", "buffTaunt", "buffCharge"].indexOf(def.spell.type) >= 0) return "passive";
      if (["draw", "drawVein", "discover"].indexOf(def.spell.type) >= 0) return "excavate";
      if (["bloodDraw"].indexOf(def.spell.type) >= 0) return "blood";
      return "spell";
    }
    return def.type === "spell" ? "spell" : "minion";
  }

  function addGenericGlyph(art, def) {
    const img = el("img", "generic-glyph");
    img.src = "/assets/icons/" + genericGlyph(def) + ".svg";
    img.alt = "";
    art.classList.add("has-glyph");
    art.appendChild(img);
  }

  function cardArtUrl(def) {
    if (!def) return "";
    if (def.art) return portraitImage(def.art);
    if (def.noArtwork) return "";
    return "assets/generated/" + encodeURIComponent(def.id) + (def.noGeneratedArt ? ".svg" : ".webp") + "?v=" + ART_VERSION;
  }

  function addCardFrame(card) {
    if (!card) return;
    const frame = el("img", "card-frame-art");
    frame.alt = "";
    frame.src = "assets/ui/card-frame.webp?v=" + ART_VERSION;
    card.appendChild(frame);
  }

  function addHeroFrame(container) {
    if (!container) return;
    const frame = el("img", "hero-frame-art");
    frame.alt = "";
    frame.src = "assets/ui/hero-frame.webp?v=" + ART_VERSION;
    container.appendChild(frame);
  }

  function addGeneratedArt(art, def) {
    if (!art || !def || def.art || def.noArtwork) return;
    const img = el("img", "generated-art-img");
    img.alt = "";
    img.loading = "eager";
    img.src = cardArtUrl(def);
    img.onload = () => { if (img.naturalWidth > 2 && img.naturalHeight > 2) art.classList.add("has-custom-art"); };
    img.onerror = () => {
      if (!img.dataset.retried) {
        img.dataset.retried = "1";
        img.src = "/api/art/" + encodeURIComponent(def.id);
      } else if (img.parentNode) {
        img.parentNode.removeChild(img);
      }
    };
    art.appendChild(img);
  }
  function heroImage(id) { const file = id === "otto" ? "otto_centered" : id; return "assets/heroes/" + file + ".webp"; }
  function portraitImage(id) { return "assets/portraits/" + id + ".webp"; }
  function escapeText(s) { return s == null ? "" : String(s); }

  const app = {
    screen: "home",
    mode: "ai",
    faction: "pus",
    game: null,
    local: false,
    human: 0,
    aiPlayer: 1,
    viewer: 0,
    busy: false,
    modalOpen: false,
    simRunning: false,
    selectedCard: null,
    targetInfo: null,
    zoneSelect: null,
    attacker: null,
    payBloodChoice: null,
    pendingBloodCard: null,
    draggingUid: null,
    draggingAttacker: null,
    dragAttackTargets: [],
    pendingDragZone: null,
    suppressClick: 0,
    animating: false,
    net: null,
    customDecks: {},
    activeRelics: {},
    tutorial: false,
    tutorialStep: 1,
    codexFaction: "all",
    codexFilter: "all",
    codexSearch: "",
    codexLimit: 60,
    achievements: {},
    profile: null,
    profileRecorded: false,
    mulliganOpen: false,
    mulliganSubmitted: false,
    mulliganSelected: new Set(),
    settlementAchievements: null,
    settlementRecorded: false,
    rankChange: null,
    rankReturn: "home",
    deckBuildFaction: "pus",
    deckBuildList: [],
    deckBuildFilter: "all",
    deckPoolScope: "faction",
    deckDrafts: {},
    lanHostPage: false,
    hostKeepAliveTimer: null,
    logGameSeed: null,
    logCursor: null,
    eventSeed: null,
    eventCursor: null,
    roomCode: "",
    onlineMode: false,
    lanGuestOnline: false,
    lanGuestFaction: null,
    lanGuestReady: false,
    lanPublicUrl: null,
    lanGuestDecks: null,
    lanGuestDecksReady: false,
    lanHostUseCustom: true,
    lanGuestUseCustom: true,
    lanFaction: "pus",
    lanRanked: false,
    lanStatusTimer: null,
    lanHeartbeatTimer: null,
    lanPollTimer: null,
    lanSince: 0,
    lanPollBusy: false,
    lanWaitTimer: null,
    lanEndShown: false,
    lastVein: 0,
    lastThresholds: null,
    audioOn: true,
    audioVolume: 0.7,
    bgmOn: true,
    sfxOn: true,
    bgAnimOn: true,
    motionOn: true,
    damageNumbers: true,
    fxOn: true,
    aiSpeed: "normal",
    aiDifficulty: "normal",
    aiOpponent: null,
    screenShake: true,
    textLarge: false,
    bgDim: 0,
    lastAutoStrategy: null,
    lastLegendary: null,
    logOpen: false,
    aiRunning: false,
    lastConfig: null
  };
  global.GokApp = app;

  /* ===== audio ===== */
  const AudioBox = {
    sfx: {},
    bgmEl: null,
    bgmName: null,
    unlocked: false,
    init() {
      const saved = localStorage.getItem("gok_sound");
      app.audioOn = saved == null ? true : saved === "1";
      const savedVol = parseFloat(localStorage.getItem("gok_volume"));
      app.audioVolume = isNaN(savedVol) ? 0.7 : Math.max(0, Math.min(1, savedVol));
      app.bgmOn = localStorage.getItem("gok_bgm") !== "0";
      app.sfxOn = localStorage.getItem("gok_sfx") !== "0";
      app.bgAnimOn = localStorage.getItem("gok_bg_anim") !== "0";
      app.motionOn = localStorage.getItem("gok_motion") !== "0";
      app.damageNumbers = localStorage.getItem("gok_damage_numbers") !== "0";
      app.fxOn = localStorage.getItem("gok_fx") !== "0";
      app.aiSpeed = localStorage.getItem("gok_ai_speed") || "normal";
      app.screenShake = localStorage.getItem("gok_screen_shake") !== "0";
      app.textLarge = localStorage.getItem("gok_text_large") === "1";
      const savedDim = parseInt(localStorage.getItem("gok_bg_dim") || "0", 10);
      app.bgDim = isNaN(savedDim) ? 0 : Math.max(0, Math.min(55, savedDim));
      this.bgmEl = new Audio();
      this.bgmEl.loop = true;
      this.bgmEl.volume = 0.22 * app.audioVolume;
      ["click", "hover", "select", "cancel", "coin", "battle", "wave", "end_turn", "victory", "error", "ui_open"].forEach((name) => {
        const a = new Audio("audio/" + name + ".wav");
        a.preload = "auto";
        a.volume = 0.42 * app.audioVolume;
        this.sfx[name] = a;
      });
      const unlock = () => {
        if (this.unlocked) return;
        this.unlocked = true;
        if (app.audioOn) this.bgm(this.bgmName || "bgm_title");
      };
      document.addEventListener("pointerdown", unlock, { once: true });
      document.addEventListener("keydown", unlock, { once: true });
      this.updateButton();
    },
    play(name) {
      if (!app.audioOn || !app.sfxOn) return;
      const a = this.sfx[name];
      if (!a) return;
      try { a.currentTime = 0; a.play().catch(() => {}); } catch (e) {}
    },
    bgm(name) {
      if (!name) return;
      this.bgmName = name;
      if (!this.unlocked) return;
      if (!app.audioOn || !app.bgmOn) return;
      if (this.bgmEl.src && this.bgmEl.src.indexOf(name + ".ogg") >= 0) {
        this.bgmEl.play().catch(() => {});
        return;
      }
      this.bgmEl.src = "audio/" + name + ".ogg";
      this.bgmEl.currentTime = 0;
      this.bgmEl.play().catch(() => {});
    },
    setVolume(value) {
      app.audioVolume = Math.max(0, Math.min(1, Number(value) || 0));
      try { localStorage.setItem("gok_volume", String(app.audioVolume)); } catch (e) {}
      if (this.bgmEl) this.bgmEl.volume = 0.22 * app.audioVolume;
      for (const k of Object.keys(this.sfx || {})) this.sfx[k].volume = 0.42 * app.audioVolume;
      updateSettingsUI();
    },
    toggle() {
      app.audioOn = !app.audioOn;
      localStorage.setItem("gok_sound", app.audioOn ? "1" : "0");
      if (!app.audioOn) {
        if (this.bgmEl) this.bgmEl.pause();
      } else if (app.bgmOn) {
        if (this.bgmEl) this.bgmEl.play().catch(() => {});
      }
      this.updateButton();
      updateSettingsUI();
    },
    toggleBgm() {
      app.bgmOn = !app.bgmOn;
      localStorage.setItem("gok_bgm", app.bgmOn ? "1" : "0");
      if (!app.bgmOn) { if (this.bgmEl) this.bgmEl.pause(); }
      else if (app.audioOn) this.bgm(this.bgmName || "bgm_title");
      updateSettingsUI();
    },
    toggleSfx() {
      app.sfxOn = !app.sfxOn;
      localStorage.setItem("gok_sfx", app.sfxOn ? "1" : "0");
      updateSettingsUI();
    },
    updateButton() {
      const b = $("btn-sound");
      if (b) b.textContent = app.audioOn ? "声音：开" : "声音：关";
    }
  };

  /* ===== screens ===== */
  function showScreen(name) {
    app.screen = name;
    document.body.dataset.screen = name;
    document.querySelectorAll(".screen").forEach((s) => s.classList.remove("active"));
    const target = $("screen-" + name);
    if (target) target.classList.add("active");
    if (name === "home" || name === "sim" || name === "setup" || name === "lan" || name === "deck" || name === "tutorial" || name === "codex" || name === "achievements" || name === "settings" || name === "rank" || name === "rules") AudioBox.bgm("bgm_title");
    if (name === "game") AudioBox.bgm("bgm_game");
    if (name !== "home") closeStartMenu();
    if (name === "home") { updateHomeLegendary(); updateHomeAccount(); }
    if (name === "rules") renderRulesKeywords();
    closeModal(true);
    hideKeywordTip();
    clearToast();
    if (name !== "game") app.busy = false;
  }

  /* ===== setup ===== */
  function updateHomeLegendary() {
    const candidates = Object.values(D.CARDS).filter(c => c.rarity === "legendary" && !c.token && !c.disabled);
    if (!candidates.length) return;
    let pick = candidates[Math.floor(Math.random() * candidates.length)];
    if (app.lastLegendary && candidates.length > 1) {
      let guard = 0;
      while (pick.id === app.lastLegendary && guard++ < 8) pick = candidates[Math.floor(Math.random() * candidates.length)];
    }
    app.lastLegendary = pick.id;
    const img = $("home-legendary-img");
    if (img) {
      img.onerror = () => { img.src = "assets/backgrounds/menu.webp"; };
      const url = cardArtUrl(pick);
      img.src = url || "assets/backgrounds/menu.webp";
      img.alt = pick.name;
    }
    const name = $("home-legendary-name");
    if (name) name.textContent = pick.name;
    const faction = $("home-legendary-faction");
    if (faction) faction.textContent = factionName(pick.faction) + " · " + (pick.type === "spell" ? "传说战术" : "传说随从") + " · " + (pick.cost || 0) + " 费";
  }

  function setHomeMode(mode) {
    const next = mode === "arcade" ? "arcade" : "classic";
    app.homeMode = next;
    document.querySelectorAll("[data-home-mode]").forEach((b) => b.classList.toggle("active", b.dataset.homeMode === next));
    const home = document.getElementById("screen-home");
    if (home) home.classList.toggle("home-arcade", next === "arcade");
    const title = document.getElementById("home-start-title");
    const sub = document.getElementById("home-start-sub");
    const eyebrow = document.querySelector(".home-start-eyebrow");
    if (title) title.textContent = next === "arcade" ? "进入街机模式" : "开始推演";
    if (sub) sub.textContent = next === "arcade" ? "远征 · 竞技场 · 每日挑战 · 残局 · 故事" : "经典模式 · 单人 AI · 局域网 · 在线房间";
    if (eyebrow) eyebrow.textContent = next === "arcade" ? "ARCADE / SIDE ARCHIVE" : "CLASSIC / ENTER ARCHIVE";
    try { localStorage.setItem("gok_home_mode", next); } catch (e) {}
  }

  function openStartMenu() {
    const show = () => {
      const menu = $("start-menu");
      if (!menu) return;
      menu.hidden = false;
      const root = $("start-menu-root");
      const multi = $("start-menu-multi");
      if (root) root.hidden = false;
      if (multi) multi.hidden = true;
      AudioBox.play("ui_open");
    };
    if (global.GokCinema) {
      global.GokCinema.playOnce("opening_classic_v1", "opening.mp4", {
        eyebrow: "CLASSIC / ENTER ARCHIVE",
        title: "戈克降临",
        text: "地脉在群山之下翻身，巨影自风暴中醒来。档案室记录下这一切，等待下一位执脉者。"
      }).then(show);
    } else {
      show();
    }
  }

  function closeStartMenu() {
    const menu = $("start-menu");
    if (menu) menu.hidden = true;
  }

  function setStartSubmenu(open) {
    const root = $("start-menu-root");
    const multi = $("start-menu-multi");
    if (root) root.hidden = !!open;
    if (multi) multi.hidden = !open;
    AudioBox.play(open ? "select" : "cancel");
  }

  function setupState() {
    app.mode = "ai";
    document.querySelectorAll("#setup-faction .faction-card").forEach((b) => { b.classList.toggle("active", b.dataset.faction === app.faction); b.style.setProperty("--emblem", "url('" + D.FACTIONS[b.dataset.faction].emblem + "')"); });
    const opponents = D.FACTION_IDS.filter((id) => id !== app.faction);
    if (!app.aiOpponent || opponents.indexOf(app.aiOpponent) < 0) app.aiOpponent = opponents[Math.floor(Math.random() * opponents.length)];
    const other = app.aiOpponent;
    $("setup-summary").textContent = "单人 vs AI · " + factionName(app.faction) + " vs " + factionName(other) + " · 30张带牌+1张遗物牌（需抽到） · 先手随机";
    const hero = D.HEROES[D.FACTIONS[app.faction].hero];
    const art = $("setup-hero-art");
    art.style.backgroundImage = "url('" + heroImage(hero.id) + "')";
    $("setup-hero-name").textContent = hero.name;
    $("setup-hero-quote").textContent = "“" + hero.quote + "”";
    $("setup-power-name").textContent = hero.power.name + " · " + hero.power.cost + " 行动力";
    $("setup-power-text").textContent = hero.power.text;
    const passiveEl = $("setup-passive-text");
    if (passiveEl) passiveEl.textContent = hero.passive ? "被动 · " + hero.passive.name + "：" + hero.passive.text : "";
    updateSetupDeck();
  }

  /* ===== game start ===== */
  const BOOT_ASSETS = [
    "assets/backgrounds/menu.webp",
    "assets/backgrounds/battle.webp",
    "assets/heroes/lain.webp",
    "assets/heroes/marta.webp",
    "assets/heroes/karna.webp",
    "assets/heroes/wolfram.webp",
    "assets/heroes/otto_centered.webp"
  ];
  let bootBusy = false;

  function preloadImages(list, onProgress) {
    let done = 0;
    const total = list.length || 1;
    return Promise.all(list.map((src) => new Promise((resolve) => {
      const img = new Image();
      const finish = () => { done++; if (onProgress) onProgress(done / total); resolve(); };
      img.onload = finish;
      img.onerror = finish;
      img.src = src;
    })));
  }

  function setBootProgress(value, tip) {
    const pct = Math.max(0, Math.min(100, Math.round(value)));
    const fill = $("boot-progress");
    if (fill) fill.style.width = pct + "%";
    const percent = $("boot-percent");
    if (percent) percent.textContent = pct + "%";
    if (tip) {
      const tipEl = $("boot-tip");
      if (tipEl) tipEl.textContent = tip;
    }
  }

  function runBootLoading(title, tip, list, done) {
    const box = $("boot-loading");
    if (!box) { if (done) done(); return; }
    bootBusy = true;
    box.classList.remove("hidden");
    const titleEl = $("boot-title");
    if (titleEl) titleEl.textContent = title || "正在展开流脉档案";
    setBootProgress(0, tip || "正在校准地脉与阵位…");
    const started = Date.now();
    preloadImages(list || BOOT_ASSETS, (p) => setBootProgress(p * 92, tip)).then(() => {
      setBootProgress(100, "推演准备完成");
      const wait = Math.max(0, 620 - (Date.now() - started));
      setTimeout(() => {
        box.classList.add("hidden");
        bootBusy = false;
        if (done) done();
      }, wait);
    });
  }

  function startGame(config) {
    config = config || {};
    const mode = "ai";
    const faction = config.faction || app.faction;
    const other = config.opponent || app.aiOpponent || D.nextFaction(faction);
    app.aiOpponent = null;
    const p1AI = false;
    const p2AI = true;
    app.tutorial = !!config.tutorial;
    app.settlementAchievements = null;
    app.settlementRecorded = false;
    app.profileRecorded = false;
    stopNet(true);
    const state = E.createGame({
      faction1: faction,
      faction2: other,
      p1AI: p1AI,
      p2AI: p2AI,
      mode: mode,
      aiDifficulty: config.aiDifficulty || app.aiDifficulty || "normal",
      mulligan: config.mulligan !== false && !app.tutorial,
      p1Deck: config.p1Deck || getPlayDeck(faction),
      p2Deck: config.p2Deck || getPlayDeck(other),
      first: config.first,
      seed: config.seed == null ? ((Date.now() >>> 0) ^ Math.floor(Math.random() * 0x7fffffff)) : config.seed
    });
    if (typeof config.setup === "function") config.setup(state);
    state.players[0].name = app.tutorial ? "你（学员）" : "你";
    state.players[1].name = app.tutorial ? "教程对手" : factionName(other) + "推演体";
    app.human = 0;
    app.aiPlayer = 1;
    app.local = false;
    app.net = null;
    app.game = state;
    if (state.mulliganPhase) autoMulliganAI(state, 1);
    app.mode = mode;
    app.faction = faction;
    app.viewer = state.current;
    app.busy = false;
    app.mulliganOpen = false;
    app.mulliganSubmitted = false;
    app.mulliganSelected = new Set();
    app.simRunning = false;
    app.aiRunning = false;
    app.selectedCard = null;
    app.targetInfo = null;
    app.zoneSelect = null;
    app.attacker = null;
    app.payBloodChoice = null;
    app.pendingBloodCard = null;
    app.lastVein = state.vein;
    app.lastThresholds = Object.assign({}, state.stats.thresholds);
    app.lastConfig = { mode: mode, faction: faction };
    app.endCGPlayed = false;
    app.endCGPending = false;
    closeModal(true);
    showScreen("game");
    AudioBox.play("ui_open");
    renderGame();
    const beginAfterIntro = () => {
      if (app.game !== state) return;
      renderGame();
      if (!state.mulliganPhase) {
        if (state.current === app.aiPlayer) beginAiTurn();
        else { showTurnBanner("你的回合"); toast("你的回合。"); }
      }
    };
    if (app.tutorial || (app.contentRun && app.contentRun.mode === "puzzle") || config.skipIntro) beginAfterIntro();
    else showTurnOrderIntro(state, beginAfterIntro);
  }

  function resetSelection() {
    app.selectedCard = null;
    app.targetInfo = null;
    app.zoneSelect = null;
    app.attacker = null;
    app.payBloodChoice = null;
    app.pendingBloodCard = null;
    hidePreview();
    renderGame();
  }

  /* ===== rendering ===== */
  function renderGame() {
    if (!app.game) return;
    const s = app.game;
    if (app.net) app.viewer = app.net.player;
    else if (app.local) app.viewer = s.current;
    else app.viewer = app.human;
    const viewer = s.players[app.viewer];
    const top = s.players[1 - app.viewer];
    const gameShell = document.querySelector(".game-shell");
    if (gameShell) gameShell.classList.toggle("enemy-turn", s.current !== app.viewer && s.status === "playing");
    const oppSide = document.querySelector(".opponent-side");
    const mySide = document.querySelector(".player-side");
    if (oppSide) { oppSide.dataset.faction = top.faction; oppSide.dataset.icon = factionIcon(top.faction); const l = oppSide.querySelector(".board-label"); if (l) l.textContent = top.factionName + " · 敌方阵位"; }
    if (mySide) { mySide.dataset.faction = viewer.faction; mySide.dataset.icon = factionIcon(viewer.faction); const l = mySide.querySelector(".board-label"); if (l) l.textContent = viewer.factionName + " · 我方阵位"; }
    const oppEmblem = $("opponent-emblem");
    const myEmblem = $("player-emblem");
    if (oppEmblem) oppEmblem.style.backgroundImage = "url('" + (D.FACTIONS[top.faction].emblem || "") + "')";
    if (myEmblem) myEmblem.style.backgroundImage = "url('" + (D.FACTIONS[viewer.faction].emblem || "") + "')";
    $("game-mode-label").textContent = s.players[0].factionName + " vs " + s.players[1].factionName + (s.ranked ? " · 排位" : app.net ? " · 局域网" : " · 单人 AI");
    $("turn-badge").textContent = s.status === "gameover" ? "推演结束" : "第 " + s.round + " 轮 · " + (s.current === app.viewer ? "你的回合" : "对方回合");
    renderHero($("opponent-hero"), top, "top");
    renderHero($("player-hero"), viewer, "bottom");
    renderBoard($("enemy-board"), top, "top", 1 - app.viewer);
    renderBoard($("player-board"), viewer, "bottom", app.viewer);
    renderVein(s);
    renderHand(viewer, s);
    renderControls(viewer, s);
    renderLog(s);
    renderOpponentEvents(s);
    processStateEvents(s);
    renderMana(viewer);
    renderTargetingPrompt(s, viewer);
    renderTutorialCoach();
    syncMulliganUI();
    if (s.status === "gameover") $("game-hint").textContent = "推演已结束。";
    else if (app.busy) $("game-hint").textContent = app.currentHint || "推演中…";
    else if (app.targetInfo) $("game-hint").textContent = app.targetInfo.kind === "heroPower" ? "选择领袖技能目标" : "选择目标";
    else if (app.zoneSelect) $("game-hint").textContent = "选择一个阵位放置随从或阵型";
    else if (app.attacker) $("game-hint").textContent = "选择攻击目标";
    else $("game-hint").textContent = "点击或拖动卡牌；点击我方随从攻击。";
    enforceBattleCardPresentation();
    if (app.net && app.net.role === "host" && app.net.active) { scheduleNetBroadcast(); scheduleHostSave(); }
  }

  function autoMulliganAI(state, playerIndex) {
    const p = state.players[playerIndex];
    if (!p) return;
    const picks = p.hand.filter((c) => {
      const d = D.CARDS[c.cardId];
      return d && !d.token && E.getCardCost(state, p, c) >= 4;
    }).slice(0, 2).map(c => c.uid);
    E.mulliganPlayer(state, playerIndex, picks);
  }

  function showMulliganFor(playerIndex) {
    const s = app.game;
    if (!s || !s.mulliganPhase || s.mulliganDone[playerIndex] || app.mulliganOpen) return;
    const player = s.players[playerIndex];
    if (!player) return;
    app.mulliganOpen = true;
    app.mulliganSelected = new Set();
    openModal((content) => {
      content.classList.add("mulligan-modal");
      content.appendChild(el("div", "eyebrow", "OPENING / MULLIGAN"));
      content.appendChild(el("h3", null, "起手调度"));
      content.appendChild(el("p", null, "选择要换掉的牌。换掉的牌会洗回牌库，再抽同样数量。也可以全部保留。"));
      const grid = el("div", "mulligan-grid");
      for (const c of player.hand) {
        const d = D.CARDS[c.cardId];
        if (!d || d.token) continue;
        const card = el("div", "mulligan-card");
        const art = el("div", "mulligan-art");
        if (d.art) art.style.backgroundImage = "url('" + portraitImage(d.art) + "')";
        else {
          art.classList.add("placeholder");
          art.dataset.icon = d.type === "spell" ? "术" : factionIcon(d.faction);
          art.style.backgroundImage = genericArtStyle(d);
          addGenericGlyph(art, d);
          addGeneratedArt(art, d);
        }
        card.appendChild(art);
        card.appendChild(el("div", "mulligan-cost", String(E.getCardCost(s, player, c))));
        card.appendChild(el("div", "mulligan-name", d.name));
        card.appendChild(el("div", "mulligan-meta", typeLine(d) + " · " + d.cost + " 费"));
        card.appendChild(el("div", "mulligan-text", d.text || "—"));
        if (d.type === "minion") {
          const stats = el("div", "mulligan-stats");
          stats.appendChild(el("span", "mulligan-atk", "攻 " + d.attack));
          stats.appendChild(el("span", "mulligan-hp", "血 " + d.health));
          card.appendChild(stats);
        }

        card.onclick = () => {
          if (app.mulliganSelected.has(c.uid)) app.mulliganSelected.delete(c.uid);
          else app.mulliganSelected.add(c.uid);
          card.classList.toggle("selected");
        };
        grid.appendChild(card);
      }
      content.appendChild(grid);
      const actions = el("div", "modal-actions");
      const keep = el("button", "btn btn-ghost", "全部保留");
      keep.onclick = () => { app.mulliganSelected = new Set(); confirmMulligan(); };
      const swap = el("button", "btn btn-primary", "确认换牌");
      swap.onclick = () => confirmMulligan();
      actions.appendChild(keep);
      actions.appendChild(swap);
      content.appendChild(actions);
      const hint = el("div", "mulligan-hint", "换牌不消耗行动力；先手/后手都会进入调度。");
      content.appendChild(hint);
    });
  }

  function confirmMulligan() {
    if (!app.game || !app.game.mulliganPhase || app.mulliganSubmitted) return;
    const uids = Array.from(app.mulliganSelected);
    app.mulliganSelected = new Set();
    app.mulliganOpen = false;
    app.mulliganSubmitted = true;
    closeModal(true);
    if (app.net && app.net.role === "guest") {
      app.busy = true;
      guestSendAction({ kind: "mulligan", uids: uids });
      return;
    }
    E.mulliganPlayer(app.game, app.viewer, uids);
    app.busy = false;
    renderGame();
  }

  function syncMulliganUI() {
    const s = app.game;
    if (!s) return;
    if (s.mulliganPhase) {
      if (!s.mulliganDone[app.viewer] && !app.mulliganSubmitted && !app.mulliganOpen) showMulliganFor(app.viewer);
      return;
    }
    if (app.mulliganOpen) {
      app.mulliganOpen = false;
      closeModal(true);
    }
    if (app.mulliganSubmitted) {
      app.mulliganSubmitted = false;
      app.busy = false;
      if (s.current === app.aiPlayer) beginAiTurn();
      else if (s.current === app.viewer) showTurnBanner("你的回合");
    }
  }

  function renderTargetingPrompt(s, viewer) {
    const box = $("targeting-prompt");
    if (!box) return;
    clear(box);
    document.body.classList.toggle("targeting-mode", !!(app.targetInfo && app.targetInfo.kind === "card"));
    if (!app.targetInfo) { box.classList.remove("show"); return; }
    if (app.targetInfo.kind === "card") {
      const card = viewer.hand.find((c) => c.uid === app.targetInfo.cardUid);
      const def = card ? D.CARDS[card.cardId] : null;
      if (!def) { box.classList.remove("show"); return; }
      const isBattlecry = def.keywords && def.keywords.indexOf("battlecry") >= 0;
      box.appendChild(el("span", "targeting-title", (isBattlecry ? "登场「" : "施放「") + def.name + "」"));
      box.appendChild(el("span", "targeting-sub", isBattlecry ? "点击发光的友方随从" : "点击高亮随从施放"));
    } else {
      box.appendChild(el("span", "targeting-title", "领袖技能"));
      box.appendChild(el("span", "targeting-sub", "点击高亮随从施放"));
    }
    const cancel = el("button", "targeting-cancel", "取消选择");
    cancel.onclick = () => cancelSelection();
    box.appendChild(cancel);
    box.classList.add("show");
  }

  function cancelSelection(silent) {
    app.targetInfo = null;
    app.zoneSelect = null;
    app.attacker = null;
    app.selectedCard = null;
    app.pendingDragZone = null;
    app.payBloodChoice = null;
    app.pendingBloodCard = null;
    hidePreview();
    if (!silent) toast("已取消选择。");
    if (app.game) renderGame();
  }

  function renderTutorialCoach() {
    const coach = $("tutorial-coach");
    if (!coach) return;
    if (!app.tutorial || !app.game) { coach.hidden = true; return; }
    coach.hidden = false;
    const s = app.game;
    const title = $("tutorial-coach-title");
    const text = $("tutorial-coach-text");
    if (s.status === "gameover") {
      title.textContent = "演练结束";
      text.textContent = "这局结束了。点右上角「退出教程」回到档案处，或再开一局新手演练。";
      return;
    }
    if (s.current !== app.viewer) {
      title.textContent = "对手回合";
      text.textContent = "先观察对手怎么使用行动力和随从。轮到你时，再按提示操作。";
      return;
    }
    if (app.targetInfo) {
      title.textContent = "选择目标";
      text.textContent = "点击高亮随从完成施放；点同卡、右键、Esc 或提示条上的「取消选择」可以取消。";
      return;
    }
    if (app.zoneSelect) {
      title.textContent = "选择阵位";
      text.textContent = "左翼 / 中阵 / 右翼最多各站 3 个随从，但全场最多 6 个。把牌点进或拖进高亮阵位。";
      return;
    }
    const own = s.players[app.viewer];
    const attackers = E.allMinions(own).filter(m => m.attacksLeft > 0 && m.frozenTurns === 0 && m.attack > 0);
    const canAttack = attackers.some(m => {
      const o = E.getAttackOptions(s, app.viewer, m.uid);
      return o.ok && o.targets.length > 0;
    });
    if (canAttack) {
      title.textContent = "第 2 步 · 攻击";
      text.textContent = "把攻击力大于 0 的我方随从拖到敌方随从或领袖上；也可以先点随从，再点目标。";
      return;
    }
    const playable = own.hand.filter(c => {
      const o = E.getPlayOptions(s, app.viewer, c.uid);
      return o.ok;
    });
    if (playable.length) {
      title.textContent = "第 1 步 · 出牌";
      text.textContent = "点击一张手牌，再点高亮阵位；也可以直接拖到阵位。绿色/金色高亮表示这个阵位可以放。";
      return;
    }
    title.textContent = "第 3 步 · 结束回合";
    text.textContent = "现在没有可打出的牌。点右下角「结束回合」把回合交给对手，观察流脉自然 +1。";
  }

  function startTutorial() {
    unlockAchievement("tutorial");
    app.tutorial = true;
    app.tutorialStep = 1;
    startGame({ faction: "pus", opponent: "academy", tutorial: true, first: 0, seed: 424242 });
    showTurnBanner("新手演练");
    toast("新手演练：跟着左侧提示操作。");
  }

  function endTutorial() {
    app.tutorial = false;
    const coach = $("tutorial-coach");
    if (coach) coach.hidden = true;
    leaveGame();
    toast("教程已结束。");
  }

  function renderMana(player) {
    const box = $("mana-display");
    if (!box) return;
    clear(box);
    box.classList.add("mana-row", "mana-hud");
    box.style.setProperty("width", "fit-content", "important");
    box.style.setProperty("min-width", "0", "important");
    box.title = "行动力：本回合可用于出牌和领袖技能的资源";
    const main = el("span", "mana-main");
    const manaIcon = el("i", "mana-icon");
    manaIcon.style.backgroundImage = "url('/assets/icons/action.svg')";
    main.appendChild(manaIcon);
    main.appendChild(el("span", "mana-label", "行动力"));
    box.appendChild(main);
    const pips = el("span", "mana-pips");
    pips.style.setProperty("display", "flex", "important");
    pips.style.setProperty("width", "auto", "important");
    pips.style.setProperty("gap", "5px", "important");
    const slots = Math.max(1, player.maxMana);
    for (let i = 0; i < slots; i++) {
      const pip = el("span", "mana-pip" + (i < player.mana ? " filled" : ""));
      pip.style.setProperty("flex", "0 0 26px", "important");
      pip.style.setProperty("width", "26px", "important");
      pip.style.setProperty("height", "34px", "important");
      pip.style.setProperty("clip-path", "none", "important");
      pip.style.setProperty("transform", "none", "important");
      pip.style.setProperty("min-width", "0", "important");
      pip.style.setProperty("border-radius", "2px", "important");
      pip.style.setProperty("border", "1px solid " + (i < player.mana ? "rgba(182,238,226,.9)" : "rgba(142,190,183,.34)"), "important");
      pip.style.setProperty("background", i < player.mana ? "#8fd8cc" : "rgba(3,14,16,.75)", "important");
      pip.style.setProperty("box-shadow", "none", "important");
      pips.appendChild(pip);
    }
    box.appendChild(pips);
  }

  let heroTooltipEl = null;
  function hideHeroTooltip() {
    if (heroTooltipEl && heroTooltipEl.parentNode) heroTooltipEl.parentNode.removeChild(heroTooltipEl);
    heroTooltipEl = null;
  }
  function showHeroTooltip(container, player) {
    hideHeroTooltip();
    const hero = player.hero;
    if (!hero) return;
    const tip = el("div", "hero-tooltip");
    const head = el("div", "hero-tooltip-head");
    head.appendChild(el("span", null, "LEADER / " + factionName(player.faction)));
    head.appendChild(el("strong", null, hero.name));
    head.appendChild(el("small", null, hero.title || ""));
    tip.appendChild(head);
    const power = el("div", "hero-tooltip-row");
    power.appendChild(el("span", "hero-tooltip-label", "领袖技能 · " + hero.power.cost + (player.heroPowerUsed ? " · 本回合已用" : "")));
    power.appendChild(el("strong", null, hero.power.name));
    power.appendChild(el("p", null, hero.power.text || ""));
    tip.appendChild(power);
    if (hero.passive) {
      const passive = el("div", "hero-tooltip-row passive");
      passive.appendChild(el("span", "hero-tooltip-label", "被动"));
      passive.appendChild(el("strong", null, hero.passive.name));
      passive.appendChild(el("p", null, hero.passive.text || ""));
      tip.appendChild(passive);
    }
    if (player.relic && D.CARDS[player.relic]) {
      const rd = D.CARDS[player.relic];
      const row = el("div", "hero-tooltip-row relic");
      row.appendChild(el("span", "hero-tooltip-label", "已装备遗物"));
      row.appendChild(el("strong", null, rd.name));
      row.appendChild(el("p", null, rd.text || ""));
      tip.appendChild(row);
    }
    document.body.appendChild(tip);
    const r = container.getBoundingClientRect();
    const width = Math.min(340, Math.max(250, innerWidth * 0.3));
    tip.style.width = width + "px";
    const left = Math.max(12, Math.min(innerWidth - width - 12, r.left + r.width / 2 - width / 2));
    const above = r.top > innerHeight * 0.5;
    tip.style.left = left + "px";
    tip.style.top = (above ? r.top - tip.offsetHeight - 10 : r.bottom + 10) + "px";
    heroTooltipEl = tip;
  }

  function renderHero(container, player, side) {
    if (!container) return;
    hideHeroTooltip();
    clear(container);
    container.dataset.faction = player.faction;
    container.classList.toggle("current-turn", app.game.current === player.index && app.game.status === "playing");
    const portrait = el("div", "hero-portrait");
    portrait.style.backgroundImage = "url('" + heroImage(player.heroId) + "')";
    container.appendChild(portrait);
    const crest = el("div", "hero-crest");
    crest.style.backgroundImage = "url('" + (D.FACTIONS[player.faction].emblem || "") + "')";
    container.appendChild(crest);
    addHeroFrame(container);
    const info = el("div", "hero-info");
    info.appendChild(el("div", "hero-name", player.name));
    info.appendChild(el("div", "hero-sub", player.hero.title));
    const skill = el("button", "hero-skill-inline");
    const skillIcon = el("span", "hero-skill-icon");
    skillIcon.style.backgroundImage = "url('assets/ui/hero-power-medallion.webp?v=" + ART_VERSION + "')";
    skill.appendChild(skillIcon);
    const skillCopy = el("span", "hero-skill-copy");
    skillCopy.appendChild(el("small", null, "领袖技能"));
    skillCopy.appendChild(el("strong", null, player.hero.power.name));
    skill.appendChild(skillCopy);
    const skillCost = el("span", "hero-skill-cost", player.hero.power.cost);
    skill.appendChild(skillCost);
    if (side === "bottom") {
      const ready = app.game.status === "playing" && app.game.current === player.index && !player.heroPowerUsed && player.mana >= (player.hero.power.cost || 2);
      const reason = player.heroPowerUsed ? "已用" : app.game.current !== player.index ? "等待" : player.mana < (player.hero.power.cost || 2) ? "费用不足" : "可用";
      skill.classList.toggle("ready", ready);
      skill.classList.toggle("unavailable", !ready);
      skill.disabled = !ready;
      skill.appendChild(el("span", "hero-skill-state", reason));
      skill.onclick = () => { const b = $("btn-hero-power"); if (b && !b.disabled) b.click(); };
    } else {
      skill.disabled = true;
      skill.classList.add("enemy-skill");
      skill.appendChild(el("span", "hero-skill-state", "对手"));
    }
    for (const f of player.formations || []) {
      const fd = D.CARDS[f.cardId];
      if (fd) info.appendChild(el("div", "hero-formation", "阵型 · " + fd.name + " · " + E.ZONE_NAMES[f.zone]));
    }
    const vitals = el("div", "hero-vitals");
    const hpOrb = el("div", "hero-hp-orb");
    hpOrb.appendChild(el("strong", null, String(Math.max(0, player.hp))));
    hpOrb.appendChild(el("small", null, "生命"));
    vitals.appendChild(hpOrb);
    const armorOrb = el("div", "hero-armor-orb");
    armorOrb.appendChild(el("strong", null, String(player.armor)));
    armorOrb.appendChild(el("span", null, "护甲"));
    vitals.appendChild(armorOrb);
    info.appendChild(vitals);
    const hpTrack = el("div", "hero-hp-track");
    const hpFill = el("i", "hero-hp-fill");
    const hpPct = Math.max(0, Math.min(100, player.hp / player.maxHp * 100));
    hpFill.style.width = hpPct + "%";
    if (hpPct <= 25) hpFill.classList.add("low");
    else if (hpPct <= 55) hpFill.classList.add("mid");
    hpTrack.appendChild(hpFill);
    info.appendChild(hpTrack);
    info.appendChild(skill);
    if (side === "bottom") {
      const resetSkillFeedback = () => {
        skill.style.removeProperty("transform");
        skill.style.removeProperty("filter");
        skill.style.removeProperty("border-color");
        skill.style.removeProperty("box-shadow");
      };
      skill.addEventListener("mouseenter", () => {
        if (skill.disabled) return;
        skill.style.setProperty("transform", "translateY(-1px)", "important");
        skill.style.setProperty("filter", "brightness(1.16)", "important");
        skill.style.setProperty("border-color", "rgba(247,216,143,.92)", "important");
        skill.style.setProperty("box-shadow", "0 0 0 1px rgba(247,216,143,.22), 0 0 26px rgba(242,198,109,.34), inset 0 0 18px rgba(242,198,109,.1)", "important");
      });
      skill.addEventListener("mouseleave", resetSkillFeedback);
      skill.addEventListener("pointerdown", () => {
        if (skill.disabled) return;
        skill.style.setProperty("transform", "translateY(1px) scale(.985)", "important");
        skill.style.setProperty("filter", "brightness(.9)", "important");
        skill.style.setProperty("box-shadow", "inset 0 2px 14px rgba(0,0,0,.6)", "important");
      });
      skill.addEventListener("pointerup", () => { if (!skill.disabled) skill.style.setProperty("transform", "translateY(-1px)", "important"); });
      skill.addEventListener("pointercancel", resetSkillFeedback);
      skill.addEventListener("blur", resetSkillFeedback);
    }
    if (side === "top") {
      if (skill.parentNode) skill.parentNode.removeChild(skill);
      const cardsLeft = el("div", "hero-opponent-resources");
      const count = el("div", "op-resource-count");
      count.appendChild(el("strong", null, String(player.deck.length)));
      count.appendChild(el("span", null, "张"));
      cardsLeft.appendChild(count);
      cardsLeft.appendChild(el("div", "op-resource-label", "对手剩余牌库"));
      cardsLeft.appendChild(el("div", "op-resource-hand", "手牌 " + player.hand.length));
      info.appendChild(cardsLeft);
    }
    container.title = player.name + (player.hero.passive ? " · 被动：" + player.hero.passive.name + " " + player.hero.passive.text : "");
    container.appendChild(info);
    if (side === "bottom") {
      const deckBadge = $("deck-left-value");
      if (deckBadge) deckBadge.textContent = String(player.deck.length);
      const deckDock = $("deck-dock-value");
      if (deckDock) deckDock.textContent = String(player.deck.length);
      const deckBadgeBox = $("deck-left-badge");
      if (deckBadgeBox) deckBadgeBox.classList.toggle("low", player.deck.length <= 8);
    }
    container.onmouseenter = () => showHeroTooltip(container, player);
    container.onmouseleave = hideHeroTooltip;
    if (side === "top") {
      const targets = targetList();
      const heroTargetable = targets.indexOf("hero") >= 0;
      container.classList.toggle("targetable", heroTargetable);
      if (heroTargetable) container.dataset.targetType = (app.targetInfo && app.targetInfo.targetType) || "attack";
      else delete container.dataset.targetType;
      container.onclick = () => {
        if (targetList().indexOf("hero") >= 0) onTargetClick("hero");
      };
      container.classList.toggle("drag-target", !!(app.draggingAttacker && canDropAttackOn("hero")));
      container.addEventListener("dragover", (ev) => {
        if (!app.draggingAttacker || !canDropAttackOn("hero")) return;
        ev.preventDefault();
        ev.dataTransfer.dropEffect = "move";
        container.classList.add("drop-hover");
      });
      container.addEventListener("dragleave", () => container.classList.remove("drop-hover"));
      container.addEventListener("drop", (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        container.classList.remove("drop-hover");
        if (app.draggingAttacker && canDropAttackOn("hero")) performDragAttack("hero");
        else finishCardDrag();
      });
    }
  }

  function retreatBoardMinion(uid) {
    if (!app.game || app.game.status !== "playing") return;
    if (app.net && app.net.role === "guest") {
      guestSendAction({ kind: "retreat", uid: uid });
      return;
    }
    const r = E.retreatMinion(app.game, app.viewer, uid);
    if (!r.ok) { toast(r.reason || "无法撤退。"); renderGame(); return; }
    AudioBox.play("select");
    renderGame();
  }

  function playerZones(player) {
    return D.CARDS && E.ZONES ? E.ZONES : ["left", "center", "right"];
  }

  function renderBoard(container, player, side, ownerIndex) {
    if (!container) return;
    clear(container);
    for (const z of playerZones()) {
      const zone = el("div", "zone");
      zone.dataset.zone = z;
      zone.dataset.zoneName = E.ZONE_NAMES[z];
      zone.setAttribute("data-zone", E.ZONE_NAMES[z]);
      const zonesOpen = app.zoneSelect && side === "bottom" && app.game.current === player.index;
      zone.classList.toggle("zone-open", !!zonesOpen);
      if (zonesOpen) zone.onclick = () => onZoneClick(z);
      if (side === "bottom" && app.game.current === player.index) {
        zone.addEventListener("dragover", (ev) => {
          if (!canDropCardToZone(z)) return;
          ev.preventDefault();
          ev.dataTransfer.dropEffect = "move";
          zone.classList.add("drop-ready");
        });
        zone.addEventListener("dragleave", () => zone.classList.remove("drop-ready"));
        zone.addEventListener("drop", (ev) => {
          ev.preventDefault();
          zone.classList.remove("drop-ready");
          onDropCardToZone(z);
        });
      }
      for (let i = 0; i < 3; i++) {
        const slot = el("div", "zone-slot");
        slot.dataset.slot = String(i);
        zone.appendChild(slot);
      }
      const minions = player.board[z] || [];
      if (!minions.length) {
        const empty = el("div", "empty-slot");
        zone.appendChild(empty);
      } else {
        for (const m of minions) {
          const card = createBoardCard(m, player, ownerIndex);
          zone.appendChild(card);
        }
      }
      container.appendChild(zone);
    }
  }

  function handDef(cardUid) {
    if (!app.game) return null;
    const hand = app.game.players[app.viewer].hand;
    const instance = hand.find((c) => c.uid === cardUid);
    return instance ? D.CARDS[instance.cardId] : null;
  }

  function makeDragImage(def, kind) {
    const ghost = el("div", "drag-ghost " + (kind || "card"));
    if (kind === "attack") {
      ghost.appendChild(el("div", "drag-sword", "⚔"));
      ghost.appendChild(el("span", null, def ? def.name : "攻击"));
    } else {
      if (def) { const url = cardArtUrl(def); if (url) ghost.style.backgroundImage = "url('" + url + "')"; }
      ghost.appendChild(el("span", null, def ? def.name : ""));
    }
    document.body.appendChild(ghost);
    return ghost;
  }

  function setCustomDragImage(ev, def, kind) {
    if (!ev.dataTransfer || !ev.dataTransfer.setDragImage) return;
    const ghost = makeDragImage(def, kind);
    const rect = ghost.getBoundingClientRect();
    try { ev.dataTransfer.setDragImage(ghost, Math.max(1, rect.width / 2), Math.max(1, rect.height / 2)); } catch (e) {}
    setTimeout(() => { if (ghost.parentNode) ghost.parentNode.removeChild(ghost); }, 80);
  }

  function clearBoardDragClasses() {
    document.querySelectorAll(".drag-target, .drop-hover, .spell-target, .attacker-drag").forEach((n) => {
      n.classList.remove("drag-target", "drop-hover", "spell-target", "attacker-drag");
    });
  }

  function highlightAttackTargets() {
    clearBoardDragClasses();
    for (const uid of app.dragAttackTargets || []) {
      if (uid === "hero") {
        const hero = $("opponent-hero");
        if (hero) hero.classList.add("drag-target");
      } else {
        const node = document.querySelector('[data-minion="' + uid + '"]');
        if (node) node.classList.add("drag-target");
      }
    }
    const src = document.querySelector('[data-minion="' + app.draggingAttacker + '"]');
    if (src) src.classList.add("attacker-drag");
  }

  function highlightSpellTargets(cardUid) {
    clearBoardDragClasses();
    const def = handDef(cardUid);
    if (!def || def.type !== "spell") return;
    const opt = E.getPlayOptions(app.game, app.game.current, cardUid);
    if (!opt || !opt.targetType) return;
    for (const uid of opt.targets || []) {
      const node = document.querySelector('[data-minion="' + uid + '"]');
      if (node) node.classList.add("spell-target");
    }
  }

  function finishCardDrag() {
    app.draggingUid = null;
    app.draggingAttacker = null;
    app.dragAttackTargets = [];
    app.suppressClick = Date.now();
    clearBoardDragClasses();
  }

  function performDragAttack(targetUid) {
    const attacker = app.draggingAttacker;
    if (!attacker || !app.game || app.game.current !== app.viewer) { finishCardDrag(); return; }
    const opts = E.getAttackOptions(app.game, app.game.current, attacker);
    if (!opts.ok || (opts.targets || []).indexOf(targetUid) < 0) { finishCardDrag(); return; }
    app.draggingAttacker = null;
    app.dragAttackTargets = [];
    clearBoardDragClasses();
    app.suppressClick = Date.now();
    if (app.net && app.net.role === "guest") {
      guestSendAction({ kind: "attack", attackerUid: attacker, targetUid: targetUid });
      return;
    }
    animateAttack(attacker, targetUid, app.game.current, () => checkGameOverAfterAction());
  }

  function canDropAttackOn(targetUid) {
    if (!app.draggingAttacker) return false;
    const opts = E.getAttackOptions(app.game, app.game.current, app.draggingAttacker);
    return opts.ok && (opts.targets || []).indexOf(targetUid) >= 0;
  }

  function canDropSpellOn(targetUid) {
    if (!app.draggingUid) return false;
    const def = handDef(app.draggingUid);
    if (!def || def.type !== "spell") return false;
    const opt = E.getPlayOptions(app.game, app.game.current, app.draggingUid);
    return opt && opt.targetType && (opt.targets || []).indexOf(targetUid) >= 0;
  }

  function dropOnMinion(ev, targetUid) {
    if (!app.draggingAttacker && !app.draggingUid) return;
    ev.preventDefault();
    ev.stopPropagation();
    if (app.draggingAttacker && canDropAttackOn(targetUid)) {
      if (app.net && app.net.role === "guest") {
        const attacker = app.draggingAttacker;
        clearBoardDragClasses();
        app.draggingAttacker = null;
        app.dragAttackTargets = [];
        guestAnimateAttack(attacker, targetUid);
      } else {
        performDragAttack(targetUid);
      }
      return;
    }
    if (app.draggingUid && canDropSpellOn(targetUid)) {
      const uid = app.draggingUid;
      finishCardDrag();
      commitPlay(uid, targetUid, null);
      return;
    }
    finishCardDrag();
  }

  function skillBadge(def) {
    if (!def) return null;
    const kw = def.keywords || [];
    let key = null;
    let label = "";
    if (kw.indexOf("battlecry") >= 0) { key = "battlecry"; label = "登场"; }
    else if (kw.indexOf("deathrattle") >= 0) { key = "deathrattle"; label = "余响"; }
    else if (kw.indexOf("taunt") >= 0) { key = "taunt"; label = "拦截"; }
    else if (kw.indexOf("charge") >= 0) { key = "charge"; label = "突进"; }
    else if (def.passive) { key = "passive"; label = "被动"; }
    if (!key) return null;
    const badge = el("div", "skill-badge " + key);
    const icon = el("img", "skill-icon");
    icon.src = "/assets/icons/" + key + ".svg";
    icon.alt = "";
    badge.appendChild(icon);
    badge.appendChild(el("span", null, label));
    return badge;
  }

  function createBoardCard(m, player, ownerIndex) {
    const def = D.CARDS[m.cardId];
    const healthText = m.health < m.maxHealth ? m.health + "/" + m.maxHealth : String(m.health);
    const card = buildLibraryCard(def, {
      variant: "mini",
      faction: true,
      cost: def.cost,
      attack: m.attack,
      health: healthText,
      typeText: typeLine(def, m)
    });
    card.classList.add("board-card", "library-board", "type-minion");
    card.dataset.faction = def.faction;
    card.dataset.minion = m.uid;
    const atkEl = card.querySelector(".gok-lib-atk");
    const hpEl = card.querySelector(".gok-lib-hp");
    if (atkEl && m.attack > m.baseAttack) atkEl.classList.add("stat-buffed");
    if (hpEl && m.health < m.maxHealth) hpEl.classList.add("stat-damaged");
    if (hpEl && m.health > m.maxHealth) hpEl.classList.add("stat-buffed");
    if (m.taunt) card.classList.add("taunt");
    if (m.frozenTurns > 0) card.classList.add("frozen");
    if (m.stealth) card.classList.add("stealthed");
    if (m.silenced) card.classList.add("silenced");
    if (m.bounty != null) {
      const badge = el("div", "bounty-mark", "悬赏");
      badge.title = "悬赏名单：该随从死亡时，名单主人抽 1 张牌";
      card.appendChild(badge);
    }
    if (app.attacker === m.uid) card.classList.add("selected");
    if (targetList().indexOf(m.uid) >= 0) {
      card.classList.add("targetable");
      card.dataset.targetType = (app.targetInfo && app.targetInfo.targetType) || "attack";
    }
    if (app.targetInfo && app.targetInfo.kind === "card" && targetList().indexOf(m.uid) >= 0) {
      const tPlayer = app.game.players[app.viewer];
      const tInst = tPlayer && tPlayer.hand.find(c => c.uid === app.targetInfo.cardUid);
      const tDef = tInst ? D.CARDS[tInst.cardId] : null;
      if (tDef && tDef.keywords && tDef.keywords.indexOf("battlecry") >= 0) card.classList.add("battlecry-target");
    }
    card.title = def.name + " · " + m.attack + "/" + m.health;
    card.onmouseenter = () => showPreview(def, m);
    card.onmouseleave = hidePreview;
    card.onclick = (ev) => {
      ev.stopPropagation();
      if (app.suppressClick && Date.now() < app.suppressClick) return;
      if (targetList().indexOf(m.uid) >= 0) { onTargetClick(m.uid); return; }
      if (app.zoneSelect) return;
      if (ownerIndex === app.viewer && app.game.current === app.viewer && app.game.status === "playing") {
        const opts = E.getAttackOptions(app.game, app.game.current, m.uid);
        if (opts.ok && opts.targets.length) {
          if (app.attacker === m.uid) app.attacker = null;
          else app.attacker = m.uid;
          renderGame();
        } else {
          toast("该随从本回合无法攻击。");
        }
      }
    };
    const canAttackNow = ownerIndex === app.viewer && app.game.current === app.viewer && app.game.status === "playing" && m.attacksLeft > 0 && m.frozenTurns === 0 && m.attack > 0 && !app.busy;
    const ownTurn = ownerIndex === app.viewer && app.game.current === app.viewer && app.game.status === "playing";
    let attackStatus = null;
    let attackStatusClass = "";
    if (m.frozenTurns > 0) { attackStatus = "冻结"; attackStatusClass = "frozen-status"; }
    else if (ownTurn) {
      if (canAttackNow) { attackStatus = "可攻击"; attackStatusClass = "ready"; card.classList.add("attackable"); }
      else if (m.attacksLeft <= 0) { attackStatus = m.justPlayed ? "沉睡" : "已行动"; attackStatusClass = "spent"; card.classList.add("spent"); }
      else if (m.attack <= 0) { attackStatus = "无法攻击"; attackStatusClass = "spent"; card.classList.add("spent"); }
      else { attackStatus = "待命"; attackStatusClass = "waiting"; }
    } else if (ownerIndex === app.viewer) {
      attackStatus = m.attacksLeft > 0 ? "待命" : "已行动";
      attackStatusClass = "waiting";
    }
    if (attackStatus) card.appendChild(el("div", "attack-status " + attackStatusClass, attackStatus));
    if (m.frozenTurns > 0) {
      const ice = el("div", "ice-shards");
      for (let i = 0; i < 5; i++) ice.appendChild(el("i", null, ""));
      card.appendChild(ice);
    }
    if (canAttackNow) {
      card.draggable = true;
      card.classList.add("draggable-attacker");
      card.addEventListener("dragstart", (ev) => {
        if (!ev.dataTransfer) return;
        app.draggingAttacker = m.uid;
        app.suppressClick = Date.now();
        const opts = E.getAttackOptions(app.game, app.game.current, m.uid);
        app.dragAttackTargets = (opts.targets || []).slice();
        setCustomDragImage(ev, D.CARDS[m.cardId], "attack");
        highlightAttackTargets();
        ev.dataTransfer.effectAllowed = "move";
        try { ev.dataTransfer.setData("text/plain", "attack:" + m.uid); } catch (e) {}
      });
      card.addEventListener("dragend", () => finishCardDrag());
    }
    card.addEventListener("dragover", (ev) => {
      const attackOk = app.draggingAttacker && canDropAttackOn(m.uid);
      const spellOk = app.draggingUid && canDropSpellOn(m.uid);
      if (attackOk || spellOk) {
        ev.preventDefault();
        ev.stopPropagation();
        card.classList.add("drop-hover");
      }
    });
    card.addEventListener("dragleave", () => card.classList.remove("drop-hover"));
    card.addEventListener("drop", (ev) => {
      card.classList.remove("drop-hover");
      dropOnMinion(ev, m.uid);
    });
    attachMobilePreview(card, def, m);
    return card;
  }

  function typeLine(def, m) {
    return def.type === "spell" ? "战术" : def.type === "relic" ? "遗物" : def.type === "formation" ? "阵型" : def.type === "leader" ? "领袖" : "随从";
  }

  function renderVein(s) {
    $("vein-value").textContent = String(s.vein);
    const track = $("vein-track");
    clear(track);
    const thresholdInfo = { 4: "4 震荡", 7: "7 裂隙", 10: "10 魔潮", 12: "12 回流" };
    const thresholdNames = { 4: "震荡", 7: "裂隙", 10: "魔物潮", 12: "回流" };
    const thresholdTone = { 4: "calm", 7: "hot", 10: "danger", 12: "return" };
    const nextThreshold = [4, 7, 10, 12].find((n) => n > s.vein);
    for (let i = 1; i <= 12; i++) {
      const pip = el("div", "vein-pip");
      pip.classList.add("seg" + (i <= 4 ? 1 : i <= 7 ? 2 : i <= 10 ? 3 : 4));
      if (i <= s.vein) {
        pip.classList.add("active");
        if (i >= 7) pip.classList.add("hot");
        if (i >= 10) pip.classList.add("danger");
      }
      if ([4, 7, 10, 12].indexOf(i) >= 0) {
        pip.classList.add("threshold");
        pip.dataset.threshold = String(i);
        pip.dataset.label = thresholdInfo[i];
        pip.dataset.tone = thresholdTone[i];
        if (i === nextThreshold) pip.classList.add("next");
        if (i <= s.vein) pip.classList.add("reached");
      }
      track.appendChild(pip);
    }
    const cursor = el("i", "vein-cursor");
    cursor.style.left = (Math.max(0, Math.min(12, s.vein)) / 12 * 100).toFixed(2) + "%";
    cursor.title = "当前流脉：" + s.vein + " / 12";
    track.appendChild(cursor);
    const nextEl = $("vein-next");
    if (nextEl) {
      if (nextThreshold) {
        nextEl.textContent = "距 " + nextThreshold + " " + thresholdNames[nextThreshold] + " 还差 " + (nextThreshold - s.vein) + " 点";
        nextEl.dataset.tone = thresholdTone[nextThreshold];
      } else {
        nextEl.textContent = "所有阈值已触发 · 再前进将回流";
        nextEl.dataset.tone = "return";
      }
    }
    const thresholds = s.stats.thresholds || { 4: 0, 7: 0, 10: 0 };
    const oldT = app.lastThresholds || { 4: 0, 7: 0, 10: 0 };
    let bannerText = "";
    let tone = "";
    if ((thresholds[10] || 0) > (oldT[10] || 0)) {
      bannerText = "魔物潮！所有随从 -3 生命，双方领袖 -5 生命";
      tone = "danger";
    } else if ((thresholds[7] || 0) > (oldT[7] || 0)) {
      bannerText = "流脉裂隙！双方领袖受到 2 点伤害";
      tone = "hot";
    } else if ((thresholds[4] || 0) > (oldT[4] || 0)) {
      bannerText = "流脉震荡！所有随从受到 1 点伤害";
      tone = "hot";
    } else if (s.vein > app.lastVein) {
      bannerText = "流脉提升：" + app.lastVein + " → " + s.vein;
      tone = s.vein >= 7 ? "hot" : "";
    } else if (app.lastVein >= 12 && s.vein < app.lastVein) {
      bannerText = "流脉回流：12 → 0";
      tone = "hot";
    } else if (s.vein < app.lastVein) {
      bannerText = "流脉疏导：" + app.lastVein + " → " + s.vein;
    }
    app.lastThresholds = { 4: thresholds[4] || 0, 7: thresholds[7] || 0, 10: thresholds[10] || 0 };
    if (bannerText) {
      showVeinBanner(bannerText, tone);
      AudioBox.play(tone === "danger" ? "wave" : "coin");
    }
    if (s.vein !== app.lastVein) {
      const row = $("vein-row");
      row.classList.remove("vein-pulse");
      void row.offsetWidth;
      row.classList.add("vein-pulse");
      app.lastVein = s.vein;
    }
  }

  function renderOpponentEvents(s) {
    if (app.logGameSeed !== s.seed) { app.logGameSeed = s.seed; app.logCursor = s.log.length; return; }
    const from = app.logCursor == null ? s.log.length : app.logCursor;
    const fresh = s.log.slice(from);
    app.logCursor = s.log.length;
    for (const entry of fresh) {
      if (entry.player == null || entry.player === app.viewer) continue;
      if (["play", "spell", "summon"].indexOf(entry.type) < 0) continue;
      const box = el("div", "opponent-action");
      box.textContent = entry.text.replace(/^对手\s*/, "");
      document.body.appendChild(box);
      requestAnimationFrame(() => box.classList.add("show"));
      setTimeout(() => { if (box.parentNode) box.parentNode.removeChild(box); }, 1900);
    }
  }

  function eventPoint(uid) {
    let node = null;
    if (uid && String(uid).indexOf("hero:") === 0) {
      const idx = Number(String(uid).slice(5));
      node = document.getElementById(idx === app.viewer ? "player-hero" : "opponent-hero");
    } else if (uid) {
      node = document.querySelector('.board-card[data-minion="' + uid + '"]');
    }
    if (!node) return { x: innerWidth / 2, y: innerHeight * 0.45, hero: false };
    const r = node.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2, hero: String(uid || "").indexOf("hero:") === 0, node };
  }

  function zonePoint(playerIndex, zone) {
    const zones = ["left", "center", "right"];
    const board = document.getElementById(playerIndex === app.viewer ? "player-board" : "enemy-board");
    const node = board ? board.querySelectorAll(".zone")[zones.indexOf(zone)] : null;
    const r = node ? node.getBoundingClientRect() : null;
    return { x: r ? r.left + r.width / 2 : innerWidth / 2, y: r ? r.top + r.height / 2 : innerHeight / 2, node };
  }

  function showDeathPuff(ev) {
    const pt = zonePoint(ev.player, ev.zone);
    const puff = el("div", "death-puff");
    puff.style.left = pt.x + "px";
    puff.style.top = pt.y + "px";
    document.body.appendChild(puff);
    setTimeout(() => { if (puff.parentNode) puff.parentNode.removeChild(puff); }, 650);
  }

  function flashScreen(kind) {
    const cls = kind + "-flash";
    document.body.classList.remove(cls);
    void document.body.offsetWidth;
    document.body.classList.add(cls);
    setTimeout(() => document.body.classList.remove(cls), 420);
  }

  function processStateEvents(s) {
    if (app.eventSeed !== s.seed) {
      app.eventSeed = s.seed;
      app.eventCursor = s.events.length;
      return;
    }
    if (app.eventCursor == null || app.eventCursor > s.events.length) app.eventCursor = 0;
    const fresh = s.events.slice(app.eventCursor);
    app.eventCursor = s.events.length;
    for (const ev of fresh) {
      if (!ev.structured) continue;
      if (ev.kind === "damage") {
        if (ev.label === "战斗") continue;
        if (!app.damageNumbers) continue;
        const pt = eventPoint(ev.targetUid);
        showFloatingNumber("-" + (ev.amount || 0), pt.x, pt.y, "damage");
        if (pt.node) { pt.node.classList.add("hit"); setTimeout(() => pt.node.classList.remove("hit"), 360); }
        if (pt.hero) { pt.node.classList.add("hero-hit"); setTimeout(() => pt.node.classList.remove("hero-hit"), 420); shakeScreen(); flashScreen("damage"); }
        else if ((ev.amount || 0) >= 4) flashScreen("damage");
      } else if (ev.kind === "armor") {
        if (!app.damageNumbers) continue;
        const pt = eventPoint("hero:" + ev.player);
        showFloatingNumber("+" + (ev.amount || 0) + " 护甲", pt.x, pt.y, "heal");
        flashScreen("armor");
      } else if (ev.kind === "heal") {
        if (!app.damageNumbers) continue;
        const pt = eventPoint(ev.targetUid);
        showFloatingNumber("+" + (ev.amount || 0), pt.x, pt.y, "heal");
        flashScreen("heal");
      } else if (ev.kind === "freeze") {
        document.body.classList.add("freeze-flash");
        setTimeout(() => document.body.classList.remove("freeze-flash"), 380);
        const pt = eventPoint(ev.targetUid);
        showKeywordPop("冻结", pt.x, pt.y, "freeze");
      } else if (ev.kind === "shield") {
        const pt = eventPoint(ev.targetUid);
        showKeywordPop("护幕", pt.x, pt.y, "shield");
      } else if (ev.kind === "poison") {
        const pt = eventPoint(ev.targetUid);
        showKeywordPop("蚀毒", pt.x, pt.y, "poison");
      } else if (ev.kind === "death") {
        showDeathPuff(ev);
      } else if (ev.kind === "deathrattle") {
        const pop = el("div", "deathrattle-pop", "余响 · " + (ev.name || ""));
        document.body.appendChild(pop);
        setTimeout(() => { if (pop.parentNode) pop.parentNode.removeChild(pop); }, 1400);
      }
    }
  }

  function showVeinBanner(text, tone) {
    const b = $("vein-banner");
    if (!b) return;
    b.className = "vein-banner" + (tone ? " " + tone : "");
    b.textContent = text;
    b.classList.remove("show");
    void b.offsetWidth;
    b.classList.add("show");
  }

  function fitHandToWidth() {
    const hand = $("hand");
    if (!hand) return;
    hand.style.setProperty("--hand-zoom", "1");
    const cards = Array.from(hand.querySelectorAll(".hand-card"));
    if (!cards.length) return;
    const available = hand.clientWidth;
    if (!available) return;
    const total = cards.reduce((sum, c) => sum + c.offsetWidth, 0) + (cards.length - 1) * 6;
    const scale = Math.max(0.52, Math.min(1, (available - 2) / Math.max(1, total)));
    hand.style.setProperty("--hand-zoom", scale.toFixed(3));
  }

  function renderHand(player, s) {
    const hand = $("hand");
    clear(hand);
    if (!player) return;
    const previous = Array.isArray(app.lastHandUids) ? app.lastHandUids : null;
    hand.classList.toggle("dense", player.hand.length >= 7);
    const total = player.hand.length;
    for (let i = 0; i < total; i++) {
      const c = player.hand[i];
      const def = D.CARDS[c.cardId];
      const cost = E.getCardCost(s, player, c);
      const card = createHandCard(def, c, player, cost, s);
      const offset = i - (total - 1) / 2;
      const fan = Math.max(-3, Math.min(3, offset * (total >= 6 ? 0.9 : 1.6)));
      card.style.setProperty("--fan", fan.toFixed(2) + "deg");
      if (previous && previous.indexOf(c.uid) < 0) card.classList.add("draw-in");
      hand.appendChild(card);
    }
    app.lastHandUids = player.hand.map((c) => c.uid);
    requestAnimationFrame(() => { fitHandToWidth(); enforceBattleCardPresentation(); });
    if (!player.hand.length) {
      const empty = el("div", "hand-empty", "手牌已空");
      hand.appendChild(empty);
    }
  }

  function enforceBattleCardPresentation() {
    if (!app.game || app.screen !== "game") return;
    document.querySelectorAll(".board-card").forEach((card) => {
      const type = card.querySelector(".card-type-badge");
      if (type) type.style.setProperty("display", "none", "important");
      const art = card.querySelector(".card-art");
      if (art) art.style.setProperty("inset", "0 0 34px 0", "important");
      const name = card.querySelector(".card-name");
      if (name) {
        name.style.setProperty("bottom", "30px", "important");
        name.style.setProperty("font-size", "12px", "important");
      }
      const stats = card.querySelector(".card-stats");
      if (stats) {
        stats.style.setProperty("left", "4px", "important");
        stats.style.setProperty("right", "4px", "important");
        stats.style.setProperty("justify-content", "space-between", "important");
      }
      const tags = card.querySelector(".card-tags");
      if (tags) {
        tags.style.setProperty("top", "27px", "important");
        tags.style.setProperty("left", "3px", "important");
        tags.style.setProperty("right", "auto", "important");
        tags.style.setProperty("transform", "none", "important");
      }
    });
  }

  function appendKeywordText(node, text) {
    if (!text) return;
    const re = /(登场|余响|拦截|突进|冻结|隐匿|采掘|引脉|血祭|沉默|检索|护幕|连动|蚀毒|汲取|袭扰|回潮|反噬|顺势|吞噬)/g;
    let last = 0;
    let m;
    while ((m = re.exec(text)) !== null) {
      if (m.index > last) node.appendChild(document.createTextNode(text.slice(last, m.index)));
      const span = el("span", "kw", m[0]);
      if (["采掘", "引脉"].indexOf(m[0]) >= 0) span.classList.add("vein-kw");
      if (m[0] === "血祭") span.classList.add("danger-kw");
      node.appendChild(span);
      last = m.index + m[0].length;
    }
    if (last < text.length) node.appendChild(document.createTextNode(text.slice(last)));
  }

  const RARITY_NAMES = { common: "普通", rare: "稀有", epic: "史诗", legendary: "传说" };

  const KEYWORD_HELP = {
    "登场": "从手牌打出时触发一次效果。",
    "余响": "该随从死亡时触发一次效果。",
    "拦截": "敌方必须先攻击具有拦截的随从。",
    "突进": "召唤当回合即可攻击。",
    "被动": "无需主动触发，满足条件时自动生效。",
    "冻结": "被冻结的随从暂时不能攻击，持续到其下个回合。",
    "沉默": "移除随从的技能、余响与增益效果。",
    "隐匿": "无法被敌方选为目标，攻击后解除。",
    "引脉": "当共享流脉达到标注阈值时触发；若有多个阈值，只结算其中最高的一个。",
    "检索": "从三张牌中选择一张加入手牌。",
    "采掘": "采掘 X：抽 X 张牌，并使共享流脉 +X。",
    "随从": "场上的单位牌，不包含领袖。",
    "领袖": "玩家操控的单位，拥有领袖技能与被动，不进入抽牌堆。",
    "血祭": "以支付生命为代价打出或触发效果。",
    "吞噬": "吃掉一个友方随从，并获得其攻击力与生命值。",
    "护幕": "抵挡下一次伤害。",
    "连动": "每回合可以攻击两次。",
    "蚀毒": "造成伤害时直接消灭受伤的随从。",
    "汲取": "造成伤害时为你的领袖恢复等量生命。",
    "袭扰": "召唤当回合可以攻击随从，但不能攻击领袖。",
    "回潮": "死亡后以 1 点生命返回战场一次。",
    "反噬": "本牌使用后，下回合行动力减少。",
    "顺势": "本回合打出过其他牌时触发强化效果。",
    "恢复": "恢复生命不能超过生命上限。",
    "获得": "获得生命会同时提高生命上限与当前生命，可以超过原本的生命上限。",
    "阵位": "每个阵位最多容纳 3 个随从，但全场最多 6 个。阵位的数值效果按当前同阵位随从数量即时计算，随从死亡或离开后对应加成会消失。",
    "固定": "固定效果不随条件变化消失，当前和之后以任何方式进入该阵位的随从都会获得。",
    "对位": "双方左/中/右同一列的阵位互相对位。",
    "借脉": "本回合先获得行动力或牌，回合结束时补回流脉。",
    "逆流": "消耗指定数量的流脉来触发；流脉不足时消耗到 0 仍可触发，流脉为 0 时无效。",
    "镇脉": "消耗指定数量的流脉，获得等量护甲；流脉不足时只获得剩余流脉的护甲并把流脉清零。",
    "压脉": "消耗指定数量的流脉，对敌方领袖造成等量伤害；流脉不足时整张牌效果无效。",
    "悬赏": "被列入悬赏名单的敌方随从死亡时，名单主人抽 1 张牌；莫纳克额外获得 1 点护甲。",
    "遗物": "需要从牌库抽到并打出后装备，持续生效，不占用场上阵位；同一时间只能装备一件。",
  };
  const KEYWORD_ICONS = {
    "随从": "summon", "领袖": "passive",
    "登场": "battlecry", "余响": "deathrattle", "拦截": "taunt", "突进": "charge",
    "被动": "passive", "冻结": "freeze", "沉默": "silence", "隐匿": "stealth",
    "引脉": "vein", "检索": "discover", "采掘": "excavate", "血祭": "blood",
    "吞噬": "damage", "阵位": "summon", "遗物": "passive", "对位": "summon", "借脉": "vein", "逆流": "vein", "镇脉": "armor", "压脉": "damage",
    "护幕": "armor", "连动": "charge", "蚀毒": "deathrattle", "汲取": "heal", "袭扰": "charge", "回潮": "passive", "反噬": "summon", "顺势": "damage", "悬赏": "damage",
    "恢复": "heal", "获得": "heart", "固定": "passive"
  };

  let keywordTipTimer = null;
  function positionKeywordTip(e) {
    const tip = $("keyword-tip");
    if (!tip) return;
    const pad = 10;
    const w = 240;
    const h = Math.max(86, tip.offsetHeight || 96);
    const card = e.target && e.target.closest ? e.target.closest(".hand-card, .board-card, .codex-card") : null;
    let x, y;
    if (card) {
      const r = card.getBoundingClientRect();
      x = r.left + r.width / 2 - w / 2;
      y = r.top - h - 10;
      if (y < pad) y = r.bottom + 10;
    } else {
      x = (e.clientX || 0) + 16;
      y = (e.clientY || 0) + 16;
      if (y + h > window.innerHeight - pad) y = (e.clientY || 0) - h - 12;
    }
    x = Math.max(pad, Math.min(window.innerWidth - w - pad, x));
    y = Math.max(pad, Math.min(window.innerHeight - h - pad, y));
    tip.style.left = x + "px";
    tip.style.top = y + "px";
  }

  function showKeywordTip(e, label, autoHide) {
    const text = KEYWORD_HELP[label];
    if (!text) return;
    const tip = $("keyword-tip");
    if (!tip) return;
    clearTimeout(keywordTipTimer);
    tip.innerHTML = "";
    tip.appendChild(el("strong", null, label));
    tip.appendChild(el("span", null, text));
    tip.hidden = false;
    positionKeywordTip(e);
    if (autoHide) keywordTipTimer = setTimeout(hideKeywordTip, 1800);
  }

  function hideKeywordTip() {
    clearTimeout(keywordTipTimer);
    const tip = $("keyword-tip");
    if (tip) tip.hidden = true;
  }

  function effectTags(def) {
    const tags = [];
    if (def.keywords) {
      if (def.keywords.indexOf("battlecry") >= 0) tags.push("✦ 登场");
      if (def.keywords.indexOf("deathrattle") >= 0) tags.push("☠ 余响");
      if (def.keywords.indexOf("taunt") >= 0) tags.push("盾 拦截");
      if (def.keywords.indexOf("charge") >= 0) tags.push("⚔ 突进");
      if (def.keywords.indexOf("divineShield") >= 0) tags.push("护幕");
      if (def.keywords.indexOf("windfury") >= 0) tags.push("连动");
      if (def.keywords.indexOf("poisonous") >= 0) tags.push("蚀毒");
      if (def.keywords.indexOf("lifesteal") >= 0) tags.push("汲取");
      if (def.keywords.indexOf("rush") >= 0) tags.push("袭扰");
      if (def.keywords.indexOf("stealth") >= 0) tags.push("隐匿");
      if (def.keywords.indexOf("reborn") >= 0) tags.push("回潮");
    }
    if (def.excavate) tags.push("采掘");
    if (def.bloodCost) tags.push("血祭");
    if (def.text && def.text.indexOf("引脉") >= 0) tags.push("引脉");
    if (def.text && def.text.indexOf("阵位") >= 0) tags.push("阵位");
    if (def.text && def.text.indexOf("顺势") >= 0 && tags.indexOf("顺势") < 0) tags.push("顺势");
    if (def.text && def.text.indexOf("吞噬") >= 0) tags.push("吞噬");
    if (def.text && def.text.indexOf("对位") >= 0) tags.push("对位");
    if (def.text && def.text.indexOf("借脉") >= 0) tags.push("借脉");
    if (def.text && def.text.indexOf("逆流") >= 0) tags.push("逆流");
    if (def.text && def.text.indexOf("镇脉") >= 0) tags.push("镇脉");
    if (def.text && def.text.indexOf("压脉") >= 0) tags.push("压脉");
    if (def.text && def.text.indexOf("沉默") >= 0 && tags.indexOf("沉默") < 0) tags.push("沉默");
    if (def.text && def.text.indexOf("护幕") >= 0 && tags.indexOf("护幕") < 0) tags.push("护幕");
    if (def.text && def.text.indexOf("蚀毒") >= 0 && tags.indexOf("蚀毒") < 0) tags.push("蚀毒");
    if (def.text && def.text.indexOf("袭扰") >= 0 && tags.indexOf("袭扰") < 0) tags.push("袭扰");
    if (def.text && (def.text.indexOf("悬赏") >= 0 || def.text.indexOf("名单") >= 0) && tags.indexOf("悬赏") < 0) tags.push("悬赏");
    if (def.type === "relic") tags.push("遗物");
    return tags;
  }

  function cardTags(def, m) {
    const tags = effectTags(def).map(t => t.replace(/^[✦☠盾⚔]\s*/, ""));
    if (def.passive) tags.push("被动");
    if (def.battlecry) {
      const bt = def.battlecry.type;
      if (bt === "copyFriendly") tags.push("复制");
      if (bt === "returnToHand") tags.push("回手");
      if (bt === "freezeAllEnemies") tags.push("冻结");
      if (bt === "veinBuff") tags.push("引脉");
      if (bt === "veinDraw") { tags.push("引脉"); tags.push("抽牌"); }
      if (bt === "damageAllEnemies") tags.push("伤害");
      if (bt === "destroy") tags.push("消灭");
      if (bt === "summonTokenBuff") tags.push("召唤");
      if (bt === "buffAllTaunt") tags.push("拦截");
      if (bt === "spellDraw" || bt === "drawSpell" || bt === "drawHandCondition") tags.push("抽牌");
      if (bt === "silenceVeinBuff") { tags.push("沉默"); tags.push("引脉"); }
      if (bt === "buffTauntZone" || bt === "buffIfIronclad") tags.push("拦截");
      if (bt === "healHero" || bt === "healVein") tags.push("恢复");
      if (bt === "healVein") tags.push("引脉");
      if (bt === "spellDiscover") tags.push("检索");
      if (bt === "armor" || bt === "armorPerTaunt") tags.push("护甲");
      if (bt === "veinOnly") tags.push("引脉");
      if (bt === "rampMana") tags.push("行动力");
      if (bt === "discountSpell") tags.push("战术");
      if (bt === "devour") tags.push("吞噬");
      if (bt === "armorDamage") { tags.push("护甲"); tags.push("伤害"); }
      if (bt === "veinBuff") tags.push("引脉");
      if (bt === "silenceDraw") { tags.push("沉默"); tags.push("抽牌"); }
      if (bt === "summonSelfCopy") tags.push("复制");
      if (bt === "damageAllEnemiesDraw") { tags.push("伤害"); tags.push("抽牌"); }
    }
    if (def.overload) tags.push("反噬");
    if (def.spell && def.spell.type === "comboDamage") tags.push("顺势");
    if (def.deathrattle && def.deathrattle.type === "summon") tags.push("召唤");
    if (def.deathrattle && def.deathrattle.type === "damageAllEnemies") tags.push("伤害");
    if (m) {
      if (m.silenced) tags.push("沉默");
      if (m.frozenTurns > 0) tags.push("冻结");
      if (m.stealth) tags.push("隐匿");
      if (m.taunt) tags.push("拦截");
      if (m.charge) tags.push("突进");
    } else if (def.spell) {
      const st = def.spell.type;
      if (st === "silence") tags.push("沉默");
      if (["freeze", "freezeAll", "freezeDraw"].indexOf(st) >= 0) tags.push("冻结");
      if (st === "damage") tags.push("伤害");
      if (["heal", "buffHeal"].indexOf(st) >= 0) tags.push("恢复");
      if (["draw", "drawVein", "bloodDraw", "healDraw", "freezeDraw"].indexOf(st) >= 0) tags.push("抽牌");
      if (st === "discover") tags.push("检索");
      if ([ "summon", "summonMonster" ].indexOf(st) >= 0) tags.push("召唤");
      if (["armor"].indexOf(st) >= 0) tags.push("护甲");
      if (["healDraw"].indexOf(st) >= 0) tags.push("恢复");
      if (["channelVein"].indexOf(st) >= 0) tags.push("引脉");
      if (["freezeDraw"].indexOf(st) >= 0) tags.push("冻结");
      if (["buffTaunt"].indexOf(st) >= 0) tags.push("拦截");
      if (["buffCharge"].indexOf(st) >= 0) tags.push("突进");
      if (st === "gainMana") tags.push("行动力");
      if (st === "damageAllEnemiesDraw") { tags.push("伤害"); tags.push("抽牌"); }
      if (st === "damageAll") tags.push("伤害");
      if (st === "returnAllEnemies") tags.push("回手");
      if (st === "summonTwoTokens") tags.push("召唤");
      if (st === "armorVeinDraw") { tags.push("护甲"); tags.push("引脉"); tags.push("抽牌"); }
      if (st === "damagePerSpell") tags.push("伤害");
      if (st === "damageAllPerSpell") tags.push("伤害");
      if (st === "healVein") { tags.push("恢复"); tags.push("引脉"); }
      if (st === "sacrificeSummon") { tags.push("血祭"); tags.push("召唤"); }
      if (st === "buffAllTaunt") tags.push("拦截");
      if (st === "armorAoe") { tags.push("护甲"); tags.push("伤害"); }
      if (st === "rampSpell") tags.push("行动力");
      if (st === "bloodSummon") { tags.push("血祭"); tags.push("召唤"); }
    }
    return Array.from(new Set(tags));
  }

  function addCardTags(card, def, m, cls) {
    const tags = cardTags(def, m);
    if (!tags.length) return;
    const box = el("div", "card-tags" + (cls ? " " + cls : ""));
    for (const tag of tags) {
      const span = el("span", "keyword-tag");
      span.dataset.tag = tag;
      const iconName = KEYWORD_ICONS[tag];
      if (iconName) {
        const img = el("img", "keyword-tag-icon");
        img.src = "/assets/icons/" + iconName + ".svg";
        img.alt = "";
        span.appendChild(img);
      }
      span.appendChild(el("b", null, tag));
      span.title = KEYWORD_HELP[tag] || tag;
      span.addEventListener("mouseenter", (e) => showKeywordTip(e, tag));
      span.addEventListener("mousemove", positionKeywordTip);
      span.addEventListener("mouseleave", hideKeywordTip);
      span.addEventListener("pointerdown", (e) => { if (e.pointerType === "touch") { e.stopPropagation(); showKeywordTip(e, tag, true); } });
      box.appendChild(span);
    }
    card.appendChild(box);
  }

  function addKeywordChips(box, def, m) {
    const tags = cardTags(def, m);
    if (!tags.length) return;
    const row = el("div", "preview-keywords");
    for (const tag of tags) {
      const chip = el("span", "preview-keyword");
      const iconName = KEYWORD_ICONS[tag];
      if (iconName) {
        const img = el("img", "keyword-tag-icon");
        img.src = "/assets/icons/" + iconName + ".svg";
        img.alt = "";
        chip.appendChild(img);
      }
      chip.appendChild(el("b", null, tag));
      chip.title = KEYWORD_HELP[tag] || tag;
      chip.addEventListener("mouseenter", (e) => showKeywordTip(e, tag));
      chip.addEventListener("mousemove", positionKeywordTip);
      chip.addEventListener("mouseleave", hideKeywordTip);
      chip.addEventListener("pointerdown", (e) => { if (e.pointerType === "touch") { e.stopPropagation(); showKeywordTip(e, tag, true); } });
      row.appendChild(chip);
    }
    box.appendChild(row);
  }

  function openKeywordGlossary() {
    openModal((content) => {
      content.appendChild(el("div", "eyebrow", "ARCHIVE / KEYWORDS"));
      content.appendChild(el("h3", null, "关键词说明"));
      content.appendChild(el("p", null, "把鼠标移到卡牌上的效果标签，也会显示同样的说明。"));
      const grid = el("div", "keyword-glossary");
      for (const [label, desc] of Object.entries(KEYWORD_HELP)) {
        const item = el("div", "keyword-glossary-item");
        const iconName = KEYWORD_ICONS[label];
        if (iconName) {
          const img = el("img", "keyword-glossary-icon");
          img.src = "/assets/icons/" + iconName + ".svg";
          img.alt = "";
          item.appendChild(img);
        }
        const body = el("div", "keyword-glossary-copy");
        body.appendChild(el("strong", null, label));
        body.appendChild(el("span", null, desc));
        item.appendChild(body);
        grid.appendChild(item);
      }
      content.appendChild(grid);
      const actions = el("div", "modal-actions");
      const rulesBtn = el("button", "btn btn-ghost", "游戏规则");
      rulesBtn.onclick = () => { closeModal(true); openRulesScreen(app.screen === "game" ? "game" : "home"); };
      const close = el("button", "btn btn-primary", "返回对局");
      close.onclick = () => closeModal(true);
      actions.appendChild(rulesBtn);
      actions.appendChild(close);
      content.appendChild(actions);
    });
  }

  function renderRulesKeywords() {
    const host = $("rules-keywords");
    if (!host) return;
    clear(host);
    for (const [label, desc] of Object.entries(KEYWORD_HELP)) {
      const item = el("div", "keyword-glossary-item");
      const iconName = KEYWORD_ICONS[label];
      if (iconName) {
        const img = el("img", "keyword-glossary-icon");
        img.src = "/assets/icons/" + iconName + ".svg";
        img.alt = "";
        item.appendChild(img);
      }
      const body = el("div", "keyword-glossary-copy");
      body.appendChild(el("strong", null, label));
      body.appendChild(el("span", null, desc));
      item.appendChild(body);
      host.appendChild(item);
    }
  }

  function openRulesScreen(returnScreen) {
    app.rulesReturn = returnScreen || (app.screen === "game" ? "game" : "home");
    AudioBox.play("ui_open");
    showScreen("rules");
  }

  function closeRulesScreen() {
    const back = app.rulesReturn === "game" && app.game ? "game" : "home";
    AudioBox.play("ui_open");
    showScreen(back);
    if (back === "game") renderGame();
  }

  function createHandCard(def, instance, player, cost, s) {
    const card = buildLibraryCard(def, { variant: "hand", faction: true, cost: cost });
    card.classList.add("hand-card", "type-" + def.type);
    card.dataset.faction = def.faction;
    card.dataset.cardId = def.id;
    card.dataset.type = def.type;
    if (app.selectedCard === instance.uid) card.classList.add("selected");
    const powerTarget = !!(app.targetInfo && app.targetInfo.kind === "heroPower" && targetList().indexOf(instance.uid) >= 0);
    if (powerTarget) card.classList.add("targetable");
    const playable = s.status === "playing" && !s.mulliganPhase && s.current === player.index && player.mana >= cost && !app.busy;
    if (!playable) card.classList.add("disabled");
    attachMobilePreview(card, def, null);
    card.onmouseenter = () => showPreview(def, null);
    card.onmouseleave = hidePreview;
    if (playable) {
      card.draggable = true;
      card.title = def.type === "spell" ? "点击选择目标施放，或直接拖到目标" : def.type === "relic" ? "点击打出遗物" : "点击出牌，或拖到阵位";
      card.addEventListener("dragstart", (ev) => {
        if (!ev.dataTransfer) return;
        app.draggingUid = instance.uid;
        app.suppressClick = Date.now();
        card.classList.add("dragging", "card-dragging");
        setCustomDragImage(ev, def, "card");
        hidePreview();
        if (def.type === "spell") highlightSpellTargets(instance.uid);
        ev.dataTransfer.effectAllowed = "move";
        try { ev.dataTransfer.setData("text/plain", instance.uid); } catch (e) {}
      });
      card.addEventListener("dragend", () => {
        card.classList.remove("dragging", "card-dragging");
        finishCardDrag();
        clearDropHints();
      });
    }
    card.onclick = (ev) => {
      ev.stopPropagation();
      if (app.suppressClick && Date.now() - app.suppressClick < 300) return;
      if (powerTarget) { onTargetClick(instance.uid); return; }
      if ((app.targetInfo && app.targetInfo.kind === "card" && app.targetInfo.cardUid === instance.uid) || (app.zoneSelect && app.zoneSelect.cardUid === instance.uid)) {
        cancelSelection();
        return;
      }
      if (!playable) {
        if (s.current !== player.index) toast("还没轮到你。");
        else if (player.mana < cost) toast("行动力不足。");
        else toast("现在不能打出这张牌。");
        return;
      }
      beginCard(instance.uid);
    };
    return card;
  }

  function canDropCardToZone(zone) {
    if (!app.game || !app.draggingUid) return false;
    if (app.game.status !== "playing" || app.game.current !== app.viewer) return false;
    const p = app.game.players[app.viewer];
    const c = p.hand.find((x) => x.uid === app.draggingUid);
    if (!c) return false;
    const def = D.CARDS[c.cardId];
    if (def.type === "minion") return p.board[zone].length < 3 && p.mana >= E.getCardCost(app.game, p, c);
    if (def.type === "formation") return (p.formations || []).length < 2 && p.mana >= E.getCardCost(app.game, p, c);
    return true;
  }

  function clearDropHints() {
    document.querySelectorAll(".zone.drop-ready").forEach((z) => z.classList.remove("drop-ready"));
  }

  function onDropCardToZone(zone) {
    const cardUid = app.draggingUid;
    app.draggingUid = null;
    app.suppressClick = Date.now();
    clearDropHints();
    if (!cardUid || !app.game || app.game.current !== app.viewer) return;
    const s = app.game;
    const p = s.players[s.current];
    const c = p.hand.find((x) => x.uid === cardUid);
    if (!c) return;
    const def = D.CARDS[c.cardId];
    const opt = E.getPlayOptions(s, s.current, cardUid);
    if (!opt.ok) { toast(opt.reason || "现在不能打出这张牌。"); return; }
    if (def.bloodCost != null) app.payBloodChoice = true;
    if (def.type === "minion" || def.type === "formation") {
      if (opt.targetType && opt.targets.length) {
        app.pendingDragZone = zone;
        app.selectedCard = cardUid;
        app.targetInfo = { kind: "card", cardUid: cardUid, targetType: opt.targetType, targets: opt.targets };
        renderGame();
        return;
      }
      commitPlay(cardUid, null, zone);
    } else {
      app.pendingDragZone = null;
      if (opt.targetType && opt.targets.length) beginCard(cardUid);
      else if (opt.targetType) toast("没有可选的合法目标，无法施放这张法术。");
      else commitPlay(cardUid, null, null);
    }
  }

  function renderControls(viewer, s) {
    const power = $("btn-hero-power");
    const o = E.getHeroPowerOptions(s, app.viewer);
    const icon = viewer.heroId === "lain" ? "协" : viewer.heroId === "karna" ? "血" : viewer.heroId === "marta" ? "演" : viewer.heroId === "wolfram" ? "律" : viewer.heroId === "monarch" ? "悬" : "炮";
    const current = s.current === app.viewer;
    const disabled = !current || s.status !== "playing" || s.mulliganPhase || !o.ok || app.busy || app.modalOpen;
    const actionText = !current ? "等待你的回合" : o.used ? "本回合已用" : (o.targetType === "hand" ? "点击选择一张手牌" : o.targetType === "enemy" ? "点击选择敌方目标" : "点击选择友方目标");
    const stateText = o.used ? "已用" : !current ? "对方回合" : !o.ok ? "不可用" : "可用";
    power.innerHTML = "<span class=\"hp-btn-icon\">" + icon + "<img class=\"hp-skill-icon\" src=\"/assets/icons/hero_power.svg\" alt=\"\"></span><span class=\"hp-btn-copy\"><strong>领袖技能 · " + viewer.hero.power.name + "</strong><small>" + (viewer.hero.power.cost || 2) + " 行动力 · " + actionText + "</small></span><span class=\"hp-btn-state\">" + stateText + "</span>";
    const iconEl = power.querySelector(".hp-btn-icon");
    if (iconEl) iconEl.style.backgroundImage = "linear-gradient(180deg, rgba(5,10,15,0.08), rgba(5,10,15,0.48)), url('" + heroImage(viewer.heroId) + "')";
    power.disabled = disabled;
    power.classList.toggle("ready", !disabled);
    power.classList.toggle("used", !!o.used);
    power.title = viewer.hero.power.text;
    power.onclick = () => {
      if (power.disabled) return;
      app.targetInfo = { kind: "heroPower", targets: o.targets, player: app.viewer };
      app.selectedCard = null;
      app.zoneSelect = null;
      app.attacker = null;
      renderGame();
    };
    const end = $("btn-end-turn");
    end.disabled = !current || s.status !== "playing" || s.mulliganPhase || app.busy || !!app.modalOpen;
    end.textContent = current ? "结束回合" : "对方回合";
    end.classList.toggle("my-phase", current);
    end.classList.toggle("enemy-phase", !current);
    end.onclick = () => endTurn();
  }

  function renderLog(s) {
    const list = $("log-list");
    if (!list) return;
    clear(list);
    const privateTypes = ["draw", "discover", "burn"];
    const entries = s.log.slice(-20).map((entry) => {
      const hidden = entry.player != null && entry.player !== app.viewer && privateTypes.indexOf(entry.type) >= 0;
      if (!hidden) return entry;
      const hiddenText = entry.type === "draw" ? "对手抽了一张牌。" : entry.type === "discover" ? "对手检索了一张牌。" : "对手手牌已满，一张牌被烧掉。";
      return Object.assign({}, entry, { text: hiddenText, hidden: true });
    });
    for (const entry of entries) {
      const row = el("div", "log-entry " + (entry.type || "") + (entry.hidden ? " hidden-info" : ""));
      row.appendChild(el("span", "log-round", "R" + entry.round));
      row.appendChild(document.createTextNode(entry.text));
      const logDef = entry.cardId && D.CARDS[entry.cardId];
      if (logDef) {
        const info = el("button", "log-card-btn", "查看效果");
        info.title = logDef.name + "：\n" + (logDef.text || "—");
        info.onclick = (ev) => { ev.stopPropagation(); openCodexCard(logDef, "关闭"); };
        row.appendChild(info);
      }
      list.appendChild(row);
    }
    list.scrollTop = list.scrollHeight;
    const mini = $("log-mini");
    if (mini) {
      const latest = entries.slice(-2);
      mini.textContent = "";
      mini.appendChild(el("b", null, "日志"));
      mini.appendChild(document.createTextNode(latest.length ? " · " + latest.map(e => "R" + e.round + " " + e.text).join("  ·  ") : " · 等待第一条推演记录…"));
      mini.title = "点击查看完整推演日志";
    }
  }

  function targetList() {
    if (app.targetInfo) return app.targetInfo.targets || [];
    if (app.attacker) {
      const opts = E.getAttackOptions(app.game, app.game.current, app.attacker);
      return opts.ok ? opts.targets : [];
    }
    return [];
  }

  function showFloatingNumber(text, x, y, cls) {
    const n = el("div", "floating-number" + (cls ? " " + cls : ""), text);
    n.style.left = x + "px";
    n.style.top = y + "px";
    document.body.appendChild(n);
    setTimeout(() => { if (n.parentNode) n.parentNode.removeChild(n); }, 1000);
  }

  function capturePlayPoint(zone, targetUid) {
    let node = null;
    if (targetUid && targetUid !== "hero") node = document.querySelector('[data-minion="' + targetUid + '"]');
    else if (zone) {
      const zones = ["left", "center", "right"];
      const list = document.querySelectorAll("#player-board .zone");
      node = list[zones.indexOf(zone)] || null;
    }
    const r = node ? node.getBoundingClientRect() : null;
    return {
      x: r ? r.left + r.width / 2 : window.innerWidth / 2,
      y: r ? r.top + r.height / 2 : window.innerHeight * 0.5
    };
  }

  function showKeywordPop(label, x, y, tone) {
    const pop = el("div", "keyword-pop" + (tone ? " " + tone : ""), label);
    pop.style.left = x + "px";
    pop.style.top = y + "px";
    document.body.appendChild(pop);
    setTimeout(() => { if (pop.parentNode) pop.parentNode.removeChild(pop); }, 900);
  }

  function showPlayArc(def, sourceRect, point) {
    if (!sourceRect) return;
    const ghost = el("div", "play-ghost type-" + def.type);
    ghost.style.width = Math.min(96, sourceRect.width) + "px";
    ghost.style.height = Math.min(132, sourceRect.height) + "px";
    ghost.style.left = sourceRect.left + "px";
    ghost.style.top = sourceRect.top + "px";
    { const url = cardArtUrl(def); if (url) ghost.style.backgroundImage = "url('" + url + "')"; }
    ghost.appendChild(el("span", null, def.name));
    document.body.appendChild(ghost);
    requestAnimationFrame(() => {
      ghost.style.left = (point.x - 28) + "px";
      ghost.style.top = (point.y - 38) + "px";
      ghost.style.transform = "scale(.34) rotate(-8deg)";
      ghost.style.opacity = "0";
    });
    setTimeout(() => { if (ghost.parentNode) ghost.parentNode.removeChild(ghost); }, 480);
  }

  function showPlayFeedback(def, point, sourceRect) {
    showPlayArc(def, sourceRect, point);
    const banner = el("div", "card-play-banner", typeLine(def) + " · " + def.name);
    if (def.type === "spell" && def.text) banner.appendChild(el("div", "play-effect", def.text));
    document.body.appendChild(banner);
    requestAnimationFrame(() => banner.classList.add("show"));
    setTimeout(() => { if (banner.parentNode) banner.parentNode.removeChild(banner); }, def.type === "spell" ? 1900 : 1050);
    const ring = el("div", "cast-ring" + (def.type === "minion" ? " summon-ring" : ""));
    ring.style.left = point.x + "px";
    ring.style.top = point.y + "px";
    document.body.appendChild(ring);
    setTimeout(() => { if (ring.parentNode) ring.parentNode.removeChild(ring); }, 700);
    AudioBox.play(def.type === "spell" ? "wave" : "select");
    playSemanticFx(def, point);
  }

  function playSemanticFx(def, point) {
    if (!def) return;
    const st = def.spell && def.spell.type || "";
    if (def.type === "relic") {
      flashScreen("relic");
      const burst = el("div", "relic-burst");
      burst.style.left = point.x + "px";
      burst.style.top = point.y + "px";
      document.body.appendChild(burst);
      setTimeout(() => { if (burst.parentNode) burst.parentNode.removeChild(burst); }, 900);
      const hero = document.getElementById("player-hero");
      if (hero) { hero.classList.add("relic-equipped"); setTimeout(() => hero.classList.remove("relic-equipped"), 900); }
      return;
    }
    if (st.indexOf("freeze") >= 0) { flashScreen("freeze"); return; }
    if (st.indexOf("blood") >= 0 || def.bloodCost != null) { flashScreen("blood"); return; }
    if (st.indexOf("heal") >= 0 || st.indexOf("Vein") >= 0) { flashScreen("heal"); return; }
    if (st.indexOf("armor") >= 0) { flashScreen("armor"); return; }
    if (st.indexOf("damage") >= 0 || st.indexOf("destroy") >= 0) { flashScreen("damage"); return; }
    if (st.indexOf("draw") >= 0 || st.indexOf("discover") >= 0) { flashScreen("draw"); }
  }

  function showAbilityFeedback(name, point) {
    const banner = el("div", "card-play-banner", "领袖技能 · " + name);
    document.body.appendChild(banner);
    requestAnimationFrame(() => banner.classList.add("show"));
    setTimeout(() => { if (banner.parentNode) banner.parentNode.removeChild(banner); }, 1050);
    const ring = el("div", "cast-ring summon-ring");
    ring.style.left = point.x + "px";
    ring.style.top = point.y + "px";
    document.body.appendChild(ring);
    setTimeout(() => { if (ring.parentNode) ring.parentNode.removeChild(ring); }, 700);
    AudioBox.play("coin");
  }

  function showImpact(x, y) {
    const n = el("div", "impact-flash");
    n.style.left = x + "px";
    n.style.top = y + "px";
    document.body.appendChild(n);
    setTimeout(() => { if (n.parentNode) n.parentNode.removeChild(n); }, 480);
  }

  function shakeScreen() {
    if (!app.screenShake) return;
    const shell = document.querySelector(".game-shell");
    if (!shell) return;
    shell.classList.remove("screen-shake");
    void shell.offsetWidth;
    shell.classList.add("screen-shake");
    setTimeout(() => shell.classList.remove("screen-shake"), 320);
  }

  function showTurnBanner(text) {
    const banner = $("turn-banner");
    if (!banner) return;
    banner.textContent = text;
    banner.classList.remove("show");
    void banner.offsetWidth;
    banner.classList.add("show");
  }

  function showTurnOrderIntro(state, done) {
    const human = app.human == null ? 0 : app.human;
    const firstIndex = state.current;
    const sides = [0, 1].map((i) => {
      const p = state.players[i];
      const first = i === firstIndex;
      const isHuman = i === human;
      const side = el("div", "turn-order-side " + (first ? "first" : "second") + (isHuman ? " human" : " enemy"));
      const art = el("div", "turn-order-art");
      if (p && p.heroId) art.style.backgroundImage = "url('" + portraitImage(p.heroId) + "')";
      side.appendChild(art);
      side.appendChild(el("div", "turn-order-role", first ? "先手" : "后手"));
      side.appendChild(el("div", "turn-order-name", isHuman ? "你" : (p ? p.name : "对手")));
      if (p) side.appendChild(el("div", "turn-order-faction", factionName(p.faction)));
      return side;
    });
    const overlay = el("div", "turn-order-intro");
    const panel = el("div", "turn-order-panel");
    panel.appendChild(el("div", "eyebrow", "TURN ORDER / 流脉判定"));
    panel.appendChild(el("h2", null, "谁先落子？"));
    const row = el("div", "turn-order-row");
    row.appendChild(sides[0]);
    const center = el("div", "turn-order-center");
    center.appendChild(el("div", "turn-order-rune"));
    center.appendChild(el("span", null, "判定"));
    row.appendChild(center);
    row.appendChild(sides[1]);
    panel.appendChild(row);
    const result = el("div", "turn-order-result", (firstIndex === human ? "你先手 · 后手是" + state.players[1 - human].name : "对手先手 · 你是后手"));
    panel.appendChild(result);
    const btn = el("button", "btn btn-primary turn-order-start", "开始对局");
    btn.onclick = () => finish();
    panel.appendChild(btn);
    overlay.appendChild(panel);
    document.body.appendChild(overlay);
    app.introActive = true;
    requestAnimationFrame(() => overlay.classList.add("in"));
    const revealTimer = setTimeout(() => {
      overlay.classList.add("revealed");
      AudioBox.play("coin");
    }, 650);
    const finish = () => {
      if (!app.introActive) return;
      app.introActive = false;
      clearTimeout(autoTimer);
      clearTimeout(revealTimer);
      overlay.classList.add("out");
      overlay.style.pointerEvents = "none";
      overlay.style.visibility = "hidden";
      setTimeout(() => { const parent = overlay.parentNode; if (parent) parent.removeChild(overlay); done(); }, 300);
    };
    const autoTimer = setTimeout(finish, 3900);
  }

  function showAttackLine(ax, ay, bx, by) {
    const distance = Math.sqrt((bx - ax) * (bx - ax) + (by - ay) * (by - ay));
    const angle = Math.atan2(by - ay, bx - ax) * 180 / Math.PI;
    const line = el("div", "attack-overlay-line");
    line.style.left = ax + "px";
    line.style.top = ay + "px";
    line.style.width = distance + "px";
    line.style.transform = "rotate(" + angle + "deg)";
    document.body.appendChild(line);
    setTimeout(() => { if (line.parentNode) line.parentNode.removeChild(line); }, 420);
  }

  function animateAttack(attackerUid, targetUid, attackerOwner, done) {
    if (app.animating || !app.game) return;
    const s = app.game;
    const attacker = E.findMinion(s, attackerUid);
    if (!attacker) { if (done) done({ ok: false, reason: "攻击者已不在场" }); return; }
    const damage = attacker.attack;
    const targetMinion = targetUid === "hero" ? null : E.findMinion(s, targetUid);
    const counterDamage = targetMinion ? targetMinion.attack : 0;
    const attackerElBefore = document.querySelector('.board-card[data-minion="' + attackerUid + '"]');
    const attackerRect = attackerElBefore ? attackerElBefore.getBoundingClientRect() : null;
    const targetHeroId = attackerOwner === app.viewer ? "opponent-hero" : "player-hero";
    const targetElBefore = targetUid === "hero"
      ? document.getElementById(targetHeroId)
      : document.querySelector('.board-card[data-minion="' + targetUid + '"]');
    const rect = targetElBefore ? targetElBefore.getBoundingClientRect() : { left: innerWidth / 2, top: innerHeight / 2, width: 0, height: 0 };
    app.animating = true;
    app.busy = true;
    app.attacker = null;
    app.targetInfo = null;
    renderGame();
    const attackerEl = document.querySelector('.board-card[data-minion="' + attackerUid + '"]');
    const targetEl = targetUid === "hero"
      ? document.getElementById(targetHeroId)
      : document.querySelector('.board-card[data-minion="' + targetUid + '"]');
    if (attackerEl) attackerEl.classList.add(attackerOwner === app.viewer ? "attack-up" : "attack-down");
    if (targetEl) setTimeout(() => targetEl.classList.add("hit"), 100);
    if (targetMinion && targetMinion.taunt) setTimeout(() => showKeywordPop("拦截", rect.left + rect.width / 2, rect.top + rect.height / 2, ""), 110);
    if (targetMinion && targetMinion.divineShield) setTimeout(() => showKeywordPop("护幕", rect.left + rect.width / 2, rect.top + rect.height / 2, "shield"), 150);
    if (attacker.poisonous) setTimeout(() => showKeywordPop("蚀毒", rect.left + rect.width / 2, rect.top + rect.height / 2, "poison"), 190);
    if (attacker.lifesteal) setTimeout(() => showKeywordPop("汲取", rect.left + rect.width / 2, rect.top + rect.height / 2, "heal"), 190);
    if (attackerRect) {
      const ax = attackerRect.left + attackerRect.width / 2;
      const ay = attackerRect.top + attackerRect.height / 2;
      const bx = rect.left + rect.width / 2;
      const by = rect.top + rect.height / 2;
      setTimeout(() => showAttackLine(ax, ay, bx, by), 80);
      setTimeout(() => showImpact((ax + bx) / 2, (ay + by) / 2), 160);
    }
    setTimeout(() => showImpact(rect.left + rect.width / 2, rect.top + rect.height / 2), 210);
    AudioBox.play("battle");
    setTimeout(() => {
      const r = E.attack(s, attackerOwner, attackerUid, targetUid);
      app.animating = false;
      app.busy = false;
      renderGame();
      if (r.ok) {
        showFloatingNumber("-" + damage, rect.left + rect.width / 2, rect.top + rect.height / 2, "damage");
        if (counterDamage > 0 && attackerRect) {
          showFloatingNumber("-" + counterDamage, attackerRect.left + attackerRect.width / 2, attackerRect.top + attackerRect.height / 2, "damage");
        }
        shakeScreen();
      } else {
        toast(r.reason || "攻击失败。");
      }
      if (done) done(r);
    }, 390);
  }

  function onTargetClick(uid) {
    if (!app.game || app.game.status !== "playing") return;
    if (app.targetInfo && app.targetInfo.kind === "heroPower") {
      if (app.net && app.net.role === "guest") {
        app.targetInfo = null;
        guestSendAction({ kind: "heroPower", targetUid: uid });
        return;
      }
      const abilityPoint = capturePlayPoint(null, uid === "hero" ? null : uid);
      const r = E.useHeroPower(app.game, app.game.current, uid);
      app.targetInfo = null;
      if (!r.ok) toast(r.reason || "无法使用领袖技能。");
      else showAbilityFeedback(app.game.players[app.game.current].hero.power.name, abilityPoint);
      renderGame();
      if (checkGameOverAfterAction()) return;
      if (app.game.current === app.aiPlayer) beginAiTurn();
      return;
    }
    if (app.targetInfo && app.targetInfo.kind === "card") {
      const cardUid = app.targetInfo.cardUid;
      app.targetInfo = null;
      app.selectedCard = cardUid;
      const card = app.game.players[app.game.current].hand.find((c) => c.uid === cardUid);
      if (!card) return;
      const def = D.CARDS[card.cardId];
      if (def.type === "minion") {
        if (app.pendingDragZone) {
          const z = app.pendingDragZone;
          app.pendingDragZone = null;
          commitPlay(cardUid, uid, z);
        } else {
          app.zoneSelect = { cardUid: cardUid, targetUid: uid };
          renderGame();
        }
      } else {
        commitPlay(cardUid, uid, null);
      }
      return;
    }
    if (app.attacker) {
      const attacker = app.attacker;
      app.attacker = null;
      if (app.net && app.net.role === "guest") {
        guestAnimateAttack(attacker, uid);
        return;
      }
      animateAttack(attacker, uid, app.game.current, () => {
        checkGameOverAfterAction();
      });
    }
  }

  function onZoneClick(zone) {
    if (!app.zoneSelect) return;
    const cardUid = app.zoneSelect.cardUid;
    const targetUid = app.zoneSelect.targetUid || null;
    app.zoneSelect = null;
    commitPlay(cardUid, targetUid, zone);
  }

  /* ===== card play ===== */
  function beginCard(cardUid) {
    if (!app.game || app.game.status !== "playing") return;
    if (app.busy || app.modalOpen) return;
    const s = app.game;
    if (s.current !== app.viewer) { toast("还没轮到你。"); return; }
    const player = s.players[s.current];
    const card = player.hand.find((c) => c.uid === cardUid);
    if (!card) return;
    const def = D.CARDS[card.cardId];
    const opt = E.getPlayOptions(s, s.current, cardUid);
    if (!opt.ok) { toast(opt.reason || "现在不能打出这张牌。"); return; }
    if (def.bloodCost != null) app.payBloodChoice = true;
    app.targetInfo = null;
    app.zoneSelect = null;
    app.attacker = null;
    app.selectedCard = cardUid;
    if ((def.type === "minion" || def.type === "formation") && app.pendingDragZone && !opt.targetType) {
      const z = app.pendingDragZone;
      app.pendingDragZone = null;
      commitPlay(cardUid, null, z);
      return;
    }
    if (opt.targetType) {
      if (!opt.targets.length) {
        if (def.optionalTarget) {
          if (def.type === "minion" || def.type === "formation") {
            app.zoneSelect = { cardUid: cardUid, targetUid: null };
            renderGame();
          } else {
            app.pendingDragZone = null;
            commitPlay(cardUid, null, null);
          }
          return;
        }
        if (opt.targetType === "friendly") {
          if (def.type === "minion" || def.type === "formation") {
            app.zoneSelect = { cardUid: cardUid, targetUid: null };
            renderGame();
          } else {
            app.selectedCard = null;
            toast("没有可选的友方目标，无法施放这张法术。");
            renderGame();
          }
          return;
        }
        app.selectedCard = null;
        toast("没有合法目标。");
        renderGame();
        return;
      }
      app.targetInfo = { kind: "card", cardUid: cardUid, targetType: opt.targetType, targets: opt.targets };
      renderGame();
      return;
    }
    app.pendingDragZone = null;
    if (def.type === "minion" || def.type === "formation") {
      if (!opt.zones || !opt.zones.length) { toast(def.type === "formation" ? "阵型槽已满。" : "随从区已满。"); return; }
      app.zoneSelect = { cardUid: cardUid, targetUid: null };
      renderGame();
      return;
    }
    commitPlay(cardUid, null, null);
  }

  function commitPlay(cardUid, targetUid, zone, targetUid2) {
    const s = app.game;
    if (!s) return;
    const player = s.players[s.current];
    const handCard = player && player.hand.find((c) => c.uid === cardUid);
    if (!handCard) { app.pendingDragZone = null; toast("这张牌已经不在手牌中。"); renderGame(); return; }
    const def = D.CARDS[handCard.cardId];
    const opt = E.getPlayOptions(s, s.current, cardUid);
    if (!opt.ok) { app.pendingDragZone = null; toast(opt.reason || "现在不能打出这张牌。"); renderGame(); return; }
    if (def.type === "minion" && (!zone || opt.zones.indexOf(zone) < 0)) {
      app.pendingDragZone = null;
      toast("这个阵位已满，请换一个阵位。");
      renderGame();
      return;
    }
    if (opt.targetType) {
      if (def.type === "spell" && !targetUid && opt.targets.length === 0) {
        app.pendingDragZone = null;
        toast("没有可选的合法目标，无法施放这张法术。");
        renderGame();
        return;
      }
      if (targetUid && opt.targets.indexOf(targetUid) < 0) {
        app.pendingDragZone = null;
        toast("目标已失效，请重新选择。");
        renderGame();
        return;
      }
      if (!targetUid && opt.targets.length > 0) {
        app.pendingDragZone = null;
        toast("请先选择目标。");
        renderGame();
        return;
      }
      if (!targetUid && opt.targets.length === 0 && opt.targetType !== "friendly" && !def.optionalTarget) {
        app.pendingDragZone = null;
        toast("没有合法目标。");
        renderGame();
        return;
      }
    }
    if (def.target2 && (opt.target2Targets || []).length && !targetUid2) {
      const secondTargets = opt.target2Targets.map(uid => E.findMinion(s, uid)).filter(Boolean);
      app.pendingDragZone = null;
      openModal((content) => {
        content.appendChild(el("div", "eyebrow", "SECOND TARGET"));
        content.appendChild(el("h3", null, "选择第二个目标"));
        content.appendChild(el("p", null, "这张牌还需要选择一个目标。"));
        const actions = el("div", "modal-actions");
        for (const m of secondTargets) {
          const b = el("button", "btn btn-small", m.name + "（" + E.ZONE_NAMES[m.zone] + "）");
          b.onclick = () => { closeModal(true); commitPlay(cardUid, targetUid, zone, m.uid); };
          actions.appendChild(b);
        }
        content.appendChild(actions);
      });
      return;
    }
    app.pendingDragZone = null;
    const playPoint = capturePlayPoint(zone, targetUid);
    const sourceEl = document.querySelector(".hand-card.selected");
    const sourceRect = sourceEl ? sourceEl.getBoundingClientRect() : null;
    if (app.net && app.net.role === "guest") {
      guestSendAction({
        kind: "play",
        cardUid: cardUid,
        targetUid: targetUid || null,
        targetUid2: targetUid2 || null,
        zone: zone || null,
        payBlood: app.payBloodChoice === true
      });
      app.payBloodChoice = null;
      app.pendingBloodCard = null;
      app.selectedCard = null;
      app.targetInfo = null;
      app.zoneSelect = null;
      app.attacker = null;
      showPlayFeedback(def, playPoint, sourceRect);
      renderGame();
      return;
    }
    const result = E.playCard(s, s.current, cardUid, {
      targetUid: targetUid || null,
      targetUid2: targetUid2 || null,
      zone: zone || null,
      payBlood: app.payBloodChoice === true
    });
    app.payBloodChoice = null;
    app.pendingBloodCard = null;
    app.selectedCard = null;
    app.targetInfo = null;
    app.zoneSelect = null;
    app.attacker = null;
    if (!result.ok) {
      toast(result.reason || "无法打出。");
      AudioBox.play("error");
      renderGame();
      return;
    }
    showPlayFeedback(def, playPoint, sourceRect);
    renderGame();
    if (s.pendingChoice) showDiscover();
    if (checkGameOverAfterAction()) return;
  }

  function endTurn() {
    if (!app.game || app.game.status !== "playing" || app.busy) return;
    if (app.game.current !== app.viewer) return;
    if (app.net && app.net.role === "guest") {
      app.selectedCard = null;
      app.targetInfo = null;
      app.zoneSelect = null;
      app.attacker = null;
      app.payBloodChoice = null;
      guestSendAction({ kind: "end" });
      return;
    }
    app.selectedCard = null;
    app.targetInfo = null;
    app.zoneSelect = null;
    app.attacker = null;
    app.payBloodChoice = null;
    const r = E.endTurn(app.game, app.game.current);
    if (app.game.pendingChoice) {
      renderGame();
      showDiscover();
      return;
    }
    AudioBox.play("end_turn");
    showTurnBanner("回合结束");
    renderGame();
    if (checkGameOverAfterAction()) return;
    if (app.local) {
      showHandoff(app.game.current, false);
    } else if (app.game.current === app.aiPlayer) {
      beginAiTurn();
    } else if (app.game.current === app.viewer) {
      toast("你的回合。");
    }
  }

  function checkGameOverAfterAction() {
    if (!app.game) return false;
    if (app.game.status === "gameover") {
      app.busy = true;
      app.aiRunning = false;
      renderGame();
      showEnd();
      return true;
    }
    return false;
  }

  /* ===== AI ===== */
  function aiDelay(base) {
    const factor = app.aiSpeed === "slow" ? 1.7 : app.aiSpeed === "fast" ? 0.65 : 1;
    return Math.round(base * factor);
  }

  function beginAiTurn() {
    if (!app.game || !app.aiPlayer || app.game.status !== "playing") return;
    if (app.game.current !== app.aiPlayer) return;
    if (app.aiRunning) return;
    app.aiRunning = true;
    app.busy = true;
    app.currentHint = "对手正在推演…";
    renderGame();
    setTimeout(aiStep, aiDelay(1000));
  }

  function aiStep() {
    if (app.modalOpen) { setTimeout(aiStep, 300); return; }
    if (!app.game || app.game.status !== "playing") { app.aiRunning = false; app.busy = false; return; }
    if (app.game.current !== app.aiPlayer) {
      app.aiRunning = false;
      app.busy = false;
      renderGame();
      return;
    }
    const action = AI.chooseAction(app.game, app.aiPlayer);
    if (action && action.type === "attack") {
      animateAttack(action.attackerUid, action.targetUid, app.aiPlayer, () => afterAiAction());
      return;
    }
    AI.takeAction(app.game, app.aiPlayer);
    afterAiAction();
  }

  function afterAiAction() {
    if (!app.game) return;
    if (checkGameOverAfterAction()) { app.aiRunning = false; return; }
    if (app.game.status === "playing" && app.game.current === app.aiPlayer) {
      renderGame();
      setTimeout(aiStep, aiDelay(1000));
    } else if (app.game.status === "playing") {
      app.aiRunning = false;
      app.busy = false;
      app.currentHint = "";
      renderGame();
      AudioBox.play("select");
      showTurnBanner("你的回合");
      toast("你的回合。");
    } else {
      app.aiRunning = false;
      app.busy = false;
      renderGame();
    }
  }

  /* ===== local handoff ===== */
  function showHandoff(playerIndex, initial) {
    const s = app.game;
    if (!s) return;
    const p = s.players[playerIndex];
    app.busy = true;
    openModal((content) => {
      content.classList.add("handoff-modal");
      const portrait = el("div", "handoff-portrait");
      portrait.style.backgroundImage = "url('" + heroImage(p.heroId) + "')";
      content.appendChild(el("div", "eyebrow", initial ? "ARCHIVE HANDOFF / START" : "ARCHIVE HANDOFF / NEXT TURN"));
      content.appendChild(portrait);
      content.appendChild(el("h3", null, p.name));
      content.appendChild(el("p", null, initial ? "请将设备交给 " + p.name + "，确认后开始推演。" : "请将设备交给 " + p.name + "，确认后继续。"));
      const btn = el("button", "btn btn-primary", "我准备好了");
      btn.onclick = () => {
        closeModal(true);
        app.busy = false;
        app.currentHint = "";
        renderGame();
        AudioBox.play("ui_open");
        if (!app.local && s.current === app.aiPlayer) beginAiTurn();
      };
      content.appendChild(btn);
    });
  }

  /* ===== modal ===== */
  function openModal(builder) {
    closeModal(true);
    app.modalOpen = true;
    const root = $("modal-root");
    const backdrop = el("div", "modal-backdrop");
    const modal = el("div", "modal");
    backdrop.appendChild(modal);
    root.appendChild(backdrop);
    builder(modal);
    return { backdrop: backdrop, modal: modal };
  }
  function closeModal(force) {
    if (!app.modalOpen && !force) return;
    const root = $("modal-root");
    if (root) clear(root);
    app.modalOpen = false;
  }

  function showBloodModal(cardUid, amount) {
    app.pendingBloodCard = cardUid;
    openModal((content) => {
      content.appendChild(el("div", "eyebrow", "BLOOD OFFERING"));
      content.appendChild(el("h3", null, "是否支付血祭？"));
      content.appendChild(el("p", null, "支付 " + amount + " 点生命，触发这张牌的额外效果。生命不足或会降到 0 时不能支付。"));
      const actions = el("div", "modal-actions");
      const no = el("button", "btn btn-ghost", "不支付");
      no.onclick = () => {
        closeModal(true);
        app.payBloodChoice = false;
        beginCard(cardUid);
      };
      const yes = el("button", "btn btn-primary", "支付 " + amount + " 点生命");
      yes.onclick = () => {
        if (app.game.players[app.game.current].hp <= amount) { toast("生命不足。"); return; }
        closeModal(true);
        app.payBloodChoice = true;
        AudioBox.play("battle");
        beginCard(cardUid);
      };
      actions.appendChild(no);
      actions.appendChild(yes);
      content.appendChild(actions);
    });
  }

  function showDiscover() {
    const s = app.game;
    if (!s || !s.pendingChoice || s.pendingChoice.type !== "discover") return;
    if (s.pendingChoice.player !== app.viewer) return;
    app.busy = true;
    const options = s.pendingChoice.options.slice();
    openModal((content) => {
      content.appendChild(el("div", "eyebrow", "DISCOVER / ARCHIVE"));
      content.appendChild(el("h3", null, "从档案中选择一张牌"));
      content.appendChild(el("p", null, "选择一张置入手牌。"));
      const grid = el("div", "discover-grid");
      for (const id of options) {
        const def = D.CARDS[id];
        const card = el("div", "choice-card discover-card");
        const art = el("div", "preview-art");
        if (def.art) art.style.backgroundImage = "url('" + portraitImage(def.art) + "')";
        else {
          art.classList.add("placeholder", "generic-art");
          art.style.backgroundImage = genericArtStyle(def);
          art.dataset.icon = def.type === "spell" ? "术" : factionIcon(def.faction);
          addGenericGlyph(art, def);
          addGeneratedArt(art, def);
        }
        card.appendChild(art);
        card.appendChild(el("strong", null, def.name));
        card.appendChild(el("small", null, (def.type === "spell" ? "法术 · " : "随从 · ") + def.cost + " 费" + (def.type === "minion" ? " · " + def.attack + "/" + def.health : "")));
        const txt = el("p", null, def.text || "—");
        card.appendChild(txt);
        card.onclick = () => {
          if (app.net && app.net.role === "guest") {
            closeModal(true);
            guestSendAction({ kind: "discover", cardId: id });
            return;
          }
          const r = E.resolveDiscover(s, s.pendingChoice.player, id);
          closeModal(true);
          app.busy = false;
          if (!r.ok) toast(r.reason || "选择失败。");
          else AudioBox.play("select");
          renderGame();
          if (s.pendingChoice) showDiscover();
          else if (checkGameOverAfterAction()) return;
        };
        grid.appendChild(card);
      }
      content.appendChild(grid);
    });
  }

  function toggleGameLog(force) {
    app.logOpen = force == null ? !app.logOpen : !!force;
    const panel = $("log-panel");
    if (panel) panel.classList.toggle("open", app.logOpen);
  }

  function openGameSettings() {
    openModal((content) => {
      content.classList.add("game-settings-modal");
      content.appendChild(el("div", "eyebrow", "PAUSE / SETTINGS"));
      content.appendChild(el("h3", null, "对局设置"));
      content.appendChild(el("p", "muted", "声音、背景音效与认输入口。关闭后继续当前对局。"));
      const rows = el("div", "game-settings-rows");
      const sound = el("button", "btn btn-small btn-ghost", "声音：" + (app.audioOn ? "开" : "关"));
      sound.onclick = () => { AudioBox.toggle(); sound.textContent = "声音：" + (app.audioOn ? "开" : "关"); };
      rows.appendChild(sound);
      const bgm = el("button", "btn btn-small btn-ghost", "背景音乐：" + (app.bgmOn ? "开" : "关"));
      bgm.onclick = () => { AudioBox.toggleBgm(); bgm.textContent = "背景音乐：" + (app.bgmOn ? "开" : "关"); };
      rows.appendChild(bgm);
      const sfx = el("button", "btn btn-small btn-ghost", "战斗音效：" + (app.sfxOn ? "开" : "关"));
      sfx.onclick = () => { AudioBox.toggleSfx(); sfx.textContent = "战斗音效：" + (app.sfxOn ? "开" : "关"); };
      rows.appendChild(sfx);
      content.appendChild(rows);
      const actions = el("div", "modal-actions");
      const concede = el("button", "btn btn-small btn-ghost game-concede-btn", "认输");
      concede.onclick = () => { closeModal(true); confirmConcede(); };
      actions.appendChild(concede);
      const close = el("button", "btn btn-primary", "返回对局");
      close.onclick = () => closeModal(true);
      actions.appendChild(close);
      content.appendChild(actions);
    });
  }

  function confirmConcede() {
    if (!app.game || app.game.status !== "playing") return;
    openModal((content) => {
      content.appendChild(el("div", "eyebrow", "ARCHIVE / CONCEDE"));
      content.appendChild(el("h3", null, "确认认输？"));
      content.appendChild(el("p", null, "当前对局会立即结束，并记录为败北。"));
      const actions = el("div", "modal-actions");
      const yes = el("button", "btn btn-primary", "确认认输");
      yes.onclick = () => { closeModal(true); doConcede(); };
      const no = el("button", "btn btn-ghost", "继续对局");
      no.onclick = () => closeModal(true);
      actions.appendChild(no);
      actions.appendChild(yes);
      content.appendChild(actions);
    });
  }

  function doConcede() {
    const s = app.game;
    if (!s || s.status !== "playing") return;
    if (app.net && app.net.role === "guest") {
      guestSendAction({ kind: "surrender" });
      toast("已发送认输。");
      return;
    }
    if (app.net && app.net.role === "host") {
      s.status = "gameover";
      s.winner = 1;
      sendNet({ type: "state", state: redactStateForGuest(s) });
      renderGame();
      showEnd();
      return;
    }
    s.status = "gameover";
    s.winner = 1 - (app.local ? s.current : app.human);
    s.stats.result = s.winner === app.human ? "win" : "loss";
    renderGame();
    showEnd();
  }

  function showEnd() {
    const s = app.game;
    if (!s) return;
    if (app.modalOpen || app.endCGPending) return;
    const classicOrStory = !app.contentRun || (app.contentRun && app.contentRun.mode === "story");
    if (!app.endCGPlayed && s.winner != null && !app.tutorial && classicOrStory && global.GokCinema) {
      app.endCGPlayed = true;
      app.endCGPending = true;
      app.busy = true;
      app.aiRunning = false;
      const win = s.winner === app.human;
      global.GokCinema.play(win ? "victory.mp4" : "defeat.mp4", {
        eyebrow: "SETTLEMENT · " + (win ? "VICTORY" : "DEFEAT"),
        title: win ? "推演胜利" : "推演败北",
        text: win ? "档案记下这一局：流脉站在你这边。" : "档案合上了这一页，但地脉仍在流动。"
      }).then(() => {
        app.endCGPending = false;
        if (app.game === s) openEndModal();
      });
      return;
    }
    openEndModal();
  }

  function openEndModal() {
    const s = app.game;
    if (!s) return;
    app.busy = true;
    app.aiRunning = false;
    recordGameProfile();
    recordGameAchievements();
    const unlocked = (app.settlementAchievements || []).map(id => ACHIEVEMENTS.find(a => a.id === id)).filter(Boolean);
    AudioBox.play("victory");
    openModal((content) => {
      content.classList.add("end-modal");
      content.appendChild(el("div", "eyebrow", "ARCHIVE / SETTLEMENT"));
      const art = el("div", "end-art");
      const focusPlayer = s.winner != null ? s.players[s.winner] : s.players[app.human];
      art.style.backgroundImage = "linear-gradient(90deg, rgba(4,9,14,0.08), rgba(4,9,14,0.78)), url('" + portraitImage(focusPlayer.heroId) + "')";
      const artCrest = el("img", "end-crest");
      artCrest.src = D.FACTIONS[focusPlayer.faction].emblem;
      artCrest.alt = "";
      art.appendChild(artCrest);
      content.appendChild(art);
      const win = s.winner === app.human;
      const draw = s.winner == null;
      content.appendChild(el("div", "end-result " + (win ? "win" : draw ? "draw" : "lose"), win ? "推演胜利" : draw ? "推演平局" : "推演败北"));
      let title = "未分胜负";
      if (s.winner != null) title = s.players[s.winner].name + " 获胜";
      content.appendChild(el("div", "end-winner", title));
      content.appendChild(el("div", "end-sub", "本次推演未写入正史。"));
      const stats = el("div", "end-stats");
      const items = [
        ["轮数", s.round],
        ["流脉峰值", s.stats.veinPeak],
        ["4 / 7 / 10", (s.stats.thresholds[4] || 0) + " / " + (s.stats.thresholds[7] || 0) + " / " + (s.stats.thresholds[10] || 0)],
        ["召唤随从", s.stats.minionsSummoned],
        ["阵亡随从", s.stats.minionsDied],
        ["剩余手牌", s.players[app.human].hand.length]
      ];
      for (const pair of items) {
        const box = el("div", "end-stat");
        box.appendChild(el("span", null, pair[0]));
        box.appendChild(el("strong", null, String(pair[1])));
        stats.appendChild(box);
      }
      content.appendChild(stats);
      if (s.ranked && app.rankChange) {
        const rc = app.rankChange;
        const rankBox = el("div", "end-rank");
        rankBox.appendChild(el("span", "panel-label", "排位结算"));
        rankBox.appendChild(el("strong", null, rankText(rc.after)));
        const delta = el("span", "end-rank-delta " + (rc.delta > 0 ? "up" : rc.delta < 0 ? "down" : "flat"), (rc.delta > 0 ? "+" : "") + rc.delta + " 分");
        rankBox.appendChild(delta);
        if (rc.beforeTier !== rc.afterTier) rankBox.appendChild(el("small", null, rc.beforeTier + " → " + rc.afterTier));
        content.appendChild(rankBox);
      }
      const achBox = el("div", "end-achievements");
      achBox.appendChild(el("div", "panel-label", "本局档案记录"));
      if (unlocked.length) {
        for (const a of unlocked) {
          const line = el("div", "end-achievement");
          line.appendChild(el("span", null, a.icon));
          line.appendChild(el("strong", null, a.name));
          line.appendChild(el("small", null, a.desc));
          achBox.appendChild(line);
        }
      } else {
        achBox.appendChild(el("p", "muted", "本局没有新的成就记录。"));
      }
      content.appendChild(achBox);
      const actions = el("div", "modal-actions");
      if (app.contentRun && global.GokContent && typeof global.GokContent.afterGame === "function") {
        const contentBtn = el("button", "btn btn-primary", "返回" + (app.contentRun.label || "模式"));
        contentBtn.onclick = () => { closeModal(true); const s2 = app.game; global.GokContent.afterGame(s2); };
        actions.appendChild(contentBtn);
      }
      const isContent = !!app.contentRun;
      const again = isContent ? null : el("button", "btn btn-primary", app.net ? "返回局域网" : "再演一局");
      if (again) again.onclick = () => {
        closeModal(true);
        if (app.net) {
          stopNet(true);
          app.game = null;
          showScreen("lan");
          initLanScreen();
        } else if (app.lastConfig) {
          startGame(app.lastConfig);
        }
      };
      const record = isContent ? null : el("button", "btn btn-ghost", "查看成就");
      if (record) record.onclick = () => { closeModal(true); app.game = null; app.tutorial = false; openAchievements(); };
      const home = el("button", "btn btn-ghost", "返回档案处");
      home.onclick = () => { closeModal(true); leaveGame(); };
      if (again) actions.appendChild(again);
      if (record) actions.appendChild(record);
      actions.appendChild(home);
      content.appendChild(actions);
    });
  }

  function showCredits() {
    openModal((content) => {
      content.appendChild(el("div", "eyebrow", "CREDITS / ARCHIVE"));
      content.appendChild(el("h3", null, "制作与素材说明"));
      const p1 = el("p", null, "《戈克世界：流脉牌局》推演版 1.0。当前开放普卫岛、学院、西昭、共和国与帝国五个阵营，支持起手调度、单人 AI 与局域网双人对战。");
      const p2 = el("p", null, "随从立绘与场景图来自《戈克世界》项目现有素材；音效与背景音乐来自《戈克纪元：流脉》项目。卡牌框架、规则引擎与界面由本作制作。");
      const p3 = el("p", null, "本作为非正史档案推演，卡牌效果不写入小说正史；未使用 NSFW 私设、参考图或带文字介绍卡。");
      content.appendChild(p1); content.appendChild(p2); content.appendChild(p3);
      const actions = el("div", "modal-actions");
      const close = el("button", "btn btn-primary", "知道了");
      close.onclick = () => closeModal(true);
      actions.appendChild(close);
      content.appendChild(actions);
    });
  }

  function leaveGame() {
    stopNet(true);
    app.tutorial = false;
    app.game = null;
    app.busy = false;
    app.aiRunning = false;
    app.selectedCard = null;
    app.targetInfo = null;
    app.zoneSelect = null;
    app.attacker = null;
    app.payBloodChoice = null;
    app.pendingBloodCard = null;
    hidePreview();
    showScreen("home");
  }

  function checkGameOverAfterAction() {
    if (!app.game) return false;
    if (app.game.status === "gameover") {
      app.busy = true;
      app.aiRunning = false;
      renderGame();
      showEnd();
      return true;
    }
    return false;
  }

  /* ===== preview ===== */
  function showMobileCard(def, minion) {
    const old = document.getElementById("mobile-card-sheet");
    if (old) old.remove();
    const bg = el("div", "mobile-card-backdrop");
    bg.id = "mobile-card-sheet";
    const sheet = el("div", "mobile-card-sheet");
    bg.appendChild(sheet);
    const close = el("button", "mobile-card-close", "×");
    close.onclick = () => bg.remove();
    sheet.appendChild(close);
    bg.onclick = (ev) => { if (ev.target === bg) bg.remove(); };
    sheet.appendChild(el("div", "eyebrow", "CARD / DETAILS"));
    sheet.appendChild(el("h3", null, def.name));
    sheet.appendChild(el("div", "preview-meta", typeLine(def) + " · " + def.cost + " 费" + (def.type === "minion" ? " · 攻 " + (minion ? minion.attack : def.attack) + " / 血 " + (minion ? minion.health : def.health) : "")));
    const art = el("div", "mobile-preview-art");
    if (def.art) art.style.backgroundImage = "url('" + portraitImage(def.art) + "')";
    else {
      art.classList.add("placeholder", "generic-art");
      art.style.backgroundImage = genericArtStyle(def);
      art.dataset.icon = def.type === "spell" ? "术" : factionIcon(def.faction);
      addGenericGlyph(art, def);
      addGeneratedArt(art, def);
    }
    sheet.appendChild(art);
    addKeywordChips(sheet, def, minion);
    const text = el("p", "mobile-preview-text");
    appendKeywordText(text, def.text || "—");
    sheet.appendChild(text);
    if (def.flavor) sheet.appendChild(el("div", "preview-flavor", "“" + def.flavor + "”"));
    document.body.appendChild(bg);
  }

  function attachMobilePreview(card, def, minion) {
    let timer = null;
    let start = null;
    let fired = false;
    const clear = () => { if (timer) { clearTimeout(timer); timer = null; } };
    card.addEventListener("pointerdown", (ev) => {
      if (ev.pointerType === "mouse" || ev.button !== 0) return;
      fired = false;
      start = { x: ev.clientX, y: ev.clientY };
      timer = setTimeout(() => {
        fired = true;
        app.suppressClick = Date.now() + 700;
        showMobileCard(def, minion);
        if (navigator.vibrate) { try { navigator.vibrate(12); } catch (e) {} }
      }, 480);
    });
    card.addEventListener("pointermove", (ev) => {
      if (!start) return;
      if (Math.abs(ev.clientX - start.x) > 12 || Math.abs(ev.clientY - start.y) > 12) clear();
    });
    card.addEventListener("pointerup", () => { start = null; clear(); });
    card.addEventListener("pointercancel", () => { start = null; clear(); });
    card.addEventListener("pointerleave", () => { start = null; clear(); });
  }

  function showDeckHover(def, anchor) {
    const tip = $("deck-hover-tip");
    if (!tip || !anchor) return;
    clear(tip);
    tip.appendChild(el("strong", null, def.name));
    tip.appendChild(el("small", null, typeLine(def) + " · " + def.cost + " 行动力" + (def.type === "minion" ? " · " + def.attack + "/" + def.health : "") + " · " + factionName(def.faction)));
    tip.appendChild(el("p", null, def.text || "没有额外效果。"));
    if (def.flavor) tip.appendChild(el("em", null, "“" + def.flavor + "”"));
    tip.hidden = false;
    const r = anchor.getBoundingClientRect();
    const w = tip.offsetWidth, h = tip.offsetHeight;
    let left = r.left + r.width / 2 - w / 2;
    left = Math.max(8, Math.min(left, window.innerWidth - w - 8));
    let top = r.top - h - 10;
    if (top < 8) top = Math.min(window.innerHeight - h - 8, r.bottom + 10);
    tip.style.left = left + "px";
    tip.style.top = top + "px";
  }
  function hideDeckHover() {
    const tip = $("deck-hover-tip");
    if (tip) tip.hidden = true;
  }

  function showPreview(def, minion) {
    const box = $("card-preview");
    if (!box) return;
    box.hidden = false;
    clear(box);
    const title = el("h4", null, def.name);
    const meta = el("div", "preview-meta", typeLine(def) + " · " + (RARITY_NAMES[def.rarity] || "普通") + " · " + def.cost + " 费" + (def.type === "minion" ? " · " + (minion ? minion.attack + "/" + minion.health : def.attack + "/" + def.health) : "") + " · " + factionName(def.faction));
    box.appendChild(title);
    box.appendChild(meta);
    addKeywordChips(box, def, minion);
    const art = el("div", "preview-art");
    if (def.art) art.style.backgroundImage = "url('" + portraitImage(def.art) + "')";
    else {
      art.classList.add("placeholder");
      art.style.display = "grid";
      art.style.placeItems = "center";
      art.textContent = factionIcon(def.faction);
      art.style.fontSize = "44px";
      art.style.color = "rgba(233,225,210,0.25)";
      art.style.backgroundImage = genericArtStyle(def);
      addGenericGlyph(art, def);
      addGeneratedArt(art, def);
    }
    box.appendChild(art);
    box.appendChild(el("div", "preview-text", def.text || "—"));
    if (def.flavor) box.appendChild(el("div", "preview-flavor", "“" + def.flavor + "”"));
  }
  function hidePreview() {
    const box = $("card-preview");
    if (box) box.hidden = true;
  }

  /* ===== toast ===== */
  let toastTimer = null;
  function clearToast() {
    const t = $("toast");
    if (!t) return;
    clearTimeout(toastTimer);
    t.classList.remove("show");
    t.textContent = "";
  }
  function toast(text) {
    const t = $("toast");
    if (!t) return;
    t.textContent = text;
    t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove("show"), 1900);
  }

  /* ===== simulation ===== */
  function runSimulation(total) {
    if (app.simRunning) return;
    app.simRunning = true;
    const buttons = document.querySelectorAll(".sim-run");
    buttons.forEach((b) => b.disabled = true);
    $("sim-progress").style.width = "0%";
    $("sim-progress-text").textContent = "推演中… 0 / " + total;
    $("sim-verdict").textContent = "正在让 AI 互相对打…";
    const stats = { games: 0, pus: 0, xz: 0, draw: 0, stall: 0, rounds: 0, peak: 0, t4: 0, t7: 0, t10: 0, t10games: 0, firstWins: 0, firstGames: 0 };
    let i = 0;
    const chunk = 20;
    function step() {
      const end = Math.min(i + chunk, total);
      for (; i < end; i++) {
        const result = AI.autoPlayGame({
          faction1: "pus",
          faction2: "xizhao",
          seed: 100000 + i * 7919,
          mode: "sim",
          p1AI: true,
          p2AI: true
        });
        const s = result.state;
        stats.games++;
        stats.rounds += s.round;
        stats.peak += s.stats.veinPeak || 0;
        stats.t4 += s.stats.thresholds[4] || 0;
        stats.t7 += s.stats.thresholds[7] || 0;
        stats.t10 += s.stats.thresholds[10] || 0;
        if ((s.stats.thresholds[10] || 0) > 0) stats.t10games++;
        if (s.status !== "gameover") stats.stall++;
        else if (s.winner === 0) stats.pus++;
        else if (s.winner === 1) stats.xz++;
        else stats.draw++;
        if (s.status === "gameover" && s.winner != null) {
          stats.firstGames++;
          if (s.winner === s.stats.firstPlayer) stats.firstWins++;
        }
      }
      const pct = i / total;
      $("sim-progress").style.width = Math.round(pct * 100) + "%";
      $("sim-progress-text").textContent = "推演中… " + i + " / " + total;
      updateSimDisplay(stats, total, false);
      if (i < total) {
        setTimeout(step, 0);
      } else {
        app.simRunning = false;
        buttons.forEach((b) => b.disabled = false);
        $("sim-progress-text").textContent = "完成 · " + total + " 局（种子可复现）";
        updateSimDisplay(stats, total, true);
      }
    }
    step();
  }

  function updateSimDisplay(stats, total, final) {
    const n = stats.games || 1;
    const pusPct = stats.pus / n * 100;
    const xzPct = stats.xz / n * 100;
    const firstPct = stats.firstGames ? stats.firstWins / stats.firstGames * 100 : 0;
    const avgRounds = stats.rounds / n;
    const avgPeak = stats.peak / n;
    const avg4 = stats.t4 / n;
    const avg7 = stats.t7 / n;
    const avg10 = stats.t10 / n;
    const t10Rate = stats.t10games / n * 100;
    $("stat-games").textContent = String(stats.games);
    $("stat-pus").textContent = pusPct.toFixed(1) + "%";
    $("stat-xz").textContent = xzPct.toFixed(1) + "%";
    $("stat-first").textContent = firstPct ? firstPct.toFixed(1) + "%" : "—";
    $("stat-rounds").textContent = avgRounds.toFixed(1);
    $("stat-peak").textContent = avgPeak.toFixed(1);
    $("stat-thresholds").textContent = avg4.toFixed(1) + " / " + avg7.toFixed(1) + " / " + avg10.toFixed(1);
    $("stat-draw").textContent = stats.draw + " / " + stats.stall;
    const tbody = $("sim-table-body");
    clear(tbody);
    const rows = [
      ["先手胜率", firstPct ? firstPct.toFixed(1) + "%" : "—", "48%～52%", firstPct >= 48 && firstPct <= 52],
      ["阵营胜率", "普 " + pusPct.toFixed(1) + "% / 西 " + xzPct.toFixed(1) + "%", "各 45%～55%", pusPct >= 45 && pusPct <= 55 && xzPct >= 45 && xzPct <= 55],
      ["平均轮数", avgRounds.toFixed(1), "8～12 轮", avgRounds >= 8 && avgRounds <= 12],
      ["流脉 10 触发率", t10Rate.toFixed(1) + "%", "30%～60%", t10Rate >= 30 && t10Rate <= 60],
      ["卡死 / 平局", stats.stall + " / " + stats.draw, "0 / 0", stats.stall === 0 && stats.draw === 0]
    ];
    for (const row of rows) {
      const tr = document.createElement("tr");
      tr.appendChild(el("td", null, row[0]));
      const val = el("td", null, row[1]);
      if (row[3]) val.style.color = "#8dd6a4";
      tr.appendChild(val);
      tr.appendChild(el("td", "muted", row[2]));
      tbody.appendChild(tr);
    }
    if (final) {
      const issues = [];
      if (!(firstPct >= 48 && firstPct <= 52)) issues.push("先手" + (firstPct > 52 ? "偏强" : "偏弱"));
      if (!(pusPct >= 45 && pusPct <= 55)) issues.push("阵营胜率超出区间");
      if (!(avgRounds >= 8 && avgRounds <= 12)) issues.push("节奏偏" + (avgRounds > 12 ? "慢" : "快"));
      if (!(t10Rate >= 30 && t10Rate <= 60)) issues.push("魔物潮触发率" + (t10Rate > 60 ? "过高" : "过低"));
      if (stats.stall) issues.push("出现卡死");
      $("sim-verdict").textContent = issues.length ? "读数：" + issues.join("；") + "。先记录，再调整。" : "读数：先手、阵营、节奏和流脉触发都在测试目标内。可以进入真人试玩。";
    }
  }

  function confirmExit() {
    if (!app.game || app.game.status === "gameover") { leaveGame(); return; }
    const wasBusy = app.busy;
    app.busy = true;
    openModal((content) => {
      content.appendChild(el("div", "eyebrow", "LEAVE SIMULATION"));
      content.appendChild(el("h3", null, "退出当前推演？"));
      content.appendChild(el("p", null, "当前对局不会写入档案。若正在局域网对战中，对手会失去连接。"));
      const actions = el("div", "modal-actions");
      const cancel = el("button", "btn btn-ghost", "继续对局");
      cancel.onclick = () => {
        closeModal(true);
        app.busy = wasBusy;
        renderGame();
      };
      const leave = el("button", "btn btn-primary", "退出推演");
      leave.onclick = () => {
        closeModal(true);
        leaveGame();
      };
      actions.appendChild(cancel);
      actions.appendChild(leave);
      content.appendChild(actions);
    });
  }

  /* ===== 档案编成 ===== */
  const DECK_STORAGE_KEY = "gok_custom_decks_v1";
  const RELIC_STORAGE_KEY = "gok_active_relics_v1";
  const LEGACY_DECK_KEY = "gok_legacy_decks_v1";
  const ACCOUNT_KEY = "gok_account_v1";
  const ACCOUNT_NAMED_KEY = "gok_account_named_v1";
  const SAVE_BACKUP_KEY = "gok_save_backup_v1";
  let saveBackupTimer = null;

  function ensureAccount() {
    let account = null;
    try { account = JSON.parse(localStorage.getItem(ACCOUNT_KEY) || "null"); } catch (e) {}
    if (!account || !account.id) {
      account = { id: "p_" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36), name: "档案员", createdAt: Date.now() };
      try { localStorage.setItem(ACCOUNT_KEY, JSON.stringify(account)); } catch (e) {}
    }
    app.account = account;
    if (account.name && account.name !== "档案员") { try { localStorage.setItem(ACCOUNT_NAMED_KEY, "1"); } catch (e) {} }
    return account;
  }

  function collectSaveBundle() {
    return {
      schema: 2,
      savedAt: Date.now(),
      account: app.account || null,
      customDecks: app.customDecks || {},
      rawCustomDecks: app.rawCustomDecks || null,
      legacyDecks: app.legacyDecks || {},
      activeRelics: app.activeRelics || {},
      achievements: app.achievements || {},
      profile: app.profile || {},
      content: (() => { try { return JSON.parse(localStorage.getItem("gok_content_v1") || "null"); } catch (e) { return null; } })(),
      settings: { aiSpeed: app.aiSpeed, aiDifficulty: app.aiDifficulty, bgm: app.bgmOn, sfx: app.sfxOn }
    };
  }

  function snapshotSave(reason) {
    try {
      const bundle = collectSaveBundle();
      localStorage.setItem(SAVE_BACKUP_KEY, JSON.stringify({ savedAt: Date.now(), reason: reason || "auto", bundle }));
    } catch (e) {}
  }

  function scheduleSaveBackup() {
    if (saveBackupTimer) return;
    saveBackupTimer = setTimeout(() => { saveBackupTimer = null; snapshotSave("auto"); }, 800);
  }

  function encodeSaveCode(bundle) {
    return btoa(unescape(encodeURIComponent(JSON.stringify(bundle))));
  }

  function decodeSaveCode(code) {
    const text = decodeURIComponent(escape(atob(String(code || "").replace(/\s+/g, ""))));
    return JSON.parse(text);
  }

  function applySaveBundle(bundle) {
    if (!bundle || typeof bundle !== "object") throw new Error("存档格式不正确");
    if (!bundle.customDecks && !bundle.profile && !bundle.achievements) throw new Error("存档里没有可识别的数据");
    snapshotSave("before-import");
    const account = bundle.account && bundle.account.id ? bundle.account : ensureAccount();
    app.account = account;
    try { localStorage.setItem(ACCOUNT_KEY, JSON.stringify(account)); if (account.name && account.name !== "档案员") localStorage.setItem(ACCOUNT_NAMED_KEY, "1"); } catch (e) {}
    app.customDecks = bundle.customDecks && typeof bundle.customDecks === "object" ? bundle.customDecks : {};
    app.rawCustomDecks = bundle.rawCustomDecks || null;
    app.legacyDecks = bundle.legacyDecks || {};
    app.activeRelics = bundle.activeRelics && typeof bundle.activeRelics === "object" ? bundle.activeRelics : {};
    app.achievements = bundle.achievements || {};
    app.profile = bundle.profile || {};
    try { localStorage.setItem(DECK_STORAGE_KEY, JSON.stringify(app.customDecks)); } catch (e) {}
    try { localStorage.setItem(LEGACY_DECK_KEY, JSON.stringify(app.legacyDecks || {})); } catch (e) {}
    try { localStorage.setItem(RELIC_STORAGE_KEY, JSON.stringify(app.activeRelics)); } catch (e) {}
    try { localStorage.setItem(ACHIEVEMENT_KEY, JSON.stringify(app.achievements)); } catch (e) {}
    try { localStorage.setItem(PROFILE_KEY, JSON.stringify(app.profile)); } catch (e) {}
    try { if (bundle.content) localStorage.setItem("gok_content_v1", JSON.stringify(bundle.content)); } catch (e) {}
    snapshotSave("after-import");
  }


  const DECK_REPAIR_POOL = ["neutral_wayfarer", "wandering_guard", "traveling_healer", "old_compass", "mercenary", "sim_assistant", "snow_medic", "mist_scout", "caravan_guard"];
  function migrateUnavailableCards(faction, list) {
    const usable = (id) => { const d = D.CARDS[id]; return !!d && !d.disabled; };
    if (list.every(usable)) return list.slice();
    const counts = {};
    for (const id of list) if (usable(id)) counts[id] = (counts[id] || 0) + 1;
    const isFiller = (id) => {
      const d = D.CARDS[id];
      return d && !d.disabled && !d.token && d.type !== "relic" && d.faction === "neutral";
    };
    const preferred = DECK_REPAIR_POOL.filter(isFiller);
    const pool = preferred.concat(Object.keys(D.CARDS).filter((id) => isFiller(id) && preferred.indexOf(id) < 0));
    const out = [];
    for (const id of list) {
      if (usable(id)) { out.push(id); continue; }
      const repl = pool.find((nid) => (counts[nid] || 0) < D.maxCopies(D.CARDS[nid]));
      if (repl) { counts[repl] = (counts[repl] || 0) + 1; out.push(repl); }
    }
    return out;
  }

  function normalizeSavedDeck(faction, list) {
    if (!Array.isArray(list)) return null;
    list = migrateUnavailableCards(faction, list);
    if (D.validateDeck(faction, list).ok) {
      const clean = list.slice();
      if (clean.length > 31) {
        for (let i = clean.length - 1; i >= 0; i--) {
          if (D.CARDS[clean[i]] && D.CARDS[clean[i]].type === "relic") { clean.splice(i, 1); break; }
        }
      }
      return clean.slice(0, 31);
    }
    const special = D.DECK_SPECIALS[faction] || {};
    const relics = list.filter((id) => D.CARDS[id] && D.CARDS[id].type === "relic");
    const formations = list.filter((id) => D.CARDS[id] && D.CARDS[id].type === "formation");
    const main = list.filter((id) => D.CARDS[id] && D.CARDS[id].type !== "relic" && D.CARDS[id].type !== "formation");
    const extraRelic = [special.relic, special.relic2].find((id) => id && relics.indexOf(id) < 0);
    const base = (list.length === 31 || list.length === 33)
      ? main.slice(0, 28).concat(formations.slice(0, 2), relics.slice(0, 1))
      : null;
    if (base && extraRelic) {
      const migrated = base.concat([extraRelic]);
      if (D.validateDeck(faction, migrated).ok) return migrated;
    }
    if (list.length === 31 && extraRelic) {
      const migrated = main.slice(0, 30).concat(relics.slice(0, 1), [extraRelic]);
      if (D.validateDeck(faction, migrated).ok) return migrated;
    }
    return null;
  }

  function loadCustomDecks() {
    app.customDecks = {};
    app.rawCustomDecks = null;
    app.legacyDecks = {};
    try {
      const legacyRaw = localStorage.getItem(LEGACY_DECK_KEY);
      if (legacyRaw) app.legacyDecks = JSON.parse(legacyRaw) || {};
    } catch (e) { app.legacyDecks = {}; }
    try {
      const raw = localStorage.getItem(DECK_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      app.rawCustomDecks = parsed;
      for (const f of D.FACTION_IDS) {
        const list = parsed && parsed[f];
        const migrated = normalizeSavedDeck(f, list);
        if (migrated) app.customDecks[f] = migrated.slice();
        else if (Array.isArray(list) && list.length) app.legacyDecks[f] = list.slice();
      }
    } catch (e) {
      app.customDecks = {};
    }
  }

  function persistCustomDecks() {
    try { localStorage.setItem(DECK_STORAGE_KEY, JSON.stringify(app.customDecks)); } catch (e) {}
    try { localStorage.setItem(LEGACY_DECK_KEY, JSON.stringify(app.legacyDecks || {})); } catch (e) {}
    scheduleSaveBackup();
  }

  function loadActiveRelics() {
    try {
      const raw = localStorage.getItem(RELIC_STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : {};
      for (const f of D.FACTION_IDS) if (parsed && parsed[f]) app.activeRelics[f] = parsed[f];
    } catch (e) { app.activeRelics = {}; }
  }
  function persistActiveRelics() {
    try { localStorage.setItem(RELIC_STORAGE_KEY, JSON.stringify(app.activeRelics)); } catch (e) {}
    scheduleSaveBackup();
  }
  function deckRelicIds(faction) {
    const list = (app.customDecks[faction] && D.validateDeck(faction, app.customDecks[faction]).ok ? app.customDecks[faction] : D.DECKS[faction]) || [];
    return list.filter(id => D.CARDS[id] && D.CARDS[id].type === "relic");
  }
  function activeRelicFor(faction) {
    const relics = deckRelicIds(faction);
    if (app.activeRelics[faction] && relics.indexOf(app.activeRelics[faction]) >= 0) return app.activeRelics[faction];
    return relics[0] || null;
  }
  function getPlayDeck(faction) {
    const custom = app.customDecks[faction];
    const list = (custom && D.validateDeck(faction, custom).ok ? custom : D.DECKS[faction]).slice();
    const active = activeRelicFor(faction);
    return list.filter(id => {
      const def = D.CARDS[id];
      return !def || def.type !== "relic" || id === active;
    });
  }

  function updateSetupDeck() {
    const custom = app.customDecks[app.faction];
    const valid = !!(custom && D.validateDeck(app.faction, custom).ok);
    if (!$("setup-deck-name")) return;
    $("setup-deck-name").textContent = valid ? "自定义牌组 · 30+1" : "预设牌组 · 30+1";
    const activeRelic = activeRelicFor(app.faction);
    const relicName = activeRelic && D.CARDS[activeRelic] ? D.CARDS[activeRelic].name : "未选择";
    $("setup-deck-detail").textContent = (valid ? "已保存在本机" : "官方预组") + " · 本局遗物：" + relicName + " · 需抽到后打出";
    $("btn-deck-preset").disabled = !valid;
  }

  function usePresetDeck(faction) {
    delete app.customDecks[faction];
    persistCustomDecks();
    updateSetupDeck();
    if (app.screen === "deck") renderDeckBuilder();
    toast("已切换为预设牌组。");
  }

  function openDeckBuilder(faction, origin) {
    app.deckBuildFaction = faction;
    app.deckReturn = origin || "setup";
    app.deckDrafts = {};
    const saved = app.customDecks[faction];
    app.deckBuildList = (saved && D.validateDeck(faction, saved).ok ? saved : D.DECKS[faction]).slice();
    app.deckSource = saved && D.validateDeck(faction, saved).ok ? "custom" : "preset";
    app.lastAutoStrategy = null;
    app.deckBuildFilter = "all";
    showScreen("deck");
    renderDeckBuilder();
  }

  function cardDrawValue(def) {
    let n = 0;
    const s = def.spell || {};
    if (s.type === "draw") n += s.amount || 1;
    if (s.type === "healDraw") n += s.draw || 1;
    if (["freezeDraw", "bloodDraw"].indexOf(s.type) >= 0) n += s.draw || 1;
    if (s.type === "drawVein") n += (s.amount || 1) + (s.bonus || 1);
    const b = def.battlecry || {};
    if (b.type === "draw") n += b.amount || 1;
    if (b.type === "drawVein") n += (b.amount || 1) + (b.bonus || 1);
    if (b.type === "drawHandCondition") n += 2;
    if (b.type === "drawSpell" || b.type === "spellDraw") n += 1;
    return n;
  }

  function deckDrawCount(list) {
    return (list || []).reduce((sum, id) => sum + cardDrawValue(D.CARDS[id] || {}), 0);
  }

  function deckCounts(list) {
    const out = {};
    for (const id of list) out[id] = (out[id] || 0) + 1;
    return out;
  }

  function renderDeckBuilder() {
    const f = app.deckBuildFaction;
    const list = app.deckBuildList;
    const counts = deckCounts(list);
    const validation = D.validateDeck(f, list);
    const mainCount = list.filter(id => D.CARDS[id].type !== "formation" && D.CARDS[id].type !== "relic").length;
    const formationCount = list.filter(id => D.CARDS[id].type === "formation").length;
    const relicCount = list.filter(id => D.CARDS[id].type === "relic").length;
    const headerCount = $("deck-head-count");
    const fieldCount = mainCount + formationCount;
    if (headerCount) headerCount.textContent = (fieldCount + Math.min(1, relicCount)) + " / 31";
    const totalEl = $("deck-count");
    if (totalEl) totalEl.textContent = (fieldCount + Math.min(1, relicCount)) + " / 31 张";
    const noteEl = $("deck-count-note");
    if (noteEl) noteEl.textContent = "由 30 张带牌（含阵型，最多 2 张）+ 1 张遗物组成";

    const heroDef = D.HEROES[D.FACTIONS[f].hero];
    const leaderName = $("deck-leader-name");
    if (leaderName) leaderName.textContent = heroDef.name;
    const relicSelect = $("deck-relic-select");
    if (relicSelect) {
      const relicIds = list.filter(id => D.CARDS[id] && D.CARDS[id].type === "relic");
      if (app.activeRelics[f] && relicIds.indexOf(app.activeRelics[f]) < 0) app.activeRelics[f] = relicIds[0] || null;
      if (!app.activeRelics[f] && relicIds.length) app.activeRelics[f] = relicIds[0];
      clear(relicSelect);
      if (!relicIds.length) relicSelect.appendChild(el("option", null, "未装备遗物"));
      for (const rid of relicIds) relicSelect.appendChild(el("option", null, D.CARDS[rid].name));
      relicSelect.value = app.activeRelics[f] ? D.CARDS[app.activeRelics[f]].name : "未装备遗物";
      relicSelect.onchange = () => {
        const chosen = relicIds.find(id => D.CARDS[id] && D.CARDS[id].name === relicSelect.value);
        if (chosen) { app.activeRelics[f] = chosen; persistActiveRelics(); }
      };
    }
    const leaderSkill = $("deck-leader-skill");
    if (leaderSkill) {
      clear(leaderSkill);
      const main = el("div", "deck-skill-main");
      main.appendChild(el("span", "deck-hero-stats", "领袖 " + heroDef.name + " · 生命 " + heroDef.hp + "（上限可成长）"));
      main.appendChild(el("strong", null, "领袖技能 · " + heroDef.power.name + " · " + heroDef.power.cost + " 行动力"));
      // keep the deck header compact: skill details are available in-game / via tooltip
      leaderSkill.appendChild(main);
    }
    const validEl = $("deck-valid");
    validEl.textContent = validation.ok ? "合法牌组" : "未完成";
    validEl.className = "deck-valid " + (validation.ok ? "ok" : "bad");

    const tabs = $("deck-faction-tabs");
    clear(tabs);
    for (const id of D.FACTION_IDS) {
      const b = el("button", "deck-faction-tab" + (id === f ? " active" : ""), D.FACTIONS[id].name);
      b.onclick = () => {
        app.deckDrafts[f] = list.slice();
        app.deckBuildFaction = id;
        const saved = app.customDecks[id];
        app.deckBuildList = (app.deckDrafts[id] || (saved && D.validateDeck(id, saved).ok ? saved : D.DECKS[id])).slice();
        renderDeckBuilder();
      };
      tabs.appendChild(b);
    }

    const msg = $("deck-message");
    clear(msg);
    if (!validation.ok) {
      if (validation.errors.length) msg.textContent = validation.errors.slice(0, 2).join("；");
      else msg.textContent = "需要 31 张：30 张带牌 + 1 张遗物；阵型最多 2 张。";
    } else {
      msg.textContent = "31 张自由编成：30 张带牌 + 1 张遗物，阵型最多 2 张。";
    }

    const curve = $("deck-curve");
    clear(curve);
    const costCounts = {};
    for (const id of list) costCounts[D.CARDS[id].cost] = (costCounts[D.CARDS[id].cost] || 0) + 1;
    const maxCost = Math.max(1, ...Object.values(costCounts));
    for (let c = 1; c <= 7; c++) {
      const box = el("div", "deck-curve-bar");
      const fill = el("div", "deck-curve-fill");
      fill.style.height = Math.max(2, (costCounts[c] || 0) / maxCost * 100) + "%";
      box.appendChild(fill);
      box.appendChild(el("span", "deck-curve-label", String(c)));
      curve.appendChild(box);
    }
    const minions = list.filter(id => D.CARDS[id].type === "minion").length;
    const tactics = list.filter(id => D.CARDS[id].type === "spell").length;
    const formations = list.filter(id => D.CARDS[id].type === "formation").length;
    const drawTotal = deckDrawCount(list);
    $("deck-type-stats").textContent = "随从 " + minions + " · 战术 " + tactics + " · 阵型 " + formations + " · 传说 " + list.filter(id => D.CARDS[id].rarity === "legendary").length + " · 过牌 " + drawTotal;
    msg.classList.toggle("warn", validation.ok && drawTotal > 10);
    msg.hidden = validation.ok && !(drawTotal > 10);
    if (validation.ok && drawTotal > 10) {
      msg.textContent = "31 张自由编成 · 过牌偏多：" + drawTotal + " 张，建议控制在 6–10 张。";
    }

    const selected = $("deck-selected");
    clear(selected);
    const groups = Object.keys(counts).map(id => ({ id, def: D.CARDS[id], count: counts[id] })).sort((a, b) => a.def.cost - b.def.cost || a.def.name.localeCompare(b.def.name));
    if (!groups.length) selected.appendChild(el("div", "deck-message", "还没有选牌。"));
    for (const g of groups) {
      const row = el("div", "deck-line");
      row.appendChild(el("span", "deck-line-cost", String(g.def.cost)));
      row.appendChild(el("span", "deck-line-name", g.def.name + (g.count > 1 ? " ×" + g.count : "")));
      if (g.def.type === "minion") row.appendChild(el("span", "deck-line-stats", "攻" + g.def.attack + " / 血" + g.def.health));
      const minus = el("button", "deck-line-remove", "移除");
      minus.title = "从牌组移除一张";
      minus.onclick = () => removeDeckCard(g.id);
      row.appendChild(minus);
      row.onmouseenter = () => showDeckHover(g.def, row);
      row.onmouseleave = hideDeckHover;
      selected.appendChild(row);
    }

    hideDeckHover();
    const poolBox = $("deck-pool");
    clear(poolBox);
    const filter = app.deckBuildFilter;
    let scope = app.deckPoolScope || "faction";
    if (scope === "all") scope = "faction";
    let poolSource;
    if (scope === "neutral") poolSource = Object.keys(D.CARDS).filter(id => D.CARDS[id].faction === "neutral" && !D.CARDS[id].token && !D.CARDS[id].disabled);
    else poolSource = Object.keys(D.CARDS).filter(id => (D.CARDS[id].faction === f) && !D.CARDS[id].token && !D.CARDS[id].disabled);
    const pool = poolSource.filter(id => filter === "all" || D.CARDS[id].type === filter)
      .sort((a, b) => D.CARDS[a].cost - D.CARDS[b].cost || D.CARDS[a].name.localeCompare(D.CARDS[b].name));
    $("deck-pool-count").textContent = "卡池 " + pool.length + " 张";
    for (const id of pool) {
      const def = D.CARDS[id];
      const count = counts[id] || 0;
      const max = D.maxCopies(def);
      const typeFull = def.type === "formation" ? (formationCount >= 2 || fieldCount >= 30) : def.type === "relic" ? relicCount >= 1 : fieldCount >= 30;
      const card = buildLibraryCard(def, { variant: "mini", faction: false, count: count + "/" + max });
      card.classList.add("deck-mini", "rarity-" + (def.rarity || "common"));
      if (count >= max || typeFull) card.classList.add("full");
      addCardTags(card, def, null, "lib-tags");
      card.title = def.text || def.name;
      card.onclick = () => addDeckCard(id);
      card.onmouseenter = () => showDeckHover(def, card);
      card.onmouseleave = hideDeckHover;
      poolBox.appendChild(card);
    }

    $("btn-deck-save").disabled = !validation.ok;
    $("btn-deck-use").disabled = !validation.ok;
    const topUse = $("btn-deck-top-use");
    if (topUse) topUse.disabled = !validation.ok;
    const source = $("deck-source-label");
    if (source) {
      source.textContent = app.deckSource === "custom" ? "已载入自定义牌组 · 可继续编辑" : app.deckSource === "draft" ? "自动构筑草稿 · 尚未保存" : "预设牌组 · 可编辑";
      source.classList.toggle("custom", app.deckSource === "custom" || app.deckSource === "draft");
    }
    document.querySelectorAll(".auto-deck-btn").forEach((b) => b.classList.toggle("active", b.dataset.deckStrategy === app.lastAutoStrategy));
    const autoStatus = $("deck-auto-status");
    if (autoStatus) autoStatus.textContent = app.lastAutoStrategy ? "当前策略：" + D.DECK_STRATEGIES[app.lastAutoStrategy].name + " · 可继续手动调整" : "选择一套策略，一键生成 31 张牌组。";
  }

  function addDeckCard(id) {
    const def = D.CARDS[id];
    const count = app.deckBuildList.filter(x => x === id).length;
    const mainCount = app.deckBuildList.filter(x => D.CARDS[x].type !== "formation" && D.CARDS[x].type !== "relic").length;
    const formationCount = app.deckBuildList.filter(x => D.CARDS[x].type === "formation").length;
    const relicCount = app.deckBuildList.filter(x => D.CARDS[x].type === "relic").length;
    const fieldCount = mainCount + formationCount;
    if (def.type === "formation" && formationCount >= 2) { toast("阵位牌最多带 2 张。"); return; }
    if (def.type === "relic" && relicCount >= 1) { toast("遗物只能带 1 张。"); return; }
    if (def.type !== "relic" && fieldCount >= 30) { toast("30 张带牌已满。"); return; }
    if (app.deckBuildList.length >= 31) { toast("牌组已满（31 张）。"); return; }
    if (count >= D.maxCopies(def)) { toast(def.name + " 已达同名张数上限。"); return; }
    app.deckBuildList.push(id);
    AudioBox.play("click");
    renderDeckBuilder();
  }

  function removeDeckCard(id) {
    const i = app.deckBuildList.lastIndexOf(id);
    if (i >= 0) app.deckBuildList.splice(i, 1);
    AudioBox.play("click");
    renderDeckBuilder();
  }

  function saveCurrentDeck(showToast) {
    const f = app.deckBuildFaction;
    const v = D.validateDeck(f, app.deckBuildList);
    if (!v.ok) { toast(v.errors[0] || "牌组还不合法。"); return false; }
    app.customDecks[f] = app.deckBuildList.slice();
    app.deckSource = "custom";
    persistCustomDecks();
    unlockAchievement("deck_saved");
    if (showToast) toast("牌组已保存到本机。");
    return true;
  }

  function autoBuildCurrentDeck(strategy) {
    const f = app.deckBuildFaction;
    const built = D.autoBuildDeck(f, strategy);
    app.deckBuildList = built;
    app.deckSource = "draft";
    app.lastAutoStrategy = strategy;
    renderDeckBuilder();
    toast("已自动构筑「" + D.DECK_STRATEGIES[strategy].name + "」牌组，可继续手动调整。");
  }

  /* ===== 房主对局恢复 ===== */
  const HOST_SESSION_KEY = "gok_host_session_v1";
  let hostSaveTimer = null;

  function saveHostSessionNow() {
    if (!app.game || !app.net || app.net.role !== "host" || !app.net.active) return;
    try {
      localStorage.setItem(HOST_SESSION_KEY, JSON.stringify({ version: 1, savedAt: Date.now(), game: app.game }));
    } catch (e) {}
  }

  function scheduleHostSave() {
    if (!app.game || !app.net || app.net.role !== "host" || !app.net.active) return;
    if (hostSaveTimer) return;
    hostSaveTimer = setTimeout(() => { hostSaveTimer = null; saveHostSessionNow(); }, 220);
  }

  function loadHostSession() {
    try {
      const raw = localStorage.getItem(HOST_SESSION_KEY);
      if (!raw) return null;
      const saved = JSON.parse(raw);
      if (!saved || !saved.game || !Array.isArray(saved.game.players) || saved.game.players.length !== 2) return null;
      return saved;
    } catch (e) { return null; }
  }

  function clearHostSession() {
    if (hostSaveTimer) { clearTimeout(hostSaveTimer); hostSaveTimer = null; }
    try { localStorage.removeItem(HOST_SESSION_KEY); } catch (e) {}
    try { sessionStorage.removeItem("gok_host_active"); } catch (e) {}
  }

  function refreshResumePanel() {
    const box = $("lan-resume");
    if (!box) return;
    if (!app.lanHostPage) { box.hidden = true; return; }
    const saved = loadHostSession();
    if (!saved) { box.hidden = true; return; }
    box.hidden = false;
    const s = saved.game;
    $("lan-resume-text").textContent = "第 " + (s.round || 1) + " 轮 · " + (s.players[0].factionName || "") + " vs " + (s.players[1].factionName || "") + "，可以恢复并继续。";
  }

  async function resumeHostGame() {
    const saved = loadHostSession();
    if (!saved) { toast("没有可恢复的房主对局。"); refreshResumePanel(); return; }
    const game = saved.game;
    app.game = game;
    app.net = { role: "host", player: 0, active: true, since: 0 };
    app.human = 0;
    app.viewer = 0;
    app.aiPlayer = null;
    app.local = false;
    app.mode = "lan";
    app.busy = false;
    app.animating = false;
    app.lanEndShown = false;
    app.settlementRecorded = false;
    app.settlementAchievements = null;
    app.rankChange = null;
    app.lastVein = game.vein;
    app.lastThresholds = Object.assign({}, game.stats.thresholds);
    try { sessionStorage.setItem("gok_host_active", "1"); } catch (e) {}
    closeModal(true);
    showScreen("game");
    AudioBox.play("ui_open");
    renderGame();
    let seq = 0;
    try { const st = await lanApi("/api/status"); seq = st.seq || 0; } catch (e) {}
    startNetPoll(0, seq);
    sendNet({ type: "state", state: redactStateForGuest(game) });
    lanHeartbeat(0);
    if (game.status === "gameover") showEnd();
    toast("已恢复房主对局。");
  }

  /* ===== 档案元界面 ===== */
  const ACHIEVEMENT_KEY = "gok_achievements_v1";
  const ACHIEVEMENTS = [
    { id: "first_win", name: "第一次落笔", desc: "赢得第一局推演。", icon: "I" },
    { id: "academy_win", name: "学院的答案", desc: "使用学院赢得一局。", icon: "书" },
    { id: "tide_10", name: "魔物潮", desc: "在一局中触发流脉 10。", icon: "X" },
    { id: "summoner_10", name: "六阵位", desc: "单局召唤 10 个随从。", icon: "VI" },
    { id: "lan_win", name: "隔桌", desc: "赢得一局局域网对战。", icon: "LAN" },
    { id: "deck_saved", name: "编成者", desc: "保存一套自定义 31 张牌组：30 张带牌 + 1 张遗物。", icon: "30" },
    { id: "tutorial", name: "第一课", desc: "进入新手演练。", icon: "01" },
    { id: "play_10", name: "档案常客", desc: "累计完成 10 局推演。", icon: "10" },
    { id: "ranked_first", name: "记分员", desc: "完成第一场排位赛。", icon: "S1" },
    { id: "ranked_win", name: "排名上升", desc: "赢得第一场排位赛。", icon: "+25" },
    { id: "ranked_gold", name: "黄金席位", desc: "排位分达到黄金。", icon: "600" },
    { id: "ranked_diamond", name: "钻石档案", desc: "排位分达到钻石。", icon: "1200" }
  ];

  function loadAchievements() {
    app.achievements = {};
    try {
      const raw = localStorage.getItem(ACHIEVEMENT_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object") app.achievements = parsed;
      }
    } catch (e) { app.achievements = {}; }
  }

  function persistAchievements() {
    try { localStorage.setItem(ACHIEVEMENT_KEY, JSON.stringify(app.achievements)); } catch (e) {}
    scheduleSaveBackup();
  }

  function unlockAchievement(id) {
    const def = ACHIEVEMENTS.find(a => a.id === id);
    if (!def) return false;
    if (app.achievements[id] && app.achievements[id].unlocked) return false;
    app.achievements[id] = Object.assign({}, app.achievements[id] || {}, { unlocked: true, at: Date.now() });
    persistAchievements();
    toast("成就解锁 · " + def.name);
    AudioBox.play("victory");
    return true;
  }

  function recordGameAchievements() {
    if (!app.game || app.settlementRecorded) return;
    app.settlementRecorded = true;
    const s = app.game;
    const win = s.winner != null && s.winner === app.human;
    const unlocked = [];
    if (win && unlockAchievement("first_win")) unlocked.push("first_win");
    if (win && s.players[app.human].faction === "academy" && unlockAchievement("academy_win")) unlocked.push("academy_win");
    if (win && app.net && unlockAchievement("lan_win")) unlocked.push("lan_win");
    if ((s.stats.thresholds[10] || 0) > 0 && unlockAchievement("tide_10")) unlocked.push("tide_10");
    if (s.ranked) {
      const rp = app.profile || {};
      if ((rp.rankMatches || 0) >= 1 && unlockAchievement("ranked_first")) unlocked.push("ranked_first");
      if ((rp.rankWins || 0) >= 1 && unlockAchievement("ranked_win")) unlocked.push("ranked_win");
      if ((rp.rankPoints || 0) >= 600 && unlockAchievement("ranked_gold")) unlocked.push("ranked_gold");
      if ((rp.rankPoints || 0) >= 1200 && unlockAchievement("ranked_diamond")) unlocked.push("ranked_diamond");
    }
    if ((s.stats.minionsSummoned || 0) >= 10 && unlockAchievement("summoner_10")) unlocked.push("summoner_10");
    const rec = app.achievements.play_10 || { progress: 0 };
    rec.progress = (rec.progress || 0) + 1;
    if (rec.progress >= 10 && !rec.unlocked) { rec.unlocked = true; if (unlocked.indexOf("play_10") < 0) unlocked.push("play_10"); toast("成就解锁 · 档案常客"); }
    app.achievements.play_10 = rec;
    persistAchievements();
    app.settlementAchievements = unlocked;
  }

  const RANK_TIERS = [
    { min: 0, name: "青铜", color: "#b58b62" },
    { min: 300, name: "白银", color: "#b9c7d2" },
    { min: 600, name: "黄金", color: "#e1b861" },
    { min: 900, name: "铂金", color: "#8fd6d1" },
    { min: 1200, name: "钻石", color: "#9fc9ff" },
    { min: 1500, name: "大师", color: "#d7a7ff" },
    { min: 2000, name: "宗师", color: "#ff9f91" }
  ];

  function emptyProfile() {
    return {
      games: 0, wins: 0, losses: 0, draws: 0, byFaction: {}, history: [], maxRound: 0,
      rankPoints: 0, rankWins: 0, rankLosses: 0, rankMatches: 0,
      rankStreak: 0, rankBestStreak: 0, rankPeak: 0, rankSeason: 1
    };
  }

  function rankInfo(points) {
    const value = Math.max(0, Number(points) || 0);
    let tier = RANK_TIERS[0];
    let next = null;
    for (let i = 0; i < RANK_TIERS.length; i++) {
      const t = RANK_TIERS[i];
      if (value >= t.min) { tier = t; next = RANK_TIERS[i + 1] || null; }
    }
    const floor = tier.min;
    const ceiling = next ? next.min : Math.max(2000, value);
    const progress = next ? Math.max(0, Math.min(100, (value - floor) / (ceiling - floor) * 100)) : 100;
    return { points: value, tier: tier.name, color: tier.color, next: next ? next.min : null, progress };
  }

  function rankText(points) {
    const info = rankInfo(points);
    return info.tier + " · " + info.points;
  }

  const PROFILE_KEY = "gok_profile_v1";

  function loadProfile() {
    const empty = emptyProfile();
    try {
      const raw = localStorage.getItem(PROFILE_KEY);
      if (!raw) return empty;
      const p = JSON.parse(raw);
      return Object.assign(empty, p || {}, { byFaction: (p && p.byFaction) || {}, history: (p && p.history) || [] });
    } catch (e) { return empty; }
  }

  function persistProfile() {
    try { localStorage.setItem(PROFILE_KEY, JSON.stringify(app.profile || {})); } catch (e) {}
    scheduleSaveBackup();
  }

  function downloadSaveFile() {
    try {
      const json = JSON.stringify(collectSaveBundle(), null, 2);
      const blob = new Blob([json], { type: "application/json" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "gok-world-save-" + new Date().toISOString().slice(0, 10) + ".json";
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
      toast("存档文件已导出。");
    } catch (e) { toast("导出失败：" + (e.message || e)); }
  }

  function openAccountModal() {
    ensureAccount();
    snapshotSave("open-account");
    openModal((content) => {
      content.appendChild(el("div", "eyebrow", "ARCHIVE / LOCAL SAVE"));
      content.appendChild(el("h3", null, "本地账号与存档"));
      content.appendChild(el("p", null, "账号与存档保存在本机。换设备时用存档文件或存档码迁移。后续更新不会覆盖已有牌组，旧格式牌组也会保留在备份中。"));
      const account = app.account;
      const accountLine = el("div", "account-line");
      accountLine.appendChild(el("strong", null, account.name || "档案员"));
      accountLine.appendChild(el("small", null, "账号 ID：" + account.id));
      content.appendChild(accountLine);
      const nameRow = el("div", "account-name-row");
      const nameInput = el("input", "account-name-input");
      nameInput.type = "text";
      nameInput.maxLength = 24;
      nameInput.value = account.name || "档案员";
      nameInput.placeholder = "账号昵称";
      const saveName = el("button", "btn btn-small btn-ghost", "保存昵称");
      saveName.onclick = () => {
        const name = String(nameInput.value || "").trim().slice(0, 24) || "档案员";
        app.account.name = name;
        try { localStorage.setItem(ACCOUNT_KEY, JSON.stringify(app.account)); localStorage.setItem(ACCOUNT_NAMED_KEY, "1"); } catch (e) {}
        snapshotSave("rename-account");
        toast("账号昵称已保存。");
        accountLine.querySelector("strong").textContent = name;
        updateHomeAccount();
      };
      nameRow.appendChild(nameInput);
      nameRow.appendChild(saveName);
      content.appendChild(nameRow);
      const summary = el("div", "account-summary");
      const validDecks = Object.keys(app.customDecks || {}).length;
      const legacyDecks = Object.keys(app.legacyDecks || {}).length;
      summary.appendChild(el("span", null, "有效牌组 " + validDecks + " 套"));
      summary.appendChild(el("span", null, "旧格式备份 " + legacyDecks + " 套"));
      summary.appendChild(el("span", null, "档案局数 " + ((app.profile && app.profile.games) || 0)));
      content.appendChild(summary);
      if (legacyDecks > 0) content.appendChild(el("p", "account-warn", "发现旧格式牌组：" + Object.keys(app.legacyDecks).map(f => D.FACTIONS[f] ? D.FACTIONS[f].name : f).join("、") + "。原始数据已保留在存档中，不会丢弃。"));
      const codeLabel = el("label", "account-label", "存档码");
      content.appendChild(codeLabel);
      const codeArea = el("textarea", "account-code");
      codeArea.readOnly = false;
      codeArea.placeholder = "点击「生成存档码」，或粘贴别人的存档码后恢复";
      content.appendChild(codeArea);
      const actions = el("div", "modal-actions account-actions");
      const exportBtn = el("button", "btn btn-small btn-primary", "导出存档文件");
      exportBtn.onclick = downloadSaveFile;
      actions.appendChild(exportBtn);
      const codeBtn = el("button", "btn btn-small btn-ghost", "生成存档码");
      codeBtn.onclick = () => {
        try { codeArea.value = encodeSaveCode(collectSaveBundle()); codeArea.select(); toast("存档码已生成，可复制。"); }
        catch (e) { toast("生成失败：" + (e.message || e)); }
      };
      actions.appendChild(codeBtn);
      const copyBtn = el("button", "btn btn-small btn-ghost", "复制存档码");
      copyBtn.onclick = async () => {
        try {
          if (!codeArea.value) codeArea.value = encodeSaveCode(collectSaveBundle());
          codeArea.select();
          if (navigator.clipboard && navigator.clipboard.writeText) await navigator.clipboard.writeText(codeArea.value);
          else document.execCommand("copy");
          toast("存档码已复制。");
        } catch (e) { toast("复制失败，请手动全选复制。"); }
      };
      actions.appendChild(copyBtn);
      const importFileBtn = el("button", "btn btn-small btn-ghost", "导入存档文件");
      const fileInput = document.createElement("input");
      fileInput.type = "file";
      fileInput.accept = ".json,application/json";
      fileInput.style.display = "none";
      fileInput.onchange = async () => {
        const file = fileInput.files && fileInput.files[0];
        if (!file) return;
        try {
          const bundle = JSON.parse(await file.text());
          applySaveBundle(bundle);
          toast("存档已导入，正在重载…");
          closeModal(true);
          setTimeout(() => location.reload(), 450);
        } catch (e) { toast("导入失败：" + (e.message || e)); }
      };
      importFileBtn.onclick = () => fileInput.click();
      actions.appendChild(importFileBtn);
      actions.appendChild(fileInput);
      const codeImportBtn = el("button", "btn btn-small btn-ghost", "从存档码恢复");
      codeImportBtn.onclick = () => {
        try {
          const bundle = decodeSaveCode(codeArea.value);
          applySaveBundle(bundle);
          toast("存档已恢复，正在重载…");
          closeModal(true);
          setTimeout(() => location.reload(), 450);
        } catch (e) { toast("存档码无效或已损坏。"); }
      };
      actions.appendChild(codeImportBtn);
      const backupBtn = el("button", "btn btn-small btn-ghost", "恢复最近备份");
      backupBtn.onclick = () => {
        try {
          const raw = localStorage.getItem(SAVE_BACKUP_KEY);
          if (!raw) { toast("还没有自动备份。"); return; }
          const parsed = JSON.parse(raw);
          applySaveBundle(parsed.bundle);
          toast("最近备份已恢复，正在重载…");
          closeModal(true);
          setTimeout(() => location.reload(), 450);
        } catch (e) { toast("备份恢复失败：" + (e.message || e)); }
      };
      actions.appendChild(backupBtn);
      const closeBtn = el("button", "btn btn-small btn-ghost", "关闭");
      closeBtn.onclick = () => closeModal(true);
      actions.appendChild(closeBtn);
      content.appendChild(actions);
      content.appendChild(el("p", "fine-print", "存档包含：自定义牌组、旧牌组备份、遗物选择、成就、档案统计与设置。存档只保存在本机，不会自动上传服务器。"));
    });
  }

  function maybePromptArchiveName() {
    let named = false;
    try { named = localStorage.getItem(ACCOUNT_NAMED_KEY) === "1"; } catch (e) {}
    if (named) return;
    const account = ensureAccount();
    if (account.name && account.name !== "档案员") return;
    if (app.screen !== "home" || app.modalOpen) return;
    openModal((content) => {
      content.classList.add("first-run-account");
      content.appendChild(el("div", "eyebrow", "FIRST OPENING / ARCHIVE"));
      content.appendChild(el("h3", null, "先给你的档案起个名字"));
      content.appendChild(el("p", null, "这个名字会显示在主页存档牌上，也会跟着你的牌组、远征进度、成就一起保存在本机。之后可以在「账号与存档」里修改。"));
      const input = el("input", "account-name-input first-run-name");
      input.type = "text";
      input.maxLength = 24;
      input.placeholder = "例如：灰港旅人";
      input.value = account.name && account.name !== "档案员" ? account.name : "";
      content.appendChild(input);
      const actions = el("div", "modal-actions");
      const save = el("button", "btn btn-primary", "确认档案名");
      save.onclick = () => {
        const name = String(input.value || "").trim().slice(0, 24);
        if (!name) { toast("请输入一个档案名。"); input.focus(); return; }
        app.account.name = name;
        try { localStorage.setItem(ACCOUNT_KEY, JSON.stringify(app.account)); localStorage.setItem(ACCOUNT_NAMED_KEY, "1"); } catch (e) {}
        snapshotSave("first-run-name");
        updateHomeAccount();
        closeModal(true);
        toast("档案已建立：" + name);
      };
      const skip = el("button", "btn btn-ghost", "稍后再说");
      skip.onclick = () => { try { localStorage.setItem(ACCOUNT_NAMED_KEY, "1"); } catch (e) {} closeModal(true); };
      actions.appendChild(skip);
      actions.appendChild(save);
      content.appendChild(actions);
      setTimeout(() => input.focus(), 50);
    });
  }

  function updateHomeAccount() {
    const account = ensureAccount();
    const nameEl = $("home-account-name");
    const metaEl = $("home-account-meta");
    if (nameEl) nameEl.textContent = account.name || "档案员";
    if (!metaEl) return;
    let content = {};
    try { content = JSON.parse(localStorage.getItem("gok_content_v1") || "{}"); } catch (e) {}
    let backup = null;
    try { backup = JSON.parse(localStorage.getItem(SAVE_BACKUP_KEY) || "null"); } catch (e) {}
    const time = backup && backup.savedAt ? new Date(backup.savedAt).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" }) : null;
    const deckCount = Object.keys(app.customDecks || {}).length;
    metaEl.textContent = (time ? "自动备份 " + time : "自动备份已就绪") + " · 牌组 " + deckCount + " · 街机印记 " + (content.marks || 0);
    const dock = document.querySelector(".home-account-dock");
    if (dock) dock.classList.toggle("unset", !account.name || account.name === "档案员");
  }

  function afterAccountUI() { updateHomeAccount(); }

  function updateHomeProfile() {
    const p = app.profile || { games: 0, wins: 0 };
    const level = 1 + Math.floor((p.games || 0) / 5);
    const el = $("home-profile");
    if (el) el.textContent = "档案等级 " + level + " · " + (p.games || 0) + " 局 · " + (p.wins || 0) + " 胜";
    if (app.screen === "rank") renderRankScreen();
  }

  function recordGameProfile() {
    if (!app.game || app.profileRecorded) return;
    app.profileRecorded = true;
    if (app.tutorial) return;
    const s = app.game;
    const p = app.profile || loadProfile();
    p.games = (p.games || 0) + 1;
    p.wins = p.wins || 0;
    p.losses = p.losses || 0;
    p.draws = p.draws || 0;
    p.byFaction = p.byFaction || {};
    p.history = p.history || [];
    const me = s.players[app.human];
    const opp = s.players[1 - app.human];
    const result = s.winner == null ? "draw" : s.winner === app.human ? "win" : "loss";
    if (result === "win") p.wins++;
    else if (result === "loss") p.losses++;
    else p.draws++;
    let rankChange = null;
    if (s.ranked) {
      const before = p.rankPoints || 0;
      const delta = result === "win" ? 25 : result === "loss" ? -15 : 0;
      p.rankPoints = Math.max(0, before + delta);
      p.rankMatches = (p.rankMatches || 0) + 1;
      if (result === "win") {
        p.rankWins = (p.rankWins || 0) + 1;
        p.rankStreak = (p.rankStreak || 0) + 1;
        p.rankBestStreak = Math.max(p.rankBestStreak || 0, p.rankStreak);
      } else if (result === "loss") {
        p.rankLosses = (p.rankLosses || 0) + 1;
        p.rankStreak = 0;
      }
      p.rankPeak = Math.max(p.rankPeak || 0, p.rankPoints);
      const b = rankInfo(before), a = rankInfo(p.rankPoints);
      rankChange = { before: before, after: p.rankPoints, delta: p.rankPoints - before, beforeTier: b.tier, afterTier: a.tier, result: result };
      app.rankChange = rankChange;
    }
    const f = p.byFaction[me.faction] || { games: 0, wins: 0 };
    f.games++;
    if (result === "win") f.wins++;
    p.byFaction[me.faction] = f;
    p.maxRound = Math.max(p.maxRound || 0, s.round || 0);
    p.history.unshift({ at: Date.now(), faction: me.faction, opponent: opp.faction, result: result, round: s.round || 0, ranked: !!s.ranked, rankDelta: rankChange ? rankChange.delta : 0 });
    p.history = p.history.slice(0, 8);
    app.profile = p;
    persistProfile();
    updateHomeProfile();
    if (s.ranked && rankChange && rankChange.delta !== 0) toast("排位 " + (rankChange.delta > 0 ? "+" : "") + rankChange.delta + " · " + rankText(rankChange.after));
  }

  function renderProfileGrid() {
    const grid = $("profile-grid");
    if (!grid) return;
    clear(grid);
    const p = app.profile || loadProfile();
    const winRate = p.games ? (p.wins / p.games * 100) : 0;
    const items = [
      ["档案等级", 1 + Math.floor((p.games || 0) / 5)],
      ["段位", rankText(p.rankPoints || 0)],
      ["排位分", p.rankPoints || 0],
      ["排位胜场", p.rankWins || 0],
      ["总对局", p.games || 0],
      ["胜场", p.wins || 0],
      ["胜率", winRate.toFixed(0) + "%"],
      ["最长轮数", p.maxRound || 0],
      ["成就", Object.keys(app.achievements || {}).filter(k => app.achievements[k] && app.achievements[k].unlocked).length + " / " + ACHIEVEMENTS.length]
    ];
    for (const pair of items) {
      const box = el("div", "profile-stat");
      box.appendChild(el("span", null, pair[0]));
      box.appendChild(el("strong", null, String(pair[1])));
      grid.appendChild(box);
    }
    const factions = el("div", "profile-factions");
    factions.appendChild(el("div", "panel-label", "阵营记录"));
    for (const id of D.FACTION_IDS) {
      const rec = (p.byFaction && p.byFaction[id]) || { games: 0, wins: 0 };
      const rate = rec.games ? rec.wins / rec.games * 100 : 0;
      const row = el("div", "profile-faction-row");
      row.appendChild(el("span", null, D.FACTIONS[id].name));
      const bar = el("div", "profile-bar");
      const fill = el("i");
      fill.style.width = rate + "%";
      bar.appendChild(fill);
      row.appendChild(bar);
      row.appendChild(el("span", null, rec.games ? (rate.toFixed(0) + "% / " + rec.games) : "—"));
      factions.appendChild(row);
    }
    grid.appendChild(factions);
    const hist = el("div", "profile-history");
    hist.appendChild(el("div", "panel-label", "最近对局"));
    if (!p.history || !p.history.length) hist.appendChild(el("p", "muted", "还没有对局记录。"));
    else for (const h of p.history.slice(0, 5)) {
      const line = el("div", "profile-history-line");
      const d = new Date(h.at);
      line.appendChild(el("span", null, (d.getMonth() + 1) + "/" + d.getDate() + " · " + factionName(h.faction) + " vs " + factionName(h.opponent)));
      line.appendChild(el("strong", null, h.result === "win" ? "胜 · R" + h.round : h.result === "loss" ? "负 · R" + h.round : "平 · R" + h.round));
      hist.appendChild(line);
    }
    grid.appendChild(hist);
  }

  function openCodex() {
    showScreen("codex");
    renderCodex();
  }

  function buildLibraryCard(def, opts) {
    opts = opts || {};
    const variantClass = opts.variant ? " library-" + opts.variant : " library-codex";
    const card = el("article", "gok-library-card" + (opts.variant === "mini" ? " library-mini" : "") + variantClass);
    card.dataset.cardId = def.id;
    card.dataset.faction = def.faction;
    const art = el("div", "gok-lib-art");
    if (def.art) art.style.backgroundImage = "url('" + portraitImage(def.art) + "')";
    else {
      art.classList.add("placeholder");
      art.style.backgroundImage = genericArtStyle(def);
      addGeneratedArt(art, def);
    }
    card.appendChild(art);
    card.appendChild(el("div", "gok-lib-scrim"));
    card.appendChild(el("div", "gok-lib-cost", String(opts.cost != null ? opts.cost : def.cost)));
    if (opts.count != null) card.appendChild(el("div", "gok-lib-count", opts.count));
    if (opts.faction !== false) card.appendChild(el("div", "gok-lib-faction", factionName(def.faction)));
    card.appendChild(el("div", "gok-lib-name", def.name));
    const kind = opts.typeText || (typeLine(def) + " · " + (RARITY_NAMES[def.rarity] || "普通"));
    card.appendChild(el("div", "gok-lib-kind", kind));
    const text = el("div", "gok-lib-text");
    appendKeywordText(text, opts.text != null ? opts.text : (def.text || "—"));
    card.appendChild(text);
    if (def.type === "minion") {
      const atk = opts.attack != null ? opts.attack : def.attack;
      const hp = opts.health != null ? opts.health : def.health;
      card.appendChild(el("div", "gok-lib-stat gok-lib-atk", String(atk)));
      card.appendChild(el("div", "gok-lib-stat gok-lib-hp", String(hp)));
    }
    addCardFrame(card);
    return card;
  }

  function renderCodex() {
    const tabs = $("codex-faction-tabs");
    clear(tabs);
    const factions = [{ id: "all", name: "全部" }, ...D.FACTION_IDS.map(id => ({ id, name: D.FACTIONS[id].name })), { id: "neutral", name: "中立" }];
    for (const f of factions) {
      const b = el("button", "deck-faction-tab" + (app.codexFaction === f.id ? " active" : ""), f.name);
      b.onclick = () => { app.codexFaction = f.id; app.codexLimit = 60; renderCodex(); };
      tabs.appendChild(b);
    }
    document.querySelectorAll("[data-codex-filter]").forEach((b) => {
      b.classList.toggle("active", b.dataset.codexFilter === app.codexFilter);
      b.onclick = () => { app.codexFilter = b.dataset.codexFilter; app.codexLimit = 60; renderCodex(); };
    });
    const query = (app.codexSearch || "").trim().toLowerCase();
    const list = Object.keys(D.CARDS).filter((id) => {
      const d = D.CARDS[id];
      if (d.token || d.disabled) return false;
      if (app.codexFaction !== "all" && d.faction !== app.codexFaction) return false;
      if (app.codexFilter !== "all" && d.type !== app.codexFilter) return false;
      if (!query) return true;
      const keywordText = (d.keywords || []).map(k => (D.KEYWORDS[k] && D.KEYWORDS[k].name) || k).join(" ");
      return (d.name + " " + (d.text || "") + " " + keywordText).toLowerCase().includes(query);
    })
      .sort((a, b) => {
        const da = D.CARDS[a], db = D.CARDS[b];
        const fa = D.FACTION_IDS.indexOf(da.faction), fb = D.FACTION_IDS.indexOf(db.faction);
        return (fa < 0 ? 9 : fa) - (fb < 0 ? 9 : fb) || da.cost - db.cost || da.name.localeCompare(db.name);
      });
    const shown = list.slice(0, app.codexLimit || 60);
    $("codex-count").textContent = "收录 " + list.length + " 张" + (list.length > shown.length ? " · 已显示 " + shown.length : "");
    const more = $("codex-more");
    if (more) { more.hidden = list.length <= shown.length; more.onclick = () => { app.codexLimit = (app.codexLimit || 60) + 60; renderCodex(); }; }
    const search = $("codex-search");
    if (search && search.value !== (app.codexSearch || "")) search.value = app.codexSearch || "";
    const grid = $("codex-grid");
    clear(grid);
    for (const id of shown) {
      const d = D.CARDS[id];
      const card = buildLibraryCard(d, { variant: "codex", faction: true });
      card.classList.add("codex-card");
      addCardTags(card, d, null, "lib-tags");
      card.onclick = () => openCodexCard(d);
      grid.appendChild(card);
    }
  }

  function openCodexCard(d, backLabel) {
    openModal((content) => {
      content.classList.add("card-large-modal");
      content.appendChild(el("div", "eyebrow", "ARCHIVE / CARD"));
      content.appendChild(el("h3", null, d.name));
      content.appendChild(el("div", "preview-meta", factionName(d.faction) + " · " + typeLine(d) + " · " + (RARITY_NAMES[d.rarity] || "普通") + " · " + d.cost + " 费" + (d.type === "minion" ? " · 攻 " + d.attack + " / 血 " + d.health : "")));
      addKeywordChips(content, d, null);
      const art = el("div", "preview-art");
      if (d.art) art.style.backgroundImage = "url('" + portraitImage(d.art) + "')";
      else {
        art.classList.add("placeholder");
        art.textContent = d.type === "spell" ? "术" : factionIcon(d.faction);
        art.style.backgroundImage = genericArtStyle(d);
        addGenericGlyph(art, d);
        addGeneratedArt(art, d);
      }
      content.appendChild(art);
      content.appendChild(el("p", null, d.text || "—"));
      if (d.flavor) content.appendChild(el("div", "preview-flavor", "“" + d.flavor + "”"));
      const actions = el("div", "modal-actions");
      const close = el("button", "btn btn-primary", backLabel || "返回图鉴");
      close.onclick = () => closeModal(true);
      actions.appendChild(close);
      content.appendChild(actions);
    });
  }

  function openGameGuide() {
    openModal((content) => {
      content.appendChild(el("div", "eyebrow", "ARCHIVE / GAME GUIDE"));
      content.appendChild(el("h3", null, "游戏教程"));
      content.appendChild(el("p", null, "经典模式：不同领袖拥有不同起始生命，生命上限可被加成提高；法力成长、随从互殴、领袖技能不变。"));
      const intro = el("div", "guide-sections");
      const sections = [
        ["胜利条件", "先把对方领袖生命降到 0。随从可以攻击敌方随从或领袖；拦截随从必须先被处理。"],
        ["牌组结构", "30 张带牌（含 0–2 张阵型）+ 1 张遗物牌 + 1 位领袖。遗物牌在牌库中，需抽到并打出；领袖由阵营决定，不进入抽牌堆。"],
        ["阵位", "左 / 中 / 右三线，每线最多 3 个随从，但全场最多 6 个。同阵位会触发协同；双方同一列互为对位。"],
        ["流脉", "共享流脉 0→12。4 震荡、7 裂隙、10 魔物潮，12 回流清空。引脉是达到阈值后的额外效果。"],
        ["卡牌类型", "随从站场；战术一次性结算；阵型挂在某一线持续生效；遗物装备在领袖身上；领袖提供技能与被动。"]
      ];
      for (const [title, desc] of sections) {
        const sec = el("div", "guide-section");
        sec.appendChild(el("strong", null, title));
        sec.appendChild(el("span", null, desc));
        intro.appendChild(sec);
      }
      content.appendChild(intro);
      const tutorialBox = el("div", "guide-tutorial");
      tutorialBox.appendChild(el("div", "panel-label", "新手教程 / 7 步"));
      const tutorialList = el("div", "guide-tutorial-steps");
      for (const step of [
        "1. 先看手牌、行动力和共享流脉。",
        "2. 点击「开始推演」，选择单人或多人的阵营。",
        "3. 点击手牌；随从会自动进入选择的阵位。",
        "4. 带目标的效果先选目标；带阵位的效果先选左/中/右。",
        "5. 点击自己的随从，再点敌方随从或领袖进行攻击；拦截随从优先。",
        "6. 流脉到 4 / 7 / 10 会触发世界事件，12 回流清空。",
        "7. 结束回合，先让对手行动，再继续推演直到领袖生命归零。"
      ]) tutorialList.appendChild(el("span", null, step));
      tutorialBox.appendChild(tutorialList);
      content.appendChild(tutorialBox);
      content.appendChild(el("div", "panel-label section-gap", "关键词"));
      const grid = el("div", "keyword-glossary");
      for (const [label, desc] of Object.entries(KEYWORD_HELP)) {
        const item = el("div", "keyword-glossary-item");
        const iconName = KEYWORD_ICONS[label];
        if (iconName) {
          const img = el("img", "keyword-glossary-icon");
          img.src = "/assets/icons/" + iconName + ".svg";
          img.alt = "";
          item.appendChild(img);
        }
        const body = el("div", "keyword-glossary-copy");
        body.appendChild(el("strong", null, label));
        body.appendChild(el("span", null, desc));
        item.appendChild(body);
        grid.appendChild(item);
      }
      content.appendChild(grid);
      const actions = el("div", "modal-actions");
      const rulesPage = el("button", "btn btn-ghost", "完整规则页");
      rulesPage.onclick = () => { closeModal(true); openRulesScreen("home"); };
      const tutorial = el("button", "btn btn-ghost", "开始实战教学");
      tutorial.onclick = () => { closeModal(true); showScreen("tutorial"); };
      const close = el("button", "btn btn-primary", "关闭");
      close.onclick = () => closeModal(true);
      actions.appendChild(rulesPage);
      actions.appendChild(tutorial);
      actions.appendChild(close);
      content.appendChild(actions);
    });
  }

  function openRulesGuide() {
    openModal((content) => {
      content.appendChild(el("div", "eyebrow", "ARCHIVE / RULES"));
      content.appendChild(el("h3", null, "规则速查"));
      const box = el("div", "guide-sections");
      const sections = [
        ["目标", "把对方领袖生命降到 0。随从可攻击敌方随从或领袖；有拦截的随从必须先处理。"],
        ["行动力", "每回合上限 +1，最高 10。出牌、阵型、领袖技能都消耗行动力。"],
        ["阵位", "左 / 中 / 右三线，每线最多 3 个随从，但全场最多 6 个。同阵位可能触发协同，双方同列互为对位。"],
        ["流脉", "共享流脉 0→12。到达 4 震荡、7 裂隙、10 魔物潮时触发世界事件；12 回流清空。"],
        ["关键词", "登场、余响、拦截、突进、冻结、沉默、引脉、检索等关键词会在卡牌和标签上标明。"],
        ["遗物", "遗物是一张牌，抽到并打出后才装备到领袖身上。"]
      ];
      for (const [title, desc] of sections) {
        const sec = el("div", "guide-section");
        sec.appendChild(el("strong", null, title));
        sec.appendChild(el("span", null, desc));
        box.appendChild(sec);
      }
      content.appendChild(box);
      const actions = el("div", "modal-actions");
      const keys = el("button", "btn btn-ghost", "打开关键词解释");
      keys.onclick = () => { closeModal(true); openKeywordGlossary(); };
      const close = el("button", "btn btn-primary", "关闭");
      close.onclick = () => closeModal(true);
      actions.appendChild(keys);
      actions.appendChild(close);
      content.appendChild(actions);
    });
  }

  function openRank(returnScreen) {
    app.rankReturn = returnScreen || app.screen || "home";
    AudioBox.play("ui_open");
    showScreen("rank");
    renderRankScreen();
  }

  function closeRank() {
    const target = app.rankReturn || "home";
    showScreen(target);
    if (target === "game" && app.game) renderGame();
  }

  function renderRankScreen() {
    const p = app.profile || loadProfile();
    const info = rankInfo(p.rankPoints || 0);
    $("rank-season").textContent = String(p.rankSeason || 1);
    $("rank-tier").textContent = info.tier;
    $("rank-tier").style.color = info.color;
    $("rank-emblem").textContent = info.tier.charAt(0);
    $("rank-emblem").style.color = info.color;
    $("rank-points").textContent = String(p.rankPoints || 0) + " 分";
    $("rank-progress-fill").style.width = info.progress + "%";
    $("rank-next").textContent = info.next == null ? "已达最高段位" : "距离下一段位还差 " + Math.max(0, info.next - (p.rankPoints || 0)) + " 分";
    $("rank-level").textContent = String(1 + Math.floor((p.games || 0) / 5));
    $("rank-wins").textContent = String(p.rankWins || 0);
    $("rank-losses").textContent = String(p.rankLosses || 0);
    $("rank-streak").textContent = String(p.rankStreak || 0);
    $("rank-games").textContent = String(p.games || 0);
    $("rank-total-wins").textContent = String(p.wins || 0);
    $("rank-peak").textContent = String(p.rankPeak || 0);
    $("rank-best-streak").textContent = String(p.rankBestStreak || 0);
    const box = $("rank-history");
    clear(box);
    const rows = (p.history || []).filter(h => h.ranked).slice(0, 8);
    if (!rows.length) { box.appendChild(el("p", "muted", "还没有排位记录。")); return; }
    for (const h of rows) {
      const row = el("div", "rank-history-row");
      const d = new Date(h.at);
      row.appendChild(el("span", null, (d.getMonth() + 1) + "/" + d.getDate()));
      row.appendChild(el("strong", null, factionName(h.faction) + " vs " + factionName(h.opponent)));
      const delta = h.rankDelta || 0;
      row.appendChild(el("span", "rank-delta " + (delta > 0 ? "up" : delta < 0 ? "down" : "flat"), (delta > 0 ? "+" : "") + delta));
      box.appendChild(row);
    }
  }

  function openAchievements() {
    showScreen("achievements");
    renderAchievements();
  }

  function renderAchievements() {
    renderProfileGrid();
    const unlocked = ACHIEVEMENTS.filter(a => app.achievements[a.id] && app.achievements[a.id].unlocked).length;
    $("achievements-summary").textContent = "已解锁 " + unlocked + " / " + ACHIEVEMENTS.length;
    const list = $("achievements-list");
    clear(list);
    for (const a of ACHIEVEMENTS) {
      const rec = app.achievements[a.id] || {};
      const card = el("div", "achievement" + (rec.unlocked ? " unlocked" : ""));
      card.appendChild(el("div", "achievement-icon", a.icon));
      const body = el("div", "achievement-body");
      body.appendChild(el("strong", null, a.name));
      body.appendChild(el("p", null, a.desc));
      if (a.id === "play_10") body.appendChild(el("span", "achievement-progress", (rec.progress || 0) + " / 10 局"));
      card.appendChild(body);
      card.appendChild(el("span", "achievement-state", rec.unlocked ? "已记录" : "未完成"));
      list.appendChild(card);
    }
  }

  function openSettings() {
    showScreen("settings");
    updateSettingsUI();
  }

  function applyVideoPrefs() {
    document.body.classList.toggle("no-bg-animation", !app.bgAnimOn);
    document.body.classList.toggle("reduce-motion", !app.motionOn);
    document.body.classList.toggle("simple-fx", !app.fxOn);
    document.body.classList.toggle("large-text", !!app.textLarge);
    document.documentElement.style.setProperty("--bg-dim", String((app.bgDim || 0) / 100));
  }

  function toggleBgAnim() {
    app.bgAnimOn = !app.bgAnimOn;
    localStorage.setItem("gok_bg_anim", app.bgAnimOn ? "1" : "0");
    applyVideoPrefs();
    updateSettingsUI();
  }

  function toggleMotion() {
    app.motionOn = !app.motionOn;
    localStorage.setItem("gok_motion", app.motionOn ? "1" : "0");
    applyVideoPrefs();
    updateSettingsUI();
  }

  function updateSettingsUI() {
    const b = $("btn-settings-sound");
    if (b) b.textContent = "声音：" + (app.audioOn ? "开" : "关");
    const slider = $("settings-volume");
    if (slider) slider.value = String(Math.round((app.audioVolume == null ? 0.7 : app.audioVolume) * 100));
    const label = $("settings-volume-label");
    if (label) label.textContent = Math.round((app.audioVolume == null ? 0.7 : app.audioVolume) * 100) + "%";
    const fs = $("btn-settings-fullscreen");
    if (fs) fs.textContent = "全屏：" + (document.fullscreenElement ? "开" : "关");
    const bgm = $("btn-settings-bgm");
    if (bgm) bgm.textContent = "音乐：" + (app.bgmOn ? "开" : "关");
    const sfx = $("btn-settings-sfx");
    if (sfx) sfx.textContent = "音效：" + (app.sfxOn ? "开" : "关");
    const bg = $("btn-settings-bg");
    if (bg) bg.textContent = "背景动画：" + (app.bgAnimOn ? "开" : "关");
    const motion = $("btn-settings-motion");
    if (motion) motion.textContent = "动态效果：" + (app.motionOn ? "开" : "关");
    const dmgNum = $("btn-settings-damage");
    if (dmgNum) dmgNum.textContent = "伤害数字：" + (app.damageNumbers ? "开" : "关");
    const fx = $("btn-settings-fx");
    if (fx) fx.textContent = "战斗特效：" + (app.fxOn ? "完整" : "简洁");
    const ai = $("btn-settings-ai");
    if (ai) ai.textContent = "AI：" + (app.aiSpeed === "slow" ? "慢速" : app.aiSpeed === "fast" ? "快速（0.65秒）" : "标准（1秒）");
    const shake = $("btn-settings-shake");
    if (shake) shake.textContent = "震动：" + (app.screenShake ? "开" : "关");
    const textsize = $("btn-settings-textsize");
    if (textsize) textsize.textContent = "文字：" + (app.textLarge ? "大" : "标准");
    const dim = $("settings-dim");
    if (dim) dim.value = String(app.bgDim || 0);
    const dimLabel = $("settings-dim-label");
    if (dimLabel) dimLabel.textContent = (app.bgDim || 0) + "%";
    applyVideoPrefs();
  }

  function toggleFullscreen() {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    } else if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(() => toast("当前环境不允许全屏。"));
    } else {
      toast("当前浏览器不支持全屏。");
    }
  }

  /* ===== 局域网 ===== */
  function lanServerAvailable() {
    return location.protocol === "http:" || location.protocol === "https:";
  }

  function isHostPage() {
    if (!lanServerAvailable()) return false;
    const hostParam = new URLSearchParams(location.search).get("host");
    if (hostParam === "1") return true;
    if (hostParam === "0") return false;
    if (app.roomCode) return false;
    // 本机启动器打开 localhost 时默认是房主；远程设备打开同一地址时默认是挑战者。
    const local = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);
    return local && !sessionStorage.getItem("gok_lan_guest");
  }

  async function lanApi(path, options) {
    if (app.roomCode) path += (path.indexOf("?") >= 0 ? "&" : "?") + "room=" + encodeURIComponent(app.roomCode);
    const res = await fetch(path, Object.assign({ cache: "no-store" }, options || {}));
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || ("HTTP " + res.status));
    return data;
  }

  function lanHeartbeat(player) {
    clearInterval(app.lanHeartbeatTimer);
    const ping = () => lanApi("/api/hello?player=" + player, { method: "POST" }).catch(() => {});
    ping();
    app.lanHeartbeatTimer = setInterval(ping, 2500);
  }

  function syncRankModeUI() {
    document.querySelectorAll(".rank-mode-tab").forEach((b) => {
      b.classList.toggle("active", (b.dataset.lanMode === "ranked") === !!app.lanRanked);
    });
    const hostLabel = $("lan-rank-label");
    if (hostLabel) hostLabel.textContent = "S" + ((app.profile && app.profile.rankSeason) || 1) + " · " + rankText((app.profile && app.profile.rankPoints) || 0);
    const guestRank = $("lan-guest-rank");
    if (guestRank) guestRank.textContent = "我的排位：" + rankText((app.profile && app.profile.rankPoints) || 0);
    const guestMode = $("lan-guest-mode");
    if (guestMode) guestMode.textContent = app.lanRanked ? "排位赛" : "休闲对局";
    const start = $("btn-lan-start");
    if (start && app.lanRanked) start.textContent = start.disabled ? start.textContent : "开始排位";
  }

  async function setLanRanked(ranked) {
    app.lanRanked = !!ranked;
    syncRankModeUI();
    try {
      await lanApi("/api/room/mode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ranked: app.lanRanked })
      });
      AudioBox.play("select");
      toast(app.lanRanked ? "已切换为排位赛。" : "已切换为休闲对局。");
    } catch (e) {
      toast("模式切换失败：" + (e.message || e));
    }
  }

  async function refreshLanStatus() {
    if (!lanServerAvailable()) {
      $("lan-hint").textContent = "局域网模式需要通过启动器打开（Edge 应用模式）。直接打开 HTML 文件只能进行单人推演。";
      $("lan-hint").classList.add("error");
      return;
    }
    try {
      const st = await lanApi("/api/status");
      const url = app.roomCode ? location.origin + "/?room=" + app.roomCode : "http://" + st.ip + ":" + st.port + "/";
      app.lanAddress = url;
      $("lan-address").textContent = url;
      if (!app.roomCode) renderLanAddresses(st);
      updateOnlineRoomBar();
      if ($("lan-guest-address")) $("lan-guest-address").textContent = location.origin + "/";
      app.lanGuestOnline = !!st.guestOnline;
      app.lanGuestFaction = st.guestFaction || null;
      app.lanGuestReady = !!st.guestReady;
      app.lanGuestDecks = st.guestDecks || null;
      app.lanGuestRelic = st.guestRelic || null;
      app.lanGuestDecksReady = !!st.guestDecksReady;
      app.lanRanked = !!st.ranked;
      syncRankModeUI();
      const gf = st.guestFaction && D.FACTIONS[st.guestFaction] ? D.FACTIONS[st.guestFaction].name : "选择阵营中";
      $("lan-status").textContent = st.guestOnline ? (st.guestReady ? "挑战者已准备 · " + gf + " · 牌组已同步" : "挑战者已连接 · " + gf + " · 等待准备") : "等待挑战者连接…";
      $("lan-status").classList.toggle("online", !!st.guestOnline && !!st.guestReady);
      const gfName = $("lan-guest-faction-name");
      if (gfName) gfName.textContent = st.guestOnline ? gf : "等待选择";
      const start = $("btn-lan-start");
      if (start) {
        start.disabled = !(st.guestOnline && st.guestReady && st.guestDecksReady && st.guestFaction);
        start.textContent = st.guestOnline ? (st.guestReady ? (st.guestDecksReady ? (st.guestFaction ? (app.lanRanked ? "开始排位" : "开始对局") : "等待选择阵营") : "等待同步牌组") : "等待挑战者准备") : "等待挑战者";
      }
      $("lan-hint").classList.remove("error");
      $("lan-hint").textContent = "地址在同一个局域网内可访问；如果打不开，请检查 Windows 防火墙是否允许 Edge。";
    } catch (e) {
      $("lan-hint").textContent = "局域网服务器没有响应。请通过启动器打开游戏，或确认端口 4173 未被占用。";
      $("lan-hint").classList.add("error");
      const start = $("btn-lan-start");
      if (start) { start.disabled = true; start.textContent = "服务器未连接"; }
    }
  }

  function lanHasCustom(faction) {
    const custom = app.customDecks[faction];
    return !!(custom && D.validateDeck(faction, custom).ok);
  }

  function updateGuestDeckLabel() {
    const valid = lanHasCustom(app.lanFaction);
    const label = $("lan-guest-deck-label");
    if (label) label.textContent = (valid && app.lanGuestUseCustom ? "自定义牌组" : "预设牌组") + " · 30+1";
    const select = $("lan-guest-deck-select");
    if (select) {
      select.value = app.lanGuestUseCustom && valid ? "custom" : "preset";
      const customOption = select.querySelector('option[value="custom"]');
      if (customOption) customOption.disabled = !valid;
    }
  }

  function updateHostDeckLabel() {
    const valid = lanHasCustom(app.lanFaction);
    const label = $("lan-host-deck-label");
    if (label) label.textContent = (valid && app.lanHostUseCustom ? "自定义牌组" : "预设牌组") + " · 30+1";
    const select = $("lan-host-deck-select");
    if (select) {
      select.value = app.lanHostUseCustom && valid ? "custom" : "preset";
      const customOption = select.querySelector('option[value="custom"]');
      if (customOption) customOption.disabled = !valid;
    }
  }

  function renderLanAddresses(st) {
    const box = $("lan-address-list");
    if (!box) return;
    clear(box);
    const seen = {};
    const port = st.port || 4173;
    const addresses = (st.addresses || []).filter((x) => x && x.address && x.address.indexOf("169.254.") !== 0);
    for (const item of addresses) {
      const url = "http://" + item.address + ":" + port + "/";
      if (seen[url]) continue;
      seen[url] = true;
      const row = el("button", "lan-address-item");
      const label = el("span", "lan-address-url", url);
      const adapter = el("small", null, (item.name || "本机网卡") + " · 端口 " + port);
      const copy = el("em", null, "复制");
      row.appendChild(label);
      row.appendChild(adapter);
      row.appendChild(copy);
      row.onclick = () => {
        if (navigator.clipboard) navigator.clipboard.writeText(url).then(() => toast("已复制：" + url)).catch(() => toast(url));
        else toast(url);
      };
      box.appendChild(row);
    }
    if (!addresses.length) box.appendChild(el("div", "lan-address-empty", "未检测到可用网卡地址。"));
  }

  function initLanScreen() {
    app.lanHostPage = isHostPage();
    app.lanGuestOnline = false;
    clearInterval(app.lanStatusTimer);
    clearInterval(app.lanHeartbeatTimer);
    if (!lanServerAvailable()) {
      $("lan-host-panel").hidden = true;
      $("lan-guest-panel").hidden = true;
      $("lan-title").textContent = "局域网未启动";
      $("lan-intro").textContent = "局域网对战需要房主通过启动器打开，挑战者用浏览器访问房主地址。";
      $("lan-hint").textContent = "直接打开 HTML 文件时，浏览器无法提供局域网中继服务。";
      $("lan-hint").classList.add("error");
      return;
    }
    $("lan-hint").classList.remove("error");
    if (app.lanHostPage) {
      clearInterval(app.lanHeartbeatTimer);
      lanHeartbeat(0);
      refreshResumePanel();
      $("lan-role-label").textContent = app.roomCode ? "ONLINE / HOST" : "HOST / ROOM";
      $("lan-title").textContent = app.roomCode ? "在线房间" : "建立房间";
      $("lan-intro").textContent = app.roomCode ? "把邀请链接发给朋友，对方打开后选择阵营并准备。" : "把下面的地址发给同一局域网内的挑战者。对手用浏览器打开后，即可坐到你的对面。";
      $("lan-host-panel").hidden = false;
      $("lan-guest-panel").hidden = true;
      const isPrivateHost = /^(localhost|127\.|192\.168\.|10\.|172\.(1[6-9]|2\d|3[01])\.)/.test(location.hostname) || location.protocol === "file:";
      if (!isPrivateHost) {
        app.lanPublicUrl = location.origin;
        const pinput = $("lan-public-input"); if (pinput) pinput.value = location.origin;
        const pst = $("lan-public-status"); if (pst) { pst.textContent = location.origin; pst.classList.add("ok"); }
      }
      $("lan-status").textContent = "等待挑战者连接…";
      $("lan-status").classList.remove("online");
      $("lan-hint").textContent = "正在检测局域网与服务器…";
      document.querySelectorAll("#lan-faction .faction-card").forEach((b) => { b.classList.toggle("active", b.dataset.lanFaction === app.lanFaction); b.style.setProperty("--emblem", "url('" + D.FACTIONS[b.dataset.lanFaction].emblem + "')"); });
      updateHostDeckLabel();
      app.lanStatusTimer = setInterval(refreshLanStatus, 1400);
      refreshLanStatus();
    } else {
      $("lan-role-label").textContent = app.roomCode ? "ONLINE / GUEST" : "GUEST / CHALLENGER";
      $("lan-title").textContent = app.roomCode ? "加入在线房间" : "加入房间";
      $("lan-intro").textContent = app.roomCode ? "选择你的阵营，编成自己的牌组，然后准备。" : "选择你的阵营，编成自己的牌组，然后加入房主的对局。";
      $("lan-host-panel").hidden = true;
      $("lan-guest-panel").hidden = false;
      $("lan-guest-address").textContent = app.roomCode ? location.origin + "/?room=" + app.roomCode : location.origin + "/";
      const joinBtn = $("btn-lan-join");
      if (joinBtn) { joinBtn.disabled = false; joinBtn.textContent = "准备"; }
      try { const sf = sessionStorage.getItem("gok_lan_faction"); if (sf && D.FACTIONS[sf]) app.lanFaction = sf; } catch (e) {}
      document.querySelectorAll("#lan-guest-faction .faction-card").forEach((b) => {
        b.disabled = false;
        b.classList.toggle("active", b.dataset.guestFaction === app.lanFaction);
        b.style.setProperty("--emblem", "url('" + D.FACTIONS[b.dataset.guestFaction].emblem + "')");
      });
      const gd = $("btn-lan-guest-deck"); if (gd) gd.disabled = false;
      const gsel = $("lan-guest-deck-select"); if (gsel) gsel.disabled = false;
      updateGuestDeckLabel();
      $("lan-guest-status").textContent = "尚未准备";
    }
    syncRankModeUI();
    updateOnlineRoomBar();
  }

  function initLanEvents() {
    document.querySelectorAll(".rank-mode-tab").forEach((b) => {
      b.onclick = () => setLanRanked(b.dataset.lanMode === "ranked");
    });
    const copy = $("btn-copy-lan");
    if (copy) copy.onclick = () => {
      const text = app.lanAddress || $("lan-address").textContent;
      if (navigator.clipboard && text) {
        navigator.clipboard.writeText(text).then(() => toast("地址已复制。")).catch(() => toast(text));
      } else {
        toast(text);
      }
    };
    document.querySelectorAll("#lan-faction .faction-card").forEach((b) => {
      b.onclick = () => {
        app.lanFaction = b.dataset.lanFaction;
        document.querySelectorAll("#lan-faction .faction-card").forEach((x) => x.classList.toggle("active", x === b));
        updateHostDeckLabel();
        AudioBox.play("click");
      };
    });
    document.querySelectorAll("#lan-guest-faction .faction-card").forEach((b) => {
      b.onclick = () => {
        if (b.disabled) return;
        app.lanFaction = b.dataset.guestFaction;
        try { sessionStorage.setItem("gok_lan_faction", app.lanFaction); } catch (e) {}
        document.querySelectorAll("#lan-guest-faction .faction-card").forEach((x) => x.classList.toggle("active", x === b));
        updateGuestDeckLabel();
        AudioBox.play("click");
      };
    });
    const guestDeck = $("btn-lan-guest-deck");
    if (guestDeck) guestDeck.onclick = () => { AudioBox.play("ui_open"); openDeckBuilder(app.lanFaction || "pus", "lan"); };
    const hostDeck = $("btn-lan-host-deck");
    if (hostDeck) hostDeck.onclick = () => { AudioBox.play("ui_open"); openDeckBuilder(app.lanFaction || "pus", "lan"); };
    const hostSelect = $("lan-host-deck-select");
    if (hostSelect) hostSelect.onchange = () => { app.lanHostUseCustom = hostSelect.value === "custom" && lanHasCustom(app.lanFaction); updateHostDeckLabel(); };
    const guestSelect = $("lan-guest-deck-select");
    if (guestSelect) guestSelect.onchange = () => { app.lanGuestUseCustom = guestSelect.value === "custom" && lanHasCustom(app.lanFaction); updateGuestDeckLabel(); };
    const publicBtn = $("btn-lan-public");
    if (publicBtn) publicBtn.onclick = () => {
      const input = $("lan-public-input");
      const raw = (input ? input.value : "").trim().replace(/\/+$/, "");
      if (!/^https?:\/\/[^\s]+$/i.test(raw)) { toast("请填写完整的 http(s) 公网地址。"); return; }
      app.lanPublicUrl = raw;
      const st = $("lan-public-status");
      if (st) { st.textContent = raw; st.classList.add("ok"); }
      if (st) st.title = "把这个地址发给远程对手";
      AudioBox.play("ui_open");
      toast("公网地址已设置，复制后发给远程对手。");
    };
    const publicCopy = $("btn-copy-public");
    if (publicCopy) publicCopy.onclick = () => {
      const input = $("lan-public-input");
      const text = app.lanPublicUrl || (input ? input.value.trim() : "");
      if (!text) { toast("还没有填写公网地址。"); return; }
      if (navigator.clipboard) navigator.clipboard.writeText(text).then(() => toast("公网地址已复制。")).catch(() => toast(text));
      else toast(text);
    };
    const start = $("btn-lan-start");
    if (start) start.onclick = () => hostStartLan();
    const resume = $("btn-lan-resume");
    if (resume) resume.onclick = () => resumeHostGame();
    const join = $("btn-lan-join");
    if (join) join.onclick = () => joinLanRoom();
  }

  function stopNet(clearGame) {
    if (app.lanStatusTimer) clearInterval(app.lanStatusTimer);
    if (app.lanHeartbeatTimer) clearInterval(app.lanHeartbeatTimer);
    if (app.lanPollTimer) clearTimeout(app.lanPollTimer);
    if (app.lanWaitTimer) clearTimeout(app.lanWaitTimer);
    app.lanStatusTimer = null;
    app.lanHeartbeatTimer = null;
    app.lanPollTimer = null;
    app.lanWaitTimer = null;
    app.lanPollBusy = false;
    app.net = null;
    app.lanEndShown = false;
    try { sessionStorage.removeItem("gok_lan_guest"); } catch (e) {}
    clearHostSession();
    if (clearGame && app.screen !== "game") app.game = null;
  }

  async function hostStartLan() {
    if (!app.lanGuestOnline) { toast("挑战者还没有连接。"); return; }
    if (!app.lanGuestReady) { toast("挑战者还没有准备。"); return; }
    if (!app.lanGuestDecksReady) { toast("挑战者还没有同步牌组。"); return; }
    try { await lanApi("/api/reset", { method: "POST" }); } catch (e) {}
    clearHostSession();
    const faction = app.lanFaction || "pus";
    const other = app.lanGuestFaction || D.nextFaction(faction);
    const seed = (Date.now() >>> 0) ^ Math.floor(Math.random() * 0x7fffffff);
    const state = E.createGame({
      faction1: faction,
      faction2: other,
      p1AI: false,
      p2AI: false,
      mode: "lan",
      mulligan: true,
      p1Deck: getPlayDeck(faction),
      p2Deck: (() => {
        const active = app.lanGuestRelic || activeRelicFor(other);
        const gd = app.lanGuestDecks && app.lanGuestDecks[other];
        const source = gd && D.validateDeck(other, gd).ok ? gd : D.DECKS[other];
        return source.filter(id => { const def = D.CARDS[id]; return !def || def.type !== "relic" || id === active; });
      })(),
      seed: seed
    });
    state.ranked = !!app.lanRanked;
    state.players[0].name = "房主";
    state.players[1].name = "挑战者";
    app.game = state;
    app.net = { role: "host", player: 0, active: true, since: 0 };
    app.human = 0;
    app.aiPlayer = null;
    app.local = false;
    app.viewer = 0;
    app.mode = "lan";
    app.busy = false;
    app.mulliganOpen = false;
    app.mulliganSubmitted = false;
    app.mulliganSelected = new Set();
    app.lanEndShown = false;
    try { sessionStorage.setItem("gok_host_active", "1"); } catch (e) {}
    app.lastVein = state.vein;
    app.lastThresholds = Object.assign({}, state.stats.thresholds);
    app.lanSince = 0;
    closeModal(true);
    showScreen("game");
    AudioBox.play("ui_open");
    renderGame();
    sendNet({ type: "state", state: redactStateForGuest(state) });
    startNetPoll(0);
    lanHeartbeat(0);
    if (state.current === 0) showTurnBanner("你的回合");
    else toast("已开始，等待挑战者行动。");
  }

  async function joinLanRoom() {
    if (!lanServerAvailable()) { toast("当前不是局域网模式。"); return; }
    const join = $("btn-lan-join");
    if (join) { join.disabled = true; join.textContent = "连接中…"; }
    try {
      await lanApi("/api/join?player=1", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decks: (app.lanGuestUseCustom && lanHasCustom(app.lanFaction)) ? (() => { const d = {}; d[app.lanFaction || "pus"] = app.customDecks[app.lanFaction || "pus"].slice(); return d; })() : {}, faction: app.lanFaction || "pus", relic: activeRelicFor(app.lanFaction || "pus") })
      });
      app.net = { role: "guest", player: 1, active: true, since: 0 };
      app.lanGuestFaction = app.lanFaction || "pus";
      try { sessionStorage.setItem("gok_lan_faction", app.lanFaction || "pus"); } catch (e) {}
      document.querySelectorAll("#lan-guest-faction .faction-card").forEach((b) => { b.disabled = true; });
      const gd = $("btn-lan-guest-deck"); if (gd) gd.disabled = true;
      const gsel = $("lan-guest-deck-select"); if (gsel) gsel.disabled = true;
      app.lanGuestReady = true;
      if (join) { join.disabled = true; join.textContent = "已准备"; }
      if ($("lan-guest-status")) $("lan-guest-status").textContent = "已准备 · " + factionName(app.lanFaction || "pus") + " · 等待房主开始";
      app.lanEndShown = false;
      try { sessionStorage.setItem("gok_lan_guest", "1"); } catch (e) {}
      lanHeartbeat(1);
      startNetPoll(1);
      setTimeout(() => sendNet({ type: "action", action: { kind: "sync" } }), 350);
      AudioBox.play("ui_open");
    } catch (e) {
      if (join) { join.disabled = false; join.textContent = "准备"; }
      toast("无法加入房间：" + (e.message || e));
    }
  }

  function startNetPoll(player, initialSince) {
    if (app.lanPollTimer) clearTimeout(app.lanPollTimer);
    app.lanSince = initialSince || 0;
    app.lanPollBusy = false;
    const poll = async () => {
      if (!app.net || !app.net.active) return;
      if (app.lanPollBusy) { app.lanPollTimer = setTimeout(poll, 260); return; }
      app.lanPollBusy = true;
      try {
        const data = await lanApi("/api/poll?player=" + player + "&since=" + app.lanSince);
        app.lanSince = Math.max(app.lanSince, data.seq || 0);
        for (const msg of data.messages || []) {
          if (player === 0) {
            if (msg.payload && msg.payload.type === "action") applyGuestAction(msg.payload.action);
          } else {
            if (msg.payload && msg.payload.type === "state") applyGuestState(msg.payload.state);
          }
        }
      } catch (e) {
        // 网络中断时保持页面，下一次重试
      } finally {
        app.lanPollBusy = false;
        if (app.net && app.net.active) app.lanPollTimer = setTimeout(poll, 280);
      }
    };
    app.lanPollTimer = setTimeout(poll, 200);
  }

  function sendNet(payload) {
    if (!app.net || !lanServerAvailable()) return Promise.resolve(null);
    return lanApi("/api/send?player=" + app.net.player, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    }).catch(() => null);
  }

  let netBroadcastTimer = null;
  function scheduleNetBroadcast() {
    if (!app.net || app.net.role !== "host" || !app.net.active || !app.game) return;
    if (netBroadcastTimer) return;
    netBroadcastTimer = setTimeout(() => {
      netBroadcastTimer = null;
      sendNet({ type: "state", state: redactStateForGuest(app.game) });
    }, 60);
  }

  function redactStateForGuest(state) {
    const copy = JSON.parse(JSON.stringify(state));
    const host = copy.players[0];
    host.hand = host.hand.map((c, i) => ({ uid: "hidden_h" + i, cardId: "hidden" }));
    host.deck = host.deck.map((c, i) => ({ uid: "hidden_d" + i, cardId: "hidden" }));
    copy.log = copy.log.map((entry) => {
      if (entry.player === 0 && (entry.type === "draw" || entry.type === "discover" || entry.type === "burn")) {
        return Object.assign({}, entry, { text: "对手进行了一次档案操作。" });
      }
      return entry;
    });
    if (copy.pendingChoice && copy.pendingChoice.player === 0) {
      copy.pendingChoice = Object.assign({}, copy.pendingChoice, { options: ["hidden", "hidden", "hidden"] });
    }
    return copy;
  }

  function applyGuestState(state) {
    if (!state || !app.net || app.net.role !== "guest") return;
    const firstState = app.screen !== "game";
    const prevCurrent = app.game ? app.game.current : null;
    const prevActionSeq = app.game && app.game.lastAction ? app.game.lastAction.seq : 0;
    app.game = state;
    app.human = 1;
    app.viewer = 1;
    app.aiPlayer = null;
    app.local = false;
    app.mode = "lan";
    app.busy = false;
    app.animating = false;
    if (app.lanWaitTimer) { clearTimeout(app.lanWaitTimer); app.lanWaitTimer = null; }
    if (firstState) {
      app.mulliganOpen = false;
      app.mulliganSubmitted = false;
      app.mulliganSelected = new Set();
      app.lastVein = state.vein;
      app.lastThresholds = Object.assign({}, state.stats.thresholds);
      closeModal(true);
      showScreen("game");
      AudioBox.play("ui_open");
      showTurnBanner("对局开始");
    }
    renderGame();
    if (state.pendingChoice && state.pendingChoice.player === 1) {
      if (!app.modalOpen) showDiscover();
    } else if (state.status === "gameover") {
      if (!app.lanEndShown) { app.lanEndShown = true; showEnd(); }
    }
    if (!firstState && prevCurrent !== state.current && state.status === "playing") {
      showTurnBanner(state.current === 1 ? "你的回合" : "对手回合");
    }
    if (!firstState && state.lastAction && state.lastAction.seq !== prevActionSeq && state.lastAction.player === 0) {
      const act = state.lastAction;
      if (act.type === "attack") setTimeout(() => animateRemoteAttack(act.attackerUid, act.targetUid, 0), 0);
      else if (act.type === "play") setTimeout(() => animateRemotePlay(act), 0);
      else if (act.type === "heroPower") setTimeout(() => animateRemoteAbility(act), 0);
    }
  }

  function applyGuestAction(action) {
    if (!action || !app.net || app.net.role !== "host") return;
    if (action.kind === "sync") {
      if (app.game) sendNet({ type: "state", state: redactStateForGuest(app.game) });
      return;
    }
    if (!app.game) return;
    if (action.kind === "surrender") {
      app.game.status = "gameover";
      app.game.winner = 0;
      sendNet({ type: "state", state: redactStateForGuest(app.game) });
      renderGame();
      showEnd();
      return;
    }
    if (action.kind === "mulligan") {
      if (app.game.mulliganPhase) E.mulliganPlayer(app.game, 1, action.uids || []);
      renderGame();
      return;
    }
    if (app.game.current !== 1 || app.game.status !== "playing") return;
    const prevCurrent = app.game.current;
    const playedDef = action.kind === "play" ? (() => { const h = app.game.players[1].hand.find(c => c.uid === action.cardUid); return h ? D.CARDS[h.cardId] : null; })() : null;
    let result = { ok: false };
    if (action.kind === "play") result = E.playCard(app.game, 1, action.cardUid, { targetUid: action.targetUid || null, targetUid2: action.targetUid2 || null, zone: action.zone || null, payBlood: !!action.payBlood });
    else if (action.kind === "attack") result = E.attack(app.game, 1, action.attackerUid, action.targetUid);
    else if (action.kind === "heroPower") result = E.useHeroPower(app.game, 1, action.targetUid);
    else if (action.kind === "end") result = E.endTurn(app.game, 1);
    else if (action.kind === "discover") result = E.resolveDiscover(app.game, 1, action.cardId);
    else if (action.kind === "retreat") result = E.retreatMinion(app.game, 1, action.uid);
    if (!result || !result.ok) {
      // 回发当前状态，让挑战者解除等待
      sendNet({ type: "state", state: redactStateForGuest(app.game) });
      return;
    }
    const turnChanged = app.game.current !== prevCurrent;
    renderGame();
    if (checkGameOverAfterAction()) return;
    if (action.kind === "attack" && result.ok) {
      setTimeout(() => animateRemoteAttack(action.attackerUid, action.targetUid, 1), 0);
    }
    if (playedDef) {
      setTimeout(() => showPlayFeedback(playedDef, { x: innerWidth / 2, y: innerHeight * 0.45 }, null), 0);
    } else if (action.kind === "play" && result.ok) {
      const act = app.game.lastAction;
      if (act && act.type === "play") setTimeout(() => animateRemotePlay(act), 0);
    } else if (action.kind === "heroPower" && result.ok) {
      const act = app.game.lastAction;
      if (act && act.type === "heroPower") setTimeout(() => animateRemoteAbility(act), 0);
    }
    if (turnChanged) {
      if (app.game.current === 0) showTurnBanner("你的回合");
      else showTurnBanner("对手回合");
    }
  }

  function animateRemoteAttack(attackerUid, targetUid, attackerOwner) {
    if (!app.game) return;
    const attackerEl = document.querySelector('.board-card[data-minion="' + attackerUid + '"]');
    const targetHeroId = attackerOwner === app.viewer ? "opponent-hero" : "player-hero";
    const targetEl = targetUid === "hero" ? document.getElementById(targetHeroId) : document.querySelector('.board-card[data-minion="' + targetUid + '"]');
    if (!attackerEl || !targetEl) return;
    const ar = attackerEl.getBoundingClientRect();
    const tr = targetEl.getBoundingClientRect();
    attackerEl.classList.add(attackerOwner === app.viewer ? "attack-up" : "attack-down");
    setTimeout(() => targetEl.classList.add("hit"), 100);
    setTimeout(() => showAttackLine(ar.left + ar.width / 2, ar.top + ar.height / 2, tr.left + tr.width / 2, tr.top + tr.height / 2), 80);
    setTimeout(() => showImpact((ar.left + tr.left + tr.width) / 2, (ar.top + tr.top + tr.height) / 2), 160);
    setTimeout(() => showImpact(tr.left + tr.width / 2, tr.top + tr.height / 2), 210);
    AudioBox.play("battle");
    setTimeout(() => {
      attackerEl.classList.remove("attack-up", "attack-down");
      targetEl.classList.remove("hit");
    }, 560);
  }

  function animateRemotePlay(action) {
    const def = D.CARDS[action.cardId];
    if (!def) return;
    showPlayFeedback(def, { x: innerWidth / 2, y: innerHeight * 0.52 }, null);
  }

  function animateRemoteAbility(action) {
    const hero = D.HEROES[action.heroId];
    const name = (hero && hero.power && hero.power.name) || action.powerName || "领袖技能";
    showAbilityFeedback(name, { x: innerWidth / 2, y: innerHeight * 0.52 });
  }

  function guestAnimateAttack(attackerUid, targetUid) {
    if (!app.net || app.net.role !== "guest") return false;
    const attackerEl = document.querySelector('.board-card[data-minion="' + attackerUid + '"]');
    const targetEl = targetUid === "hero" ? $("opponent-hero") : document.querySelector('.board-card[data-minion="' + targetUid + '"]');
    if (!attackerEl || !targetEl) return false;
    const ar = attackerEl.getBoundingClientRect();
    const tr = targetEl.getBoundingClientRect();
    attackerEl.classList.add("attack-up");
    setTimeout(() => targetEl.classList.add("hit"), 100);
    setTimeout(() => showAttackLine(ar.left + ar.width / 2, ar.top + ar.height / 2, tr.left + tr.width / 2, tr.top + tr.height / 2), 80);
    setTimeout(() => showImpact((ar.left + tr.left + tr.width) / 2, (ar.top + tr.top + tr.height) / 2), 160);
    setTimeout(() => showImpact(tr.left + tr.width / 2, tr.top + tr.height / 2), 210);
    AudioBox.play("battle");
    app.selectedCard = null;
    app.attacker = null;
    app.targetInfo = null;
    app.targetInfo = null;
    setTimeout(() => {
      guestSendAction({ kind: "attack", attackerUid: attackerUid, targetUid: targetUid });
    }, 280);
    return true;
  }

  function guestSendAction(action) {
    if (!app.net || app.net.role !== "guest") return false;
    app.busy = true;
    app.currentHint = "等待房主结算…";
    renderGame();
    sendNet({ type: "action", action: action });
    if (app.lanWaitTimer) clearTimeout(app.lanWaitTimer);
    app.lanWaitTimer = setTimeout(() => {
      if (app.busy) {
        app.busy = false;
        renderGame();
        toast("房主暂时没有响应。");
      }
    }, 3500);
    return true;
  }

  function preloadArt() {
    const urls = new Set();
    for (const id of Object.keys(D.CARDS)) {
      const d = D.CARDS[id];
      if (d.art) urls.add(portraitImage(d.art));
    }
    for (const id of Object.keys(D.HEROES)) urls.add(heroImage(id));
    urls.add("assets/backgrounds/menu.webp");
    urls.add("assets/backgrounds/battle.webp");
    urls.forEach((u) => { const img = new Image(); img.src = u; });
  }

  function startHostKeepAlive() {
    if (!isHostPage() || app.hostKeepAliveTimer) return;
    const ping = () => {
      fetch("/api/hello?player=0", { method: "POST" }).catch(() => {});
    };
    ping();
    app.hostKeepAliveTimer = setInterval(ping, 20000);
  }

  function autoReconnectOnLoad() {
    if (!lanServerAvailable()) return;
    if (isHostPage()) {
      const saved = loadHostSession();
      if (saved) {
        showScreen("lan");
        initLanScreen();
        let active = false;
        try { active = sessionStorage.getItem("gok_host_active") === "1"; } catch (e) {}
        if (active) setTimeout(() => resumeHostGame(), 450);
      }
      return;
    }
    let guestSession = false;
    try { guestSession = sessionStorage.getItem("gok_lan_guest") === "1"; } catch (e) {}
    if (!guestSession) return;
    setTimeout(() => {
      if (app.screen !== "home") return;
      showScreen("lan");
      initLanScreen();
      joinLanRoom();
    }, 450);
  }

  /* ===== init ===== */
  function updateOnlineRoomBar() {
    const bar = $("lan-online-bar");
    if (!bar) return;
    bar.hidden = !app.roomCode;
    if (!app.roomCode) return;
    const link = location.origin + "/?room=" + encodeURIComponent(app.roomCode);
    bar.dataset.link = link;
    const code = $("lan-online-code");
    if (code) code.textContent = app.roomCode;
    const copy = $("btn-copy-online-link");
    if (copy) copy.onclick = () => {
      const text = bar.dataset.link || link;
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(() => toast("邀请链接已复制。")).catch(() => toast(text));
      else toast(text);
    };
  }

  function openOnlineLobby() {
    openModal((content) => {
      content.appendChild(el("div", "eyebrow", "ONLINE / ROOM CODE"));
      content.appendChild(el("h3", null, "在线房间"));
      content.appendChild(el("p", null, "创建一个房间，把邀请链接发给朋友；也可以输入朋友发来的 6 位房间码。"));
      const input = el("input", "online-code-input");
      input.placeholder = "输入 6 位房间码";
      input.maxLength = 6;
      input.autocomplete = "off";
      content.appendChild(input);
      const actions = el("div", "modal-actions online-actions");
      const create = el("button", "btn btn-primary", "创建房间");
      create.onclick = async () => {
        create.disabled = true;
        try {
          const res = await fetch("/api/room/create", { method: "POST", cache: "no-store" });
          const data = await res.json();
          if (!res.ok || !data.code) throw new Error(data.error || "创建失败");
          const url = new URL(location.href);
          url.searchParams.set("room", data.code);
          url.searchParams.set("host", "1");
          location.href = url.toString();
        } catch (e) {
          create.disabled = false;
          toast("创建房间失败：" + (e.message || e));
        }
      };
      const join = el("button", "btn btn-ghost", "加入房间");
      join.onclick = async () => {
        const code = input.value.trim().toLowerCase();
        if (!/^[a-z0-9]{6}$/.test(code)) { toast("请输入 6 位房间码。"); return; }
        join.disabled = true;
        try {
          const res = await fetch("/api/status?room=" + encodeURIComponent(code), { cache: "no-store" });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || "房间不存在");
          const url = new URL(location.href);
          url.searchParams.set("room", code);
          url.searchParams.delete("host");
          location.href = url.toString();
        } catch (e) {
          join.disabled = false;
          toast("无法加入：" + (e.message || e));
        }
      };
      actions.appendChild(join);
      actions.appendChild(create);
      content.appendChild(actions);
    });
  }

  function initOnlineFromQuery() {
    try {
      const code = (new URLSearchParams(location.search).get("room") || "").toLowerCase();
      if (/^[a-z0-9]{6}$/.test(code)) { app.roomCode = code; app.onlineMode = true; }
    } catch (e) {}
    if (!app.roomCode) return;
    showScreen("lan");
    initLanScreen();
    updateOnlineRoomBar();
  }


  function initDepthVisuals() {
    const screen = document.getElementById("screen-game");
    const field = document.getElementById("battlefield");
    const sceneHost = field || screen;
    if (sceneHost && !sceneHost.querySelector(".scene-ambient")) {
      const layer = el("div", "scene-ambient");
      layer.setAttribute("aria-hidden", "true");
      for (const cls of ["mist", "mist m2", "mist m3"]) layer.appendChild(el("div", cls));
      for (const cls of ["ray", "ray ray2"]) layer.appendChild(el("div", cls));
      for (let i = 0; i < 22; i++) {
        const mote = el("i", "mote");
        const teal = i % 4 === 0;
        mote.style.setProperty("--x", (Math.random() * 100).toFixed(2) + "%");
        mote.style.setProperty("--dx", (Math.random() * 90 - 45).toFixed(1) + "px");
        mote.style.setProperty("--s", (Math.random() * 2.6 + 1.6).toFixed(1) + "px");
        mote.style.setProperty("--dur", (Math.random() * 9 + 12).toFixed(1) + "s");
        mote.style.setProperty("--delay", (-Math.random() * 18).toFixed(1) + "s");
        mote.style.setProperty("--c", teal ? "rgba(125,224,206,.6)" : "rgba(242,198,109,.6)");
        layer.appendChild(mote);
      }
      layer.appendChild(el("div", "scan"));
      sceneHost.insertBefore(layer, sceneHost.firstChild);
    }
    if (field && !field.querySelector(".board-playmat")) field.insertBefore(el("div", "board-playmat"), field.firstChild);
    if (field && !field.querySelector(".board-frame")) field.insertBefore(el("div", "board-frame"), field.firstChild);
    if (field && !field.querySelector(".board-inlay")) {
      const inlay = el("div", "board-inlay");
      inlay.appendChild(el("i", null, ""));
      inlay.appendChild(el("i", null, ""));
      inlay.appendChild(el("i", null, ""));
      field.insertBefore(inlay, field.firstChild);
    }
    if (window.matchMedia && window.matchMedia("(pointer: coarse)").matches) return;
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let queued = false;
    let last = null;
    const clearTilt = (node) => {
      if (!node) return;
      node.style.setProperty("--rx", "0deg");
      node.style.setProperty("--ry", "0deg");
      node.style.setProperty("--glare", "0");
    };
    const clearHero = (node) => {
      if (!node) return;
      node.style.setProperty("--hero-rx", "0deg");
      node.style.setProperty("--hero-ry", "0deg");
      node.style.setProperty("--hero-glare", "0");
    };
    document.addEventListener("pointermove", (ev) => {
      last = ev;
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => {
        queued = false;
        if (!last || !last.target || !last.target.closest) return;
        if (document.body.classList.contains("reduce-motion") || document.body.classList.contains("simple-fx")) return;
        if (app.draggingUid) return;
        const card = last.target.closest(".hand-card, .board-card, .codex-card");
        const hero = last.target.closest(".hero-panel");
        if (card || hero) {
          const node = card || hero;
          const rect = node.getBoundingClientRect();
          if (!rect.width || !rect.height) return;
          const nx = Math.max(-1, Math.min(1, (last.clientX - rect.left) / rect.width * 2 - 1));
          const ny = Math.max(-1, Math.min(1, (last.clientY - rect.top) / rect.height * 2 - 1));
          if (card) {
            if (card.classList.contains("disabled")) return;
            card.style.setProperty("--ry", (nx * 7.5).toFixed(2) + "deg");
            card.style.setProperty("--rx", (-ny * 6.5).toFixed(2) + "deg");
            card.style.setProperty("--mx", ((nx + 1) * 50).toFixed(1) + "%");
            card.style.setProperty("--my", ((ny + 1) * 50).toFixed(1) + "%");
            card.style.setProperty("--glare", "0.52");
          } else {
            hero.style.setProperty("--hero-ry", (nx * 4.2).toFixed(2) + "deg");
            hero.style.setProperty("--hero-rx", (-ny * 3.2).toFixed(2) + "deg");
            hero.style.setProperty("--hero-mx", ((nx + 1) * 50).toFixed(1) + "%");
            hero.style.setProperty("--hero-my", ((ny + 1) * 50).toFixed(1) + "%");
            hero.style.setProperty("--hero-glare", "0.35");
          }
        }
        if (document.body.dataset.screen === "game") {
          const nx = last.clientX / window.innerWidth - 0.5;
          const ny = last.clientY / window.innerHeight - 0.5;
          document.body.style.setProperty("--bg-x", (nx * -12).toFixed(2) + "px");
          document.body.style.setProperty("--bg-y", (ny * -8).toFixed(2) + "px");
        }
      });
    }, { passive: true });
    document.addEventListener("pointerout", (ev) => {
      if (!ev.target || !ev.target.closest) return;
      const card = ev.target.closest(".hand-card, .board-card, .codex-card");
      const hero = ev.target.closest(".hero-panel");
      if (card && (!ev.relatedTarget || !card.contains(ev.relatedTarget))) clearTilt(card);
      if (hero && (!ev.relatedTarget || !hero.contains(ev.relatedTarget))) clearHero(hero);
    }, { passive: true });
  }

  function init() {
    AudioBox.init();
    applyVideoPrefs();
    preloadArt();
    loadCustomDecks();
    loadActiveRelics();
    loadAchievements();
    app.profile = loadProfile();
    ensureAccount();
    snapshotSave("startup");
    updateHomeProfile();
    updateHomeAccount();
    setTimeout(maybePromptArchiveName, 1200);
    updateHomeLegendary();
    const savedHomeMode = (() => { try { return localStorage.getItem("gok_home_mode") || "classic"; } catch (e) { return "classic"; } })();
    setHomeMode(savedHomeMode);
    document.querySelectorAll("[data-home-mode]").forEach((b) => { b.onclick = () => { AudioBox.play("ui_open"); setHomeMode(b.dataset.homeMode); }; });
    if ($("btn-start-adventure")) $("btn-start-adventure").onclick = () => { if (app.homeMode === "arcade" && global.GokContent) global.GokContent.open(); else openStartMenu(); };
    if ($("btn-mode-multi")) $("btn-mode-multi").onclick = () => setStartSubmenu(true);
    if ($("btn-mode-back")) $("btn-mode-back").onclick = () => setStartSubmenu(false);
    if ($("start-menu-close")) $("start-menu-close").onclick = () => closeStartMenu();
    const startBackdrop = document.querySelector(".start-menu-backdrop");
    if (startBackdrop) startBackdrop.onclick = () => closeStartMenu();
    $("btn-solo").onclick = () => { closeStartMenu(); AudioBox.play("ui_open"); showScreen("setup"); setupState(); };
    $("btn-deck-home").onclick = () => { AudioBox.play("ui_open"); openDeckBuilder(app.faction || "pus", "home"); };
    if ($("btn-content-home")) $("btn-content-home").onclick = () => { AudioBox.play("ui_open"); if (global.GokContent) global.GokContent.open(); };
    if ($("btn-home-account")) $("btn-home-account").onclick = () => { AudioBox.play("ui_open"); openAccountModal(); afterAccountUI(); };
    window.addEventListener("gok-content-changed", () => scheduleSaveBackup());
    window.addEventListener("resize", () => { if (app.screen === "game") requestAnimationFrame(fitHandToWidth); });
    if ($("btn-tutorial")) $("btn-tutorial").onclick = () => { closeStartMenu(); AudioBox.play("ui_open"); showScreen("tutorial"); };
    $("btn-codex").onclick = () => { AudioBox.play("ui_open"); openCodex(); };
    document.querySelectorAll("[data-ai-diff]").forEach((b) => { b.onclick = () => { app.aiDifficulty = b.dataset.aiDiff; document.querySelectorAll("[data-ai-diff]").forEach((x) => x.classList.toggle("active", x === b)); }; });
    if ($("codex-search")) $("codex-search").oninput = (e) => { app.codexSearch = e.target.value; app.codexLimit = 60; renderCodex(); };
    const fieldDrop = $("battlefield");
    if (fieldDrop) {
      fieldDrop.addEventListener("dragover", (ev) => {
        if (!app.draggingUid) return;
        const def = handDef(app.draggingUid);
        if (!def || def.type !== "spell") return;
        const opt = E.getPlayOptions(app.game, app.game.current, app.draggingUid);
        if (!opt.ok) return;
        if (ev.target.closest && ev.target.closest(".zone, .board-card")) return;
        ev.preventDefault();
        fieldDrop.classList.add("drop-ready");
      });
      fieldDrop.addEventListener("dragleave", (ev) => { if (!fieldDrop.contains(ev.relatedTarget)) fieldDrop.classList.remove("drop-ready"); });
      fieldDrop.addEventListener("drop", (ev) => {
        fieldDrop.classList.remove("drop-ready");
        if (!app.draggingUid) return;
        if (ev.target.closest && ev.target.closest(".zone, .board-card")) return;
        const uid = app.draggingUid;
        const def = handDef(uid);
        if (!def || def.type !== "spell") return;
        const opt = E.getPlayOptions(app.game, app.game.current, uid);
        if (!opt.ok) return;
        ev.preventDefault();
        finishCardDrag();
        if (opt.targetType) beginCard(uid);
        else commitPlay(uid, null, null);
      });
    }
    document.addEventListener("pointerdown", (e) => { if (!e.target.closest || !e.target.closest(".keyword-tag, .preview-keyword")) hideKeywordTip(); }, true);
    window.addEventListener("scroll", hideKeywordTip, true);
    $("btn-achievements").onclick = () => { AudioBox.play("ui_open"); openAchievements(); };
    $("btn-settings").onclick = () => { AudioBox.play("ui_open"); openSettings(); };
    $("btn-codex-back").onclick = () => showScreen("home");
    $("btn-achievements-back").onclick = () => showScreen("home");
    $("btn-settings-back").onclick = () => showScreen("home");
    $("btn-settings-sound").onclick = () => { AudioBox.toggle(); updateSettingsUI(); };
    if ($("btn-settings-bgm")) $("btn-settings-bgm").onclick = () => AudioBox.toggleBgm();
    if ($("btn-settings-sfx")) $("btn-settings-sfx").onclick = () => AudioBox.toggleSfx();
    if ($("btn-settings-bg")) $("btn-settings-bg").onclick = () => toggleBgAnim();
    if ($("btn-settings-motion")) $("btn-settings-motion").onclick = () => toggleMotion();
    if ($("btn-settings-damage")) $("btn-settings-damage").onclick = () => { app.damageNumbers = !app.damageNumbers; localStorage.setItem("gok_damage_numbers", app.damageNumbers ? "1" : "0"); updateSettingsUI(); };
    if ($("btn-settings-fx")) $("btn-settings-fx").onclick = () => { app.fxOn = !app.fxOn; localStorage.setItem("gok_fx", app.fxOn ? "1" : "0"); updateSettingsUI(); };
    if ($("btn-settings-ai")) $("btn-settings-ai").onclick = () => { app.aiSpeed = app.aiSpeed === "normal" ? "slow" : app.aiSpeed === "slow" ? "fast" : "normal"; localStorage.setItem("gok_ai_speed", app.aiSpeed); updateSettingsUI(); };
    if ($("btn-settings-shake")) $("btn-settings-shake").onclick = () => { app.screenShake = !app.screenShake; localStorage.setItem("gok_screen_shake", app.screenShake ? "1" : "0"); updateSettingsUI(); };
    if ($("btn-settings-textsize")) $("btn-settings-textsize").onclick = () => { app.textLarge = !app.textLarge; localStorage.setItem("gok_text_large", app.textLarge ? "1" : "0"); updateSettingsUI(); };
    if ($("settings-dim")) $("settings-dim").oninput = (e) => { app.bgDim = Math.max(0, Math.min(55, Number(e.target.value) || 0)); localStorage.setItem("gok_bg_dim", String(app.bgDim)); applyVideoPrefs(); updateSettingsUI(); };
    $("settings-volume").oninput = (e) => AudioBox.setVolume(Number(e.target.value) / 100);
    $("btn-settings-fullscreen").onclick = () => toggleFullscreen();
    document.addEventListener("fullscreenchange", updateSettingsUI);
    if ($("btn-settings-account")) $("btn-settings-account").onclick = () => { AudioBox.play("ui_open"); openAccountModal(); };
    $("btn-settings-clear-achievements").onclick = () => { app.achievements = {}; persistAchievements(); toast("成就记录已重置。"); };
    $("btn-settings-clear-profile").onclick = () => { app.profile = loadProfile(); app.profile = { games: 0, wins: 0, losses: 0, draws: 0, byFaction: {}, history: [], maxRound: 0 }; persistProfile(); updateHomeProfile(); toast("档案统计已重置。"); };
    $("btn-settings-credits").onclick = () => showCredits();
    $("btn-tutorial-back").onclick = () => showScreen("home");
    $("btn-tutorial-skip").onclick = () => showScreen("home");
    if ($("btn-rules-back")) $("btn-rules-back").onclick = closeRulesScreen;
    if ($("btn-rules-back2")) $("btn-rules-back2").onclick = closeRulesScreen;
    if ($("btn-rules-keywords-top")) $("btn-rules-keywords-top").onclick = () => { AudioBox.play("ui_open"); openKeywordGlossary(); };
    if ($("btn-rules-tutorial")) $("btn-rules-tutorial").onclick = () => { AudioBox.play("ui_open"); showScreen("tutorial"); };
    $("btn-tutorial-start").onclick = () => runBootLoading("正在准备新手演练", "载入教学牌桌…", BOOT_ASSETS, () => startTutorial());
    $("btn-tutorial-exit").onclick = () => endTutorial();
    $("btn-lan").onclick = () => { closeStartMenu(); AudioBox.play("ui_open"); showScreen("lan"); initLanScreen(); };
    const onlineBtn = $("btn-online");
    if (onlineBtn) onlineBtn.onclick = () => { closeStartMenu(); AudioBox.play("ui_open"); openOnlineLobby(); };
    $("btn-lan-back").onclick = () => { stopNet(true); showScreen("home"); };
    if ($("btn-credits")) $("btn-credits").onclick = () => showCredits();
    if ($("btn-rules")) $("btn-rules").onclick = () => { AudioBox.play("ui_open"); openKeywordGlossary(); };
    if ($("btn-rank")) $("btn-rank").onclick = () => openRank("home");
    if ($("btn-rank-back")) $("btn-rank-back").onclick = () => closeRank();
    if ($("btn-rank-game")) $("btn-rank-game").onclick = () => openRank("game");
    if ($("btn-concede")) $("btn-concede").onclick = () => confirmConcede();
    if ($("btn-game-settings")) $("btn-game-settings").onclick = () => { AudioBox.play("ui_open"); openGameSettings(); };
    if ($("btn-game-guide")) $("btn-game-guide").onclick = () => { AudioBox.play("ui_open"); openGameGuide(); };
    if ($("btn-sim-back")) $("btn-sim-back").onclick = () => showScreen("home");
    $("btn-setup-back").onclick = () => showScreen("home");
    $("btn-game-home").onclick = () => confirmExit();
    if ($("btn-toggle-log")) $("btn-toggle-log").onclick = () => toggleGameLog();
    $("btn-log-close").onclick = () => { app.logOpen = false; $("log-panel").classList.remove("open"); };
    const keyBtn = $("btn-keywords");
    if (keyBtn) keyBtn.onclick = () => openKeywordGlossary();
    if ($("btn-game-tutorial")) $("btn-game-tutorial").onclick = () => { AudioBox.play("ui_open"); openGameGuide(); };
    const logMini = $("log-mini");
    if (logMini) logMini.onclick = () => toggleGameLog();
    $("btn-sound").onclick = () => AudioBox.toggle();
    $("btn-start-game").onclick = () => {
      const begin = () => runBootLoading("正在铺开牌桌", "载入牌组、阵位与流脉…", BOOT_ASSETS, () => startGame({ mode: "ai", faction: app.faction, aiDifficulty: app.aiDifficulty }));
      const cg = CLASSIC_CG[app.faction];
      if (global.GokCinema && cg) {
        global.GokCinema.playOnce("classic_intro_" + app.faction, cg.clip, {
          eyebrow: "CLASSIC · " + factionName(app.faction),
          title: cg.title,
          text: cg.text
        }).then(begin);
      } else {
        begin();
      }
    };
    document.querySelectorAll("#setup-faction .faction-card").forEach((b) => {
      b.onclick = () => { app.faction = b.dataset.faction; AudioBox.play("click"); setupState(); };
    });
    $("btn-deck").onclick = () => { AudioBox.play("ui_open"); openDeckBuilder(app.faction); };
    $("btn-deck-preset").onclick = () => usePresetDeck(app.faction);
    $("btn-deck-back").onclick = () => { app.faction = app.deckBuildFaction; const to = app.deckReturn || "setup"; showScreen(to); if (to === "setup") setupState(); else if (to === "lan") initLanScreen(); toast("已取消编成，未保存改动。"); };
    $("btn-deck-save").onclick = () => { if (saveCurrentDeck(true)) { app.deckSource = "custom"; renderDeckBuilder(); } };
    $("btn-deck-clear").onclick = () => { app.deckBuildList = []; app.deckSource = "draft"; app.lastAutoStrategy = null; renderDeckBuilder(); toast("已清空当前牌组，可重新选择。"); };
    $("btn-deck-reset").onclick = () => { app.deckBuildList = D.DECKS[app.deckBuildFaction].slice(); app.lastAutoStrategy = null; app.deckSource = "preset"; renderDeckBuilder(); toast("已恢复预设牌组。"); };
    $("btn-deck-use").onclick = () => { if (!saveCurrentDeck(false)) return; app.faction = app.deckBuildFaction; const to = app.deckReturn || "setup"; showScreen(to); if (to === "setup") setupState(); else if (to === "lan") initLanScreen(); toast("已应用自定义牌组。"); };
    $("btn-deck-top-use").onclick = () => { if (!saveCurrentDeck(false)) return; app.faction = app.deckBuildFaction; const to = app.deckReturn || "setup"; showScreen(to); if (to === "setup") setupState(); else if (to === "lan") initLanScreen(); toast("已应用自定义牌组。"); };
    document.querySelectorAll(".deck-filter").forEach((b) => {
      b.onclick = () => { app.deckBuildFilter = b.dataset.deckFilter; document.querySelectorAll(".deck-filter").forEach((x) => x.classList.toggle("active", x === b)); renderDeckBuilder(); };
    });
    document.querySelectorAll(".deck-scope").forEach((b) => {
      b.onclick = () => { app.deckPoolScope = b.dataset.deckScope; document.querySelectorAll(".deck-scope").forEach((x) => x.classList.toggle("active", x === b)); renderDeckBuilder(); };
    });
    document.querySelectorAll(".auto-deck-btn").forEach((b) => {
      b.onclick = () => autoBuildCurrentDeck(b.dataset.deckStrategy);
    });
    document.querySelectorAll(".sim-run").forEach((b) => {
      b.onclick = () => { AudioBox.play("ui_open"); runSimulation(Number(b.dataset.count)); };
    });
    initLanEvents();
    document.addEventListener("contextmenu", (e) => {
      if (app.screen === "game" && !app.modalOpen && (app.targetInfo || app.zoneSelect || app.attacker || app.selectedCard)) {
        e.preventDefault();
        cancelSelection(true);
      }
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        const sm = $("start-menu");
        if (sm && !sm.hidden) { closeStartMenu(); return; }
        if (app.modalOpen) { closeModal(true); app.busy = false; renderGame(); }
        else if (app.targetInfo || app.zoneSelect || app.attacker || app.selectedCard) {
          cancelSelection(true);
        }
      }
      if (e.code === "Space" && app.screen === "game" && !app.modalOpen && !$("btn-end-turn").disabled) {
        e.preventDefault();
        endTurn();
      }
    });
    initDepthVisuals();
    setupState();
    runBootLoading("正在展开流脉档案", "校准地脉、阵位与关键词…", BOOT_ASSETS, null);
    if (!localStorage.getItem("gok_welcome_v2")) {
      localStorage.setItem("gok_welcome_v2", "1");
      setTimeout(() => { if (app.screen === "home") toast("第一次推演？游戏教程里有规则、阵位与关键词。"); }, 2100);
    }
    AudioBox.updateButton();
    autoReconnectOnLoad();
    startHostKeepAlive();
    initOnlineFromQuery();
    // 便于自动截图/调试
    app.startGame = startGame;
    app.showScreen = showScreen;
    app.runSimulation = runSimulation;
    app.endTurn = endTurn;
    app.render = renderGame;
    app.showEnd = showEnd;
    app.openCodex = openCodex;
    app.openAchievements = openAchievements;
    app.openSettings = openSettings;
  }

  function reinforceHandCardText() {
    document.querySelectorAll(".hand-card").forEach((card) => {
      const text = card.querySelector(".card-text");
      if (text) {
        text.style.setProperty("display", "-webkit-box", "important");
        text.style.setProperty("-webkit-box-orient", "vertical", "important");
        text.style.setProperty("-webkit-line-clamp", "3", "important");
        text.style.setProperty("overflow", "hidden", "important");
      }
      const type = card.querySelector(".card-type");
      if (type) type.style.setProperty("display", "block", "important");
      const art = card.querySelector(".card-art");
      if (art) art.style.setProperty("inset", "0", "important");
    });
  }
  setInterval(reinforceHandCardText, 450);
  setTimeout(reinforceHandCardText, 80);

  global.GokUI = { init: init, app: app, startGame: startGame, showScreen: showScreen, runSimulation: runSimulation };

})(window);
