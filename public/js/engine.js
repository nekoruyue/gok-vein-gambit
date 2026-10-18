/* 《戈克世界：流脉牌局》核心规则引擎 v0.1
 * 纯逻辑，不依赖 DOM。浏览器挂到 window.GokEngine，Node 可 require。
 */
(function (root, factory) {
  if (typeof module !== "undefined" && module.exports) module.exports = factory(require("./data.js"));
  else root.GokEngine = factory(root.GokData);
})(typeof globalThis !== "undefined" ? globalThis : this, function (D) {
  "use strict";

  const ZONES = ["left", "center", "right"];
  const ZONE_NAMES = { left: "左翼", center: "中枢", right: "右翼" };
  let NEXT_UID = 1;

  function uid(prefix) { return (prefix || "u") + "_" + (NEXT_UID++); }
  function clone(obj) { return JSON.parse(JSON.stringify(obj)); }
  function card(id) { return D.CARDS[id]; }
  function hero(id) { return D.HEROES[id]; }

  function nextRandom(state) {
    state.rngState = (Math.imul(state.rngState, 1664525) + 1013904223) >>> 0;
    return state.rngState / 4294967296;
  }
  function shuffle(state, arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(nextRandom(state) * (i + 1));
      const t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }
  function randomInt(state, n) { return Math.floor(nextRandom(state) * n); }

  function allMinions(player) {
    const out = [];
    for (const z of ZONES) for (const m of player.board[z]) out.push(m);
    return out;
  }
  function aliveMinions(player, zone) {
    if (zone) return player.board[zone].filter(m => !m.dead);
    return allMinions(player).filter(m => !m.dead);
  }
  function findMinion(state, u) {
    for (const p of state.players) for (const z of ZONES) {
      const m = p.board[z].find(x => x.uid === u);
      if (m) return m;
    }
    return null;
  }
  function ownerOf(state, minion) { return state.players[minion.owner]; }
  function opponentOf(state, player) { return state.players[1 - player.index]; }
  function boardCount(player) { return allMinions(player).length; }
  function zoneHasSpace(player, zone) { return player.board[zone].length < 2; }
  function openZones(player) { return ZONES.filter(z => zoneHasSpace(player, z)); }

  function log(state, text, player, type) {
    const entry = { turn: state.turnNumber, round: state.round, text: text, player: player == null ? null : player.index, type: type || "info" };
    state.log.push(entry);
    if (state.log.length > 260) state.log.splice(0, state.log.length - 260);
    state.events.push({ kind: type || "info", text: text, player: entry.player });
    if (state.events.length > 60) state.events.splice(0, state.events.length - 60);
  }

  function createPlayer(index, factionId, isAI) {
    const faction = D.FACTIONS[factionId];
    const heroId = faction.hero;
    const heroDef = hero(heroId);
    return {
      index: index,
      name: index === 0 ? "玩家 1" : "玩家 2",
      isAI: !!isAI,
      faction: factionId,
      factionName: faction.name,
      heroId: heroId,
      hero: heroDef,
      hp: heroDef.hp,
      maxHp: heroDef.hp,
      armor: 0,
      mana: 0,
      maxMana: 0,
      deck: [],
      hand: [],
      discard: [],
      board: { left: [], center: [], right: [] },
      heroPowerUsed: false,
      nextCostReduction: 0,
      fatigue: 0,
      cardsPlayed: 0,
      spellsCastThisTurn: 0,
      damageDealt: 0
    };
  }

  function buildDeck(state, factionId, customList) {
    let ids = D.DECKS[factionId];
    if (Array.isArray(customList) && D.validateDeck && D.validateDeck(factionId, customList).ok) {
      ids = customList.slice();
    } else if (Array.isArray(customList)) {
      state.deckWarnings = state.deckWarnings || [];
      state.deckWarnings.push("自定义牌组不合法，已回退到预设牌组。");
    }
    return shuffle(state, ids).map(id => ({ uid: uid("c"), cardId: id }));
  }

  function makeMinion(state, owner, cardId, zone, opts) {
    const def = card(cardId);
    const charge = (def.keywords || []).includes("charge");
    const taunt = (def.keywords || []).includes("taunt") || !!(opts && opts.taunt);
    const m = {
      uid: uid("m"),
      cardId: def.id,
      name: def.name,
      faction: def.faction,
      owner: owner.index,
      zone: zone,
      attack: def.attack,
      health: def.health,
      maxHealth: def.health,
      baseAttack: def.attack,
      baseHealth: def.health,
      keywords: (def.keywords || []).slice(),
      taunt: taunt,
      charge: charge,
      stealth: !!(opts && opts.stealth),
      frozenTurns: 0,
      silenced: false,
      dead: false,
      attacksLeft: charge ? 1 : 0,
      hasAttacked: false,
      justPlayed: true,
      passive: def.passive || null,
      deathrattle: def.deathrattle || null,
      token: !!def.token
    };
    if (opts && opts.taunt) {
      m.taunt = true;
      if (!m.keywords.includes("taunt")) m.keywords.push("taunt");
    }
    return m;
  }

  function summonMinion(state, player, cardId, zone, opts) {
    const def = card(cardId);
    const z = zone || openZones(player)[0];
    if (!z || !zoneHasSpace(player, z)) {
      log(state, "阵位已满，无法召唤 " + def.name + "。", player, "error");
      return null;
    }
    const m = makeMinion(state, player, cardId, z, opts);
    player.board[z].push(m);
    log(state, player.name + " 召唤了 " + def.name + "（" + ZONE_NAMES[z] + "）。", player, "summon");
    state.stats.minionsSummoned++;
    // 测试版平衡：移除普卫岛全员免费协同，位置协同只由英雄技能与「协同调度」提供。
    return m;
  }

  function drawCard(state, player, count) {
    let n = count == null ? 1 : count;
    for (let i = 0; i < n; i++) {
      if (player.deck.length === 0) {
        player.fatigue += 1;
        log(state, player.name + " 牌库已空，受到 " + player.fatigue + " 点疲劳伤害。", player, "fatigue");
        damageHero(state, player, player.fatigue, null, "疲劳");
        continue;
      }
      const c = player.deck.shift();
      if (player.hand.length >= 8) {
        log(state, player.name + " 手牌已满，" + card(c.cardId).name + " 被烧掉。", player, "burn");
      } else {
        player.hand.push(c);
        log(state, player.name + " 抽到 " + card(c.cardId).name + "。", player, "draw");
      }
    }
  }

  function addCardToHand(state, player, cardId, opts) {
    if (player.hand.length >= 8) {
      log(state, player.name + " 手牌已满，" + card(cardId).name + " 无法加入手牌。", player, "burn");
      return null;
    }
    const c = { uid: uid("c"), cardId: cardId, generated: true };
    player.hand.push(c);
    log(state, player.name + " 将 " + card(cardId).name + " 加入手牌。", player, "discover");
    return c;
  }

  function getCardCost(state, player, cardIdOrCard) {
    const id = typeof cardIdOrCard === "string" ? cardIdOrCard : cardIdOrCard.cardId;
    const def = card(id);
    return Math.max(0, def.cost - (player.nextCostReduction || 0));
  }

  function getTargetType(state, def) {
    if (!def || !def.target || def.target === "none") return null;
    if (def.target === "enemyDynamic") return state.vein >= 6 ? null : "enemy";
    return def.target;
  }

  function getValidTargets(state, player, targetType) {
    if (!targetType) return [];
    if (targetType === "friendly") return aliveMinions(player);
    if (targetType === "enemy") return aliveMinions(opponentOf(state, player)).filter(m => !m.stealth);
    return [];
  }

  function targetAllowed(state, player, targetUid, targetType) {
    if (!targetType) return true;
    const m = findMinion(state, targetUid);
    if (!m || m.dead) return false;
    if (targetType === "friendly") return m.owner === player.index;
    if (targetType === "enemy") return m.owner !== player.index && !m.stealth;
    return false;
  }

  function buffMinion(state, m, attack, health, source, logIt) {
    if (!m || m.dead) return;
    m.attack += attack;
    m.health += health;
    m.maxHealth += health;
    if (logIt !== false) log(state, m.name + " 获得 +" + attack + "/+" + health + "。", ownerOf(state, m), "buff");
  }

  function damageMinion(state, m, amount, source, label) {
    if (!m || m.dead || amount <= 0) return 0;
    state.events.push({ structured: true, kind: "damage", targetUid: m.uid, amount: amount, label: label || "", player: ownerOf(state, m).index, text: m.name + " 受到 " + amount + " 点伤害。" });
    m.health -= amount;
    log(state, m.name + " 受到 " + amount + " 点伤害" + (label ? "（" + label + "）" : "") + "。", ownerOf(state, m), "damage");
    if (m.passive && m.passive.type === "armorOnDamage" && !m.silenced) {
      const p = ownerOf(state, m);
      p.armor += m.passive.amount;
      log(state, p.name + " 获得 " + m.passive.amount + " 点护甲（" + m.name + "）。", p, "armor");
    }
    if (m.health <= 0) m.dead = true;
    return amount;
  }

  function healMinion(state, m, amount) {
    if (!m || m.dead) return 0;
    const before = m.health;
    m.health = Math.min(m.maxHealth, m.health + amount);
    const healed = m.health - before;
    if (healed > 0) { state.events.push({ structured: true, kind: "heal", targetUid: m.uid, amount: healed, player: ownerOf(state, m).index }); log(state, m.name + " 恢复 " + healed + " 点生命。", ownerOf(state, m), "heal"); }
    return healed;
  }

  function damageHero(state, player, amount, source, label, skipCheck) {
    if (amount <= 0) return;
    let left = amount;
    if (player.armor > 0) {
      const absorbed = Math.min(player.armor, left);
      player.armor -= absorbed;
      left -= absorbed;
      if (absorbed > 0) log(state, player.name + " 的护甲吸收了 " + absorbed + " 点伤害。", player, "armor");
    }
    player.hp -= left;
    state.events.push({ structured: true, kind: "damage", targetUid: "hero:" + player.index, amount: amount, label: label || "", player: player.index });
    log(state, player.name + " 受到 " + amount + " 点伤害" + (label ? "（" + label + "）" : "") + "，剩余 " + Math.max(0, player.hp) + " 点生命。", player, "heroDamage");
    if (source && source.owner != null && source.owner !== player.index) {
      state.players[source.owner].damageDealt += amount;
    }
    if (!skipCheck) checkGameOver(state);
  }

  function healHero(state, player, amount) {
    const before = player.hp;
    player.hp = Math.min(player.maxHp, player.hp + amount);
    if (player.hp > before) { state.events.push({ structured: true, kind: "heal", targetUid: "hero:" + player.index, amount: player.hp - before, player: player.index }); log(state, player.name + " 恢复 " + (player.hp - before) + " 点生命。", player, "heal"); }
  }

  function silenceMinion(state, m) {
    if (!m || m.dead) return;
    m.silenced = true;
    m.taunt = false;
    m.charge = false;
    m.stealth = false;
    m.frozenTurns = 0;
    m.keywords = [];
    m.passive = null;
    m.deathrattle = null;
    m.attack = m.baseAttack;
    m.maxHealth = m.baseHealth;
    m.health = Math.min(m.health, m.maxHealth);
    log(state, m.name + " 被沉默。", ownerOf(state, m), "silence");
  }

  function retreatMinion(state, playerIndex, uid) {
    const player = state.players[playerIndex];
    if (!player || state.status !== "playing") return { ok: false, reason: "现在不能撤退。" };
    for (const z of ZONES) {
      const m = player.board[z].find(x => x.uid === uid && !x.dead);
      if (!m) continue;
      player.board[z] = player.board[z].filter(x => x.uid !== uid);
      player.discard.push({ uid: m.uid, cardId: m.cardId });
      log(state, player.name + " 将 " + m.name + " 撤退至弃牌堆。", player, "retreat");
      return { ok: true };
    }
    return { ok: false, reason: "该角色不在场上。" };
  }

  function processDeaths(state) {
    let changed = true;
    while (changed) {
      changed = false;
      for (const p of state.players) {
        for (const z of ZONES) {
          const dead = p.board[z].filter(m => m.dead);
          if (dead.length) {
            changed = true;
            for (const m of dead) {
              log(state, m.name + " 死亡。", p, "death");
              p.board[z] = p.board[z].filter(x => x.uid !== m.uid);
              state.stats.minionsDied++;
              if (m.deathrattle && !m.silenced) triggerDeathrattle(state, p, m);
            }
          }
        }
      }
    }
    checkGameOver(state);
  }

  function triggerDeathrattle(state, player, m) {
    const d = m.deathrattle;
    if (!d) return;
    state.events.push({ structured: true, kind: "deathrattle", targetUid: m.uid, name: m.name, player: player.index });
    if (d.type === "summon") {
      const count = d.count || 1;
      for (let i = 0; i < count; i++) {
        const token = summonMinion(state, player, d.token, openZones(player)[0], null);
        if (token) log(state, "亡语：" + m.name + " 召唤了 " + token.name + "。", player, "deathrattle");
      }
    } else if (d.type === "damageAllEnemies") {
      for (const enemy of aliveMinions(opponentOf(state, player))) damageMinion(state, enemy, d.amount || 3, null, "亡语");
      log(state, "亡语：" + m.name + " 对所有敌方随从造成 " + (d.amount || 3) + " 点伤害。", player, "deathrattle");
    } else if (d.type === "buffRandomAlly") {
      const allies = aliveMinions(player);
      if (allies.length) {
        const target = allies[randomInt(state, allies.length)];
        buffMinion(state, target, d.attack || 0, 0, "亡语", true);
        log(state, "亡语：" + m.name + " 使 " + target.name + " 获得 +" + (d.attack || 0) + " 攻击。", player, "deathrattle");
      }
    }
  }

  function checkGameOver(state) {
    if (state.status !== "playing") return;
    const a = state.players[0], b = state.players[1];
    if (a.hp <= 0 && b.hp <= 0) {
      state.status = "gameover";
      state.winner = null;
      log(state, "双方英雄同时倒下。推演以平局结束。", null, "gameover");
      state.stats.result = "draw";
    } else if (a.hp <= 0) {
      state.status = "gameover";
      state.winner = 1;
      log(state, b.name + " 获胜。", b, "gameover");
      state.stats.result = "p2";
    } else if (b.hp <= 0) {
      state.status = "gameover";
      state.winner = 0;
      log(state, a.name + " 获胜。", a, "gameover");
      state.stats.result = "p1";
    }
  }

  function addVein(state, amount, source) {
    if (!amount) return;
    const before = state.vein;
    if (amount > 0) {
      state.vein = Math.min(12, state.vein + amount);
      if (state.vein > state.stats.veinPeak) state.stats.veinPeak = state.vein;
      log(state, "流脉 " + before + " → " + state.vein + (source ? "（" + source + "）" : "") + "。", null, "vein");
      const thresholds = [4, 7, 10];
      for (const t of thresholds) {
        if (before < t && state.vein >= t) triggerVeinThreshold(state, t);
      }
      if (state.vein >= 12) {
        state.vein = 0;
        log(state, "流脉达到 12，潮汐回流清空。", null, "veinEvent");
      }
    } else {
      state.vein = Math.max(0, state.vein + amount);
      log(state, "流脉 " + before + " → " + state.vein + (source ? "（" + source + "）" : "") + "。", null, "vein");
    }
  }

  function triggerVeinThreshold(state, t) {
    state.stats.thresholds[t] = (state.stats.thresholds[t] || 0) + 1;
    if (t === 4) {
      log(state, "【流脉震荡】流脉达到 4，所有角色受到 1 点伤害。", null, "veinEvent");
      for (const p of state.players) for (const z of ZONES) for (const m of p.board[z].slice()) damageMinion(state, m, 1, null, "流脉震荡");
      processDeaths(state);
    } else if (t === 7) {
      log(state, "【流脉裂隙】流脉达到 7，双方英雄受到 2 点伤害。", null, "veinEvent");
      damageHero(state, state.players[0], 2, null, "流脉裂隙", true);
      damageHero(state, state.players[1], 2, null, "流脉裂隙", true);
      checkGameOver(state);
    } else if (t === 10) {
      log(state, "【魔物潮】流脉达到 10，所有角色受到 3 点伤害，双方英雄受到 5 点伤害。", null, "veinEvent");
      for (const p of state.players) for (const z of ZONES) for (const m of p.board[z].slice()) damageMinion(state, m, 3, null, "魔物潮");
      processDeaths(state);
      damageHero(state, state.players[0], 5, null, "魔物潮", true);
      damageHero(state, state.players[1], 5, null, "魔物潮", true);
      checkGameOver(state);
      log(state, "魔物潮退去，流脉将在 12 时回流清空。", null, "veinEvent");
    }
  }

  function playCard(state, playerIndex, cardUid, opts) {
    if (state.status !== "playing") return { ok: false, reason: "对局已结束" };
    if (state.mulliganPhase) return { ok: false, reason: "请先完成起手调度" };
    if (state.pendingChoice) return { ok: false, reason: "请先完成当前选择" };
    const player = state.players[playerIndex];
    if (!player || state.current !== playerIndex) return { ok: false, reason: "还没轮到你" };
    const handCard = player.hand.find(c => c.uid === cardUid);
    if (!handCard) return { ok: false, reason: "手牌中没有这张牌" };
    const def = card(handCard.cardId);
    const cost = getCardCost(state, player, handCard);
    if (player.mana < cost) return { ok: false, reason: "行动槽不足", code: "mana" };
    if (def.type === "minion" && boardCount(player) >= 6) return { ok: false, reason: "角色区已满", code: "boardFull" };
    const targetType = getTargetType(state, def);
    const target = opts && opts.targetUid ? findMinion(state, opts.targetUid) : null;
    if (targetType) {
      const valid = getValidTargets(state, player, targetType);
      if (target) {
        if (!targetAllowed(state, player, target.uid, targetType)) {
          return { ok: false, reason: "目标不合法", code: "target", targetType: targetType, targets: valid.map(m => m.uid) };
        }
      } else if (!(targetType === "friendly" && valid.length === 0) && !def.optionalTarget) {
        return { ok: false, reason: "需要选择一个合法目标", code: "target", targetType: targetType, targets: valid.map(m => m.uid) };
      }
    }
    if (def.bloodCost != null && (!opts || opts.payBlood == null)) {
      return { ok: false, reason: "是否支付血祭代价？", code: "blood", amount: def.bloodCost };
    }
    if (def.bloodCost != null && opts.payBlood && player.hp <= def.bloodCost) {
      return { ok: false, reason: "生命不足，无法支付血祭", code: "bloodPay" };
    }
    let zone = opts && opts.zone;
    if (def.type === "minion") {
      if (!zone || ZONES.indexOf(zone) < 0) {
        return { ok: false, reason: "请选择一个阵位", code: "zone", zones: openZones(player) };
      }
      if (!zoneHasSpace(player, zone)) return { ok: false, reason: "该阵位已满", code: "zoneFull" };
    }
    if (def.bloodCost != null && opts.payBlood) {
      player.hp -= def.bloodCost;
      log(state, player.name + " 支付血祭：" + def.bloodCost + " 点生命。", player, "blood");
      checkGameOver(state);
      if (state.status !== "playing") return { ok: true };
    }
    // 扣费、移出手牌
    player.mana -= cost;
    player.nextCostReduction = 0;
    player.hand = player.hand.filter(c => c.uid !== cardUid);
    player.cardsPlayed++;
    log(state, player.name + " 打出 " + def.name + "（" + cost + " 费）。", player, def.type === "spell" ? "spell" : "play");
    if (def.type === "spell") {
      player.spellsCastThisTurn = (player.spellsCastThisTurn || 0) + 1;
      for (const m of aliveMinions(player)) {
        if (m.passive && m.passive.type === "spellGrowth" && !m.silenced) {
          buffMinion(state, m, m.passive.attack || 0, m.passive.health || 0, "法术回响", true);
        }
      }
    }
    if (def.type === "minion") {
      const m = summonMinion(state, player, def.id, zone, opts && opts.taunt ? { taunt: true } : null);
      if (!m) {
        // 原子性保护：召唤失败时返还行动槽、手牌与血祭代价
        player.mana += cost;
        player.hand.push(handCard);
        if (def.bloodCost != null && opts && opts.payBlood) player.hp += def.bloodCost;
        log(state, "召唤失败，费用已返还。", player, "error");
        return { ok: false, reason: "召唤失败，费用已返还" };
      }
      if (def.excavate) addVein(state, def.excavate, "采掘");
      if (state.status === "playing") {
        resolveBattlecry(state, player, def, m, target || null, opts || {});
        processDeaths(state);
      }
    } else {
      if (def.excavate) addVein(state, def.excavate, "采掘");
      if (state.status === "playing") {
        resolveSpell(state, player, def, target || null, opts || {});
        processDeaths(state);
      }
    }
    checkGameOver(state);
    return { ok: true, pending: state.pendingChoice ? state.pendingChoice.type : null };
  }

  function returnMinionToHand(state, m) {
    if (!m || m.dead) return;
    const owner = ownerOf(state, m);
    owner.board[m.zone] = owner.board[m.zone].filter(x => x.uid !== m.uid);
    if (owner.hand.length >= 8) {
      log(state, owner.name + " 手牌已满，" + m.name + " 被移回时烧掉。", owner, "burn");
      return;
    }
    owner.hand.push({ uid: uid("c"), cardId: m.cardId, generated: true });
    log(state, owner.name + " 的 " + m.name + " 回到了手牌。", owner, "bounce");
  }

  function copyMinionStats(source, copy) {
    if (!source || !copy) return;
    copy.attack = source.attack;
    copy.health = source.health;
    copy.maxHealth = source.maxHealth;
    copy.baseAttack = source.baseAttack;
    copy.baseHealth = source.baseHealth;
    copy.taunt = source.taunt;
    copy.charge = source.charge;
    copy.stealth = source.stealth;
    copy.keywords = (source.keywords || []).slice();
    copy.passive = source.passive || null;
    copy.deathrattle = source.deathrattle || null;
    copy.frozenTurns = source.frozenTurns || 0;
  }

  function resolveBattlecry(state, player, def, minion, target, opts) {
    const b = def.battlecry;
    if (!b) return;
    if (b.type === "healDraw") {
      if (!target || target.dead) return;
      const wasDamaged = target.health < target.maxHealth;
      healMinion(state, target, b.amount);
      if (wasDamaged) drawCard(state, player, 1);
    } else if (b.type === "silence") {
      if (target && !target.dead) silenceMinion(state, target);
    } else if (b.type === "silenceVeinBuff") {
      if (target && !target.dead) silenceMinion(state, target);
      if (state.vein >= (b.vein == null ? 5 : b.vein)) buffMinion(state, minion, 0, b.health || 2, "引脉", true);
    } else if (b.type === "nextCost") {
      player.nextCostReduction = (player.nextCostReduction || 0) + b.amount;
      log(state, player.name + " 本回合下一张牌费用减少 " + b.amount + "。", player, "buff");
    } else if (b.type === "drawVein") {
      drawCard(state, player, b.amount || 1);
      if (state.vein >= b.vein) drawCard(state, player, b.bonus || 1);
    } else if (b.type === "freeze") {
      const all = b.allAtVein != null && state.vein >= b.allAtVein;
      if (all) {
        for (const m of aliveMinions(opponentOf(state, player)).filter(m => !m.stealth)) freezeMinion(state, m);
        log(state, "引脉触发：" + (b.allAtVein) + "，冻结所有敌方角色。", player, "freeze");
      } else if (target && !target.dead) {
        freezeMinion(state, target);
      }
      if (b.destroyFrozenAtVein != null && state.vein >= b.destroyFrozenAtVein) {
        const frozen = aliveMinions(opponentOf(state, player)).filter(x => x.frozenTurns > 0);
        for (const m of frozen) m.dead = true;
        if (frozen.length) {
          log(state, "引脉触发：深雪消灭了所有敌方冻结随从。", player, "vein");
          processDeaths(state);
        }
      }
    } else if (b.type === "heal") {
      if (target && !target.dead) healMinion(state, target, b.amount);
    } else if (b.type === "healHero") {
      player.hp = Math.min(player.maxHp, player.hp + (b.amount || 2));
      log(state, player.name + " 恢复 " + (b.amount || 2) + " 点生命。", player, "heal");
    } else if (b.type === "buffTauntZone") {
      const allies = aliveMinions(player).filter(m => m.zone === minion.zone && m.taunt);
      for (const m of allies) buffMinion(state, m, 0, b.health || 1, "战吼", true);
    } else if (b.type === "buffPerIronclad") {
      const count = aliveMinions(player).filter(m => m.cardId === "ironclad").length;
      if (count > 0) buffMinion(state, minion, count * (b.attack || 2), count * (b.health || 1), "战吼", true);
    } else if (b.type === "buffIfIronclad") {
      const mate = aliveMinions(player).some(m => m.uid !== minion.uid && m.zone === minion.zone && m.cardId === "ironclad");
      if (mate) buffMinion(state, minion, 0, b.health || 1, "战吼", true);
    } else if (b.type === "handBuff") {
      if (player.hand.length >= (b.hand || 6)) buffMinion(state, minion, b.attack || 0, b.health || 2, "战吼", true);
    } else if (b.type === "drawHandCondition") {
      drawCard(state, player, b.draw || 1);
      if (player.hand.length <= (b.hand || 6)) drawCard(state, player, b.draw || 1);
    } else if (b.type === "drawSpell") {
      const idx = player.deck.findIndex(c => D.CARDS[c.cardId] && D.CARDS[c.cardId].type === "spell");
      if (idx >= 0) {
        const c = player.deck.splice(idx, 1)[0];
        if (player.hand.length < 8) { player.hand.push(c); log(state, player.name + " 抽到一张法术牌。", player, "draw"); }
        else log(state, player.name + " 手牌已满，一张法术牌被烧掉。", player, "burn");
      }
    } else if (b.type === "bloodAttack") {
      if (opts.payBlood) buffMinion(state, minion, b.amount, 0, "血祭", true);
    } else if (b.type === "summonTwo") {
      const tokens = [];
      for (let i = 0; i < 2; i++) {
        const t = summonMinion(state, player, b.token, openZones(player)[0], null);
        if (t) tokens.push(t);
      }
      if (state.vein >= b.vein) for (const t of tokens) grantTaunt(state, t);
    } else if (b.type === "drawDamageAlly") {
      drawCard(state, player, 1);
      const others = aliveMinions(player).filter(m => m.uid !== minion.uid);
      if (others.length) {
        const t = others[randomInt(state, others.length)];
        damageMinion(state, t, b.amount || 1, minion, "战吼");
      }
    } else if (b.type === "buffTaunt") {
      if (target && !target.dead) {
        buffMinion(state, target, b.attack || 0, b.health || 0, "战吼", true);
        grantTaunt(state, target);
      }
    } else if (b.type === "summon") {
      summonMinion(state, player, b.token, openZones(player)[0], null);
    } else if (b.type === "stealth") {
      if (target && !target.dead) {
        target.stealth = true;
        log(state, target.name + " 获得潜行。", player, "stealth");
      }
    } else if (b.type === "bloodBuff") {
      if (opts.payBlood) buffMinion(state, minion, b.attack || 0, b.health || 0, "血祭", true);
    } else if (b.type === "damage") {
      if (target && !target.dead) damageMinion(state, target, b.amount || 1, minion, "战吼");
    } else if (b.type === "discover") {
      openDiscover(state, player, b.pool || "any", def.id);
    } else if (b.type === "armor") {
      player.armor += b.amount || 0;
      log(state, player.name + " 获得 " + (b.amount || 0) + " 点护甲。", player, "armor");
    } else if (b.type === "draw") {
      drawCard(state, player, b.amount || 1);
    } else if (b.type === "damageAllEnemiesDraw") {
      for (const m of aliveMinions(opponentOf(state, player))) damageMinion(state, m, b.amount || 4, minion, "战吼");
      if (b.vein == null || state.vein >= b.vein) drawCard(state, player, b.draw || 1);
      log(state, "战吼：" + minion.name + " 对敌方随从造成 " + (b.amount || 4) + " 点伤害。", player, "battlecry");
    } else if (b.type === "freezeAllEnemies") {
      for (const m of aliveMinions(opponentOf(state, player)).filter(x => !x.stealth)) freezeMinion(state, m);
      log(state, "战吼：霜潮利维坦冻结了所有敌方随从。", player, "freeze");
    } else if (b.type === "copyFriendly") {
      if (target && !target.dead) {
        const copy = summonMinion(state, player, target.cardId, openZones(player)[0], null);
        if (copy) {
          copyMinionStats(target, copy);
          copy.name = target.name;
          log(state, "战吼：" + minion.name + " 复制了 " + target.name + "。", player, "battlecry");
        }
      }
    } else if (b.type === "returnToHand") {
      if (target && !target.dead) {
        const name = target.name;
        returnMinionToHand(state, target);
        log(state, "战吼：" + minion.name + " 将 " + name + " 移回手牌。", player, "battlecry");
      }
    } else if (b.type === "veinDraw") {
      addVein(state, b.amount || 1, "战吼");
      if (state.vein >= (b.vein == null ? 8 : b.vein)) drawCard(state, player, b.draw || 1);
    } else if (b.type === "damageAllEnemies") {
      for (const m of aliveMinions(opponentOf(state, player))) damageMinion(state, m, b.amount || 2, minion, "战吼");
      log(state, "战吼：" + minion.name + " 对所有敌方随从造成 " + (b.amount || 2) + " 点伤害。", player, "battlecry");
    } else if (b.type === "destroy") {
      if (target && !target.dead) {
        target.dead = true;
        log(state, "战吼：" + minion.name + " 消灭了 " + target.name + "。", player, "battlecry");
      }
    } else if (b.type === "veinSelfBuff") {
      if (state.vein >= (b.vein == null ? 4 : b.vein)) {
        buffMinion(state, minion, b.attack || 0, 0, "引脉", true);
        log(state, "引脉触发：" + minion.name + " 获得 +" + (b.attack || 0) + " 攻击。", player, "vein");
      }
    } else if (b.type === "veinBuff") {
      addVein(state, b.amount || 2, "流脉巨兽");
      if (state.vein >= (b.vein == null ? 7 : b.vein)) {
        buffMinion(state, minion, b.attack || 2, b.health || 2, "战吼", true);
        grantTaunt(state, minion);
        log(state, "引脉触发：流脉巨兽获得 +" + (b.attack || 2) + "/+" + (b.health || 2) + " 和嘲讽。", player, "vein");
      }
    } else if (b.type === "summonSelfCopy") {
      const copy = summonMinion(state, player, def.id, openZones(player)[0], null);
      if (copy) {
        copyMinionStats(minion, copy);
        copy.name = minion.name;
        log(state, "战吼：" + minion.name + " 召唤了自身的复制。", player, "battlecry");
      }
    } else if (b.type === "silenceDraw") {
      if (target && !target.dead) silenceMinion(state, target);
      drawCard(state, player, b.draw || 1);
    } else if (b.type === "summonTokenBuff") {
      const hadAlly = aliveMinions(player).some(x => x.uid !== minion.uid);
      const token = summonMinion(state, player, b.token, openZones(player)[0], null);
      if (token && hadAlly) buffMinion(state, token, b.attack || 1, b.health || 1, "育巢", true);
    } else if (b.type === "buffAllTaunt") {
      for (const m of aliveMinions(player)) {
        buffMinion(state, m, 0, b.health || 1, "战吼", true);
        grantTaunt(state, m);
      }
    } else if (b.type === "spellDraw") {
      if ((player.spellsCastThisTurn || 0) > 0) drawCard(state, player, b.draw || 1);
    }
  }

  function resolveSpell(state, player, def, target, opts) {
    const s = def.spell;
    if (!s) return;
    if (s.type === "buffHeal") {
      if (!target || target.dead) return;
      buffMinion(state, target, s.attack || 0, s.health || 0, "法术", true);
      const zoneMates = player.board[target.zone].filter(m => m.uid !== target.uid && !m.dead);
      if (zoneMates.length && s.healIfTogether) healMinion(state, target, s.healIfTogether);
    } else if (s.type === "healDraw") {
      if (target && !target.dead) healMinion(state, target, s.amount);
      drawCard(state, player, s.draw || 1);
    } else if (s.type === "draw") {
      drawCard(state, player, s.amount || 1);
    } else if (s.type === "bloodDraw") {
      if (!target || target.dead) return;
      damageMinion(state, target, s.damage || 2, null, "血祭仪式");
      drawCard(state, player, s.draw || 1);
      if (target.dead) drawCard(state, player, s.extraIfDead || 1);
    } else if (s.type === "summonMonster") {
      summonMinion(state, player, "losutai_beast", openZones(player)[0], null);
      if (s.vein != null && state.vein >= s.vein) summonMinion(state, player, "losutai_imp", openZones(player)[0], null);
    } else if (s.type === "buffCharge") {
      if (!target || target.dead) return;
      buffMinion(state, target, s.attack || 0, 0, "法术", true);
      target.charge = true;
      if (!target.hasAttacked) target.attacksLeft = Math.max(target.attacksLeft, 1);
      log(state, target.name + " 获得冲锋。", player, "charge");
    } else if (s.type === "gainMana") {
      player.mana = Math.min(10, player.mana + (s.amount || 1));
      log(state, player.name + " 获得 " + (s.amount || 1) + " 点行动槽。", player, "mana");
    } else if (s.type === "channelVein") {
      addVein(state, s.amount || -2, "流脉疏导");
      drawCard(state, player, s.draw || 1);
    } else if (s.type === "damage") {
      if (target && !target.dead) damageMinion(state, target, s.amount || 1, null, "法术");
    } else if (s.type === "freezeDraw") {
      if (target && !target.dead) freezeMinion(state, target);
      drawCard(state, player, s.draw || 1);
    } else if (s.type === "freezeAll") {
      for (const m of aliveMinions(opponentOf(state, player)).filter(m => !m.stealth)) freezeMinion(state, m);
      log(state, "所有敌方角色被封印。", player, "freeze");
    } else if (s.type === "discover") {
      openDiscover(state, player, s.pool || "any", def.id);
    } else if (s.type === "drawVein") {
      drawCard(state, player, s.amount || 1);
      if (state.vein >= (s.vein || 4)) drawCard(state, player, s.bonus || 1);
    } else if (s.type === "buffTaunt") {
      if (target && !target.dead) {
        buffMinion(state, target, s.attack || 0, s.health || 0, "法术", true);
        grantTaunt(state, target);
      }
    } else if (s.type === "damageAllEnemiesDraw") {
      for (const m of aliveMinions(opponentOf(state, player))) damageMinion(state, m, s.amount || 4, null, "法术");
      drawCard(state, player, s.draw || 1);
      log(state, "法术：对所有敌方随从造成 " + (s.amount || 4) + " 点伤害。", player, "spell");
    } else if (s.type === "damageAll") {
      for (const p of state.players) {
        for (const z of ZONES) {
          for (const m of p.board[z].slice()) damageMinion(state, m, s.amount || 5, null, "终末钟声");
        }
        damageHero(state, p, s.amount || 5, null, "终末钟声", true);
      }
      log(state, "终末钟声：对所有角色造成 " + (s.amount || 5) + " 点伤害。", player, "spell");
    } else if (s.type === "returnAllEnemies") {
      const enemies = aliveMinions(opponentOf(state, player)).slice();
      for (const m of enemies) returnMinionToHand(state, m);
      log(state, "时间回流：所有敌方随从被移回手牌。", player, "bounce");
    } else if (s.type === "summonTwoTokens") {
      const count = s.count || 2;
      for (let i = 0; i < count; i++) summonMinion(state, player, s.token, openZones(player)[0], null);
      log(state, "星门：召唤了 " + count + " 个星界守卫。", player, "summon");
    } else if (s.type === "armorVeinDraw") {
      player.armor += s.armor || 0;
      addVein(state, s.vein || 0, "流脉什一税");
      drawCard(state, player, s.draw || 1);
      log(state, player.name + " 获得 " + (s.armor || 0) + " 点护甲。", player, "armor");
    } else if (s.type === "damagePerSpell") {
      const count = Math.max(1, player.spellsCastThisTurn || 1);
      const dmg = count * (s.amount || 2);
      damageHero(state, opponentOf(state, player), dmg, null, "法术风暴", true);
      log(state, "法术风暴：本回合第 " + count + " 张法术，对敌方英雄造成 " + dmg + " 点伤害。", player, "spell");
    }
  }

  function freezeMinion(state, m) {
    if (!m || m.dead) return;
    m.frozenTurns = Math.max(m.frozenTurns || 0, 1);
    state.events.push({ structured: true, kind: "freeze", targetUid: m.uid, player: ownerOf(state, m).index });
    log(state, m.name + " 被冻结。", ownerOf(state, m), "freeze");
  }

  function grantTaunt(state, m) {
    if (!m || m.dead) return;
    m.taunt = true;
    if (!m.keywords.includes("taunt")) m.keywords.push("taunt");
    log(state, m.name + " 获得嘲讽。", ownerOf(state, m), "taunt");
  }

  function openDiscover(state, player, pool, sourceCardId) {
    const all = Object.keys(D.CARDS).filter(id => {
      const d = card(id);
      if (d.token || d.disabled) return false;
      if (pool === "any") return true;
      if (pool === "spell") return d.type === "spell";
      if (pool === "minion") return d.type === "minion";
      return d.faction === pool;
    });
    const shuffled = shuffle(state, all);
    const options = shuffled.slice(0, 3);
    state.pendingChoice = {
      type: "discover",
      player: player.index,
      options: options,
      source: sourceCardId
    };
    log(state, player.name + " 触发发现，等待选择。", player, "discover");
  }

  function resolveDiscover(state, playerIndex, cardId) {
    if (!state.pendingChoice || state.pendingChoice.type !== "discover") return { ok: false, reason: "没有待处理的发现" };
    if (state.pendingChoice.player !== playerIndex) return { ok: false, reason: "不是你的选择" };
    if (state.pendingChoice.options.indexOf(cardId) < 0) return { ok: false, reason: "不在发现选项中" };
    addCardToHand(state, state.players[playerIndex], cardId, {});
    state.pendingChoice = null;
    return { ok: true };
  }

  function getAttackOptions(state, playerIndex, attackerUid) {
    const player = state.players[playerIndex];
    const m = player ? allMinions(player).find(x => x.uid === attackerUid) : null;
    if (!m || m.dead || m.attacksLeft <= 0 || m.frozenTurns > 0) return { ok: false, targets: [] };
    const enemy = opponentOf(state, player);
    const taunts = aliveMinions(enemy).filter(x => x.taunt && !x.stealth);
    let targets = [];
    if (taunts.length) {
      targets = taunts.map(x => x.uid);
    } else {
      targets = aliveMinions(enemy).filter(x => !x.stealth).map(x => x.uid);
      targets.push("hero");
    }
    return { ok: true, targets: targets };
  }

  function attack(state, playerIndex, attackerUid, targetUid) {
    if (state.status !== "playing") return { ok: false, reason: "对局已结束" };
    if (state.current !== playerIndex) return { ok: false, reason: "还没轮到你" };
    const player = state.players[playerIndex];
    const attacker = allMinions(player).find(m => m.uid === attackerUid);
    if (!attacker) return { ok: false, reason: "找不到攻击者" };
    if (attacker.attacksLeft <= 0) return { ok: false, reason: "该角色本回合已经攻击过" };
    if (attacker.frozenTurns > 0) return { ok: false, reason: "该角色被冻结" };
    const opts = getAttackOptions(state, playerIndex, attackerUid);
    const legalTarget = targetUid === "hero" ? opts.targets.indexOf("hero") >= 0 : opts.targets.indexOf(targetUid) >= 0;
    if (!opts.ok || !legalTarget) {
      return { ok: false, reason: "不能攻击该目标（可能有嘲讽）", targets: opts.targets };
    }
    const enemy = opponentOf(state, player);
    attacker.attacksLeft -= 1;
    attacker.hasAttacked = true;
    attacker.stealth = false;
    if (targetUid === "hero") {
      log(state, attacker.name + " 攻击 " + enemy.name + " 的英雄。", player, "attack");
      damageHero(state, enemy, attacker.attack, attacker, "角色攻击");
      processDeaths(state);
      return { ok: true };
    }
    const defender = findMinion(state, targetUid);
    if (!defender || defender.dead) return { ok: false, reason: "目标已不在场" };
    log(state, attacker.name + " 攻击 " + defender.name + "。", player, "attack");
    const atk = attacker.attack;
    const def = defender.attack;
    damageMinion(state, defender, atk, attacker, "战斗");
    damageMinion(state, attacker, def, defender, "反击");
    processDeaths(state);
    checkGameOver(state);
    return { ok: true };
  }

  function useHeroPower(state, playerIndex, targetUid) {
    if (state.status !== "playing") return { ok: false, reason: "对局已结束" };
    if (state.mulliganPhase) return { ok: false, reason: "请先完成起手调度" };
    if (state.current !== playerIndex) return { ok: false, reason: "还没轮到你" };
    const player = state.players[playerIndex];
    if (player.heroPowerUsed) return { ok: false, reason: "英雄技能本回合已用过" };
    if (player.mana < 2) return { ok: false, reason: "行动槽不足" };
    const heroTargetType = (player.heroId === "otto" || player.heroId === "marta") ? "enemy" : "friendly";
    const targets = heroTargetType === "enemy"
      ? aliveMinions(opponentOf(state, player)).filter(m => !m.stealth)
      : aliveMinions(player);
    if (!targets.length) return { ok: false, reason: heroTargetType === "enemy" ? "没有敌方角色可作为目标" : "没有友方角色可作为目标" };
    let target = null;
    if (targetUid) target = targets.find(m => m.uid === targetUid);
    if (!target) return { ok: false, reason: heroTargetType === "enemy" ? "请选择一个敌方角色" : "请选择一个友方角色", code: "target", targets: targets.map(m => m.uid) };
    player.mana -= 2;
    player.heroPowerUsed = true;
    log(state, player.name + " 使用英雄技能「" + player.hero.power.name + "」。", player, "heroPower");
    if (player.heroId === "lain") {
      const zoneMates = player.board[target.zone].filter(m => m.uid !== target.uid && !m.dead);
      const attack = zoneMates.length ? 1 : 0;
      const health = 1;
      buffMinion(state, target, attack, health, "协调", true);
    } else if (player.heroId === "karna") {
      damageMinion(state, target, 1, null, "血祭");
      drawCard(state, player, 1);
      processDeaths(state);
    } else if (player.heroId === "marta") {
      damageMinion(state, target, 1, null, "演算");
      processDeaths(state);
    } else if (player.heroId === "wolfram") {
      grantTaunt(state, target);
    } else if (player.heroId === "otto") {
      damageMinion(state, target, 2, null, "炮击");
      processDeaths(state);
    }
    checkGameOver(state);
    return { ok: true };
  }

  function startTurn(state) {
    if (state.status !== "playing") return;
    const player = state.players[state.current];
    state.turnNumber++;
    player.maxMana = Math.min(10, player.maxMana + 1);
    player.mana = player.maxMana;
    player.heroPowerUsed = false;
    player.spellsCastThisTurn = 0;
    player.nextCostReduction = 0;
    for (const m of allMinions(player)) {
      m.attacksLeft = 1;
      m.hasAttacked = false;
      m.justPlayed = false;
    }
    log(state, "—— " + player.name + " 的回合开始（第 " + state.round + " 轮，行动槽 " + player.mana + "/" + player.maxMana + "）——", player, "turn");
    drawCard(state, player, 1);
    checkGameOver(state);
  }

  function endTurn(state, playerIndex) {
    if (state.status !== "playing") return { ok: false, reason: "对局已结束" };
    if (state.mulliganPhase) return { ok: false, reason: "请先完成起手调度" };
    if (state.current !== playerIndex) return { ok: false, reason: "还没轮到你" };
    if (state.pendingChoice) return { ok: false, reason: "请先完成当前选择" };
    const player = state.players[playerIndex];
    player.nextCostReduction = 0;
    // 冻结解冻：控制者的回合结束时递减
    for (const m of allMinions(player)) {
      if (m.frozenTurns > 0) {
        m.frozenTurns -= 1;
        if (m.frozenTurns === 0) log(state, m.name + " 解冻。", player, "thaw");
      }
    }
    for (const m of allMinions(player)) {
      if (m.passive && m.passive.type === "endTurnSelfDamage" && !m.silenced) damageMinion(state, m, m.passive.amount || 1, null, "自伤");
    }
    processDeaths(state);
    log(state, player.name + " 结束回合。", player, "endTurn");
    if (playerIndex === 0) {
      state.current = 1;
    } else {
      state.current = 0;
      state.round++;
      addVein(state, 1, "自然回流");
    }
    checkGameOver(state);
    if (state.status === "playing") startTurn(state);
    return { ok: true };
  }

  function getPlayOptions(state, playerIndex, cardUid) {
    const player = state.players[playerIndex];
    const c = player.hand.find(x => x.uid === cardUid);
    if (!c) return { ok: false, reason: "没有这张手牌" };
    const def = card(c.cardId);
    const targetType = getTargetType(state, def);
    const targets = getValidTargets(state, player, targetType);
    const zones = def.type === "minion" ? openZones(player) : [];
    const cost = getCardCost(state, player, c);
    const canMana = player.mana >= cost;
    const canBoard = def.type !== "minion" || boardCount(player) < 6;
    const canTarget = !targetType || targets.length > 0 || targetType === "friendly" || !!def.optionalTarget || (def.id === "miyuki" && state.vein >= 6);
    const canZone = def.type !== "minion" || zones.length > 0;
    return {
      ok: canMana && canBoard && canTarget && canZone,
      card: def,
      cost: cost,
      targetType: targetType,
      targets: targets.map(m => m.uid),
      zones: zones,
      canMana: canMana,
      canBoard: canBoard,
      canTarget: canTarget,
      bloodCost: def.bloodCost || 0,
      reason: !canMana ? "行动槽不足" : !canBoard ? "角色区已满" : !canTarget ? "没有合法目标" : null
    };
  }

  function getHeroPowerOptions(state, playerIndex) {
    const player = state.players[playerIndex];
    if (!player) return { ok: false, targets: [] };
    const targetType = player.heroId === "otto" ? "enemy" : "friendly";
    const targets = targetType === "enemy"
      ? aliveMinions(opponentOf(state, player)).filter(m => !m.stealth)
      : aliveMinions(player);
    return {
      ok: !player.heroPowerUsed && player.mana >= 2 && targets.length > 0,
      targets: targets.map(m => m.uid),
      targetType: targetType,
      cost: 2,
      used: player.heroPowerUsed
    };
  }

  function mulliganPlayer(state, playerIndex, uids) {
    if (!state.mulliganPhase) return { ok: false, reason: "当前不在起手调度阶段" };
    if (state.mulliganDone && state.mulliganDone[playerIndex]) return { ok: false, reason: "你已经完成调度" };
    const player = state.players[playerIndex];
    if (!player) return { ok: false, reason: "玩家不存在" };
    const unique = Array.from(new Set(uids || []));
    const removed = [];
    for (const cardUid of unique) {
      const idx = player.hand.findIndex(c => c.uid === cardUid);
      if (idx < 0) continue;
      removed.push(player.hand.splice(idx, 1)[0]);
    }
    if (removed.length) {
      player.deck.push(...removed);
      player.deck = shuffle(state, player.deck);
      for (let i = 0; i < removed.length; i++) drawCard(state, player, 1);
      log(state, player.name + " 起手调度：换掉 " + removed.length + " 张牌。", player, "mulligan");
    }
    state.mulliganDone[playerIndex] = true;
    if (state.mulliganDone[0] && state.mulliganDone[1]) state.mulliganPhase = false;
    return { ok: true, replaced: removed.length, done: state.mulliganDone };
  }

  function createGame(config) {
    config = config || {};
    const faction1 = config.faction1 || "pus";
    const faction2 = config.faction2 || "xizhao";
    const seed = config.seed == null ? (Date.now() >>> 0) : (config.seed >>> 0);
    const state = {
      seed: seed,
      rngState: seed || 1,
      mode: config.mode || "ai",
      players: [],
      current: 0,
      round: 1,
      turnNumber: 0,
      vein: 0,
      status: "playing",
      winner: null,
      pendingChoice: null,
      log: [],
      events: [],
      stats: {
        veinPeak: 0,
        thresholds: { 4: 0, 7: 0, 10: 0 },
        minionsSummoned: 0,
        minionsDied: 0,
        result: null,
        firstPlayer: null
      }
    };
    state.players.push(createPlayer(0, faction1, !!config.p1AI));
    state.players.push(createPlayer(1, faction2, !!config.p2AI));
    state.players[0].name = config.p1Name || (config.p1AI ? D.FACTIONS[faction1].name + "推演体" : "玩家 1");
    state.players[1].name = config.p2Name || (config.p2AI ? D.FACTIONS[faction2].name + "推演体" : "玩家 2");
    state.players[0].deck = buildDeck(state, faction1, config.p1Deck);
    state.players[1].deck = buildDeck(state, faction2, config.p2Deck);
    // 随机先手：先手 3 张，后手 4 张 + 采掘许可
    const first = config.first == null ? (nextRandom(state) < 0.5 ? 0 : 1) : config.first;
    const second = 1 - first;
    state.current = first;
    state.stats.firstPlayer = first;
    state.players[first].armor += 1;
    for (let i = 0; i < 3; i++) drawCard(state, state.players[first], 1);
    for (let i = 0; i < 4; i++) drawCard(state, state.players[second], 1);
    // 起手调度：保证双方至少有一张 1 费牌，避免前两回合无事可做。
    for (const p of state.players) {
      const hasCheap = p.hand.some(c => card(c.cardId).cost <= 1);
      if (!hasCheap) {
        const deckIdx = p.deck.findIndex(c => card(c.cardId).cost <= 1);
        if (deckIdx >= 0) {
          let handIdx = 0;
          let bestCost = -1;
          for (let i = 0; i < p.hand.length; i++) {
            const cc = card(p.hand[i].cardId).cost;
            if (cc > bestCost) { bestCost = cc; handIdx = i; }
          }
          const temp = p.hand[handIdx];
          p.hand[handIdx] = p.deck[deckIdx];
          p.deck[deckIdx] = temp;
          log(state, p.name + " 起手调度：补充一张低费牌。", p, "balance");
        }
      }
    }
    state.players[second].hand.push({ uid: uid("c"), cardId: "mining_permit", generated: true });
    if (config.mulligan) {
      state.mulliganPhase = true;
      state.mulliganDone = { 0: false, 1: false };
    }
    log(state, "档案推演开始。先手：" + state.players[first].name + "（+1 点先手护甲）。", state.players[first], "start");
    startTurn(state);
    return state;
  }

  function getMinion(state, minionUid) { return findMinion(state, minionUid); }
  function getPlayer(state, index) { return state.players[index]; }

  return {
    createGame: createGame,
    playCard: playCard,
    attack: attack,
    useHeroPower: useHeroPower,
    endTurn: endTurn,
    resolveDiscover: resolveDiscover,
    mulliganPlayer: mulliganPlayer,
    retreatMinion: retreatMinion,
    getPlayOptions: getPlayOptions,
    getAttackOptions: getAttackOptions,
    getHeroPowerOptions: getHeroPowerOptions,
    getMinion: getMinion,
    getPlayer: getPlayer,
    getCard: card,
    hero: hero,
    allMinions: allMinions,
    aliveMinions: aliveMinions,
    openZones: openZones,
    ZONES: ZONES,
    ZONE_NAMES: ZONE_NAMES,
    getCardCost: getCardCost,
    drawCard: drawCard,
    addVein: addVein,
    damageMinion: damageMinion,
    damageHero: damageHero,
    healMinion: healMinion,
    buffMinion: buffMinion,
    findMinion: findMinion
  };
});
