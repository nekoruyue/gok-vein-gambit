/* 《戈克世界：流脉牌局》测试版 AI v0.1
 * 只用公开信息 + 自己的手牌；不偷看对手手牌/牌库顶。
 */
(function (root, factory) {
  if (typeof module !== "undefined" && module.exports) module.exports = factory(require("./data.js"), require("./engine.js"));
  else root.GokAI = factory(root.GokData, root.GokEngine);
})(typeof globalThis !== "undefined" ? globalThis : this, function (D, E) {
  "use strict";

  function minionValue(m) {
    if (!m || m.dead) return 0;
    return m.attack * 2 + m.health + (m.taunt ? 1 : 0) + (m.stealth ? 1 : 0);
  }
  function enemyOf(state, p) { return state.players[1 - p.index]; }
  function ownMinions(p) { return E.allMinions(p).filter(m => !m.dead); }
  function enemyMinions(state, p) { return E.allMinions(enemyOf(state, p)).filter(m => !m.dead); }
  function totalAttack(p) {
    return ownMinions(p).filter(m => m.attacksLeft > 0 && m.frozenTurns <= 0).reduce((s, m) => s + m.attack, 0);
  }
  function enemyTaunts(state, p) {
    return enemyMinions(state, p).filter(m => m.taunt && !m.stealth);
  }
  function lethalAvailable(state, p) {
    if (enemyTaunts(state, p).length) return false;
    const e = enemyOf(state, p);
    const facePower = (p.heroId === "otto" || p.heroId === "marta") && !p.heroPowerUsed && p.mana >= 2 ? 2 : 0;
    return totalAttack(p) + facePower >= e.hp + e.armor;
  }

  function damagedAllies(p) {
    return ownMinions(p).filter(m => m.health < m.maxHealth);
  }

  function chooseFriendlyTarget(state, p, def) {
    const allies = ownMinions(p);
    if (!allies.length) return null;
    const b = def.battlecry || def.spell || {};
    if (b.type === "healDraw" || b.type === "heal" || b.type === "healDraw") {
      const hurt = damagedAllies(p);
      if (hurt.length) return hurt.sort((a, b2) => (a.health - a.maxHealth) - (b2.health - b2.maxHealth))[0];
      return allies.sort((a, b2) => b2.health - a.health)[0];
    }
    if (b.type === "bloodDraw") {
      return allies.slice().sort((a, b2) => a.health - b2.health)[0];
    }
    if (b.type === "buffHeal" || b.type === "buffTaunt" || b.type === "stealth" || b.type === "buffCharge") {
      // 优先攻击力高、或者同阵位有队友的
      return allies.slice().sort((a, b2) => {
        const az = p.board[a.zone].length > 1 ? 1 : 0;
        const bz = p.board[b2.zone].length > 1 ? 1 : 0;
        return (b2.attack + bz * 2) - (a.attack + az * 2) || minionValue(b2) - minionValue(a);
      })[0];
    }
    return allies[0];
  }

  function chooseEnemyTarget(state, p, def) {
    const enemies = enemyMinions(state, p).filter(m => !m.stealth);
    if (!enemies.length) return null;
    const b = def.battlecry || def.spell || {};
    if (b.type === "damage") {
      const killable = enemies.filter(m => m.health <= (b.amount || 1));
      if (killable.length) return killable.sort((a, b2) => minionValue(b2) - minionValue(a))[0];
      return enemies.sort((a, b2) => minionValue(b2) - minionValue(a))[0];
    }
    if (b.type === "silence") {
      return enemies.slice().sort((a, b2) => {
        const ak = a.taunt || a.keywords.length ? 2 : 0;
        const bk = b2.taunt || b2.keywords.length ? 2 : 0;
        return (bk + minionValue(b2) / 10) - (ak + minionValue(a) / 10);
      })[0];
    }
    // 冻结：高攻击优先
    if (b.type === "freezeZone" || b.type === "damageZone") {
      const zoneCount = (z) => enemyMinions(state, p).filter(m => m.zone === z && !m.stealth).length;
      return enemies.slice().sort((a, b2) => {
        const az = zoneCount(a.zone), bz = zoneCount(b2.zone);
        return bz - az || minionValue(b2) - minionValue(a);
      })[0];
    }
    return enemies.slice().sort((a, b2) => minionValue(b2) - minionValue(a))[0];
  }

  function chooseTarget(state, p, def, opt) {
    if (!opt.targetType) return null;
    if (def.id === "miyuki" && state.vein >= 6) return null;
    if (opt.targetType === "friendly") return chooseFriendlyTarget(state, p, def);
    if (opt.targetType === "enemy") return chooseEnemyTarget(state, p, def);
    return null;
  }

  function chooseZone(state, p, def, opt) {
    if (def.type !== "minion" && def.type !== "formation") return null;
    const zones = opt.zones || [];
    if (!zones.length) return null;
    // 普卫岛优先和已有随从的阵位同列，触发协同；其他阵营优先空列，减少被 AOE 一锅端
    const score = (z) => {
      const n = p.board[z].length;
      if (p.faction === "pus") return (n === 1 ? 10 : 0) + (z === "center" ? 1 : 0);
      return (n === 0 ? 3 : 0) + (z === "center" ? 1 : 0);
    };
    return zones.slice().sort((a, b) => score(b) - score(a))[0];
  }

  function shouldPayBlood(state, p, def) {
    if (!def.bloodCost) return false;
    if (p.hp <= def.bloodCost + 2) return false;
    if (def.id === "tiega") return p.hp > 8;
    return p.hp > 10;
  }

  function effectScore(state, p, def, target, zone) {
    const b = def.battlecry || def.spell || {};
    let s = 0;
    switch (b.type) {
      case "heal": s += target ? Math.min(b.amount, target.maxHealth - target.health) * 0.8 : 0; break;
      case "healDraw":
        s += target ? Math.min(b.amount, target.maxHealth - target.health) * 0.8 : 0;
        if (target && target.health < target.maxHealth) s += 2;
        break;
      case "silence": s += target ? 4 + (target.taunt ? 2 : 0) : 0; break;
      case "nextCost": s += 2.5; break;
      case "drawVein": s += 2.5 + (state.vein >= b.vein ? b.bonus * 1.5 : 0); break;
      case "freeze":
        if (state.vein >= (b.allAtVein || 99)) s += 8 + enemyMinions(state, p).length * 1.5;
        else s += target ? 3 + target.attack * 0.7 : 0;
        break;
      case "bloodAttack": s += 3; break;
      case "summonTwo": s += 5; break;
      case "drawDamageAlly": s += 2.5; break;
      case "buffTaunt": s += 2 + (b.attack || 0) + (b.health || 0) + (state.vein >= b.vein ? 2 : 0); break;
      case "summon": s += 3; break;
      case "stealth": s += 3; break;
      case "bloodBuff": s += 2.5; break;
      case "damage":
        s += target ? (b.amount || 1) + (target.health <= (b.amount || 1) ? 3 : 0) : 0;
        break;
      case "discover": s += 3; break;
      case "armor": s += (b.amount || 0) * 0.4; break;
      case "draw": s += (b.amount || 0) * 1.5; break;
      case "buffHeal": s += 2 + (b.attack || 0) + (b.health || 0); break;
      case "bloodDraw": s += 3; break;
      case "summonMonster": s += 4; break;
      case "buffCharge": s += 3 + (b.attack || 0); break;
      case "gainMana": s += 2; break;
      case "channelVein": s += 2 + Math.abs(b.amount || 2) * 0.5; break;
      case "freezeDraw": s += (target ? 3 + target.attack * 0.7 : 2) + 2; break;
      case "freezeAll": s += 6 + enemyMinions(state, p).length * 1.5; break;
      case "stripArmorDraw": s += 1 + Math.min(4, enemyOf(state, p).armor) * 0.8 + 1.5; break;
      case "ignoreTauntBuff": s += 3.5 + (b.attack || 0); break;
      case "armorConditionalRush": s += 2.5 + (b.armor || 4) * 0.35; break;
      case "antiFreezeHeal": s += 2.5 + (b.heal || 2) * 0.5; break;
      case "damageHealBlock": s += 2.5 + (b.amount || 1); break;
      case "damageAllEnemies": {
        const enemies = enemyMinions(state, p);
        s += enemies.reduce((n, m) => n + Math.min(b.amount || 1, m.health), 0) * 0.9;
        break;
      }
      case "damageAllEnemiesDraw": {
        const enemies = enemyMinions(state, p);
        s += enemies.reduce((n, m) => n + Math.min(b.amount || 1, m.health), 0) * 0.8;
        break;
      }
      case "damageAllEnemiesPerGameSpell": {
        const total = p.spellsCastThisGame || 0;
        s += total * 2 + enemyMinions(state, p).length * 0.6;
        if (total < 3) s -= 12;
        break;
      }
      case "damageZone": s += 3 + (target ? 2 : 0); break;
      case "freezeZone": s += 5 + (target ? 1 : 0); break;
      case "copyLowestSpell": {
        const spells = p.hand.filter(c => D.CARDS[c.cardId] && D.CARDS[c.cardId].type === "spell");
        s += spells.length ? 4 + spells.length * 0.5 : 0;
        break;
      }
      case "recordIfEnemyZones": {
        let zones = 0;
        const enemy = enemyOf(state, p);
        for (const z of E.ZONES) if (enemy.board[z].length) zones++;
        if (zones === 3) s += 3;
        break;
      }
      case "drawCopyNextSpell": s += 4; break;
    }
    if (def.type === "minion") s += def.attack * 0.7 + def.health * 0.5;
    if (def.excavate) s -= 1.5;
    if (def.bloodCost) s += 1;
    if (target && target.health <= 0) s -= 100;
    return s;
  }

  function choosePlay(state, p) {
    let best = null;
    for (const c of p.hand) {
      const def = D.CARDS[c.cardId];
      const opt = E.getPlayOptions(state, p.index, c.uid);
      if (!opt.ok) continue;
      const target = chooseTarget(state, p, def, opt);
      if (opt.targetType && !target) continue;
      const zone = chooseZone(state, p, def, opt);
      if ((def.type === "minion" || def.type === "formation") && !zone) continue;
      const payBlood = shouldPayBlood(state, p, def);
      const score = effectScore(state, p, def, target, zone) - (def.cost || 0) * 0.1 + 2.5;
      if (score <= 1.5) continue;
      if (!best || score > best.score) {
        best = {
          type: "play",
          cardUid: c.uid,
          opts: { targetUid: target ? target.uid : null, zone: zone, payBlood: payBlood },
          score: score
        };
      }
    }
    return best;
  }

  function chooseAttack(state, p) {
    const enemy = enemyOf(state, p);
    const taunts = enemyTaunts(state, p);
    const lethal = lethalAvailable(state, p);
    let best = null;
    const attackers = ownMinions(p).filter(m => m.attacksLeft > 0 && m.frozenTurns <= 0 && m.attack > 0);
    for (const a of attackers) {
      const o = E.getAttackOptions(state, p.index, a.uid);
      if (!o.ok) continue;
      for (const t of o.targets) {
        let score = 0;
        if (t === "hero") {
          score = a.attack + (lethal ? 100 : 0) + (enemy.hp <= a.attack ? 50 : 0);
        } else {
          const d = E.findMinion(state, t);
          if (!d) continue;
          const targetDies = a.attack >= d.health;
          const attackerDies = d.attack >= a.health;
          score = (targetDies ? minionValue(d) : 0) + a.attack * 0.6 + d.attack * 0.2;
          if (attackerDies) score -= minionValue(a) + 2;
          if (d.taunt) score += 2;
          if (taunts.length) score += 1;
        }
        if (!best || score > best.score) best = { type: "attack", attackerUid: a.uid, targetUid: t, score: score };
      }
    }
    if (!best) return null;
    if (best.targetUid === "hero" && best.score < 1 && !lethal) return null;
    if (best.targetUid !== "hero" && best.score < 0) return null;
    return best;
  }

  function chooseHeroPower(state, p) {
    const o = E.getHeroPowerOptions(state, p.index);
    if (!o.ok || !o.targets.length) return null;
    const allies = ownMinions(p);
    if (p.heroId === "otto") {
      const enemies = enemyMinions(state, p).filter(m => !m.stealth);
      const canFace = o.targets.indexOf("hero") >= 0;
      if (!enemies.length) return canFace ? { type: "heroPower", targetUid: "hero", score: 3.4 } : null;
      const target = enemies.slice().sort((a, b) => (a.health <= 1 ? 0 : 1) - (b.health <= 1 ? 0 : 1) || minionValue(b) - minionValue(a))[0];
      if (canFace && (enemyOf(state, p).hp <= 1 || target.health > 3)) return { type: "heroPower", targetUid: "hero", score: 3.3 };
      return { type: "heroPower", targetUid: target.uid, score: 3.8 };
    }
    if (p.heroId === "lain") {
      const target = allies.slice().sort((a, b) => (b.attack + b.health) - (a.attack + a.health))[0];
      return { type: "heroPower", targetUid: target.uid, score: 4 };
    }
    if (p.heroId === "karna") {
      if (p.hp <= 8) return null;
      const target = allies.slice().sort((a, b) => a.health - b.health)[0];
      return { type: "heroPower", targetUid: target.uid, score: 3 };
    }
    if (p.heroId === "marta") {
      const enemies = enemyMinions(state, p).filter(m => !m.stealth);
      const canFace = o.targets.indexOf("hero") >= 0;
      if (!enemies.length) return canFace ? { type: "heroPower", targetUid: "hero", score: 3.4 } : null;
      const killable = enemies.filter(m => m.health <= 2);
      if (killable.length) {
        const target = killable.sort((a, b) => minionValue(b) - minionValue(a))[0];
        return { type: "heroPower", targetUid: target.uid, score: 4.2 };
      }
      const target = enemies.slice().sort((a, b) => minionValue(b) - minionValue(a))[0];
      if (canFace && target.health > 4) return { type: "heroPower", targetUid: "hero", score: 3.6 };
      return { type: "heroPower", targetUid: target.uid, score: 3.6 };
    }
    if (p.heroId === "wolfram") {
      const card = p.hand.slice().sort((a, b) => (D.CARDS[a.cardId].cost || 0) - (D.CARDS[b.cardId].cost || 0))[0];
      return card ? { type: "heroPower", targetUid: card.uid, score: 2.4 } : null;
    }
    return null;
  }

  function chooseDiscover(state) {
    const pc = state.pendingChoice;
    if (!pc || pc.type !== "discover") return null;
    const scored = pc.options.map(id => {
      const d = D.CARDS[id];
      let s = (d.cost || 0) * 1.5 + (d.attack || 0) + (d.health || 0) * 0.8;
      if (d.type === "spell") s += 2;
      if (d.keywords && d.keywords.indexOf("charge") >= 0) s += 1;
      return { id: id, score: s };
    }).sort((a, b) => b.score - a.score);
    return { type: "discover", cardId: scored[0].id, score: 99 };
  }

  function chooseAction(state, playerIndex) {
    if (state.status !== "playing") return { type: "end", reason: "gameover" };
    if (state.aiDifficulty === "easy" && Math.random() < 0.22) return { type: "end", reason: "easy" };
    if (state.pendingChoice) {
      if (state.pendingChoice.type === "discover") return chooseDiscover(state);
      return { type: "end" };
    }
    const p = state.players[playerIndex];
    if (!p || state.current !== playerIndex) return { type: "end" };
    if (lethalAvailable(state, p)) {
      const atk = chooseAttack(state, p);
      if (atk && atk.targetUid === "hero") return atk;
    }
    const play = choosePlay(state, p);
    const playThreshold = state.aiDifficulty === "nightmare" ? 1.8 : state.aiDifficulty === "hard" ? 2.1 : 2.5;
    if (play && play.score >= playThreshold) return play;
    const hp = chooseHeroPower(state, p);
    if (hp) return hp;
    const atk = chooseAttack(state, p);
    if (atk) return atk;
    if (play) return play;
    return { type: "end" };
  }

  function takeAction(state, playerIndex) {
    const action = chooseAction(state, playerIndex);
    if (!action || action.type === "end") {
      const result = E.endTurn(state, playerIndex);
      return { action: { type: "end" }, result: result };
    }
    let result;
    if (action.type === "play") result = E.playCard(state, playerIndex, action.cardUid, action.opts);
    else if (action.type === "attack") result = E.attack(state, playerIndex, action.attackerUid, action.targetUid);
    else if (action.type === "heroPower") result = E.useHeroPower(state, playerIndex, action.targetUid);
    else if (action.type === "discover") result = E.resolveDiscover(state, playerIndex, action.cardId);
    else result = { ok: false, reason: "unknown action" };
    if (result && result.ok === false) {
      // 保底：如果动作因规则校验失败，结束回合，避免卡死
      E.endTurn(state, playerIndex);
      return { action: { type: "end", fallback: true }, result: result };
    }
    return { action: action, result: result };
  }

  function autoPlayGame(config) {
    const state = E.createGame(config || {});
    let steps = 0;
    while (state.status === "playing" && steps < 1500) {
      takeAction(state, state.current);
      steps++;
    }
    return { state: state, steps: steps };
  }

  function runSimulations(count, config) {
    const results = [];
    for (let i = 0; i < count; i++) {
      const seed = ((config && config.seed) || 3000) + i;
      const r = autoPlayGame(Object.assign({}, config || {}, { seed: seed, mode: "sim", p1AI: true, p2AI: true }));
      results.push(r);
    }
    return results;
  }

  return {
    chooseAction: chooseAction,
    takeAction: takeAction,
    autoPlayGame: autoPlayGame,
    runSimulations: runSimulations,
    minionValue: minionValue,
    lethalAvailable: lethalAvailable
  };
});


