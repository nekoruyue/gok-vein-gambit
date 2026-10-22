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
    let v = m.attack * 2 + m.health;
    if (m.taunt) v += 2;
    if (m.divineShield) v += 3;
    if (m.windfury) v += Math.max(1, m.attack);
    if (m.poisonous) v += 2;
    if (m.lifesteal) v += 1;
    if (m.reborn) v += 1.5;
    if (m.stealth) v += 1;
    if (m.rush || m.charge) v += 1;
    if (m.frozenTurns > 0) v -= 1;
    return v;
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
    const facePower = p.heroId === "otto" && !p.heroPowerUsed && p.mana >= 2 ? 1 : 0;
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

  function zoneScore(state, p, def, zone) {
    const n = p.board[zone].length;
    if (p.faction === "pus") return (n === 1 ? 10 : 0) + (zone === "center" ? 1 : 0);
    return (n === 0 ? 3 : 0) + (zone === "center" ? 1 : 0);
  }

  function chooseZone(state, p, def, opt) {
    if (def.type !== "minion" && def.type !== "formation") return null;
    const zones = opt.zones || [];
    if (!zones.length) return null;
    return zones.slice().sort((a, b) => zoneScore(state, p, def, b) - zoneScore(state, p, def, a))[0];
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
      case "damageAllEnemyUnitsPerGameSpell": {
        const total = p.spellsCastThisGame || 0;
        s += total * 1.2 + enemyMinions(state, p).length * 0.4;
        if (total < 2) s -= 8;
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
    if (def.type === "relic") s += 10;
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
      if (opt.targetType && !target && def.type !== "minion" && !def.optionalTarget) continue;
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
    if (!o.ok) return null;
    if (p.hero.power && p.hero.power.id === "spell_codex") return { type: "heroPower", targetUid: null, score: 3.6 };
    if (p.heroId === "karna") {
      if (p.hp <= 10) return null;
      return { type: "heroPower", targetUid: null, score: 3 };
    }
    if (p.heroId === "wolfram") {
      const canChange = p.hand.some(c => {
        const d = D.CARDS[c.cardId];
        if (!d || d.cost == null || d.cost >= 10 || d.type === "relic") return false;
        const nc = Math.min(10, d.cost + 1);
        return Object.keys(D.CARDS).some(id => {
          const n = D.CARDS[id];
          return n && !n.token && !n.disabled && n.type !== "relic" && n.cost === nc && id !== d.id && (n.faction === p.faction || n.faction === "neutral");
        });
      });
      return canChange ? { type: "heroPower", targetUid: null, score: 2.6 } : null;
    }
    if (!o.targets.length) return null;
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
      return target ? { type: "heroPower", targetUid: target.uid, score: 4 } : null;
    }
    if (p.heroId === "karna") {
      if (p.hp <= 8) return null;
      const target = allies.slice().sort((a, b) => a.health - b.health)[0];
      return target ? { type: "heroPower", targetUid: target.uid, score: 3 } : null;
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
    if (p.heroId === "monarch") {
      const enemies = enemyMinions(state, p).filter(m => !m.stealth && m.bounty == null);
      if (!enemies.length) return null;
      const target = enemies.slice().sort((a, b) => minionValue(b) - minionValue(a))[0];
      return { type: "heroPower", targetUid: target.uid, score: 3.7 };
    }
    if (p.heroId === "wolfram") {
      const card = p.hand.filter(c => o.targets.indexOf(c.uid) >= 0).sort((a, b) => (D.CARDS[a.cardId].cost || 0) - (D.CARDS[b.cardId].cost || 0))[0];
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

  function boardValue(player) {
    return ownMinions(player).reduce((sum, m) => sum + minionValue(m), 0);
  }

  function boardAttack(player) {
    return ownMinions(player).reduce((sum, m) => sum + Math.max(0, m.attack), 0);
  }

  function handThreat(state, me) {
    const op = enemyOf(state, me);
    let t = 0;
    for (const c of op.hand) {
      const d = D.CARDS[c.cardId];
      if (!d) continue;
      const b = d.spell || {};
      if (b.type === "damage") t += (b.amount || 1) * 1.15;
      else if (b.type === "damageAllEnemies" || b.type === "damageAllEnemiesDraw") t += 2.4;
      else if (b.type === "freeze" || b.type === "freezeAll") t += 1.1;
      else if (b.type === "silence") t += 0.8;
      else if (d.type === "minion" && (d.keywords || []).some(k => k === "rush" || k === "charge")) t += (d.attack || 1) * 0.7;
    }
    return t;
  }

  function evaluateState(state, playerIndex) {
    if (state.status === "gameover") {
      if (state.winner === playerIndex) return 100000;
      if (state.winner == null) return 0;
      return -100000;
    }
    const me = state.players[playerIndex];
    const op = enemyOf(state, me);
    let score = 0;
    score += (me.hp + me.armor) * 1.3 - (op.hp + op.armor) * 2.4;
    score += boardValue(me) * 1.15 - boardValue(op) * 1.1;
    score += (boardAttack(me) - boardAttack(op)) * 0.75;
    score += (me.hand.length - op.hand.length) * 2.8;
    score += (me.mana - op.mana) * 0.18;
    score += (me.heroPowerUsed ? 0 : 1) * 1.4;
    score += (me.deck.length - op.deck.length) * 0.04;
    const myTaunts = ownMinions(me).filter(m => m.taunt).length;
    const opTaunts = ownMinions(op).filter(m => m.taunt).length;
    score += (myTaunts - opTaunts) * 0.8;
    if (op.hp + op.armor <= boardAttack(me)) score += 30;
    if (me.hp + me.armor <= boardAttack(op)) score -= 30;
    if (op.hp <= 0) score += 5000;
    if (me.hp <= 0) score -= 5000;
    if (state.aiDifficulty === "nightmare") {
      const threat = handThreat(state, me);
      score -= threat * ((me.hp + me.armor) < 16 ? 1.35 : 0.45);
    }
    return score;
  }

  function targetChoices(state, p, def, opt) {
    if (!opt.targetType) return [null];
    const first = chooseTarget(state, p, def, opt);
    const ids = (opt.targets || []).slice();
    const minions = ids.map(uid => E.findMinion(state, uid)).filter(Boolean);
    minions.sort((a, b) => minionValue(b) - minionValue(a));
    const ordered = [];
    if (first) ordered.push(first.uid);
    for (const m of minions) if (ordered.indexOf(m.uid) < 0) ordered.push(m.uid);
    if (!ordered.length) {
      if (def.type === "minion" || def.optionalTarget) return [null];
      return [];
    }
    return ordered.slice(0, 3);
  }

  function enumerateActions(state, p) {
    const actions = [];
    const seen = new Set();
    const push = (a) => {
      const key = JSON.stringify(a);
      if (seen.has(key)) return;
      seen.add(key);
      actions.push(a);
    };
    for (const c of p.hand) {
      const def = D.CARDS[c.cardId];
      if (!def) continue;
      const opt = E.getPlayOptions(state, p.index, c.uid);
      if (!opt.ok) continue;
      const targets = targetChoices(state, p, def, opt);
      if (!targets.length) continue;
      const target2 = (def.target2 && (opt.target2Targets || []).length) ? E.findMinion(state, opt.target2Targets[0]) : null;
      if (def.target2 && !target2 && !def.optionalTarget2) continue;
      const zones = (def.type === "minion" || def.type === "formation")
        ? (opt.zones || []).slice().sort((a, b) => zoneScore(state, p, def, b) - zoneScore(state, p, def, a))
        : [null];
      if ((def.type === "minion" || def.type === "formation") && !zones.length) continue;
      let combos = 0;
      for (const targetUid of targets) {
        for (const zone of zones) {
          push({
            type: "play",
            cardUid: c.uid,
            opts: { targetUid: targetUid || null, targetUid2: target2 ? target2.uid : null, zone: zone, payBlood: shouldPayBlood(state, p, def) }
          });
          if (++combos >= 6) break;
        }
        if (combos >= 6) break;
      }
    }
    for (const m of ownMinions(p)) {
      if (m.attacksLeft <= 0 || m.frozenTurns > 0) continue;
      const o = E.getAttackOptions(state, p.index, m.uid);
      if (!o.ok) continue;
      for (const targetUid of o.targets) push({ type: "attack", attackerUid: m.uid, targetUid: targetUid });
    }
    const hpOpt = E.getHeroPowerOptions(state, p.index);
    if (hpOpt.ok) {
      if (!(hpOpt.targets || []).length) {
        push({ type: "heroPower", targetUid: null });
      } else {
        for (const targetUid of (hpOpt.targets || []).slice(0, 6)) {
          push({ type: "heroPower", targetUid: targetUid });
        }
      }
    }
    return actions;
  }

  function applyCandidate(state, action, playerIndex) {
    const s = JSON.parse(JSON.stringify(state));
    let result;
    if (action.type === "play") result = E.playCard(s, playerIndex, action.cardUid, action.opts);
    else if (action.type === "attack") result = E.attack(s, playerIndex, action.attackerUid, action.targetUid);
    else if (action.type === "heroPower") result = E.useHeroPower(s, playerIndex, action.targetUid);
    else return null;
    let guard = 0;
    while (result && result.ok !== false && s.pendingChoice && s.pendingChoice.player === playerIndex && guard++ < 8) {
      const pick = chooseDiscover(s);
      if (!pick) break;
      result = E.resolveDiscover(s, playerIndex, pick.cardId);
    }
    return result && result.ok !== false ? s : null;
  }

  function actionPriority(state, p, action) {
    if (action.type === "play") {
      const card = p.hand.find(c => c.uid === action.cardUid);
      const def = card && D.CARDS[card.cardId];
      if (!def) return 0;
      const target = action.opts.targetUid ? E.findMinion(state, action.opts.targetUid) : null;
      return effectScore(state, p, def, target, action.opts.zone) + (def.attack || 0) * 0.8 + (def.health || 0) * 0.6;
    }
    if (action.type === "attack") {
      const attacker = E.findMinion(state, action.attackerUid);
      if (!attacker) return 0;
      if (action.targetUid === "hero") return 3 + attacker.attack * 1.2;
      const target = E.findMinion(state, action.targetUid);
      if (!target) return 0;
      return (attacker.attack >= target.health ? minionValue(target) : target.attack * 0.4) - (target.attack >= attacker.health ? minionValue(attacker) * 0.5 : 0);
    }
    if (action.type === "heroPower") return 3.5;
    return 0;
  }

  function searchBestAction(state, p, depth, limit) {
    let actions = enumerateActions(state, p);
    if (!actions.length) return null;
    actions.sort((a, b) => actionPriority(state, p, b) - actionPriority(state, p, a));
    if (limit) actions = actions.slice(0, limit);
    let best = null;
    for (const action of actions) {
      let next = applyCandidate(state, action, p.index);
      if (!next) continue;
      if ((depth || 1) > 1 && next.status === "playing" && next.current === p.index) {
        const nextP = next.players[p.index];
        const second = searchBestAction(next, nextP, 1, limit ? Math.max(4, Math.floor(limit / 2)) : 10);
        if (second) {
          const afterSecond = applyCandidate(next, second.action, p.index);
          if (afterSecond) next = afterSecond;
        }
      }
      const score = evaluateState(next, p.index);
      if (!best || score > best.score) best = { action: action, score: score };
    }
    return best;
  }

  function findLethalAction(state, p) {
    const actions = enumerateActions(state, p);
    for (const action of actions.slice(0, 36)) {
      const next = applyCandidate(state, action, p.index);
      if (next && next.status === "gameover" && next.winner === p.index) return action;
    }
    return null;
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
    if (state.aiDifficulty !== "easy") {
      const lethalAction = findLethalAction(state, p);
      if (lethalAction) return lethalAction;
      const depth = state.aiDifficulty === "normal" ? 1 : 2;
      const limit = state.aiDifficulty === "nightmare" ? 24 : state.aiDifficulty === "hard" ? 14 : 0;
      const baseline = evaluateState(state, p.index);
      const searched = searchBestAction(state, p, depth, limit);
      if (searched && searched.action && searched.score > baseline + 0.35) {
        return Object.assign({}, searched.action, { score: searched.score });
      }
    }
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


