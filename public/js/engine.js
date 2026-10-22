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
  function zoneHasSpace(player, zone) { return player.board[zone].length < 3; }
  function openZones(player) { return ZONES.filter(z => zoneHasSpace(player, z)); }

  function log(state, text, player, type, cardId) {
    const entry = { turn: state.turnNumber, round: state.round, text: text, player: player == null ? null : player.index, type: type || "info", cardId: cardId || null };
    state.log.push(entry);
    if (state.log.length > 260) state.log.splice(0, state.log.length - 260);
    state.events.push({ kind: type || "info", text: text, player: entry.player });
    if (state.events.length > 60) state.events.splice(0, state.events.length - 60);
  }

  function createPlayer(index, factionId, isAI) {
    const faction = D.FACTIONS[factionId];
    const heroId = faction.hero;
    const baseHero = hero(heroId);
    // 每个玩家持有独立的英雄数据副本，遗物替换技能时不会污染其他对局。
    const heroDef = Object.assign({}, baseHero, {
      power: Object.assign({}, baseHero.power),
      passive: baseHero.passive ? Object.assign({}, baseHero.passive) : baseHero.passive
    });
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
      spellCostReduction: 0,
      fatigue: 0,
      cardsPlayed: 0,
      spellsCastThisTurn: 0,
      cardsPlayedThisTurn: 0,
      overload: 0,
      veinDebt: 0,
      freezeImmuneTurn: false,
      healBlockTurn: false,
      freeSpellTurn: false,
      nextSpellReduction: 0,
      minionsPlayedThisTurn: 0,
      tauntMinionsPlayedThisTurn: 0,
      recruitsSummonedThisTurn: 0,
      bountiesClaimed: 0,
      bountiesClaimedThisTurn: 0,
      ottoArmorProc: false,
      ottoTurnCounter: 0,
      lainArmorProc: false,
      veinHeartProc: false,
      relic: null,
      formations: [],
      damageDealt: 0
    };
  }

  function buildDeck(state, factionId, customList) {
    let ids = D.DECKS[factionId];
    const mainOnly = Array.isArray(customList) && customList.length === 30 && customList.every(id => D.CARDS[id] && D.CARDS[id].type !== "relic");
    const withRelic = Array.isArray(customList) && customList.length === 31 && customList.filter(id => D.CARDS[id] && D.CARDS[id].type === "relic").length === 1;
    if (mainOnly || withRelic) {
      ids = customList.slice();
    } else if (Array.isArray(customList) && D.validateDeck && D.validateDeck(factionId, customList).ok) {
      ids = customList.slice();
    } else if (Array.isArray(customList)) {
      state.deckWarnings = state.deckWarnings || [];
      state.deckWarnings.push("自定义牌组不合法，已回退到预设牌组。");
    }
    return shuffle(state, ids).map(id => ({ uid: uid("c"), cardId: id }));
  }

  function makeMinion(state, owner, cardId, zone, opts) {
    const def = card(cardId);
    const entrySeq = (state.nextMinionSeq = (state.nextMinionSeq || 0) + 1);
    const charge = (def.keywords || []).includes("charge");
    const taunt = (def.keywords || []).includes("taunt") || !!(opts && opts.taunt);
    const m = {
      uid: uid("m"),
      entrySeq: entrySeq,
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
      dynAttack: 0,
      dynHealth: 0,
      keywords: (def.keywords || []).slice(),
      taunt: taunt,
      charge: charge,
      divineShield: (def.keywords || []).includes("divineShield"),
      windfury: (def.keywords || []).includes("windfury"),
      poisonous: (def.keywords || []).includes("poisonous"),
      lifesteal: (def.keywords || []).includes("lifesteal"),
      rush: (def.keywords || []).includes("rush"),      reborn: (def.keywords || []).includes("reborn"),
      rebornUsed: false,
      stealth: (def.keywords || []).includes("stealth") || !!(opts && opts.stealth),
      frozenTurns: 0,
      silenced: false,
      dead: false,
      attacksLeft: (() => { const wf = (def.keywords || []).includes("windfury"); if (charge) return wf ? 2 : 1; if ((def.keywords || []).includes("rush")) return wf ? 2 : 1; return 0; })(),
      attacksUsedThisTurn: 0,
      hasAttacked: false,
      ignoreTaunt: false,
      justPlayed: true,
      passive: def.passive || null,
      deathrattle: def.deathrattle || null,
      deathrattles: def.deathrattle ? [def.deathrattle] : [],
      bounty: null,
      token: !!def.token,
      formationVein: false
    };
    if (opts && opts.taunt) {
      m.taunt = true;
      if (!m.keywords.includes("taunt")) m.keywords.push("taunt");
    }
    const ownerPlayer = owner && owner.heroId ? owner : state.players[owner];
    if (ownerPlayer && ownerPlayer.relic === "iron_banner" && m.taunt && !m.silenced) {
      m.attack += 1;
      m.health += 1;
      m.maxHealth += 1;
    }
    if (ownerPlayer && ownerPlayer.relic === "gh_venom_vial" && m.poisonous && !m.silenced) {
      m.health += 1;
      m.maxHealth += 1;
    }
    return m;
  }

  function formationBonus(player, zone) {
    const out = { attack: 0, health: 0, taunt: false, rush: false, charge: false, lifesteal: false, stealth: false, deathrattleSummon: null, excludeDeathrattle: null };
    let hasFormation = false;
    for (const f of player.formations || []) {
      if (f.zone !== zone) continue;
      if (f.turnsLeft != null && f.turnsLeft <= 0) continue;
      const d = card(f.cardId);
      if (d && d.formation) {
        hasFormation = true;
        out.attack += d.formation.attack || 0;
        out.health += d.formation.health || 0;
        out.taunt = out.taunt || !!d.formation.taunt;
        out.rush = out.rush || !!d.formation.rush;
        out.charge = out.charge || !!d.formation.charge;
        out.lifesteal = out.lifesteal || !!d.formation.lifesteal;
        out.stealth = out.stealth || !!d.formation.stealth;
        out.deathrattleSummon = out.deathrattleSummon || d.formation.deathrattleSummon || null;
        out.excludeDeathrattle = out.excludeDeathrattle || d.formation.excludeDeathrattle || null;
      }
    }
    if (hasFormation && player.relic === "formation_standard") { out.attack += 1; }
    return out;
  }

  function activeFormation(player, zone, cardId) {
    return (player.formations || []).some(f => f.zone === zone && (!cardId || f.cardId === cardId) && (f.turnsLeft == null || f.turnsLeft > 0));
  }

  function markFormationVein(player, m) {
    if (!m || m.formationVein) return;
    if (activeFormation(player, m.zone, "formation_vein")) m.formationVein = true;
  }

  function applyFormationToZone(state, player, zone) {
    const b = formationBonus(player, zone);
    if (!b.attack && !b.health && !b.taunt && !b.rush && !b.charge && !b.lifesteal && !b.stealth && !b.deathrattleSummon && !activeFormation(player, zone, "formation_vein")) return;
    for (const m of aliveMinions(player).filter(x => x.zone === zone)) {
      buffMinion(state, m, b.attack, b.health, "阵型", true);
      if (b.taunt) grantTaunt(state, m);
      if (b.rush) { m.rush = true; if (!m.hasAttacked) m.attacksLeft = Math.max(m.attacksLeft, m.windfury ? 2 : 1); }
      if (b.charge) { m.charge = true; if (!m.hasAttacked) m.attacksLeft = Math.max(m.attacksLeft, m.windfury ? 2 : 1); }
      if (b.lifesteal) { m.lifesteal = true; if (!m.keywords.includes("lifesteal")) m.keywords.push("lifesteal"); }
      if (b.stealth) { m.stealth = true; if (!m.keywords.includes("stealth")) m.keywords.push("stealth"); }
      if (b.deathrattleSummon && b.excludeDeathrattle !== m.cardId) {
        addDeathrattleEffect(m, { type: "summon", token: b.deathrattleSummon, count: 1 });
        if (!m.keywords.includes("deathrattle")) m.keywords.push("deathrattle");
      }
      markFormationVein(player, m);
    }
  }

  function summonMinion(state, player, cardId, zone, opts) {
    const def = card(cardId);
    if (boardCount(player) >= 6) {
      log(state, "随从已满（全场最多 6 个），无法召唤 " + def.name + "。", player, "error");
      return null;
    }
    const z = zone || openZones(player)[0];
    if (!z || !zoneHasSpace(player, z)) {
      log(state, "阵位已满，无法召唤 " + def.name + "。", player, "error");
      return null;
    }
    const m = makeMinion(state, player, cardId, z, opts);
    player.board[z].push(m);
    markFormationVein(player, m);
    const fb = formationBonus(player, z);
    if (fb.attack || fb.health) {
      m.attack += fb.attack;
      m.health += fb.health;
      m.maxHealth += fb.health;
    }
    if (fb.taunt) grantTaunt(state, m);
    if (fb.rush) { m.rush = true; if (!m.hasAttacked) m.attacksLeft = Math.max(m.attacksLeft, m.windfury ? 2 : 1); }
    if (fb.charge) { m.charge = true; if (!m.hasAttacked) m.attacksLeft = Math.max(m.attacksLeft, m.windfury ? 2 : 1); }
    if (fb.lifesteal) { m.lifesteal = true; if (!m.keywords.includes("lifesteal")) m.keywords.push("lifesteal"); }
    if (fb.stealth) { m.stealth = true; if (!m.keywords.includes("stealth")) m.keywords.push("stealth"); }
    if (fb.deathrattleSummon && fb.excludeDeathrattle !== m.cardId) {
      addDeathrattleEffect(m, { type: "summon", token: fb.deathrattleSummon, count: 1 });
      if (!m.keywords.includes("deathrattle")) m.keywords.push("deathrattle");
    }
    log(state, player.name + " 召唤了 " + def.name + "（" + ZONE_NAMES[z] + "）。", player, "summon");
    state.events.push({ structured: true, kind: "summon", player: player.index, zone: z });
    state.stats.minionsSummoned++;
    if (cardId === "republic_recruit") player.recruitsSummonedThisTurn = (player.recruitsSummonedThisTurn || 0) + 1;
    if (m.taunt) {
      for (const ally of aliveMinions(player)) {
        if (ally.passive && ally.passive.type === "tauntAura" && !ally.silenced) {
          m.health += ally.passive.amount || 1;
          m.maxHealth += ally.passive.amount || 1;
        }
      }
    }
    recomputeAuras(state);
    // 测试版平衡：移除普卫岛全员免费协同，位置协同只由领袖技能与「协同调度」提供。
    return m;
  }

  function drawCard(state, player, count) {
    let n = count == null ? 1 : count;
    for (let i = 0; i < n; i++) {
      if (player.deck.length === 0) {
        player.fatigue += 1;
        log(state, player.name + " 牌库已空，受到 " + player.fatigue + " 点疲劳伤害。", player, "fatigue");
        damageHero(state, player, player.fatigue, null, "疲劳");
        if (state.status !== "playing") break;
        continue;
      }
      const c = player.deck.shift();
      if (player.hand.length >= 8) {
        log(state, player.name + " 手牌已满，" + card(c.cardId).name + " 被烧掉。", player, "burn");
      } else {
        player.hand.push(c);
        log(state, player.name + " 抽到 " + card(c.cardId).name + "。", player, "draw");
        state.events.push({ structured: true, kind: "draw", player: player.index });
        maybeCopyGainedSpell(state, player, c);
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
    maybeCopyGainedSpell(state, player, c);
    return c;
  }

  function maybeCopyGainedSpell(state, player, cardObj) {
    if (!player.copyNextSpell || !cardObj) return;
    const def = card(cardObj.cardId);
    if (!def || def.type !== "spell") return;
    player.copyNextSpell -= 1;
    if (player.hand.length >= 8) { log(state, player.name + " 手牌已满，洞察的复制效果失效。", player, "burn"); return; }
    player.hand.push({ uid: uid("c"), cardId: cardObj.cardId, generated: true });
    log(state, player.name + " 的洞察复制了「" + def.name + "」。", player, "copy");
  }

  function discoverPool(player, pool) {
    return Object.keys(D.CARDS).filter(id => {
      const d = card(id);
      if (!d || d.token || d.disabled) return false;
      if (d.faction !== "neutral" && d.faction !== player.faction) return false;
      if (pool === "any") return true;
      if (pool === "spell") return d.type === "spell";
      if (pool === "minion") return d.type === "minion";
      return d.faction === pool;
    });
  }

  function addRandomSpell(state, player, label) {
    const pool = discoverPool(player, "spell");
    if (!pool.length) return null;
    const id = pool[randomInt(state, pool.length)];
    const added = addCardToHand(state, player, id, {});
    if (added) log(state, "额外检索战术牌：" + card(id).name + "。", player, label || "discover");
    return added;
  }

  // 非当前回合的死亡检索自动从牌库取一张法术牌，避免为对手弹出选择框卡住流程。
  function addRandomSpellFromDeck(state, player, label) {
    const spells = player.deck.filter(c => card(c.cardId).type === "spell");
    if (!spells.length) {
      log(state, player.name + " 的牌库中没有战术牌，检索失败。", player, "discover");
      return null;
    }
    const pick = spells[randomInt(state, spells.length)];
    player.deck = player.deck.filter(c => c.uid !== pick.uid);
    if (player.hand.length >= 8) {
      log(state, player.name + " 手牌已满，" + card(pick.cardId).name + " 被烧掉。", player, "burn");
      return null;
    }
    player.hand.push(pick);
    log(state, (label || "阵亡检索") + "：" + player.name + " 将「" + card(pick.cardId).name + "」置入手牌。", player, "discover");
    return pick;
  }

  function getCardCost(state, player, cardIdOrCard) {
    const id = typeof cardIdOrCard === "string" ? cardIdOrCard : cardIdOrCard.cardId;
    const def = card(id);
    const handDiscount = cardIdOrCard && typeof cardIdOrCard === "object" ? Math.max(0, cardIdOrCard.discount || 0) : 0;
    let firstCardDiscount = 0;
    if (player && (player.cardsPlayedThisTurn || 0) === 0) {
      for (const m of aliveMinions(player)) {
        if (!m.silenced && m.passive && m.passive.type === "firstCardDiscount") {
          firstCardDiscount = Math.max(firstCardDiscount, m.passive.amount || 1);
        }
      }
    }
    if (def.type === "spell" && player.freeSpellTurn) return 0;
    const spellReduction = def.type === "spell" ? (player.spellCostReduction || 0) + (player.nextSpellReduction || 0) : 0;
    return Math.max(0, def.cost - (player.nextCostReduction || 0) - spellReduction - handDiscount - firstCardDiscount);
  }

  // 逆流 N：消耗 N 点流脉触发。流脉不足 N 时消耗到 0 仍触发；流脉为 0 时效果无效。
  function payReflux(state, player, def) {
    const need = def && def.reflux;
    if (!need) return true;
    if ((state.vein || 0) <= 0) {
      log(state, "流脉为 0，逆流未触发。", player, "vein");
      return false;
    }
    const spent = Math.min(state.vein, need);
    log(state, "逆流 " + need + " 触发：消耗 " + spent + " 点流脉。", player, "vein");
    addVein(state, -spent, "逆流");
    return true;
  }

  // 压脉 N：流脉 ≥ N 时消耗 N 点，对敌方领袖造成 N 点伤害；不足 N 点则不触发。
  function resolvePressure(state, player, def, source) {
    const need = def && def.pressure;
    if (!need) return;
    if ((state.vein || 0) < need) {
      log(state, "流脉不足 " + need + " 点：压脉未触发，整张牌效果无效。", player, "vein");
      return;
    }
    addVein(state, -need, "压脉");
    damageHero(state, opponentOf(state, player), need, source || null, "压脉", true);
    log(state, "压脉 " + need + "：对敌方领袖造成 " + need + " 点伤害。", player, "damage");
    checkGameOver(state);
  }

  // 镇脉 N：消耗 N 点流脉，获得等量护甲；流脉不足 N 时获得剩余流脉的护甲并清零。
  function resolveZhenmai(state, player, def) {
    const need = def && def.zhenmai;
    if (!need) return;
    const gain = Math.min(state.vein || 0, need);
    if (gain > 0) addVein(state, -gain, "镇脉");
    player.armor += gain;
    state.events.push({ structured: true, kind: "armor", player: player.index, amount: gain });
    log(state, "镇脉 " + need + "：消耗 " + gain + " 点流脉，获得 " + gain + " 点护甲。", player, "armor");
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

  function setAuraStats(m, attack, health) {
    if (!m || m.dead) return;
    const da = attack - (m.dynAttack || 0);
    const dh = health - (m.dynHealth || 0);
    if (da) m.attack += da;
    if (dh) {
      m.maxHealth = Math.max(1, m.maxHealth + dh);
      m.health = Math.max(1, Math.min(m.maxHealth, m.health + dh));
    }
    m.dynAttack = attack;
    m.dynHealth = health;
  }

  function recomputeAuras(state) {
    if (!state || !state.players) return;
    const all = [];
    for (const p of state.players) for (const m of aliveMinions(p)) all.push({ m, p });
    for (const entry of all) setAuraStats(entry.m, 0, 0);
    const bonus = new Map();
    const add = (m, a, h) => {
      if (!m || m.dead || (!a && !h)) return;
      const b = bonus.get(m.uid) || { attack: 0, health: 0 };
      b.attack += a; b.health += h; bonus.set(m.uid, b);
    };
    for (const { m, p } of all) {
      const def = card(m.cardId);
      if (!def) continue;
      const zoneAllies = aliveMinions(p).filter(x => x.uid !== m.uid && x.zone === m.zone);
      if (def.zoneBonus && !m.silenced && (def.zoneBonus.attack || def.zoneBonus.health)) {
        add(m, (def.zoneBonus.attack || 0) * zoneAllies.length, (def.zoneBonus.health || 0) * zoneAllies.length);
      }
      if (def.mirrorBonus && !m.silenced && (def.mirrorBonus.attack || def.mirrorBonus.health)) {
        const mirrorEnemy = opponentOf(state, p);
        if (aliveMinions(mirrorEnemy).some(x => x.zone === m.zone)) {
          add(m, def.mirrorBonus.attack || 0, def.mirrorBonus.health || 0);
        }
      }
      if (def.zoneAura && !m.silenced) {
        for (const other of zoneAllies) if (other.uid !== m.uid) add(other, def.zoneAura.attack || 0, def.zoneAura.health || 0);
      }
      if (m.passive && m.passive.type === "impGrowth" && !m.silenced) {
        const imps = aliveMinions(p).filter(x => x.cardId === "losutai_imp").length;
        add(m, imps * (m.passive.attack || 1), imps * (m.passive.health || 1));
      }
    }
    for (const { m } of all) {
      const b = bonus.get(m.uid);
      setAuraStats(m, b ? b.attack : 0, b ? b.health : 0);
    }
  }

  function damageMinion(state, m, amount, source, label) {
    if (!m || m.dead || amount <= 0) return 0;
    if (source && source.stealth) source.stealth = false;
    if (m.divineShield) {
      m.divineShield = false;
      state.events.push({ structured: true, kind: "shield", targetUid: m.uid, player: ownerOf(state, m).index });
      log(state, m.name + " 的护幕抵挡了 " + amount + " 点伤害。", ownerOf(state, m), "shield");
      return 0;
    }
    const actual = Math.min(amount, m.health);
    state.events.push({ structured: true, kind: "damage", targetUid: m.uid, amount: actual, label: label || "", player: ownerOf(state, m).index, text: m.name + " 受到 " + actual + " 点伤害。" });
    m.health -= amount;
    log(state, m.name + " 受到 " + amount + " 点伤害" + (label ? "（" + label + "）" : "") + "。", ownerOf(state, m), "damage");
    if (source && source.lifesteal && actual > 0) healHero(state, ownerOf(state, source), actual);
    if (source && source.poisonous && !m.dead && actual > 0) {
      m.dead = true;
      state.events.push({ structured: true, kind: "poison", targetUid: m.uid, player: ownerOf(state, m).index });
      log(state, m.name + " 中了蚀毒。", ownerOf(state, m), "poison");
    }
    if (m.passive && m.passive.type === "armorOnDamage" && !m.silenced) {
      const p = ownerOf(state, m);
      p.armor += m.passive.amount;
      log(state, p.name + " 获得 " + m.passive.amount + " 点护甲（" + m.name + "）。", p, "armor");
    }
    if (m.health <= 0) m.dead = true;
    if (source && source.passive && source.passive.type === "damageToArmor" && !source.silenced && actual > 0) {
      const armorOwner = ownerOf(state, source);
      armorOwner.armor += actual;
      log(state, source.name + " 造成伤害，获得 " + actual + " 点护甲。", armorOwner, "armor");
    }
    return amount;
  }

  function healMinion(state, m, amount) {
    if (!m || m.dead) return 0;
    const healer = ownerOf(state, m);
    if (healer.healBlockTurn) amount = 0;
    const before = m.health;
    m.health = Math.min(m.maxHealth, m.health + amount);
    const healed = m.health - before;
    if (healed > 0) { state.events.push({ structured: true, kind: "heal", targetUid: m.uid, amount: healed, player: ownerOf(state, m).index }); log(state, m.name + " 恢复 " + healed + " 点生命。", ownerOf(state, m), "heal"); }
    return healed;
  }

  function damageHero(state, player, amount, source, label, skipCheck) {
    if (amount <= 0) return;
    if (source && source.stealth) source.stealth = false;
    let left = amount;
    if (player.armor > 0) {
      const absorbed = Math.min(player.armor, left);
      player.armor -= absorbed;
      left -= absorbed;
      if (absorbed > 0) log(state, player.name + " 的护甲吸收了 " + absorbed + " 点伤害。", player, "armor");
    }
    player.hp -= left;
    if (source && source.lifesteal && amount > 0) healHero(state, state.players[source.owner], amount);
    if (source && source.passive && source.passive.type === "damageToArmor" && !source.silenced && amount > 0) {
      const armorOwner = source.owner != null ? state.players[source.owner] : null;
      if (armorOwner) { armorOwner.armor += amount; log(state, source.name + " 造成伤害，获得 " + amount + " 点护甲。", armorOwner, "armor"); }
    }
    state.events.push({ structured: true, kind: "damage", targetUid: "hero:" + player.index, amount: amount, label: label || "", player: player.index });
    log(state, player.name + " 受到 " + amount + " 点伤害" + (label ? "（" + label + "）" : "") + "，剩余 " + Math.max(0, player.hp) + " 点生命。", player, "heroDamage");
    if (source && source.owner != null && source.owner !== player.index) {
      state.players[source.owner].damageDealt += amount;
    }
    if (!skipCheck) checkGameOver(state);
  }

  function healHero(state, player, amount) {
    if (player.healBlockTurn) amount = 0;
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
    m.deathrattles = [];
    m.divineShield = false;
    m.windfury = false;
    m.poisonous = false;
    m.lifesteal = false;
    m.rush = false;
    m.reborn = false;
    m.formationVein = false;
    const usedAttacks = m.attacksUsedThisTurn || (m.hasAttacked ? 1 : 0);
    m.attacksLeft = usedAttacks >= 1 ? 0 : (m.justPlayed ? 0 : 1);    m.dynAttack = 0;
    m.dynHealth = 0;
    m.attack = m.baseAttack;
    m.maxHealth = m.baseHealth;
    m.health = Math.min(m.health, m.maxHealth);
    recomputeAuras(state);
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
      recomputeAuras(state);
      return { ok: true };
    }
    return { ok: false, reason: "该随从不在场上。" };
  }

  function beginDeferredDeaths(state) {
    state.deferDeaths = (state.deferDeaths || 0) + 1;
  }

  function endDeferredDeaths(state) {
    state.deferDeaths = Math.max(0, (state.deferDeaths || 0) - 1);
    if (state.deferDeaths === 0 && state.deathsPending) {
      state.deathsPending = false;
      processDeaths(state);
    }
  }

  function processDeaths(state) {
    if (state.deferDeaths) {
      state.deathsPending = true;
      return;
    }
    let changed = true;
    while (changed) {
      changed = false;
      const dead = [];
      for (const p of state.players) {
        for (const z of ZONES) {
          for (const m of p.board[z]) {
            if (m.dead) dead.push({ p, z, m });
          }
        }
      }
      if (!dead.length) break;
      changed = true;
      // 死亡检索：先按入场顺序移除所有死亡实体，再依次结算死亡事件。
      dead.sort((a, b) => (a.m.entrySeq || 0) - (b.m.entrySeq || 0));
      for (const entry of dead) {
        const { p, z, m } = entry;
        p.board[z] = p.board[z].filter(x => x.uid !== m.uid);
        state.events.push({ structured: true, kind: "death", targetUid: m.uid, player: p.index, zone: z });
        log(state, m.name + " 死亡。", p, "death");
        state.stats.minionsDied++;
        state.deathsThisTurn = (state.deathsThisTurn || 0) + 1;
      }
      // 先让离场光环失效，再结算亡语与死亡触发。
      recomputeAuras(state);
      for (const entry of dead) {
        const { p, z, m } = entry;
        if (m.bounty != null) claimBounty(state, state.players[m.bounty.owner], m);
        if (m.formationVein) { healHero(state, p, 1); log(state, "地脉阵线余响：恢复领袖 1 点生命。", p, "deathrattle"); }
        if (m.deathrattles && m.deathrattles.length) {
          for (const d of m.deathrattles.slice()) triggerDeathrattle(state, p, m, d);
        } else if (m.deathrattle) {
          triggerDeathrattle(state, p, m, m.deathrattle);
        }
        if (m.reborn && !m.rebornUsed) {
          const reborn = summonMinion(state, p, m.cardId, z, null);
          if (reborn) {
            reborn.health = 1;
            reborn.maxHealth = 1;
            reborn.rebornUsed = true;
            reborn.justPlayed = true;
            log(state, m.name + " 回潮。", p, "reborn");
          }
        }
        if (p.relic === "blood_scythe") {
          healHero(state, p, 1);
          log(state, "血潮镰：恢复领袖 1 点生命。", p, "heal");
        }
        if (p.relic === "republic_seal" && m.taunt) {
          drawCard(state, p, 1);
          log(state, "议席印玺：拦截随从死亡，抽 1 张牌。", p, "draw");
        }
        if (p.relic === "powder_engine") {
          const enemy = opponentOf(state, p);
          const targets = aliveMinions(enemy);
          const pick = randomInt(state, targets.length + 1);
          if (pick >= targets.length) damageHero(state, enemy, 1, null, "火药引擎", true);
          else damageMinion(state, targets[pick], 1, null, "火药引擎");
          log(state, "火药引擎：对随机敌方单位造成 1 点伤害。", p, "damage");
        }
        for (const ally of aliveMinions(p)) {
          if (!ally.silenced && ally.passive && ally.passive.type === "deathGrowth") {
            buffMinion(state, ally, ally.passive.attack || 1, ally.passive.health || 1, "血债", true);
            log(state, ally.name + " 因血债获得 +" + (ally.passive.attack || 1) + "/+" + (ally.passive.health || 1) + "。", p, "buff");
          }
          if (!ally.silenced && ally.passive && ally.passive.type === "tauntDeathDraw" && m.taunt) {
            drawCard(state, p, ally.passive.draw || 1);
            log(state, ally.name + " 因方阵记录抽 1 张牌。", p, "draw");
          }
          if (!ally.silenced && ally.passive && ally.passive.type === "deathRecordShot") {
            addCardToHand(state, p, "record_shot", {});
            log(state, ally.name + " 记录阵亡：获得 0 行动力「记录弹」。", p, "battlecry");
          }
          if (!ally.silenced && ally.passive && ally.passive.type === "deathDiscoverSpell") {
            if (state.current === p.index && !state.pendingChoice) {
              openDiscover(state, p, "spell", ally.cardId);
              log(state, ally.name + " 记录阵亡：检索一张战术牌。", p, "discover");
            } else {
              addRandomSpell(state, p, "阵亡检索");
            }
          }
        }
      }
    }
    recomputeAuras(state);
    checkGameOver(state);
  }

  function triggerDeathrattle(state, player, m, d) {
    d = d || m.deathrattle;
    if (!d) return;
    state.events.push({ structured: true, kind: "deathrattle", targetUid: m.uid, name: m.name, player: player.index, zone: m.zone });
    if (d.type === "summon") {
      const count = d.count || 1;
      for (let i = 0; i < count; i++) {
        const token = summonMinion(state, player, d.token, openZones(player)[0], null);
        if (token) log(state, "余响：" + m.name + " 召唤了 " + token.name + "。", player, "deathrattle");
      }
    } else if (d.type === "healHero") {
      healHero(state, player, d.amount || 1);
    } else if (d.type === "armor") {
      player.armor += d.amount || 1;
      log(state, "余响：" + m.name + " 提供 " + (d.amount || 1) + " 点护甲。", player, "armor");
    } else if (d.type === "draw") {
      drawCard(state, player, d.amount || 1);
    } else if (d.type === "freezeAllEnemies") {
      for (const enemy of aliveMinions(opponentOf(state, player))) freezeMinion(state, enemy);
      log(state, "余响：" + m.name + " 冻结了所有敌方随从。", player, "freeze");
    } else if (d.type === "tauntRandomAlly") {
      const allies = aliveMinions(player);
      if (allies.length) {
        const target = allies[randomInt(state, allies.length)];
        grantTaunt(state, target);
        log(state, "余响：" + m.name + " 使 " + target.name + " 获得拦截。", player, "deathrattle");
      }
    } else if (d.type === "damageRandomEnemy") {
      const dmg = d.amountFromAttack ? Math.min(d.max || 5, Math.max(0, m.attack || 0)) : (d.amount || 1);
      const enemies = aliveMinions(opponentOf(state, player));
      const pick = randomInt(state, enemies.length + 1);
      if (pick >= enemies.length) damageHero(state, opponentOf(state, player), dmg, null, "余响", true);
      else damageMinion(state, enemies[pick], dmg, null, "余响");
      log(state, "余响：" + m.name + " 对随机敌方单位造成 " + dmg + " 点伤害。", player, "deathrattle");
    } else if (d.type === "damageAllMinions") {
      for (const p of state.players) for (const z of ZONES) for (const m of p.board[z].slice()) damageMinion(state, m, d.amount || 3, null, "余响");
      processDeaths(state);
    } else if (d.type === "damageAllEnemies") {
      for (const enemy of aliveMinions(opponentOf(state, player))) damageMinion(state, enemy, d.amount || 3, null, "余响");
      log(state, "余响：" + m.name + " 对所有敌方随从造成 " + (d.amount || 3) + " 点伤害。", player, "deathrattle");
    } else if (d.type === "buffRandomAlly") {
      const allies = aliveMinions(player);
      if (allies.length) {
        const target = allies[randomInt(state, allies.length)];
        buffMinion(state, target, d.attack || 0, 0, "余响", true);
        log(state, "余响：" + m.name + " 使 " + target.name + " 获得 +" + (d.attack || 0) + " 攻击。", player, "deathrattle");
      }
    } else if (d.type === "damageRandomMinion") {
      const enemies = aliveMinions(opponentOf(state, player));
      if (enemies.length) {
        const target = enemies[randomInt(state, enemies.length)];
        damageMinion(state, target, d.amount || 2, null, "余响");
        log(state, "余响：" + m.name + " 对 " + target.name + " 造成 " + (d.amount || 2) + " 点伤害。", player, "deathrattle");
      } else {
        log(state, "余响：" + m.name + " 没有可攻击的敌方随从。", player, "deathrattle");
      }
    } else if (d.type === "buffAllTaunt") {
      for (const ally of aliveMinions(player)) if (ally.taunt) buffMinion(state, ally, 0, d.health || 1, "余响", true);
      log(state, "余响：" + m.name + " 使所有友方拦截随从获得 +0/+" + (d.health || 1) + "。", player, "deathrattle");
    } else if (d.type === "buffAllAllies") {
      for (const ally of aliveMinions(player)) buffMinion(state, ally, 0, d.health || 1, "余响", true);
      log(state, "余响：" + m.name + " 使所有友方随从获得 +0/+" + (d.health || 1) + "。", player, "deathrattle");
    } else if (d.type === "damageAllEnemyUnits") {
      for (const enemy of aliveMinions(opponentOf(state, player))) damageMinion(state, enemy, d.amount || 1, null, "余响");
      damageHero(state, opponentOf(state, player), d.amount || 1, null, "余响", true);
      log(state, "余响：" + m.name + " 对敌方所有单位造成 " + (d.amount || 1) + " 点伤害。", player, "deathrattle");
      processDeaths(state);
    }
  }

  function checkGameOver(state) {
    if (state.status !== "playing") return;
    const a = state.players[0], b = state.players[1];
    if (a.hp <= 0 && b.hp <= 0) {
      state.status = "gameover";
      state.winner = null;
      log(state, "双方领袖同时倒下。推演以平局结束。", null, "gameover");
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
      if (state.vein > before) {
        for (const p of state.players) {
        }
      }
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
      log(state, "【流脉震荡】流脉达到 4，所有随从受到 1 点伤害。", null, "veinEvent");
      for (const p of state.players) for (const z of ZONES) for (const m of p.board[z].slice()) damageMinion(state, m, 1, null, "流脉震荡");
      processDeaths(state);
    } else if (t === 7) {
      log(state, "【流脉裂隙】流脉达到 7，双方领袖受到 2 点伤害。", null, "veinEvent");
      damageHero(state, state.players[0], 2, null, "流脉裂隙", true);
      damageHero(state, state.players[1], 2, null, "流脉裂隙", true);
      checkGameOver(state);
    } else if (t === 10) {
      log(state, "【魔物潮】流脉达到 10，所有随从受到 3 点伤害，双方领袖受到 5 点伤害。", null, "veinEvent");
      for (const p of state.players) for (const z of ZONES) for (const m of p.board[z].slice()) damageMinion(state, m, 3, null, "魔物潮");
      processDeaths(state);
      damageHero(state, state.players[0], 5, null, "魔物潮", true);
      damageHero(state, state.players[1], 5, null, "魔物潮", true);
      checkGameOver(state);
      log(state, "魔物潮退去，流脉将在 12 时回流清空。", null, "veinEvent");
    }
  }

  function applyVeinEffects(state, player, minion, def) {
    let tiers = Array.isArray(def.veinTiers) ? def.veinTiers.slice() : [];
    if (def.veinBonus) tiers.push(def.veinBonus);
    tiers = tiers.filter(t => t && state.vein >= (t.vein || 0)).sort((a, b) => (b.vein || 0) - (a.vein || 0));
    if (!tiers.length) return false;
    const tier = tiers[0];
    if (tier.attack || tier.health) applyCardBonus(state, player, minion, { attack: tier.attack || 0, health: tier.health || 0 }, "引脉");
    if (tier.armor) { player.armor += tier.armor; log(state, player.name + " 获得 " + tier.armor + " 点护甲（引脉）。", player, "armor"); }
    if (tier.healHero) healHero(state, player, tier.healHero);
    if (tier.draw) drawCard(state, player, tier.draw);
    if (player.relic === "vein_heart") {
      healHero(state, player, 2);
      log(state, "地脉之心：引脉触发，恢复领袖 2 点生命。", player, "heal");
    }
    if (minion) log(state, "引脉 " + tier.vein + " 触发：" + minion.name + "。", player, "vein");
    return true;
  }

  function excavate(state, player, amount) {
    const x = Math.max(0, amount || 0);
    if (!x) return;
    drawCard(state, player, x);
    addVein(state, x, "采掘");
    log(state, "采掘 " + x + "：抽 " + x + " 张牌，流脉 +" + x + "。", player, "vein");
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
    opts = Object.assign({}, opts || {});
    if (def.bloodCost != null) opts.payBlood = true;
    const cost = getCardCost(state, player, handCard);
    const freeCast = !!(opts && opts.freeCast);
    if (!freeCast && player.mana < cost) return { ok: false, reason: "行动力不足", code: "mana" };
    if (def.bloodCost != null && player.hp <= def.bloodCost) return { ok: false, reason: "生命不足，无法支付血祭", code: "bloodPay" };
    if (def.id === "armor_mortar" && (player.armor || 0) < 3) return { ok: false, reason: "需要至少 3 点护甲", code: "armor" };
    if (def.type === "minion" && boardCount(player) >= 6) return { ok: false, reason: "随从已满", code: "boardFull" };
    const targetType = getTargetType(state, def);
    const target = opts && opts.targetUid ? findMinion(state, opts.targetUid) : null;
    if (targetType) {
      const valid = getValidTargets(state, player, targetType);
      if (target) {
        if (!targetAllowed(state, player, target.uid, targetType)) {
          return { ok: false, reason: "目标不合法", code: "target", targetType: targetType, targets: valid.map(m => m.uid) };
        }
      } else if (!(def.type === "minion" && valid.length === 0) && !def.optionalTarget) {
        return { ok: false, reason: "需要选择一个合法目标", code: "target", targetType: targetType, targets: valid.map(m => m.uid) };
      }
    }
    if (def.bloodCost != null && player.hp <= def.bloodCost) {
      return { ok: false, reason: "生命不足，无法支付血祭", code: "bloodPay" };
    }
    const target2Type = def.target2 || null;
    const target2 = opts && opts.targetUid2 ? findMinion(state, opts.targetUid2) : null;
    if (target2Type) {
      const valid2 = getValidTargets(state, player, target2Type);
      if (target2) {
        if (!targetAllowed(state, player, target2.uid, target2Type)) {
          return { ok: false, reason: "第二个目标不合法", code: "target2", targetType: target2Type, targets: valid2.map(m => m.uid) };
        }
      } else if (!def.optionalTarget2) {
        return { ok: false, reason: "需要选择第二个目标", code: "target2", targetType: target2Type, targets: valid2.map(m => m.uid) };
      }
    }
    let zone = opts && opts.zone;
    if (def.type === "minion" || def.type === "formation") {
      if (!zone || ZONES.indexOf(zone) < 0) {
        return { ok: false, reason: "请选择一个阵位", code: "zone", zones: def.type === "minion" ? openZones(player) : ZONES.slice() };
      }
      if (def.type === "minion" && !zoneHasSpace(player, zone)) return { ok: false, reason: "该阵位已满", code: "zoneFull" };
      if (def.type === "formation" && (player.formations || []).length >= 2) return { ok: false, reason: "阵型槽已满", code: "formationFull" };
    }
    if (def.bloodCost != null) {
      player.hp -= def.bloodCost;
      log(state, player.name + " 支付血祭：" + def.bloodCost + " 点生命。", player, "blood");
      checkGameOver(state);
      if (state.status !== "playing") return { ok: true };
    }
    // 扣费、移出手牌（复诵为免费施放）
    if (!freeCast) {
      player.mana -= cost;
      player.nextCostReduction = 0;
      if (def.type === "spell") player.spellCostReduction = 0;
    }
    player.hand = player.hand.filter(c => c.uid !== cardUid);
    if (def.type === "spell") player.discard.push({ uid: cardUid, cardId: def.id });
    player.cardsPlayed++;
    player.cardsPlayedThisTurn = (player.cardsPlayedThisTurn || 0) + 1;
    if (def.overload) {
      player.overload = (player.overload || 0) + def.overload;
      log(state, player.name + " 反噬 " + def.overload + "：下回合行动力减少。", player, "overload");
    }
    state.lastAction = { type: "play", player: playerIndex, cardId: def.id, cardName: def.name, cardType: def.type, zone: zone || null, seq: ((state.lastAction && state.lastAction.seq) || 0) + 1 };
    log(state, player.name + " 打出 " + def.name + "（" + cost + " 行动力）。", player, def.type === "spell" ? "spell" : "play", def.id);
    if (def.type === "spell") {
      player.spellsCastThisTurn = (player.spellsCastThisTurn || 0) + 1;
      player.spellsCastThisGame = (player.spellsCastThisGame || 0) + 1;
      player.freeSpellTurn = false;
      player.nextSpellReduction = 0;
      for (const m of aliveMinions(player)) {
        if (m.passive && m.passive.type === "spellGrowth" && !m.silenced) {
          buffMinion(state, m, m.passive.attack || 0, m.passive.health || 0, "法术回响", true);
        }
        if (m.passive && m.passive.type === "spellArmor" && !m.silenced) {
          player.armor += cost;
          log(state, m.name + " 触发奥术导管，获得 " + cost + " 点护甲。", player, "armor");
        }
        if (m.passive && m.passive.type === "spellDrawByCost" && !m.silenced && cost > 0) {
          drawCard(state, player, cost);
          log(state, m.name + " 触发奥术导管：施放 " + cost + " 行动力战术牌，抽 " + cost + " 张牌。", player, "draw");
        }
        if (m.passive && m.passive.type === "spellDrawOne" && !m.silenced) {
          drawCard(state, player, 1);
          log(state, m.name + " 触发奥术导管：施放战术牌，抽 1 张牌。", player, "draw");
        }
      }
      let freezeObserverDone = false;
      for (const m of aliveMinions(player)) {
        if (freezeObserverDone || !m.passive || m.passive.type !== "spellFreezeOnce" || m.silenced) continue;
        if (player.freezeObserverTurn === state.turnNumber) continue;
        player.freezeObserverTurn = state.turnNumber;
        const enemies = aliveMinions(opponentOf(state, player));
        if (enemies.length) freezeMinion(state, enemies[randomInt(state, enemies.length)]);
        freezeObserverDone = true;
      }
      if (player.relic === "frost_prism") {
        healHero(state, player, 1);
        log(state, "霜晶棱镜：恢复领袖 1 点生命。", player, "heal");
      }
      if (!freeCast) player.lastSpell = { cardId: def.id, targetUid: opts && opts.targetUid, targetUid2: opts && opts.targetUid2, zone: opts && opts.zone, payBlood: !!(opts && opts.payBlood) };
    }
    if (def.type === "minion") {
      const m = summonMinion(state, player, def.id, zone, opts && opts.taunt ? { taunt: true } : null);
      if (!m) {
        // 原子性保护：召唤失败时返还行动力、手牌与血祭代价
        player.mana += cost;
        player.hand.push(handCard);
        if (def.bloodCost != null && opts && opts.payBlood) player.hp += def.bloodCost;
        log(state, "召唤失败，行动力已返还。", player, "error");
        return { ok: false, reason: "召唤失败，行动力已返还" };
      }
      if (def.excavate) excavate(state, player, def.excavate);
      player.minionsPlayedThisTurn = (player.minionsPlayedThisTurn || 0) + 1;
      if (m.taunt) player.tauntMinionsPlayedThisTurn = (player.tauntMinionsPlayedThisTurn || 0) + 1;
      if (state.status === "playing") {
        beginDeferredDeaths(state);
        const needsTarget = !!getTargetType(state, def);
        const refluxReady = !def.reflux || ((!needsTarget || !!target) && payReflux(state, player, def));
        const pressureReady = !def.pressure || (state.vein || 0) >= def.pressure;
        if (refluxReady && pressureReady) resolveBattlecry(state, player, def, m, target || null, opts || {});
        else if (!refluxReady) log(state, "没有合法目标或流脉不足，效果未触发。", player, "battlecry");
        resolvePressure(state, player, def, m);
        resolveZhenmai(state, player, def);
        processDeaths(state);
        if (m && !m.dead) {
          if (def.zoneBonus && !(def.zoneBonus.attack || def.zoneBonus.health) && aliveMinions(player).some(x => x.uid !== m.uid && x.zone === m.zone)) applyCardBonus(state, player, m, def.zoneBonus, "阵位");
          const mirrorOnce = def.mirrorBonus && !(def.mirrorBonus.attack || def.mirrorBonus.health) ? def.mirrorBonus : null;
          if (mirrorOnce && aliveMinions(opponentOf(state, player)).some(x => x.zone === m.zone)) applyCardBonus(state, player, m, mirrorOnce, "对位");
          applyVeinEffects(state, player, m, def);
        }
        endDeferredDeaths(state);
      }
    } else if (def.type === "relic") {
      const hadRelic = player.relic;
      player.relic = def.id;
      const basePower = D.HEROES[player.heroId] && D.HEROES[player.heroId].power;
      if (def.id === "spell_codex") {
        player.hero.power = {
          id: "spell_codex",
          name: "编目",
          cost: 2,
          target: "none",
          text: "随机使一张手牌中的战术牌行动力消耗 -1。"
        };
      } else if (basePower) {
        player.hero.power = Object.assign({}, basePower);
      }
      if (def.id === "wanderer_charm") { player.maxHp += 5; }
      if (def.id === "formation_standard") { for (const zone of new Set((player.formations || []).map(f => f.zone))) applyFormationToZone(state, player, zone); }
      if (def.id === "gh_venom_vial" && hadRelic !== "gh_venom_vial") {
        for (const m of aliveMinions(player)) if (m.poisonous && !m.silenced) { m.health += 1; m.maxHealth += 1; }
        log(state, "淬毒瓶：所有蚀毒随从获得 +1 生命。", player, "buff");
      }
      log(state, player.name + " 装备遗物「" + def.name + "」。", player, "relic");
    } else if (def.type === "formation") {
      player.formations = player.formations || [];
      player.formations.push({ cardId: def.id, zone: zone, turnsLeft: def.formation && def.formation.duration ? def.formation.duration : null });
      applyFormationToZone(state, player, zone);
      if (def.formation && def.formation.summonOnPlay) {
        const targetZone = zoneHasSpace(player, zone) ? zone : openZones(player)[0];
        if (targetZone) summonMinion(state, player, def.formation.summonOnPlay, targetZone, null);
      }
      log(state, player.name + " 在" + ZONE_NAMES[zone] + "布置阵型「" + def.name + "」。", player, "formation");
    } else {
      if (def.excavate) excavate(state, player, def.excavate);
      if (state.status === "playing") {
        beginDeferredDeaths(state);
        const pressureReady = !def.pressure || (state.vein || 0) >= def.pressure;
        if (pressureReady && (!def.reflux || payReflux(state, player, def))) resolveSpell(state, player, def, target || null, opts || {});
        resolvePressure(state, player, def, null);
        resolveZhenmai(state, player, def);
        processDeaths(state);
        endDeferredDeaths(state);
        if (state.status === "playing") triggerSpellDiscoverObservers(state, player);
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
    copy.deathrattles = source.deathrattles ? source.deathrattles.slice() : (source.deathrattle ? [source.deathrattle] : []);
    copy.deathrattle = source.deathrattle || null;
    copy.frozenTurns = source.frozenTurns || 0;
  }

  function applyCardBonus(state, player, minion, bonus, label) {
    if (!bonus || !minion || minion.dead) return;
    if (bonus.selfBuff) buffMinion(state, minion, bonus.selfBuff.attack || 0, bonus.selfBuff.health || 0, label, true);
    if (bonus.attack || bonus.health) buffMinion(state, minion, bonus.attack || 0, bonus.health || 0, label, true);
    if (bonus.armor) { player.armor += bonus.armor; log(state, player.name + " 获得 " + bonus.armor + " 点护甲（" + label + "）。", player, "armor"); }
    if (bonus.healHero) healHero(state, player, bonus.healHero);
    if (bonus.draw) drawCard(state, player, bonus.draw);
    if (bonus.discoverSpell) openDiscover(state, player, "spell", "karl_bonus");
    if (bonus.summon) { const z = openZones(player)[0]; if (z) summonMinion(state, player, bonus.summon, z, null); }
    if (bonus.taunt) grantTaunt(state, minion);
  }

  function resolveBattlecry(state, player, def, minion, target, opts) {
    const b = def.battlecry;
    if (!b) return;
    if (b.type === "healDraw") {
      if (!target || target.dead) return;
      const wasDamaged = target.health < target.maxHealth;
      healMinion(state, target, b.amount);
      if (wasDamaged) drawCard(state, player, 1);
    } else if (b.type === "healOverflowBuff") {
      if (!target || target.dead) return;
      const amount = b.amount || 5;
      const missing = Math.max(0, target.maxHealth - target.health);
      const healed = Math.min(amount, missing);
      if (healed > 0) {
        healMinion(state, target, healed);
        buffMinion(state, target, healed, healed, "共鸣", true);
        log(state, target.name + " 恢复 " + healed + " 点生命，并获得 +" + healed + "/+" + healed + "。", player, "battlecry");
      }
      const overflow = amount - healed;
      if (overflow > 0) {
        healHero(state, player, overflow);
        log(state, "溢出治疗恢复你的领袖 " + overflow + " 点生命。", player, "heal");
      }
    } else if (b.type === "healHeroSelfBuff") {
      const before = player.hp;
      healHero(state, player, b.amount || 5);
      const healed = player.hp - before;
      if (healed > 0) {
        buffMinion(state, minion, healed, healed, "共鸣", true);
        log(state, "共鸣：" + minion.name + " 实际恢复领袖 " + healed + " 点，获得 +" + healed + "/+" + healed + "。", player, "buff");
      }
    } else if (b.type === "silence") {
      if (target && !target.dead) silenceMinion(state, target);
    } else if (b.type === "silenceVeinBuff") {
      if (target && !target.dead) silenceMinion(state, target);
      if (state.vein >= (b.vein == null ? 5 : b.vein)) buffMinion(state, minion, 0, b.health || 2, "引脉", true);
    } else if (b.type === "nextCost") {
      player.nextCostReduction = (player.nextCostReduction || 0) + b.amount;
      log(state, player.name + " 本回合下一张牌行动力消耗减少 " + b.amount + "。", player, "buff");
    } else if (b.type === "drawVein") {
      drawCard(state, player, b.amount || 1);
      if (state.vein >= b.vein) drawCard(state, player, b.bonus || 1);
    } else if (b.type === "freeze") {
      if (b.destroyFrozenAtVein != null && state.vein >= b.destroyFrozenAtVein) {
        const enemies = aliveMinions(opponentOf(state, player));
        for (const m of enemies) m.dead = true;
        if (enemies.length) {
          log(state, "引脉 10 触发：深雪消灭所有敌方随从。", player, "vein");
          processDeaths(state);
        }
      } else if (b.allAtVein != null && state.vein >= b.allAtVein) {
        for (const m of aliveMinions(opponentOf(state, player))) freezeMinion(state, m);
        log(state, "引脉 6 触发：深雪冻结所有敌方随从。", player, "freeze");
      } else if (target && !target.dead) {
        freezeMinion(state, target);
      }
    } else if (b.type === "freezeZoneFormation") {
      if (target) {
        for (const m of aliveMinions(opponentOf(state, player)).filter(m => m.zone === target.zone)) freezeMinion(state, m);
        log(state, "深雪冻结了" + ZONE_NAMES[target.zone] + "的所有敌方随从。", player, "freeze");
        if ((player.formations || []).some(f => f.zone === target.zone)) {
          drawCard(state, player, b.draw || 1);
          log(state, "同阵位阵型共鸣，抽 1 张牌。", player, "draw");
        }
      }
    } else if (b.type === "freezeZone") {
      if (target && !target.dead) {
        const z = target.zone;
        for (const m of aliveMinions(opponentOf(state, player)).filter(x => x.zone === z)) freezeMinion(state, m);
        log(state, "索雷尔冻结了" + ZONE_NAMES[z] + "的所有敌方单位。", player, "freeze");
      }
    } else if (b.type === "freezeAllExceptOwnZone") {
      const ownZone = minion ? minion.zone : (target && target.zone);
      for (const p of state.players) for (const x of aliveMinions(p)) if (p.index !== player.index || x.zone !== ownZone) freezeMinion(state, x);
      log(state, "深雪冻结了" + ZONE_NAMES[ownZone] + "以外的全部随从。", player, "freeze");
    } else if (b.type === "recordIfEnemyZones") {
      const enemy = opponentOf(state, player);
      const allZones = ZONES.every(z => aliveMinions(enemy).some(m => m.zone === z));
      if (allZones) {
        const c = addCardToHand(state, player, "record_shot", {});
        if (c) { c.generated = true; log(state, "三阵记录：获得 0 行动力「记录弹」。", player, "battlecry"); }
      }
    } else if (b.type === "copyLowestSpell") {
      const spells = player.hand.filter(c => card(c.cardId).type === "spell").sort((a, b2) => card(a.cardId).cost - card(b2.cardId).cost);
      if (!spells.length) log(state, "维尔纳没有找到可复制的战术牌。", player, "battlecry");
      else {
        const src = spells[0];
        const copies = 1;
        for (let i = 0; i < copies; i++) {
          if (player.hand.length >= 8) break;
          player.hand.push({ uid: uid("c"), cardId: src.cardId, generated: true });
        }
        log(state, "维尔纳复制了「" + card(src.cardId).name + "」1 张。", player, "battlecry");
      }
    } else if (b.type === "freezeCombo") {
      if (state.vein >= (b.destroyAtVein || 10)) {
        const frozen = aliveMinions(opponentOf(state, player)).filter(m => m.frozenTurns > 0);
        for (const m of frozen) m.dead = true;
        log(state, "引脉 10 触发：教授消灭所有已被冻结的敌方随从。", player, "freeze");
        processDeaths(state);
      } else if (state.vein >= (b.allAtVein || 6)) {
        for (const m of aliveMinions(opponentOf(state, player))) freezeMinion(state, m);
        log(state, "引脉 6 触发：教授冻结所有敌方随从。", player, "freeze");
      } else if (target && !target.dead) {
        freezeMinion(state, target);
      }
    } else if (b.type === "damagePerArmorRandom") {
      const hits = Math.max(0, player.armor);
      let done = 0;
      for (let i = 0; i < hits; i++) {
        const enemies = aliveMinions(opponentOf(state, player));
        const pick = randomInt(state, enemies.length + 1);
        if (pick >= enemies.length) damageHero(state, opponentOf(state, player), b.amount || 1, null, "瓦尔特", true);
        else damageMinion(state, enemies[pick], b.amount || 1, null, "瓦尔特");
        done++;
      }
      if (done) { log(state, "瓦尔特按护甲发动 " + done + " 次随机炮击。", player, "battlecry"); processDeaths(state); }
    } else if (b.type === "buffPerAllMinions") {
      const count = state.players.reduce((n, p) => n + aliveMinions(p).length, 0) - 1;
      buffMinion(state, minion, Math.max(0, count) * (b.attack || 1), Math.max(0, count) * (b.health || 1), "阅兵", true);
      log(state, "克劳斯清点全场 " + count + " 个随从，获得 +" + count + "/+" + count + "。", player, "battlecry");
    } else if (b.type === "formationPayoff") {
      if (minion && activeFormation(player, minion.zone)) {
        buffMinion(state, minion, 0, 1, "阵线共鸣", true);
        drawCard(state, player, 1);
        log(state, "阵线共鸣：获得 +0/+1 并抽 1 张牌。", player, "buff");
      }
    } else if (b.type === "heal") {
      if (target && !target.dead) healMinion(state, target, b.amount);
    } else if (b.type === "healHero") {
      player.hp = Math.min(player.maxHp, player.hp + (b.amount || 2));
      log(state, player.name + " 恢复 " + (b.amount || 2) + " 点生命。", player, "heal");
    } else if (b.type === "healVein") {
      healHero(state, player, b.heal || 3);
      addVein(state, b.vein || 1, "虹吸守卫");
    } else if (b.type === "spellDiscover") {
      if ((player.spellsCastThisTurn || 0) > 0) openDiscover(state, player, b.pool || "spell", def.id);
    } else if (b.type === "buffTauntZone") {
      const allies = aliveMinions(player).filter(m => m.zone === minion.zone && m.taunt);
      for (const m of allies) buffMinion(state, m, 0, b.health || 1, "登场", true);
    } else if (b.type === "buffPerIronclad") {
      const count = aliveMinions(player).filter(m => m.cardId === "ironclad").length;
      if (count > 0) buffMinion(state, minion, count * (b.attack || 2), count * (b.health || 1), "登场", true);
    } else if (b.type === "buffIfIronclad") {
      const mate = aliveMinions(player).some(m => m.uid !== minion.uid && m.zone === minion.zone && m.cardId === "ironclad");
      if (mate) buffMinion(state, minion, 0, b.health || 1, "登场", true);
    } else if (b.type === "handBuff") {
      if (player.hand.length >= (b.hand || 6)) buffMinion(state, minion, b.attack || 0, b.health || 2, "登场", true);
    } else if (b.type === "drawHandCondition") {
      drawCard(state, player, b.draw || 1);
      if (player.hand.length <= (b.hand || 6)) drawCard(state, player, b.draw || 1);
    } else if (b.type === "drawSpell") {
      const idx = player.deck.findIndex(c => D.CARDS[c.cardId] && D.CARDS[c.cardId].type === "spell");
      if (idx >= 0) {
        const c = player.deck.splice(idx, 1)[0];
        if (player.hand.length < 8) { player.hand.push(c); log(state, player.name + " 抽到一张战术牌。", player, "draw"); }
        else log(state, player.name + " 手牌已满，一张战术牌被烧掉。", player, "burn");
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
        damageMinion(state, t, b.amount || 1, minion, "登场");
      }
    } else if (b.type === "buffTaunt") {
      if (target && !target.dead) {
        buffMinion(state, target, b.attack || 0, b.health || 0, "登场", true);
        grantTaunt(state, target);
      }
    } else if (b.type === "summon") {
      summonMinion(state, player, b.token, openZones(player)[0], null);
    } else if (b.type === "stealth") {
      if (target && !target.dead) {
        target.stealth = true;
        log(state, target.name + " 获得隐匿。", player, "stealth");
      }
    } else if (b.type === "bloodBuff") {
      if (opts.payBlood) buffMinion(state, minion, b.attack || 0, b.health || 0, "血祭", true);
    } else if (b.type === "damage") {
      if (target && !target.dead) damageMinion(state, target, b.amount || 1, minion, "登场");
    } else if (b.type === "discover") {
      openDiscover(state, player, b.pool || "any", def.id);
    } else if (b.type === "armor") {
      player.armor += b.amount || 0;
      log(state, player.name + " 获得 " + (b.amount || 0) + " 点护甲。", player, "armor");
    } else if (b.type === "armorPerTaunt") {
      const n = aliveMinions(player).filter(m => m.taunt).length;
      player.armor += n * (b.amount || 1);
      log(state, player.name + " 获得 " + (n * (b.amount || 1)) + " 点护甲。", player, "armor");
    } else if (b.type === "veinOnly") {
      addVein(state, b.amount || 1, minion.name);
    } else if (b.type === "zoneSelfBuff") {
      const mate = aliveMinions(player).some(x => x.uid !== minion.uid && x.zone === minion.zone);
      if (mate) buffMinion(state, minion, b.attack || 2, b.health || 2, "同阵", true);
    } else if (b.type === "drawIfZones") {
      if (ZONES.every(z => player.board[z].some(x => !x.dead))) drawCard(state, player, b.draw || 1);
    } else if (b.type === "destroyZone") {
      if (target && !target.dead) {
        const z = target.zone;
        for (const m of opponentOf(state, player).board[z].slice()) m.dead = true;
        log(state, "登场：" + minion.name + " 切断了 " + ZONE_NAMES[z] + " 的阵线。", player, "zone");
        processDeaths(state);
      }
    } else if (b.type === "rampMana") {
      player.mana += b.amount || 1;
      log(state, player.name + " 本回合获得 " + (b.amount || 1) + " 行动力。", player, "mana");
      if (b.vein) addVein(state, b.vein, minion.name);
    } else if (b.type === "discountSpell") {
      player.spellCostReduction = (player.spellCostReduction || 0) + (b.amount || 1);
      log(state, "本回合下一张战术牌行动力消耗 -" + (b.amount || 1) + "。", player, "discount");
    } else if (b.type === "armorDamage") {
      if (target && !target.dead) damageMinion(state, target, Math.max(0, player.armor || 0), minion, "炮击");
    } else if (b.type === "devour") {
      const candidates = aliveMinions(player).filter(x => x.uid !== minion.uid);
      if (candidates.length) {
        candidates.sort((a, b2) => a.attack - b2.attack || a.health - b2.health);
        const eaten = candidates[0];
        const gainA = eaten.attack, gainH = eaten.health;
        eaten.dead = true;
        buffMinion(state, minion, gainA, gainH, "噬潮", true);
        log(state, "登场：" + minion.name + " 吞噬了 " + eaten.name + "。", player, "battlecry");
        processDeaths(state);
      }
    } else if (b.type === "draw") {
      drawCard(state, player, b.amount || 1);
    } else if (b.type === "damageAllEnemiesDraw") {
      for (const m of aliveMinions(opponentOf(state, player))) damageMinion(state, m, b.amount || 4, minion, "登场");
      if (b.vein == null || state.vein >= b.vein) drawCard(state, player, b.draw || 1);
      log(state, "登场：" + minion.name + " 对敌方随从造成 " + (b.amount || 4) + " 点伤害。", player, "battlecry");
    } else if (b.type === "freezeAllEnemies") {
      for (const m of aliveMinions(opponentOf(state, player))) freezeMinion(state, m);
      log(state, "登场：霜潮利维坦冻结了所有敌方随从。", player, "freeze");
    } else if (b.type === "copyFriendly") {
      if (target && !target.dead) {
        const copy = summonMinion(state, player, target.cardId, openZones(player)[0], null);
        if (copy) {
          copyMinionStats(target, copy);
          copy.name = target.name;
          log(state, "登场：" + minion.name + " 复制了 " + target.name + "。", player, "battlecry");
        }
      }
    } else if (b.type === "returnToHand") {
      if (target && !target.dead) {
        const name = target.name;
        returnMinionToHand(state, target);
        log(state, "登场：" + minion.name + " 将 " + name + " 移回手牌。", player, "battlecry");
      }
    } else if (b.type === "veinDraw") {
      addVein(state, b.amount || 1, "采掘");
      if (b.draw) drawCard(state, player, b.draw);
      if (state.vein >= (b.vein == null ? 8 : b.vein)) drawCard(state, player, b.thresholdDraw || 1);
    } else if (b.type === "damageAllEnemies") {
      for (const m of aliveMinions(opponentOf(state, player))) damageMinion(state, m, b.amount || 2, minion, "登场");
      log(state, "登场：" + minion.name + " 对所有敌方随从造成 " + (b.amount || 2) + " 点伤害。", player, "battlecry");
    } else if (b.type === "destroy") {
      if (target && !target.dead) {
        target.dead = true;
        log(state, "登场：" + minion.name + " 消灭了 " + target.name + "。", player, "battlecry");
      }
    } else if (b.type === "destroyAllEnemies") {
      const targets = aliveMinions(opponentOf(state, player));
      for (const targetMinion of targets) {
        targetMinion.dead = true;
        state.events.push({ structured: true, kind: "destroy", targetUid: targetMinion.uid, player: opponentOf(state, player).index });
      }
      log(state, "登场：" + minion.name + " 消灭了所有敌方随从。", player, "battlecry");
    } else if (b.type === "veinSelfBuff") {
      if (state.vein >= (b.vein == null ? 4 : b.vein)) {
        buffMinion(state, minion, b.attack || 0, 0, "引脉", true);
        log(state, "引脉触发：" + minion.name + " 获得 +" + (b.attack || 0) + " 攻击。", player, "vein");
      }
    } else if (b.type === "veinBuff") {
      addVein(state, b.amount == null ? 2 : b.amount, b.draw ? "采掘" : "登场");
      if (b.draw) drawCard(state, player, b.draw);
      if (state.vein >= (b.vein == null ? 7 : b.vein)) {
        buffMinion(state, minion, b.attack == null ? 2 : b.attack, b.health == null ? 2 : b.health, "登场", true);
        grantTaunt(state, minion);
        log(state, "引脉触发：" + minion.name + " 获得 +" + (b.attack == null ? 2 : b.attack) + "/+" + (b.health == null ? 2 : b.health) + " 和拦截。", player, "vein");
      }
    } else if (b.type === "summonSelfCopy") {
      const copy = summonMinion(state, player, def.id, openZones(player)[0], null);
      if (copy) {
        copyMinionStats(minion, copy);
        copy.name = minion.name;
        log(state, "登场：" + minion.name + " 召唤了自身的复制。", player, "battlecry");
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
        buffMinion(state, m, 0, b.health || 1, "登场", true);
        grantTaunt(state, m);
      }
    } else if (b.type === "spellDraw") {
      if ((player.spellsCastThisTurn || 0) > 0) drawCard(state, player, b.draw || 1);
    } else if (b.type === "freeSpellTurn") {
      player.freeSpellTurn = true;
      log(state, "逆流：本回合你的下一张战术牌不消耗行动力。", player, "buff");
    } else if (b.type === "discountSpellTurn") {
      player.nextSpellReduction = (player.nextSpellReduction || 0) + (b.amount || 1);
      log(state, "本回合下一张战术牌行动力消耗 -" + (b.amount || 1) + "。", player, "buff");
    } else if (b.type === "gainMana") {
      player.mana = Math.min(10, player.mana + (b.amount || 2));
      log(state, player.name + " 获得 " + (b.amount || 2) + " 点行动力。", player, "mana");
    } else if (b.type === "randomFreeze") {
      const enemies = aliveMinions(opponentOf(state, player));
      if (enemies.length) {
        const pick = enemies[randomInt(state, enemies.length)];
        freezeMinion(state, pick);
        log(state, "随机冻结了 " + pick.name + "。", player, "freeze");
      } else {
        log(state, "没有可以冻结的敌方随从，冻结效果未触发。", player, "freeze");
      }
    } else if (b.type === "freezeZoneGrowth") {
      if (target && !target.dead) {
        const z = target.zone;
        const hit = aliveMinions(opponentOf(state, player)).filter(x => x.zone === z);
        for (const m of hit) freezeMinion(state, m);
        if (hit.length) {
          buffMinion(state, minion, hit.length * (b.attack || 1), hit.length * (b.health || 1), "回响学徒", true);
          log(state, "回响学徒冻结了 " + hit.length + " 个随从，获得 +" + (hit.length * (b.attack || 1)) + "/+" + (hit.length * (b.health || 1)) + "。", player, "freeze");
        } else {
          log(state, "该阵位没有可冻结的敌方随从，冻结效果未触发。", player, "freeze");
        }
      }
    } else if (b.type === "bloodDamageAllEnemies") {
      if (opts.payBlood) {
        for (const m of aliveMinions(opponentOf(state, player))) damageMinion(state, m, b.amount || 1, minion, "血祭");
        log(state, "血祭：对所有敌方随从造成 " + (b.amount || 1) + " 点伤害。", player, "blood");
        processDeaths(state);
      }
    } else if (b.type === "discoverMinionBloodBuff") {
      openDiscover(state, player, "minion", def.id);
      if (opts.payBlood) buffMinion(state, minion, b.attack || 2, 0, "血祭", true);
    } else if (b.type === "devourZoneAllies") {
      const eaten = aliveMinions(player).filter(x => x.uid !== minion.uid && x.zone === minion.zone);
      if (eaten.length) {
        let gainA = 0, gainH = 0;
        for (const x of eaten) { gainA += x.attack; gainH += x.health; x.dead = true; }
        buffMinion(state, minion, gainA, gainH, "噬潮", true);
        log(state, "灰羽吞噬了同阵位 " + eaten.length + " 个随从，获得 +" + gainA + "/+" + gainH + "。", player, "battlecry");
        processDeaths(state);
      }
    } else if (b.type === "devourLowestHealth") {
      const candidates = aliveMinions(player).filter(x => x.uid !== minion.uid);
      if (candidates.length) {
        candidates.sort((a, b2) => a.health - b2.health || a.attack - b2.attack);
        const eaten = candidates[0];
        const gainA = eaten.attack, gainH = eaten.health;
        eaten.dead = true;
        buffMinion(state, minion, gainA, gainH, "噬潮", true);
        log(state, "登场：" + minion.name + " 吞噬了 " + eaten.name + "。", player, "battlecry");
        processDeaths(state);
      }
    } else if (b.type === "devourBloodBuff") {
      const candidates = aliveMinions(player).filter(x => x.uid !== minion.uid);
      if (candidates.length) {
        candidates.sort((a, b2) => a.attack - b2.attack || a.health - b2.health);
        const eaten = candidates[0];
        const gainA = eaten.attack, gainH = eaten.health;
        eaten.dead = true;
        buffMinion(state, minion, gainA, gainH, "噬潮", true);
        log(state, "登场：" + minion.name + " 吞噬了 " + eaten.name + "。", player, "battlecry");
        processDeaths(state);
      }
      if (opts.payBlood) buffMinion(state, minion, b.attack || 2, b.health || 2, "血祭", true);
    } else if (b.type === "summonCount") {
      for (let i = 0; i < (b.count || 1); i++) summonMinion(state, player, b.token, openZones(player)[0], null);
    } else if (b.type === "comboTauntGrowth") {
      if (comboActive(player)) {
        const n = player.tauntMinionsPlayedThisTurn || 0;
        if (n > 0) buffMinion(state, minion, 0, n * (b.health || 1), "顺势", true);
        log(state, "顺势：本回合已打出 " + n + " 个拦截随从，获得 +0/+" + (n * (b.health || 1)) + "。", player, "combo");
      }
    } else if (b.type === "mirrorSummon") {
      const enemy = opponentOf(state, player);
      if (aliveMinions(enemy).some(x => x.zone === minion.zone)) {
        const z = zoneHasSpace(player, minion.zone) ? minion.zone : openZones(player)[0];
        if (z) summonMinion(state, player, b.token || "republic_recruit", z, null);
        log(state, "对位有敌方随从：召唤一个 1/1 的共和国新兵。", player, "battlecry");
      }
    } else if (b.type === "comboDeathGrowth") {
      if (comboActive(player)) {
        const n = state.deathsThisTurn || 0;
        if (n > 0) buffMinion(state, minion, n * (b.attack || 1), n * (b.health || 1), "顺势", true);
        minion.passive = {
          type: "deathGrowth",
          attack: b.attack || 1,
          health: b.health || 1,
          expiresTurn: state.turnNumber
        };
        log(state, "本回合已死亡 " + n + " 个随从，获得 +" + (n * (b.attack || 1)) + "/+" + (n * (b.health || 1)) + "；本回合后续死亡继续成长。", player, "combo");
      }
    } else if (b.type === "grantReborn") {
      if (target && !target.dead) grantReborn(state, target);
    } else if (b.type === "grantDeathrattleDamage") {
      if (target && !target.dead) grantDeathrattle(state, target, { type: "damageRandomMinion", amount: b.amount || 1 }, "对随机一个敌方随从造成 " + (b.amount || 1) + " 点伤害");
    } else if (b.type === "grantDeathrattleDamageAll") {
      for (const ally of aliveMinions(player)) {
        grantDeathrattle(state, ally, { type: "damageRandomMinion", amount: b.amount || 1 }, "对随机一个敌方随从造成 " + (b.amount || 1) + " 点伤害");
      }
      log(state, "所有友方随从获得余响：对随机一个敌方随从造成 " + (b.amount || 1) + " 点伤害。", player, "battlecry");
    } else if (b.type === "comboMinionGrowth") {
      if (comboActive(player)) {
        const n = player.minionsPlayedThisTurn || 0;
        if (n > 0) buffMinion(state, minion, n * (b.attack || 1), n * (b.health || 1), "顺势", true);
        log(state, "顺势：本回合已使用 " + n + " 个随从，获得 +" + (n * (b.attack || 1)) + "/+" + (n * (b.health || 1)) + "。", player, "combo");
      }
    } else if (b.type === "shieldMarshal") {
      if (comboActive(player)) {
        const n = player.recruitsSummonedThisTurn || 0;
        if (n > 0) buffMinion(state, minion, n * (b.attack || 1), n * (b.health || 1), "顺势", true);
        log(state, "本回合已召唤 " + n + " 个共和国新兵，获得 +" + (n * (b.attack || 1)) + "/+" + (n * (b.health || 1)) + "。", player, "combo");
      }
    } else if (b.type === "markBounty") {
      if (target && !target.dead) markBounty(state, player, target);
    } else if (b.type === "silenceIfBountyDraw") {
      if (target && !target.dead) {
        const hadBounty = !!target.bounty;
        silenceMinion(state, target);
        if (hadBounty) drawCard(state, player, 1);
      }
    } else if (b.type === "silenceAllEnemies") {
      for (const m of aliveMinions(opponentOf(state, player))) silenceMinion(state, m);
      log(state, "封口：所有敌方随从被沉默。", player, "silence");
    } else if (b.type === "grantRushAll") {
      for (const m of aliveMinions(player)) grantRush(state, m);
      log(state, "佣兵头目：所有友方随从获得袭扰。", player, "rush");
    } else if (b.type === "buffPerUnderfilledZone") {
      const enemy = opponentOf(state, player);
      const count = ZONES.filter(z => aliveMinions(enemy).filter(m => m.zone === z).length < 2).length;
      if (count > 0) buffMinion(state, minion, count * (b.attack || 1), 0, "登场", true);
      log(state, "对方有 " + count + " 个阵位随从少于 2 个，" + minion.name + " 获得 +" + (count * (b.attack || 1)) + "/+0。", player, "battlecry");
    } else if (b.type === "markRandomBounties") {
      const enemies = aliveMinions(opponentOf(state, player)).filter(m => m.bounty == null);
      const shuffled = shuffle(state, enemies);
      const n = Math.min(b.count || 2, shuffled.length);
      for (let i = 0; i < n; i++) markBounty(state, player, shuffled[i]);
      if (!n) log(state, "没有可以列入悬赏名单的敌方随从。", player, "bounty");
    } else if (b.type === "bountyClaimVolley") {
      const times = 1 + Math.max(0, player.bountiesClaimed || 0);
      for (let i = 0; i < times; i++) {
        if (state.status !== "playing") break;
        const enemy = opponentOf(state, player);
        const targets = aliveMinions(enemy);
        const hitHero = !targets.length || randomInt(state, targets.length + 1) >= targets.length;
        if (hitHero) damageHero(state, enemy, b.amount || 2, null, "赏金王", true);
        else damageMinion(state, targets[randomInt(state, targets.length)], b.amount || 2, null, "赏金王");
        if (enemy.hp <= 0) break;
      }
      processDeaths(state);
      checkGameOver(state);
      log(state, "赏金王登场：按本局悬赏完成数重复 " + times + " 次。", player, "bounty");
    } else if (b.type === "healAllAllies") {
      for (const ally of aliveMinions(player)) healMinion(state, ally, b.amount || 2);
      log(state, "登场：恢复所有友方随从 " + (b.amount || 2) + " 点生命。", player, "heal");
    }
  }

  function resolveSpell(state, player, def, target, opts) {
    const s = def.spell;
    if (!s) return;
    if (s.type === "buffZone") {
      if (!target || target.dead) return;
      const z = target.zone;
      const allies = aliveMinions(player).filter(m => m.zone === z);
      for (const m of allies) buffMinion(state, m, s.attack || 0, s.health || 0, "协同调度", true);
      log(state, "协同调度：同阵位 " + allies.length + " 个随从获得 +" + (s.attack || 0) + "/+" + (s.health || 0) + "。", player, "buff");
    } else if (s.type === "buffHeal") {
      if (!target || target.dead) return;
      buffMinion(state, target, s.attack || 0, s.health || 0, "战术", true);
      const zoneMates = player.board[target.zone].filter(m => m.uid !== target.uid && !m.dead);
      if (zoneMates.length && s.healIfTogether) healMinion(state, target, s.healIfTogether);
    } else if (s.type === "armor") {
      const gain = s.amount || 5;
      player.armor += gain;
      log(state, player.name + " 获得 " + gain + " 点护甲。", player, "armor");
      if (s.draw) drawCard(state, player, s.draw);
    } else if (s.type === "none") {
      // 由卡牌的 excavate / 其他字段另行结算，例如“采掘 2”类法术。
    } else if (s.type === "healDraw") {
      if (target && !target.dead) healMinion(state, target, s.amount);
      drawCard(state, player, s.draw || 1);
    } else if (s.type === "drawCopyNextSpell") {
      player.copyNextSpell = (player.copyNextSpell || 0) + 1;
      drawCard(state, player, s.draw == null ? 1 : s.draw);
    } else if (s.type === "draw") {
      drawCard(state, player, s.amount || 1);
    } else if (s.type === "drawGainVein") {
      drawCard(state, player, s.amount || 1);
      addVein(state, s.vein || 1, "流脉");
      log(state, "抽 " + (s.amount || 1) + " 张牌，流脉 +" + (s.vein || 1) + "。", player, "draw");
    } else if (s.type === "drawBoth") {
      drawCard(state, player, s.amount || 1);
      drawCard(state, opponentOf(state, player), s.amount || 1);
      log(state, "双方各抽 " + (s.amount || 1) + " 张牌。", player, "draw");
    } else if (s.type === "bloodDraw") {
      if (!target || target.dead) return;
      damageMinion(state, target, s.damage || 2, { owner: player.index }, "血祭仪式");
      drawCard(state, player, s.draw || 1);
      if (target.dead) drawCard(state, player, s.extraIfDead || 1);
    } else if (s.type === "summonMonster") {
      const zone = openZones(player)[0];
      const first = zone ? summonMinion(state, player, "losutai_beast", zone, null) : null;
      if (first && s.doubleIfZoneEmpty && aliveMinions(player).filter(m => m.zone === zone).length === 1) {
        summonMinion(state, player, "losutai_beast", zone, null);
        log(state, "该阵位原本没有随从，魔物召唤再召唤了一个 3/3 洛斯汰巨兽。", player, "summon");
      }
      if (s.vein != null && state.vein >= s.vein) summonMinion(state, player, "losutai_imp", openZones(player)[0], null);
    } else if (s.type === "buffStealth") {
      if (!target || target.dead) return;
      buffMinion(state, target, s.attack || 0, 0, "暗影袭扰", true);
      target.stealth = true;
      if (!target.keywords.includes("stealth")) target.keywords.push("stealth");
      log(state, target.name + " 获得隐匿。", player, "stealth");
    } else if (s.type === "buffLifesteal") {
      if (!target || target.dead) return;
      buffMinion(state, target, s.attack || 0, 0, "血路", true);
      target.lifesteal = true;
      if (!target.keywords.includes("lifesteal")) target.keywords.push("lifesteal");
      log(state, target.name + " 获得汲取。", player, "lifesteal");
    } else if (s.type === "bloodGrant") {
      const cost = s.health || 3;
      if (player.hp <= cost) { log(state, "生命不足，血契没有生效。", player, "blood"); return; }
      player.hp -= cost;
      state.events.push({ structured: true, kind: "damage", targetUid: "hero:" + player.index, amount: cost, label: "血契", player: player.index });
      log(state, player.name + " 支付 " + cost + " 点生命。", player, "blood");
      if (target && !target.dead) {
        target.lifesteal = true;
        target.stealth = true;
        if (!target.keywords.includes("lifesteal")) target.keywords.push("lifesteal");
        if (!target.keywords.includes("stealth")) target.keywords.push("stealth");
        log(state, target.name + " 获得汲取和隐匿。", player, "buff");
      }
    } else if (s.type === "buffCharge") {
      if (!target || target.dead) return;
      buffMinion(state, target, s.attack || 0, 0, "战术", true);
      target.charge = true;
      if (!target.hasAttacked) target.attacksLeft = Math.max(target.attacksLeft, target.windfury ? 2 : 1);
      log(state, target.name + " 获得突进。", player, "charge");
    } else if (s.type === "gainMana") {
      player.mana = Math.min(10, player.mana + (s.amount || 1));
      log(state, player.name + " 获得 " + (s.amount || 1) + " 点行动力。", player, "mana");
    } else if (s.type === "channelVein") {
      addVein(state, s.amount || -2, "流脉疏导");
      drawCard(state, player, s.draw || 1);
    } else if (s.type === "veinTrade") {
      addVein(state, s.amount || -2, "逆流");
      if (s.healHero) healHero(state, player, s.healHero);
      if (s.armor) { player.armor += s.armor; log(state, player.name + " 获得 " + s.armor + " 点护甲。", player, "armor"); }
      if (s.damageHero) damageHero(state, opponentOf(state, player), s.damageHero, null, "压脉", true);
      if (s.draw) drawCard(state, player, s.draw);
    } else if (s.type === "gainManaNowNext") {
      player.mana += s.mana || 1;
      player.nextTurnManaBonus = (player.nextTurnManaBonus || 0) + (s.next || 1);
      log(state, "获得 " + (s.mana || 1) + " 行动力，下回合开始再获得 " + (s.next || 1) + " 点。", player, "buff");
    } else if (s.type === "borrowVein") {
      player.mana += s.mana || 2;
      player.veinDebt = (player.veinDebt || 0) + (s.debt || 2);
      log(state, player.name + " 借脉：获得 " + (s.mana || 2) + " 行动力，回合结束偿还 " + (s.debt || 2) + " 流脉。", player, "vein");
    } else if (s.type === "stripArmorDraw") {
      const enemy = opponentOf(state, player);
      const removed = Math.min(enemy.armor, s.amount || 4);
      enemy.armor -= removed;
      log(state, player.name + " 移除了敌方 " + removed + " 点护甲。", player, "armor");
      drawCard(state, player, s.draw || 1);
    } else if (s.type === "ignoreTauntBuff") {
      if (!target || target.dead) return;
      buffMinion(state, target, s.attack || 0, 0, "血路", true);
      target.ignoreTaunt = true;
      log(state, target.name + " 本回合攻击时无视拦截。", player, "buff");
    } else if (s.type === "armorConditionalRush") {
      let armor = s.armor || 4;
      if (aliveMinions(opponentOf(state, player)).some(m => (m.keywords || []).includes("charge") || (m.keywords || []).includes("rush"))) armor += s.bonus || 2;
      player.armor += armor;
      log(state, player.name + " 获得 " + armor + " 点护甲。", player, "armor");
    } else if (s.type === "antiFreezeHeal") {
      healHero(state, player, s.heal || 2);
      player.freezeImmuneTurn = true;
      log(state, "你的随从本回合不能被冻结。", player, "freeze");
    } else if (s.type === "damageHealBlock") {
      if (target && !target.dead) damageMinion(state, target, s.amount || 1, null, "战地检疫");
      opponentOf(state, player).healBlockTurn = true;
      log(state, opponentOf(state, player).name + " 本回合不能恢复生命。", player, "heal");
    } else if (s.type === "freezeArmor") {
      if (target) freezeMinion(state, target);
      player.armor += s.armor || 1;
      log(state, "凝固局势，并获得 " + (s.armor || 1) + " 点护甲。", player, "freeze");
    } else if (s.type === "selfDamageDraw") {
      damageHero(state, player, s.self || 1, null, "战争税");
      drawCard(state, player, s.draw || 1);
    } else if (s.type === "formationDrawArmor") {
      drawCard(state, player, s.draw || 1);
      if ((player.formations || []).length) {
        player.armor += s.armor || 2;
        log(state, "阵型共鸣，获得 " + (s.armor || 2) + " 点护甲。", player, "armor");
      }
    } else if (s.type === "friendlyDamageDraw") {
      if (target && !target.dead) damageMinion(state, target, s.amount || 2, { owner: player.index }, "血偿");
      processDeaths(state);
      drawCard(state, player, s.draw || 2);
    } else if (s.type === "doubleSpellDamage") {
      const amount = (player.spellsCastThisTurn || 0) > 1 ? (s.bonus || 4) : (s.amount || 2);
      if (target && !target.dead) damageMinion(state, target, amount, null, "连锁公式");
    } else if (s.type === "damageAllEnemyUnitsPerGameSpell") {
      const actual = player.spellsCastThisGame || 0;
      const count = Math.min(10, actual);
      for (const m of aliveMinions(opponentOf(state, player))) damageMinion(state, m, count, null, "法术风暴");
      damageHero(state, opponentOf(state, player), count, null, "法术风暴");
      processDeaths(state);
      log(state, "法术风暴：本局已施放 " + actual + " 张战术牌，对敌方所有单位造成 " + count + " 点伤害（上限 10）。", player, "spell");
    } else if (s.type === "damageAllEnemiesPerGameSpell") {
      const count = player.spellsCastThisGame || 0;
      const dmg = count * (s.amount || 2);
      for (const m of aliveMinions(opponentOf(state, player))) damageMinion(state, m, dmg, null, "法术风暴");
      log(state, "法术风暴：本局第 " + count + " 张战术牌，对敌方所有随从造成 " + dmg + " 点伤害。", player, "spell");
      processDeaths(state);
    } else if (s.type === "damageAllEnemyUnits") {
      for (const m of aliveMinions(opponentOf(state, player))) damageMinion(state, m, s.amount || 2, null, "阵位齐射");
      damageHero(state, opponentOf(state, player), s.amount || 2, null, "阵位齐射");
      processDeaths(state);
    } else if (s.type === "damageAllEnemies") {
      for (const m of aliveMinions(opponentOf(state, player))) damageMinion(state, m, s.amount || 2, null, "阵位齐射");
      processDeaths(state);
    } else if (s.type === "armorPerEnemy") {
      const count = aliveMinions(opponentOf(state, player)).length;
      player.armor += count * (s.amount || 2);
      log(state, "每有一个敌方随从获得 " + (s.amount || 2) + " 点护甲，共 " + (count * (s.amount || 2)) + " 点。", player, "armor");
    } else if (s.type === "armorToDamageFixed") {
      const need = s.armor || 3;
      if ((player.armor || 0) < need) {
        log(state, "护甲不足，装甲炮击没有生效。", player, "damage");
      } else {
        player.armor -= need;
        damageHero(state, opponentOf(state, player), s.damage || 5, null, "装甲炮击");
        log(state, "消耗 " + need + " 点护甲，对敌方领袖造成 " + (s.damage || 5) + " 点伤害。", player, "damage");
      }
    } else if (s.type === "armorToDamage") {
      const used = Math.min(player.armor, s.max || 5);
      player.armor -= used;
      damageHero(state, opponentOf(state, player), used, null, "装甲炮击");
      log(state, "消耗 " + used + " 点护甲，对敌方领袖造成 " + used + " 点伤害。", player, "damage");
    } else if (s.type === "destroy") {
      if (target && !target.dead) target.dead = true;
    } else if (s.type === "damage") {
      if (target && !target.dead) damageMinion(state, target, s.amount || 1, null, "战术");
    } else if (s.type === "freezeDraw") {
      if (target && !target.dead) freezeMinion(state, target);
      drawCard(state, player, s.draw || 1);
    } else if (s.type === "freezeAll") {
      for (const m of aliveMinions(opponentOf(state, player)).filter(m => !m.stealth)) freezeMinion(state, m);
      log(state, "所有敌方随从被封印。", player, "freeze");
    } else if (s.type === "discover") {
      openDiscover(state, player, s.pool || "any", def.id);
    } else if (s.type === "drawVein") {
      drawCard(state, player, s.amount || 1);
      if (state.vein >= (s.vein || 4)) drawCard(state, player, s.bonus || 1);
    } else if (s.type === "buffTaunt") {
      if (target && !target.dead) {
        buffMinion(state, target, s.attack || 0, s.health || 0, "战术", true);
        grantTaunt(state, target);
      }
    } else if (s.type === "damageAllEnemiesDraw") {
      for (const m of aliveMinions(opponentOf(state, player))) damageMinion(state, m, s.amount || 4, null, "战术");
      drawCard(state, player, s.draw || 1);
      log(state, "战术：对所有敌方随从造成 " + (s.amount || 4) + " 点伤害。", player, "spell");
    } else if (s.type === "damageAll") {
      for (const p of state.players) {
        for (const z of ZONES) {
          for (const m of p.board[z].slice()) damageMinion(state, m, s.amount || 5, null, "终末钟声");
        }
        damageHero(state, p, s.amount || 5, null, "终末钟声", true);
      }
      log(state, "终末钟声：对所有单位造成 " + (s.amount || 5) + " 点伤害。", player, "spell");
    } else if (s.type === "returnAllEnemies") {
      const enemies = aliveMinions(opponentOf(state, player)).slice();
      for (const m of enemies) returnMinionToHand(state, m);
      log(state, "时间回流：所有敌方随从被移回手牌。", player, "bounce");
    } else if (s.type === "summonTwoTokens") {
      const count = s.count || 2;
      for (let i = 0; i < count; i++) summonMinion(state, player, s.token, openZones(player)[0], null);
      log(state, (s.label || "召唤") + "：召唤了 " + count + " 个" + (card(s.token).name || "随从") + "。", player, "summon");
    } else if (s.type === "armorVeinDraw") {
      player.armor += s.armor || 0;
      addVein(state, s.vein || 0, "流脉什一税");
      drawCard(state, player, s.draw || 1);
      log(state, player.name + " 获得 " + (s.armor || 0) + " 点护甲。", player, "armor");
    } else if (s.type === "comboDamage") {
      if (target && !target.dead) {
        const combo = (player.cardsPlayedThisTurn || 0) > 1;
        damageMinion(state, target, combo ? (s.amount || 3) : (s.otherwise || 1), null, combo ? "顺势" : "战术");
        log(state, combo ? "顺势触发：伤害提高。" : "未触发顺势。", player, "combo");
      }
    } else if (s.type === "rampSpell") {
      player.mana += s.amount || 2;
      log(state, player.name + " 本回合获得 " + (s.amount || 2) + " 行动力。", player, "mana");
    } else if (s.type === "bloodSummon") {
      const cost = s.health || 2;
      if (player.hp <= cost) { log(state, "生命不足，血契没有生效。", player, "blood"); return; }
      player.hp -= cost;
      state.events.push({ structured: true, kind: "damage", targetUid: "hero:" + player.index, amount: cost, label: "血契", player: player.index });
      log(state, player.name + " 支付 " + cost + " 点生命。", player, "blood");
      for (let i = 0; i < (s.count || 2); i++) summonMinion(state, player, s.token || "losutai_imp", openZones(player)[0], null);
    } else if (s.type === "damageZone") {
      if (target && !target.dead) {
        const z = target.zone;
        for (const m of opponentOf(state, player).board[z].slice()) damageMinion(state, m, s.amount || 2, null, s.label || "阵位齐射");
        log(state, (s.label || "阵位齐射") + "：" + ZONE_NAMES[z] + " 的所有敌方随从受到 " + (s.amount || 2) + " 点伤害。", player, "zone");
        processDeaths(state);
      }
    } else if (s.type === "sacrificeSummon") {
      const allies = aliveMinions(player);
      if (allies.length) {
        allies.sort((a, b2) => a.attack - b2.attack || a.health - b2.health);
        const eaten = allies[0];
        eaten.dead = true;
        log(state, "血祭祭坛：" + eaten.name + " 成为了祭品。", player, "blood");
        processDeaths(state);
        for (let i = 0; i < (s.count || 2); i++) summonMinion(state, player, s.token || "losutai_imp", openZones(player)[0], null);
      }
    } else if (s.type === "buffAllTaunt") {
      for (const m of aliveMinions(player).filter(x => x.taunt)) buffMinion(state, m, 0, s.health || 2, "铁壁", true);
    } else if (s.type === "armorAoe") {
      const dmg = Math.max(0, player.armor || 0);
      if (dmg > 0) {
        for (const m of aliveMinions(opponentOf(state, player))) damageMinion(state, m, dmg, null, "装甲齐射");
        log(state, "装甲齐射：对敌方随从造成 " + dmg + " 点伤害。", player, "spell");
      }
    } else if (s.type === "healVein") {
      healHero(state, player, s.heal || 3);
      addVein(state, s.vein || 2, "引脉虹吸");
    } else if (s.type === "damageAllPerSpell") {
      const count = Math.max(1, player.spellsCastThisTurn || 1);
      const dmg = count * (s.amount || 1);
      for (const m of aliveMinions(opponentOf(state, player))) damageMinion(state, m, dmg, null, "奥术涌流");
      log(state, "奥术涌流：第 " + count + " 张战术牌，对所有敌方随从造成 " + dmg + " 点伤害。", player, "spell");
    } else if (s.type === "damagePerSpell") {
      const count = Math.max(1, player.spellsCastThisTurn || 1);
      const dmg = count * (s.amount || 2);
      damageHero(state, opponentOf(state, player), dmg, null, "法术风暴", true);
      log(state, "法术风暴：本回合第 " + count + " 张战术牌，对敌方领袖造成 " + dmg + " 点伤害。", player, "spell");
    } else if (s.type === "healHero") {
      healHero(state, player, s.amount || s.heal || 1);
      log(state, player.name + " 恢复 " + (s.amount || s.heal || 1) + " 点生命。", player, "heal");
    } else if (s.type === "healHeroDraw") {
      healHero(state, player, s.amount || s.heal || 1);
      drawCard(state, player, s.draw || 1);
    } else if (s.type === "freezeGrantReborn") {
      if (target && !target.dead) freezeMinion(state, target);
      const t2 = opts && opts.targetUid2 ? findMinion(state, opts.targetUid2) : null;
      if (t2 && !t2.dead) grantReborn(state, t2);
    } else if (s.type === "grantDeathrattleDamage") {
      if (target && !target.dead) grantDeathrattle(state, target, { type: "damageRandomMinion", amount: s.amount || 2 }, "对随机一个敌方随从造成 " + (s.amount || 2) + " 点伤害");
    } else if (s.type === "drawIfEnemyNoMinions") {
      drawCard(state, player, 1);
      if (!aliveMinions(opponentOf(state, player)).length) drawCard(state, player, 1);
      log(state, "抽 1 张牌" + (!aliveMinions(opponentOf(state, player)).length ? "；敌方场上没有随从，再抽 1 张" : "") + "。", player, "draw");
    } else if (s.type === "nextTurnMana") {
      player.nextTurnManaBonus = (player.nextTurnManaBonus || 0) + (s.amount || 3);
      log(state, "下回合开始时获得 " + (s.amount || 3) + " 点行动力。", player, "mana");
    } else if (s.type === "tauntRebornAll") {
      for (const p of state.players) for (const m of aliveMinions(p)) { grantTaunt(state, m); grantReborn(state, m); }
      log(state, "戒严：场上所有随从获得拦截与回潮。", player, "buff");
    } else if (s.type === "tauntRebornZone") {
      if (!target || target.dead) return;
      const zone = target.zone;
      for (const p of state.players) {
        for (const m of (p.board[zone] || []).slice()) {
          if (m.dead) continue;
          grantTaunt(state, m);
          grantReborn(state, m);
        }
      }
      log(state, "戒严：" + ZONE_NAMES[zone] + "的所有随从获得拦截与回潮。", player, "buff");
    } else if (s.type === "damageAllMinions") {
      for (const p of state.players) for (const z of ZONES) for (const m of p.board[z].slice()) damageMinion(state, m, s.amount || 5, null, "火药桶");
      log(state, "对所有随从造成 " + (s.amount || 5) + " 点伤害。", player, "damage");
      processDeaths(state);
    } else if (s.type === "buffWindfury") {
      if (!target || target.dead) return;
      if (!target.windfury) {
        target.windfury = true;
        if (!target.keywords.includes("windfury")) target.keywords.push("windfury");
        target.attacksLeft = Math.max(target.attacksLeft, Math.max(0, 2 - (target.attacksUsedThisTurn || (target.hasAttacked ? 1 : 0))));
        log(state, target.name + " 获得连动。", player, "buff");
      }
    } else if (s.type === "blockHeroPower") {
      const enemy = opponentOf(state, player);
      enemy.heroPowerBlocked = true;
      log(state, enemy.name + " 下回合不能使用技能。", player, "debuff");
    } else if (s.type === "healVeinDrawAt") {
      healHero(state, player, s.heal || 3);
      addVein(state, s.vein || 2, "地脉回响");
      if (state.vein >= (s.threshold == null ? 7 : s.threshold)) drawCard(state, player, s.draw || 1);
      log(state, "恢复领袖 " + (s.heal || 3) + " 点生命，流脉 +" + (s.vein || 2) + "。", player, "heal");
    } else if (s.type === "sacrificeHealDraw") {
      if (!target || target.dead) return;
      const gained = Math.max(0, target.health || 0);
      target.dead = true;
      healHero(state, player, gained);
      drawCard(state, player, s.draw || 1);
      log(state, "献祭 " + target.name + "：恢复领袖 " + gained + " 点生命并抽 1 张牌。", player, "blood");
    } else if (s.type === "comboBuffTaunt") {
      if (!target || target.dead) return;
      const combo = comboActive(player);
      const h = combo ? (s.bonusHealth || 4) : (s.health || 2);
      buffMinion(state, target, 0, h, "顺势盾击", true);
      grantTaunt(state, target);
      log(state, combo ? "顺势触发：获得 +0/+" + h + " 与拦截。" : "获得 +0/+" + h + " 与拦截。", player, "combo");
    } else if (s.type === "armorIfArmored") {
      const had = (player.armor || 0) > 0;
      const gain = (s.amount || 3) + (had ? (s.bonus || 2) : 0);
      player.armor += gain;
      state.events.push({ structured: true, kind: "armor", player: player.index, amount: gain });
      log(state, "获得 " + gain + " 点护甲" + (had ? "（已有护甲，额外 +" + (s.bonus || 2) + "）" : "") + "。", player, "armor");
    } else if (s.type === "markBounty") {
      if (target && !target.dead) markBounty(state, player, target);
    } else if (s.type === "grantDivineShield") {
      if (target && !target.dead) grantDivineShield(state, target);
    } else if (s.type === "grantRushBuff") {
      if (target && !target.dead) {
        buffMinion(state, target, s.attack || 0, 0, "先手突袭", true);
        grantRush(state, target);
      }
    } else if (s.type === "silenceAll") {
      for (const m of aliveMinions(opponentOf(state, player))) silenceMinion(state, m);
      log(state, "沉默领域：所有敌方随从被沉默。", player, "silence");
    } else if (s.type === "drawMark") {
      drawCard(state, player, s.draw || 2);
      if (target && !target.dead) markBounty(state, player, target);
    } else if (s.type === "drawRandomBounties") {
      drawCard(state, player, s.draw || 1);
      const enemies = aliveMinions(opponentOf(state, player)).filter(m => m.bounty == null);
      const shuffled = shuffle(state, enemies);
      const n = Math.min(s.count || 2, shuffled.length);
      for (let i = 0; i < n; i++) markBounty(state, player, shuffled[i]);
      if (!n) log(state, "没有可以列入悬赏名单的敌方随从。", player, "bounty");
    } else if (s.type === "damageOrDestroyBounty") {
      if (target && !target.dead) {
        if (target.bounty && target.bounty.owner === player.index) {
          target.dead = true;
          log(state, "刺杀契约：悬赏目标 " + target.name + " 被直接处决。", player, "destroy");
        } else {
          damageMinion(state, target, s.amount || 4, null, "刺杀契约");
        }
        processDeaths(state);
      }
    } else if (s.type === "destroyBounty") {
      const marked = aliveMinions(opponentOf(state, player)).filter(m => m.bounty && m.bounty.owner === player.index);
      if (marked.length) {
        const pick = marked.slice().sort((a, b) => (b.attack + b.health) - (a.attack + a.health))[0];
        pick.dead = true;
        log(state, "处刑契约：悬赏目标 " + pick.name + " 被处决。", player, "destroy");
        processDeaths(state);
      } else if (s.fallbackDraw) {
        drawCard(state, player, s.fallbackDraw);
        log(state, "悬赏名单为空，改为抽牌。", player, "draw");
      } else {
        log(state, "悬赏名单为空。", player, "bounty");
      }
    } else if (s.type === "destroyAllBounties") {
      const marked = aliveMinions(opponentOf(state, player)).filter(m => m.bounty && m.bounty.owner === player.index);
      if (!marked.length) {
        log(state, "悬赏名单为空。", player, "bounty");
      } else {
        for (const m of marked) {
          m.dead = true;
          log(state, "赏金清算：悬赏目标 " + m.name + " 被处决。", player, "destroy");
        }
        processDeaths(state);
        checkGameOver(state);
      }
    } else if (s.type === "bountyVerdict") {
      const marked = aliveMinions(opponentOf(state, player)).filter(m => m.bounty && m.bounty.owner === player.index);
      if (marked.length) {
        const pick = marked.slice().sort((a, b) => (b.attack + b.health) - (a.attack + a.health))[0];
        pick.dead = true;
        log(state, "赏金清算：悬赏目标 " + pick.name + " 被处决。", player, "destroy");
        damageHero(state, opponentOf(state, player), s.damage || 5, null, "赏金清算", true);
        processDeaths(state);
        checkGameOver(state);
      } else {
        drawCard(state, player, s.fallbackDraw || 1);
        log(state, "悬赏名单为空，改为抽牌。", player, "draw");
      }
    } else if (s.type === "drawIfBountyClaimed") {
      drawCard(state, player, s.draw || 2);
      const claimed = s.thisTurn ? (player.bountiesClaimedThisTurn || 0) > 0 : (player.bountiesClaimed || 0) > 0;
      if (claimed) drawCard(state, player, s.bonus || 1);
    } else if (s.type === "damagePerMinionCount") {
      const count = state.players.reduce((n, p) => n + aliveMinions(p).length, 0);
      if (target && !target.dead) {
        damageMinion(state, target, count, null, "公式修正");
        log(state, "公式修正：场上共 " + count + " 个随从，造成 " + count + " 点伤害。", player, "spell");
      }
    } else if (s.type === "randomDamageUpgrade") {
      const upgraded = (player.spellsCastThisTurn || 0) > 1;
      const dmg = upgraded ? (s.bonus || 5) : (s.amount || 2);
      const enemy = opponentOf(state, player);
      const enemies = aliveMinions(enemy);
      const pick = randomInt(state, enemies.length + 1);
      if (pick >= enemies.length) damageHero(state, enemy, dmg, null, "双重公式", true);
      else damageMinion(state, enemies[pick], dmg, null, "双重公式");
      log(state, "双重公式：随机造成 " + dmg + " 点伤害" + (upgraded ? "（本回合此前已施放战术牌）" : "") + "。", player, "spell");
    } else if (s.type === "stripArmorToMana") {
      const enemy = opponentOf(state, player);
      const removed = Math.min(enemy.armor || 0, s.amount || 4);
      enemy.armor = Math.max(0, (enemy.armor || 0) - removed);
      log(state, "破甲演算：移除敌方 " + removed + " 点护甲。", player, "armor");
    }
  }

  function deepSnowProtected(state, m) {
    const owner = ownerOf(state, m);
    return aliveMinions(owner).some(x => x.zone === m.zone && x.cardId === "miyuki" && !x.silenced);
  }

  function freezeMinion(state, m) {
    if (!m || m.dead) return;
    if (ownerOf(state, m).freezeImmuneTurn) { log(state, m.name + " 受到地脉护佑，抵消了冻结。", ownerOf(state, m), "freeze"); return; }
    if (deepSnowProtected(state, m)) { log(state, m.name + " 受到深雪的守护，抵消了冻结。", ownerOf(state, m), "freeze"); return; }
    const owner = ownerOf(state, m);
    const ownTurn = state.current === owner.index;
    const noAttackLeft = m.attacksLeft <= 0;
    const rushNeedsNextTurn = m.rush && !m.charge && !m.hasAttacked && m.justPlayed;
    const turns = Math.max(m.frozenTurns || 0, ownTurn && (noAttackLeft || rushNeedsNextTurn) ? 2 : 1);
    m.frozenTurns = turns;
    state.events.push({ structured: true, kind: "freeze", targetUid: m.uid, player: ownerOf(state, m).index });
    log(state, m.name + " 被冻结。", ownerOf(state, m), "freeze");
  }

  function grantTaunt(state, m) {
    if (!m || m.dead) return;
    m.taunt = true;
    if (!m.keywords.includes("taunt")) m.keywords.push("taunt");
    const owner = ownerOf(state, m);
    log(state, m.name + " 获得拦截。", owner, "taunt");
  }

  function comboActive(player) {
    return (player.cardsPlayedThisTurn || 0) > 1;
  }

  function grantReborn(state, m) {
    if (!m || m.dead) return;
    m.reborn = true;
    if (!m.keywords.includes("reborn")) m.keywords.push("reborn");
    log(state, m.name + " 获得回潮。", ownerOf(state, m), "reborn");
  }

  function addDeathrattleEffect(m, d) {
    if (!m || !d) return;
    if (!Array.isArray(m.deathrattles)) m.deathrattles = m.deathrattle ? [m.deathrattle] : [];
    const sig = JSON.stringify(d);
    if (!m.deathrattles.some(x => JSON.stringify(x) === sig)) m.deathrattles.push(d);
    if (!m.deathrattle) m.deathrattle = d;
  }

  function grantDeathrattle(state, m, d, label) {
    if (!m || m.dead) return;
    addDeathrattleEffect(m, d);
    if (!m.keywords.includes("deathrattle")) m.keywords.push("deathrattle");
    log(state, m.name + " 获得余响：" + label + "。", ownerOf(state, m), "deathrattle");
  }

  // ===== 灰港同盟：悬赏名单 =====
  function markBounty(state, player, target) {
    if (!target || target.dead) return false;
    if (target.owner === player.index) return false;
    if (target.bounty != null) {
      log(state, target.name + " 已经在悬赏名单中。", player, "bounty");
      return false;
    }
    target.bounty = { owner: player.index };
    state.events.push({ structured: true, kind: "bounty", targetUid: target.uid, player: player.index });
    log(state, player.name + " 将 " + target.name + " 列入悬赏名单。", player, "bounty");
    return true;
  }

  function hasBountyTarget(state, player) {
    return aliveMinions(opponentOf(state, player)).some(m => m.bounty && m.bounty.owner === player.index);
  }

  function claimBounty(state, owner, m) {
    if (!owner) return;
    owner.bountiesClaimed = (owner.bountiesClaimed || 0) + 1;
    owner.bountiesClaimedThisTurn = (owner.bountiesClaimedThisTurn || 0) + 1;
    drawCard(state, owner, 1);
    log(state, "悬赏完成：" + owner.name + " 抽 1 张牌。", owner, "bounty");
    if (owner.heroId === "monarch") {
      owner.armor += 1;
      state.events.push({ structured: true, kind: "armor", player: owner.index, amount: 1 });
      log(state, "抽成：" + owner.name + " 获得 1 点护甲。", owner, "armor");
    }
    if (owner.relic === "gh_bounty_board") {
      drawCard(state, owner, 1);
      log(state, "悬赏榜：额外抽 1 张牌。", owner, "draw");
    }
    for (const ally of aliveMinions(owner)) {
      if (ally.silenced || !ally.passive) continue;
      if (ally.passive.type === "bountyClaimGrowth") {
        buffMinion(state, ally, ally.passive.attack || 1, ally.passive.health || 1, "赏金", true);
      }
      if (ally.passive.type === "bountyClaimDamage") {
        damageHero(state, opponentOf(state, owner), ally.passive.amount || 2, null, "赏金王", true);
      }
    }
    checkGameOver(state);
  }

  function grantDivineShield(state, m) {
    if (!m || m.dead) return;
    m.divineShield = true;
    if (!m.keywords.includes("divineShield")) m.keywords.push("divineShield");
    log(state, m.name + " 获得护幕。", ownerOf(state, m), "divineShield");
  }

  function grantRush(state, m) {
    if (!m || m.dead) return;
    m.rush = true;
    if (!m.keywords.includes("rush")) m.keywords.push("rush");
    if (!m.hasAttacked) m.attacksLeft = Math.max(m.attacksLeft || 0, m.windfury ? 2 : 1);
    log(state, m.name + " 获得袭扰。", ownerOf(state, m), "rush");
  }

  function openDiscover(state, player, pool, sourceCardId) {
    let options = [];
    const fromDeck = false;
    const all = discoverPool(player, pool);
    options = shuffle(state, all).slice(0, 3);
    if (!options.length) {
      log(state, player.name + " 没有可检索的卡牌。", player, "discover");
      return;
    }
    const choice = { type: "discover", player: player.index, options: options, source: sourceCardId, fromDeck: fromDeck };
    if (state.pendingChoice) {
      state.discoverQueue = state.discoverQueue || [];
      state.discoverQueue.push(choice);
      log(state, player.name + " 触发额外检索，加入待选队列。", player, "discover");
      return;
    }
    state.pendingChoice = choice;
    log(state, player.name + " 触发检索，等待选择。", player, "discover");
  }

  function advanceDiscover(state) {
    if (state.discoverQueue && state.discoverQueue.length) {
      state.pendingChoice = state.discoverQueue.shift();
      return;
    }
    state.pendingChoice = null;
    resumePendingEndTurn(state);
  }

  function resolveDiscover(state, playerIndex, cardId) {
    if (!state.pendingChoice || state.pendingChoice.type !== "discover") return { ok: false, reason: "没有待处理的检索" };
    if (state.pendingChoice.player !== playerIndex) return { ok: false, reason: "不是你的选择" };
    if (state.pendingChoice.options.indexOf(cardId) < 0) return { ok: false, reason: "不在检索选项中" };
    const player = state.players[playerIndex];
    if (state.pendingChoice.fromDeck) {
      let chosenId = cardId;
      let idx = player.deck.findIndex(c => c.cardId === chosenId && card(c.cardId).type === "spell");
      if (idx < 0) {
        const fallback = state.pendingChoice.options.find(id => player.deck.some(c => c.cardId === id && card(c.cardId).type === "spell"));
        if (fallback) {
          chosenId = fallback;
          idx = player.deck.findIndex(c => c.cardId === chosenId && card(c.cardId).type === "spell");
        }
      }
      if (idx < 0) {
        log(state, "检索选项已被其他效果取走，跳过本次选择。", player, "discover");
        advanceDiscover(state);
        return { ok: true, reason: "检索选项已失效" };
      }
      const [deckCard] = player.deck.splice(idx, 1);
      const added = addCardToHand(state, player, chosenId, {});
      if (!added) {
        player.deck.splice(idx, 0, deckCard);
        log(state, "手牌已满，检索牌留在牌库。", player, "discover");
        advanceDiscover(state);
        return { ok: true, reason: "手牌已满，检索牌留在牌库" };
      }
    } else {
      addCardToHand(state, player, cardId, {});
    }
    advanceDiscover(state);
    return { ok: true };
  }

  function getAttackOptions(state, playerIndex, attackerUid) {
    const player = state.players[playerIndex];
    const m = player ? allMinions(player).find(x => x.uid === attackerUid) : null;
    if (!m || m.dead || m.attacksLeft <= 0 || m.frozenTurns > 0 || m.attack <= 0) return { ok: false, targets: [] };
    const enemy = opponentOf(state, player);
    const taunts = aliveMinions(enemy).filter(x => x.taunt && !x.stealth);
    const canHitHero = !m.rush || m.charge;
    let targets = [];
    if (m.ignoreTaunt) {
      targets = aliveMinions(enemy).filter(x => !x.stealth).map(x => x.uid);
      if (canHitHero) targets.push("hero");
    } else if (taunts.length) {
      targets = taunts.map(x => x.uid);
    } else {
      targets = aliveMinions(enemy).filter(x => !x.stealth).map(x => x.uid);
      if (canHitHero) targets.push("hero");
    }
    return { ok: true, targets: targets };
  }

  function attack(state, playerIndex, attackerUid, targetUid) {
    if (state.status !== "playing") return { ok: false, reason: "对局已结束" };
    if (state.mulliganPhase) return { ok: false, reason: "请先完成起手调度" };
    if (state.current !== playerIndex) return { ok: false, reason: "还没轮到你" };
    const player = state.players[playerIndex];
    const attacker = allMinions(player).find(m => m.uid === attackerUid);
    if (!attacker) return { ok: false, reason: "找不到攻击者" };
    if (attacker.dead) return { ok: false, reason: "该随从已经死亡" };
    if (attacker.attack <= 0) return { ok: false, reason: "攻击力为 0，无法攻击" };
    if (attacker.attacksLeft <= 0) return { ok: false, reason: "该随从本回合已经攻击过" };
    if (attacker.frozenTurns > 0) return { ok: false, reason: "该随从被冻结" };
    const opts = getAttackOptions(state, playerIndex, attackerUid);
    const legalTarget = targetUid === "hero" ? opts.targets.indexOf("hero") >= 0 : opts.targets.indexOf(targetUid) >= 0;
    if (!opts.ok || !legalTarget) {
      return { ok: false, reason: "不能攻击该目标（可能有拦截）", targets: opts.targets };
    }
    const enemy = opponentOf(state, player);
    attacker.attacksLeft -= 1;
    attacker.attacksUsedThisTurn = (attacker.attacksUsedThisTurn || 0) + 1;
    attacker.hasAttacked = true;
    attacker.stealth = false;
    if (targetUid === "hero") {
      state.lastAction = { type: "attack", player: playerIndex, attackerUid, targetUid, seq: ((state.lastAction && state.lastAction.seq) || 0) + 1 };
      log(state, attacker.name + " 攻击 " + enemy.name + " 的领袖。", player, "attack");
      damageHero(state, enemy, attacker.attack, attacker, "随从攻击");
      processDeaths(state);
      return { ok: true };
    }
    const defender = findMinion(state, targetUid);
    if (!defender || defender.dead) return { ok: false, reason: "目标已不在场" };
    state.lastAction = { type: "attack", player: playerIndex, attackerUid, targetUid, seq: ((state.lastAction && state.lastAction.seq) || 0) + 1 };
    log(state, attacker.name + " 攻击 " + defender.name + "。", player, "attack");
    const frostHunter = aliveMinions(player).some(x => x.passive && x.passive.type === "attackDestroyFrozen" && !x.silenced);
    if (frostHunter && defender.frozenTurns > 0) {
      defender.dead = true;
      state.events.push({ structured: true, kind: "destroy", targetUid: defender.uid, player: enemy.index });
      log(state, defender.name + " 处于冻结状态，被霜系教授直接消灭。", player, "destroy");
      processDeaths(state);
      checkGameOver(state);
      return { ok: true };
    }
    const atk = attacker.attack;
    const def = defender.attack;
    damageMinion(state, defender, atk, attacker, "战斗");
    damageMinion(state, attacker, def, defender, "反击");
    const defenderDied = defender.dead;
    processDeaths(state);
    if (!attacker.dead && defenderDied && attacker.passive && attacker.passive.type === "onKillGrowthStealth") {
      buffMinion(state, attacker, 0, attacker.passive.health || 1, "猎杀", true);
      attacker.stealth = true;
      if (!attacker.keywords.includes("stealth")) attacker.keywords.push("stealth");
      log(state, attacker.name + " 消灭了 " + defender.name + "，获得隐匿。", player, "stealth");
    }
    checkGameOver(state);
    return { ok: true };
  }

  function transformCandidates(player, handCard) {
    const oldDef = card(handCard.cardId);
    if (!oldDef) return [];
    return Object.keys(D.CARDS).filter(id => {
      const d = D.CARDS[id];
      if (!d || d.token || d.disabled || d.cost !== oldDef.cost || id === oldDef.id || d.type === "relic") return false;
      return d.faction === player.faction;
    });
  }

  function transformHandCard(state, player, handCard) {
    const oldDef = card(handCard.cardId);
    const candidates = transformCandidates(player, handCard);
    if (!candidates.length) return false;
    const nextId = candidates[Math.floor(Math.random() * candidates.length)];
    handCard.cardId = nextId;
    handCard.generated = true;
    log(state, player.name + " 将手牌中的「" + oldDef.name + "」改写为「" + D.CARDS[nextId].name + "」。", player, "handChange");
    return true;
  }

  function upgradeCandidateIds(player, handCard) {
    const oldDef = card(handCard.cardId);
    if (!oldDef || oldDef.cost == null || oldDef.cost >= 10) return [];
    const nextCost = Math.min(10, oldDef.cost + 1);
    return Object.keys(D.CARDS).filter(id => {
      const d = D.CARDS[id];
      if (!d || d.token || d.disabled || d.type === "relic" || id === oldDef.id || d.cost !== nextCost) return false;
      return d.faction === player.faction || d.faction === "neutral";
    });
  }

  function upgradeHandCard(state, player, handCard) {
    const oldDef = card(handCard.cardId);
    const candidates = upgradeCandidateIds(player, handCard);
    if (!candidates.length) return false;
    const nextId = candidates[randomInt(state, candidates.length)];
    handCard.cardId = nextId;
    handCard.generated = true;
    log(state, player.name + " 将手牌中的「" + oldDef.name + "」改铸为「" + D.CARDS[nextId].name + "」。", player, "handChange");
    return true;
  }

  function useHeroPower(state, playerIndex, targetUid) {
    if (state.status !== "playing") return { ok: false, reason: "对局已结束" };
    if (state.mulliganPhase) return { ok: false, reason: "请先完成起手调度" };
    if (state.current !== playerIndex) return { ok: false, reason: "还没轮到你" };
    const player = state.players[playerIndex];
    if (player.heroPowerUsed) return { ok: false, reason: "领袖技能本回合已用过" };
    if (player.hero.power && player.hero.power.id === "spell_codex") {
      const cost = player.hero.power.cost || 2;
      if (player.mana < cost) return { ok: false, reason: "行动力不足" };
      const spells = player.hand.filter(c => card(c.cardId).type === "spell");
      if (!spells.length) return { ok: false, reason: "手牌中没有战术牌可以编目" };
      player.mana -= cost;
      player.heroPowerUsed = true;
      state.lastAction = { type: "heroPower", player: playerIndex, heroId: player.heroId, powerName: player.hero.power.name, targetUid: null, seq: ((state.lastAction && state.lastAction.seq) || 0) + 1 };
      log(state, player.name + " 使用领袖技能「编目」。", player, "heroPower");
      const picked = spells[randomInt(state, spells.length)];
      picked.discount = (picked.discount || 0) + 1;
      log(state, "编目：手牌「" + card(picked.cardId).name + "」行动力消耗 -1。", player, "discount");
      return { ok: true };
    }
    if (player.hero.power && (player.hero.power.passive || player.hero.power.target === "passive")) {
      return { ok: false, reason: "这是被动技能，无需主动使用" };
    }
    if (player.heroId === "wolfram") {
      const cost = player.hero.power.cost || 2;
      if (player.mana < cost) return { ok: false, reason: "行动力不足" };
      const changeable = player.hand.filter(c => upgradeCandidateIds(player, c).length > 0);
      if (!changeable.length) return { ok: false, reason: "没有可以改铸的手牌" };
      player.mana -= cost;
      player.heroPowerUsed = true;
      state.lastAction = { type: "heroPower", player: playerIndex, heroId: player.heroId, powerName: player.hero.power.name, targetUid: null, seq: ((state.lastAction && state.lastAction.seq) || 0) + 1 };
      log(state, player.name + " 使用领袖技能「改铸」。", player, "heroPower");
      let changed = 0;
      for (const handCard of player.hand.slice()) {
        if (upgradeHandCard(state, player, handCard)) changed++;
      }
      log(state, "改铸：改写了 " + changed + " 张手牌。", player, "handChange");
      return { ok: true, changed };
    }
    if (player.mana < 2) return { ok: false, reason: "行动力不足" };
    if (player.heroId === "karna") {
      player.mana -= 2;
      player.heroPowerUsed = true;
      state.lastAction = { type: "heroPower", player: playerIndex, heroId: player.heroId, powerName: player.hero.power.name, targetUid: null, seq: ((state.lastAction && state.lastAction.seq) || 0) + 1 };
      log(state, player.name + " 使用领袖技能「血祭」。", player, "heroPower");
      damageHero(state, player, player.hero.power.selfDamage || 1, null, "血祭");
      drawCard(state, player, 1);
      checkGameOver(state);
      return { ok: true };
    }
    const handTarget = false;
    let targets = [];
    let targetIds = [];
    if (handTarget) {
      targetIds = player.hand.map(c => c.uid);
      if (!targetIds.length) return { ok: false, reason: "没有可以改写的手牌" };
      if (!targetUid || targetIds.indexOf(targetUid) < 0) return { ok: false, reason: "请选择一张手牌", code: "target", targets: targetIds };
    } else {
      const heroTargetType = player.heroId === "otto" ? "enemy" : "friendly";
      targets = heroTargetType === "enemy"
        ? aliveMinions(opponentOf(state, player)).filter(m => !m.stealth)
        : aliveMinions(player);
      targetIds = targets.map(m => m.uid);
      if (player.heroId === "otto") targetIds.unshift("hero");
      if (!targetIds.length) return { ok: false, reason: heroTargetType === "enemy" ? "没有敌方目标" : "没有友方随从可作为目标" };
    }
    let target = null;
    if (handTarget) target = player.hand.find(c => c.uid === targetUid);
    else if (targetUid === "hero" && player.heroId === "otto") target = "hero";
    else if (targetUid) target = targets.find(m => m.uid === targetUid);
    if (!target) return {
      ok: false,
      reason: handTarget ? "请选择一张手牌"
        : (player.heroId === "otto" ? "请选择一个敌方随从或领袖" : "请选择一个友方随从"),
      code: "target", targets: targetIds
    };
    if (handTarget && !transformCandidates(player, target).length) {
      return { ok: false, reason: "没有同阵营且行动力消耗相同的手牌可改写", code: "target", targets: targetIds };
    }
    player.mana -= (player.hero.power.cost || 2);
    player.heroPowerUsed = true;
    state.lastAction = { type: "heroPower", player: playerIndex, heroId: player.heroId, powerName: player.hero.power.name, targetUid: targetUid || null, seq: ((state.lastAction && state.lastAction.seq) || 0) + 1 };
    log(state, player.name + " 使用领袖技能「" + player.hero.power.name + "」。", player, "heroPower");
    if (handTarget) {
      transformHandCard(state, player, target);
    } else if (player.heroId === "lain") {
      const zoneMates = player.board[target.zone].filter(m => m.uid !== target.uid && !m.dead);
      const hasMate = zoneMates.length > 0;
      buffMinion(state, target, hasMate ? 1 : 0, 1, "协调", true);
    } else if (player.heroId === "otto") {
      if (target === "hero") damageHero(state, opponentOf(state, player), 1, null, "炮击");
      else damageMinion(state, target, 1, null, "炮击");
      processDeaths(state);
    }
    checkGameOver(state);
    return { ok: true };
  }

  function startTurn(state) {
    if (state.status !== "playing") return;
    const player = state.players[state.current];
    state.turnNumber++;
    for (const p of state.players) {
      for (const m of allMinions(p)) {
        if (m.passive && m.passive.expiresTurn && m.passive.expiresTurn < state.turnNumber) m.passive = null;
      }
    }
    player.maxMana = Math.min(10, player.maxMana + 1);
    player.heroPowerUsed = false;
    if (player.heroPowerBlocked) {
      player.heroPowerBlocked = false;
      player.heroPowerUsed = true;
      log(state, player.name + " 受到战地检疫影响，本回合不能使用技能。", player, "debuff");
    }
    player.freezeImmuneTurn = false;
    player.healBlockTurn = false;
    player.spellsCastThisTurn = 0;
    player.cardsPlayedThisTurn = 0;
    player.freeSpellTurn = false;
    player.nextSpellReduction = 0;
    player.minionsPlayedThisTurn = 0;
    player.tauntMinionsPlayedThisTurn = 0;
    player.recruitsSummonedThisTurn = 0;
    player.bountiesClaimedThisTurn = 0;
    state.deathsThisTurn = 0;
    player.spellCostReduction = 0;
    player.nextCostReduction = 0;
    player.mana = Math.max(0, player.maxMana - (player.overload || 0)) + (player.nextTurnManaBonus || 0);
    player.nextTurnManaBonus = 0;
    player.overload = 0;
    if (player.heroId === "marta") player.spellCostReduction = 1;
            if (player.relic === "armor_forge") { player.armor += 1; log(state, player.name + " 的帝国锻炉提供 1 点护甲。", player, "armor"); }
    for (const f of player.formations || []) {
      if (f.turnsLeft != null) f.turnsLeft -= 1;
    }
    player.formations = (player.formations || []).filter(f => f.turnsLeft == null || f.turnsLeft > 0);
    for (const m of allMinions(player)) {
      if (m.passive && m.passive.type === "turnArmor" && !m.silenced) {
        const armorGain = m.passive.amount || 1;
        player.armor += armorGain;
        state.events.push({ kind: "armor", player: player.index, amount: armorGain, structured: true });
        log(state, m.name + " 的被动提供 " + armorGain + " 点护甲。", player, "armor");
      }
      if (m.passive && m.passive.type === "turnGrowth" && !m.silenced) buffMinion(state, m, m.passive.attack || 1, m.passive.health || 1, "生长", true);
      m.attacksLeft = m.windfury ? 2 : 1;
      m.attacksUsedThisTurn = 0;
      m.hasAttacked = false;
      m.ignoreTaunt = false;
      m.justPlayed = false;
    }
    if (player.relic === "blood_censer") {
      const targets = [];
      for (const p of state.players) for (const m of aliveMinions(p)) targets.push(m);
      if (targets.length) {
        const pick = targets[randomInt(state, targets.length)];
        damageMinion(state, pick, 1, null, "血香炉");
        log(state, "血香炉灼烧了 " + pick.name + "。", player, "damage");
        if (!pick.dead) drawCard(state, player, 1);
        processDeaths(state);
        if (state.status !== "playing") return;
      }
    }
    log(state, "—— " + player.name + " 的回合开始（第 " + state.round + " 轮，行动力 " + player.mana + "/" + player.maxMana + "）——", player, "turn");
    drawCard(state, player, 1);
    checkGameOver(state);
  }

  function triggerSpellDiscoverObservers(state, player) {
    let done = false;
    for (const m of aliveMinions(player)) {
      if (done || !m.passive || m.passive.type !== "spellDiscoverOnce" || m.silenced) continue;
      if (player.theoristTurn === state.turnNumber) continue;
      player.theoristTurn = state.turnNumber;
      openDiscover(state, player, "spell", m.cardId);
      done = true;
    }
  }

  function repeatLastSpell(state, player) {
    const speaker = aliveMinions(player).find(m => m.passive && m.passive.type === "repeatLastSpell" && !m.silenced);
    const last = player.lastSpell;
    if (!speaker || !last || state.status !== "playing") return;
    const def = card(last.cardId);
    if (!def || def.type !== "spell") return;
    const temp = { uid: uid("c"), cardId: last.cardId, generated: true };
    player.hand.push(temp);
    log(state, speaker.name + " 复诵「" + def.name + "」。", player, "spell");
    const res = playCard(state, player.index, temp.uid, { targetUid: last.targetUid, targetUid2: last.targetUid2, zone: last.zone, payBlood: !!last.payBlood, freeCast: true });
    player.hand = player.hand.filter(c => c.uid !== temp.uid);
    if (!res.ok) log(state, "复诵失败：" + (res.reason || "目标已失效"), player, "error");
  }

  function resumePendingEndTurn(state) {
    if (state.pendingEndTurn == null || state.pendingChoice || state.status !== "playing") return;
    const ending = state.pendingEndTurn;
    state.pendingEndTurn = null;
    finishEndTurn(state, ending);
  }

  function finishEndTurn(state, playerIndex) {
    if (state.status !== "playing") return;
    const player = state.players[playerIndex];
    if (!player) return;
    for (const ally of aliveMinions(player)) {
      if (ally.silenced || !ally.passive || ally.passive.type !== "endTurnMarkBounty") continue;
      const enemies = aliveMinions(opponentOf(state, player)).filter(m => m.bounty == null);
      if (enemies.length) markBounty(state, player, enemies[randomInt(state, enemies.length)]);
    }
    if (player.veinDebt) {
      const debt = player.veinDebt;
      player.veinDebt = 0;
      log(state, player.name + " 偿还借脉：流脉 +" + debt + "。", player, "vein");
      addVein(state, debt, "借脉偿还");
    }
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
    repeatLastSpell(state, player);
    if (state.status !== "playing") return { ok: true };
    if (state.pendingChoice) {
      state.pendingEndTurn = playerIndex;
      log(state, "复诵触发检索，先完成选择。", player, "discover");
      return { ok: true, pending: true };
    }
    finishEndTurn(state, playerIndex);
    return { ok: true };
  }

  function getPlayOptions(state, playerIndex, cardUid) {
    const player = state.players[playerIndex];
    const c = player.hand.find(x => x.uid === cardUid);
    if (!c) return { ok: false, reason: "没有这张手牌" };
    const def = card(c.cardId);
    const targetType = getTargetType(state, def);
    const targets = getValidTargets(state, player, targetType);
    const target2Type = def.target2 || null;
    const target2Targets = target2Type ? getValidTargets(state, player, target2Type) : [];
    const zoneType = def.type === "minion" || def.type === "formation";
    const zones = def.type === "minion" ? openZones(player) : def.type === "formation" ? ZONES.slice() : [];
    const cost = getCardCost(state, player, c);
    const canMana = player.mana >= cost;
    const canArmor = def.id !== "armor_mortar" || (player.armor || 0) >= 3;
    const canBlood = def.bloodCost == null || player.hp > def.bloodCost;
    const canBoard = def.type === "minion" ? boardCount(player) < 6 : def.type === "formation" ? (player.formations || []).length < 2 : true;
    const canTarget = !targetType || targets.length > 0 || !!def.optionalTarget || def.type === "minion" || (def.id === "miyuki" && state.vein >= 6);
    const canTarget2 = !target2Type || target2Targets.length > 0 || !!def.optionalTarget2;
    const canZone = !zoneType || zones.length > 0;
    const formReason = def.type === "formation" && !canBoard ? "阵型槽已满" : "";
    return {
      ok: canMana && canArmor && canBlood && canBoard && canTarget && canTarget2 && canZone,
      card: def,
      cost: cost,
      targetType: targetType,
      targets: targets.map(m => m.uid),
      target2Type: target2Type,
      target2Targets: target2Targets.map(m => m.uid),
      zones: zones,
      canMana: canMana,
      canArmor: canArmor,
      canBlood: canBlood,
      canBoard: canBoard,
      canTarget: canTarget,
      canTarget2: canTarget2,
      bloodCost: def.bloodCost || 0,
      reason: !canMana ? "行动力不足" : !canArmor ? "需要至少 3 点护甲" : !canBlood ? "生命不足，无法支付血祭" : !canBoard ? (formReason || "随从已满") : !canTarget ? "没有合法目标" : !canTarget2 ? "缺少第二个合法目标" : null
    };
  }

  function getHeroPowerOptions(state, playerIndex) {
    const player = state.players[playerIndex];
    if (!player) return { ok: false, targets: [] };
    if (player.hero.power && player.hero.power.id === "spell_codex") {
      const hasSpell = player.hand.some(c => card(c.cardId).type === "spell");
      return {
        ok: !player.heroPowerUsed && player.mana >= (player.hero.power.cost || 2) && hasSpell,
        targets: [],
        targetType: "none",
        cost: player.hero.power.cost || 2,
        used: player.heroPowerUsed
      };
    }
    if (player.hero.power && (player.hero.power.passive || player.hero.power.target === "passive")) {
      return {
        ok: false,
        passive: true,
        targets: [],
        targetType: "passive",
        cost: 0,
        used: false
      };
    }
    if (player.heroId === "wolfram") {
      const canChange = player.hand.some(c => {
        const d = card(c.cardId);
        if (!d || d.cost == null || d.cost >= 10 || d.type === "relic") return false;
        const nextCost = Math.min(10, d.cost + 1);
        return Object.keys(D.CARDS).some(id => {
          const n = D.CARDS[id];
          return n && !n.token && !n.disabled && n.type !== "relic" && n.cost === nextCost && id !== d.id && (n.faction === player.faction || n.faction === "neutral");
        });
      });
      return {
        ok: !player.heroPowerUsed && player.mana >= (player.hero.power.cost || 2) && canChange,
        targets: [],
        targetType: "none",
        cost: player.hero.power.cost || 2,
        used: player.heroPowerUsed
      };
    }
    if (player.heroId === "karna") {
      return {
        ok: !player.heroPowerUsed && player.mana >= 2,
        targets: [],
        targetType: "none",
        cost: 2,
        used: player.heroPowerUsed
      };
    }
    const handTarget = false;
    const targetType = player.heroId === "otto" ? "enemy" : "friendly";
    const targets = targetType === "enemy"
      ? aliveMinions(opponentOf(state, player)).filter(m => !m.stealth)
      : (targetType === "friendly" ? aliveMinions(player) : []);
    let targetIds = handTarget ? player.hand.filter(c => transformCandidates(player, c).length > 0).map(c => c.uid) : targets.map(m => m.uid);
    if (player.heroId === "otto") targetIds.unshift("hero");
    return {
      ok: !player.heroPowerUsed && player.mana >= (player.hero.power.cost || 2) && targetIds.length > 0,
      targets: targetIds,
      targetType: targetType,
      cost: player.hero.power.cost || 2,
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
    const bothDone = !!(state.mulliganDone[0] && state.mulliganDone[1]);
    if (bothDone) {
      state.mulliganPhase = false;
      const second = 1 - state.stats.firstPlayer;
      const secondPlayer = state.players[second];
      if (!secondPlayer.hand.some(c => c.cardId === "mining_permit")) {
        secondPlayer.hand.push({ uid: uid("c"), cardId: "mining_permit", generated: true });
      }
      log(state, "起手调度完成，进入第一回合。", player, "mulligan");
      startTurn(state);
    }
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
      aiDifficulty: config.aiDifficulty || "normal",
      players: [],
      current: 0,
      round: 1,
      turnNumber: 0,
      vein: 0,
      nextMinionSeq: 0,
      deferDeaths: 0,
      deathsPending: false,
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
    const firstRelic = (f) => (D.DECKS[f] || []).find(id => D.CARDS[id] && D.CARDS[id].type === "relic");
    const deckWithRelic = (f) => {
      const list = (D.DECKS[f] || []).filter(id => D.CARDS[id] && D.CARDS[id].type !== "relic");
      const relic = firstRelic(f);
      return relic ? list.concat([relic]) : list;
    };
    state.players[0].deck = buildDeck(state, faction1, config.p1Deck || deckWithRelic(faction1));
    state.players[1].deck = buildDeck(state, faction2, config.p2Deck || deckWithRelic(faction2));
    for (const p of state.players) {
      if (p.relic === "wanderer_charm") { p.maxHp += 5; }
    }
    // 随机先手：先手 3 张，后手 4 张 + 采掘许可
    const first = config.first == null ? (nextRandom(state) < 0.5 ? 0 : 1) : config.first;
    const second = 1 - first;
    state.current = first;
    state.stats.firstPlayer = first;
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
        }
      }
    }
    if (config.mulligan) {
      state.mulliganPhase = true;
      state.mulliganDone = { 0: false, 1: false };
    } else {
      state.players[second].hand.push({ uid: uid("c"), cardId: "mining_permit", generated: true });
    }
    log(state, "档案推演开始。先手：" + state.players[first].name + "。", state.players[first], "start");
    if (config.mulligan) return state;
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
    startTurn: startTurn,
    processDeaths: processDeaths,
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
    summonMinion: summonMinion,
    findMinion: findMinion,
    freezeMinion: freezeMinion,
    silenceMinion: silenceMinion,
    grantRush: grantRush,
    grantDivineShield: grantDivineShield,
    grantReborn: grantReborn,
    grantDeathrattle: grantDeathrattle
  };
});
