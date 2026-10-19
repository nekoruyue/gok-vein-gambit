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
      spellCostReduction: 0,
      fatigue: 0,
      cardsPlayed: 0,
      spellsCastThisTurn: 0,
      cardsPlayedThisTurn: 0,
      overload: 0,
      veinDebt: 0,
      freezeImmuneTurn: false,
      healBlockTurn: false,
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
    if (mainOnly) {
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
      divineShield: (def.keywords || []).includes("divineShield"),
      windfury: (def.keywords || []).includes("windfury"),
      poisonous: (def.keywords || []).includes("poisonous"),
      lifesteal: (def.keywords || []).includes("lifesteal"),
      rush: (def.keywords || []).includes("rush"),
      reborn: (def.keywords || []).includes("reborn"),
      rebornUsed: false,
      stealth: !!(opts && opts.stealth),
      frozenTurns: 0,
      silenced: false,
      dead: false,
      attacksLeft: charge ? ((def.keywords || []).includes("windfury") ? 2 : 1) : 0,
      hasAttacked: false,
      ignoreTaunt: false,
      justPlayed: true,
      passive: def.passive || null,
      deathrattle: def.deathrattle || null,
      token: !!def.token
    };
    if (opts && opts.taunt) {
      m.taunt = true;
      if (!m.keywords.includes("taunt")) m.keywords.push("taunt");
    }
    const ownerPlayer = owner && owner.heroId ? owner : state.players[owner];
    if (ownerPlayer && ownerPlayer.heroId === "wolfram" && m.taunt && !m.silenced) {
      m.health += 1;
      m.maxHealth += 1;
    }
    if (ownerPlayer && ownerPlayer.relic === "iron_banner" && m.taunt && !m.silenced) {
      m.attack += 1;
      m.health += 1;
      m.maxHealth += 1;
    }
    return m;
  }

  function formationBonus(player, zone) {
    const out = { attack: 0, health: 0, taunt: false };
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
      }
    }
    if (hasFormation && player.relic === "formation_standard") { out.attack += 1; out.health += 1; }
    return out;
  }

  function applyFormationToZone(state, player, zone) {
    const b = formationBonus(player, zone);
    if (!b.attack && !b.health && !b.taunt) return;
    for (const m of aliveMinions(player).filter(x => x.zone === zone)) { buffMinion(state, m, b.attack, b.health, "阵型", true); if (b.taunt) grantTaunt(state, m); }
  }

  function summonMinion(state, player, cardId, zone, opts) {
    const def = card(cardId);
    if (boardCount(player) >= 6) {
      log(state, "随从区已满（全场最多 6 个），无法召唤 " + def.name + "。", player, "error");
      return null;
    }
    const z = zone || openZones(player)[0];
    if (!z || !zoneHasSpace(player, z)) {
      log(state, "阵位已满，无法召唤 " + def.name + "。", player, "error");
      return null;
    }
    const m = makeMinion(state, player, cardId, z, opts);
    player.board[z].push(m);
    const fb = formationBonus(player, z);
    if (fb.attack || fb.health) {
      m.attack += fb.attack;
      m.health += fb.health;
      m.maxHealth += fb.health;
    }
    if (fb.taunt) grantTaunt(state, m);
    log(state, player.name + " 召唤了 " + def.name + "（" + ZONE_NAMES[z] + "）。", player, "summon");
    state.stats.minionsSummoned++;
    if (m.taunt) {
      for (const ally of aliveMinions(player)) {
        if (ally.passive && ally.passive.type === "tauntAura" && !ally.silenced) {
          m.health += ally.passive.amount || 1;
          m.maxHealth += ally.passive.amount || 1;
        }
      }
    }
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
        continue;
      }
      const c = player.deck.shift();
      if (player.hand.length >= 8) {
        log(state, player.name + " 手牌已满，" + card(c.cardId).name + " 被烧掉。", player, "burn");
      } else {
        player.hand.push(c);
        log(state, player.name + " 抽到 " + card(c.cardId).name + "。", player, "draw");
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

  function addRandomSpell(state, player, label) {
    const pool = Object.keys(D.CARDS).filter(id => {
      const d = card(id);
      return d && !d.token && !d.disabled && d.type === "spell";
    });
    if (!pool.length) return null;
    const id = pool[randomInt(state, pool.length)];
    const added = addCardToHand(state, player, id, {});
    if (added) log(state, "额外检索法术牌：" + card(id).name + "。", player, label || "discover");
    return added;
  }

  function getCardCost(state, player, cardIdOrCard) {
    const id = typeof cardIdOrCard === "string" ? cardIdOrCard : cardIdOrCard.cardId;
    const def = card(id);
    const spellReduction = def.type === "spell" ? (player.spellCostReduction || 0) : 0;
    return Math.max(0, def.cost - (player.nextCostReduction || 0) - spellReduction);
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
    if (m.divineShield && !m.silenced) {
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
    const dmgOwner = ownerOf(state, m);
    if (m.health > 0 && !m.silenced && dmgOwner.heroId === "karna" && source && source.owner === dmgOwner.index) {
      if (nextRandom(state) < 0.5) buffMinion(state, m, 1, 0, "血债", true);
      else buffMinion(state, m, 0, 1, "血债", true);
      log(state, m.name + " 承受友方伤害后获得血债强化。", dmgOwner, "buff");
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
    let left = amount;
    if (player.armor > 0) {
      const absorbed = Math.min(player.armor, left);
      player.armor -= absorbed;
      left -= absorbed;
      if (absorbed > 0) log(state, player.name + " 的护甲吸收了 " + absorbed + " 点伤害。", player, "armor");
    }
    player.hp -= left;
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
    m.divineShield = false;
    m.windfury = false;
    m.poisonous = false;
    m.lifesteal = false;
    m.rush = false;
    m.reborn = false;
    m.attack = m.baseAttack;
    m.maxHealth = m.baseHealth;
    m.health = Math.min(m.health, m.maxHealth);
    log(state, m.name + " 被封缄。", ownerOf(state, m), "silence");
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
    return { ok: false, reason: "该随从不在场上。" };
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
              state.events.push({ structured: true, kind: "death", targetUid: m.uid, player: p.index, zone: z });
              log(state, m.name + " 死亡。", p, "death");
              p.board[z] = p.board[z].filter(x => x.uid !== m.uid);
              state.stats.minionsDied++;
              if (m.deathrattle && !m.silenced) triggerDeathrattle(state, p, m);
              if (m.reborn && !m.rebornUsed && !m.silenced) {
                const reborn = summonMinion(state, p, m.cardId, z, null);
                if (reborn) {
                  reborn.health = 1;
                  reborn.maxHealth = 1;
                  reborn.rebornUsed = true;
                  reborn.justPlayed = true;
                  log(state, m.name + " 回潮。", p, "reborn");
                }
              }
              if (p.relic === "blood_scythe") healHero(state, p, 3);
              if (p.relic === "republic_seal" && m.taunt) drawCard(state, p, 1);
              if (p.relic === "powder_engine") {
                const enemy = opponentOf(state, p);
                const targets = aliveMinions(enemy);
                const pick = randomInt(state, targets.length + 1);
                if (pick >= targets.length) damageHero(state, enemy, 1, null, "火药引擎", true);
                else damageMinion(state, targets[pick], 1, null, "火药引擎");
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
              }
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
      for (const enemy of aliveMinions(opponentOf(state, player)).filter(x => !x.stealth)) freezeMinion(state, enemy);
      log(state, "余响：" + m.name + " 凝滞了所有敌方随从。", player, "freeze");
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
      if (enemies.length) damageMinion(state, enemies[randomInt(state, enemies.length)], dmg, null, "余响");
      else damageHero(state, opponentOf(state, player), dmg, null, "余响", true);
      log(state, "余响：" + m.name + " 对随机敌方目标造成 " + dmg + " 点伤害。", player, "deathrattle");
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
          if (p.relic === "vein_heart" && p.lastVeinHeartTurn !== state.turnNumber) { p.lastVeinHeartTurn = state.turnNumber; p.armor += 1; log(state, p.name + " 的地脉之心响应流脉增加，获得 1 点护甲。", p, "armor"); }
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
    for (const p of state.players) {
      if (p.heroId !== "lain") continue;
      for (const z of ZONES) for (const m of p.board[z].slice()) healMinion(state, m, 1);
      healHero(state, p, 1);
      log(state, p.name + " 的地脉回响恢复所有友方单位 1 点生命。", p, "heal");
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
    const freeCast = !!(opts && opts.freeCast);
    if (!freeCast && player.mana < cost) return { ok: false, reason: "行动槽不足", code: "mana" };
    if (def.type === "minion" && boardCount(player) >= 6) return { ok: false, reason: "随从区已满", code: "boardFull" };
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
    if (def.type === "minion" || def.type === "formation") {
      if (!zone || ZONES.indexOf(zone) < 0) {
        return { ok: false, reason: "请选择一个阵位", code: "zone", zones: def.type === "minion" ? openZones(player) : ZONES.slice() };
      }
      if (def.type === "minion" && !zoneHasSpace(player, zone)) return { ok: false, reason: "该阵位已满", code: "zoneFull" };
      if (def.type === "formation" && (player.formations || []).length >= 2) return { ok: false, reason: "阵型槽已满", code: "formationFull" };
    }
    if (def.bloodCost != null && opts.payBlood) {
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
    player.cardsPlayed++;
    player.cardsPlayedThisTurn = (player.cardsPlayedThisTurn || 0) + 1;
    if (def.overload) {
      player.overload = (player.overload || 0) + def.overload;
      log(state, player.name + " 反噬 " + def.overload + "：下回合行动槽减少。", player, "overload");
    }
    log(state, player.name + " 打出 " + def.name + "（" + cost + " 费）。", player, def.type === "spell" ? "spell" : "play", def.id);
    if (def.type === "spell") {
      player.spellsCastThisTurn = (player.spellsCastThisTurn || 0) + 1;
      player.spellsCastThisGame = (player.spellsCastThisGame || 0) + 1;
      for (const m of aliveMinions(player)) {
        if (m.passive && m.passive.type === "spellGrowth" && !m.silenced) {
          buffMinion(state, m, m.passive.attack || 0, m.passive.health || 0, "法术回响", true);
        }
        if (m.passive && m.passive.type === "spellArmor" && !m.silenced) {
          player.armor += cost;
          log(state, m.name + " 触发奥术导管，获得 " + cost + " 点护甲。", player, "armor");
        }
      }
      let theoristDone = false;
      for (const m of aliveMinions(player)) {
        if (theoristDone || !m.passive || m.passive.type !== "spellDiscoverOnce" || m.silenced) continue;
        if (player.theoristTurn === state.turnNumber) continue;
        player.theoristTurn = state.turnNumber;
        openDiscover(state, player, "spell", m.cardId);
        theoristDone = true;
      }
      if (player.relic === "frost_prism") {
        const enemies = aliveMinions(opponentOf(state, player)).filter(m => !m.stealth);
        if (enemies.length) freezeMinion(state, enemies[randomInt(state, enemies.length)]);
      }
      if (!freeCast) player.lastSpell = { cardId: def.id, targetUid: opts && opts.targetUid, zone: opts && opts.zone };
    }
    if (def.type === "minion") {
      const m = summonMinion(state, player, def.id, zone, opts && opts.taunt ? { taunt: true } : null);
      if (!m) {
        // 原子性保护：召唤失败时返还行动槽、手牌与血祭代价
        player.mana += cost;
        player.hand.push(handCard);
        if (def.bloodCost != null && opts && opts.payBlood) player.hp += def.bloodCost;
        log(state, "召唤失败，行动槽已返还。", player, "error");
        return { ok: false, reason: "召唤失败，行动槽已返还" };
      }
      if (def.excavate) addVein(state, def.excavate, "采掘");
      if (state.status === "playing") {
        resolveBattlecry(state, player, def, m, target || null, opts || {});
        processDeaths(state);
        if (m && !m.dead) {
          if (def.zoneBonus && aliveMinions(player).some(x => x.uid !== m.uid && x.zone === m.zone)) applyCardBonus(state, player, m, def.zoneBonus, "阵位");
          if (def.mirrorBonus && aliveMinions(opponentOf(state, player)).some(x => x.zone === m.zone)) applyCardBonus(state, player, m, def.mirrorBonus, "对位");
          if (def.veinBonus && state.vein >= (def.veinBonus.vein || 0)) applyCardBonus(state, player, m, def.veinBonus, "引脉");
        }
      }
    } else if (def.type === "relic") {
      player.relic = def.id;
      if (def.id === "wanderer_charm") { player.maxHp += 2; player.hp += 2; }
      if (def.id === "formation_standard") { for (const f of player.formations || []) applyFormationToZone(state, player, f.zone); }
      log(state, player.name + " 装备遗物「" + def.name + "」。", player, "relic");
    } else if (def.type === "formation") {
      player.formations = player.formations || [];
      player.formations.push({ cardId: def.id, zone: zone, turnsLeft: def.formation && def.formation.duration ? def.formation.duration : null });
      applyFormationToZone(state, player, zone);
      log(state, player.name + " 在" + ZONE_NAMES[zone] + "布置阵型「" + def.name + "」。", player, "formation");
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

  function applyCardBonus(state, player, minion, bonus, label) {
    if (!bonus || !minion || minion.dead) return;
    if (bonus.selfBuff) buffMinion(state, minion, bonus.selfBuff.attack || 0, bonus.selfBuff.health || 0, label, true);
    if (bonus.attack || bonus.health) buffMinion(state, minion, bonus.attack || 0, bonus.health || 0, label, true);
    if (bonus.armor) { player.armor += bonus.armor; log(state, player.name + " 获得 " + bonus.armor + " 点护甲（" + label + "）。", player, "armor"); }
    if (bonus.healHero) healHero(state, player, bonus.healHero);
    if (bonus.draw) drawCard(state, player, bonus.draw);
    if (bonus.discoverSpell) openDiscover(state, player, "spell", "karl_bonus");
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
    } else if (b.type === "silence") {
      if (target && !target.dead) silenceMinion(state, target);
    } else if (b.type === "silenceVeinBuff") {
      if (target && !target.dead) silenceMinion(state, target);
      if (state.vein >= (b.vein == null ? 5 : b.vein)) buffMinion(state, minion, 0, b.health || 2, "引脉", true);
    } else if (b.type === "nextCost") {
      player.nextCostReduction = (player.nextCostReduction || 0) + b.amount;
      log(state, player.name + " 本回合下一张牌行动槽消耗减少 " + b.amount + "。", player, "buff");
    } else if (b.type === "drawVein") {
      drawCard(state, player, b.amount || 1);
      if (state.vein >= b.vein) drawCard(state, player, b.bonus || 1);
    } else if (b.type === "freeze") {
      if (b.destroyFrozenAtVein != null && state.vein >= b.destroyFrozenAtVein) {
        const enemies = aliveMinions(opponentOf(state, player)).filter(m => !m.stealth);
        for (const m of enemies) m.dead = true;
        if (enemies.length) {
          log(state, "引脉 10 触发：深雪消灭所有敌方随从。", player, "vein");
          processDeaths(state);
        }
      } else if (b.allAtVein != null && state.vein >= b.allAtVein) {
        for (const m of aliveMinions(opponentOf(state, player)).filter(m => !m.stealth)) freezeMinion(state, m);
        log(state, "引脉 6 触发：深雪凝滞所有敌方随从。", player, "freeze");
      } else if (target && !target.dead) {
        freezeMinion(state, target);
      }
    } else if (b.type === "freezeZoneFormation") {
      if (target) {
        for (const m of aliveMinions(opponentOf(state, player)).filter(m => m.zone === target.zone && !m.stealth)) freezeMinion(state, m);
        log(state, "深雪凝滞了" + ZONE_NAMES[target.zone] + "的所有敌方随从。", player, "freeze");
        if ((player.formations || []).some(f => f.zone === target.zone)) {
          drawCard(state, player, b.draw || 1);
          log(state, "同阵位阵型共鸣，抽 1 张牌。", player, "draw");
        }
      }
    } else if (b.type === "freezeZone") {
      if (target && !target.dead) {
        const z = target.zone;
        for (const m of aliveMinions(opponentOf(state, player)).filter(x => x.zone === z && !x.stealth)) freezeMinion(state, m);
        log(state, "索雷尔冻结了" + ZONE_NAMES[z] + "的所有敌方单位。", player, "freeze");
      }
    } else if (b.type === "recordIfEnemyZones") {
      const enemy = opponentOf(state, player);
      const allZones = ZONES.every(z => aliveMinions(enemy).some(m => m.zone === z));
      if (allZones) {
        const c = addCardToHand(state, player, "record_shot", {});
        if (c) { c.generated = true; log(state, "三阵记录：获得 0 费「记录弹」。", player, "battlecry"); }
      }
    } else if (b.type === "copyLowestSpell") {
      const spells = player.hand.filter(c => card(c.cardId).type === "spell").sort((a, b2) => card(a.cardId).cost - card(b2.cardId).cost);
      if (!spells.length) log(state, "维尔纳没有找到可复制的法术。", player, "battlecry");
      else {
        const src = spells[0];
        const copies = card(src.cardId).cost >= 5 ? 2 : 1;
        for (let i = 0; i < copies; i++) {
          if (player.hand.length >= 8) break;
          player.hand.push({ uid: uid("c"), cardId: src.cardId, generated: true });
        }
        log(state, "维尔纳复制了「" + card(src.cardId).name + "」" + copies + " 张。", player, "battlecry");
      }
    } else if (b.type === "freezeCombo") {
      if (state.vein >= (b.destroyAtVein || 10)) {
        const frozen = aliveMinions(opponentOf(state, player)).filter(m => m.frozenTurns > 0 && !m.stealth);
        for (const m of frozen) m.dead = true;
        log(state, "引脉 10 触发：教授消灭所有已被凝滞的敌方随从。", player, "freeze");
        processDeaths(state);
      } else if (state.vein >= (b.allAtVein || 6)) {
        for (const m of aliveMinions(opponentOf(state, player)).filter(m => !m.stealth)) freezeMinion(state, m);
        log(state, "引脉 6 触发：教授凝滞所有敌方随从。", player, "freeze");
      } else if (target && !target.dead) {
        freezeMinion(state, target);
      }
    } else if (b.type === "damagePerArmorRandom") {
      const hits = Math.max(0, player.armor);
      let done = 0;
      for (let i = 0; i < hits; i++) {
        const enemies = aliveMinions(opponentOf(state, player)).filter(m => !m.stealth);
        if (!enemies.length) break;
        damageMinion(state, enemies[randomInt(state, enemies.length)], b.amount || 1, null, "瓦尔特");
        done++;
      }
      if (done) { log(state, "瓦尔特按护甲发动 " + done + " 次随机炮击。", player, "battlecry"); processDeaths(state); }
    } else if (b.type === "buffPerAllMinions") {
      const count = state.players.reduce((n, p) => n + aliveMinions(p).length, 0);
      buffMinion(state, minion, count * (b.attack || 1), count * (b.health || 1), "阅兵", true);
      log(state, "克劳斯清点全场 " + count + " 个随从，获得 +" + count + "/+" + count + "。", player, "battlecry");
    } else if (b.type === "formationPayoff") {
      if ((player.formations || []).length) {
        buffMinion(state, minion, 1, 1, "阵线共鸣", true);
        drawCard(state, player, 1);
        log(state, "阵线共鸣：获得 +1/+1 并抽 1 张牌。", player, "buff");
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
      log(state, player.name + " 本回合获得 " + (b.amount || 1) + " 行动槽。", player, "mana");
      if (b.vein) addVein(state, b.vein, minion.name);
    } else if (b.type === "discountSpell") {
      player.spellCostReduction = (player.spellCostReduction || 0) + (b.amount || 1);
      log(state, "本回合下一张法术行动槽消耗 -" + (b.amount || 1) + "。", player, "discount");
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
      for (const m of aliveMinions(opponentOf(state, player)).filter(x => !x.stealth)) freezeMinion(state, m);
      log(state, "登场：霜潮利维坦凝滞了所有敌方随从。", player, "freeze");
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
      addVein(state, b.amount || 1, "登场");
      if (state.vein >= (b.vein == null ? 8 : b.vein)) drawCard(state, player, b.draw || 1);
    } else if (b.type === "damageAllEnemies") {
      for (const m of aliveMinions(opponentOf(state, player))) damageMinion(state, m, b.amount || 2, minion, "登场");
      log(state, "登场：" + minion.name + " 对所有敌方随从造成 " + (b.amount || 2) + " 点伤害。", player, "battlecry");
    } else if (b.type === "destroy") {
      if (target && !target.dead) {
        target.dead = true;
        log(state, "登场：" + minion.name + " 消灭了 " + target.name + "。", player, "battlecry");
      }
    } else if (b.type === "veinSelfBuff") {
      if (state.vein >= (b.vein == null ? 4 : b.vein)) {
        buffMinion(state, minion, b.attack || 0, 0, "引脉", true);
        log(state, "引脉触发：" + minion.name + " 获得 +" + (b.attack || 0) + " 攻击。", player, "vein");
      }
    } else if (b.type === "veinBuff") {
      addVein(state, b.amount || 2, "流脉巨兽");
      if (state.vein >= (b.vein == null ? 7 : b.vein)) {
        buffMinion(state, minion, b.attack || 2, b.health || 2, "登场", true);
        grantTaunt(state, minion);
        log(state, "引脉触发：流脉巨兽获得 +" + (b.attack || 2) + "/+" + (b.health || 2) + " 和拦截。", player, "vein");
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
    } else if (s.type === "drawCopyNextSpell") {
      player.copyNextSpell = (player.copyNextSpell || 0) + 1;
      drawCard(state, player, s.draw || 1);
    } else if (s.type === "draw") {
      drawCard(state, player, s.amount || 1);
    } else if (s.type === "bloodDraw") {
      if (!target || target.dead) return;
      damageMinion(state, target, s.damage || 2, { owner: player.index }, "血祭仪式");
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
      log(state, target.name + " 获得突进。", player, "charge");
    } else if (s.type === "gainMana") {
      player.mana = Math.min(10, player.mana + (s.amount || 1));
      log(state, player.name + " 获得 " + (s.amount || 1) + " 点行动槽。", player, "mana");
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
      log(state, "获得 " + (s.mana || 1) + " 行动槽，下回合开始再获得 " + (s.next || 1) + " 点。", player, "buff");
    } else if (s.type === "borrowVein") {
      player.mana += s.mana || 2;
      player.veinDebt = (player.veinDebt || 0) + (s.debt || 2);
      log(state, player.name + " 借脉：获得 " + (s.mana || 2) + " 行动槽，回合结束偿还 " + (s.debt || 2) + " 流脉。", player, "vein");
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
      log(state, "你的随从本回合不能被凝滞。", player, "freeze");
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
    } else if (s.type === "damageAllEnemiesPerGameSpell") {
      const count = player.spellsCastThisGame || 0;
      const dmg = count * (s.amount || 2);
      for (const m of aliveMinions(opponentOf(state, player)).filter(m => !m.stealth)) damageMinion(state, m, dmg, null, "法术风暴");
      log(state, "法术风暴：本局第 " + count + " 张法术，对敌方所有随从造成 " + dmg + " 点伤害。", player, "spell");
      processDeaths(state);
    } else if (s.type === "damageAllEnemies") {
      for (const m of aliveMinions(opponentOf(state, player)).filter(m => !m.stealth)) damageMinion(state, m, s.amount || 2, null, "阵位齐射");
      processDeaths(state);
    } else if (s.type === "armorPerEnemy") {
      const count = aliveMinions(opponentOf(state, player)).length;
      player.armor += count * (s.amount || 3);
      log(state, "每有一个敌方单位获得 " + (s.amount || 3) + " 点护甲，共 " + (count * (s.amount || 3)) + " 点。", player, "armor");
    } else if (s.type === "armorToDamage") {
      const used = Math.min(player.armor, s.max || 5);
      player.armor -= used;
      damageHero(state, opponentOf(state, player), used, null, "装甲炮击");
      log(state, "消耗 " + used + " 点护甲，对敌方领袖造成 " + used + " 点伤害。", player, "damage");
    } else if (s.type === "destroy") {
      if (target && !target.dead) target.dead = true;
    } else if (s.type === "damage") {
      if (target && !target.dead) damageMinion(state, target, s.amount || 1, null, "法术");
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
      log(state, "终末钟声：对所有随从造成 " + (s.amount || 5) + " 点伤害。", player, "spell");
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
    } else if (s.type === "comboDamage") {
      if (target && !target.dead) {
        const combo = (player.cardsPlayedThisTurn || 0) > 1;
        damageMinion(state, target, combo ? (s.amount || 3) : (s.otherwise || 1), null, combo ? "顺势" : "法术");
        log(state, combo ? "顺势触发：伤害提高。" : "未触发顺势。", player, "combo");
      }
    } else if (s.type === "rampSpell") {
      player.mana += s.amount || 2;
      log(state, player.name + " 本回合获得 " + (s.amount || 2) + " 行动槽。", player, "mana");
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
      log(state, "奥术涌流：第 " + count + " 张法术，对所有敌方随从造成 " + dmg + " 点伤害。", player, "spell");
    } else if (s.type === "damagePerSpell") {
      const count = Math.max(1, player.spellsCastThisTurn || 1);
      const dmg = count * (s.amount || 2);
      damageHero(state, opponentOf(state, player), dmg, null, "法术风暴", true);
      log(state, "法术风暴：本回合第 " + count + " 张法术，对敌方领袖造成 " + dmg + " 点伤害。", player, "spell");
    }
  }

  function freezeMinion(state, m) {
    if (!m || m.dead) return;
    if (ownerOf(state, m).freezeImmuneTurn) { log(state, m.name + " 受到地脉护佑，抵消了凝滞。", ownerOf(state, m), "freeze"); return; }
    m.frozenTurns = Math.max(m.frozenTurns || 0, 1);
    state.events.push({ structured: true, kind: "freeze", targetUid: m.uid, player: ownerOf(state, m).index });
    log(state, m.name + " 被凝滞。", ownerOf(state, m), "freeze");
  }

  function grantTaunt(state, m) {
    if (!m || m.dead) return;
    const wasTaunt = m.taunt;
    m.taunt = true;
    if (!m.keywords.includes("taunt")) m.keywords.push("taunt");
    const owner = ownerOf(state, m);
    if (!wasTaunt && owner.heroId === "wolfram" && !m.silenced) buffMinion(state, m, 0, 1, "铁壁纪律", true);
    log(state, m.name + " 获得拦截。", owner, "taunt");
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
    const choice = { type: "discover", player: player.index, options: options, source: sourceCardId };
    if (state.pendingChoice) {
      state.discoverQueue = state.discoverQueue || [];
      state.discoverQueue.push(choice);
      log(state, player.name + " 触发额外检索，加入待选队列。", player, "discover");
      return;
    }
    state.pendingChoice = choice;
    log(state, player.name + " 触发检索，等待选择。", player, "discover");
  }

  function resolveDiscover(state, playerIndex, cardId) {
    if (!state.pendingChoice || state.pendingChoice.type !== "discover") return { ok: false, reason: "没有待处理的检索" };
    if (state.pendingChoice.player !== playerIndex) return { ok: false, reason: "不是你的选择" };
    if (state.pendingChoice.options.indexOf(cardId) < 0) return { ok: false, reason: "不在检索选项中" };
    addCardToHand(state, state.players[playerIndex], cardId, {});
    if (state.discoverQueue && state.discoverQueue.length) state.pendingChoice = state.discoverQueue.shift();
    else state.pendingChoice = null;
    return { ok: true };
  }

  function getAttackOptions(state, playerIndex, attackerUid) {
    const player = state.players[playerIndex];
    const m = player ? allMinions(player).find(x => x.uid === attackerUid) : null;
    if (!m || m.dead || m.attacksLeft <= 0 || m.frozenTurns > 0) return { ok: false, targets: [] };
    const enemy = opponentOf(state, player);
    const taunts = aliveMinions(enemy).filter(x => x.taunt && !x.stealth);
    let targets = [];
    if (m.ignoreTaunt) {
      targets = aliveMinions(enemy).filter(x => !x.stealth).map(x => x.uid);
      targets.push("hero");
    } else if (taunts.length) {
      targets = taunts.map(x => x.uid);
    } else {
      targets = aliveMinions(enemy).filter(x => !x.stealth).map(x => x.uid);
      if (!m.rush) targets.push("hero");
    }
    return { ok: true, targets: targets };
  }

  function attack(state, playerIndex, attackerUid, targetUid) {
    if (state.status !== "playing") return { ok: false, reason: "对局已结束" };
    if (state.current !== playerIndex) return { ok: false, reason: "还没轮到你" };
    const player = state.players[playerIndex];
    const attacker = allMinions(player).find(m => m.uid === attackerUid);
    if (!attacker) return { ok: false, reason: "找不到攻击者" };
    if (attacker.attacksLeft <= 0) return { ok: false, reason: "该随从本回合已经攻击过" };
    if (attacker.frozenTurns > 0) return { ok: false, reason: "该随从被凝滞" };
    const opts = getAttackOptions(state, playerIndex, attackerUid);
    const legalTarget = targetUid === "hero" ? opts.targets.indexOf("hero") >= 0 : opts.targets.indexOf(targetUid) >= 0;
    if (!opts.ok || !legalTarget) {
      return { ok: false, reason: "不能攻击该目标（可能有拦截）", targets: opts.targets };
    }
    const enemy = opponentOf(state, player);
    attacker.attacksLeft -= 1;
    attacker.hasAttacked = true;
    attacker.stealth = false;
    if (targetUid === "hero") {
      log(state, attacker.name + " 攻击 " + enemy.name + " 的领袖。", player, "attack");
      damageHero(state, enemy, attacker.attack, attacker, "随从攻击");
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

  function transformHandCard(state, player, handCard) {
    const oldDef = card(handCard.cardId);
    const candidates = Object.keys(D.CARDS).filter(id => {
      const d = D.CARDS[id];
      return d && !d.token && !d.disabled && d.cost === oldDef.cost && id !== oldDef.id && d.type !== "relic";
    });
    if (!candidates.length) return false;
    const nextId = candidates[Math.floor(Math.random() * candidates.length)];
    handCard.cardId = nextId;
    handCard.generated = true;
    log(state, player.name + " 将手牌中的「" + oldDef.name + "」改写为「" + D.CARDS[nextId].name + "」。", player, "handChange");
    return true;
  }

  function useHeroPower(state, playerIndex, targetUid) {
    if (state.status !== "playing") return { ok: false, reason: "对局已结束" };
    if (state.mulliganPhase) return { ok: false, reason: "请先完成起手调度" };
    if (state.current !== playerIndex) return { ok: false, reason: "还没轮到你" };
    const player = state.players[playerIndex];
    if (player.heroPowerUsed) return { ok: false, reason: "领袖技能本回合已用过" };
    if (player.mana < 2) return { ok: false, reason: "行动槽不足" };
    const handTarget = player.heroId === "wolfram";
    const leaderOnly = player.heroId === "marta";
    let targets = [];
    let targetIds = [];
    if (handTarget) {
      targetIds = player.hand.map(c => c.uid);
      if (!targetIds.length) return { ok: false, reason: "没有可以改写的手牌" };
      if (!targetUid || targetIds.indexOf(targetUid) < 0) return { ok: false, reason: "请选择一张手牌", code: "target", targets: targetIds };
    } else {
      const heroTargetType = (player.heroId === "otto" || player.heroId === "marta") ? "enemy" : "friendly";
      targets = heroTargetType === "enemy"
        ? aliveMinions(opponentOf(state, player)).filter(m => !m.stealth)
        : aliveMinions(player);
      targetIds = targets.map(m => m.uid);
      if (player.heroId === "otto") targetIds.unshift("hero");
      if (leaderOnly) targetIds = ["hero"];
      if (!targetIds.length) return { ok: false, reason: heroTargetType === "enemy" ? "没有敌方目标" : "没有友方随从可作为目标" };
    }
    if (leaderOnly && targetUid !== "hero") return { ok: false, reason: "玛尔塔的技能只能指向敌方领袖" };
    let target = null;
    if (handTarget) target = player.hand.find(c => c.uid === targetUid);
    else if (targetUid === "hero" && (player.heroId === "otto" || player.heroId === "marta")) target = "hero";
    else if (targetUid) target = targets.find(m => m.uid === targetUid);
    if (!target) return { ok: false, reason: handTarget ? "请选择一张手牌" : (player.heroId === "otto" || player.heroId === "marta" ? "请选择一个敌方随从或领袖" : "请选择一个友方随从"), code: "target", targets: targetIds };
    player.mana -= (player.hero.power.cost || 2);
    player.heroPowerUsed = true;
    log(state, player.name + " 使用领袖技能「" + player.hero.power.name + "」。", player, "heroPower");
    if (handTarget) {
      transformHandCard(state, player, target);
    } else if (player.heroId === "lain") {
      const zoneMates = player.board[target.zone].filter(m => m.uid !== target.uid && !m.dead);
      const hasMate = zoneMates.length > 0;
      buffMinion(state, target, hasMate ? 1 : 0, 1, "协调", true);
    } else if (player.heroId === "karna") {
      damageMinion(state, target, 1, { owner: player.index }, "血祭");
      if (target.health <= 0) target.dead = true;
      processDeaths(state);
      if (target.dead) drawCard(state, player, 1);
    } else if (player.heroId === "marta") {
      damageHero(state, opponentOf(state, player), 2, null, "演算");
      processDeaths(state);
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
    player.maxMana = Math.min(10, player.maxMana + 1);
    player.heroPowerUsed = false;
    player.freezeImmuneTurn = false;
    player.healBlockTurn = false;
    player.spellsCastThisTurn = 0;
    player.cardsPlayedThisTurn = 0;
    player.spellCostReduction = 0;
    player.nextCostReduction = 0;
    player.mana = Math.max(0, player.maxMana - (player.overload || 0)) + (player.nextTurnManaBonus || 0);
    player.nextTurnManaBonus = 0;
    player.overload = 0;
    if (player.heroId === "marta") player.spellCostReduction = 2;
            if (player.relic === "armor_forge") { player.armor += 1; log(state, player.name + " 的帝国锻炉提供 1 点护甲。", player, "armor"); }
        if (player.heroId === "otto") { player.ottoTurnCounter = (player.ottoTurnCounter || 0) + 1; if (player.ottoTurnCounter % 2 === 0) { player.armor += 1; log(state, player.name + " 的军工产线提供 1 点护甲。", player, "armor"); } }
            if (player.relic === "spell_codex" && !(player.heroId === "marta")) player.spellCostReduction = 2;
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
      m.attacksLeft = m.windfury && !m.silenced ? 2 : 1;
      m.hasAttacked = false;
      m.ignoreTaunt = false;
      m.justPlayed = false;
    }
    if (player.relic === "blood_censer") {
      const first = allMinions(player).find(m => !m.dead);
      if (first) {
        damageMinion(state, first, 1, { owner: player.index }, "血香炉");
        if (!first.dead) drawCard(state, player, 1);
        processDeaths(state);
      }
    }
    log(state, "—— " + player.name + " 的回合开始（第 " + state.round + " 轮，行动槽 " + player.mana + "/" + player.maxMana + "）——", player, "turn");
    drawCard(state, player, 1);
    checkGameOver(state);
  }

  function repeatLastSpell(state, player) {
    const speaker = aliveMinions(player).find(m => m.passive && m.passive.type === "repeatLastSpell" && !m.silenced);
    const last = player.lastSpell;
    if (!speaker || !last || state.status !== "playing") return;
    const def = card(last.cardId);
    if (!def || def.type !== "spell") return;
    if (player.hand.length >= 8) { log(state, player.name + " 手牌已满，卡西安无法复诵。", player, "error"); return; }
    const temp = { uid: uid("c"), cardId: last.cardId, generated: true };
    player.hand.push(temp);
    log(state, speaker.name + " 复诵「" + def.name + "」。", player, "spell");
    const res = playCard(state, player.index, temp.uid, { targetUid: last.targetUid, zone: last.zone, freeCast: true });
    player.hand = player.hand.filter(c => c.uid !== temp.uid);
    if (!res.ok) log(state, "复诵失败：" + (res.reason || "目标已失效"), player, "error");
  }

  function endTurn(state, playerIndex) {
    if (state.status !== "playing") return { ok: false, reason: "对局已结束" };
    if (state.mulliganPhase) return { ok: false, reason: "请先完成起手调度" };
    if (state.current !== playerIndex) return { ok: false, reason: "还没轮到你" };
    if (state.pendingChoice) return { ok: false, reason: "请先完成当前选择" };
    const player = state.players[playerIndex];
    player.nextCostReduction = 0;
    // 凝滞解冻：控制者的回合结束时递减
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
    return { ok: true };
  }

  function getPlayOptions(state, playerIndex, cardUid) {
    const player = state.players[playerIndex];
    const c = player.hand.find(x => x.uid === cardUid);
    if (!c) return { ok: false, reason: "没有这张手牌" };
    const def = card(c.cardId);
    const targetType = getTargetType(state, def);
    const targets = getValidTargets(state, player, targetType);
    const zoneType = def.type === "minion" || def.type === "formation";
    const zones = def.type === "minion" ? openZones(player) : def.type === "formation" ? ZONES.slice() : [];
    const cost = getCardCost(state, player, c);
    const canMana = player.mana >= cost;
    const canBoard = def.type === "minion" ? boardCount(player) < 6 : def.type === "formation" ? (player.formations || []).length < 2 : true;
    const canTarget = !targetType || targets.length > 0 || targetType === "friendly" || !!def.optionalTarget || (def.id === "miyuki" && state.vein >= 6);
    const canZone = !zoneType || zones.length > 0;
    const formReason = def.type === "formation" && !canBoard ? "阵型槽已满" : "";
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
      reason: !canMana ? "行动槽不足" : !canBoard ? (formReason || "随从区已满") : !canTarget ? "没有合法目标" : null
    };
  }

  function getHeroPowerOptions(state, playerIndex) {
    const player = state.players[playerIndex];
    if (!player) return { ok: false, targets: [] };
    const handTarget = player.heroId === "wolfram";
    const leaderOnly = player.heroId === "marta";
    const targetType = handTarget ? "hand" : ((player.heroId === "otto" || player.heroId === "marta") ? "enemy" : "friendly");
    const targets = targetType === "enemy"
      ? aliveMinions(opponentOf(state, player)).filter(m => !m.stealth)
      : (targetType === "friendly" ? aliveMinions(player) : []);
    const targetIds = handTarget ? player.hand.map(c => c.uid) : targets.map(m => m.uid);
    if (player.heroId === "otto") targetIds.unshift("hero");
    if (leaderOnly) targetIds = ["hero"];
    return {
      ok: !player.heroPowerUsed && player.mana >= 2 && targetIds.length > 0,
      targets: targetIds,
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
      aiDifficulty: config.aiDifficulty || "normal",
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
    const mainDeck = (f) => (D.DECKS[f] || []).filter(id => D.CARDS[id] && D.CARDS[id].type !== "relic");
    state.players[0].deck = buildDeck(state, faction1, config.p1Deck || mainDeck(faction1));
    state.players[1].deck = buildDeck(state, faction2, config.p2Deck || mainDeck(faction2));
    const firstRelic = (f) => (D.DECKS[f] || []).find(id => D.CARDS[id] && D.CARDS[id].type === "relic");
    state.players[0].relic = config.p1Relic || firstRelic(faction1) || null;
    state.players[1].relic = config.p2Relic || firstRelic(faction2) || null;
    for (const p of state.players) {
      if (p.relic === "wanderer_charm") { p.maxHp += 2; p.hp += 2; }
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
    findMinion: findMinion
  };
});
