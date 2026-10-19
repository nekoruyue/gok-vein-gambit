/* 《戈克世界：流脉牌局》测试版卡牌数据
 * 仅实现 普卫岛 vs 西昭 两阵营 + 中立。
 * 数据驱动，后续可继续添加学院/共和国/帝国。
 */
(function (root, factory) {
  if (typeof module !== "undefined" && module.exports) module.exports = factory();
  else root.GokData = factory();
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  const FACTIONS = {
    pus: { name: "普卫岛", short: "普卫岛", color: "#5fd3c4", dark: "#123b3a", icon: "盾", emblem: "/assets/emblems/pus.svg", hero: "lain" },
    academy: { name: "学院", short: "学院", color: "#82aee8", dark: "#14263d", icon: "书", emblem: "/assets/emblems/academy.svg", hero: "marta" },
    xizhao: { name: "西昭", short: "西昭", color: "#c0504d", dark: "#3a1215", icon: "血", emblem: "/assets/emblems/xizhao.svg", hero: "karna" },
    republic: { name: "共和国", short: "共和国", color: "#d6b25f", dark: "#2b2518", icon: "律", emblem: "/assets/emblems/republic.svg", hero: "wolfram" },
    empire: { name: "帝国", short: "帝国", color: "#b08a5a", dark: "#2a2118", icon: "冠", emblem: "/assets/emblems/empire.svg", hero: "otto" },
    greyharbor: { name: "灰港同盟", short: "灰港", color: "#7fae8f", dark: "#1b2a23", icon: "匕", emblem: "/assets/emblems/greyharbor.svg", hero: "monarch" },
    neutral: { name: "中立", short: "中立", color: "#c9a86a", dark: "#2c271f", icon: "旅", emblem: "/assets/emblems/neutral.svg", hero: null }
  };

  const FACTION_IDS = ["pus", "academy", "xizhao", "republic", "empire", "greyharbor"];

  function nextFaction(faction) {
    const i = FACTION_IDS.indexOf(faction);
    return FACTION_IDS[(i + 1) % FACTION_IDS.length];
  }

  const HEROES = {
    lain: {
      id: "lain",
      name: "莱恩·科斯特",
      short: "莱恩",
      title: "高级协调者 · 新人类",
      faction: "pus",
      hp: 30,
      armor: 10,
      art: "lain",
      quote: "他不是强者。他只是第一个试图理解的人。",
      power: {
        name: "协调",
        cost: 2,
        target: "friendly",
        text: "使一个友方随从获得 +0/+1；若它与另一个友方随从同阵位，改为 +1/+1。"
      },
      passive: { name: "地脉回响", text: "流脉阈值触发时，恢复所有友方单位 4 点生命。" }
    },
    marta: {
      id: "marta",
      name: "玛尔塔·冯·艾森",
      short: "玛尔塔",
      title: "学院评议员 · 新人类",
      faction: "academy",
      hp: 30,
      armor: 8,
      art: "marta",
      quote: "把问题拆开，答案就会自己露出来。",
      power: {
        name: "演算",
        cost: 2,
        target: "enemy",
        text: "对一个敌方领袖造成 2 点伤害。"
      },
      passive: { name: "演算预载", text: "每回合第一张战术牌的行动力消耗 -2。" }
    },
    otto: {
      id: "otto",
      name: "奥托·汉瑟尔",
      short: "奥托",
      title: "帝国首相 · 铁血官僚",
      faction: "empire",
      hp: 31,
      armor: 6,
      art: "otto",
      quote: "谈判桌上拿不到的东西，火炮会替我们拿。",
      power: {
        name: "炮击",
        cost: 2,
        target: "enemy",
        text: "对一个敌方随从或敌方领袖造成 1 点伤害。"
      },
      passive: { name: "军工产线", text: "每两回合获得 1 点护甲。" }
    },
    wolfram: {
      id: "wolfram",
      name: "沃尔夫拉姆·冯·施泰因",
      short: "沃尔夫拉姆",
      title: "共和国议长 · 旧贵族",
      faction: "republic",
      hp: 35,
      armor: 10,
      art: "wolfram",
      quote: "秩序不是让所有人满意，是让所有人还能坐下。",
      power: {
        name: "筑防",
        cost: 2,
        target: "friendly",
        text: "改写一张手牌：将它变成另一张相同行动力消耗的卡牌。"
      },
      passive: { name: "铁壁纪律", text: "当一个友方随从获得拦截时，它获得 +1/+1。" }
    },
    karna: {
      id: "karna",
      name: "卡尔纳",
      short: "卡尔纳",
      title: "西昭主事者 · 血族",
      faction: "xizhao",
      hp: 34,
      armor: 9,
      art: "karna",
      quote: "我不是在威胁你。我只是在告诉你，账本上还差多少。",
      power: {
        name: "血祭",
        cost: 2,
        target: "friendly",
        text: "对一个友方随从造成 1 点伤害，抽 1 张牌。"
      },
      passive: { name: "潮汐护体", text: "你的随从不能被冻结；友方随从死亡时，你的领袖恢复 1 点生命。" }
    },
    monarch: {
      id: "monarch",
      name: "莫纳克",
      short: "莫纳克",
      title: "灰港同盟 · 引荐人",
      faction: "greyharbor",
      hp: 30,
      armor: 0,
      art: "monarch",
      quote: "守法公民，欠债必还。",
      power: {
        name: "悬赏",
        cost: 2,
        target: "enemy",
        text: "将一个敌方随从列入悬赏名单；它死亡时你抽 1 张牌。"
      },
      passive: { name: "抽成", text: "每当悬赏名单上的随从死亡，你额外获得 1 点护甲。" }
    }
  };

  const CARDS = {
    /* ===== 普卫岛 ===== */
    shextena: {
      id: "shextena", name: "希斯蒂娜", faction: "pus", type: "minion",
      cost: 4, attack: 3, health: 6, rarity: "legendary", art: "shextena",
      keywords: ["battlecry"], target: "friendly",
      text: "登场：恢复一个友方随从 4 点生命；若它原本已受伤，抽 1 张牌。",
      flavor: "温柔是有边界的。",
      battlecry: { type: "healDraw", amount: 4 }
    },
    verious: {
      id: "verious", name: "维里欧斯", faction: "pus", type: "minion",
      cost: 4, attack: 3, health: 5, rarity: "legendary", art: "verious",
      keywords: ["battlecry"], target: "enemy",
      text: "登场：沉默一个敌方随从。",
      flavor: "他教人耐心，也教人怀疑。",
      battlecry: { type: "silence" }
    },
    timon: {
      id: "timon", name: "提蒙", faction: "pus", type: "minion",
      cost: 3, attack: 2, health: 3, rarity: "legendary", art: "timon",
      keywords: ["battlecry"], target: "none",
      text: "登场：本回合你打出的下一张牌行动力消耗减少 1。",
      flavor: "晚一秒，在她这里不是小事。",
      battlecry: { type: "nextCost", amount: 1 }
    },
    aidric: {
      id: "aidric", name: "艾德里克", faction: "pus", type: "minion",
      cost: 4, attack: 2, health: 6, rarity: "legendary", art: "aidric",
      keywords: ["taunt"], target: "none",
      text: "拦截。每当此随从受到伤害，你获得 1 点护甲。",
      flavor: "克制不是不动，是不失控。",
      passive: { type: "armorOnDamage", amount: 1 }
    },
    orlicas: {
      id: "orlicas", name: "欧莉卡斯", faction: "pus", type: "minion",
      cost: 3, attack: 3, health: 3, rarity: "legendary", art: "orlicas",
      keywords: ["battlecry"], target: "none",
      text: "登场：抽 1 张牌；引脉 4：再抽 1 张牌。",
      flavor: "比起相信，她更习惯验证。",
      battlecry: { type: "drawVein", amount: 1, vein: 4, bonus: 1 }
    },
    miyuki: {
      id: "miyuki", name: "深雪", faction: "pus", type: "minion",
      cost: 5, attack: 4, health: 5, rarity: "legendary", art: "miyuki",
      keywords: ["battlecry"], target: "enemyDynamic",
      text: "登场：冻结一个敌方随从；引脉 6：改为冻结所有敌方随从。",
      flavor: "吾见过雪落，也见过雪停。",
      battlecry: { type: "freeze", allAtVein: 6 }
    },
    medic_apprentice: {
      id: "medic_apprentice", name: "医疗学徒", faction: "pus", type: "minion",
      cost: 1, attack: 1, health: 2, rarity: "common", art: null,
      keywords: ["battlecry"], target: "friendly",
      text: "登场：恢复一个友方随从 1 点生命。",
      flavor: "医疗部的灯，从来不会只亮一间房。",
      battlecry: { type: "heal", amount: 1 }
    },
    guard: {
      id: "guard", name: "保卫部卫兵", faction: "pus", type: "minion",
      cost: 3, attack: 2, health: 4, rarity: "common", art: null,
      keywords: ["taunt"], target: "none",
      text: "拦截。",
      flavor: "他站在门口，门就有了意义。"
    },
    courier: {
      id: "courier", name: "协调部信使", faction: "pus", type: "minion",
      cost: 1, attack: 1, health: 1, rarity: "common", art: null,
      keywords: ["battlecry"], target: "none",
      text: "登场：本回合你打出的下一张牌行动力消耗减少 1。",
      flavor: "她跑过的路，比地图上画的还多。",
      battlecry: { type: "nextCost", amount: 1 }
    },
    coordination: {
      id: "coordination", name: "协同调度", faction: "pus", type: "spell",
      cost: 1, rarity: "common", art: null, target: "friendly",
      text: "使一个友方随从获得 +1/+1；若它与另一个友方随从同阵位，再恢复 1 点生命。",
      flavor: "把正确的人，放在正确的位置。",
      spell: { type: "buffHeal", attack: 1, health: 1, healIfTogether: 1 }
    },
    emergency: {
      id: "emergency", name: "应急响应", faction: "pus", type: "spell",
      cost: 3, rarity: "common", art: null, target: "friendly",
      text: "恢复一个友方随从 6 点生命；抽 1 张牌。",
      flavor: "窗口只有一次，晚一秒就不是窗口。",
      spell: { type: "healDraw", amount: 6, draw: 1 }
    },
    resonance: {
      id: "resonance", name: "流脉共鸣", faction: "pus", type: "spell",
      cost: 3, rarity: "common", art: null, target: "none", excavate: 1,
      text: "抽 2 张牌；采掘 1。",
      flavor: "灯亮起来的时候，北港的雾会退半尺。",
      spell: { type: "draw", amount: 2 }
    },

    /* ===== 西昭 ===== */
    tiega: {
      id: "tiega", name: "铁牙·阿古", faction: "xizhao", type: "minion",
      cost: 4, attack: 4, health: 4, rarity: "legendary", art: "tiega",
      keywords: ["charge", "battlecry"], target: "none", bloodCost: 2,
      text: "突进。血祭 2：获得 +2 攻击。",
      flavor: "力量就该正面用。",
      battlecry: { type: "bloodAttack", amount: 2 }
    },
    lanxi: {
      id: "lanxi", name: "澜汐", faction: "xizhao", type: "minion",
      cost: 5, attack: 4, health: 4, rarity: "legendary", art: "lanxi",
      keywords: ["battlecry"], target: "none",
      text: "登场：召唤两个 1/1 洛斯汰魔物；引脉 5：使这些魔物获得拦截。",
      flavor: "我的族人还有多少活着。",
      battlecry: { type: "summonTwo", token: "losutai_imp", attack: 1, health: 1, vein: 5, tauntAtVein: true }
    },
    lize: {
      id: "lize", name: "莉泽", faction: "xizhao", type: "minion",
      cost: 1, attack: 2, health: 2, rarity: "legendary", art: "lize",
      keywords: ["battlecry"], target: "none",
      text: "登场：抽 1 张牌；若你控制另一个友方随从，对其造成 1 点伤害。",
      flavor: "人质也有自己的账。",
      battlecry: { type: "drawDamageAlly", amount: 1 }
    },
    grayfeather: {
      id: "grayfeather", name: "灰羽·乌恩", faction: "xizhao", type: "minion",
      cost: 4, attack: 4, health: 5, rarity: "legendary", art: "grayfeather",
      keywords: ["battlecry"], target: "friendly",
      text: "登场：使一个友方随从获得 +2/+2；引脉 4：再使其获得拦截。",
      flavor: "祖先的雪，落在我肩上。",
      battlecry: { type: "buffTaunt", attack: 2, health: 2, vein: 4 }
    },
    lanzhou: {
      id: "lanzhou", name: "澜舟", faction: "xizhao", type: "minion",
      cost: 1, attack: 1, health: 2, rarity: "legendary", art: "lanzhou",
      keywords: ["battlecry"], target: "none",
      text: "登场：召唤一个 1/1 洛斯汰魔物。",
      flavor: "还没觉醒，也听得见海。",
      battlecry: { type: "summon", token: "losutai_imp" }
    },
    molan: {
      id: "molan", name: "墨兰", faction: "xizhao", type: "minion",
      cost: 3, attack: 3, health: 3, rarity: "legendary", art: "molan",
      keywords: ["battlecry"], target: "friendly",
      text: "登场：使一个友方随从获得隐匿。",
      flavor: "使节先学会闭嘴。",
      battlecry: { type: "stealth" }
    },
    tribal_warrior: {
      id: "tribal_warrior", name: "部落战士", faction: "xizhao", type: "minion",
      cost: 1, attack: 2, health: 3, rarity: "common", art: null,
      keywords: ["battlecry"], target: "none", bloodCost: 1,
      text: "血祭 1：获得 +1/+1。",
      flavor: "西昭的孩子先学会握刀，再学会名字。",
      battlecry: { type: "bloodBuff", attack: 1, health: 1 }
    },
    blood_servant: {
      id: "blood_servant", name: "血族仆从", faction: "xizhao", type: "minion",
      cost: 3, attack: 3, health: 4, rarity: "common", art: null,
      keywords: ["deathrattle"], target: "none",
      text: "余响：使一个友方随从获得 +1 攻击。",
      flavor: "他还不懂主人在算什么。",
      deathrattle: { type: "buffRandomAlly", attack: 1 }
    },
    losutai_hunter: {
      id: "losutai_hunter", name: "洛斯汰猎手", faction: "xizhao", type: "minion",
      cost: 3, attack: 3, health: 3, rarity: "common", art: null,
      keywords: ["battlecry"], target: "enemy",
      text: "登场：对一个敌方随从造成 1 点伤害。",
      flavor: "它不恨谁，只是饿了。",
      battlecry: { type: "damage", amount: 1 }
    },
    blood_ritual: {
      id: "blood_ritual", name: "血祭仪式", faction: "xizhao", type: "spell",
      cost: 2, rarity: "common", art: null, target: "friendly",
      text: "对一个友方随从造成 2 点伤害，抽 1 张牌；若该随从死亡，再抽 1 张牌。",
      flavor: "血是筹码，不是生命。",
      spell: { type: "bloodDraw", damage: 1, draw: 1, extraIfDead: 1 }
    },
    monster_summon: {
      id: "monster_summon", name: "魔物召唤", faction: "xizhao", type: "spell",
      cost: 3, rarity: "common", art: null, target: "none",
      text: "召唤一个 3/3 洛斯汰魔物；引脉 4：再召唤一个 1/1 洛斯汰魔物。",
      flavor: "海里有东西应了它。",
      spell: { type: "summonMonster", vein: 4 }
    },
    shadow_raid: {
      id: "shadow_raid", name: "暗影袭扰", faction: "xizhao", type: "spell",
      cost: 2, rarity: "common", art: null, target: "friendly",
      text: "使一个友方随从获得 +2 攻击和突进。",
      flavor: "西昭不敲门。",
      spell: { type: "buffCharge", attack: 2 }
    },

    /* ===== 学院 ===== */
    karl_desmond: {
      id: "karl_desmond", name: "卡尔·德斯蒙德", faction: "academy", type: "minion",
      cost: 4, attack: 6, health: 6, rarity: "legendary", art: "karl_desmond",
      keywords: ["battlecry"], target: "none",
      text: "登场：检索一张战术牌。",
      flavor: "他不相信答案，只相信问题问得够不够好。",
      battlecry: { type: "discover", pool: "spell" }
    },
    justus: {
      id: "justus", name: "尤斯图斯·维尔纳", faction: "academy", type: "minion",
      cost: 3, attack: 4, health: 5, rarity: "legendary", art: "justus",
      keywords: ["battlecry"], target: "none",
      text: "登场：抽 1 张牌；引脉 4：再抽 1 张牌。",
      flavor: "记录不是为了记住，是为了有一天能反驳。",
      battlecry: { type: "drawVein", amount: 1, vein: 4, bonus: 1 }
    },
    cassian: {
      id: "cassian", name: "卡西安·维尔", faction: "academy", type: "minion",
      cost: 4, attack: 6, health: 5, rarity: "legendary", art: "cassian",
      keywords: ["charge"], target: "none",
      text: "突进。学院不只有辩论，也有把辩论结束的人。",
      flavor: "先动手，再写会议纪要。"
    },
    samuel: {
      id: "samuel", name: "塞缪尔·奎因", faction: "academy", type: "minion",
      cost: 2, attack: 2, health: 4, rarity: "legendary", art: "samuel",
      keywords: ["battlecry"], target: "none",
      text: "登场：抽 1 张牌。",
      flavor: "他问了七个问题，第六个让对面沉默了。",
      battlecry: { type: "draw", amount: 1 }
    },
    nina: {
      id: "nina", name: "妮娜·索雷尔", faction: "academy", type: "minion",
      cost: 2, attack: 3, health: 4, rarity: "legendary", art: "nina",
      keywords: ["battlecry"], target: "enemy",
      text: "登场：冻结一个敌方随从。",
      flavor: "冷静是一种攻击方式。",
      battlecry: { type: "freeze" }
    },
    doorman: {
      id: "doorman", name: "老门房", faction: "academy", type: "minion",
      cost: 1, attack: 1, health: 5, rarity: "common", art: "doorman",
      keywords: ["taunt"], target: "none",
      text: "拦截。",
      flavor: "他记得每一张脸，也记得谁没有登记。"
    },
    lecturer: {
      id: "lecturer", name: "学院讲师", faction: "academy", type: "minion",
      cost: 3, attack: 3, health: 4, rarity: "common", art: null,
      keywords: ["battlecry"], target: "none",
      text: "登场：抽 1 张牌。",
      flavor: "讲义第一页：不要相信讲义。",
      battlecry: { type: "draw", amount: 1 }
    },
    archive_search: {
      id: "archive_search", name: "档案检索", faction: "academy", type: "spell",
      cost: 2, rarity: "common", art: null, target: "none",
      text: "抽 2 张牌。",
      flavor: "索引比答案更值钱。",
      spell: { type: "draw", amount: 2 }
    },
    frost_seal: {
      id: "frost_seal", name: "寒霜封印", faction: "academy", type: "spell",
      cost: 2, rarity: "common", art: null, target: "enemy",
      text: "冻结一个敌方随从；抽 1 张牌。",
      flavor: "把一页纸冻住，它就不会被改写。",
      spell: { type: "freezeDraw", draw: 1 }
    },
    debate: {
      id: "debate", name: "学术辩论", faction: "academy", type: "spell",
      cost: 1, rarity: "common", art: null, target: "enemy",
      text: "对一个敌方随从造成 2 点伤害。",
      flavor: "真理越辩越明，人越辩越少。",
      spell: { type: "damage", amount: 2 }
    },
    insight: {
      id: "insight", name: "洞察", faction: "academy", type: "spell",
      cost: 1, rarity: "common", art: null, target: "none",
      text: "抽 1 张牌；采掘 1。",
      flavor: "看得越深，脚下的脉越响。",
      excavate: 1,
      spell: { type: "draw", amount: 1 }
    },
    prohibition: {
      id: "prohibition", name: "禁制令", faction: "academy", type: "spell",
      cost: 3, rarity: "common", art: null, target: "none",
      text: "冻结所有敌方随从。",
      flavor: "学院最严厉的处分，通常只是一张纸。",
      spell: { type: "freezeAll" }
    },

    /* ===== 共和国 ===== */
    konrad: {
      id: "konrad", name: "康拉德·威廉莱斯", faction: "republic", type: "minion",
      cost: 4, attack: 4, health: 6, rarity: "legendary", art: "konrad",
      keywords: ["taunt", "battlecry"], target: "none",
      text: "拦截。登场：获得 2 点护甲。",
      flavor: "城墙不是石头，是人愿意站在上面。",
      battlecry: { type: "armor", amount: 2 }
    },
    erhardt: {
      id: "erhardt", name: "埃尔哈特·冯·罗森", faction: "republic", type: "minion",
      cost: 4, attack: 4, health: 3, rarity: "legendary", art: "erhardt",
      keywords: ["charge"], target: "none",
      text: "突进。",
      flavor: "他先到，谈判随后到。"
    },
    beatrix: {
      id: "beatrix", name: "贝娅特丽克丝·冯·艾森胡特", faction: "republic", type: "minion",
      cost: 4, attack: 3, health: 6, rarity: "legendary", art: "beatrix",
      keywords: ["battlecry"], target: "friendly",
      text: "登场：使一个友方随从获得 +1/+2 与拦截。",
      flavor: "她让所有人都有座位，也记得谁没有。",
      battlecry: { type: "buffTaunt", attack: 1, health: 2 }
    },
    elena: {
      id: "elena", name: "伊莲娜·索菲", faction: "republic", type: "minion",
      cost: 3, attack: 2, health: 4, rarity: "legendary", art: "elena",
      keywords: ["battlecry"], target: "none",
      text: "登场：抽 1 张牌。",
      flavor: "每一份档案都有第二份，放在她手里。",
      battlecry: { type: "draw", amount: 1 }
    },
    hans: {
      id: "hans", name: "汉斯·冯·霍尔姆", faction: "republic", type: "minion",
      cost: 2, attack: 2, health: 3, rarity: "legendary", art: "hans",
      keywords: ["taunt"], target: "none",
      text: "拦截。",
      flavor: "他挡不住所有东西，但挡得住第一下。"
    },
    cedric: {
      id: "cedric", name: "塞德里克·威廉莱斯", faction: "republic", type: "minion",
      cost: 5, attack: 4, health: 6, rarity: "legendary", art: "cedric",
      keywords: ["taunt"], target: "none",
      text: "拦截。",
      flavor: "冠冕是重量，不是光。"
    },
    republic_guard: {
      id: "republic_guard", name: "共和国卫兵", faction: "republic", type: "minion",
      cost: 2, attack: 2, health: 3, rarity: "common", art: null,
      keywords: ["taunt"], target: "none",
      text: "拦截。",
      flavor: "站好，别让后面的人看见你退。"
    },
    shield_bearer: {
      id: "shield_bearer", name: "持盾侍从", faction: "republic", type: "minion",
      cost: 3, attack: 2, health: 4, rarity: "common", art: null,
      keywords: ["taunt"], target: "none",
      text: "拦截。",
      flavor: "盾比人先学会沉默。"
    },
    fortify: {
      id: "fortify", name: "筑防令", faction: "republic", type: "spell",
      cost: 2, rarity: "common", art: null, target: "friendly",
      text: "使一个友方随从获得 +0/+2 与拦截。",
      flavor: "先把门立住，再谈窗。",
      spell: { type: "buffTaunt", attack: 0, health: 2 }
    },
    volley: {
      id: "volley", name: "排枪齐射", faction: "republic", type: "spell",
      cost: 2, rarity: "common", art: null, target: "enemy",
      text: "对一个敌方随从造成 2 点伤害。",
      flavor: "纪律让一排枪变成一件武器。",
      spell: { type: "damage", amount: 2 }
    },
    levy: {
      id: "levy", name: "征募令", faction: "republic", type: "spell",
      cost: 3, rarity: "common", art: null, target: "none",
      text: "抽 2 张牌。",
      flavor: "名单上多一个名字，城墙上多一只手。",
      spell: { type: "draw", amount: 2 }
    },
    martial_law: {
      id: "martial_law", name: "戒严令", faction: "republic", type: "spell",
      cost: 4, rarity: "common", art: null, target: "none",
      text: "冻结所有敌方随从。",
      flavor: "钟声停下之前，谁都不许动。",
      spell: { type: "freezeAll" }
    },

    /* ===== 帝国 ===== */
    gunther: {
      id: "gunther", name: "京特·冯·艾森瓦尔德", faction: "empire", type: "minion",
      cost: 4, attack: 3, health: 5, rarity: "legendary", art: "gunther",
      keywords: ["taunt", "battlecry"], target: "none",
      text: "拦截。登场：获得 3 点护甲。",
      flavor: "帝国的城墙从不在乎谁先流血。",
      battlecry: { type: "armor", amount: 3 }
    },
    klaus: {
      id: "klaus", name: "克劳斯·莱茵哈特", faction: "empire", type: "minion",
      cost: 3, attack: 3, health: 3, rarity: "legendary", art: "klaus",
      keywords: ["taunt"], target: "none",
      text: "拦截。",
      flavor: "他的军靴比他的勋章更旧。"
    },
    mia: {
      id: "mia", name: "米娅·科尔贝", faction: "empire", type: "minion",
      cost: 2, attack: 2, health: 2, rarity: "legendary", art: "mia",
      keywords: ["battlecry"], target: "none",
      text: "登场：抽 1 张牌。",
      flavor: "她送来的信，通常比信里的内容更早决定结局。",
      battlecry: { type: "draw", amount: 1 }
    },
    elsa: {
      id: "elsa", name: "艾尔莎·汉瑟尔", faction: "empire", type: "minion",
      cost: 3, attack: 2, health: 4, rarity: "legendary", art: "elsa",
      keywords: ["battlecry"], target: "friendly",
      text: "登场：恢复一个友方随从 2 点生命。",
      flavor: "帝国的炉火不为胜利燃烧，只为活人。",
      battlecry: { type: "heal", amount: 2 }
    },
    karl_schwarz: {
      id: "karl_schwarz", name: "卡尔·冯·施瓦茨", faction: "empire", type: "minion",
      cost: 4, attack: 4, health: 3, rarity: "legendary", art: "karl_schwarz",
      keywords: ["charge"], target: "none",
      text: "突进。",
      flavor: "他相信速度能解决大多数问题，剩下的用剑。"
    },
    walter: {
      id: "walter", name: "瓦尔特·克鲁格", faction: "empire", type: "minion",
      cost: 5, attack: 4, health: 4, rarity: "legendary", art: "walter",
      keywords: ["battlecry"], target: "enemy",
      text: "登场：对一个敌方随从造成 2 点伤害。",
      flavor: "命令只有一句：推进。",
      battlecry: { type: "damage", amount: 2 }
    },
    empire_guard: {
      id: "empire_guard", name: "帝国卫兵", faction: "empire", type: "minion",
      cost: 2, attack: 2, health: 3, rarity: "common", art: null,
      keywords: ["taunt"], target: "none",
      text: "拦截。",
      flavor: "他们守的是秩序，不是某个人。"
    },
    ironclad: {
      id: "ironclad", name: "铁甲步兵", faction: "empire", type: "minion",
      cost: 3, attack: 3, health: 4, rarity: "common", art: null,
      keywords: ["taunt"], target: "none",
      text: "拦截。",
      flavor: "铁会生锈，纪律不会。"
    },
    barrage: {
      id: "barrage", name: "炮火覆盖", faction: "empire", type: "spell",
      cost: 2, rarity: "common", art: null, target: "enemy",
      text: "对一个敌方随从造成 2 点伤害。",
      flavor: "先开炮，再画地图。",
      spell: { type: "damage", amount: 2 }
    },
    mobilize: {
      id: "mobilize", name: "全国动员", faction: "empire", type: "spell",
      cost: 3, rarity: "common", art: null, target: "none",
      text: "抽 2 张牌。",
      flavor: "帝国的车轮一旦转动，就不会为一个人停下。",
      spell: { type: "draw", amount: 2 }
    },
    fortress: {
      id: "fortress", name: "要塞令", faction: "empire", type: "spell",
      cost: 2, rarity: "common", art: null, target: "friendly",
      text: "使一个友方随从获得 +0/+3 与拦截。",
      flavor: "把一个人变成一堵墙，只需要一纸命令。",
      spell: { type: "buffTaunt", attack: 0, health: 3 }
    },
    martial_court: {
      id: "martial_court", name: "军事法庭", faction: "empire", type: "spell",
      cost: 4, rarity: "common", art: null, target: "none",
      text: "冻结所有敌方随从。",
      flavor: "在帝国，沉默也是一种判决。",
      spell: { type: "freezeAll" }
    },

    /* ===== 中立 ===== */
    monarch: {
      id: "monarch", name: "莫纳克", faction: "neutral", type: "minion",
      cost: 4, attack: 4, health: 4, rarity: "legendary", art: "monarch",
      keywords: ["battlecry"], target: "none",
      text: "登场：检索一张任意阵营的可收集牌。",
      flavor: "守法公民，欠债必还。",
      battlecry: { type: "discover", pool: "any" }
    },
    gok_digger: {
      id: "gok_digger", name: "戈克采掘者", faction: "neutral", type: "minion",
      cost: 2, attack: 2, health: 2, rarity: "common", art: null,
      keywords: ["battlecry"], target: "none", excavate: 1,
      text: "采掘 1；登场：获得 2 点护甲。",
      flavor: "挖得越深，灯越亮。",
      battlecry: { type: "armor", amount: 2 }
    },
    fog_sailor: {
      id: "fog_sailor", name: "雾港水手", faction: "neutral", type: "minion",
      cost: 1, attack: 2, health: 1, rarity: "common", art: null,
      keywords: [], target: "none",
      text: "",
      flavor: "雾港不缺船，缺的是回程。"
    },
    snow_medic: {
      id: "snow_medic", name: "雪镇医者", faction: "neutral", type: "minion",
      cost: 1, attack: 1, health: 2, rarity: "common", art: null,
      keywords: ["battlecry"], target: "friendly",
      text: "登场：恢复一个友方随从 1 点生命。",
      flavor: "雪镇的药，苦，但管用。",
      battlecry: { type: "heal", amount: 1 }
    },
    sim_assistant: {
      id: "sim_assistant", name: "推演助手", faction: "neutral", type: "minion",
      cost: 2, attack: 1, health: 2, rarity: "common", art: null,
      keywords: ["battlecry"], target: "none",
      text: "登场：抽 1 张牌。",
      flavor: "档案处的第七把椅子，永远有人。",
      battlecry: { type: "draw", amount: 1 }
    },
    bard: {
      id: "bard", name: "吟游诗人", faction: "neutral", type: "minion",
      cost: 3, attack: 2, health: 3, rarity: "common", art: null,
      keywords: ["battlecry"], target: "none",
      text: "登场：抽 1 张牌；引脉 4：再抽 1 张牌。",
      flavor: "今晚流脉改道，北港的灯又暗了三分。",
      battlecry: { type: "drawVein", amount: 1, vein: 4, bonus: 1 }
    },
    blood_retainer: {
      id: "blood_retainer", name: "血族侍从", faction: "neutral", type: "minion",
      cost: 2, attack: 2, health: 2, rarity: "common", art: null,
      keywords: ["battlecry"], target: "none", bloodCost: 1,
      text: "血祭 1：获得 +1/+1。",
      flavor: "他还不懂主人在算什么。",
      battlecry: { type: "bloodBuff", attack: 1, health: 1 }
    },
    vein_prospect: {
      id: "vein_prospect", name: "流脉勘探", faction: "neutral", type: "spell",
      cost: 2, rarity: "common", art: null, target: "none", excavate: 1,
      text: "抽 1 张牌；采掘 1。",
      flavor: "先画脉，再下铲。",
      spell: { type: "draw", amount: 1 }
    },
    vein_channel: {
      id: "vein_channel", name: "流脉疏导", faction: "neutral", type: "spell",
      cost: 2, rarity: "common", art: null, target: "none",
      text: "流脉 -2（最低 0）；抽 1 张牌。",
      flavor: "会挖的人，也要会放。",
      spell: { type: "channelVein", amount: -2, draw: 1 }
    },
    mining_permit: {
      id: "mining_permit", name: "采掘许可", faction: "neutral", type: "spell",
      cost: 0, rarity: "token", art: null, target: "none", token: true,
      text: "本回合获得 2 点行动力。",
      flavor: "许可从来不是免费的。",
      spell: { type: "gainMana", amount: 2 }
    },

    vein_warden: {
      id: "vein_warden", name: "流脉守望者", faction: "neutral", type: "minion",
      cost: 3, attack: 2, health: 4, rarity: "common", art: null,
      keywords: ["taunt"], target: "none",
      text: "拦截。",
      flavor: "他守的不是门，是门后面的东西。"
    },
    mist_hound: {
      id: "mist_hound", name: "雾猎犬", faction: "neutral", type: "minion",
      cost: 2, attack: 2, health: 2, rarity: "common", art: null,
      keywords: ["charge"], target: "none",
      text: "突进。",
      flavor: "雾里有东西先动了。"
    },
    archive_scribe: {
      id: "archive_scribe", name: "档案抄写员", faction: "neutral", type: "minion",
      cost: 2, attack: 1, health: 3, rarity: "common", art: null,
      keywords: ["battlecry"], target: "none",
      text: "登场：抽 1 张牌。",
      flavor: "副本比原稿更安全。",
      battlecry: { type: "draw", amount: 1 }
    },
    field_medic: {
      id: "field_medic", name: "战地医者", faction: "neutral", type: "minion",
      cost: 2, attack: 1, health: 2, rarity: "common", art: null,
      keywords: ["battlecry"], target: "friendly",
      text: "登场：恢复一个友方随从 1 点生命。",
      flavor: "先止血，再问名字。",
      battlecry: { type: "heal", amount: 1 }
    },
    old_ledger: {
      id: "old_ledger", name: "旧账本", faction: "neutral", type: "spell",
      cost: 2, rarity: "common", art: null, target: "none", excavate: 1,
      text: "抽 1 张牌；采掘 1。",
      flavor: "有些账，翻页就会响。",
      spell: { type: "draw", amount: 1 }
    },
    vein_prism: {
      id: "vein_prism", name: "流脉棱镜", faction: "neutral", type: "spell",
      cost: 3, rarity: "common", art: null, target: "none",
      text: "抽 1 张牌；引脉 4：再抽 1 张牌。",
      flavor: "光穿过它时，会先问一句值不值。",
      spell: { type: "drawVein", amount: 1, vein: 4, bonus: 1 }
    },

    mist_scout: {
      id: "mist_scout", name: "雾境斥候", faction: "neutral", type: "minion",
      cost: 2, attack: 2, health: 2, rarity: "common", art: null,
      keywords: ["charge"], target: "none",
      text: "突进。",
      flavor: "他先看见你，你才看见雾。"
    },
    archive_guard: {
      id: "archive_guard", name: "档案守卫", faction: "neutral", type: "minion",
      cost: 2, attack: 2, health: 3, rarity: "common", art: null,
      keywords: ["taunt"], target: "none",
      text: "拦截。",
      flavor: "档案室的门比城墙难进。"
    },
    vein_medic: {
      id: "vein_medic", name: "流脉医师", faction: "neutral", type: "minion",
      cost: 2, attack: 1, health: 3, rarity: "common", art: null,
      keywords: ["battlecry"], target: "friendly",
      text: "登场：恢复一个友方随从 2 点生命。",
      flavor: "她治伤，也顺手记录脉动。",
      battlecry: { type: "heal", amount: 2 }
    },
    field_engineer: {
      id: "field_engineer", name: "战地工程师", faction: "neutral", type: "minion",
      cost: 3, attack: 2, health: 4, rarity: "common", art: null,
      keywords: ["battlecry"], target: "none",
      text: "登场：获得 2 点护甲。",
      flavor: "先搭掩体，再谈勇气。",
      battlecry: { type: "armor", amount: 2 }
    },
    caravan_guard: {
      id: "caravan_guard", name: "商队护卫", faction: "neutral", type: "minion",
      cost: 4, attack: 3, health: 5, rarity: "common", art: null,
      keywords: ["taunt"], target: "none",
      text: "拦截。",
      flavor: "货可以少，人得回去。"
    },
    mercenary: {
      id: "mercenary", name: "自由佣兵", faction: "neutral", type: "minion",
      cost: 3, attack: 3, health: 3, rarity: "common", art: null,
      keywords: [], target: "none",
      text: "没有阵营，只有价钱。",
      flavor: "他为一枚旧硬币而来。"
    },
    bounty_hunter: {
      id: "bounty_hunter", name: "赏金猎人", faction: "neutral", type: "minion",
      cost: 3, attack: 2, health: 3, rarity: "common", art: null,
      keywords: ["battlecry"], target: "enemy",
      text: "登场：对一个敌方随从造成 1 点伤害。",
      flavor: "赏金不是钱，是别人愿意付多少。",
      battlecry: { type: "damage", amount: 1 }
    },
    supply_cache: {
      id: "supply_cache", name: "补给箱", faction: "neutral", type: "spell",
      cost: 2, rarity: "common", art: null, target: "none",
      text: "抽 1 张牌。",
      flavor: "打开之前，谁都不知道里面是什么。",
      spell: { type: "draw", amount: 1 }
    },
    smoke_screen: {
      id: "smoke_screen", name: "烟雾弹", faction: "neutral", type: "spell",
      cost: 2, rarity: "common", art: null, target: "enemy",
      text: "冻结一个敌方随从；抽 1 张牌。",
      flavor: "等雾散的时候，位置已经换了。",
      spell: { type: "freezeDraw", draw: 1 }
    },
    recon: {
      id: "recon", name: "战前侦察", faction: "neutral", type: "spell",
      cost: 1, rarity: "common", art: null, target: "none", excavate: 1,
      text: "抽 1 张牌；采掘 1。",
      flavor: "地图上多画一笔，少死一个人。",
      spell: { type: "draw", amount: 1 }
    },

    /* ===== 阵营新高费 ===== */
    vein_oracle: {
      id: "vein_oracle", name: "引脉先知", faction: "pus", type: "minion",
      cost: 5, attack: 4, health: 4, rarity: "epic", art: null,
      keywords: ["battlecry"], target: "none",
      text: "登场：流脉 +1；引脉 8：抽 1 张牌。",
      flavor: "她闭着眼，却比测量员更清楚井下的走向。",
      battlecry: { type: "veinDraw", amount: 1, vein: 8, draw: 1 }
    },
    spell_echo: {
      id: "spell_echo", name: "法术回响", faction: "academy", type: "minion",
      cost: 6, attack: 3, health: 5, rarity: "epic", art: null,
      keywords: ["battlecry"], target: "none",
      text: "登场：检索一张战术牌。",
      flavor: "同一句咒文，念第二遍时总会长出新的意思。",
      battlecry: { type: "discover", pool: "spell" }
    },
    losutai_matriarch: {
      id: "losutai_matriarch", name: "洛斯汰母兽", faction: "xizhao", type: "minion",
      cost: 6, attack: 4, health: 5, rarity: "epic", art: null,
      keywords: ["deathrattle"], target: "none",
      text: "余响：召唤两个 1/1 的洛斯汰魔物。",
      flavor: "潮水退去时，她已经把巢筑在船舱下面。",
      deathrattle: { type: "summon", token: "losutai_imp", count: 2 }
    },
    shield_marshal: {
      id: "shield_marshal", name: "持盾元帅", faction: "republic", type: "minion",
      cost: 6, attack: 4, health: 6, rarity: "epic", art: null,
      keywords: ["taunt", "battlecry"], target: "friendly",
      text: "拦截。登场：使一个友方随从获得拦截。",
      flavor: "她从不站在队伍后面，只把队伍挡在身后。",
      battlecry: { type: "buffTaunt", attack: 0, health: 0 }
    },
    siege_train: {
      id: "siege_train", name: "攻城列车", faction: "empire", type: "minion",
      cost: 7, attack: 5, health: 7, rarity: "epic", art: null,
      keywords: ["battlecry"], target: "none",
      text: "登场：对所有敌方随从造成 2 点伤害。",
      flavor: "帝国的铁轨铺到哪里，哪里就会先听见风声。",
      battlecry: { type: "damageAllEnemies", amount: 2 }
    },
    void_titan: {
      id: "void_titan", name: "虚空泰坦", faction: "neutral", type: "minion",
      cost: 10, attack: 8, health: 8, rarity: "legendary", art: null,
      keywords: ["battlecry"], target: "enemy",
      text: "登场：消灭一个敌方随从。",
      flavor: "它没有影子，因为影子先被它吞掉了。",
      battlecry: { type: "destroy" }
    },

    /* ===== 流脉双向 ===== */
    borrow_vein: {
      id: "borrow_vein", name: "借脉", faction: "academy", type: "spell",
      cost: 1, rarity: "rare", art: null, target: "none",
      text: "本回合获得 2 行动力；你的回合结束时流脉 +2。",
      flavor: "先借明天的蓝，再还昨天的债。",
      spell: { type: "borrowVein", mana: 2, debt: 2 }
    },
    reflux: {
      id: "reflux", name: "逆流", faction: "xizhao", type: "spell",
      cost: 2, rarity: "rare", art: null, target: "none",
      text: "流脉 -3；恢复你的领袖 3 点生命。",
      flavor: "潮水退回去时，也会把伤口一起带走。",
      spell: { type: "veinTrade", amount: -3, healHero: 3 }
    },
    stabilize: {
      id: "stabilize", name: "镇脉", faction: "republic", type: "spell",
      cost: 2, rarity: "rare", art: null, target: "none",
      text: "流脉 -2；获得 4 点护甲。",
      flavor: "秩序的工作，就是让河流按堤坝走。",
      spell: { type: "veinTrade", amount: -2, armor: 4 }
    },
    pressure_vein: {
      id: "pressure_vein", name: "压脉", faction: "empire", type: "spell",
      cost: 2, rarity: "rare", art: null, target: "none",
      text: "流脉 -3；对敌方领袖造成 2 点伤害。",
      flavor: "把地脉压进炮膛，然后扣下扳机。",
      spell: { type: "veinTrade", amount: -3, damageHero: 2 }
    },
    return_tide: {
      id: "return_tide", name: "回潮", faction: "pus", type: "spell",
      cost: 2, rarity: "rare", art: null, target: "none",
      text: "流脉 -2；恢复你的领袖 2 点生命；抽 1 张牌。",
      flavor: "退潮不是结束，是把力量收回身体里。",
      spell: { type: "veinTrade", amount: -2, healHero: 2, draw: 1 }
    },

    /* ===== 阵型 ===== */
    formation_vein: {
      id: "formation_vein", name: "地脉阵线", faction: "pus", type: "formation",
      cost: 3, rarity: "rare", art: null, target: "none",
      text: "阵型：该阵位友方随从获得 +0/+1。",
      flavor: "让地脉从脚下经过，而不是从头顶。",
      formation: { attack: 0, health: 1 }
    },
    formation_script: {
      id: "formation_script", name: "演算阵线", faction: "academy", type: "formation",
      cost: 3, rarity: "rare", art: null, target: "none",
      text: "阵型：该阵位友方随从获得 +1/+0。",
      flavor: "先画线，再让人站进去。",
      formation: { attack: 1, health: 0 }
    },
    formation_tide: {
      id: "formation_tide", name: "潮痕阵线", faction: "xizhao", type: "formation",
      cost: 3, rarity: "rare", art: null, target: "none",
      text: "阵型：该阵位友方随从获得 +1/+0。",
      flavor: "潮水退去后，留下的痕迹就是战壕。",
      formation: { attack: 1, health: 0 }
    },
    formation_wall: {
      id: "formation_wall", name: "盾墙阵线", faction: "republic", type: "formation",
      cost: 3, rarity: "rare", art: null, target: "none",
      text: "阵型：该阵位友方随从获得 +0/+2。",
      flavor: "阵线不是一条线，是一排不会退的人。",
      formation: { attack: 0, health: 2 }
    },
    formation_cannon: {
      id: "formation_cannon", name: "炮列阵线", faction: "empire", type: "formation",
      cost: 4, rarity: "rare", art: null, target: "none",
      text: "阵型：该阵位友方随从获得 +1/+1。",
      flavor: "把炮摆成一条线，敌人就只剩一个方向。",
      formation: { attack: 1, health: 1 }
    },

    /* ===== 遗物 / 阵位机制 ===== */
    vein_heart: {
      id: "vein_heart", name: "地脉之心", faction: "pus", type: "relic",
      cost: 3, rarity: "epic", art: null, target: "none",
      text: "遗物：每当流脉增加时，获得 1 点护甲。",
      flavor: "它跳动的节奏，和城下的地脉一模一样。"
    },
    spell_codex: {
      id: "spell_codex", name: "留存法典", faction: "academy", type: "relic",
      cost: 3, rarity: "epic", art: null, target: "none",
      text: "遗物：每个你的回合，第一张战术牌的行动力消耗 -1。",
      flavor: "法术释放之后，公式会留在书页上。"
    },
    blood_scythe: {
      id: "blood_scythe", name: "血潮镰", faction: "xizhao", type: "relic",
      cost: 3, rarity: "epic", art: null, target: "none",
      text: "遗物：友方随从死亡时，你的领袖恢复 2 点生命。",
      flavor: "每一道潮痕都是收割过的名字。"
    },
    iron_banner: {
      id: "iron_banner", name: "铁壁军旗", faction: "republic", type: "relic",
      cost: 3, rarity: "epic", art: null, target: "none",
      text: "遗物：你召唤的拦截随从获得 +0/+1。",
      flavor: "旗子插在哪里，哪里就是阵线。"
    },
    powder_engine: {
      id: "powder_engine", name: "火药引擎", faction: "empire", type: "relic",
      cost: 4, rarity: "epic", art: null, target: "none",
      text: "遗物：你的回合开始时若敌方领袖没有护甲，造成 1 点伤害。",
      flavor: "它不需要瞄准，只需要一直转。"
    },
    zone_keeper: {
      id: "zone_keeper", name: "同阵守望者", faction: "pus", type: "minion",
      cost: 3, attack: 2, health: 4, rarity: "rare", art: null,
      keywords: ["battlecry"], target: "none",
      text: "登场：若同阵位有另一个友方随从，获得 +2/+2。",
      flavor: "阵位不是格子，是彼此能看见的距离。",
      battlecry: { type: "zoneSelfBuff", attack: 2, health: 2 }
    },
    zone_archivist: {
      id: "zone_archivist", name: "三阵记录员", faction: "academy", type: "minion",
      cost: 3, attack: 2, health: 3, rarity: "rare", art: null,
      keywords: ["battlecry"], target: "none",
      text: "登场：若三个友方阵位都有随从，抽 1 张牌。",
      flavor: "三个阵位都在场，答案才有地方落笔。",
      battlecry: { type: "drawIfZones", draw: 1 }
    },
    zone_reaper: {
      id: "zone_reaper", name: "断阵收割者", faction: "xizhao", type: "minion",
      cost: 4, attack: 3, health: 3, rarity: "epic", art: null,
      keywords: ["battlecry"], target: "enemy",
      text: "登场：消灭目标所在阵位的所有敌方随从。",
      flavor: "它不追人，只切断人站在一起的那条线。",
      battlecry: { type: "destroyZone" }
    },
    zone_banner: {
      id: "zone_banner", name: "阵线旗手", faction: "republic", type: "minion",
      cost: 4, attack: 3, health: 6, rarity: "epic", art: null,
      keywords: ["taunt", "battlecry"], target: "none",
      text: "拦截。登场：同阵位所有具有拦截的友方随从获得 +0/+1。",
      flavor: "旗手站的位置，就是所有人最后退到的地方。",
      battlecry: { type: "buffTauntZone", health: 1 }
    },
    zone_barrage: {
      id: "zone_barrage", name: "阵位齐射", faction: "empire", type: "spell",
      cost: 4, rarity: "epic", art: null, target: "enemy",
      text: "对一个敌方随从所在阵位的所有敌方随从造成 2 点伤害。",
      flavor: "帝国的炮火从不瞄准一个人。",
      spell: { type: "damageZone", amount: 2 }
    },

    /* ===== 关键词扩展 ===== */
    vein_bulwark: {
      id: "vein_bulwark", name: "引脉壁垒", faction: "pus", type: "minion",
      cost: 4, attack: 3, health: 5, rarity: "epic", art: null,
      keywords: ["divineShield", "lifesteal"], target: "none",
      text: "护幕，汲取。",
      flavor: "他把自己变成了一堵会流血的墙。",
    },
    overload_ritual: {
      id: "overload_ritual", name: "反噬仪式", faction: "pus", type: "spell",
      cost: 2, rarity: "rare", art: null, target: "enemy", overload: 2,
      text: "对一个敌方随从造成 4 点伤害；反噬 2。",
      flavor: "借来的力量，明天要还。",
      spell: { type: "damage", amount: 4 }
    },
    aegis_guard: {
      id: "aegis_guard", name: "护幕守卫", faction: "republic", type: "minion",
      cost: 5, attack: 4, health: 5, rarity: "epic", art: null,
      keywords: ["divineShield", "taunt"], target: "none",
      text: "护幕，拦截。",
      flavor: "第一下打不穿，第二下才有资格谈条件。",
    },
    wind_cannon: {
      id: "wind_cannon", name: "风压炮", faction: "empire", type: "minion",
      cost: 5, attack: 4, health: 4, rarity: "epic", art: null,
      keywords: ["windfury"], target: "none",
      text: "连动。",
      flavor: "第一炮是警告，第二炮才是回答。",
    },
    venom_fang: {
      id: "venom_fang", name: "毒潮獠牙", faction: "xizhao", type: "minion",
      cost: 3, attack: 2, health: 2, rarity: "rare", art: null,
      keywords: ["poisonous"], target: "none",
      text: "蚀毒。",
      flavor: "被它咬中的东西，最后都会沉进潮里。",
    },
    rebirth_serpent: {
      id: "rebirth_serpent", name: "回潮潮蛇", faction: "xizhao", type: "minion",
      cost: 5, attack: 4, health: 4, rarity: "epic", art: null,
      keywords: ["reborn"], target: "none",
      text: "回潮。",
      flavor: "潮水退一次，它就换一层皮。",
    },
    rush_lancer: {
      id: "rush_lancer", name: "袭扰枪骑", faction: "empire", type: "minion",
      cost: 3, attack: 3, health: 2, rarity: "rare", art: null,
      keywords: ["rush"], target: "none",
      text: "袭扰。",
      flavor: "他只负责第一下，第二下交给后面的人。",
    },
    combo_spark: {
      id: "combo_spark", name: "顺势火花", faction: "academy", type: "spell",
      cost: 2, rarity: "rare", art: null, target: "enemy",
      text: "对一个敌方随从造成 1 点伤害；顺势：改为 3 点。",
      flavor: "第一下是引子，第二下才是句子。",
      spell: { type: "comboDamage", amount: 3, otherwise: 1 }
    },

    /* ===== 一费与蓄能：阵营扩展 ===== */
    vein_scout: {
      id: "vein_scout", name: "引脉斥候", faction: "pus", type: "minion",
      cost: 1, attack: 1, health: 2, rarity: "common", art: null,
      keywords: ["battlecry"], target: "none",
      text: "登场：流脉 +1。",
      flavor: "他跑得比地脉还快，至少他自己这么认为。",
      battlecry: { type: "veinOnly", amount: 1 }
    },
    vein_channeler: {
      id: "vein_channeler", name: "引脉导流者", faction: "pus", type: "minion",
      cost: 2, attack: 2, health: 2, rarity: "rare", art: null,
      keywords: ["battlecry"], target: "none",
      text: "登场：本回合获得 1 行动力；流脉 +1。",
      flavor: "她把地脉接进自己的手臂，只借一回合。",
      battlecry: { type: "rampMana", amount: 1, vein: 1 }
    },
    excavation_titan: {
      id: "excavation_titan", name: "掘脉泰坦", faction: "pus", type: "minion",
      cost: 7, attack: 5, health: 7, rarity: "epic", art: null,
      keywords: ["battlecry"], target: "none",
      text: "登场：流脉 +1；引脉 8：获得 +2/+2 和拦截。",
      flavor: "它挖穿的不是岩层，是世界的血管。",
      battlecry: { type: "veinBuff", amount: 1, vein: 8, attack: 2, health: 2 }
    },
    spell_novice: {
      id: "spell_novice", name: "法术学徒", faction: "academy", type: "minion",
      cost: 1, attack: 1, health: 2, rarity: "common", art: null,
      keywords: ["battlecry"], target: "none",
      text: "登场：本回合你的下一张法术行动力消耗 -1。",
      flavor: "她只学会了一个咒语，但学会了怎么省着用。",
      battlecry: { type: "discountSpell", amount: 1 }
    },
    mana_surge: {
      id: "mana_surge", name: "奥能涌动", faction: "academy", type: "spell",
      cost: 1, rarity: "rare", art: null, target: "none",
      text: "本回合获得 2 行动力。",
      flavor: "把明天的力气今天用完。",
      spell: { type: "rampSpell", amount: 2 }
    },
    arcane_conduit: {
      id: "arcane_conduit", name: "奥术导管", faction: "academy", type: "minion",
      cost: 4, attack: 3, health: 4, rarity: "rare", art: null,
      keywords: ["passive"], target: "none",
      text: "被动：每当你施放一张战术牌，获得 1 点护甲。",
      flavor: "她把每次施法都接进了学院的护盾回路。",
      passive: { type: "spellArmor", amount: 1 }
    },
    blood_imp: {
      id: "blood_imp", name: "血潮小鬼", faction: "xizhao", type: "minion",
      cost: 1, attack: 2, health: 1, rarity: "common", art: null,
      keywords: ["deathrattle"], target: "none",
      text: "余响：召唤一个 1/1 的洛斯汰魔物。",
      flavor: "它死的时候，潮水会替它叫一声。",
      deathrattle: { type: "summon", token: "losutai_imp" }
    },
    blood_pact: {
      id: "blood_pact", name: "血契", faction: "xizhao", type: "spell",
      cost: 2, rarity: "rare", art: null, target: "none",
      text: "支付 2 点生命，召唤两个 1/1 的洛斯汰魔物。",
      flavor: "签名的地方不是纸，是手腕。",
      spell: { type: "bloodSummon", health: 2, token: "losutai_imp", count: 2 }
    },
    blood_priestess: {
      id: "blood_priestess", name: "血潮祭司", faction: "xizhao", type: "minion",
      cost: 5, attack: 4, health: 5, rarity: "epic", art: null,
      keywords: ["battlecry"], target: "none",
      text: "登场：吞噬一个攻击力最低的友方随从，获得其攻击力和生命值。",
      flavor: "潮水退去时，她总会留下最饱的那一个。",
      battlecry: { type: "devour" }
    },
    shield_recruit: {
      id: "shield_recruit", name: "盾墙新兵", faction: "republic", type: "minion",
      cost: 1, attack: 1, health: 3, rarity: "common", art: null,
      keywords: ["taunt"], target: "none",
      text: "拦截。",
      flavor: "盾比人高，胆子还在长。",
    },
    drill_sergeant: {
      id: "drill_sergeant", name: "操练军士", faction: "republic", type: "minion",
      cost: 2, attack: 2, health: 2, rarity: "rare", art: null,
      keywords: ["battlecry"], target: "friendly",
      text: "登场：使一个友方随从获得拦截和 +0/+1。",
      flavor: "他不需要你理解命令，只需要你站到位置上。",
      battlecry: { type: "buffTaunt", health: 1 }
    },
    iron_phalanx: {
      id: "iron_phalanx", name: "铁壁方阵", faction: "republic", type: "minion",
      cost: 5, attack: 3, health: 8, rarity: "epic", art: null,
      keywords: ["taunt", "battlecry"], target: "none",
      text: "拦截。登场：每有一个友方拦截随从，获得 1 点护甲。",
      flavor: "方阵不是一排人，是一堵会呼吸的墙。",
      battlecry: { type: "armorPerTaunt", amount: 1 }
    },
    powder_boy: {
      id: "powder_boy", name: "火药小工", faction: "empire", type: "minion",
      cost: 1, attack: 1, health: 2, rarity: "common", art: null,
      keywords: ["battlecry"], target: "none",
      text: "登场：获得 1 点护甲。",
      flavor: "他负责搬火药，也负责跑得比火药快。",
      battlecry: { type: "armor", amount: 1 }
    },
    iron_engineer: {
      id: "iron_engineer", name: "铁流工兵", faction: "empire", type: "minion",
      cost: 2, attack: 2, health: 3, rarity: "rare", art: null,
      keywords: ["battlecry"], target: "none",
      text: "登场：获得 2 点护甲。",
      flavor: "他的工具箱里没有锤子，只有备用装甲。",
      battlecry: { type: "armor", amount: 2 }
    },
    siege_captain: {
      id: "siege_captain", name: "攻城队长", faction: "empire", type: "minion",
      cost: 5, attack: 4, health: 5, rarity: "epic", art: null,
      keywords: ["battlecry"], target: "none",
      text: "登场：对所有敌方随从造成 1 点伤害。",
      flavor: "他管这叫校准，不叫开火。",
      battlecry: { type: "damageAllEnemies", amount: 1 }
    },

    /* ===== 阵营扩展 ===== */
    vein_surveyor: {
      id: "vein_surveyor", name: "引脉勘测员", faction: "pus", type: "minion",
      cost: 4, attack: 3, health: 4, rarity: "epic", art: null,
      keywords: ["battlecry"], target: "none",
      text: "登场：流脉 +2；引脉 8：获得 +2/+2 和拦截。",
      flavor: "她画的地图会自己长出新矿脉。",
      battlecry: { type: "veinBuff", amount: 2, vein: 8, attack: 2, health: 2 }
    },
    siphon_guard: {
      id: "siphon_guard", name: "虹吸守卫", faction: "pus", type: "minion",
      cost: 5, attack: 3, health: 6, rarity: "epic", art: null,
      keywords: ["taunt", "battlecry"], target: "none",
      text: "拦截。登场：恢复你的领袖 3 点生命；流脉 +1。",
      flavor: "他守住的每一滴血，最后都会回到地脉里。",
      battlecry: { type: "healVein", heal: 3, vein: 1 }
    },
    arcane_theorist: {
      id: "arcane_theorist", name: "奥术理论家", faction: "academy", type: "minion",
      cost: 3, attack: 2, health: 3, rarity: "epic", art: null,
      keywords: ["battlecry"], target: "none",
      text: "登场：若本回合你施放过战术牌，检索一张战术牌。",
      flavor: "他证明了一切，除了自己为什么还没毕业。",
      battlecry: { type: "spellDiscover", pool: "spell" }
    },
    frost_professor: {
      id: "frost_professor", name: "霜系教授", faction: "academy", type: "minion",
      cost: 5, attack: 4, health: 5, rarity: "epic", art: null,
      keywords: ["battlecry"], target: "enemy",
      text: "登场：冻结一个敌方随从。",
      flavor: "他的课堂很安静，因为没人敢动。",
      battlecry: { type: "freeze" }
    },
    blood_altar: {
      id: "blood_altar", name: "血祭祭坛", faction: "xizhao", type: "spell",
      cost: 2, rarity: "epic", art: null, target: "none",
      text: "消灭一个攻击力最低的友方随从，召唤两个 1/1 的洛斯汰魔物。",
      flavor: "潮水从不浪费祭品。",
      spell: { type: "sacrificeSummon", token: "losutai_imp", count: 2 }
    },
    tide_colossus: {
      id: "tide_colossus", name: "潮骸巨像", faction: "xizhao", type: "minion",
      cost: 7, attack: 6, health: 6, rarity: "epic", art: null,
      keywords: ["battlecry"], target: "none",
      text: "登场：吞噬一个攻击力最低的友方随从，获得其攻击力和生命值。",
      flavor: "它把整片浅海穿在身上。",
      battlecry: { type: "devour" }
    },
    shield_sergeant: {
      id: "shield_sergeant", name: "盾墙军士", faction: "republic", type: "minion",
      cost: 4, attack: 3, health: 5, rarity: "epic", art: null,
      keywords: ["taunt", "battlecry"], target: "none",
      text: "拦截。登场：所有友方拦截随从获得 +0/+1。",
      flavor: "军士的盾比他的命令更早到前线。",
      battlecry: { type: "buffAllTaunt", health: 1 }
    },
    iron_wall: {
      id: "iron_wall", name: "铁壁令", faction: "republic", type: "spell",
      cost: 4, rarity: "epic", art: null, target: "none",
      text: "所有友方拦截随从获得 +0/+2。",
      flavor: "共和国最坚固的墙，是一条命令。",
      spell: { type: "buffAllTaunt", health: 2 }
    },
    armor_volley: {
      id: "armor_volley", name: "装甲齐射", faction: "empire", type: "spell",
      cost: 4, rarity: "epic", art: null, target: "none",
      text: "对所有敌方随从造成等同于你护甲的伤害。",
      flavor: "每增加一层装甲，炮口就多一分底气。",
      spell: { type: "armorAoe" }
    },
    powder_marshal: {
      id: "powder_marshal", name: "火药元帅", faction: "empire", type: "minion",
      cost: 5, attack: 4, health: 5, rarity: "epic", art: null,
      keywords: ["battlecry"], target: "none",
      text: "登场：获得 3 点护甲。",
      flavor: "他闻火药的味道，就像别人闻花香。",
      battlecry: { type: "armor", amount: 3 }
    },

    /* ===== 阵营机制补全 ===== */
    vein_siphon: {
      id: "vein_siphon", name: "引脉虹吸", faction: "pus", type: "spell",
      cost: 3, rarity: "epic", art: null, target: "none",
      text: "恢复你的领袖 3 点生命；流脉 +2。",
      flavor: "她把手按进裂隙，听见地底在呼吸。",
      spell: { type: "healVein", heal: 3, vein: 2 }
    },
    arcane_surge: {
      id: "arcane_surge", name: "奥术涌流", faction: "academy", type: "spell",
      cost: 5, rarity: "epic", art: null, target: "none",
      text: "对所有敌方随从造成 1 点伤害；本回合你每施放一张战术牌，再造成 1 点。",
      flavor: "第一声是提醒，第二声是答案，第三声是屋顶。",
      spell: { type: "damageAllPerSpell", amount: 1 }
    },
    devourer: {
      id: "devourer", name: "噬潮者", faction: "xizhao", type: "minion",
      cost: 4, attack: 4, health: 4, rarity: "epic", art: null,
      keywords: ["battlecry"], target: "none",
      text: "登场：吞噬一个攻击力最低的友方随从，获得其攻击力和生命值。",
      flavor: "潮水退去后，它会把没来得及走的同伴一起带走。",
      battlecry: { type: "devour" }
    },
    phalanx_warden: {
      id: "phalanx_warden", name: "方阵守望", faction: "republic", type: "minion",
      cost: 4, attack: 2, health: 7, rarity: "epic", art: null,
      keywords: ["taunt", "battlecry"], target: "none",
      text: "拦截。登场：所有友方拦截随从获得 +0/+1。",
      flavor: "她守的不是城门，是城门后面还在睡觉的人。",
      battlecry: { type: "buffAllTaunt", health: 1 }
    },
    iron_artillery: {
      id: "iron_artillery", name: "铁流炮台", faction: "empire", type: "minion",
      cost: 6, attack: 4, health: 5, rarity: "epic", art: null,
      keywords: ["battlecry"], target: "enemy",
      text: "登场：对一个敌方随从造成等同于你护甲的伤害。",
      flavor: "炮台不需要瞄准，它只需要敌人站得足够久。",
      battlecry: { type: "armorDamage" }
    },
    vein_leviathan: {
      id: "vein_leviathan", name: "流脉利维坦", faction: "neutral", type: "minion",
      cost: 9, attack: 7, health: 7, rarity: "legendary", art: null,
      keywords: ["battlecry"], target: "none",
      text: "登场：流脉 +1；引脉 10：获得 +2/+2 和拦截。",
      flavor: "它不是从海里来的，是从世界底下的血管里浮上来的。",
      battlecry: { type: "veinBuff", amount: 1, vein: 10, attack: 2, health: 2 }
    },

    /* ===== 机制新卡 ===== */
    spellstorm: {
      id: "spellstorm", name: "法术风暴", faction: "academy", type: "spell",
      cost: 6, rarity: "epic", art: null, target: "none",
      text: "对敌方领袖造成 2×本回合已施放法术数量的伤害。",
      flavor: "她数到第三声回响时，屋顶已经开始下雨。",
      spell: { type: "damagePerSpell", amount: 2 }
    },
    echo_adept: {
      id: "echo_adept", name: "回响学徒", faction: "academy", type: "minion",
      cost: 4, attack: 3, health: 3, rarity: "epic", art: null,
      keywords: ["passive"], target: "none",
      text: "被动：每当你施放一张战术牌，获得 +1/+1。",
      flavor: "同一个咒语念三遍，第三遍会自己回答。",
      passive: { type: "spellGrowth", attack: 1, health: 1 }
    },
    vein_engineer: {
      id: "vein_engineer", name: "引脉工程师", faction: "pus", type: "minion",
      cost: 4, attack: 3, health: 4, rarity: "epic", art: null,
      keywords: ["battlecry"], target: "none",
      text: "登场：流脉 +2；引脉 6：获得 +1/+1。",
      flavor: "她不是在设计机器，是在给地脉接血管。",
      battlecry: { type: "veinBuff", amount: 2, vein: 6, attack: 1, health: 1 }
    },
    brood_matron: {
      id: "brood_matron", name: "育巢母兽", faction: "xizhao", type: "minion",
      cost: 4, attack: 3, health: 4, rarity: "epic", art: null,
      keywords: ["battlecry"], target: "none",
      text: "登场：召唤一个 1/1 的洛斯汰魔物；若你控制另一个随从，它获得 +1/+1。",
      flavor: "潮水退去时，她把整座巢一起带上岸。",
      battlecry: { type: "summonTokenBuff", token: "losutai_imp", attack: 1, health: 1 }
    },
    bastion_captain: {
      id: "bastion_captain", name: "堡垒队长", faction: "republic", type: "minion",
      cost: 5, attack: 3, health: 6, rarity: "epic", art: null,
      keywords: ["battlecry"], target: "none",
      text: "登场：使所有友方随从获得拦截和 +0/+1。",
      flavor: "她守过的每一道墙，最后都变成了人。",
      battlecry: { type: "buffAllTaunt", health: 1 }
    },
    powder_keg: {
      id: "powder_keg", name: "火药桶", faction: "empire", type: "minion",
      cost: 3, attack: 1, health: 4, rarity: "epic", art: null,
      keywords: ["deathrattle"], target: "none",
      text: "余响：对所有敌方随从造成 3 点伤害。",
      flavor: "帝国工兵手册第一条：不要写第二条。",
      deathrattle: { type: "damageAllEnemies", amount: 3 }
    },
    chrono_scholar: {
      id: "chrono_scholar", name: "时序学者", faction: "neutral", type: "minion",
      cost: 6, attack: 4, health: 5, rarity: "epic", art: null,
      keywords: ["battlecry"], target: "none",
      text: "登场：若本回合你施放过战术牌，抽 1 张牌。",
      flavor: "他研究时间，是为了把学费拖到下周。",
      battlecry: { type: "spellDraw", draw: 1 }
    },

    /* ===== 高费中立 ===== */
    obsidian_colossus: {
      id: "obsidian_colossus", name: "黑曜巨像", faction: "neutral", type: "minion",
      cost: 9, attack: 7, health: 8, rarity: "legendary", art: null,
      keywords: ["taunt", "deathrattle"], target: "none",
      text: "拦截。余响：召唤一个 3/3 的黑曜碎片。",
      flavor: "它从地底站起来时，整座矿脉都跟着呼吸。",
      deathrattle: { type: "summon", token: "obsidian_spawn" }
    },
    world_serpent: {
      id: "world_serpent", name: "世界之蛇", faction: "neutral", type: "minion",
      cost: 10, attack: 8, health: 8, rarity: "legendary", art: null,
      keywords: ["battlecry"], target: "none",
      text: "登场：对所有敌方随从造成 4 点伤害；引脉 7：再抽 1 张牌。",
      flavor: "它绕世界一圈，只是为了咬住自己的尾巴。",
      battlecry: { type: "damageAllEnemiesDraw", amount: 4, vein: 7, draw: 1 }
    },
    faceless_king: {
      id: "faceless_king", name: "无面君王", faction: "neutral", type: "minion",
      cost: 9, attack: 6, health: 6, rarity: "legendary", art: null,
      keywords: ["battlecry"], target: "friendly",
      text: "登场：复制一个友方随从。",
      flavor: "王座之上没有脸，只有另一个人的影子。",
      battlecry: { type: "copyFriendly" }
    },
    chrono_archivist: {
      id: "chrono_archivist", name: "时序档案官", faction: "neutral", type: "minion",
      cost: 8, attack: 6, health: 7, rarity: "epic", art: null,
      keywords: ["battlecry"], target: "enemy",
      text: "登场：将一个敌方随从移回其手牌。",
      flavor: "每一页都写着同一天，只是墨迹不同。",
      battlecry: { type: "returnToHand" }
    },
    frost_leviathan: {
      id: "frost_leviathan", name: "霜潮利维坦", faction: "neutral", type: "minion",
      cost: 8, attack: 6, health: 7, rarity: "epic", art: null,
      keywords: ["battlecry"], target: "none",
      text: "登场：冻结所有敌方随从。",
      flavor: "港口的人说，那不是浪，是它在翻身。",
      battlecry: { type: "freezeAllEnemies" }
    },
    vein_behemoth: {
      id: "vein_behemoth", name: "流脉巨兽", faction: "neutral", type: "minion",
      cost: 8, attack: 6, health: 8, rarity: "epic", art: null,
      keywords: ["battlecry"], target: "none",
      text: "登场：流脉 +2；引脉 7：获得 +2/+2 和拦截。",
      flavor: "它把流脉当作血管，把矿洞当作胸腔。",
      battlecry: { type: "veinBuff", amount: 2, vein: 7, attack: 2, health: 2 }
    },
    twin_weaver: {
      id: "twin_weaver", name: "双生织命者", faction: "neutral", type: "minion",
      cost: 7, attack: 5, health: 5, rarity: "epic", art: null,
      keywords: ["battlecry"], target: "none",
      text: "登场：召唤一个自身的复制。",
      flavor: "她们从不吵架，因为意见总是同一个。",
      battlecry: { type: "summonSelfCopy" }
    },
    archive_devourer: {
      id: "archive_devourer", name: "档案吞噬者", faction: "neutral", type: "minion",
      cost: 7, attack: 5, health: 6, rarity: "epic", art: null,
      keywords: ["battlecry"], target: "enemy",
      text: "登场：沉默一个敌方随从；抽 1 张牌。",
      flavor: "它吃掉的不是纸，是纸上写着的名字。",
      battlecry: { type: "silenceDraw", draw: 1 }
    },
    astral_colossus: {
      id: "astral_colossus", name: "星界巨像", faction: "neutral", type: "minion",
      cost: 6, attack: 4, health: 7, rarity: "epic", art: null,
      keywords: ["taunt", "battlecry"], target: "none",
      text: "拦截。登场：获得 4 点护甲。",
      flavor: "它体内装着一整片没有名字的星空。",
      battlecry: { type: "armor", amount: 4 }
    },
    grave_titan: {
      id: "grave_titan", name: "墓钟泰坦", faction: "neutral", type: "minion",
      cost: 9, attack: 7, health: 7, rarity: "legendary", art: null,
      keywords: ["deathrattle"], target: "none",
      text: "余响：召唤一个 5/5 的墓钟守卫。",
      flavor: "钟声每响一次，就有一个名字从石头上醒来。",
      deathrattle: { type: "summon", token: "grave_guard" }
    },
    moonfall: {
      id: "moonfall", name: "群星坠落", faction: "neutral", type: "spell",
      cost: 8, rarity: "epic", art: null, target: "none",
      text: "对所有敌方随从造成 4 点伤害；抽 1 张牌。",
      flavor: "那一夜，天空把所有的灯都扔了下来。",
      spell: { type: "damageAllEnemiesDraw", amount: 4, draw: 1 }
    },
    final_bell: {
      id: "final_bell", name: "终末钟声", faction: "neutral", type: "spell",
      cost: 10, rarity: "legendary", art: null, target: "none",
      text: "对所有随从造成 5 点伤害。",
      flavor: "最后一响之后，没有人再需要计时。",
      spell: { type: "damageAll", amount: 5 }
    },
    time_reflux: {
      id: "time_reflux", name: "时间回流", faction: "neutral", type: "spell",
      cost: 9, rarity: "epic", art: null, target: "none",
      text: "将所有敌方随从移回其手牌。",
      flavor: "时间不是河流，是一扇被反复推开的门。",
      spell: { type: "returnAllEnemies" }
    },
    astral_gate: {
      id: "astral_gate", name: "星门", faction: "neutral", type: "spell",
      cost: 7, rarity: "epic", art: null, target: "none",
      text: "召唤两个 3/3 的星界守卫。",
      flavor: "门后没有远方，只有另一种现在。",
      spell: { type: "summonTwoTokens", token: "astral_guardian", count: 2 }
    },
    vein_tithe: {
      id: "vein_tithe", name: "流脉什一税", faction: "neutral", type: "spell",
      cost: 6, rarity: "epic", art: null, target: "none",
      text: "获得 5 点护甲；流脉 +3；抽 1 张牌。",
      flavor: "每一道流脉都要上交它最亮的一滴。",
      spell: { type: "armorVeinDraw", armor: 5, vein: 3, draw: 1 }
    },

    /* ===== 衍生物 ===== */
    losutai_imp: {
      id: "losutai_imp", name: "洛斯汰魔物", faction: "xizhao", type: "minion",
      cost: 0, attack: 1, health: 1, rarity: "token", art: null,
      keywords: [], target: "none", text: "", flavor: "从潮汐里爬出来的小家伙。", token: true
    },
    losutai_beast: {
      id: "losutai_beast", name: "洛斯汰巨兽", faction: "xizhao", type: "minion",
      cost: 0, attack: 3, health: 3, rarity: "token", art: null,
      keywords: [], target: "none", text: "", flavor: "它记得海，也记得谁把它叫上来。", token: true
    },
    obsidian_spawn: {
      id: "obsidian_spawn", name: "黑曜碎片", faction: "neutral", type: "minion",
      cost: 0, attack: 3, health: 3, rarity: "token", art: null,
      keywords: [], target: "none", text: "", flavor: "巨像倒下时，碎掉的只是外壳。", token: true
    },
    grave_guard: {
      id: "grave_guard", name: "墓钟守卫", faction: "neutral", type: "minion",
      cost: 0, attack: 5, health: 5, rarity: "token", art: null,
      keywords: [], target: "none", text: "", flavor: "它从钟声里站起来，替死者守夜。", token: true
    },
    astral_guardian: {
      id: "astral_guardian", name: "星界守卫", faction: "neutral", type: "minion",
      cost: 0, attack: 3, health: 3, rarity: "token", art: null,
      keywords: [], target: "none", text: "", flavor: "它们不守卫门，只守卫门后的选择。", token: true
    }
  };


  /* ===== 玩家数值设计表导入 ===== */
  const CARD_BALANCE_OVERRIDES = {
  guard: {
    cost: 3,
    attack: 1,
    health: 4
  },
  orlicas: {
    cost: 3,
    attack: 2,
    health: 3
  },
  timon: {
    cost: 3,
    attack: 3,
    health: 3
  },
  emergency: {
    cost: 2
  },
  verious: {
    cost: 4,
    attack: 3,
    health: 2
  },
  miyuki: {
    cost: 5,
    attack: 4,
    health: 4
  },
  insight: {
    cost: 2
  },
  doorman: {
    cost: 1,
    attack: 1,
    health: 2
  },
  archive_search: {
    cost: 1
  },
  nina: {
    cost: 2,
    attack: 2,
    health: 2
  },
  samuel: {
    cost: 2,
    attack: 2,
    health: 1
  },
  lecturer: {
    cost: 3,
    attack: 3,
    health: 3
  },
  justus: {
    cost: 3,
    attack: 3,
    health: 2
  },
  karl_desmond: {
    cost: 4,
    attack: 3,
    health: 4
  },
  cassian: {
    cost: 5,
    attack: 6,
    health: 3
  },
  tribal_warrior: {
    cost: 1,
    attack: 1,
    health: 2
  },
  lize: {
    cost: 2,
    attack: 2,
    health: 2
  },
  losutai_hunter: {
    cost: 3,
    attack: 3,
    health: 2
  },
  molan: {
    cost: 3,
    attack: 2,
    health: 4
  },
  blood_servant: {
    cost: 3,
    attack: 4,
    health: 2
  },
  grayfeather: {
    cost: 4,
    attack: 2,
    health: 3
  },
  tiega: {
    cost: 4,
    attack: 4,
    health: 3
  },
  republic_guard: {
    cost: 2,
    attack: 1,
    health: 3
  },
  hans: {
    cost: 2,
    attack: 2,
    health: 2
  },
  volley: {
    cost: 1
  },
  fortify: {
    cost: 1
  },
  elena: {
    cost: 3,
    attack: 3,
    health: 2
  },
  beatrix: {
    cost: 4,
    attack: 3,
    health: 3
  },
  konrad: {
    cost: 4,
    attack: 3,
    health: 5
  },
  empire_guard: {
    cost: 2,
    attack: 1,
    health: 3
  },
  mia: {
    cost: 2,
    attack: 2,
    health: 1
  },
  barrage: {
    cost: 1
  },
  klaus: {
    cost: 3,
    attack: 2,
    health: 3
  },
  ironclad: {
    cost: 3,
    attack: 3,
    health: 3
  },
  walter: {
    cost: 5,
    attack: 5,
    health: 4
  },
  snow_medic: {
    cost: 1,
    attack: 1,
    health: 1
  },
  recon: {
    cost: 2
  },
  archive_scribe: {
    cost: 2,
    attack: 1,
    health: 1
  },
  archive_guard: {
    cost: 2,
    attack: 2,
    health: 2
  },
  mist_scout: {
    cost: 2,
    attack: 2,
    health: 1
  },
  mist_hound: {
    cost: 2,
    attack: 2,
    health: 1
  },
  field_medic: {
    cost: 2,
    attack: 2,
    health: 2
  },
  vein_prism: {
    cost: 2
  },
  bard: {
    cost: 3,
    attack: 2,
    health: 2
  },
  mercenary: {
    cost: 3,
    attack: 4,
    health: 3
  },
  monarch: {
    cost: 4,
    attack: 3,
    health: 4
  },
  astral_colossus: {
    cost: 6,
    attack: 3,
    health: 7
  },
  archive_devourer: {
    cost: 7,
    attack: 4,
    health: 5
  },
  twin_weaver: {
    cost: 7,
    attack: 4,
    health: 3
  },
  vein_behemoth: {
    cost: 8,
    attack: 4,
    health: 7
  },
  chrono_archivist: {
    cost: 8,
    attack: 4,
    health: 4
  },
  frost_leviathan: {
    cost: 8,
    attack: 6,
    health: 4
  },
  obsidian_colossus: {
    cost: 9,
    attack: 4,
    health: 10
  },
  time_reflux: {
    cost: 100
  }
};
  for (const [balanceId, balancePatch] of Object.entries(CARD_BALANCE_OVERRIDES)) {
    if (CARDS[balanceId]) Object.assign(CARDS[balanceId], balancePatch);
  }

  Object.assign(CARDS.emergency, { text: "恢复一个友方随从 3 点生命；抽 1 张牌。", spell: { type: "healDraw", amount: 3, draw: 1 } });
  Object.assign(CARDS.archive_search, { text: "抽 1 张牌。", spell: { type: "draw", amount: 1 } });
  Object.assign(CARDS.fortify, { text: "使一个友方随从获得 +0/+1 与拦截。", spell: { type: "buffTaunt", attack: 0, health: 1 } });
  Object.assign(CARDS.konrad, { text: "拦截。登场：获得 5 点护甲。", battlecry: { type: "armor", amount: 5 } });
  Object.assign(CARDS.astral_colossus, { text: "拦截。登场：获得 3 点护甲。", battlecry: { type: "armor", amount: 3 } });
  Object.assign(CARDS.vein_prism, { text: "抽 1 张牌；引脉 6：再抽 1 张牌。", spell: { type: "drawVein", amount: 1, vein: 6, bonus: 1 } });
  Object.assign(CARDS.bard, { text: "登场：抽 1 张牌；引脉 6：再抽 1 张牌。", battlecry: { type: "drawVein", amount: 1, vein: 6, bonus: 1 } });
  Object.assign(CARDS.vein_behemoth, { text: "登场：流脉 +2；引脉 10：获得 +0/+1 和拦截。", battlecry: { type: "veinBuff", amount: 2, vein: 10, attack: 0, health: 1 } });
  Object.assign(CARDS.tribal_warrior, { bloodCost: 3, text: "血祭 3：获得 +1/+1。" });
  Object.assign(CARDS.tiega, { bloodCost: 3, text: "突进。血祭 3：获得 +2 攻击。" });
  Object.assign(CARDS.guard, { keywords: ["taunt", "battlecry"], target: "none", text: "拦截。登场：引脉 4：攻击力 +1。", battlecry: { type: "veinSelfBuff", vein: 4, attack: 1 } });
  Object.assign(CARDS.nina, { optionalTarget: true });
  Object.assign(CARDS.time_reflux, { disabled: true });
  Object.assign(CARDS.verious, { text: "登场：沉默一个敌方随从；引脉 5：获得 +0/+2。", battlecry: { type: "silenceVeinBuff", vein: 5, health: 2 } });
  Object.assign(CARDS.miyuki, { text: "登场：冻结一个敌方随从；引脉 6：改为冻结所有敌方随从；引脉 10：消灭所有敌方冻结随从。", battlecry: { type: "freeze", allAtVein: 6, destroyFrozenAtVein: 10 } });
  Object.assign(CARDS.hans, { keywords: ["taunt", "battlecry"], target: "none", text: "拦截。登场：同阵位所有具有拦截的友方随从获得 +0/+1。", battlecry: { type: "buffTauntZone", health: 1 } });
  Object.assign(CARDS.klaus, { keywords: ["taunt", "battlecry"], target: "none", text: "拦截。登场：场上每有一个铁甲步兵，获得 +2/+1。", battlecry: { type: "buffPerIronclad", attack: 2, health: 1 } });
  Object.assign(CARDS.ironclad, { keywords: ["taunt", "battlecry"], target: "none", text: "拦截。登场：若同阵位有另一个铁甲步兵，获得 +0/+1。", battlecry: { type: "buffIfIronclad", health: 1 } });
  Object.assign(CARDS.cassian, { text: "突进。你的回合结束时，对自身造成 1 点伤害。", passive: { type: "endTurnSelfDamage", amount: 1 } });
  Object.assign(CARDS.samuel, { text: "登场：抽 1 张法术牌。", battlecry: { type: "drawSpell" } });
  Object.assign(CARDS.lecturer, { text: "登场：若你的手牌数不少于 6，获得 +0/+2。", battlecry: { type: "handBuff", hand: 6, attack: 0, health: 2 } });
  Object.assign(CARDS.justus, { text: "登场：抽 1 张牌；若你的手牌数不超过 6，再抽 1 张牌。", battlecry: { type: "drawHandCondition", hand: 6, draw: 1 } });
  Object.assign(CARDS.vein_bulwark, { keywords: ["lifesteal"], text: "汲取。" });
  Object.assign(CARDS.field_medic, { target: "none", text: "登场：恢复你的领袖 2 点生命。", battlecry: { type: "healHero", amount: 2 } });
  // 旧卡阵位/流脉迁移：只增加可读的小型条件效果，不推翻原始效果。
  Object.assign(CARDS.guard, { zoneBonus: { attack: 1 }, text: CARDS.guard.text + " 阵位：若同阵位有另一个友方随从，攻击力 +1。" });
  Object.assign(CARDS.medic_apprentice, { veinBonus: { vein: 4, healHero: 2 }, text: CARDS.medic_apprentice.text + " 引脉 4：恢复你的领袖 2 点生命。" });
  Object.assign(CARDS.courier, { zoneBonus: { health: 1 }, text: CARDS.courier.text + " 阵位：若同阵位有另一个友方随从，生命值 +1。" });
  Object.assign(CARDS.karl_desmond, { zoneBonus: { draw: 1 }, text: CARDS.karl_desmond.text + " 阵位：若同阵位有另一个友方随从，抽 1 张牌。" });
  Object.assign(CARDS.lecturer, { veinBonus: { vein: 6, selfBuff: { attack: 1, health: 1 } }, text: CARDS.lecturer.text + " 引脉 6：获得 +1/+1。" });
  Object.assign(CARDS.nina, { zoneBonus: { health: 1 }, text: CARDS.nina.text + " 阵位：若同阵位有另一个友方随从，生命值 +1。" });
  Object.assign(CARDS.losutai_hunter, { zoneBonus: { attack: 1 }, text: CARDS.losutai_hunter.text + " 阵位：若同阵位有另一个友方随从，攻击力 +1。" });
  Object.assign(CARDS.tribal_warrior, { zoneBonus: { health: 1 }, text: CARDS.tribal_warrior.text + " 阵位：若同阵位有另一个友方随从，生命值 +1。" });
  Object.assign(CARDS.lanxi, { veinBonus: null, text: "登场：召唤两个 1/1 洛斯汰魔物；引脉 5：使这些魔物获得拦截。" });
  Object.assign(CARDS.republic_guard, { zoneBonus: { health: 2 }, text: CARDS.republic_guard.text + " 阵位：若同阵位有另一个友方随从，生命值 +2。" });
  Object.assign(CARDS.beatrix, { veinBonus: { vein: 4, healHero: 2 }, text: CARDS.beatrix.text + " 引脉 4：恢复你的领袖 2 点生命。" });
  Object.assign(CARDS.elena, { zoneBonus: { draw: 1 }, text: CARDS.elena.text + " 阵位：若同阵位有另一个友方随从，抽 1 张牌。" });
  Object.assign(CARDS.empire_guard, { veinBonus: { vein: 4, armor: 2 }, text: CARDS.empire_guard.text + " 引脉 4：获得 2 点护甲。" });
  Object.assign(CARDS.mia, { zoneBonus: { draw: 1 }, text: CARDS.mia.text + " 阵位：若同阵位有另一个友方随从，抽 1 张牌。" });
  Object.assign(CARDS.elsa, { zoneBonus: { healHero: 2 }, text: CARDS.elsa.text + " 阵位：若同阵位有另一个友方随从，恢复你的领袖 2 点生命。" });
  Object.assign(CARDS.snow_medic, { zoneBonus: { healHero: 1 }, text: CARDS.snow_medic.text + " 阵位：若同阵位有另一个友方随从，恢复你的领袖 1 点生命。" });
  Object.assign(CARDS.gok_digger, { veinBonus: { vein: 4, armor: 1 }, text: CARDS.gok_digger.text + " 引脉 4：获得 1 点护甲。" });
  Object.assign(CARDS.bounty_hunter, { zoneBonus: { attack: 1 }, text: CARDS.bounty_hunter.text + " 阵位：若同阵位有另一个友方随从，攻击力 +1。" });
  Object.assign(CARDS.shextena, { mirrorBonus: { healHero: 1 }, text: CARDS.shextena.text + " 对位：若敌方对位阵位有随从，恢复你的领袖 1 点生命。" });
  Object.assign(CARDS.karl_desmond, { mirrorBonus: { draw: 1 }, text: CARDS.karl_desmond.text + " 对位：若敌方对位阵位有随从，抽 1 张牌。" });
  Object.assign(CARDS.grayfeather, { mirrorBonus: { attack: 1 }, text: CARDS.grayfeather.text + " 对位：若敌方对位阵位有随从，攻击力 +1。" });
  Object.assign(CARDS.republic_guard, { mirrorBonus: { health: 1 }, text: CARDS.republic_guard.text + " 对位：若敌方对位阵位有随从，生命值 +1。" });
  Object.assign(CARDS.empire_guard, { mirrorBonus: { armor: 1 }, text: CARDS.empire_guard.text + " 对位：若敌方对位阵位有随从，获得 1 点护甲。" });

  Object.assign(CARDS.shextena, { veinBonus: { vein: 6, healHero: 3 }, text: CARDS.shextena.text + " 引脉 6：恢复你的领袖 3 点生命。" });
  Object.assign(CARDS.timon, { zoneBonus: { health: 1 }, text: CARDS.timon.text + " 阵位：若同阵位有另一个友方随从，生命值 +1。" });
  Object.assign(CARDS.aidric, { veinBonus: { vein: 4, armor: 2 }, text: CARDS.aidric.text + " 引脉 4：获得 2 点护甲。" });
  Object.assign(CARDS.orlicas, { zoneBonus: { draw: 1 }, text: CARDS.orlicas.text + " 阵位：若同阵位有另一个友方随从，抽 1 张牌。" });
  Object.assign(CARDS.justus, { veinBonus: { vein: 6, armor: 1 }, text: CARDS.justus.text + " 引脉 6：获得 1 点护甲。" });
  Object.assign(CARDS.samuel, { zoneBonus: { health: 1 }, text: CARDS.samuel.text + " 阵位：若同阵位有另一个友方随从，生命值 +1。" });
  Object.assign(CARDS.cassian, { zoneBonus: { attack: 1 }, text: CARDS.cassian.text + " 阵位：若同阵位有另一个友方随从，攻击力 +1。" });
  Object.assign(CARDS.doorman, { veinBonus: { vein: 4, healHero: 2 }, text: CARDS.doorman.text + " 引脉 4：恢复你的领袖 2 点生命。" });
  Object.assign(CARDS.grayfeather, { veinBonus: null, text: "登场：使一个友方随从获得 +2/+2；引脉 4：再使其获得拦截。 对位：若敌方对位阵位有随从，攻击力 +1。" });
  Object.assign(CARDS.molan, { zoneBonus: { attack: 1 }, text: CARDS.molan.text + " 阵位：若同阵位有另一个友方随从，攻击力 +1。" });
  Object.assign(CARDS.lanzhou, { zoneBonus: { health: 1 }, text: CARDS.lanzhou.text + " 阵位：若同阵位有另一个友方随从，生命值 +1。" });
  Object.assign(CARDS.konrad, { veinBonus: { vein: 4, armor: 2 }, text: CARDS.konrad.text + " 引脉 4：获得 2 点护甲。" });
  Object.assign(CARDS.erhardt, { zoneBonus: { attack: 1 }, text: CARDS.erhardt.text + " 阵位：若同阵位有另一个友方随从，攻击力 +1。" });
  Object.assign(CARDS.cedric, { veinBonus: { vein: 6, healHero: 2 }, text: CARDS.cedric.text + " 引脉 6：恢复你的领袖 2 点生命。" });
  Object.assign(CARDS.shield_bearer, { zoneBonus: { health: 1 }, text: CARDS.shield_bearer.text + " 阵位：若同阵位有另一个友方随从，生命值 +1。" });
  Object.assign(CARDS.gunther, { veinBonus: { vein: 4, armor: 2 }, text: CARDS.gunther.text + " 引脉 4：获得 2 点护甲。" });
  Object.assign(CARDS.karl_schwarz, { zoneBonus: { attack: 1 }, text: CARDS.karl_schwarz.text + " 阵位：若同阵位有另一个友方随从，攻击力 +1。" });
  Object.assign(CARDS.walter, { veinBonus: { vein: 6, armor: 1 }, text: CARDS.walter.text + " 引脉 6：获得 1 点护甲。" });
  Object.assign(CARDS.fog_sailor, { zoneBonus: { health: 1 }, text: CARDS.fog_sailor.text + " 阵位：若同阵位有另一个友方随从，生命值 +1。" });
  Object.assign(CARDS.mist_scout, { veinBonus: { vein: 4, armor: 1 }, text: CARDS.mist_scout.text + " 引脉 4：获得 1 点护甲。" });
  Object.assign(CARDS.caravan_guard, { zoneBonus: { health: 1 }, text: CARDS.caravan_guard.text + " 阵位：若同阵位有另一个友方随从，生命值 +1。" });
  Object.assign(CARDS.astral_colossus, { veinBonus: { vein: 6, armor: 2 }, text: CARDS.astral_colossus.text + " 引脉 6：获得 2 点护甲。" });
  // 第二轮旧卡迁移：把低影响的登场效果改成余响/被动，降低登场密度。
  Object.assign(CARDS.medic_apprentice, { keywords: ["deathrattle"], target: "none", battlecry: null, deathrattle: { type: "healHero", amount: 1 }, text: "余响：恢复你的领袖 1 点生命。 引脉 4：恢复你的领袖 2 点生命。" });
  Object.assign(CARDS.snow_medic, { keywords: ["deathrattle"], target: "none", battlecry: null, deathrattle: { type: "healHero", amount: 1 }, text: "余响：恢复你的领袖 1 点生命。 阵位：若同阵位有另一个友方随从，恢复你的领袖 1 点生命。" });
  Object.assign(CARDS.field_engineer, { keywords: ["deathrattle"], target: "none", battlecry: null, deathrattle: { type: "armor", amount: 2 }, text: "余响：获得 2 点护甲。" });
  Object.assign(CARDS.archive_scribe, { keywords: ["deathrattle"], target: "none", battlecry: null, deathrattle: { type: "draw", amount: 1 }, text: "余响：抽 1 张牌。" });
  Object.assign(CARDS.mia, { keywords: ["deathrattle"], target: "none", battlecry: null, zoneBonus: null, deathrattle: { type: "draw", amount: 1 }, text: "余响：抽 1 张牌。" });
  Object.assign(CARDS.elena, { keywords: ["deathrattle"], target: "none", battlecry: null, zoneBonus: null, deathrattle: { type: "draw", amount: 1 }, text: "余响：抽 1 张牌。" });
  Object.assign(CARDS.field_medic, { keywords: ["deathrattle"], target: "none", battlecry: null, deathrattle: { type: "healHero", amount: 2 }, text: "余响：恢复你的领袖 2 点生命。" });
  Object.assign(CARDS.bounty_hunter, { keywords: ["deathrattle"], target: "none", battlecry: null, deathrattle: { type: "damageRandomEnemy", amount: 1 }, text: "余响：对随机敌方单位造成 1 点伤害。 阵位：若同阵位有另一个友方随从，攻击力 +1。" });
  Object.assign(CARDS.sim_assistant, { keywords: ["deathrattle"], target: "none", battlecry: null, deathrattle: { type: "draw", amount: 1 }, text: "余响：抽 1 张牌。" });
  Object.assign(CARDS.vein_medic, { keywords: ["deathrattle"], target: "none", battlecry: null, deathrattle: { type: "healHero", amount: 2 }, text: "余响：恢复你的领袖 2 点生命。" });
  Object.assign(CARDS.elsa, { keywords: ["deathrattle"], target: "none", battlecry: null, deathrattle: { type: "healHero", amount: 2 }, text: "余响：恢复你的领袖 2 点生命。 阵位：若同阵位有另一个友方随从，恢复你的领袖 2 点生命。" });
  Object.assign(CARDS.walter, { keywords: ["deathrattle"], target: "none", battlecry: null, deathrattle: { type: "damageRandomEnemy", amount: 2 }, text: "余响：对随机敌方单位造成 2 点伤害。 引脉 6：获得 1 点护甲。" });
  Object.assign(CARDS.losutai_hunter, { keywords: ["deathrattle"], target: "none", battlecry: null, deathrattle: { type: "damageRandomEnemy", amount: 1 }, text: "余响：对随机敌方单位造成 1 点伤害。 阵位：若同阵位有另一个友方随从，攻击力 +1。" });
  Object.assign(CARDS.iron_engineer, { keywords: ["deathrattle"], target: "none", battlecry: null, deathrattle: { type: "armor", amount: 2 }, text: "余响：获得 2 点护甲。" });
  Object.assign(CARDS.powder_boy, { keywords: ["deathrattle"], target: "none", battlecry: null, deathrattle: { type: "armor", amount: 1 }, text: "余响：获得 1 点护甲。" });
  Object.assign(CARDS.chrono_scholar, { keywords: ["deathrattle"], target: "none", battlecry: null, deathrattle: { type: "draw", amount: 1 }, text: "余响：抽 1 张牌。" });
  Object.assign(CARDS.archive_devourer, { keywords: ["deathrattle"], target: "none", battlecry: null, deathrattle: { type: "draw", amount: 1 }, text: "余响：抽 1 张牌。" });
  Object.assign(CARDS.lecturer, { keywords: ["deathrattle"], target: "none", battlecry: null, veinBonus: null, deathrattle: { type: "draw", amount: 1 }, text: "余响：抽 1 张牌。" });
  Object.assign(CARDS.frost_leviathan, { keywords: ["deathrattle"], target: "none", battlecry: null, deathrattle: { type: "freezeAllEnemies" }, text: "余响：冻结所有敌方随从。" });
  Object.assign(CARDS.drill_sergeant, { keywords: ["deathrattle"], target: "none", battlecry: null, deathrattle: { type: "tauntRandomAlly" }, text: "余响：使一个随机友方随从获得拦截。" });
  Object.assign(CARDS.konrad, { keywords: ["taunt"], target: "none", battlecry: null, passive: { type: "turnArmor", amount: 1 }, text: "拦截。被动：你的回合开始时获得 1 点护甲。 引脉 4：获得 2 点护甲。" });
  Object.assign(CARDS.gunther, { keywords: ["taunt"], target: "none", battlecry: null, passive: null, attack: 4, health: 5, text: "拦截。 引脉 4：获得 2 点护甲。" });
  Object.assign(CARDS.powder_marshal, { keywords: [], target: "none", battlecry: null, passive: null, attack: 5, health: 5, text: "" });
  Object.assign(CARDS.astral_colossus, { keywords: ["taunt"], target: "none", battlecry: null, passive: { type: "turnArmor", amount: 1 }, text: "拦截。被动：你的回合开始时获得 1 点护甲。 引脉 6：获得 2 点护甲。" });
  Object.assign(CARDS.vein_scout, { keywords: ["battlecry", "charge"], target: "none", text: "突进。登场：流脉 +1。" });
  Object.assign(CARDS.powder_boy, { keywords: ["deathrattle", "charge"], target: "none", text: "突进。余响：获得 1 点护甲。" });
  // 第三轮登场压缩：移除低影响登场，保留卡牌定位。
  // 第七轮登场压缩：非预设卡转白板/被动，降低登场密度。
  Object.assign(CARDS.courier, { keywords: [], target: "none", battlecry: null, text: "" });
  Object.assign(CARDS.bard, { keywords: [], target: "none", battlecry: null, text: "" });
  Object.assign(CARDS.spell_echo, { keywords: [], target: "none", battlecry: null, text: "" });
  Object.assign(CARDS.siege_train, { keywords: [], target: "none", battlecry: null, text: "" });
  // 第八轮登场压缩：非预设卡转白板，登场压到 36。
  Object.assign(CARDS.vein_oracle, { keywords: [], target: "none", battlecry: null, text: "" });
  Object.assign(CARDS.void_titan, { keywords: [], target: "none", battlecry: null, text: "" });
  Object.assign(CARDS.vein_channeler, { keywords: [], target: "none", battlecry: null, text: "" });
  Object.assign(CARDS.excavation_titan, { keywords: [], target: "none", battlecry: null, text: "" });
  Object.assign(CARDS.blood_priestess, { keywords: [], target: "none", battlecry: null, text: "" });
  Object.assign(CARDS.iron_phalanx, { keywords: ["taunt"], target: "none", battlecry: null, text: "拦截。" });
  Object.assign(CARDS.siege_captain, { keywords: [], target: "none", battlecry: null, text: "" });
  Object.assign(CARDS.siphon_guard, { keywords: ["taunt"], target: "none", battlecry: null, text: "拦截。" });
  Object.assign(CARDS.frost_professor, { keywords: [], target: "none", battlecry: null, text: "" });
  Object.assign(CARDS.vein_leviathan, { keywords: [], target: "none", battlecry: null, text: "" });
  Object.assign(CARDS.world_serpent, { keywords: [], target: "none", battlecry: null, text: "" });
  Object.assign(CARDS.faceless_king, { keywords: [], target: "none", battlecry: null, text: "" });


  // 第六轮登场压缩：未进预设的持盾元帅/堡垒队长改成拦截光环。
  Object.assign(CARDS.shield_marshal, { keywords: ["taunt"], target: "none", battlecry: null, passive: { type: "tauntAura", amount: 1 }, text: "拦截。被动：你召唤的拦截随从获得 +0/+1。" });
  Object.assign(CARDS.bastion_captain, { keywords: [], target: "none", battlecry: null, passive: { type: "tauntAura", amount: 1 }, text: "被动：你召唤的拦截随从获得 +0/+1。" });


  // 第五轮登场压缩：转成阵位/被动光环。
  Object.assign(CARDS.zone_keeper, { keywords: [], target: "none", battlecry: null, zoneBonus: { attack: 2, health: 2 }, text: "阵位：若同阵位有另一个友方随从，获得 +2/+2。" });
  Object.assign(CARDS.ironclad, { keywords: ["taunt"], target: "none", battlecry: null, zoneBonus: { health: 1 }, text: "拦截。 阵位：若同阵位有另一个友方随从，生命值 +1。" });
  Object.assign(CARDS.hans, { keywords: ["taunt"], target: "none", battlecry: null, passive: { type: "tauntAura", amount: 1 }, text: "拦截。被动：你召唤的拦截随从获得 +0/+1。" });
  Object.assign(CARDS.gok_digger, { keywords: [], target: "none", battlecry: null, text: "采掘 1。" });

  Object.assign(CARDS.vein_scout, { keywords: ["charge"], target: "none", battlecry: null, text: "突进。" });
  Object.assign(CARDS.guard, { keywords: ["taunt"], target: "none", battlecry: null, text: "拦截。 阵位：若同阵位有另一个友方随从，攻击力 +1。 引脉 4：获得 1 点护甲。" });








  const NEUTRAL_DECK = [
    "neutral_wayfarer",
    "gok_digger", "gok_digger",
    "fog_sailor",
    "snow_medic", "snow_medic",
    "mist_scout", "mist_scout",
    "caravan_guard", "caravan_guard",
    "astral_colossus", "moonfall"
  ];

  const DECK_SPECIALS = {
    pus: { formation: "formation_vein", relic: "vein_heart", relic2: "formation_standard" },
    academy: { formation: "formation_script", relic: "frost_prism", relic2: "spell_codex" },
    xizhao: { formation: "formation_tide", relic: "blood_scythe", relic2: "blood_censer" },
    republic: { formation: "formation_wall", relic: "iron_banner", relic2: "republic_seal" },
    empire: { formation: "formation_cannon", relic: "powder_engine", relic2: "armor_forge" },
    greyharbor: { formation: "gh_formation", relic: "gh_bounty_board", relic2: "gh_venom_vial" }
  };

  const DECK_TRIM = {
    pus: ["emergency", "resonance", "coordination", "snow_medic"],
    xizhao: ["losutai_hunter", "shadow_raid", "blood_ritual", "snow_medic"],
    academy: ["archive_search", "frost_seal", "lecturer", "snow_medic"],
    republic: ["shield_bearer", "fortify", "volley", "levy"],
    empire: ["ironclad", "barrage", "mobilize", "fortress"],
    greyharbor: ["gh_bounty_notice", "gh_quick_strike", "gh_shield_mercenary", "gh_black_market"]
  };

  const DECK_STRATEGIES = {
    aggro: { name: "快攻", desc: "低费随从与直伤，抢在前中期结束。", curve: { 1: 7, 2: 8, 3: 7, 4: 5, 5: 2, 6: 1 } },
    midrange: { name: "中速", desc: "按费拍下高质量随从，靠阵位和登场取得优势。", curve: { 1: 5, 2: 7, 3: 6, 4: 6, 5: 4, 6: 2 } },
    control: { name: "控制", desc: "解场、冻结、恢复与抽牌，拖到流脉与高费回合。", curve: { 1: 4, 2: 6, 3: 6, 4: 6, 5: 5, 6: 3 } }
  };

  function maxCopies(def) {
    if (!def || def.token) return 0;
    if (def.type === "relic") return 1;
    if (def.type === "formation") return 2;
    return def.rarity === "legendary" ? 1 : 2;
  }

  function cardPool(faction) {
    return Object.keys(CARDS).filter((id) => {
      const d = CARDS[id];
      if (d.token || d.disabled) return false;
      return d.faction === faction || d.faction === "neutral";
    });
  }

  function validateDeck(faction, list) {
    const errors = [];
    const arr = Array.isArray(list) ? list : [];
    if (arr.length !== 31 && arr.length !== 32) errors.push("牌组必须是 30 张带牌 + 1 张遗物（共 31 张）");
    const counts = {};
    let main = 0, formations = 0, relics = 0;
    for (const id of arr) {
      const d = CARDS[id];
      if (!d || d.token || d.disabled) { errors.push("包含不存在或不可用的牌：" + id); continue; }
      if (d.faction !== faction && d.faction !== "neutral") errors.push(d.name + " 不属于该阵营");
      counts[id] = (counts[id] || 0) + 1;
      if (counts[id] > maxCopies(d)) errors.push(d.name + " 超出同名张数上限");
      if (d.type === "formation") formations++;
      else if (d.type === "relic") relics++;
      else main++;
    }
    if (main + formations !== 30) errors.push("带牌必须是 30 张（含阵型），当前 " + (main + formations));
    if (formations > 2) errors.push("阵型最多 2 张，当前 " + formations);
    if (relics < 1 || relics > 2) errors.push("遗物必须是 1 张（兼容旧牌组最多 2 张），当前 " + relics);
    return { ok: errors.length === 0, errors: Array.from(new Set(errors)), counts: counts, main: main, formations: formations, relics: relics };
  }

  function scoreForAuto(def, strategy) {
    if (!def || def.token) return -999;
    const cheap = def.cost <= 2 ? 1 : 0;
    const stats = (def.attack || 0) * 1.6 + (def.health || 0);
    const kw = (def.keywords || []).join(" ");
    let s = stats + (def.type === "spell" ? 3 : 0);
    if (kw.indexOf("charge") >= 0) s += 5;
    if (kw.indexOf("taunt") >= 0) s += 3;
    if (kw.indexOf("battlecry") >= 0) s += 2;
    if (def.spell) {
      if (["damage", "freezeDraw", "freezeAll", "bloodDraw"].indexOf(def.spell.type) >= 0) s += 4;
      if (["draw", "drawVein", "discover", "healDraw", "buffHeal"].indexOf(def.spell.type) >= 0) s += 3;
    }
    if (strategy === "aggro") s += cheap * 6 + (def.cost || 0) * -2.2 + (def.attack || 0) * 1.5;
    else if (strategy === "control") s += (def.health || 0) * 1.2 + (def.cost || 0) * 0.8 + (kw.indexOf("taunt") >= 0 ? 4 : 0);
    else s += stats * 0.3 + (def.cost || 0) * 0.3;
    return s;
  }

  function autoBuildDeck(faction, strategy) {
    const strat = DECK_STRATEGIES[strategy] ? strategy : "midrange";
    const curve = DECK_STRATEGIES[strat].curve;
    const pool = cardPool(faction).filter(id => CARDS[id].type !== "formation" && CARDS[id].type !== "relic");
    const chosen = [];
    const counts = {};
    const take = (id) => {
      const d = CARDS[id];
      if (!d || counts[id] >= maxCopies(d)) return false;
      counts[id] = (counts[id] || 0) + 1;
      chosen.push(id);
      return true;
    };
    for (const costKey of Object.keys(curve)) {
      const cost = Number(costKey);
      const target = curve[costKey];
      const cards = pool.filter((id) => CARDS[id].cost === cost).sort((a, b) => scoreForAuto(CARDS[b], strat) - scoreForAuto(CARDS[a], strat) || a.localeCompare(b));
      let need = target;
      for (const id of cards) {
        while (need > 0 && take(id)) need--;
        if (need <= 0) break;
      }
    }
    const rest = pool.slice().sort((a, b) => scoreForAuto(CARDS[b], strat) - scoreForAuto(CARDS[a], strat) || a.localeCompare(b));
    while (chosen.length < 28) {
      let added = false;
      for (const id of rest) {
        if (chosen.length >= 28) break;
        if (take(id)) added = true;
      }
      if (!added) break;
    }
    const special = DECK_SPECIALS[faction];
    return chosen.slice(0, 28).concat([special.formation, special.formation, special.relic]);
  }

  const DECKS = {
    pus: [
      "shextena", "verious", "timon", "aidric", "orlicas", "miyuki",
      "medic_apprentice", "vein_siphon",
      "vein_bulwark", "vein_surveyor",
      "vein_scout", "zone_keeper",
      "coordination", "coordination",
      "emergency", "emergency",
      "resonance", "resonance",
      ...NEUTRAL_DECK
    ],
    xizhao: [
      "tiega", "lanxi", "lize", "grayfeather", "lanzhou", "molan",
      "tribal_warrior", "blood_imp",
      "blood_servant", "devourer",
      "losutai_hunter", "losutai_hunter",
      "zone_reaper", "venom_fang",
      "monster_summon", "tide_colossus",
      "shadow_raid", "shadow_raid",
      ...NEUTRAL_DECK
    ],
    academy: [
      "karl_desmond", "justus", "cassian", "samuel", "nina", "arcane_theorist",
      "formula_fix", "formula_fix", "double_formula", "double_formula",
      "frost_seal", "frost_seal", "debate", "debate",
      "prohibition", "mana_surge", "spellstorm", "frost_professor",
      "neutral_wayfarer", "gok_digger", "gok_digger", "fog_sailor",
      "snow_medic", "snow_medic", "mist_scout", "mist_scout",
      "caravan_guard", "caravan_guard"
    ],
    republic: [
      "konrad", "erhardt", "beatrix", "elena", "hans", "cedric",
      "aegis_guard", "phalanx_warden",
      "shield_bearer", "shield_recruit",
      "fortify", "shield_sergeant",
      "volley", "volley",
      "levy", "zone_banner",
      "martial_law", "martial_law",
      ...NEUTRAL_DECK
    ],
    empire: [
      "gunther", "klaus", "mia", "elsa", "karl_schwarz", "walter",
      "powder_boy", "iron_artillery",
      "ironclad", "ironclad",
      "barrage", "wind_cannon",
      "mobilize", "mobilize",
      "fortress", "zone_barrage",
      "martial_court", "powder_marshal",
      ...NEUTRAL_DECK
    ],
    greyharbor: [
      "gh_cutthroat", "gh_venom_apprentice", "gh_contract_squire", "gh_bounty_notice",
      "gh_silencer", "gh_poison_thrower", "gh_rush_archer", "gh_bounty_hunter",
      "gh_bodyguard_contract", "gh_quick_strike",
      "gh_venom_shield", "gh_silence_expert", "gh_shield_mercenary", "gh_ledger",
      "gh_assassinate_contract", "gh_black_market",
      "gh_legend_assassin", "gh_silence_field", "gh_shield_broker",
      "gh_execution_contract", "gh_bounty_collector",
      "gh_scorpion", "gh_captain", "gh_silence_master", "gh_bounty_verdict",
      "gh_company", "gh_venom_behemoth", "gh_bounty_king"
    ]
  };

  for (const factionId of FACTION_IDS) {
    if (!DECKS[factionId] || !DECK_SPECIALS[factionId]) continue;
    const main = DECKS[factionId].slice();
    const special = DECK_SPECIALS[factionId];
    DECKS[factionId] = main.slice(0, 28).concat([special.formation, special.formation, special.relic, special.relic2]);
  }

  const KEYWORDS = {
    taunt: { name: "拦截", icon: "🛡", color: "#d8b36a" },
    charge: { name: "突进", icon: "⚔", color: "#e07a5f" },
    battlecry: { name: "登场", icon: "✦", color: "#7ec8e3" },
    deathrattle: { name: "余响", icon: "☠", color: "#b58bd8" },
    freeze: { name: "冻结", icon: "❄", color: "#7fd3ff" },
    stealth: { name: "隐匿", icon: "◐", color: "#9bb0c9" },
    counter: { name: "反击", icon: "↩", color: "#e0b36a" },
    divineShield: { name: "护幕", icon: "✧", color: "#f1df9d" },
    windfury: { name: "连动", icon: "⚡", color: "#8fd6ff" },
    poisonous: { name: "蚀毒", icon: "☠", color: "#a9d36f" },
    lifesteal: { name: "汲取", icon: "♥", color: "#e28aa7" },
    rush: { name: "袭扰", icon: "➤", color: "#e0a36a" },
    reborn: { name: "回潮", icon: "♻", color: "#9fd7c4" }
  };

  // ===== 白板随从补全 / 让每张随从都有可读的玩法 =====
  Object.assign(CARDS.bard, { keywords: ["battlecry"], target: "none", battlecry: { type: "draw", amount: 1 }, text: "登场：抽 1 张牌。" });
  Object.assign(CARDS.mercenary, { keywords: ["battlecry"], target: "none", battlecry: { type: "armor", amount: 1 }, text: "登场：获得 1 点护甲。" });
  Object.assign(CARDS.vein_oracle, { keywords: ["battlecry"], target: "none", battlecry: { type: "veinDraw", amount: 1, vein: 6, draw: 1 }, text: "登场：流脉 +1；若流脉≥6，抽 1 张牌。" });
  Object.assign(CARDS.spell_echo, { keywords: ["battlecry"], target: "none", battlecry: { type: "discover", pool: "spell" }, text: "登场：检索一张战术牌。" });
  Object.assign(CARDS.siege_train, { keywords: ["battlecry"], target: "none", battlecry: { type: "damageAllEnemies", amount: 1 }, text: "登场：对所有敌方随从造成 1 点伤害。" });
  Object.assign(CARDS.void_titan, { keywords: ["battlecry"], target: "enemy", battlecry: { type: "destroy" }, text: "登场：消灭一个敌方随从。" });
  Object.assign(CARDS.vein_channeler, { keywords: ["battlecry"], target: "none", battlecry: { type: "veinOnly", amount: 1 }, text: "登场：流脉 +1。" });
  Object.assign(CARDS.excavation_titan, { keywords: ["battlecry"], target: "none", battlecry: { type: "veinOnly", amount: 2 }, text: "登场：流脉 +2。" });
  Object.assign(CARDS.blood_priestess, { keywords: ["battlecry"], target: "none", battlecry: { type: "healHero", amount: 3 }, text: "登场：恢复你的领袖 3 点生命。" });
  Object.assign(CARDS.siege_captain, { keywords: ["battlecry"], target: "none", battlecry: { type: "armor", amount: 1 }, text: "登场：获得 1 点护甲。" });
  Object.assign(CARDS.frost_professor, { keywords: ["battlecry"], target: "enemy", battlecry: { type: "freeze" }, text: "登场：冻结一个敌方随从。" });
  Object.assign(CARDS.powder_marshal, { keywords: ["battlecry"], target: "none", battlecry: { type: "armor", amount: 1 }, text: "登场：获得 1 点护甲。" });
  Object.assign(CARDS.vein_leviathan, { keywords: ["battlecry"], target: "none", battlecry: { type: "veinDraw", amount: 1, vein: 7, draw: 1 }, text: "登场：流脉 +1；若流脉≥7，抽 1 张牌。" });
  Object.assign(CARDS.world_serpent, { keywords: ["battlecry"], target: "none", battlecry: { type: "damageAllEnemies", amount: 2 }, text: "登场：对所有敌方随从造成 2 点伤害。" });
  Object.assign(CARDS.faceless_king, { keywords: ["battlecry"], target: "friendly", battlecry: { type: "copyFriendly" }, text: "登场：复制一个友方随从。" });

  // ===== 阵营软克制卡 / 2.0 =====
  Object.assign(CARDS, {
    armor_break: {
      id: "armor_break", name: "破甲演算", faction: "academy", type: "spell",
      cost: 3, rarity: "epic", art: null, target: "none",
      text: "移除敌方领袖至多 3 点护甲；抽 1 张牌。",
      flavor: "护甲是另一种算式，拆开它只需要正确的括号。",
      spell: { type: "stripArmorDraw", amount: 3, draw: 1 }
    },
    blood_path: {
      id: "blood_path", name: "血路", faction: "xizhao", type: "spell",
      cost: 2, rarity: "rare", art: null, target: "friendly",
      text: "使一个友方随从获得 +1 攻击；本回合它攻击时无视拦截。",
      flavor: "没有墙能挡住一条已经流出去的血路。",
      spell: { type: "ignoreTauntBuff", attack: 1 }
    },
    anti_rush: {
      id: "anti_rush", name: "反炮击工事", faction: "republic", type: "spell",
      cost: 3, rarity: "rare", art: null, target: "none",
      text: "获得 4 点护甲；若敌方有突进随从，再获得 2 点护甲。",
      flavor: "炮弹的落点，在图纸上早就被标好了。",
      spell: { type: "armorConditionalRush", armor: 4, bonus: 2 }
    },
    vein_ward: {
      id: "vein_ward", name: "地脉护佑", faction: "pus", type: "spell",
      cost: 2, rarity: "rare", art: null, target: "none",
      text: "恢复你的领袖 2 点生命；本回合你的随从不能被冻结。",
      flavor: "地脉在脚下翻身，把冬天挡在外面。",
      spell: { type: "antiFreezeHeal", heal: 2 }
    },
    quarantine: {
      id: "quarantine", name: "战地检疫", faction: "empire", type: "spell",
      cost: 2, rarity: "rare", art: null, target: "enemy",
      text: "对一个敌方随从造成 1 点伤害；本回合敌方领袖不能恢复生命。",
      flavor: "伤口可以处理，但先要确认它不会继续长。",
      spell: { type: "damageHealBlock", amount: 1 }
    }
  });
  // ===== 第二组阵营专属卡 =====
  Object.assign(CARDS, {
    battle_calc: { id: "battle_calc", name: "战场推演", faction: "academy", type: "spell", cost: 2, rarity: "common", art: null, target: "enemy", text: "对一个敌方随从造成 2 点伤害。", flavor: "把对手的下一步，也算进自己的公式里。", spell: { type: "damage", amount: 2 } },
    hunt_ritual: { id: "hunt_ritual", name: "猎杀仪式", faction: "xizhao", type: "spell", cost: 3, rarity: "common", art: null, target: "enemy", text: "对一个敌方随从造成 3 点伤害。", flavor: "血族从不浪费一场狩猎。", spell: { type: "damage", amount: 3 } },
    line_rotation: { id: "line_rotation", name: "阵线轮换", faction: "republic", type: "spell", cost: 2, rarity: "common", art: null, target: "friendly", text: "使一个友方随从获得拦截。", flavor: "换防不是后退，是把盾递到下一双手里。", spell: { type: "buffTaunt", attack: 0, health: 0 } },
    vein_sentinel: { id: "vein_sentinel", name: "守脉者", faction: "pus", type: "minion", cost: 3, rarity: "common", art: null, target: "none", attack: 2, health: 4, keywords: ["taunt"], text: "拦截。", flavor: "它站着的地方，就是地脉的边界。" },
    armor_recycle: { id: "armor_recycle", name: "装甲回收", faction: "empire", type: "spell", cost: 3, rarity: "common", art: null, target: "none", text: "获得 3 点护甲。", flavor: "废铁只是还没找到下一门炮。", spell: { type: "armor", amount: 3 } }
  });
  // 只保留卡牌效果文本，风味文本放到详情页。
  for (const id of ["vein_warden","mist_hound","archive_guard","vein_bulwark","aegis_guard","wind_cannon","venom_fang","rebirth_serpent","rush_lancer","vein_scout","shield_recruit","iron_phalanx","siphon_guard","vein_sentinel"]) {
    const card = CARDS[id];
    if (card) card.text = "";
  }
  Object.assign(CARDS.courier, { text: "阵位：若同阵位有另一个友方随从，生命值 +1。" });
  Object.assign(CARDS.fog_sailor, { text: "阵位：若同阵位有另一个友方随从，生命值 +1。" });
  Object.assign(CARDS.gok_digger, { text: "采掘 1；引脉 4：获得 1 点护甲。" });

  // ===== 终版卡面文字与同质卡修正 =====
  // 恢复关键词随从的卡面说明，避免看起来像“效果被删除了”。
  Object.assign(CARDS.vein_warden, { text: "拦截。" });
  Object.assign(CARDS.mist_hound, { text: "突进。" });
  Object.assign(CARDS.archive_guard, { text: "拦截。" });
  Object.assign(CARDS.vein_bulwark, { text: "汲取。" });
  Object.assign(CARDS.aegis_guard, { text: "护幕。拦截。" });
  Object.assign(CARDS.wind_cannon, { text: "连动。" });
  Object.assign(CARDS.venom_fang, { text: "蚀毒。" });
  Object.assign(CARDS.rebirth_serpent, { text: "回潮。" });
  Object.assign(CARDS.rush_lancer, { text: "袭扰。" });
  Object.assign(CARDS.vein_scout, { text: "突进。" });
  Object.assign(CARDS.shield_recruit, { text: "拦截。" });
  Object.assign(CARDS.iron_phalanx, { text: "拦截。" });
  Object.assign(CARDS.siphon_guard, { text: "拦截。" });
  Object.assign(CARDS.vein_sentinel, { text: "拦截。" });
  // 帝国 5 费：攻城队长与火药元帅不再同效果、同定位。
  Object.assign(CARDS.siege_captain, { cost: 5, attack: 4, health: 5, keywords: ["battlecry"], target: "none", battlecry: { type: "damageAllEnemies", amount: 1 }, passive: null, text: "登场：对所有敌方随从造成 1 点伤害。" });
  Object.assign(CARDS.powder_marshal, { cost: 5, attack: 5, health: 4, keywords: ["battlecry"], target: "none", battlecry: { type: "armor", amount: 2 }, passive: null, text: "登场：获得 2 点护甲。" });
  // 中立 2 费抽牌/采掘不再同模板。
  Object.assign(CARDS.recon, { cost: 1, spell: { type: "draw", amount: 1 }, excavate: 1, text: "抽 1 张牌；采掘 1。" });
  Object.assign(CARDS.old_ledger, { cost: 3, spell: { type: "draw", amount: 2 }, excavate: null, text: "抽 2 张牌。" });
  Object.assign(CARDS.vein_prospect, { cost: 3, spell: { type: "draw", amount: 1 }, excavate: 2, text: "抽 1 张牌；采掘 2。" });
  // 中立 2 费冻结/余响不再完全同效果。
  Object.assign(CARDS.smoke_screen, { cost: 3, text: "冻结一个敌方随从；抽 1 张牌。" });
  Object.assign(CARDS.sim_assistant, { cost: 3, attack: 2, health: 2, text: "余响：抽 1 张牌。" });
  Object.assign(CARDS.vein_medic, { deathrattle: { type: "healHero", amount: 3 }, text: "余响：恢复你的领袖 3 点生命。" });
  // 共和国拦截光环按费用分级，不再三个费用完全同效果。
  Object.assign(CARDS.bastion_captain, { passive: { type: "tauntAura", amount: 2 }, text: "被动：你召唤的拦截随从获得 +0/+2。" });
  Object.assign(CARDS.shield_marshal, { passive: { type: "tauntAura", amount: 3 }, text: "拦截。被动：你召唤的拦截随从获得 +0/+3。" });

  // 避免严格同效果/同位卡：低费阵位与共和光环各走不同方向。
  Object.assign(CARDS.fog_sailor, { zoneBonus: { attack: 1 }, text: "阵位：若同阵位有另一个友方随从，攻击力 +1。" });
  Object.assign(CARDS.phalanx_warden, { battlecry: { type: "buffAllTaunt", health: 2 }, text: "拦截。登场：所有友方拦截随从获得 +0/+2。" });

  Object.assign(CARDS.blood_imp, { cost: 2 });
  Object.assign(CARDS.gok_digger, { veinBonus: { vein: 4, armor: 2 }, text: "采掘 1；引脉 4：获得 2 点护甲。" });
  Object.assign(CARDS.bard, { battlecry: { type: "discover", pool: "any" }, text: "登场：检索一张牌。" });

  // ===== 阴卡与中立遗物/阵型 =====
  Object.assign(CARDS, {
    secret_police: {
      id: "secret_police", name: "秘密警察", faction: "empire", type: "minion",
      cost: 4, attack: 3, health: 3, rarity: "epic", art: null,
      keywords: ["battlecry"], target: "enemy",
      text: "登场：沉默一个敌方随从。",
      flavor: "档案不会说话，但档案室会。",
      battlecry: { type: "silence" }
    },
    war_tax: {
      id: "war_tax", name: "战争税", faction: "empire", type: "spell",
      cost: 2, rarity: "rare", art: null, target: "none",
      text: "抽 2 张牌；你的领袖受到 1 点伤害。",
      flavor: "税单比炮弹更早抵达前线。",
      spell: { type: "selfDamageDraw", self: 1, draw: 2 }
    },
    emergency_bill: {
      id: "emergency_bill", name: "紧急法案", faction: "republic", type: "spell",
      cost: 2, rarity: "rare", art: null, target: "enemy",
      text: "冻结一个敌方随从；获得 1 点护甲。",
      flavor: "程序走得慢，但冻结得很快。",
      spell: { type: "freezeArmor", armor: 1 }
    },
    impeachment: {
      id: "impeachment", name: "弹劾案", faction: "republic", type: "spell",
      cost: 4, rarity: "epic", art: null, target: "enemy",
      text: "消灭一个敌方随从。",
      flavor: "投票通过的那一刻，席位已经空了。",
      spell: { type: "destroy" }
    },
    wanderer_charm: {
      id: "wanderer_charm", name: "旅者护符", faction: "neutral", type: "relic",
      cost: 2, rarity: "rare", art: null,
      text: "遗物：你的领袖生命上限 +2，并恢复 2 点生命。",
      flavor: "它不指向家，只指向下一段路。"
    },
    wayfarer_camp: {
      id: "wayfarer_camp", name: "旅者营地", faction: "neutral", type: "formation",
      cost: 3, rarity: "rare", art: null,
      text: "阵型：该阵位友方随从获得 +0/+1 和拦截。",
      flavor: "篝火亮着，就还有人愿意守夜。",
      formation: { attack: 0, health: 1, taunt: true }
    },
    wandering_merchant: {
      id: "wandering_merchant", name: "流浪商人", faction: "neutral", type: "minion",
      cost: 2, attack: 2, health: 2, rarity: "common", art: null,
      keywords: ["battlecry"], target: "none",
      text: "登场：抽 1 张牌；若你的手牌不多于 4，再抽 1 张。",
      flavor: "他不卖答案，只卖下一张地图。",
      battlecry: { type: "drawHandCondition", hand: 4, draw: 1 }
    },
    neutral_wayfarer: {
      id: "neutral_wayfarer", name: "无籍旅者", faction: "neutral", type: "minion",
      cost: 3, attack: 3, health: 3, rarity: "common", art: null,
      keywords: ["rush"], target: "none",
      text: "袭扰。",
      flavor: "没有旗帜的人，跑得最快。"
    }
  });

  // 新卡没有生成图时不发 404，直接使用通用阵营徽记。
  for (const id of ["secret_police","war_tax","emergency_bill","impeachment","wanderer_charm","wayfarer_camp","wandering_merchant","neutral_wayfarer"]) {
    if (CARDS[id]) CARDS[id].noGeneratedArt = true;
  }

  Object.assign(CARDS.shextena, { battlecry: { type: "healOverflowBuff", amount: 5 }, text: "登场：恢复一个友方随从 5 点生命；每恢复 1 点，它获得 +1/+1；溢出治疗恢复你的领袖。 对位：若敌方对位阵位有随从，恢复你的领袖 1 点生命。 引脉 6：恢复你的领袖 3 点生命。" });

  Object.assign(CARDS.miyuki, { text: "登场：冻结一个敌方随从；引脉 6：改为冻结所有敌方随从；引脉 10：改为消灭所有敌方随从。" });

  // 深雪改为阵位/阵型协同；冻结组合交给学院的霜系教授。
  Object.assign(CARDS.miyuki, {
    battlecry: { type: "freezeZoneFormation", draw: 1 },
    text: "登场：冻结目标所在阵位的所有敌方随从；若你的同阵位有阵型，抽 1 张牌。"
  });
  Object.assign(CARDS.frost_professor, {
    battlecry: { type: "freezeCombo", allAtVein: 6, destroyAtVein: 10 },
    text: "登场：冻结一个敌方随从；引脉 6：冻结所有敌方随从；引脉 10：冻结并消灭所有敌方随从。"
  });

  // ===== 史诗流派支撑卡 =====
  Object.assign(CARDS, {
    formation_weaver: {
      id: "formation_weaver", name: "阵线织者", faction: "pus", type: "minion",
      cost: 3, attack: 2, health: 4, rarity: "epic", art: null, noGeneratedArt: true,
      keywords: ["battlecry"], target: "none",
      text: "登场：若你控制阵型，获得 +1/+1 并抽 1 张牌。",
      flavor: "她不是在站队，她是在画线。",
      battlecry: { type: "formationPayoff" }
    },
    spell_conductor: {
      id: "spell_conductor", name: "法术指挥", faction: "academy", type: "minion",
      cost: 3, attack: 2, health: 3, rarity: "epic", art: null, noGeneratedArt: true,
      keywords: [], target: "none",
      text: "被动：你每施放一张战术牌，获得 +1/+1。",
      flavor: "她让每一个音节都落在最疼的地方。",
      passive: { type: "spellGrowth", attack: 1, health: 1 }
    },
    blood_executor: {
      id: "blood_executor", name: "血债执行者", faction: "xizhao", type: "minion",
      cost: 4, attack: 3, health: 4, rarity: "epic", art: null, noGeneratedArt: true,
      keywords: [], target: "none",
      text: "被动：每当一个其他友方随从死亡，获得 +1/+1。",
      flavor: "血债不会消失，只会换一个债主。",
      passive: { type: "deathGrowth", attack: 1, health: 1 }
    },
    phalanx_executor: {
      id: "phalanx_executor", name: "方阵执行官", faction: "republic", type: "minion",
      cost: 4, attack: 3, health: 5, rarity: "epic", art: null, noGeneratedArt: true,
      keywords: ["taunt"], target: "none",
      text: "拦截。被动：每当另一个友方拦截随从死亡，抽 1 张牌。",
      flavor: "倒下的人会被记入下一份军报。",
      passive: { type: "tauntDeathDraw", draw: 1 }
    },
    armor_mortar: {
      id: "armor_mortar", name: "装甲炮击", faction: "empire", type: "spell",
      cost: 3, rarity: "epic", art: null, noGeneratedArt: true, target: "none",
      text: "消耗至多 5 点护甲，对敌方领袖造成等量伤害。",
      flavor: "每一块装甲，最后都会变成弹片。",
      spell: { type: "armorToDamage", max: 5 }
    }
  });

  const NEW_DECK_REPLACEMENTS = {
    academy: ["insight", "armor_break"],
    xizhao: ["shadow_raid", "blood_path"],
    republic: [],
    pus: ["coordination", "vein_ward"],
    empire: []
  };
  for (const [faction, [oldId, newId]] of Object.entries(NEW_DECK_REPLACEMENTS)) {
    if (!DECKS[faction]) continue;
    const idx = DECKS[faction].indexOf(oldId);
    if (idx >= 0) DECKS[faction][idx] = newId;
  }

  // ===== 传说随从数值强化：让传说卡有应有的压迫感 =====
  for (const c of Object.values(CARDS)) {
    if (!c.token && !c.disabled && c.rarity === "legendary" && c.type === "minion") {
      c.attack = (c.attack || 0) + 1;
      c.health = (c.health || 0) + 1;
    }
  }

  // ===== 低曲线卡补强：攻血总和低于费用曲线的普通随从 +1 生命 =====
  for (const c of Object.values(CARDS)) {
    if (c.token || c.disabled || c.type !== "minion" || c.rarity === "legendary") continue;
    if ((c.attack || 0) + (c.health || 0) <= (c.cost || 0) * 2) c.health = (c.health || 0) + 1;
  }

  // ===== 平衡与指定卡牌调整 =====
  Object.assign(HEROES.lain.passive, { text: "流脉阈值触发时，恢复所有友方单位 2 点生命。" });
  Object.assign(HEROES.marta.power, { text: "对一个敌方随从或敌方领袖造成 2 点伤害。" });
  Object.assign(HEROES.otto.power, { text: "对一个敌方随从或敌方领袖造成 2 点伤害。" });
  Object.assign(HEROES.wolfram.passive, { text: "当一个友方随从获得拦截时，它获得 +0/+1。" });
  Object.assign(CARDS.aegis_guard, { attack: 4, health: 4 });
  Object.assign(CARDS.lanzhou, { attack: 1, health: 1 });
  Object.assign(CARDS.hunt_ritual, { spell: { type: "damage", amount: 5 }, text: "对一个敌方随从造成 5 点伤害。" });
  Object.assign(CARDS.arcane_theorist, {
    cost: 4, rarity: "legendary", attack: 3, health: 4,
    keywords: ["passive"], battlecry: null, passive: { type: "spellDiscoverOnce" },
    text: "被动：每当你施放一张战术牌，检索一张战术牌。每回合一次。"
  });
  Object.assign(CARDS.borrow_vein, { cost: 2, spell: { type: "gainManaNowNext", mana: 1, next: 1 }, text: "获得 1 行动力；下回合开始时再获得 1 行动力。" });
  Object.assign(CARDS.battle_calc, { disabled: true });
  Object.assign(CARDS.frost_professor, {
    battlecry: { type: "freezeCombo", allAtVein: 6, destroyAtVein: 10 },
    text: "登场：冻结一个敌方随从；引脉 6：冻结所有敌方随从；引脉 10：消灭所有已被冻结的敌方随从。"
  });
  Object.assign(CARDS.arcane_conduit, {
    text: "被动：每当你施放一张战术牌，获得等同于其行动力消耗的护甲。",
    passive: { type: "spellArmor", amount: 0 }
  });
  Object.assign(CARDS.vein_heart, { text: "遗物：每当流脉增加时，获得 1 点护甲；每回合最多一次。" });

  Object.assign(HEROES.karna.power, { text: "对一个友方随从造成 1 点伤害；若它因此死亡，抽 1 张牌。" });
  Object.assign(HEROES.karna.passive, { text: "友方随从受到来自友方的伤害且未死亡时，获得 +1 攻击或 +1 生命。" });

  // 学院补回解场，并补强前期曲线。
  Object.assign(CARDS, {
    formula_fix: {
      id: "formula_fix", name: "公式修正", faction: "academy", type: "spell",
      cost: 2, rarity: "rare", art: null, noGeneratedArt: true, target: "enemy",
      text: "对一个敌方随从造成 3 点伤害。",
      flavor: "错误不会被原谅，只会被重新计算。",
      spell: { type: "damage", amount: 3 }
    }
  });
  Object.assign(CARDS.nina, { health: (CARDS.nina.health || 0) + 1 });
  Object.assign(CARDS.samuel, { health: (CARDS.samuel.health || 0) + 1 });
  Object.assign(CARDS.cassian, { health: (CARDS.cassian.health || 0) + 1 });
  Object.assign(CARDS.arcane_surge, { cost: 4 });
  Object.assign(HEROES.lain.passive, { text: "流脉阈值触发时，恢复所有友方单位 1 点生命。" });

  // 31-card decks: 30 playable cards + exactly one relic
  for (const deckFaction of Object.keys(DECKS)) {
    const relicIds = DECKS[deckFaction].filter(id => CARDS[id] && CARDS[id].type === "relic");
    if (relicIds.length > 1) {
      const keep = relicIds[0];
      let removed = false;
      DECKS[deckFaction] = DECKS[deckFaction].filter(id => {
        if (!removed && CARDS[id] && CARDS[id].type === "relic" && id !== keep) { removed = true; return false; }
        return true;
      });
    }
  }

  // ===== 补齐 200 张：每阵营 30 张，中立扩展 =====
  Object.assign(CARDS.armor_recycle, { faction: "neutral" });
  Object.assign(CARDS, {
    formation_echo: {
      id: "formation_echo", name: "阵线回响", faction: "pus", type: "spell",
      cost: 3, rarity: "epic", art: null, noGeneratedArt: true, target: "none",
      text: "抽 1 张牌；若你控制阵型，获得 2 点护甲。",
      flavor: "阵线不是画在地上的，是画在彼此之间的。",
      spell: { type: "formationDrawArmor", draw: 1, armor: 2 }
    },
    blood_contract: {
      id: "blood_contract", name: "血偿契约", faction: "xizhao", type: "spell",
      cost: 2, rarity: "epic", art: null, noGeneratedArt: true, target: "friendly",
      text: "对一个友方随从造成 2 点伤害；抽 2 张牌。",
      flavor: "契约上写得很清楚：血先流，账后算。",
      spell: { type: "friendlyDamageDraw", amount: 2, draw: 2 }
    },
    double_formula: {
      id: "double_formula", name: "双重公式", faction: "academy", type: "spell",
      cost: 2, rarity: "epic", art: null, noGeneratedArt: true, target: "enemy",
      text: "对一个敌方随从造成 2 点伤害；若本回合此前已施放过战术牌，改为 4 点。",
      flavor: "第二遍验算，通常比第一遍更疼。",
      spell: { type: "doubleSpellDamage", amount: 2, bonus: 4 }
    },
    wandering_guard: {
      id: "wandering_guard", name: "荒野守卫", faction: "neutral", type: "minion",
      cost: 3, attack: 3, health: 4, rarity: "common", art: null, noGeneratedArt: true,
      keywords: ["taunt", "battlecry"], target: "none",
      text: "拦截。登场：恢复你的领袖 1 点生命。",
      battlecry: { type: "healHero", amount: 1 },
      flavor: "他守的不是路，是路过的人。"
    },
    traveling_healer: {
      id: "traveling_healer", name: "旅行医师", faction: "neutral", type: "minion",
      cost: 3, attack: 2, health: 3, rarity: "rare", art: null, noGeneratedArt: true,
      keywords: ["battlecry"], target: "none",
      text: "登场：恢复你的领袖 2 点生命。",
      flavor: "药箱里没有答案，只有下一段路。",
      battlecry: { type: "healHero", amount: 2 }
    },
    old_compass: {
      id: "old_compass", name: "旧罗盘", faction: "neutral", type: "spell",
      cost: 2, rarity: "rare", art: null, noGeneratedArt: true, target: "none",
      text: "检索一张牌。",
      flavor: "它不指向北方，只指向还没走过的方向。",
      spell: { type: "discover", pool: "any" }
    }
  });

  // ===== 设计审核收尾：修正数值、降级过度泛滥的史诗、限制中立发现 =====
  Object.assign(CARDS.blood_ritual, {
    spell: { type: "bloodDraw", damage: 2, draw: 1, extraIfDead: 1 },
    text: "对一个友方随从造成 2 点伤害，抽 1 张牌；若该随从死亡，再抽 1 张牌。"
  });
  Object.assign(CARDS.old_compass, { cost: 3 });
  for (const id of ["vein_oracle","spell_echo","siege_train","vein_bulwark","wind_cannon","rebirth_serpent","excavation_titan","blood_priestess","iron_phalanx","siphon_guard","powder_marshal","vein_siphon","chrono_scholar","archive_devourer","armor_break","aegis_guard"]) {
    if (CARDS[id]) CARDS[id].rarity = "rare";
  }

  // ===== 阵营强弱再平衡 =====
  Object.assign(HEROES.lain, { hp: 28, armor: 8 });
  Object.assign(HEROES.marta, { hp: 32, armor: 10 });
  Object.assign(HEROES.karna, { hp: 36, armor: 10 });
  Object.assign(HEROES.wolfram, { hp: 33, armor: 8 });
  Object.assign(CARDS.shextena, { health: 6 });
  Object.assign(CARDS.orlicas, { health: 2 });
  Object.assign(CARDS.aidric, { health: 6 });
  Object.assign(CARDS.debate, { spell: { type: "damage", amount: 3 }, text: "对一个敌方随从造成 3 点伤害。" });
  Object.assign(CARDS.prohibition, { cost: 2 });

  // ===== 双遗物与阵营特色遗物 =====
  Object.assign(CARDS.spell_codex, { text: "遗物：每个你的回合第一张战术牌的行动力消耗 -2。" });
  Object.assign(CARDS.blood_scythe, { text: "遗物：友方随从死亡时，你的领袖恢复 3 点生命。" });
  Object.assign(CARDS.iron_banner, { text: "遗物：你召唤的拦截随从获得 +1/+1。" });
  Object.assign(CARDS.powder_engine, { text: "遗物：你的回合开始时若敌方领袖没有护甲，造成 2 点伤害。" });
  Object.assign(CARDS.armor_recycle, { faction: "empire", spell: { type: "armor", amount: 5 }, text: "获得 5 点护甲。" });
  Object.assign(CARDS.iron_engineer, { faction: "neutral" });
  Object.assign(CARDS, {
    formation_standard: {
      id: "formation_standard", name: "阵线旗标", faction: "pus", type: "relic",
      cost: 3, rarity: "epic", art: null, noGeneratedArt: true,
      text: "遗物：你控制阵型时，该阵线友方随从额外获得 +1/+1。",
      flavor: "旗子插在哪里，哪里就是阵线。"
    },
    frost_prism: {
      id: "frost_prism", name: "霜晶棱镜", faction: "academy", type: "relic",
      cost: 3, rarity: "epic", art: null, noGeneratedArt: true,
      text: "遗物：每当你施放战术牌，随机冻结一个敌方随从。",
      flavor: "光穿过它时，连时间都会慢半拍。"
    },
    blood_censer: {
      id: "blood_censer", name: "血香炉", faction: "xizhao", type: "relic",
      cost: 3, rarity: "epic", art: null, noGeneratedArt: true,
      text: "遗物：你的回合开始时，对一个友方随从造成 1 点伤害；若它存活，抽 1 张牌。",
      flavor: "香灰落在伤口上，账本又多了一行。"
    },
    republic_seal: {
      id: "republic_seal", name: "议席印玺", faction: "republic", type: "relic",
      cost: 3, rarity: "epic", art: null, noGeneratedArt: true,
      text: "遗物：每当一个友方拦截随从死亡，抽 1 张牌。",
      flavor: "印章落下，死者也有表决权。"
    },
    armor_forge: {
      id: "armor_forge", name: "帝国锻炉", faction: "empire", type: "relic",
      cost: 3, rarity: "epic", art: null, noGeneratedArt: true,
      text: "遗物：你的回合开始时获得 1 点护甲。",
      flavor: "炉火不灭，铁就不会冷。"
    }
  });
  Object.assign(CARDS.fortify, { cost: 2 });
  Object.assign(CARDS.line_rotation, { cost: 1 });
  Object.assign(CARDS.powder_keg, { deathrattle: { type: "damageAllMinions", amount: 5 }, text: "余响：对所有随从造成 5 点伤害。" });
  Object.assign(CARDS.rush_lancer, { attack: 4, health: 5, text: "袭扰。造成伤害时，获得等量护甲。", passive: { type: "damageToArmor" } });
  Object.assign(CARDS.klaus, { battlecry: { type: "buffPerAllMinions", attack: 1, health: 1 }, text: "拦截。登场：场上每有一个随从（不分敌我），获得 +1/+1。" });

  // ===== 遗物独立后补齐每阵营 30 张主卡 =====
  Object.assign(CARDS, {
    vein_attendant: { id: "vein_attendant", name: "引脉侍从", faction: "pus", type: "minion", cost: 2, attack: 2, health: 2, rarity: "rare", art: null, noGeneratedArt: true, keywords: ["battlecry"], target: "none", text: "登场：流脉 +1。", flavor: "他负责把每一滴流脉送到该去的地方。", battlecry: { type: "veinOnly", amount: 1 } },
    formula_apprentice: { id: "formula_apprentice", name: "公式学徒", faction: "academy", type: "minion", cost: 2, attack: 2, health: 2, rarity: "rare", art: null, noGeneratedArt: true, keywords: ["deathrattle"], target: "none", text: "余响：抽 1 张牌。", flavor: "算错的公式，至少还能当草稿纸。", deathrattle: { type: "draw", amount: 1 } },
    blood_acolyte: { id: "blood_acolyte", name: "血祭侍从", faction: "xizhao", type: "minion", cost: 2, attack: 2, health: 2, rarity: "rare", art: null, noGeneratedArt: true, keywords: ["deathrattle"], target: "none", text: "余响：对随机敌方单位造成 1 点伤害。", flavor: "疼痛是血族最诚实的祈祷。", deathrattle: { type: "damageRandomEnemy", amount: 1 } },
    bulwark_sentry: { id: "bulwark_sentry", name: "壁垒哨兵", faction: "republic", type: "minion", cost: 2, attack: 2, health: 3, rarity: "common", art: null, noGeneratedArt: true, keywords: ["taunt"], target: "none", text: "拦截。", flavor: "他不需要跑得比敌人快，只需要比同伴站得久。" },
    iron_mechanic: { id: "iron_mechanic", name: "铁流技工", faction: "empire", type: "minion", cost: 2, attack: 2, health: 2, rarity: "rare", art: null, noGeneratedArt: true, keywords: ["deathrattle"], target: "none", text: "余响：获得 1 点护甲。", flavor: "他修不好炮，但能把炮拆成更多铁。", deathrattle: { type: "armor", amount: 1 } },
    wandering_blade: { id: "wandering_blade", name: "游荡剑客", faction: "neutral", type: "minion", cost: 2, attack: 2, health: 2, rarity: "common", art: null, noGeneratedArt: true, keywords: ["rush"], target: "none", text: "袭扰。", flavor: "没有盟友，也没有退路。" }
  });

  // ===== 帝国指定改动 =====
  Object.assign(CARDS.powder_engine, { text: "遗物：每当一名友方角色死亡，随机对一名敌方单位造成 1 点伤害。" });
  Object.assign(CARDS.gunther, { keywords: ["taunt", "battlecry"], target: "none", battlecry: { type: "armor", amount: 4 }, veinBonus: null, text: "拦截。登场：获得 4 点护甲。" });
  Object.assign(CARDS.martial_court, { text: "每有一个敌方单位，获得 3 点护甲。", spell: { type: "armorPerEnemy", amount: 3 } });
  Object.assign(CARDS.formation_cannon, { text: "阵型：3 回合内，该阵位友方随从获得 +1/+1。", formation: { attack: 1, health: 1, duration: 3 } });
  Object.assign(CARDS.zone_barrage, { text: "对所有敌方随从造成 2 点伤害。", spell: { type: "damageAllEnemies", amount: 2 } });
  Object.assign(CARDS.armor_volley, { cost: 6 });

  Object.assign(CARDS.zone_barrage, { target: "none" });

  // ===== 帝国卡牌指定调整（第二批） =====
  Object.assign(CARDS.siege_captain, { cost: 4 });
  Object.assign(CARDS.powder_marshal, { battlecry: { type: "armor", amount: 5 }, text: "登场：获得 5 点护甲。" });
  Object.assign(CARDS.walter, { keywords: ["battlecry"], deathrattle: null, battlecry: { type: "damagePerArmorRandom", amount: 1 }, text: "登场：每有一点护甲，对一名随机敌方单位造成 1 点伤害。" });
  Object.assign(CARDS.siege_train, { battlecry: { type: "damageAllEnemies", amount: 3 }, text: "登场：对所有敌方随从造成 3 点伤害。" });

  // ===== 统一卡图：消除重复与缺失，使用本卡独立生成图 =====
  for (const id of ["guard","blood_ritual","shadow_raid","shield_marshal","siege_train","borrow_vein","reflux","stabilize","pressure_vein","return_tide","formation_vein","formation_script","formation_tide","formation_wall","formation_cannon","vein_heart","spell_codex","blood_scythe","iron_banner","powder_engine","zone_keeper","zone_archivist","zone_reaper","zone_banner","zone_barrage","vein_bulwark","overload_ritual","aegis_guard","wind_cannon","venom_fang","rebirth_serpent","rush_lancer","combo_spark","arcane_conduit","blood_priestess","blood_altar","tide_colossus","armor_volley","powder_marshal","vein_siphon","arcane_surge","devourer","phalanx_warden","iron_artillery","spellstorm","bastion_captain","chrono_scholar","armor_break","blood_path","anti_rush","vein_ward","quarantine","hunt_ritual","line_rotation","vein_sentinel","armor_recycle","secret_police","war_tax","emergency_bill","impeachment","wanderer_charm","wayfarer_camp","wandering_merchant","neutral_wayfarer","formation_weaver","spell_conductor","blood_executor","phalanx_executor","armor_mortar","formula_fix","formation_echo","blood_contract","double_formula","wandering_guard","traveling_healer","old_compass","formation_standard","frost_prism","blood_censer","republic_seal","armor_forge","vein_attendant","formula_apprentice","blood_acolyte","bulwark_sentry","iron_mechanic","wandering_blade"]) { if (CARDS[id]) { CARDS[id].art = null; CARDS[id].noGeneratedArt = false; } }
  // ===== 学院/西昭指定改动（第三批） =====
  Object.assign(CARDS.nina, {
    battlecry: { type: "freezeZone" },
    text: "登场：冻结目标所在阵位的所有敌方单位。 阵位：若同阵位有另一个友方随从，生命值 +1。"
  });
  Object.assign(CARDS.insight, {
    spell: { type: "drawCopyNextSpell", draw: 1 },
    text: "抽 1 张牌；复制下一张获得的法术牌。"
  });
  Object.assign(CARDS.combo_spark, {
    spell: { type: "damageZone", amount: 3, label: "顺势火花" },
    text: "对目标所在阵位的所有敌方单位造成 3 点伤害。"
  });
  Object.assign(CARDS.zone_archivist, {
    battlecry: { type: "recordIfEnemyZones" },
    text: "登场：若敌方三个阵位都有随从，获得一张 0 行动力「记录弹」。"
  });
  Object.assign(CARDS.justus, {
    battlecry: { type: "copyLowestSpell" },
    vein: null,
    text: "登场：复制你手牌中行动力消耗最低的战术牌；若其消耗大于等于 5，复制两张。"
  });
  Object.assign(CARDS.karl_desmond, {
    zoneBonus: { discoverSpell: 1 },
    mirrorBonus: { discoverSpell: 1 },
    text: "登场：检索一张战术牌。 阵位：若同阵位有另一个友方随从，额外检索一张战术牌。 对位：若敌方对位阵位有随从，额外检索一张战术牌。"
  });
  Object.assign(CARDS.cassian, {
    cost: 7, attack: 2, health: 2, keywords: [],
    passive: { type: "repeatLastSpell" },
    zoneBonus: null,
    text: "你的回合结束时，重复你释放的最后一个法术。"
  });
  Object.assign(CARDS.spellstorm, {
    cost: 10,
    target: "none",
    spell: { type: "damageAllEnemiesPerGameSpell", amount: 2 },
    text: "对所有敌方随从造成 2×你在本局使用的法术数量的伤害。"
  });
  Object.assign(CARDS.losutai_imp, {
    text: "每回合开始时获得 +1/+1。 余响：对随机敌方单位造成等同于攻击力的伤害（最高 5 点）。",
    noGeneratedArt: false,
    passive: { type: "turnGrowth", attack: 1, health: 1 },
    deathrattle: { type: "damageRandomEnemy", amountFromAttack: true, max: 5 },
    keywords: ["deathrattle"]
  });
  Object.assign(CARDS, {
    record_shot: {
      id: "record_shot", name: "记录弹", faction: "academy", type: "spell",
      cost: 0, rarity: "token", art: null, noGeneratedArt: true, token: true,
      target: "enemy", keywords: [], text: "对一个敌方随从造成 1 点伤害。",
      spell: { type: "damage", amount: 1 }
    }
  });

  // ===== v0.2 平衡补丁（2026-10-19） =====
  // 大学院：补前期站场与法术节奏，保留第三批机制。
  Object.assign(CARDS.karl_desmond, { health: 6 });
  Object.assign(CARDS.justus, { health: 4 });
  Object.assign(CARDS.cassian, { cost: 5, attack: 4, health: 4 });
  Object.assign(CARDS.samuel, { health: 4 });
  Object.assign(CARDS.nina, { attack: 4 });
  Object.assign(CARDS.lecturer, { attack: 4 });
  Object.assign(CARDS.spellstorm, { cost: 6 });

  // 帝国：降低非指定卡的整体节奏，指定卡（京特/克劳斯/瓦尔特/军事法庭/火药元帅等）不动。
  Object.assign(CARDS.mia, { attack: 2, health: 1 });
  Object.assign(CARDS.elsa, { health: 3 });
  Object.assign(CARDS.karl_schwarz, { attack: 4, health: 2 });
  Object.assign(CARDS.powder_boy, { health: 1 });
  Object.assign(CARDS.iron_artillery, { attack: 3, health: 4 });
  Object.assign(CARDS.wind_cannon, { attack: 3, health: 3 });
  Object.assign(CARDS.ironclad, { attack: 2, health: 2 });
  Object.assign(CARDS.barrage, { cost: 2 });
  Object.assign(CARDS.mobilize, { cost: 4 });
  Object.assign(CARDS.fortress, { spell: { type: "buffTaunt", attack: 0, health: 1 }, text: "使一个友方随从获得 +0/+1 与拦截。" });

  // 共和国：整包嘲讽/护甲下调；筑防令、阵线轮换、护幕守卫、沃尔夫拉姆被动不动。
  Object.assign(CARDS.konrad, { health: 4 });
  Object.assign(CARDS.erhardt, { attack: 4 });
  Object.assign(CARDS.beatrix, { attack: 3 });
  Object.assign(CARDS.hans, { attack: 2, health: 2 });
  Object.assign(CARDS.cedric, { health: 5 });
  Object.assign(CARDS.elena, { attack: 3 });
  Object.assign(CARDS.republic_guard, { health: 2 });
  Object.assign(CARDS.shield_bearer, { health: 4 });
  Object.assign(CARDS.shield_marshal, { attack: 3, health: 6 });
  Object.assign(CARDS.phalanx_warden, { health: 5 });
  Object.assign(CARDS.shield_sergeant, { health: 5 });
  Object.assign(CARDS.martial_law, { cost: 6 });
  Object.assign(CARDS.stabilize, { spell: { type: "veinTrade", amount: -2, armor: 2 }, text: "流脉 -2；获得 2 点护甲。" });

  // 西昭/普卫岛：在“领袖无开场护甲”新规则下维持预组强度，不再额外上调。

  // ===== 领袖不再拥有开场护甲；血量无上限 =====
  for (const h of Object.values(HEROES)) h.armor = 0;

  // ===== 平衡版数值（v0.2） =====
  Object.assign(HEROES.lain, { hp: 28, armor: 0 });
  Object.assign(HEROES.marta, { hp: 32, armor: 0 });
  Object.assign(HEROES.karna, { hp: 36, armor: 0 });
  Object.assign(HEROES.wolfram, { hp: 33, armor: 0 });
  Object.assign(HEROES.otto, { hp: 31, armor: 0 });
  Object.assign(HEROES.lain.passive, { text: "流脉阈值触发时，恢复所有友方单位 1 点生命。" });
  Object.assign(HEROES.marta.power, { text: "对一个敌方随从或敌方领袖造成 2 点伤害。" });
  Object.assign(HEROES.otto.power, { text: "对一个敌方随从或敌方领袖造成 2 点伤害。" });
  Object.assign(HEROES.karna.passive, { name: "血债共鸣", text: "友方随从受到来自友方的伤害且未死亡时，获得 +1 攻击或 +1 生命。" });
  Object.assign(CARDS.shextena, { health: 6 });


  // ===== v0.3 微调：学院前期 + 帝国小幅降温 =====
  Object.assign(HEROES.otto, { hp: 30 });
  Object.assign(CARDS.formula_apprentice, { health: 3 });
  Object.assign(CARDS.spell_novice, { health: 3 });

  // ===== 英雄主动技能恢复最初版本 =====
  Object.assign(HEROES.marta.power, { text: "对敌方领袖造成 2 点伤害。" });
  Object.assign(HEROES.otto.power, { text: "对一个敌方随从或敌方领袖造成 1 点伤害。" });

  // ===== 审计修复：保卫部卫兵的引脉 4 护甲 =====
  Object.assign(CARDS.guard, { veinBonus: { vein: 4, armor: 1 } });

  // ===== 关键词与文本一致性收尾 =====
  Object.assign(CARDS.klaus, { text: "拦截。登场：场上每有一个其他随从（不分敌我），获得 +1/+1。" });

  // ===== “敌方单位”语义：领袖 + 所有随从 =====
  Object.assign(CARDS.zone_barrage, { target: "none", text: "对所有敌方单位造成 2 点伤害。", spell: { type: "damageAllEnemyUnits", amount: 2 } });
  Object.assign(CARDS.martial_court, { text: "每有一个敌方单位（包括领袖），获得 3 点护甲。", spell: { type: "armorPerEnemy", amount: 3 } });
  Object.assign(CARDS.walter, { text: "登场：每有一点护甲，对一名随机敌方单位（包括领袖）造成 1 点伤害。" });
  Object.assign(CARDS.nina, { text: "登场：冻结目标所在阵位的所有敌方随从。 阵位：若同阵位有另一个友方随从，生命值 +1。" });
  Object.assign(CARDS.combo_spark, { text: "对目标所在阵位的所有敌方随从造成 3 点伤害。" });

  // ===== 法术风暴最终调整 =====
  Object.assign(CARDS.spellstorm, {
    cost: 8,
    target: "none",
    spell: { type: "damageAllEnemyUnitsPerGameSpell", amount: 1 },
    text: "对所有敌方单位造成等同于本局已使用的战术牌数量的伤害。"
  });

  Object.assign(CARDS.losutai_beast, { noGeneratedArt: false, text: "" });

  // ===== 阵营纹章 AI 资产 =====
  {
    const emblemMap = {
      pus: "/assets/ui/emblem-pus.webp?v=20261020cc",
      academy: "/assets/ui/emblem-academy.webp?v=20261020cc",
      xizhao: "/assets/ui/emblem-xizhao.webp?v=20261020cc",
      republic: "/assets/ui/emblem-republic.webp?v=20261020cc",
      empire: "/assets/ui/emblem-empire.webp?v=20261020cc"
    };
    for (const f of Object.keys(emblemMap)) if (FACTIONS[f]) FACTIONS[f].emblem = emblemMap[f];
  }

  // final pass: every preset is 30 playable + exactly one relic
  for (const deckFaction of Object.keys(DECKS)) {
    const relicIds = DECKS[deckFaction].filter(id => CARDS[id] && CARDS[id].type === "relic");
    if (relicIds.length > 1) {
      const keep = relicIds[0];
      let removed = false;
      DECKS[deckFaction] = DECKS[deckFaction].filter(id => {
        if (!removed && CARDS[id] && CARDS[id].type === "relic" && id !== keep) { removed = true; return false; }
        return true;
      });
    }
  }

  // ===== 2026-10-19 卡牌重构：行动力、动态阵位、引脉阈值、采掘、删卡 =====
  Object.assign(CARDS.medic_apprentice, {
    keywords: [],
    deathrattle: null,
    veinBonus: null,
    text: "引脉 4/8：恢复你的领袖 1/3 点生命。",
    veinTiers: [{ vein: 4, healHero: 1 }, { vein: 8, healHero: 3 }]
  });
  Object.assign(CARDS.courier, {
    text: "阵位：同阵位每有一个其他随从，获得 +0/+1。",
    zoneBonus: { health: 1 }
  });
  Object.assign(CARDS.vein_attendant, {
    text: "登场：流脉 +1。 引脉 2：获得 +1/+1。",
    veinTiers: [{ vein: 2, attack: 1, health: 1 }]
  });
  Object.assign(CARDS.guard, {
    name: "保卫部步兵",
    keywords: [],
    text: "阵位：同阵位每有一个其他随从，获得 +1/+0。 引脉 4：获得 +1/+0。 引脉 8：获得 +2/+0。",
    zoneBonus: { attack: 1 },
    veinBonus: null,
    veinTiers: [{ vein: 4, attack: 1 }, { vein: 8, attack: 2 }]
  });
  Object.assign(CARDS.orlicas, {
    text: "登场：抽 1 张牌；引脉 4：再抽 1 张牌。 阵位：同阵位其他随从获得 +1/+1。",
    zoneBonus: null,
    zoneAura: { attack: 1, health: 1 }
  });
  Object.assign(CARDS.timon, {
    text: "登场：本回合你打出的下一张牌行动力消耗减少 1。 阵位：同阵位每有一个其他随从，获得 +0/+1。",
    zoneBonus: { health: 1 }
  });
  Object.assign(CARDS.zone_keeper, {
    text: "阵位：同阵位每有一个其他随从，获得 +2/+2。",
    zoneBonus: { attack: 2, health: 2 }
  });
  Object.assign(CARDS.formation_weaver, {
    text: "登场：若该卡被召唤到已经使用阵型卡的阵位，获得 +1/+1 并抽 1 张牌。"
  });
  Object.assign(CARDS.aidric, {
    keywords: ["taunt"],
    passive: null,
    text: "拦截。 引脉 4：获得 +1/+1。 引脉 8：获得 +2/+2。",
    veinBonus: null,
    veinTiers: [{ vein: 4, attack: 1, health: 1 }, { vein: 8, attack: 2, health: 2 }]
  });
  Object.assign(CARDS.shextena, {
    target: "none",
    mirrorBonus: null,
    text: "登场：恢复你的领袖 5 点生命；每实际恢复 1 点，希斯蒂娜获得 +1/+1。 引脉 10：恢复你的领袖 5 点生命。",
    battlecry: { type: "healHeroSelfBuff", amount: 5 },
    keywords: ["battlecry"],
    zoneBonus: null,
    veinBonus: null,
    veinTiers: [{ vein: 10, healHero: 5 }]
  });
  Object.assign(CARDS.miyuki, {
    cost: 6,
    target: "none",
    text: "登场：冻结场上除自己阵位以外的全部随从，包括友方。 阵位：深雪存活时，同阵位所有随从不会被冻结。",
    battlecry: { type: "freezeAllExceptOwnZone" }
  });
  Object.assign(CARDS.vein_oracle, {
    text: "引脉 6：抽 1 张牌。",
    battlecry: null,
    keywords: [],
    veinTiers: [{ vein: 6, draw: 1 }]
  });
  Object.assign(CARDS.excavation_titan, {
    text: "登场：流脉 +2。 引脉 4：获得 +2/+1。 引脉 8：获得 +3/+2。",
    veinTiers: [{ vein: 4, attack: 2, health: 1 }, { vein: 8, attack: 3, health: 2 }]
  });
  Object.assign(CARDS.vein_heart, {
    text: "遗物：每触发一次引脉，恢复你的领袖 2 点生命。"
  });
  Object.assign(CARDS.formation_standard, {
    text: "遗物：使用过阵型卡的阵位上，所有随从固定获得 +1/+1。以任何方式来到该阵位的随从都会获得。"
  });
  Object.assign(CARDS.formation_vein, {
    text: "阵型：该阵位随从固定获得余响：恢复你的领袖 1 点生命。",
    formation: { attack: 0, health: 0, veinDeathrattle: true }
  });
  Object.assign(CARDS.coordination, {
    cost: 2,
    text: "使目标所在阵位的所有随从获得 +1/+1。",
    spell: { type: "buffZone", attack: 1, health: 1 }
  });
  Object.assign(CARDS.vein_scout, {
    text: "突进。 引脉 3：获得 +1/+0。",
    veinTiers: [{ vein: 3, attack: 1 }]
  });
  Object.assign(CARDS.resonance, {
    cost: 2,
    excavate: 2,
    text: "采掘 2：抽 2 张牌，流脉 +2。",
    spell: { type: "none" }
  });
  Object.assign(CARDS.insight, { text: "采掘 1：抽 1 张牌，流脉 +1；复制下一张获得的法术牌。", spell: { type: "drawCopyNextSpell", draw: 0 } });
  Object.assign(CARDS.recon, { text: "采掘 1：抽 1 张牌，流脉 +1。", spell: { type: "none" } });
  Object.assign(CARDS.vein_prospect, { text: "采掘 2：抽 2 张牌，流脉 +2。", spell: { type: "none" } });
  for (const id of ["vein_channeler","vein_sentinel","vein_bulwark","vein_surveyor","siphon_guard","vein_ward","overload_ritual","return_tide","formation_echo"]) {
    if (CARDS[id]) Object.assign(CARDS[id], { disabled: true });
  }
  // 阵位数值效果现在都是动态的：把旧文案里的“另一个”统一成“每有一个随从”
  for (const c of Object.values(CARDS)) {
    if (!c || !c.text || !c.zoneBonus || (!c.zoneBonus.attack && !c.zoneBonus.health)) continue;
    c.text = c.text.replace("若同阵位有另一个友方随从", "同阵位每有一个随从").replace("若同阵位有另一个友方随从", "同阵位每有一个随从");
    if (c.id === "courier") c.text = "阵位：同阵位每有一个其他随从，获得 +0/+1。";
    if (c.id === "guard") c.text = "阵位：同阵位每有一个其他随从，获得 +1/+0。 引脉 4：获得 +1/+0。 引脉 8：获得 +2/+0。";
    if (c.id === "timon") c.text = "登场：本回合你打出的下一张牌行动力消耗减少 1。 阵位：同阵位每有一个其他随从，获得 +0/+1。";
    if (c.id === "zone_keeper") c.text = "阵位：同阵位每有一个其他随从，获得 +2/+2。";
  }
  // 三人阵位后，不再使用“另一个”这种只能指代一个随从的措辞
  for (const c of Object.values(CARDS)) {
    if (!c || !c.text) continue;
    c.text = c.text.replace(/若同阵位有另一个友方随从/g, "若同阵位有其他友方随从")
      .replace(/若你控制另一个友方随从/g, "若你控制其他友方随从")
      .replace(/若你控制另一个随从/g, "若你控制其他随从")
      .replace(/每当另一个友方拦截随从死亡/g, "每当其他友方拦截随从死亡");
  }
  // 删除卡从普卫岛预组中移除，并补回 30 张带牌
  {
    const removed = new Set(["vein_channeler","vein_sentinel","vein_bulwark","vein_surveyor","siphon_guard","vein_ward","overload_ritual","return_tide","formation_echo"]);
    const keep = DECKS.pus.filter(id => !removed.has(id));
    const counts = {};
    for (const id of keep) counts[id] = (counts[id] || 0) + 1;
    const candidates = ["emergency","coordination","vein_scout","snow_medic","mist_scout","verious","medic_apprentice","vein_siphon","zone_keeper","fog_sailor"];
    let ci = 0;
    while (keep.filter(id => CARDS[id] && CARDS[id].type !== "relic").length < 30 && ci < 40) {
      const id = candidates[ci % candidates.length];
      const def = CARDS[id];
      if (def && (counts[id] || 0) < maxCopies(def)) { counts[id] = (counts[id] || 0) + 1; keep.splice(Math.max(0, keep.length - 1), 0, id); }
      ci++;
    }
    DECKS.pus = keep;
  }

  // ===== 2026-10-19 学院重做（用户指定） =====
  // 逆流 N：消耗 N 点流脉来触发；流脉不足 N 时消耗到 0 仍触发；流脉为 0 时逆流效果无效。
  // 冻结：不写“随机”的冻结一律为指定冻结；对方没有可冻结随从时冻结不触发，但随从照常落地。
  Object.assign(CARDS.spell_novice, {
    cost: 1, attack: 1, health: 3, reflux: 1,
    keywords: ["battlecry"], target: "none",
    battlecry: { type: "freeSpellTurn" },
    text: "逆流 1：本回合你的下一张法术不消耗行动力。"
  });
  Object.assign(CARDS.doorman, {
    cost: 1, attack: 1, health: 2, reflux: 1,
    keywords: ["battlecry"], target: "none", taunt: false, veinBonus: null,
    battlecry: { type: "gainMana", amount: 2 },
    text: "逆流 1：获得 2 点行动力。"
  });
  Object.assign(CARDS.formula_apprentice, { disabled: true });
  Object.assign(CARDS.nina, {
    cost: 2, attack: 4, health: 4, reflux: 1,
    keywords: ["battlecry"], target: "enemy", optionalTarget: true,
    battlecry: { type: "freezeZone" }, zoneBonus: null, mirrorBonus: null,
    text: "逆流 1：冻结目标所在阵位的所有敌方随从。"
  });
  Object.assign(CARDS.samuel, {
    cost: 2, attack: 3, health: 4,
    keywords: ["battlecry"], target: "none", zoneBonus: null,
    battlecry: { type: "randomFreeze" },
    text: "登场：随机冻结一名敌方随从。"
  });
  Object.assign(CARDS.zone_archivist, {
    cost: 3, attack: 2, health: 4,
    keywords: ["passive"], target: "none", battlecry: null,
    passive: { type: "deathRecordShot" },
    text: "被动：每当一个友方随从死亡，获得一张 0 行动力「记录弹」。"
  });
  Object.assign(CARDS.lecturer, {
    cost: 3, attack: 4, health: 4, reflux: 1,
    keywords: ["battlecry"], target: "none", deathrattle: null,
    battlecry: { type: "draw", amount: 1 },
    text: "逆流 1：抽 1 张牌。"
  });
  Object.assign(CARDS.justus, {
    cost: 3, attack: 4, health: 4, veinBonus: null,
    keywords: ["battlecry"], target: "none",
    battlecry: { type: "copyLowestSpell" },
    text: "登场：复制你手牌中行动力消耗最低的战术牌；若其消耗小于 5，复制两张。"
  });
  Object.assign(CARDS.arcane_conduit, {
    cost: 4, attack: 3, health: 5,
    keywords: ["passive"], target: "none",
    passive: { type: "spellDrawByCost" },
    text: "被动：每当你施放一张战术牌，抽等同于其行动力消耗的牌。"
  });
  Object.assign(CARDS.echo_adept, {
    cost: 4, attack: 3, health: 4, reflux: 2,
    keywords: ["battlecry"], target: "enemy", optionalTarget: true, passive: null,
    battlecry: { type: "freezeZoneGrowth", attack: 1, health: 1 },
    text: "逆流 2：冻结目标所在阵位的所有敌方随从；每冻结一个随从，获得 +1/+1。"
  });
  Object.assign(CARDS.karl_desmond, {
    cost: 4, attack: 4, health: 6,
    keywords: ["passive"], target: "none", battlecry: null,
    zoneBonus: null, mirrorBonus: null,
    passive: { type: "deathDiscoverSpell" },
    text: "被动：每当一个友方随从死亡，检索一张战术牌。"
  });
  Object.assign(CARDS.cassian, {
    cost: 5, attack: 4, health: 4,
    keywords: ["passive"], target: "none",
    passive: { type: "repeatLastSpell" },
    text: "被动：你的回合结束时，重复你最后使用的一张战术牌。"
  });
  Object.assign(CARDS.frost_professor, {
    cost: 5, attack: 4, health: 6, reflux: 3,
    keywords: ["battlecry", "passive"], target: "enemy", optionalTarget: true,
    battlecry: { type: "freeze" },
    passive: { type: "attackDestroyFrozen" },
    text: "逆流 3：冻结一个敌方随从。 被动：你攻击已被冻结的随从时，直接消灭该随从。"
  });
  Object.assign(CARDS.spell_echo, { cost: 3 });
  Object.assign(CARDS.formation_script, {
    cost: 3,
    formation: { attack: 0, health: 0, rush: true },
    text: "阵型：该阵位随从固定获得袭扰。"
  });
  Object.assign(CARDS.formula_fix, {
    cost: 4,
    spell: { type: "damagePerMinionCount" },
    text: "对一个敌方随从造成等同于场上所有随从数量的伤害。"
  });
  Object.assign(CARDS.prohibition, { cost: 3 });
  Object.assign(CARDS.double_formula, {
    cost: 3, target: "none",
    spell: { type: "randomDamageUpgrade", amount: 2, bonus: 5 },
    text: "随机对一个敌方单位造成 2 点伤害；若本回合此前已施放过战术牌，改为 5 点。"
  });
  Object.assign(CARDS.combo_spark, { cost: 3 });
  Object.assign(CARDS.armor_break, {
    cost: 3, target: "none",
    spell: { type: "stripArmorToMana", amount: 5 },
    text: "移除敌方领袖至多 5 点护甲；每移除 1 点护甲，获得 1 点行动力。"
  });
  Object.assign(CARDS.arcane_surge, {
    cost: 4,
    spell: { type: "damageAllPerSpell", amount: 1 },
    text: "对所有敌方随从造成 1 点伤害；本回合你每施放过一张战术牌，伤害 +1。"
  });

  // ===== 2026-10-19 西昭重做（用户指定） =====
  // 压脉 N：流脉 ≥ N 时消耗 N 点流脉，对敌方领袖造成 N 点伤害；流脉不足 N 点则不触发。
  Object.assign(CARDS.tribal_warrior, {
    bloodCost: 2, zoneBonus: null,
    text: "血祭 2：获得 +1/+1。"
  });
  Object.assign(CARDS.lanzhou, {
    keywords: ["battlecry", "stealth"], zoneBonus: null,
    text: "登场：召唤一个 1/1 洛斯汰魔物。 隐匿。"
  });
  Object.assign(CARDS.lize, {
    keywords: ["battlecry"], pressure: 2,
    battlecry: { type: "draw", amount: 1 },
    text: "登场：抽 1 张牌。 压脉 2：消耗 2 点流脉，对敌方领袖造成 2 点伤害。"
  });
  Object.assign(CARDS.blood_imp, {
    keywords: ["lifesteal"], deathrattle: null,
    text: "汲取。"
  });
  Object.assign(CARDS.blood_acolyte, {
    keywords: ["battlecry"], bloodCost: 2,
    battlecry: { type: "bloodDamageAllEnemies", amount: 1 },
    text: "血祭 2：对所有敌方随从造成 1 点伤害。"
  });
  Object.assign(CARDS.venom_fang, {
    keywords: ["poisonous", "lifesteal", "stealth"],
    text: "蚀毒。汲取。隐匿。"
  });
  Object.assign(CARDS.losutai_hunter, {
    keywords: ["deathrattle", "stealth"], zoneBonus: null, pressure: 1,
    text: "隐匿。 余响：对随机敌方单位造成 1 点伤害。 压脉 1：消耗 1 点流脉，对敌方领袖造成 1 点伤害。"
  });
  Object.assign(CARDS.molan, {
    keywords: ["battlecry"], target: "none", zoneBonus: null, bloodCost: 1,
    battlecry: { type: "discoverMinionBloodBuff", attack: 2 },
    text: "登场：检索一张随从牌；血祭 1：获得 +2 攻击。"
  });
  Object.assign(CARDS.blood_servant, {
    keywords: ["deathrattle", "lifesteal"], pressure: 1,
    text: "余响：使一个友方随从获得 +1 攻击。 汲取。 压脉 1：消耗 1 点流脉，对敌方领袖造成 1 点伤害。"
  });
  Object.assign(CARDS.grayfeather, {
    keywords: ["battlecry"], target: "none", mirrorBonus: null, pressure: 1,
    battlecry: { type: "devourZoneAllies" },
    text: "登场：吞噬同阵位所有其他友方随从，获得其攻击力和生命值。 压脉 1：消耗 1 点流脉，对敌方领袖造成 1 点伤害。"
  });
  Object.assign(CARDS.tiega, {
    bloodCost: 2,
    text: "突进。血祭 2：获得 +2 攻击。"
  });
  Object.assign(CARDS.blood_executor, {
    keywords: ["passive", "lifesteal"],
    text: "汲取。被动：每当一个其他友方随从死亡，获得 +1/+1。"
  });
  Object.assign(CARDS.brood_matron, {
    keywords: ["battlecry"], battlecry: { type: "summonCount", token: "losutai_imp", count: 2 },
    text: "登场：召唤两个 1/1 洛斯汰魔物。"
  });
  Object.assign(CARDS.rebirth_serpent, { disabled: true });
  Object.assign(CARDS.lanxi, {
    keywords: ["passive"], target: "none", battlecry: null, veinBonus: null, pressure: 2,
    passive: { type: "impGrowth", attack: 1, health: 1 },
    text: "压脉 2：消耗 2 点流脉，对敌方领袖造成 2 点伤害。 被动：场上每有一个洛斯汰魔物，获得 +1/+1。"
  });
  Object.assign(CARDS.blood_priestess, {
    keywords: ["battlecry", "lifesteal"],
    battlecry: { type: "devourLowestHealth" },
    text: "登场：吞噬生命值最低的友方随从，获得其攻击力和生命值。 汲取。"
  });
  Object.assign(CARDS.losutai_matriarch, {
    keywords: ["battlecry"], deathrattle: null,
    battlecry: { type: "summonCount", token: "losutai_imp", count: 2 },
    text: "登场：召唤两个 1/1 洛斯汰魔物。"
  });
  Object.assign(CARDS.tide_colossus, {
    keywords: ["battlecry", "lifesteal", "stealth"], bloodCost: 3, pressure: 1,
    battlecry: { type: "devourBloodBuff", attack: 2, health: 2 },
    text: "登场：吞噬一个攻击力最低的友方随从，获得其攻击力和生命值；血祭 3：获得 +2/+2。 汲取。 隐匿。 压脉 1：消耗 1 点流脉，对敌方领袖造成 1 点伤害。"
  });
  Object.assign(CARDS.formation_tide, {
    formation: { attack: 0, health: 0, lifesteal: true, stealth: true },
    text: "阵型：该阵位所有随从固定获得汲取和隐匿。"
  });
  Object.assign(CARDS.blood_censer, {
    text: "遗物：你的回合开始时，对场上随机一个随从（不分敌我）造成 1 点伤害；若它存活，你抽 1 张牌。"
  });
  Object.assign(CARDS.shadow_raid, {
    spell: { type: "buffStealth", attack: 2 },
    text: "使一个友方随从获得 +2 攻击和隐匿。"
  });
  Object.assign(CARDS.reflux, {
    cost: 2, pressure: 3, spell: { type: "healHero", amount: 3 },
    text: "压脉 3：消耗 3 点流脉，对敌方领袖造成 3 点伤害；恢复你的领袖 3 点生命。"
  });
  Object.assign(CARDS.blood_path, {
    spell: { type: "buffLifesteal", attack: 1 },
    text: "使一个友方随从获得 +1 攻击和汲取。"
  });
  Object.assign(CARDS.blood_pact, {
    cost: 2, target: "friendly", spell: { type: "bloodGrant", health: 3 },
    text: "支付 3 点生命，使一个友方随从获得汲取和隐匿。"
  });
  Object.assign(CARDS.monster_summon, {
    cost: 5, pressure: 1, spell: { type: "summonMonster", doubleIfZoneEmpty: true },
    text: "召唤一个 3/3 洛斯汰巨兽；若其阵位没有其他随从，再召唤一个 3/3 洛斯汰巨兽。 压脉 1：消耗 1 点流脉，对敌方领袖造成 1 点伤害。"
  });
  Object.assign(CARDS.pressure_vein, {
    pressure: 3, spell: { type: "none" },
    text: "压脉 3：消耗 3 点流脉，对敌方领袖造成 3 点伤害。"
  });

  // ===== 2026-10-19 共和国重做（用户指定） =====
  Object.assign(CARDS, {
    republic_recruit: {
      id: "republic_recruit", name: "共和国新兵", faction: "republic", type: "minion",
      cost: 0, attack: 1, health: 1, rarity: "token", art: null, noGeneratedArt: true, noArtwork: true,
      token: true, keywords: [], target: "none", text: ""
    }
  });
  Object.assign(CARDS.bulwark_sentry, {
    keywords: ["taunt", "reborn"],
    text: "拦截。回潮。"
  });
  Object.assign(CARDS.shield_recruit, {
    keywords: ["taunt"], mirrorBonus: { attack: 1 },
    text: "拦截。 对位：若敌方对位阵位有随从，获得 +1/+0。"
  });
  Object.assign(CARDS.republic_guard, {
    keywords: ["taunt", "deathrattle"], zoneBonus: null, mirrorBonus: { health: 1 },
    deathrattle: { type: "damageRandomMinion", amount: 2 },
    text: "余响：对随机一个敌方随从造成 2 点伤害。 对位：若敌方对位阵位有随从，生命值 +1。"
  });
  Object.assign(CARDS.shield_bearer, {
    keywords: ["battlecry"], target: "none", zoneBonus: null,
    battlecry: { type: "comboTauntGrowth", health: 1 },
    text: "顺势：本回合你每打出一个友方拦截随从，获得 +0/+1。"
  });
  Object.assign(CARDS.elena, {
    keywords: ["battlecry"], target: "none", deathrattle: null,
    battlecry: { type: "mirrorSummon", token: "republic_recruit" },
    text: "登场：若敌方对位阵位有随从，召唤一个 1/1 的共和国新兵。"
  });
  Object.assign(CARDS.erhardt, {
    keywords: ["charge", "reborn", "battlecry"], zoneBonus: null,
    battlecry: { type: "comboDeathGrowth", attack: 1, health: 1 },
    text: "突进。回潮。 顺势：本回合场上每死亡一个随从，获得 +1/+1。"
  });
  Object.assign(CARDS.beatrix, {
    veinBonus: null,
    keywords: ["battlecry"], target: "friendly",
    battlecry: { type: "grantReborn" },
    text: "登场：使一个友方随从获得回潮。"
  });
  Object.assign(CARDS.shield_sergeant, {
    keywords: ["taunt", "deathrattle"], battlecry: null,
    deathrattle: { type: "buffAllTaunt", health: 1 },
    text: "拦截。余响：所有友方拦截随从获得 +0/+1。"
  });
  Object.assign(CARDS.phalanx_warden, {
    keywords: ["taunt", "deathrattle"], battlecry: null,
    deathrattle: { type: "buffAllAllies", health: 1 },
    mirrorBonus: { health: 2 },
    text: "拦截。余响：所有友方随从获得 +0/+1。 对位：若敌方对位阵位有随从，获得 +0/+2。"
  });
  Object.assign(CARDS.phalanx_executor, {
    keywords: ["passive"], mirrorBonus: { draw: 1 },
    text: "被动：每当另一个友方拦截随从死亡，抽 1 张牌。 对位：若敌方对位阵位有随从，再抽 1 张牌。"
  });
  Object.assign(CARDS.konrad, {
    keywords: ["battlecry"], target: "friendly", passive: null, veinBonus: null,
    battlecry: { type: "grantDeathrattleDamage", amount: 1 },
    mirrorBonus: { summon: "republic_recruit" },
    text: "登场：使一个友方随从获得余响：对随机一个敌方随从造成 1 点伤害。 对位：若敌方对位阵位有随从，召唤一个 1/1 的共和国新兵。"
  });
  Object.assign(CARDS.iron_phalanx, {
    keywords: ["taunt", "battlecry", "deathrattle"],
    battlecry: { type: "comboMinionGrowth", attack: 1, health: 1 },
    deathrattle: { type: "damageAllEnemyUnits", amount: 1 },
    text: "拦截。顺势：本回合你每使用一个随从，获得 +1/+1。 余响：对敌方所有单位造成 1 点伤害。"
  });
  Object.assign(CARDS.shield_marshal, {
    cost: 7, passive: null, keywords: ["taunt", "reborn", "deathrattle", "battlecry"],
    battlecry: { type: "shieldMarshal", attack: 1, health: 1 },
    deathrattle: { type: "summon", token: "republic_recruit", count: 2 },
    text: "拦截。回潮。余响：召唤两个 1/1 的共和国新兵。 顺势：本回合你每召唤一个共和国新兵，获得 +1/+1。 对位：若敌方对位阵位没有随从，召唤一个 1/1 的共和国新兵。"
  });
  Object.assign(CARDS.formation_wall, {
    formation: { attack: 0, health: 0, deathrattleSummon: "republic_recruit", summonOnPlay: "republic_recruit" },
    text: "阵型：该阵位所有友方随从获得余响：召唤一个 1/1 的共和国新兵。布置时在该阵位召唤一个 1/1 的共和国新兵。"
  });
  Object.assign(CARDS.emergency_bill, {
    target: "enemy", target2: "friendly",
    spell: { type: "freezeGrantReborn" },
    text: "冻结一个敌方随从；使一个友方随从获得回潮。"
  });
  Object.assign(CARDS.stabilize, { disabled: true });
  Object.assign(CARDS.fortify, {
    target: "friendly", spell: { type: "grantDeathrattleDamage", amount: 2 },
    text: "使一个友方随从获得余响：对随机一个敌方随从造成 2 点伤害。"
  });
  Object.assign(CARDS.anti_rush, {
    spell: { type: "drawIfEnemyNoMinions" },
    text: "抽 1 张牌；若敌方场上没有随从，再抽 1 张牌。"
  });
  Object.assign(CARDS.levy, {
    cost: 2, spell: { type: "nextTurnMana", amount: 3 },
    text: "下回合开始时获得 3 点行动力。"
  });
  Object.assign(CARDS.martial_law, {
    cost: 7, spell: { type: "tauntRebornAll" },
    text: "使场上所有随从获得拦截与回潮。"
  });

  // ===== 2026-10-19 帝国重做（用户指定） =====
  // 镇脉 N：消耗 N 点流脉，获得等量护甲；流脉不足 N 时只获得剩余流脉的护甲并清零。
  // 反噬 N：下回合开始行动力减少 N。
  Object.assign(CARDS.powder_boy, {
    keywords: ["charge"], deathrattle: null,
    text: "突进。"
  });
  Object.assign(CARDS.empire_guard, {
    keywords: ["battlecry"], target: "none", taunt: false, veinBonus: null, zhenmai: 1,
    text: "镇脉 1：消耗 1 点流脉，获得等量护甲。"
  });
  Object.assign(CARDS.mia, {
    keywords: ["battlecry", "deathrattle"], target: "none",
    battlecry: { type: "draw", amount: 1 },
    text: "登场：抽 1 张牌。 余响：抽 1 张牌。"
  });
  Object.assign(CARDS.iron_mechanic, {
    cost: 3, keywords: ["windfury", "charge"], deathrattle: null,
    text: "连动。突进。"
  });
  Object.assign(CARDS.elsa, {
    cost: 3, attack: 2, health: 2, keywords: ["windfury", "battlecry"], target: "none",
    zhenmai: 2, deathrattle: null, zoneBonus: null,
    text: "镇脉 2：消耗 2 点流脉，获得等量护甲。 连动。"
  });
  Object.assign(CARDS.powder_keg, {
    type: "spell", attack: undefined, health: undefined, keywords: [], target: "none",
    deathrattle: null, passive: null,
    spell: { type: "damageAllMinions", amount: 5 },
    text: "对所有随从造成 5 点伤害。"
  });
  Object.assign(CARDS.klaus, {
    keywords: ["taunt", "battlecry", "charge"], overload: 1,
    text: "拦截。突进。反噬 1。 登场：场上每有一个其他随从（不分敌我），获得 +1/+1。"
  });
  Object.assign(CARDS.ironclad, {
    keywords: ["charge"], zoneBonus: null,
    text: "突进。"
  });
  Object.assign(CARDS.rush_lancer, {
    keywords: [],
    text: "造成伤害时，获得等量护甲。"
  });
  Object.assign(CARDS.siege_captain, {
    zhenmai: 1,
    text: "登场：对所有敌方随从造成 1 点伤害。 镇脉 1：消耗 1 点流脉，获得等量护甲。"
  });
  Object.assign(CARDS.gunther, {
    keywords: ["taunt", "battlecry", "windfury"],
    text: "拦截。连动。 登场：获得 4 点护甲。"
  });
  Object.assign(CARDS.karl_schwarz, {
    cost: 3, health: 4, overload: 1, zoneBonus: null,
    text: "突进。反噬 1。"
  });
  Object.assign(CARDS.secret_police, { disabled: true });
  Object.assign(CARDS.wind_cannon, {
    zhenmai: 1,
    text: "连动。 镇脉 1：消耗 1 点流脉，获得等量护甲。"
  });
  Object.assign(CARDS.powder_marshal, {
    keywords: ["battlecry", "charge"],
    text: "突进。 登场：获得 5 点护甲。"
  });
  Object.assign(CARDS.iron_artillery, {
    keywords: ["battlecry", "charge"],
    text: "突进。 登场：对一个敌方随从造成等同于你护甲的伤害。"
  });
  Object.assign(CARDS.siege_train, {
    keywords: ["battlecry", "windfury"],
    text: "连动。 登场：对所有敌方随从造成 3 点伤害。"
  });
  Object.assign(CARDS.formation_cannon, {
    formation: { attack: 0, health: 0, charge: true },
    text: "阵型：该阵位所有随从固定获得突进。"
  });
  Object.assign(CARDS.pressure_vein, { disabled: true });
  Object.assign(CARDS.fortress, {
    cost: 3, spell: { type: "buffWindfury" },
    text: "使一个友方随从获得连动。"
  });
  Object.assign(CARDS.quarantine, {
    target: "none", spell: { type: "blockHeroPower" },
    text: "下回合敌方领袖不能使用技能。"
  });
  Object.assign(CARDS.martial_court, {
    spell: { type: "armorPerEnemy", amount: 2 },
    text: "每有一个敌方单位（包括领袖），获得 2 点护甲。"
  });

  // ===== 2026-10-19 第六阵营：灰港同盟（悬赏名单） =====
  // 悬赏名单：被列入名单的敌方随从死亡时，名单主人抽 1 张牌；莫纳克额外获得 1 点护甲。
  Object.assign(CARDS.monarch, { disabled: true });
  Object.assign(HEROES.monarch, { hp: 30 });
  Object.assign(CARDS, {
    gh_cutthroat: {
      id: "gh_cutthroat", name: "灰港小刀手", faction: "greyharbor", type: "minion",
      cost: 1, attack: 1, health: 2, rarity: "common", art: null, noGeneratedArt: true,
      keywords: ["rush"], target: "none", text: "袭扰。",
      flavor: "第一刀不求致命，只求见血。"
    },
    gh_venom_apprentice: {
      id: "gh_venom_apprentice", name: "淬毒学徒", faction: "greyharbor", type: "minion",
      cost: 1, attack: 1, health: 1, rarity: "common", art: null, noGeneratedArt: true,
      keywords: ["poisonous"], target: "none", text: "蚀毒。",
      flavor: "师父说，毒要抹在刀刃不反光的那一面。"
    },
    gh_contract_squire: {
      id: "gh_contract_squire", name: "契约侍从", faction: "greyharbor", type: "minion",
      cost: 1, attack: 1, health: 1, rarity: "common", art: null, noGeneratedArt: true,
      keywords: ["divineShield"], target: "none", text: "护幕。",
      flavor: "他递上的不是茶，是一份免责声明。"
    },
    gh_bounty_notice: {
      id: "gh_bounty_notice", name: "悬赏告示", faction: "greyharbor", type: "spell",
      cost: 1, rarity: "common", art: null, noGeneratedArt: true, target: "enemy",
      text: "将一个敌方随从列入悬赏名单。",
      flavor: "钉在灰港每一根灯柱上的，都是价格。",
      spell: { type: "markBounty" }
    },
    gh_silencer: {
      id: "gh_silencer", name: "封口人", faction: "greyharbor", type: "minion",
      cost: 2, attack: 2, health: 2, rarity: "common", art: null, noGeneratedArt: true,
      keywords: ["battlecry"], target: "enemy",
      text: "登场：沉默一个敌方随从。",
      flavor: "他从不杀人，只让死人安静。",
      battlecry: { type: "silence" }
    },
    gh_poison_thrower: {
      id: "gh_poison_thrower", name: "毒刃投手", faction: "greyharbor", type: "minion",
      cost: 2, attack: 2, health: 1, rarity: "common", art: null, noGeneratedArt: true,
      keywords: ["poisonous"], target: "none", text: "蚀毒。",
      flavor: "距离越远，谈判越有诚意。"
    },
    gh_rush_archer: {
      id: "gh_rush_archer", name: "袭扰弓手", faction: "greyharbor", type: "minion",
      cost: 2, attack: 2, health: 2, rarity: "common", art: null, noGeneratedArt: true,
      keywords: ["rush"], target: "none", text: "袭扰。",
      flavor: "先射一箭，再考虑站在哪边。"
    },
    gh_bounty_hunter: {
      id: "gh_bounty_hunter", name: "赏金猎人", faction: "greyharbor", type: "minion",
      cost: 2, attack: 2, health: 2, rarity: "rare", art: null, noGeneratedArt: true,
      keywords: ["battlecry"], target: "enemy",
      text: "登场：将一个敌方随从列入悬赏名单。",
      flavor: "他不问对方是谁，只问名单上有没有。",
      battlecry: { type: "markBounty" }
    },
    gh_bodyguard_contract: {
      id: "gh_bodyguard_contract", name: "替身契约", faction: "greyharbor", type: "spell",
      cost: 2, rarity: "common", art: null, noGeneratedArt: true, target: "friendly",
      text: "使一个友方随从获得护幕。",
      flavor: "合同背面写着：替死一次，价另算。",
      spell: { type: "grantDivineShield" }
    },
    gh_quick_strike: {
      id: "gh_quick_strike", name: "先手突袭", faction: "greyharbor", type: "spell",
      cost: 2, rarity: "common", art: null, noGeneratedArt: true, target: "friendly",
      text: "使一个友方随从获得 +1 攻击和袭扰。",
      flavor: "规矩是给讲规矩的人定的。",
      spell: { type: "grantRushBuff", attack: 1 }
    },
    gh_venom_shield: {
      id: "gh_venom_shield", name: "毒盾刺客", faction: "greyharbor", type: "minion",
      cost: 3, attack: 2, health: 2, rarity: "rare", art: null, noGeneratedArt: true,
      keywords: ["divineShield", "poisonous"], target: "none", text: "护幕。蚀毒。",
      flavor: "挡下第一击，第二击交给毒。"
    },
    gh_silence_expert: {
      id: "gh_silence_expert", name: "封口专家", faction: "greyharbor", type: "minion",
      cost: 3, attack: 3, health: 3, rarity: "rare", art: null, noGeneratedArt: true,
      keywords: ["battlecry"], target: "enemy",
      text: "登场：沉默一个敌方随从；若它是悬赏目标，抽 1 张牌。",
      flavor: "封口费按字数收，不按人头。",
      battlecry: { type: "silenceIfBountyDraw" }
    },
    gh_shield_mercenary: {
      id: "gh_shield_mercenary", name: "护幕佣兵", faction: "greyharbor", type: "minion",
      cost: 3, attack: 3, health: 4, rarity: "common", art: null, noGeneratedArt: true,
      keywords: ["divineShield"], target: "none", text: "护幕。",
      flavor: "保命条款比战斗条款长三倍。"
    },
    gh_ledger: {
      id: "gh_ledger", name: "悬赏账簿", faction: "greyharbor", type: "spell",
      cost: 3, rarity: "rare", art: null, noGeneratedArt: true, target: "none",
      text: "抽 2 张牌；若你完成过悬赏，再抽 1 张。",
      flavor: "每一笔都记着，包括没兑现的那笔。",
      spell: { type: "drawIfBountyClaimed", draw: 2, bonus: 1 }
    },
    gh_assassinate_contract: {
      id: "gh_assassinate_contract", name: "刺杀契约", faction: "greyharbor", type: "spell",
      cost: 3, rarity: "rare", art: null, noGeneratedArt: true, target: "enemy",
      text: "对一个敌方随从造成 4 点伤害；若它是悬赏目标，改为消灭。",
      flavor: "名单上的人，价格是要打折的。",
      spell: { type: "damageOrDestroyBounty", amount: 4 }
    },
    gh_black_market: {
      id: "gh_black_market", name: "黑市交易", faction: "greyharbor", type: "spell",
      cost: 3, rarity: "common", art: null, noGeneratedArt: true, target: "enemy",
      text: "抽 2 张牌；将一个敌方随从列入悬赏名单。",
      flavor: "灰港没有买不到的东西，只有没谈拢的价。",
      spell: { type: "drawMark", draw: 2 }
    },
    gh_legend_assassin: {
      id: "gh_legend_assassin", name: "传奇刺客", faction: "greyharbor", type: "minion",
      cost: 4, attack: 3, health: 3, rarity: "legendary", art: null, noGeneratedArt: true,
      keywords: ["rush", "poisonous"], target: "none", text: "袭扰。蚀毒。",
      flavor: "灰港的传说只有一句：他从不留第二刀。"
    },
    gh_silence_field: {
      id: "gh_silence_field", name: "沉默领域", faction: "greyharbor", type: "spell",
      cost: 4, rarity: "rare", art: null, noGeneratedArt: true, target: "none",
      text: "沉默所有敌方随从。",
      flavor: "整条街突然安静下来，说明生意谈成了。",
      spell: { type: "silenceAll" }
    },
    gh_shield_broker: {
      id: "gh_shield_broker", name: "护幕掮客", faction: "greyharbor", type: "minion",
      cost: 4, attack: 4, health: 4, rarity: "epic", art: null, noGeneratedArt: true,
      keywords: ["divineShield"], target: "none", text: "护幕。",
      flavor: "他卖的保险，赔付对象永远是他自己。"
    },
    gh_execution_contract: {
      id: "gh_execution_contract", name: "处刑契约", faction: "greyharbor", type: "spell",
      cost: 4, rarity: "epic", art: null, noGeneratedArt: true, target: "none",
      text: "消灭悬赏名单上的敌方随从；若名单为空，抽 1 张牌。",
      flavor: "违约的代价，通常由别人承担。",
      spell: { type: "destroyBounty", fallbackDraw: 1 }
    },
    gh_bounty_collector: {
      id: "gh_bounty_collector", name: "赏金猎手", faction: "greyharbor", type: "minion",
      cost: 4, attack: 4, health: 4, rarity: "epic", art: null, noGeneratedArt: true,
      keywords: ["rush"], target: "none",
      text: "袭扰。被动：每完成一次悬赏，获得 +1/+1。",
      flavor: "他记得每一个名字，也记得每一个价码。",
      passive: { type: "bountyClaimGrowth", attack: 1, health: 1 }
    },
    gh_scorpion: {
      id: "gh_scorpion", name: "巨蝎", faction: "greyharbor", type: "minion",
      cost: 5, attack: 4, health: 4, rarity: "epic", art: null, noGeneratedArt: true,
      keywords: ["divineShield", "poisonous"], target: "none", text: "护幕。蚀毒。",
      flavor: "灰港的蝎子有两层壳，和一根尾巴。"
    },
    gh_captain: {
      id: "gh_captain", name: "佣兵头目", faction: "greyharbor", type: "minion",
      cost: 5, attack: 5, health: 5, rarity: "legendary", art: null, noGeneratedArt: true,
      keywords: ["battlecry"], target: "none",
      text: "登场：使所有友方随从获得袭扰。",
      flavor: "他不管你去打谁，只问你几点回来交账。",
      battlecry: { type: "grantRushAll" }
    },
    gh_silence_master: {
      id: "gh_silence_master", name: "封口大师", faction: "greyharbor", type: "minion",
      cost: 5, attack: 5, health: 5, rarity: "epic", art: null, noGeneratedArt: true,
      keywords: ["battlecry"], target: "none",
      text: "登场：沉默所有敌方随从。",
      flavor: "他说话的时候，整条街都不敢出声。",
      battlecry: { type: "silenceAllEnemies" }
    },
    gh_bounty_verdict: {
      id: "gh_bounty_verdict", name: "赏金清算", faction: "greyharbor", type: "spell",
      cost: 5, rarity: "epic", art: null, noGeneratedArt: true, target: "none",
      text: "消灭悬赏名单上的敌方随从；对敌方领袖造成 5 点伤害；若名单为空，抽 1 张牌。",
      flavor: "账本合上的时候，价码就变成结论。",
      spell: { type: "bountyVerdict", damage: 5, fallbackDraw: 1 }
    },
    gh_company: {
      id: "gh_company", name: "佣兵团长", faction: "greyharbor", type: "minion",
      cost: 6, attack: 6, health: 6, rarity: "epic", art: null, noGeneratedArt: true,
      keywords: ["battlecry"], target: "none",
      text: "登场：随机将两个敌方随从列入悬赏名单。",
      flavor: "名单越长，活越少，钱越多。",
      battlecry: { type: "markRandomBounties", count: 2 }
    },
    gh_venom_behemoth: {
      id: "gh_venom_behemoth", name: "毒潮巨兽", faction: "greyharbor", type: "minion",
      cost: 7, attack: 6, health: 6, rarity: "epic", art: null, noGeneratedArt: true,
      keywords: ["rush", "poisonous"], target: "none", text: "袭扰。蚀毒。",
      flavor: "它从灰港的排污口爬上来，身上挂着旧账。"
    },
    gh_bounty_king: {
      id: "gh_bounty_king", name: "赏金王", faction: "greyharbor", type: "minion",
      cost: 8, attack: 7, health: 7, rarity: "legendary", art: null, noGeneratedArt: true,
      keywords: [], target: "none",
      text: "被动：每完成一次悬赏，对敌方领袖造成 2 点伤害。",
      flavor: "灰港没有王，除非你把所有人都买了。",
      passive: { type: "bountyClaimDamage", amount: 2 }
    },
    gh_formation: {
      id: "gh_formation", name: "潜伏阵线", faction: "greyharbor", type: "formation",
      cost: 3, rarity: "rare", art: null, noGeneratedArt: true, target: "none",
      text: "阵型：该阵位所有友方随从获得袭扰。",
      flavor: "灰港不设防线，只设伏击点。",
      formation: { attack: 0, health: 0, rush: true }
    },
    gh_bounty_board: {
      id: "gh_bounty_board", name: "悬赏榜", faction: "greyharbor", type: "relic",
      cost: 3, rarity: "epic", art: null, noGeneratedArt: true, target: "none",
      text: "遗物：每当你完成一次悬赏，额外抽 1 张牌。",
      flavor: "榜单每天换一版，只有最上面那行不变。"
    },
    gh_venom_vial: {
      id: "gh_venom_vial", name: "淬毒瓶", faction: "greyharbor", type: "relic",
      cost: 3, rarity: "epic", art: null, noGeneratedArt: true, target: "none",
      text: "遗物：你的蚀毒随从获得 +1 攻击。",
      flavor: "瓶口封着蜡，蜡上有牙印。"
    }
  });

  // 新阵营的卡牌定义在文件末尾，预组需要在这里手动修剪为 31 张（30 主卡 + 1 遗物）。
  {
    const list = DECKS.greyharbor || [];
    let removed = false;
    DECKS.greyharbor = list.filter(id => {
      if (!removed && CARDS[id] && CARDS[id].type === "relic" && id !== "gh_bounty_board") { removed = true; return false; }
      return true;
    });
  }

  // ===== 2026-10-19 五阵营流派补强（新增 15 张） =====
  Object.assign(CARDS, {
    /* 普卫岛：阵位 / 阵型 / 流脉 / 恢复 */
    spring_medic: {
      id: "spring_medic", name: "涌泉医师", faction: "pus", type: "minion",
      cost: 3, attack: 2, health: 4, rarity: "common", art: null, noGeneratedArt: true,
      keywords: ["battlecry"], target: "none",
      text: "登场：恢复所有友方随从 2 点生命。",
      flavor: "她背着的不是药箱，是一口会走路的泉。",
      battlecry: { type: "healAllAllies", amount: 2 }
    },
    vein_foreman: {
      id: "vein_foreman", name: "掘脉工头", faction: "pus", type: "minion",
      cost: 2, attack: 2, health: 2, rarity: "common", art: null, noGeneratedArt: true,
      keywords: ["battlecry"], target: "none",
      text: "采掘 1；登场：抽 1 张牌。",
      flavor: "他挖到的第一块脉晶，现在镶在安全帽上。",
      excavate: 1,
      battlecry: { type: "draw", amount: 1 }
    },
    formation_bastion: {
      id: "formation_bastion", name: "磐石阵线", faction: "pus", type: "formation",
      cost: 4, rarity: "rare", art: null, noGeneratedArt: true, target: "none",
      text: "阵型：该阵位随从固定获得 +0/+2 与拦截。",
      flavor: "阵线不需要喊口号，站住就行。",
      formation: { attack: 0, health: 2, taunt: true }
    },
    /* 学院：逆流 / 冻结 / 法术 / 被动 */
    reflux_apprentice: {
      id: "reflux_apprentice", name: "逆流学徒", faction: "academy", type: "minion",
      cost: 2, attack: 2, health: 3, rarity: "rare", art: null, noGeneratedArt: true,
      keywords: ["battlecry"], target: "none", reflux: 1,
      text: "逆流 1：若本回合你施放过战术牌，抽 2 张牌。",
      flavor: "别人背书，她背的是水位线。",
      battlecry: { type: "spellDraw", draw: 2 }
    },
    frost_scribe: {
      id: "frost_scribe", name: "霜印书记", faction: "academy", type: "spell",
      cost: 2, rarity: "rare", art: null, noGeneratedArt: true, target: "enemy", reflux: 1,
      text: "逆流 1：冻结一个敌方随从并抽 1 张牌。",
      flavor: "她记下的每一笔，都要先冻住再落墨。",
      spell: { type: "freezeDraw", draw: 1 }
    },
    echo_observer: {
      id: "echo_observer", name: "回响观测者", faction: "academy", type: "minion",
      cost: 4, attack: 3, health: 4, rarity: "epic", art: null, noGeneratedArt: true,
      keywords: ["passive"], target: "none",
      text: "被动：每回合你第一次施放战术牌后，随机冻结一个敌方随从。",
      flavor: "他不记录法术，只记录法术留下的霜。",
      passive: { type: "spellFreezeOnce" }
    },
    /* 西昭：血祭 / 吞噬 / 汲取 / 隐匿 / 压脉 */
    blood_duelist: {
      id: "blood_duelist", name: "血祭刀客", faction: "xizhao", type: "minion",
      cost: 2, attack: 3, health: 2, rarity: "common", art: null, noGeneratedArt: true,
      keywords: ["charge", "battlecry"], target: "none", bloodCost: 1,
      battlecry: { type: "bloodAttack", amount: 2 },
      text: "突进。血祭 1：获得 +2 攻击。",
      flavor: "他出刀前先割自己，只为让刀更快一点。"
    },
    blood_wraith: {
      id: "blood_wraith", name: "噬血幽魂", faction: "xizhao", type: "minion",
      cost: 3, attack: 2, health: 3, rarity: "common", art: null, noGeneratedArt: true,
      keywords: ["lifesteal", "stealth"], target: "none", pressure: 1,
      text: "汲取。隐匿。 压脉 1：消耗 1 点流脉，对敌方领袖造成 1 点伤害。",
      flavor: "被它舔过的伤口，不会流血，只会发冷。"
    },
    blood_pool: {
      id: "blood_pool", name: "血池献祭", faction: "xizhao", type: "spell",
      cost: 4, rarity: "rare", art: null, noGeneratedArt: true, target: "friendly",
      text: "消灭一个友方随从，恢复你的领袖等同于其生命值的生命，并抽 1 张牌。",
      flavor: "池子从不挑剔，它只是等着有人先迈一步。",
      spell: { type: "sacrificeHealDraw", draw: 1 }
    },
    /* 共和国：拦截 / 余响 / 回潮 / 顺势 / 对位 */
    line_spearman: {
      id: "line_spearman", name: "列阵枪兵", faction: "republic", type: "minion",
      cost: 2, attack: 2, health: 2, rarity: "common", art: null, noGeneratedArt: true,
      keywords: ["taunt", "deathrattle"], target: "none",
      text: "拦截。余响：召唤一个 1/1 的共和国新兵。",
      flavor: "倒下时，他的枪还指着前面。",
      deathrattle: { type: "summon", token: "republic_recruit", count: 1 }
    },
    combo_shield: {
      id: "combo_shield", name: "顺势盾击", faction: "republic", type: "spell",
      cost: 2, rarity: "rare", art: null, noGeneratedArt: true, target: "friendly",
      text: "使一个友方随从获得 +0/+2 与拦截；顺势：改为 +0/+4 与拦截。",
      flavor: "第一下是挡，第二下才是推。",
      spell: { type: "comboBuffTaunt", health: 2, bonusHealth: 4 }
    },
    reborn_sentry: {
      id: "reborn_sentry", name: "回潮哨卫", faction: "republic", type: "minion",
      cost: 3, attack: 2, health: 3, rarity: "rare", art: null, noGeneratedArt: true,
      keywords: ["reborn"], target: "none", mirrorBonus: { attack: 1 },
      text: "回潮。 对位：若敌方对位阵位有随从，获得 +1/+0。",
      flavor: "他倒下过一次，所以知道该在哪里重新站起来。"
    },
    /* 帝国：护甲 / 镇脉 / 反噬 / 连动 / 突进 */
    zhenmai_artisan: {
      id: "zhenmai_artisan", name: "镇脉工匠", faction: "empire", type: "minion",
      cost: 2, attack: 2, health: 2, rarity: "common", art: null, noGeneratedArt: true,
      keywords: ["windfury"], target: "none", zhenmai: 1,
      text: "镇脉 1：消耗 1 点流脉，获得等量护甲。 连动。",
      flavor: "他给炮管上脉纹，就像给别人上发条。"
    },
    overload_gunner: {
      id: "overload_gunner", name: "反噬炮手", faction: "empire", type: "minion",
      cost: 3, attack: 3, health: 3, rarity: "rare", art: null, noGeneratedArt: true,
      keywords: ["charge"], target: "none", overload: 1,
      passive: { type: "damageToArmor" },
      text: "突进。反噬 1。造成伤害时，获得等量护甲。",
      flavor: "他从不问这一炮会不会把自己也震伤。"
    },
    armor_drive: {
      id: "armor_drive", name: "装甲动员", faction: "empire", type: "spell",
      cost: 2, rarity: "common", art: null, noGeneratedArt: true, target: "none",
      text: "获得 3 点护甲；若你已有护甲，再获得 2 点护甲。",
      flavor: "钢板不会自己走过来，但命令会。",
      spell: { type: "armorIfArmored", amount: 3, bonus: 2 }
    }
  });

  // ===== 2026-10-19 关键词一致性修复 + 中立收尾 =====
  // 修复：血祭侍从残留的旧余响（文本与关键词早已移除）
  Object.assign(CARDS.blood_acolyte, { deathrattle: null });
  // 修复：帝国卫兵仍生效的对位护甲，补回卡面
  Object.assign(CARDS.empire_guard, {
    text: "镇脉 1：消耗 1 点流脉，获得等量护甲。 对位：若敌方对位阵位有随从，获得 1 点护甲。"
  });
  // 修复：瓦尔特残留的引脉字段（卡面与指定改动都没有引脉）
  Object.assign(CARDS.walter, { veinBonus: null });
  // 修复：共和国卫兵关键词有拦截，卡面补回
  Object.assign(CARDS.republic_guard, {
    text: "拦截。余响：对随机一个敌方随从造成 2 点伤害。 对位：若敌方对位阵位有随从，生命值 +1。"
  });
  // 修复：终末钟声原实现会命中双方领袖，卡面改为“所有单位”
  Object.assign(CARDS.final_bell, {
    text: "对所有单位造成 5 点伤害。",
    spell: { type: "damageAll", amount: 5 }
  });
  // 中立差异化：让同效果卡各自有定位
  Object.assign(CARDS.field_engineer, {
    keywords: ["taunt", "deathrattle"],
    text: "拦截。余响：获得 2 点护甲。"
  });
  Object.assign(CARDS.sim_assistant, {
    deathrattle: { type: "buffAllAllies", health: 1 },
    text: "余响：所有友方随从获得 +0/+1。"
  });
  Object.assign(CARDS.chrono_scholar, {
    keywords: ["deathrattle", "windfury"],
    text: "连动。余响：抽 1 张牌。"
  });
  Object.assign(CARDS.archive_devourer, {
    keywords: ["battlecry", "deathrattle"], target: "none",
    battlecry: { type: "devour" },
    text: "登场：吞噬一个攻击力最低的友方随从，获得其攻击力和生命值。 余响：抽 1 张牌。"
  });
  Object.assign(CARDS.mist_hound, {
    keywords: ["charge", "reborn"],
    text: "突进。回潮。"
  });
  Object.assign(CARDS.supply_cache, { cost: 1 });

  // 中立重名/文本一致性
  Object.assign(CARDS.bounty_hunter, { name: "赏金客" });
  Object.assign(CARDS.rush_lancer, { text: "被动：造成伤害时，获得等量护甲。" });

  // 新阵营暂无卡图：跳过卡图请求，使用阵营通用图，避免 404。
  for (const id of [
    "gh_cutthroat", "gh_venom_apprentice", "gh_contract_squire", "gh_bounty_notice",
    "gh_silencer", "gh_poison_thrower", "gh_rush_archer", "gh_bounty_hunter",
    "gh_bodyguard_contract", "gh_quick_strike", "gh_venom_shield", "gh_silence_expert",
    "gh_shield_mercenary", "gh_ledger", "gh_assassinate_contract", "gh_black_market",
    "gh_legend_assassin", "gh_silence_field", "gh_shield_broker", "gh_execution_contract",
    "gh_bounty_collector", "gh_scorpion", "gh_captain", "gh_silence_master",
    "gh_bounty_verdict", "gh_company", "gh_venom_behemoth", "gh_bounty_king",
    "gh_formation", "gh_bounty_board", "gh_venom_vial",
    "vein_foreman", "spring_medic", "formation_bastion",
    "reflux_apprentice", "frost_scribe", "echo_observer"
  ]) {
    if (CARDS[id]) CARDS[id].noArtwork = true;
  }

  Object.assign(CARDS, {
    vein_echo: {
      id: "vein_echo", name: "地脉回响", faction: "pus", type: "spell",
      cost: 2, rarity: "common", art: null, noGeneratedArt: true, target: "none",
      text: "恢复你的领袖 3 点生命；流脉 +2；若流脉达到 7，抽 1 张牌。",
      flavor: "地脉翻身的时候，整座城都听见了。",
      spell: { type: "healVeinDrawAt", heal: 3, vein: 2, threshold: 7, draw: 1 }
    }
  });

  // ===== 灰港同盟数值调整：只改费用 / 攻击 / 生命，不改机制 =====
  // 第一轮：整体提高 1~2 点身材，降低三张条件法术的费用。
  Object.assign(CARDS.gh_contract_squire, { health: 2 });
  Object.assign(CARDS.gh_silencer, { health: 3 });
  Object.assign(CARDS.gh_poison_thrower, { health: 2 });
  Object.assign(CARDS.gh_bounty_hunter, { attack: 3 });
  Object.assign(CARDS.gh_venom_shield, { attack: 3, health: 3 });
  Object.assign(CARDS.gh_silence_expert, { health: 4 });
  Object.assign(CARDS.gh_shield_mercenary, { health: 5 });
  Object.assign(CARDS.gh_legend_assassin, { attack: 4, health: 4 });
  Object.assign(CARDS.gh_shield_broker, { health: 5 });
  Object.assign(CARDS.gh_bounty_collector, { health: 5 });
  Object.assign(CARDS.gh_scorpion, { attack: 5, health: 5 });
  Object.assign(CARDS.gh_captain, { health: 6 });
  Object.assign(CARDS.gh_silence_master, { health: 6 });
  Object.assign(CARDS.gh_company, { health: 7 });
  Object.assign(CARDS.gh_venom_behemoth, { attack: 7, health: 7 });
  Object.assign(CARDS.gh_bounty_king, { attack: 8, health: 8 });
  Object.assign(CARDS.gh_silence_field, { cost: 3 });
  Object.assign(CARDS.gh_execution_contract, { cost: 3 });
  Object.assign(CARDS.gh_bounty_verdict, { cost: 4 });

  // 第二轮：继续补前期身材，并微调两张条件法术的数值（机制不变）
  Object.assign(CARDS.gh_cutthroat, { attack: 2 });
  Object.assign(CARDS.gh_venom_apprentice, { health: 2 });
  Object.assign(CARDS.gh_contract_squire, { attack: 2 });
  Object.assign(CARDS.gh_silencer, { attack: 3 });
  Object.assign(CARDS.gh_poison_thrower, { attack: 3 });
  Object.assign(CARDS.gh_rush_archer, { health: 3 });
  Object.assign(CARDS.gh_bounty_hunter, { health: 3 });
  Object.assign(CARDS.gh_quick_strike, { spell: { type: "grantRushBuff", attack: 2 }, text: "使一个友方随从获得 +2 攻击和袭扰。" });
  Object.assign(CARDS.gh_venom_shield, { attack: 4, health: 4 });
  Object.assign(CARDS.gh_silence_expert, { health: 5 });
  Object.assign(CARDS.gh_shield_mercenary, { attack: 4 });
  Object.assign(CARDS.gh_formation, { cost: 2 });
  Object.assign(CARDS.gh_legend_assassin, { health: 5 });
  Object.assign(CARDS.gh_shield_broker, { attack: 5 });
  Object.assign(CARDS.gh_bounty_collector, { attack: 5 });
  Object.assign(CARDS.gh_assassinate_contract, { spell: { type: "damageOrDestroyBounty", amount: 5 }, text: "对一个敌方随从造成 5 点伤害；若它是悬赏目标，改为消灭。" });
  Object.assign(CARDS.gh_scorpion, { health: 6 });
  Object.assign(CARDS.gh_captain, { attack: 6 });
  Object.assign(CARDS.gh_silence_master, { health: 7 });
  Object.assign(CARDS.gh_company, { attack: 7 });
  Object.assign(CARDS.gh_venom_behemoth, { health: 8 });
  Object.assign(CARDS.gh_bounty_king, { attack: 9, health: 9 });

  // ===== 即梦生图接入（2026-10-19）：新卡与灰港改用 generated/<id>.webp =====
  for (const id of [
    "spring_medic", "vein_foreman", "formation_bastion", "vein_echo",
    "reflux_apprentice", "frost_scribe", "echo_observer",
    "blood_duelist", "blood_wraith", "blood_pool",
    "line_spearman", "combo_shield", "reborn_sentry",
    "zhenmai_artisan", "overload_gunner", "armor_drive",
    "gh_cutthroat", "gh_venom_apprentice", "gh_contract_squire", "gh_bounty_notice",
    "gh_silencer", "gh_poison_thrower", "gh_rush_archer", "gh_bounty_hunter",
    "gh_bodyguard_contract", "gh_quick_strike", "gh_venom_shield", "gh_silence_expert",
    "gh_shield_mercenary", "gh_ledger", "gh_assassinate_contract", "gh_black_market",
    "gh_legend_assassin", "gh_silence_field", "gh_shield_broker", "gh_execution_contract",
    "gh_bounty_collector", "gh_scorpion", "gh_captain", "gh_silence_master",
    "gh_bounty_verdict", "gh_company", "gh_venom_behemoth", "gh_bounty_king",
    "gh_formation", "gh_bounty_board", "gh_venom_vial"
  ]) {
    if (CARDS[id]) { CARDS[id].noGeneratedArt = false; CARDS[id].noArtwork = false; }
  }

  // 第三轮：收回部分前期提速，保留中后期身材补强
  Object.assign(CARDS.gh_cutthroat, { attack: 1 });
  Object.assign(CARDS.gh_venom_apprentice, { health: 1 });
  Object.assign(CARDS.gh_contract_squire, { attack: 1 });
  Object.assign(CARDS.gh_silencer, { attack: 2 });
  Object.assign(CARDS.gh_poison_thrower, { attack: 2 });
  Object.assign(CARDS.gh_quick_strike, { spell: { type: "grantRushBuff", attack: 1 }, text: "使一个友方随从获得 +1 攻击和袭扰。" });
  Object.assign(CARDS.gh_formation, { cost: 3 });
  Object.assign(CARDS.gh_assassinate_contract, { spell: { type: "damageOrDestroyBounty", amount: 4 }, text: "对一个敌方随从造成 4 点伤害；若它是悬赏目标，改为消灭。" });

  // ===== 2026-10-20 用户数值表导入 + 设计收敛 =====
  // 数值：逐张来自用户《卡牌数值设计表1.xlsx》的 F/G/H 列。
  Object.assign(CARDS.vein_scout, { attack: 2, health: 1 });
  Object.assign(CARDS.vein_foreman, { health: 1 });
  Object.assign(CARDS.guard, { health: 4 });
  Object.assign(CARDS.orlicas, { attack: 2 });
  Object.assign(CARDS.timon, { attack: 3, health: 2 });
  Object.assign(CARDS.zone_keeper, { attack: 3, health: 2 });
  Object.assign(CARDS.vein_siphon, { cost: 2 });
  Object.assign(CARDS.spring_medic, { health: 3 });
  Object.assign(CARDS.formation_weaver, { health: 3 });
  Object.assign(CARDS.aidric, { attack: 2, health: 4 });
  Object.assign(CARDS.verious, { health: 2 });
  Object.assign(CARDS.shextena, { attack: 3, health: 3 });
  Object.assign(CARDS.vein_engineer, { attack: 2, health: 3 });
  Object.assign(CARDS.miyuki, { health: 7 });
  Object.assign(CARDS.excavation_titan, { attack: 4, health: 5 });
  Object.assign(CARDS.spell_novice, { health: 1 });
  Object.assign(CARDS.nina, { cost: 3, attack: 2, health: 2 });
  Object.assign(CARDS.reflux_apprentice, { health: 1 });
  Object.assign(CARDS.samuel, { attack: 2, health: 2 });
  Object.assign(CARDS.frost_scribe, { cost: 3 });
  Object.assign(CARDS.spell_echo, { attack: 2, health: 1 });
  Object.assign(CARDS.lecturer, { attack: 2, health: 1 });
  Object.assign(CARDS.formation_script, { cost: 4 });
  Object.assign(CARDS.justus, { attack: 2, health: 3 });
  Object.assign(CARDS.arcane_conduit, { attack: 1, health: 4 });
  Object.assign(CARDS.arcane_theorist, { attack: 2 });
  Object.assign(CARDS.echo_adept, { attack: 2, health: 1 });
  Object.assign(CARDS.karl_desmond, { attack: 2, health: 4 });
  Object.assign(CARDS.cassian, { attack: 2, health: 5 });
  Object.assign(CARDS.lize, { attack: 2, health: 2 });
  Object.assign(CARDS.reflux, { cost: 3 });
  Object.assign(CARDS.blood_duelist, { attack: 1 });
  Object.assign(CARDS.blood_acolyte, { attack: 1 });
  Object.assign(CARDS.formation_tide, { cost: 4 });
  Object.assign(CARDS.venom_fang, { attack: 1, health: 1 });
  Object.assign(CARDS.losutai_hunter, { health: 2 });
  Object.assign(CARDS.molan, { attack: 1, health: 4 });
  Object.assign(CARDS.blood_servant, { attack: 2, health: 2 });
  Object.assign(CARDS.grayfeather, { health: 3 });
  Object.assign(CARDS.devourer, { health: 2 });
  Object.assign(CARDS.tiega, { attack: 3, health: 3 });
  Object.assign(CARDS.blood_executor, { health: 3 });
  Object.assign(CARDS.brood_matron, { attack: 2, health: 3 });
  Object.assign(CARDS.lanxi, { attack: 4, health: 4 });
  Object.assign(CARDS.blood_priestess, { attack: 3, health: 4 });
  Object.assign(CARDS.losutai_matriarch, { health: 5 });
  Object.assign(CARDS.tide_colossus, { attack: 3, health: 2 });
  Object.assign(CARDS.shield_recruit, { health: 2 });
  Object.assign(CARDS.bulwark_sentry, { health: 1 });
  Object.assign(CARDS.drill_sergeant, { health: 2 });
  Object.assign(CARDS.line_spearman, { attack: 1 });
  Object.assign(CARDS.fortify, { cost: 1 });
  Object.assign(CARDS.shield_bearer, { attack: 3, health: 2 });
  Object.assign(CARDS.anti_rush, { cost: 2 });
  Object.assign(CARDS.erhardt, { attack: 2, health: 2 });
  Object.assign(CARDS.beatrix, { attack: 4 });
  Object.assign(CARDS.shield_sergeant, { health: 4 });
  Object.assign(CARDS.phalanx_warden, { health: 3 });
  Object.assign(CARDS.phalanx_executor, { attack: 0, health: 3 });
  Object.assign(CARDS.konrad, { health: 2 });
  Object.assign(CARDS.iron_wall, { cost: 2 });
  Object.assign(CARDS.zone_banner, { health: 4 });
  Object.assign(CARDS.bastion_captain, { attack: 4, health: 4 });
  Object.assign(CARDS.aegis_guard, { attack: 3, health: 3 });
  Object.assign(CARDS.cedric, { attack: 4, health: 4 });
  Object.assign(CARDS.iron_phalanx, { health: 3 });
  Object.assign(CARDS.shield_marshal, { health: 4 });
  Object.assign(CARDS.martial_law, { cost: 4 });
  Object.assign(CARDS.empire_guard, { health: 3 });
  Object.assign(CARDS.barrage, { cost: 1 });
  Object.assign(CARDS.zone_reaper, { disabled: true, cost: 4, attack: 1, health: 1 });
  const xiDeck = DECKS.xizhao.indexOf("zone_reaper");
  if (xiDeck >= 0) DECKS.xizhao[xiDeck] = "blood_executor";

  // 衍生物随从：必须有费用。
  for (const id of ["losutai_imp", "losutai_beast", "obsidian_spawn", "grave_guard", "astral_guardian", "republic_recruit"]) {
    if (CARDS[id]) CARDS[id].cost = 1;
  }

  // 阵位 / 对位收敛：只保留身份明确的效果，删掉为了“加个效果”而挂上去的。
  for (const id of ["timon", "orlicas", "konrad", "republic_guard", "empire_guard", "shield_recruit", "phalanx_warden", "phalanx_executor", "cedric", "erhardt", "gunther", "frost_professor", "aegis_guard", "gh_bounty_collector", "gh_shield_mercenary"]) {
    const c = CARDS[id];
    if (!c) continue;
    c.zoneBonus = null;
    c.mirrorBonus = null;
    c.zoneAura = null;
  }
  Object.assign(CARDS.hans, {
    zoneBonus: { health: 1 },
    text: "拦截。被动：你召唤的拦截随从获得 +0/+1。 阵位：同阵位每有一个其他随从，生命值 +1。"
  });
  Object.assign(CARDS.aidric, {
    mirrorBonus: { armor: 3 },
    text: "拦截。 引脉 4：获得 +1/+1。 引脉 8：获得 +2/+2。 对位：若敌方对位阵位有随从，获得 3 点护甲。"
  });
  Object.assign(CARDS.shield_sergeant, {
    mirrorBonus: { armor: 3 },
    text: "拦截。余响：所有友方拦截随从获得 +0/+1。 对位：若敌方对位阵位有随从，获得 3 点护甲。"
  });

  // 普卫岛 / 中立
  Object.assign(CARDS.vein_scout, {
    veinTiers: [{ vein: 3, health: 1 }],
    text: "突进。 引脉 3：获得 +0/+1。"
  });
  Object.assign(CARDS.orlicas, {
    zoneBonus: null,
    text: "登场：抽 1 张牌；引脉 4：再抽 1 张牌。"
  });
  Object.assign(CARDS.timon, {
    zoneBonus: null,
    text: "登场：本回合你打出的下一张牌行动力消耗减少 1。"
  });
  Object.assign(CARDS.zone_keeper, {
    zoneBonus: { attack: 1, health: 2 },
    text: "阵位：同阵位每有一个其他友方随从，获得 +1/+2。"
  });
  Object.assign(CARDS.formation_weaver, {
    text: "登场：若该卡被召唤到已经使用阵型卡的阵位，获得 +0/+1 并抽 1 张牌。"
  });
  Object.assign(CARDS.shextena, {
    battlecry: { type: "healHeroSelfBuff", amount: 3 },
    veinTiers: [{ vein: 10, healHero: 3 }],
    text: "登场：恢复你的领袖 3 点生命；每实际恢复 1 点，希斯蒂娜获得 +1/+1。 引脉 10：恢复你的领袖 3 点生命。"
  });
  Object.assign(CARDS.excavation_titan, {
    veinTiers: [{ vein: 10, attack: 2, health: 1 }],
    text: "登场：流脉 +2。 引脉 10：获得 +2/+1。"
  });
  Object.assign(CARDS.formation_bastion, {
    formation: { attack: 0, health: 0, taunt: true },
    text: "阵型：该阵位随从固定获得拦截。"
  });
  Object.assign(CARDS.formation_standard, {
    text: "遗物：你控制阵型时，该阵线友方随从额外获得 +0/+1。"
  });
  Object.assign(CARDS.emergency, {
    spell: { type: "healDraw", amount: 2, draw: 1 },
    text: "恢复一个友方随从 2 点生命；抽 1 张牌。"
  });
  Object.assign(CARDS.resonance, {
    spell: { type: "drawGainVein", amount: 1, vein: 1 },
    text: "抽 1 张牌，流脉 +1。"
  });
  Object.assign(CARDS.vein_attendant, {
    veinTiers: [{ vein: 3, attack: 1, health: 1 }],
    text: "登场：流脉 +1。 引脉 3：获得 +1/+1。"
  });

  // 学院：去掉“白嫖行动力 / 复制 / 免费冻结”等失控效果
  Object.assign(CARDS.archive_search, {
    spell: { type: "drawBoth", amount: 1 },
    text: "双方各抽 1 张牌。"
  });
  Object.assign(CARDS.spell_novice, {
    battlecry: { type: "discountSpellTurn", amount: 1 },
    reflux: null,
    text: "登场：本回合你的下一张战术牌的行动力消耗 -1。"
  });
  Object.assign(CARDS.doorman, {
    battlecry: null,
    reflux: null,
    keywords: [],
    text: "—"
  });
  Object.assign(CARDS.debate, {
    spell: { type: "damage", amount: 2 },
    text: "对一个敌方随从造成 2 点伤害。"
  });
  Object.assign(CARDS.insight, {
    spell: { type: "drawGainVein", amount: 1, vein: 1 },
    text: "抽 1 张牌，流脉 +1。"
  });
  Object.assign(CARDS.reflux_apprentice, {
    battlecry: { type: "spellDraw", draw: 1 },
    text: "逆流 1：若本回合你施放过战术牌，抽 1 张牌。"
  });
  Object.assign(CARDS.armor_break, {
    spell: { type: "stripArmorToMana", amount: 4, mana: 1 },
    text: "移除敌方领袖至多 4 点护甲；若移除成功，获得 1 点行动力。"
  });
  Object.assign(CARDS.frost_prism, {
    text: "遗物：每当你施放战术牌，恢复你的领袖 1 点生命。"
  });
  Object.assign(CARDS.justus, {
    text: "登场：复制你手牌中行动力消耗最低的战术牌。"
  });
  Object.assign(CARDS.arcane_conduit, {
    passive: { type: "spellDrawOne" },
    text: "被动：每当你施放一张战术牌，抽 1 张牌。"
  });
  Object.assign(CARDS.spellstorm, {
    rarity: "legendary",
    text: "对所有敌方单位造成等同于本局已使用的战术牌数量的伤害（最高 10 点）。"
  });

  // 西昭：血祭费用上调、删掉抽牌/对位/长小作文
  Object.assign(CARDS.tribal_warrior, {
    bloodCost: 3,
    text: "血祭 3：获得 +1/+1。"
  });
  Object.assign(CARDS.lize, {
    battlecry: null,
    keywords: [],
    text: "压脉 2：消耗 2 点流脉，对敌方领袖造成 2 点伤害。"
  });
  Object.assign(CARDS.blood_imp, {
    mirrorBonus: null,
    text: "汲取。"
  });
  Object.assign(CARDS.blood_duelist, {
    bloodCost: 5,
    text: "突进。血祭 5：获得 +2 攻击。"
  });
  Object.assign(CARDS.blood_altar, {
    spell: { type: "summonTwoTokens", token: "losutai_imp", count: 2, label: "血祭祭坛" },
    text: "召唤两个 1/1 的洛斯汰魔物。"
  });
  Object.assign(CARDS.formation_tide, {
    formation: { lifesteal: true },
    text: "阵型：该阵位所有随从固定获得汲取。"
  });
  Object.assign(CARDS.molan, {
    bloodCost: 3,
    text: "登场：检索一张随从牌；血祭 3：获得 +2 攻击。"
  });
  Object.assign(CARDS.blood_scythe, {
    text: "遗物：友方随从死亡时，你的领袖恢复 1 点生命。"
  });
  Object.assign(CARDS.blood_servant, {
    pressure: null,
    zoneBonus: null,
    text: "余响：使一个友方随从获得 +1 攻击。 汲取。"
  });
  Object.assign(CARDS.tiega, {
    bloodCost: 5,
    text: "突进。血祭 5：获得 +2 攻击。"
  });
  Object.assign(CARDS.blood_pool, {
    target: "none",
    spell: { type: "draw", amount: 2 },
    text: "抽 2 张牌。"
  });
  Object.assign(CARDS.tide_colossus, {
    keywords: ["lifesteal"],
    pressure: null,
    bloodCost: 5,
    battlecry: { type: "devourBloodBuff", attack: 2, health: 2 },
    text: "登场：吞噬一个攻击力最低的友方随从，获得其攻击力和生命值；血祭 5：获得 +2/+2。 汲取。"
  });

  // 共和国：删掉多余阵位/对位，保留拦截/余响骨架
  Object.assign(CARDS.shield_recruit, {
    keywords: ["taunt"],
    zoneBonus: null,
    mirrorBonus: null,
    text: "拦截。"
  });
  Object.assign(CARDS.erhardt, {
    mirrorBonus: null,
    text: "突进。回潮。 顺势：本回合场上每死亡一个随从，获得 +1/+1。"
  });
  Object.assign(CARDS.phalanx_warden, {
    mirrorBonus: null,
    zoneAura: null,
    text: "拦截。余响：所有友方随从获得 +0/+1。"
  });
  Object.assign(CARDS.phalanx_executor, {
    mirrorBonus: null,
    text: "被动：每当另一个友方拦截随从死亡，抽 1 张牌。"
  });
  Object.assign(CARDS.konrad, {
    mirrorBonus: null,
    zoneBonus: null,
    target: "none",
    battlecry: { type: "grantDeathrattleDamageAll", amount: 1 },
    text: "登场：使所有友方随从获得余响：对随机一个敌方随从造成 1 点伤害。"
  });
  Object.assign(CARDS.cedric, {
    mirrorBonus: null,
    veinBonus: { vein: 6, healHero: 8 },
    text: "拦截。 引脉 6：恢复你的领袖 8 点生命。"
  });
  Object.assign(CARDS.empire_guard, {
    mirrorBonus: null,
    text: "镇脉 1：消耗 1 点流脉，获得等量护甲。"
  });
  Object.assign(CARDS.aegis_guard, {
    zoneAura: null,
    text: "护幕。拦截。"
  });
  Object.assign(CARDS.republic_guard, {
    mirrorBonus: null,
    text: "拦截。余响：对随机一个敌方随从造成 2 点伤害。"
  });
  Object.assign(CARDS.formation_wall, {
    formation: { deathrattleSummon: "republic_recruit", excludeDeathrattle: "republic_recruit" },
    text: "该阵位所有非共和国新兵以外的友方随从固定获得余响：召唤一个 1/1 的共和国新兵。"
  });

  // 衍生物的随从费用已在上面统一为 1。

  // ===== 2026-10-20 文案/实现一致性修正 =====
  Object.assign(CARDS.losutai_imp, { text: "每回合开始时获得 +1/+1。 余响：对随机敌方单位造成等同于攻击力的伤害（最高 5 点）。" });
  Object.assign(CARDS.spell_codex, { text: "遗物：每个你的回合，第一张战术牌的行动力消耗 -1。" });
  Object.assign(CARDS.powder_engine, { text: "遗物：每当一名友方随从死亡，随机对一名敌方单位造成 1 点伤害。" });
  Object.assign(CARDS.resonance, { excavate: null });
  Object.assign(CARDS.insight, { excavate: null });
  Object.assign(CARDS.guard, { text: "阵位：同阵位每有一个其他随从，获得 +1/+0。 引脉 4：获得 +1/+0。 引脉 8：获得 +2/+0。" });
  Object.assign(CARDS.courier, { text: "阵位：同阵位每有一个其他随从，获得 +0/+1。" });
  Object.assign(CARDS.hans, { text: "拦截。被动：你召唤的拦截随从获得 +0/+1。 阵位：同阵位每有一个其他随从，生命值 +1。" });
  Object.assign(CARDS.fog_sailor, { text: "阵位：同阵位每有一个其他随从，攻击力 +1。" });
  Object.assign(CARDS.caravan_guard, { text: "拦截。 阵位：同阵位每有一个其他随从，生命值 +1。" });
  Object.assign(CARDS.bounty_hunter, { text: "余响：对随机敌方单位造成 1 点伤害。 阵位：同阵位每有一个其他随从，攻击力 +1。" });
  Object.assign(CARDS.zone_keeper, { text: "阵位：同阵位每有一个其他友方随从，获得 +1/+2。" });
  Object.assign(CARDS.snow_medic, { text: "余响：恢复领袖 1 点生命。登场：同阵位有其他友方随从时，再恢复 1 点。" });
  // ===== 2026-10-20 阵位/对位改为显式光环描述 =====
  const EXPLICIT_POSITION_TEXT = {
    guard: "被动：该随从在场时，同阵位每有一个其他友方随从，本随从获得 +1/+0。 引脉 4：获得 +1/+0。 引脉 8：获得 +2/+0。",
    courier: "被动：该随从在场时，同阵位每有一个其他友方随从，本随从获得 +0/+1。",
    hans: "拦截。被动：你召唤的拦截随从获得 +0/+1；该随从在场时，同阵位每有一个其他友方随从，本随从获得 +0/+1。",
    fog_sailor: "被动：该随从在场时，同阵位每有一个其他友方随从，本随从获得 +1/+0。",
    caravan_guard: "拦截。被动：该随从在场时，同阵位每有一个其他友方随从，本随从获得 +0/+1。",
    bounty_hunter: "余响：对随机敌方目标造成 1 点伤害。 被动：该随从在场时，同阵位每有一个其他友方随从，本随从获得 +1/+0。",
    zone_keeper: "被动：该随从在场时，同阵位每有一个其他友方随从，本随从获得 +1/+2。",
    aidric: "拦截。 引脉 4：获得 +1/+1。 引脉 8：获得 +2/+2。 登场：若该随从对位有敌方随从，获得 3 点护甲。",
    shield_sergeant: "拦截。余响：所有友方拦截随从获得 +0/+1。 登场：若该随从对位有敌方随从，获得 3 点护甲。",
    reborn_sentry: "回潮。该随从对位有敌方随从时，本随从固定获得 +1/+0。",
    elena: "登场：若该随从对位有敌方随从，召唤一个 1/1 的共和国新兵。",
    miyuki: "登场：冻结场上除自己阵位以外的全部随从，包括友方。 被动：深雪在场时，同阵位友方随从不会被冻结。",
    shield_marshal: "拦截。回潮。余响：召唤两个 1/1 的共和国新兵。 若本回合已打出过其他牌，则本回合你每召唤一个共和国新兵，获得 +1/+1。 登场：若该随从对位没有敌方随从，召唤一个 1/1 的共和国新兵。",
    erhardt: "突进。回潮。若本回合已打出过其他牌，则本回合每有一个随从死亡，获得 +1/+1。",
    shield_bearer: "若本回合已打出过其他牌，则本回合你每打出一个友方拦截随从，获得 +0/+1。",
    iron_phalanx: "拦截。若本回合已打出过其他牌，则本回合你每使用一个随从，获得 +1/+1。 余响：对敌方所有单位造成 1 点伤害。",
    combo_shield: "使一个友方随从获得 +0/+2 与拦截；若本回合已打出过其他牌，改为 +0/+4 与拦截。",
    formation_vein: "该阵位友方随从固定获得余响：恢复你的领袖 1 点生命。",
    formation_script: "该阵位友方随从固定获得袭扰。",
    formation_tide: "该阵位友方随从固定获得汲取。",
    formation_wall: "该阵位除共和国新兵以外的所有友方随从固定获得余响：召唤一个 1/1 的共和国新兵。",
    formation_cannon: "该阵位友方随从固定获得突进。",
    formation_bastion: "该阵位友方随从固定获得拦截。",
    gh_formation: "该阵位所有友方随从固定获得袭扰。",
    wayfarer_camp: "该阵位友方随从固定获得 +0/+1 和拦截。",
    formation_standard: "遗物：你控制阵型时，该阵位友方随从额外获得 +0/+1。"
  };
  for (const [id, text] of Object.entries(EXPLICIT_POSITION_TEXT)) {
    if (CARDS[id]) CARDS[id].text = text;
  }
  Object.assign(CARDS.formation_wall, { formation: { deathrattleSummon: "republic_recruit", excludeDeathrattle: "republic_recruit" } });


  return { FACTIONS, FACTION_IDS, nextFaction, HEROES, CARDS, DECKS, NEUTRAL_DECK, KEYWORDS, DECK_STRATEGIES, DECK_SPECIALS, DECK_TRIM, cardPool, validateDeck, autoBuildDeck, maxCopies };
});

