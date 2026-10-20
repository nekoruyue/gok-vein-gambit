/*
 * 《戈克世界：流脉牌局》逐卡效果测试台核心
 * 同时供 Node CLI（tools/card-effect-lab.js）和浏览器测试页（card-lab.html）使用。
 */
(function (root, factory) {
  if (typeof module !== "undefined" && module.exports) module.exports = factory();
  else root.GokCardLab = factory();
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const ZONES = ["left", "center", "right"];

  function create(D, E) {
    let seedCounter = 900000;

    function all(p) { return E.allMinions(p); }

    function makeDeck(prefix) {
      const out = [];
      for (let i = 0; i < 30; i++) out.push({ uid: prefix + i, cardId: i % 3 === 0 ? "guard" : "fog_sailor" });
      return out;
    }

    function snapshot(s) {
      function player(p) {
        return {
          hp: p.hp,
          armor: p.armor,
          mana: p.mana,
          maxMana: p.maxMana,
          relic: p.relic,
          heroPowerBlocked: !!p.heroPowerBlocked,
          spellCostReduction: p.spellCostReduction || 0,
          nextSpellReduction: p.nextSpellReduction || 0,
          nextCostReduction: p.nextCostReduction || 0,
          freeSpellTurn: !!p.freeSpellTurn,
          formations: (p.formations || []).map(f => ({ cardId: f.cardId, zone: f.zone })),
          hand: p.hand.map(c => ({ id: c.cardId, discount: c.discount || 0 })),
          deck: p.deck.length,
          board: all(p).map(m => ({
            id: m.cardId, zone: m.zone, attack: m.attack, health: m.health,
            maxHealth: m.maxHealth, taunt: !!m.taunt, frozen: m.frozenTurns || 0,
            stealth: !!m.stealth, silenced: !!m.silenced, dead: !!m.dead,
            keywords: (m.keywords || []).slice().sort(), bounty: m.bounty ? m.bounty.owner : null,
            passive: m.passive ? m.passive.type : null,
            deathrattle: m.deathrattle ? m.deathrattle.type : null
          }))
        };
      }
      return {
        vein: s.vein,
        p0: player(s.players[0]),
        p1: player(s.players[1])
      };
    }

    function diff(before, after) {
      return JSON.stringify(before) !== JSON.stringify(after);
    }

    // 只看“效果”会改变的状态，排除测试卡从手牌到场上这一动作本身。
    function effectState(s, card, testUid, playedUid, deadPlayed, manaCost, paidMana) {
      const p0 = s.players[0], p1 = s.players[1];
      function strips(p, excludeUid) {
        return all(p).filter(m => m.uid !== excludeUid).map(m => ({
          id: m.cardId, zone: m.zone, attack: m.attack, health: m.health, maxHealth: m.maxHealth,
          taunt: !!m.taunt, frozen: m.frozenTurns || 0, stealth: !!m.stealth, silenced: !!m.silenced,
          keywords: (m.keywords || []).slice().sort(), bounty: m.bounty ? m.bounty.owner : null,
          passive: m.passive ? m.passive.type : null, deathrattle: m.deathrattle ? m.deathrattle.type : null
        })).sort((a, b) => (a.zone + a.id + a.attack + a.health).localeCompare(b.zone + b.id + b.attack + b.health));
      }
      const played = playedUid && !deadPlayed ? all(p0).find(m => m.uid === playedUid) : null;
      const baseKeywords = (card.keywords || []).slice().sort();
      return {
        own: {
          hp: p0.hp, armor: p0.armor, maxMana: p0.maxMana,
          mana: p0.mana + (paidMana ? (manaCost || 0) : 0),
          nextTurnManaBonus: p0.nextTurnManaBonus || 0,
          vein: s.vein, relic: p0.relic, heroPowerBlocked: !!p0.heroPowerBlocked,
          spellCostReduction: p0.spellCostReduction || 0,
          nextSpellReduction: p0.nextSpellReduction || 0,
          nextCostReduction: p0.nextCostReduction || 0,
          freeSpellTurn: !!p0.freeSpellTurn,
          formations: (p0.formations || []).map(f => f.cardId + "@" + f.zone).sort(),
          hand: p0.hand.filter(c => c.uid !== testUid).map(c => c.cardId + (c.discount ? "-" + c.discount : "")).sort(),
          deck: p0.deck.length,
          board: strips(p0, playedUid)
        },
        enemy: {
          hp: p1.hp, armor: p1.armor, hand: p1.hand.length, deck: p1.deck.length,
          heroPowerBlocked: !!p1.heroPowerBlocked, board: strips(p1, null)
        },
        pending: s.pendingChoice ? s.pendingChoice.type : null
      };
    }

    function effectTags(card) {
      const tags = [];
      if (card.battlecry) tags.push("battlecry:" + card.battlecry.type);
      if (card.spell) tags.push("spell:" + card.spell.type);
      if (card.deathrattle) tags.push("deathrattle:" + card.deathrattle.type);
      if (card.passive) tags.push("passive:" + card.passive.type);
      if (card.zoneBonus) tags.push("zone");
      if (card.mirrorBonus) tags.push("mirror");
      if (card.veinTiers || card.veinBonus) tags.push("vein");
      if (card.formation) tags.push("formation");
      if (card.type === "relic") tags.push("relic");
      if (card.pressure) tags.push("pressure");
      if (card.reflux) tags.push("reflux");
      if (card.bloodCost) tags.push("blood");
      if (card.excavate) tags.push("excavate:" + card.excavate);
      return tags;
    }

    function baseGame(card, variant) {
      const faction = card.faction === "neutral" ? "pus" : card.faction;
      const enemy = faction === "pus" ? "academy" : "pus";
      const s = E.createGame({
        faction1: faction,
        faction2: enemy,
        first: 0,
        p1AI: false,
        p2AI: false,
        mulligan: true,
        seed: seedCounter++
      });
      s.mulliganPhase = false;
      s.status = "playing";
      s.current = 0;
      s.round = 3;
      s.vein = variant.vein == null ? 10 : variant.vein;
      for (const p of s.players) {
        p.mana = 30;
        p.maxMana = 30;
        p.hp = 80;
        p.maxHp = 80;
        p.armor = variant.armor == null ? 3 : variant.armor;
        p.hand = [];
        p.deck = makeDeck("d" + seedCounter + "_" + p.index + "_");
        p.formations = [];
        p.relic = null;
        p.heroPowerUsed = false;
        for (const z of ZONES) p.board[z] = [];
      }
      const p0 = s.players[0];
      const p1 = s.players[1];
      if (variant.board !== false) {
        E.summonMinion(s, p0, "fog_sailor", "left", null);
        const c = E.summonMinion(s, p0, "guard", "center", null);
        if (c) { c.health = Math.max(1, c.maxHealth - 1); }
      }
      if (variant.enemy !== false) {
        E.summonMinion(s, p1, "fog_sailor", "left", null);
        E.summonMinion(s, p1, "fog_sailor", "center", null);
      }
      p0.hand = [{ uid: "lab_" + card.id, cardId: card.id }];
      if (variant.extraHand) {
        for (let i = 0; i < 2; i++) p0.hand.push({ uid: "extra_" + i, cardId: "guard" });
      }
      return s;
    }

    function choosePlay(s, card) {
      const p = s.players[0];
      const uid = p.hand[0] && p.hand[0].uid;
      if (!uid) return { ok: false, reason: "手牌中没有测试卡" };
      const opt = E.getPlayOptions(s, 0, uid);
      if (!opt.ok) return { ok: false, reason: opt.reason || "不可打出", opt };
      const opts = { payBlood: true };
      let targetUid = null, targetUid2 = null;
      if (opt.targetType && opt.targets && opt.targets.length) targetUid = opt.targets[0];
      if (opt.target2Type && opt.target2Targets && opt.target2Targets.length) targetUid2 = opt.target2Targets[0];
      if (targetUid) opts.targetUid = targetUid;
      if (targetUid2) opts.targetUid2 = targetUid2;
      const zones = opt.zones && opt.zones.length ? opt.zones : (card.type === "minion" || card.type === "formation" ? E.openZones(p) : []);
      if (zones && zones.length) opts.zone = zones.indexOf("center") >= 0 ? "center" : zones[0];
      return { ok: true, uid, opts, opt };
    }

    function resolvePending(s) {
      let guard = 0;
      while (s.pendingChoice && s.pendingChoice.player === 0 && guard++ < 10) {
        const pc = s.pendingChoice;
        if (pc.type === "discover" && pc.options && pc.options.length) {
          E.resolveDiscover(s, 0, pc.options[0]);
        } else {
          break;
        }
      }
    }

    function findNewMinion(s, cardId, beforeUids) {
      for (const z of ZONES) {
        for (const m of s.players[0].board[z]) {
          if (!m.dead && m.cardId === cardId && !beforeUids.has(m.uid)) return m;
        }
      }
      return null;
    }

    function selfChanged(played, card) {
      if (!played) return false;
      const baseKeywords = (card.keywords || []).slice().sort();
      const nowKeywords = (played.keywords || []).slice().sort();
      return played.attack !== (card.attack || 0) ||
        played.health !== (card.health || 0) ||
        played.maxHealth !== (card.health || 0) ||
        !!played.taunt !== !!card.taunt ||
        !!played.stealth !== !!card.stealth ||
        (played.frozenTurns || 0) !== 0 ||
        JSON.stringify(baseKeywords) !== JSON.stringify(nowKeywords);
    }

    function probePassive(s, card, played) {
      const p0 = s.players[0], p1 = s.players[1];
      const passive = card.passive && card.passive.type;
      const result = (triggered, note) => ({ triggered: !!triggered, note: note || "" });
      function addSpell(id) {
        const c = { uid: "probe_" + card.id, cardId: id };
        p0.hand.push(c);
        return c;
      }
      function castProbeSpell(id) {
        const c = addSpell(id);
        const o = E.getPlayOptions(s, 0, c.uid);
        if (!o.ok) return false;
        const opts = { payBlood: true };
        if (o.targetType && o.targets && o.targets.length) opts.targetUid = o.targets[0];
        const r = E.playCard(s, 0, c.uid, opts);
        resolvePending(s);
        return !!(r && r.ok !== false);
      }
      function killFriendly(m) {
        E.damageMinion(s, m, 999, null, "lab-passive");
        E.processDeaths(s);
        resolvePending(s);
      }
      if (!played || played.dead) return result(false, "被动载体不在场");
      try {
        if (passive === "turnArmor") {
          const before = p0.armor;
          s.current = 0;
          E.startTurn(s);
          return result(p0.armor > before, "回合开始护甲 " + before + " → " + p0.armor);
        }
        if (passive === "tauntAura") {
          const before = D.CARDS.guard.health || 3;
          const g = E.summonMinion(s, p0, "guard", played.zone, null);
          return result(!!g && g.health > before, "同阵位拦截随从生命 " + (g && g.health) + "（基础 " + before + "）");
        }
        if (passive === "firstCardDiscount") {
          s.players[0].cardsPlayedThisTurn = 0;
          const c = addSpell("mobilize");
          const base = D.CARDS.mobilize.cost;
          const cost = E.getCardCost(s, p0, c);
          return result(cost < base, "第一张牌费用 " + base + " → " + cost);
        }
        if (passive === "spellDrawOne" || passive === "spellGrowth" || passive === "spellFreezeOnce" || passive === "spellDiscoverOnce") {
          const beforeDeck = p0.deck.length;
          const beforeAttack = played.attack;
          const beforeFrozen = all(p1).filter(m => (m.frozenTurns || 0) > 0).length;
          const beforeHand = p0.hand.length;
          const spellId = passive === "spellFreezeOnce" ? "prohibition" : "mobilize";
          const cast = castProbeSpell(spellId);
          if (!cast) return result(false, "无法打出触发法术 " + spellId);
          if (p0.pendingChoice) resolvePending(s);
          if (passive === "spellDrawOne") return result(p0.deck.length < beforeDeck, "牌库 " + beforeDeck + " → " + p0.deck.length);
          if (passive === "spellGrowth") return result(played.attack > beforeAttack, "自身攻击 " + beforeAttack + " → " + played.attack);
          if (passive === "spellFreezeOnce") return result(all(p1).some(m => (m.frozenTurns || 0) > 0) || beforeFrozen > 0, "敌方冻结触发");
          return result(p0.hand.length > beforeHand || !!s.pendingChoice, "施法后检索/手牌变化");
        }
        if (passive === "attackDestroyFrozen") {
          const enemy = all(p1)[0];
          if (!enemy) return result(false, "没有敌方目标");
          E.freezeMinion(s, enemy, 1);
          played.attacksLeft = 1;
          played.hasAttacked = false;
          E.attack(s, 0, played.uid, enemy.uid);
          return result(enemy.dead, "攻击被冻结目标并消灭");
        }
        if (passive === "damageToArmor") {
          const enemy = all(p1)[0];
          if (!enemy) return result(false, "没有敌方目标");
          const before = p0.armor;
          played.attacksLeft = 1;
          played.hasAttacked = false;
          E.attack(s, 0, played.uid, enemy.uid);
          return result(p0.armor > before, "造成伤害后护甲 " + before + " → " + p0.armor);
        }
        if (passive === "deathDiscoverSpell") {
          const ally = all(p0).find(m => m.uid !== played.uid);
          if (!ally) return result(false, "没有其他友方可牺牲");
          const beforeHand = p0.hand.length;
          killFriendly(ally);
          return result(p0.hand.length > beforeHand || !!s.pendingChoice, "友方死亡后检索");
        }
        if (passive === "deathRecordShot") {
          const ally = all(p0).find(m => m.uid !== played.uid);
          if (!ally) return result(false, "没有其他友方可牺牲");
          killFriendly(ally);
          return result(p0.hand.some(c => c.cardId === "record_shot"), "友方死亡后获得记录弹");
        }
        if (passive === "deathGrowth") {
          const ally = all(p0).find(m => m.uid !== played.uid);
          if (!ally) return result(false, "没有其他友方可牺牲");
          const before = played.attack + "/" + played.health;
          killFriendly(ally);
          return result(played.attack + "/" + played.health !== before, "友方死亡后 " + before + " → " + played.attack + "/" + played.health);
        }
        if (passive === "impGrowth") {
          const before = played.attack + "/" + played.health;
          E.summonMinion(s, p0, "losutai_imp", E.openZones(p0)[0], null);
          return result(played.attack + "/" + played.health !== before, "魔物成长 " + before + " → " + played.attack + "/" + played.health);
        }
        if (passive === "tauntDeathDraw") {
          const g = E.summonMinion(s, p0, "guard", played.zone, null);
          if (!g) return result(false, "无法召唤拦截随从");
          const before = p0.hand.length;
          killFriendly(g);
          return result(p0.hand.length > before, "拦截随从死亡后抽牌");
        }
        if (passive === "bountyClaimGrowth" || passive === "bountyClaimDamage") {
          const enemy = all(p1)[0];
          if (!enemy) return result(false, "没有悬赏目标");
          enemy.bounty = { owner: 0 };
          const before = passive === "bountyClaimGrowth" ? (played.attack + "/" + played.health) : (p1.hp + "/" + p1.armor);
          killFriendly(enemy);
          const after = passive === "bountyClaimGrowth" ? (played.attack + "/" + played.health) : (p1.hp + "/" + p1.armor);
          return result(before !== after, "悬赏结算 " + before + " → " + after);
        }
        if (passive === "repeatLastSpell") {
          const c = addSpell("mobilize");
          const o = E.getPlayOptions(s, 0, c.uid);
          if (!o.ok) return result(false, "无法先打出一张法术");
          const opts = { payBlood: true };
          if (o.targetType && o.targets && o.targets.length) opts.targetUid = o.targets[0];
          E.playCard(s, 0, c.uid, opts);
          resolvePending(s);
          const beforeDeck = p0.deck.length;
          E.endTurn(s, 0);
          resolvePending(s);
          return result(p0.deck.length < beforeDeck || p0.hand.some(x => x.generated), "回合结束复诵最后法术");
        }
        return result(false, "该被动类型尚未有自动触发探针");
      } catch (err) {
        return { triggered: false, error: err && err.stack || String(err), note: "被动触发异常" };
      }
    }


    function runVariant(card, variant) {
      const s = baseGame(card, variant);
      const p0 = s.players[0];
      const before = snapshot(s);
      const beforeUids = new Set(all(p0).map(m => m.uid));
      const logStart = s.log.length;
      const eventStart = s.events.length;
      const play = choosePlay(s, card);
      if (!play.ok) {
        return { variant: variant.name, skip: true, reason: play.reason || "没有合法目标", tags: effectTags(card) };
      }
      const testCard = p0.hand.find(c => c.uid === play.uid);
      const manaCost = testCard ? E.getCardCost(s, p0, testCard) : 0;
      const beforeEffect = effectState(s, card, play.uid, null, false, manaCost, false);
      let result;
      try {
        result = E.playCard(s, 0, play.uid, play.opts);
      } catch (err) {
        return { variant: variant.name, fail: true, error: err && err.stack || String(err), tags: effectTags(card) };
      }
      if (!result || result.ok === false) {
        return { variant: variant.name, fail: true, error: (result && result.reason) || "playCard 返回失败", tags: effectTags(card) };
      }
      resolvePending(s);
      const played = p0.board ? findNewMinion(s, card.id, beforeUids) : null;
      const passiveProbe = card.passive ? probePassive(s, card, played) : null;
      const afterPlay = snapshot(s);
      const afterPlayEffect = effectState(s, card, play.uid, played ? played.uid : null, false, manaCost, true);
      const playEffectChanged = diff(beforeEffect, afterPlayEffect);
      let death = null;
      let deathEffect = null;
      if (played && (card.deathrattle || (card.keywords || []).indexOf("deathrattle") >= 0)) {
        try {
          E.damageMinion(s, played, 999, null, "lab-deathrattle");
          E.processDeaths(s);
          resolvePending(s);
          death = snapshot(s);
          deathEffect = effectState(s, card, play.uid, played.uid, true, manaCost, true);
        } catch (err) {
          return { variant: variant.name, fail: true, error: "deathrattle: " + (err && err.stack || err), tags: effectTags(card), before, after: afterPlay };
        }
      }
      const after = death || afterPlay;
      const afterEffect = deathEffect || afterPlayEffect;
      const effectChanged = diff(beforeEffect, afterEffect);
      const selfEffect = selfChanged(played, card);
      const events = s.events.slice(eventStart);
      const effectEvents = events.filter(ev => ev.structured && ev.kind !== "summon" && ev.kind !== "play");
      const logs = s.log.slice(logStart).map(x => x.text || x);
      const installed = !!(played || p0.relic === card.id || (p0.formations || []).some(f => f.cardId === card.id));
      const isPassive = !!card.passive;
      const isEffect = !!effectTags(card).length;
      const structural = card.type === "relic" || card.type === "formation";
      let status = "pass";
      let note = "";
      if (isPassive) {
        if (passiveProbe && passiveProbe.error) {
          status = "fail";
          note = passiveProbe.error;
        } else if (passiveProbe && passiveProbe.triggered) {
          status = "pass";
          note = "被动触发：" + (passiveProbe.note || "观察到状态变化");
        } else {
          status = "warn";
          note = "被动已安装，但未观察到触发" + (passiveProbe && passiveProbe.note ? "：" + passiveProbe.note : "；缺少该类自动探针");
        }
      } else if (structural) {
        if (!installed) { status = "fail"; note = "阵型/遗物没有安装"; }
        else note = card.type === "relic" ? "遗物已装备" : "阵型已部署";
      } else if (isEffect) {
        if (card.spell && card.spell.type === "none" && !card.excavate) {
          status = "warn";
          note = "该牌没有引擎效果字段（仅打出）";
        } else if (!effectChanged && !selfEffect && !effectEvents.length) {
          status = "warn";
          note = "卡牌可打出，但没有观察到状态/事件变化";
        } else {
          note = effectChanged || effectEvents.length ? "观察到效果状态变化" : "观察到自身数值/关键词变化";
        }
      } else if (card.type === "minion" && !installed) {
        status = "fail";
        note = "随从没有落地";
      }
      return {
        variant: variant.name,
        status,
        note,
        tags: effectTags(card),
        changed: effectChanged,
        selfChanged: selfEffect,
        installed,
        passiveProbe,
        passiveTriggered: !!(passiveProbe && passiveProbe.triggered),
        events: events.slice(-12),
        effectEvents: effectEvents.slice(-12),
        logs: logs.slice(-12),
        before,
        after,
        effectBefore: beforeEffect,
        effectAfter: afterEffect,
        result: result.ok
      };
    }

    function runCard(card) {
      const tags = effectTags(card);
      const variants = [
        { name: "rich", board: true, enemy: true, vein: 10, armor: 3, extraHand: true },
        { name: "enemy-empty", board: true, enemy: false, vein: 0, armor: 0, extraHand: false },
        { name: "solo", board: false, enemy: true, vein: 0, armor: 0, extraHand: false }
      ];
      const runs = [];
      for (const v of variants) {
        const r = runVariant(card, v);
        r.variant = v.name;
        runs.push(r);
        if (r.fail) break;
      }
      const failed = runs.filter(r => r.fail);
      const usable = runs.filter(r => !r.skip && !r.fail);
      let status = "pass";
      let note = "";
      if (failed.length) {
        status = "fail";
        note = failed[0].error || "执行失败";
      } else if (!usable.length) {
        status = "fail";
        note = "所有场景均无法打出：" + (runs.map(r => r.variant + "=" + (r.reason || "skip")).join("；"));
      } else {
        const structural = card.type === "relic" || card.type === "formation";
        const isGood = r => {
          if (r.status !== "pass") return false;
          if (card.passive) return !!r.passiveTriggered;
          if (structural || !tags.length) return !!r.installed;
          return !!(r.changed || r.selfChanged || (r.effectEvents && r.effectEvents.length));
        };
        const good = usable.some(isGood);
        const warn = usable.find(r => r.status === "warn");
        if (!good) {
          status = "warn";
          note = warn ? warn.note : "可打出，但未观察到效果";
        }
        if (card.spell && card.spell.type === "none" && !card.excavate) {
          status = "warn";
          note = "该牌没有引擎效果字段（仅打出）";
        }
        if (card.passive) {
          const hit = usable.find(r => r.passiveTriggered);
          if (hit) {
            status = "pass";
            note = "被动触发：" + ((hit.passiveProbe && hit.passiveProbe.note) || "观察到状态变化");
          } else {
            status = "warn";
            note = "被动已安装，但未观察到触发" + (warn && warn.note ? "：" + warn.note : "；缺少该类自动探针");
          }
        }
      }
      return {
        id: card.id,
        name: card.name,
        faction: card.faction,
        type: card.type,
        rarity: card.rarity,
        cost: card.cost,
        status,
        note,
        tags,
        runs
      };
    }

    function runAll(options) {
      options = options || {};
      const cards = Object.values(D.CARDS)
        .filter(c => !c.token && !c.disabled)
        .sort((a, b) => (a.faction || "").localeCompare(b.faction || "") || (a.cost || 0) - (b.cost || 0) || a.name.localeCompare(b.name));
      const started = Date.now();
      const results = cards.map(c => {
        try { return runCard(c); }
        catch (err) {
          return { id: c.id, name: c.name, faction: c.faction, type: c.type, rarity: c.rarity, cost: c.cost, status: "fail", note: err && err.stack || String(err), tags: effectTags(c), runs: [] };
        }
      });
      const summary = { total: results.length, pass: 0, warn: 0, fail: 0 };
      for (const r of results) summary[r.status] = (summary[r.status] || 0) + 1;
      return { generatedAt: new Date().toISOString(), summary, durationMs: Date.now() - started, results };
    }

    return { runAll, runCard, effectTags, snapshot };
  }

  return { create };
});
