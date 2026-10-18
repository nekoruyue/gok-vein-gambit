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
    neutral: { name: "中立", short: "中立", color: "#c9a86a", dark: "#2c271f", icon: "旅", emblem: "/assets/emblems/neutral.svg", hero: null }
  };

  const FACTION_IDS = ["pus", "academy", "xizhao", "republic", "empire"];

  function nextFaction(faction) {
    const i = FACTION_IDS.indexOf(faction);
    return FACTION_IDS[(i + 1) % FACTION_IDS.length];
  }

  const HEROES = {
    lain: {
      id: "lain",
      name: "莱恩·科斯特「序」",
      short: "莱恩",
      title: "高级协调者 · 新人类",
      faction: "pus",
      hp: 30,
      art: "lain",
      quote: "他不是强者。他只是第一个试图理解的人。",
      power: {
        name: "协调",
        cost: 2,
        target: "friendly",
        text: "使一个友方角色获得 +0/+1；若它与另一个友方角色同阵位，改为 +1/+1。"
      }
    },
    marta: {
      id: "marta",
      name: "玛尔塔·冯·艾森「演」",
      short: "玛尔塔",
      title: "学院评议员 · 新人类",
      faction: "academy",
      hp: 30,
      art: "marta",
      quote: "把问题拆开，答案就会自己露出来。",
      power: {
        name: "演算",
        cost: 2,
        target: "enemy",
        text: "对一个敌方角色造成 1 点伤害。"
      }
    },
    otto: {
      id: "otto",
      name: "奥托·汉瑟尔「炮」",
      short: "奥托",
      title: "帝国首相 · 铁血官僚",
      faction: "empire",
      hp: 30,
      art: "otto",
      quote: "谈判桌上拿不到的东西，火炮会替我们拿。",
      power: {
        name: "炮击",
        cost: 2,
        target: "enemy",
        text: "对一个敌方角色造成 2 点伤害。"
      }
    },
    wolfram: {
      id: "wolfram",
      name: "沃尔夫拉姆·冯·施泰因「律」",
      short: "沃尔夫拉姆",
      title: "共和国议长 · 旧贵族",
      faction: "republic",
      hp: 30,
      art: "wolfram",
      quote: "秩序不是让所有人满意，是让所有人还能坐下。",
      power: {
        name: "筑防",
        cost: 2,
        target: "friendly",
        text: "使一个友方角色获得嘲讽。"
      }
    },
    karna: {
      id: "karna",
      name: "卡尔纳「血爵」",
      short: "卡尔纳",
      title: "西昭主事者 · 血族",
      faction: "xizhao",
      hp: 30,
      art: "karna",
      quote: "我不是在威胁你。我只是在告诉你，账本上还差多少。",
      power: {
        name: "血祭",
        cost: 2,
        target: "friendly",
        text: "对一个友方角色造成 1 点伤害，抽 1 张牌。"
      }
    }
  };

  const CARDS = {
    /* ===== 普卫岛 ===== */
    shextena: {
      id: "shextena", name: "希斯蒂娜「镜」", faction: "pus", type: "minion",
      cost: 4, attack: 3, health: 6, rarity: "legendary", art: "shextena",
      keywords: ["battlecry"], target: "friendly",
      text: "战吼：恢复一个友方角色 4 点生命；若它原本已受伤，抽 1 张牌。",
      flavor: "温柔是有边界的。",
      battlecry: { type: "healDraw", amount: 4 }
    },
    verious: {
      id: "verious", name: "维里欧斯「锲」", faction: "pus", type: "minion",
      cost: 4, attack: 3, health: 5, rarity: "legendary", art: "verious",
      keywords: ["battlecry"], target: "enemy",
      text: "战吼：沉默一个敌方角色。",
      flavor: "他教人耐心，也教人怀疑。",
      battlecry: { type: "silence" }
    },
    timon: {
      id: "timon", name: "提蒙「瞬」", faction: "pus", type: "minion",
      cost: 3, attack: 2, health: 3, rarity: "legendary", art: "timon",
      keywords: ["battlecry"], target: "none",
      text: "战吼：本回合你打出的下一张牌费用减少 1。",
      flavor: "晚一秒，在她这里不是小事。",
      battlecry: { type: "nextCost", amount: 1 }
    },
    aidric: {
      id: "aidric", name: "艾德里克「衡」", faction: "pus", type: "minion",
      cost: 4, attack: 2, health: 6, rarity: "legendary", art: "aidric",
      keywords: ["taunt"], target: "none",
      text: "嘲讽。每当此角色受到伤害，你获得 1 点护甲。",
      flavor: "克制不是不动，是不失控。",
      passive: { type: "armorOnDamage", amount: 1 }
    },
    orlicas: {
      id: "orlicas", name: "欧莉卡斯「慧」", faction: "pus", type: "minion",
      cost: 3, attack: 3, health: 3, rarity: "legendary", art: "orlicas",
      keywords: ["battlecry"], target: "none",
      text: "战吼：抽 1 张牌；引脉 4：再抽 1 张牌。",
      flavor: "比起相信，她更习惯验证。",
      battlecry: { type: "drawVein", amount: 1, vein: 4, bonus: 1 }
    },
    miyuki: {
      id: "miyuki", name: "深雪「昭」", faction: "pus", type: "minion",
      cost: 5, attack: 4, health: 5, rarity: "legendary", art: "miyuki",
      keywords: ["battlecry"], target: "enemyDynamic",
      text: "战吼：冻结一个敌方角色；引脉 6：改为冻结所有敌方角色。",
      flavor: "吾见过雪落，也见过雪停。",
      battlecry: { type: "freeze", allAtVein: 6 }
    },
    medic_apprentice: {
      id: "medic_apprentice", name: "医疗学徒", faction: "pus", type: "minion",
      cost: 1, attack: 1, health: 2, rarity: "common", art: null,
      keywords: ["battlecry"], target: "friendly",
      text: "战吼：恢复一个友方角色 1 点生命。",
      flavor: "医疗部的灯，从来不会只亮一间房。",
      battlecry: { type: "heal", amount: 1 }
    },
    guard: {
      id: "guard", name: "保卫部卫兵", faction: "pus", type: "minion",
      cost: 3, attack: 2, health: 4, rarity: "common", art: null,
      keywords: ["taunt"], target: "none",
      text: "嘲讽。",
      flavor: "他站在门口，门就有了意义。"
    },
    courier: {
      id: "courier", name: "协调部信使", faction: "pus", type: "minion",
      cost: 1, attack: 1, health: 1, rarity: "common", art: null,
      keywords: ["battlecry"], target: "none",
      text: "战吼：本回合你打出的下一张牌费用减少 1。",
      flavor: "她跑过的路，比地图上画的还多。",
      battlecry: { type: "nextCost", amount: 1 }
    },
    coordination: {
      id: "coordination", name: "协同调度", faction: "pus", type: "spell",
      cost: 1, rarity: "common", art: null, target: "friendly",
      text: "使一个友方角色获得 +1/+1；若它与另一个友方角色同阵位，再恢复 1 点生命。",
      flavor: "把正确的人，放在正确的位置。",
      spell: { type: "buffHeal", attack: 1, health: 1, healIfTogether: 1 }
    },
    emergency: {
      id: "emergency", name: "应急响应", faction: "pus", type: "spell",
      cost: 3, rarity: "common", art: null, target: "friendly",
      text: "恢复一个友方角色 6 点生命；抽 1 张牌。",
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
      text: "冲锋。血祭 2：获得 +2 攻击。",
      flavor: "力量就该正面用。",
      battlecry: { type: "bloodAttack", amount: 2 }
    },
    lanxi: {
      id: "lanxi", name: "澜汐", faction: "xizhao", type: "minion",
      cost: 5, attack: 4, health: 4, rarity: "legendary", art: "lanxi",
      keywords: ["battlecry"], target: "none",
      text: "战吼：召唤两个 1/1 洛斯汰魔物；引脉 5：使这些魔物获得嘲讽。",
      flavor: "我的族人还有多少活着。",
      battlecry: { type: "summonTwo", token: "losutai_imp", attack: 1, health: 1, vein: 5, tauntAtVein: true }
    },
    lize: {
      id: "lize", name: "莉泽", faction: "xizhao", type: "minion",
      cost: 1, attack: 2, health: 2, rarity: "legendary", art: "lize",
      keywords: ["battlecry"], target: "none",
      text: "战吼：抽 1 张牌；若你控制另一个友方角色，对其造成 1 点伤害。",
      flavor: "人质也有自己的账。",
      battlecry: { type: "drawDamageAlly", amount: 1 }
    },
    grayfeather: {
      id: "grayfeather", name: "灰羽·乌恩", faction: "xizhao", type: "minion",
      cost: 4, attack: 4, health: 5, rarity: "legendary", art: "grayfeather",
      keywords: ["battlecry"], target: "friendly",
      text: "战吼：使一个友方角色获得 +2/+2；引脉 4：再使其获得嘲讽。",
      flavor: "祖先的雪，落在我肩上。",
      battlecry: { type: "buffTaunt", attack: 2, health: 2, vein: 4 }
    },
    lanzhou: {
      id: "lanzhou", name: "澜舟", faction: "xizhao", type: "minion",
      cost: 1, attack: 1, health: 2, rarity: "legendary", art: "lanzhou",
      keywords: ["battlecry"], target: "none",
      text: "战吼：召唤一个 1/1 洛斯汰魔物。",
      flavor: "还没觉醒，也听得见海。",
      battlecry: { type: "summon", token: "losutai_imp" }
    },
    molan: {
      id: "molan", name: "墨兰", faction: "xizhao", type: "minion",
      cost: 3, attack: 3, health: 3, rarity: "legendary", art: "molan",
      keywords: ["battlecry"], target: "friendly",
      text: "战吼：使一个友方角色获得潜行。",
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
      text: "亡语：使一个友方角色获得 +1 攻击。",
      flavor: "他还不懂主人在算什么。",
      deathrattle: { type: "buffRandomAlly", attack: 1 }
    },
    losutai_hunter: {
      id: "losutai_hunter", name: "洛斯汰猎手", faction: "xizhao", type: "minion",
      cost: 3, attack: 3, health: 3, rarity: "common", art: null,
      keywords: ["battlecry"], target: "enemy",
      text: "战吼：对一个敌方角色造成 1 点伤害。",
      flavor: "它不恨谁，只是饿了。",
      battlecry: { type: "damage", amount: 1 }
    },
    blood_ritual: {
      id: "blood_ritual", name: "血祭仪式", faction: "xizhao", type: "spell",
      cost: 2, rarity: "common", art: null, target: "friendly",
      text: "对一个友方角色造成 2 点伤害，抽 1 张牌；若该角色死亡，再抽 1 张牌。",
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
      id: "shadow_raid", name: "暗影突袭", faction: "xizhao", type: "spell",
      cost: 2, rarity: "common", art: null, target: "friendly",
      text: "使一个友方角色获得 +2 攻击和冲锋。",
      flavor: "西昭不敲门。",
      spell: { type: "buffCharge", attack: 2 }
    },

    /* ===== 学院 ===== */
    karl_desmond: {
      id: "karl_desmond", name: "卡尔·德斯蒙德「辩」", faction: "academy", type: "minion",
      cost: 4, attack: 6, health: 6, rarity: "legendary", art: "karl_desmond",
      keywords: ["battlecry"], target: "none",
      text: "战吼：发现一张法术牌。",
      flavor: "他不相信答案，只相信问题问得够不够好。",
      battlecry: { type: "discover", pool: "spell" }
    },
    justus: {
      id: "justus", name: "尤斯图斯·维尔纳「录」", faction: "academy", type: "minion",
      cost: 3, attack: 4, health: 5, rarity: "legendary", art: "justus",
      keywords: ["battlecry"], target: "none",
      text: "战吼：抽 1 张牌；引脉 4：再抽 1 张牌。",
      flavor: "记录不是为了记住，是为了有一天能反驳。",
      battlecry: { type: "drawVein", amount: 1, vein: 4, bonus: 1 }
    },
    cassian: {
      id: "cassian", name: "卡西安·维尔「锋」", faction: "academy", type: "minion",
      cost: 4, attack: 6, health: 5, rarity: "legendary", art: "cassian",
      keywords: ["charge"], target: "none",
      text: "冲锋。学院不只有辩论，也有把辩论结束的人。",
      flavor: "先动手，再写会议纪要。"
    },
    samuel: {
      id: "samuel", name: "塞缪尔·奎因「询」", faction: "academy", type: "minion",
      cost: 2, attack: 2, health: 4, rarity: "legendary", art: "samuel",
      keywords: ["battlecry"], target: "none",
      text: "战吼：抽 1 张牌。",
      flavor: "他问了七个问题，第六个让对面沉默了。",
      battlecry: { type: "draw", amount: 1 }
    },
    nina: {
      id: "nina", name: "妮娜·索雷尔「霜」", faction: "academy", type: "minion",
      cost: 2, attack: 3, health: 4, rarity: "legendary", art: "nina",
      keywords: ["battlecry"], target: "enemy",
      text: "战吼：冻结一个敌方角色。",
      flavor: "冷静是一种攻击方式。",
      battlecry: { type: "freeze" }
    },
    doorman: {
      id: "doorman", name: "老门房", faction: "academy", type: "minion",
      cost: 1, attack: 1, health: 5, rarity: "common", art: "doorman",
      keywords: ["taunt"], target: "none",
      text: "嘲讽。",
      flavor: "他记得每一张脸，也记得谁没有登记。"
    },
    lecturer: {
      id: "lecturer", name: "学院讲师", faction: "academy", type: "minion",
      cost: 3, attack: 3, health: 4, rarity: "common", art: null,
      keywords: ["battlecry"], target: "none",
      text: "战吼：抽 1 张牌。",
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
      text: "冻结一个敌方角色；抽 1 张牌。",
      flavor: "把一页纸冻住，它就不会被改写。",
      spell: { type: "freezeDraw", draw: 1 }
    },
    debate: {
      id: "debate", name: "学术辩论", faction: "academy", type: "spell",
      cost: 1, rarity: "common", art: null, target: "enemy",
      text: "对一个敌方角色造成 2 点伤害。",
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
      text: "冻结所有敌方角色。",
      flavor: "学院最严厉的处分，通常只是一张纸。",
      spell: { type: "freezeAll" }
    },

    /* ===== 共和国 ===== */
    konrad: {
      id: "konrad", name: "康拉德·威廉莱斯「垒」", faction: "republic", type: "minion",
      cost: 4, attack: 4, health: 6, rarity: "legendary", art: "konrad",
      keywords: ["taunt", "battlecry"], target: "none",
      text: "嘲讽。战吼：获得 2 点护甲。",
      flavor: "城墙不是石头，是人愿意站在上面。",
      battlecry: { type: "armor", amount: 2 }
    },
    erhardt: {
      id: "erhardt", name: "埃尔哈特·冯·罗森「骑」", faction: "republic", type: "minion",
      cost: 4, attack: 4, health: 3, rarity: "legendary", art: "erhardt",
      keywords: ["charge"], target: "none",
      text: "冲锋。",
      flavor: "他先到，谈判随后到。"
    },
    beatrix: {
      id: "beatrix", name: "贝娅特丽克丝·冯·艾森胡特「律」", faction: "republic", type: "minion",
      cost: 4, attack: 3, health: 6, rarity: "legendary", art: "beatrix",
      keywords: ["battlecry"], target: "friendly",
      text: "战吼：使一个友方角色获得 +1/+2 与嘲讽。",
      flavor: "她让所有人都有座位，也记得谁没有。",
      battlecry: { type: "buffTaunt", attack: 1, health: 2 }
    },
    elena: {
      id: "elena", name: "伊莲娜·索菲「卷」", faction: "republic", type: "minion",
      cost: 3, attack: 2, health: 4, rarity: "legendary", art: "elena",
      keywords: ["battlecry"], target: "none",
      text: "战吼：抽 1 张牌。",
      flavor: "每一份档案都有第二份，放在她手里。",
      battlecry: { type: "draw", amount: 1 }
    },
    hans: {
      id: "hans", name: "汉斯·冯·霍尔姆「盾」", faction: "republic", type: "minion",
      cost: 2, attack: 2, health: 3, rarity: "legendary", art: "hans",
      keywords: ["taunt"], target: "none",
      text: "嘲讽。",
      flavor: "他挡不住所有东西，但挡得住第一下。"
    },
    cedric: {
      id: "cedric", name: "塞德里克·威廉莱斯「冠」", faction: "republic", type: "minion",
      cost: 5, attack: 4, health: 6, rarity: "legendary", art: "cedric",
      keywords: ["taunt"], target: "none",
      text: "嘲讽。",
      flavor: "冠冕是重量，不是光。"
    },
    republic_guard: {
      id: "republic_guard", name: "共和国卫兵", faction: "republic", type: "minion",
      cost: 2, attack: 2, health: 3, rarity: "common", art: null,
      keywords: ["taunt"], target: "none",
      text: "嘲讽。",
      flavor: "站好，别让后面的人看见你退。"
    },
    shield_bearer: {
      id: "shield_bearer", name: "持盾侍从", faction: "republic", type: "minion",
      cost: 3, attack: 2, health: 4, rarity: "common", art: null,
      keywords: ["taunt"], target: "none",
      text: "嘲讽。",
      flavor: "盾比人先学会沉默。"
    },
    fortify: {
      id: "fortify", name: "筑防令", faction: "republic", type: "spell",
      cost: 2, rarity: "common", art: null, target: "friendly",
      text: "使一个友方角色获得 +0/+2 与嘲讽。",
      flavor: "先把门立住，再谈窗。",
      spell: { type: "buffTaunt", attack: 0, health: 2 }
    },
    volley: {
      id: "volley", name: "排枪齐射", faction: "republic", type: "spell",
      cost: 2, rarity: "common", art: null, target: "enemy",
      text: "对一个敌方角色造成 2 点伤害。",
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
      text: "冻结所有敌方角色。",
      flavor: "钟声停下之前，谁都不许动。",
      spell: { type: "freezeAll" }
    },

    /* ===== 帝国 ===== */
    gunther: {
      id: "gunther", name: "京特·冯·艾森瓦尔德「垒」", faction: "empire", type: "minion",
      cost: 4, attack: 3, health: 5, rarity: "legendary", art: "gunther",
      keywords: ["taunt", "battlecry"], target: "none",
      text: "嘲讽。战吼：获得 3 点护甲。",
      flavor: "帝国的城墙从不在乎谁先流血。",
      battlecry: { type: "armor", amount: 3 }
    },
    klaus: {
      id: "klaus", name: "克劳斯·莱茵哈特「铁」", faction: "empire", type: "minion",
      cost: 3, attack: 3, health: 3, rarity: "legendary", art: "klaus",
      keywords: ["taunt"], target: "none",
      text: "嘲讽。",
      flavor: "他的军靴比他的勋章更旧。"
    },
    mia: {
      id: "mia", name: "米娅·科尔贝「讯」", faction: "empire", type: "minion",
      cost: 2, attack: 2, health: 2, rarity: "legendary", art: "mia",
      keywords: ["battlecry"], target: "none",
      text: "战吼：抽 1 张牌。",
      flavor: "她送来的信，通常比信里的内容更早决定结局。",
      battlecry: { type: "draw", amount: 1 }
    },
    elsa: {
      id: "elsa", name: "艾尔莎·汉瑟尔「炉」", faction: "empire", type: "minion",
      cost: 3, attack: 2, health: 4, rarity: "legendary", art: "elsa",
      keywords: ["battlecry"], target: "friendly",
      text: "战吼：恢复一个友方角色 2 点生命。",
      flavor: "帝国的炉火不为胜利燃烧，只为活人。",
      battlecry: { type: "heal", amount: 2 }
    },
    karl_schwarz: {
      id: "karl_schwarz", name: "卡尔·冯·施瓦茨「锋」", faction: "empire", type: "minion",
      cost: 4, attack: 4, health: 3, rarity: "legendary", art: "karl_schwarz",
      keywords: ["charge"], target: "none",
      text: "冲锋。",
      flavor: "他相信速度能解决大多数问题，剩下的用剑。"
    },
    walter: {
      id: "walter", name: "瓦尔特·克鲁格「令」", faction: "empire", type: "minion",
      cost: 5, attack: 4, health: 4, rarity: "legendary", art: "walter",
      keywords: ["battlecry"], target: "enemy",
      text: "战吼：对一个敌方角色造成 2 点伤害。",
      flavor: "命令只有一句：推进。",
      battlecry: { type: "damage", amount: 2 }
    },
    empire_guard: {
      id: "empire_guard", name: "帝国卫兵", faction: "empire", type: "minion",
      cost: 2, attack: 2, health: 3, rarity: "common", art: null,
      keywords: ["taunt"], target: "none",
      text: "嘲讽。",
      flavor: "他们守的是秩序，不是某个人。"
    },
    ironclad: {
      id: "ironclad", name: "铁甲步兵", faction: "empire", type: "minion",
      cost: 3, attack: 3, health: 4, rarity: "common", art: null,
      keywords: ["taunt"], target: "none",
      text: "嘲讽。",
      flavor: "铁会生锈，纪律不会。"
    },
    barrage: {
      id: "barrage", name: "炮火覆盖", faction: "empire", type: "spell",
      cost: 2, rarity: "common", art: null, target: "enemy",
      text: "对一个敌方角色造成 2 点伤害。",
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
      text: "使一个友方角色获得 +0/+3 与嘲讽。",
      flavor: "把一个人变成一堵墙，只需要一纸命令。",
      spell: { type: "buffTaunt", attack: 0, health: 3 }
    },
    martial_court: {
      id: "martial_court", name: "军事法庭", faction: "empire", type: "spell",
      cost: 4, rarity: "common", art: null, target: "none",
      text: "冻结所有敌方角色。",
      flavor: "在帝国，沉默也是一种判决。",
      spell: { type: "freezeAll" }
    },

    /* ===== 中立 ===== */
    monarch: {
      id: "monarch", name: "莫纳克", faction: "neutral", type: "minion",
      cost: 4, attack: 4, health: 4, rarity: "legendary", art: "monarch",
      keywords: ["battlecry"], target: "none",
      text: "战吼：发现一张任意阵营的可收集牌。",
      flavor: "守法公民，欠债必还。",
      battlecry: { type: "discover", pool: "any" }
    },
    gok_digger: {
      id: "gok_digger", name: "戈克采掘者", faction: "neutral", type: "minion",
      cost: 2, attack: 2, health: 2, rarity: "common", art: null,
      keywords: ["battlecry"], target: "none", excavate: 1,
      text: "采掘 1；战吼：获得 2 点护甲。",
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
      text: "战吼：恢复一个友方角色 1 点生命。",
      flavor: "雪镇的药，苦，但管用。",
      battlecry: { type: "heal", amount: 1 }
    },
    sim_assistant: {
      id: "sim_assistant", name: "推演助手", faction: "neutral", type: "minion",
      cost: 2, attack: 1, health: 2, rarity: "common", art: null,
      keywords: ["battlecry"], target: "none",
      text: "战吼：抽 1 张牌。",
      flavor: "档案处的第七把椅子，永远有人。",
      battlecry: { type: "draw", amount: 1 }
    },
    bard: {
      id: "bard", name: "吟游诗人", faction: "neutral", type: "minion",
      cost: 3, attack: 2, health: 3, rarity: "common", art: null,
      keywords: ["battlecry"], target: "none",
      text: "战吼：抽 1 张牌；引脉 4：再抽 1 张牌。",
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
      text: "本回合获得 2 点行动槽。后手补偿牌，不进入构筑。",
      flavor: "许可从来不是免费的。",
      spell: { type: "gainMana", amount: 2 }
    },

    vein_warden: {
      id: "vein_warden", name: "流脉守望者", faction: "neutral", type: "minion",
      cost: 3, attack: 2, health: 4, rarity: "common", art: null,
      keywords: ["taunt"], target: "none",
      text: "嘲讽。",
      flavor: "他守的不是门，是门后面的东西。"
    },
    mist_hound: {
      id: "mist_hound", name: "雾猎犬", faction: "neutral", type: "minion",
      cost: 2, attack: 2, health: 2, rarity: "common", art: null,
      keywords: ["charge"], target: "none",
      text: "冲锋。",
      flavor: "雾里有东西先动了。"
    },
    archive_scribe: {
      id: "archive_scribe", name: "档案抄写员", faction: "neutral", type: "minion",
      cost: 2, attack: 1, health: 3, rarity: "common", art: null,
      keywords: ["battlecry"], target: "none",
      text: "战吼：抽 1 张牌。",
      flavor: "副本比原稿更安全。",
      battlecry: { type: "draw", amount: 1 }
    },
    field_medic: {
      id: "field_medic", name: "战地医者", faction: "neutral", type: "minion",
      cost: 2, attack: 1, health: 2, rarity: "common", art: null,
      keywords: ["battlecry"], target: "friendly",
      text: "战吼：恢复一个友方角色 1 点生命。",
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
      text: "冲锋。",
      flavor: "他先看见你，你才看见雾。"
    },
    archive_guard: {
      id: "archive_guard", name: "档案守卫", faction: "neutral", type: "minion",
      cost: 2, attack: 2, health: 3, rarity: "common", art: null,
      keywords: ["taunt"], target: "none",
      text: "嘲讽。",
      flavor: "档案室的门比城墙难进。"
    },
    vein_medic: {
      id: "vein_medic", name: "流脉医师", faction: "neutral", type: "minion",
      cost: 2, attack: 1, health: 3, rarity: "common", art: null,
      keywords: ["battlecry"], target: "friendly",
      text: "战吼：恢复一个友方角色 2 点生命。",
      flavor: "她治伤，也顺手记录脉动。",
      battlecry: { type: "heal", amount: 2 }
    },
    field_engineer: {
      id: "field_engineer", name: "战地工程师", faction: "neutral", type: "minion",
      cost: 3, attack: 2, health: 4, rarity: "common", art: null,
      keywords: ["battlecry"], target: "none",
      text: "战吼：获得 2 点护甲。",
      flavor: "先搭掩体，再谈勇气。",
      battlecry: { type: "armor", amount: 2 }
    },
    caravan_guard: {
      id: "caravan_guard", name: "商队护卫", faction: "neutral", type: "minion",
      cost: 4, attack: 3, health: 5, rarity: "common", art: null,
      keywords: ["taunt"], target: "none",
      text: "嘲讽。",
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
      text: "战吼：对一个敌方角色造成 1 点伤害。",
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
      text: "冻结一个敌方角色；抽 1 张牌。",
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
      text: "战吼：流脉 +1；引脉 8：抽 1 张牌。",
      flavor: "她闭着眼，却比测量员更清楚井下的走向。",
      battlecry: { type: "veinDraw", amount: 1, vein: 8, draw: 1 }
    },
    spell_echo: {
      id: "spell_echo", name: "法术回响", faction: "academy", type: "minion",
      cost: 6, attack: 3, health: 5, rarity: "epic", art: null,
      keywords: ["battlecry"], target: "none",
      text: "战吼：发现一张法术牌。",
      flavor: "同一句咒文，念第二遍时总会长出新的意思。",
      battlecry: { type: "discover", pool: "spell" }
    },
    losutai_matriarch: {
      id: "losutai_matriarch", name: "洛斯汰母兽", faction: "xizhao", type: "minion",
      cost: 6, attack: 4, health: 5, rarity: "epic", art: null,
      keywords: ["deathrattle"], target: "none",
      text: "亡语：召唤两个 1/1 的洛斯汰魔物。",
      flavor: "潮水退去时，她已经把巢筑在船舱下面。",
      deathrattle: { type: "summon", token: "losutai_imp", count: 2 }
    },
    shield_marshal: {
      id: "shield_marshal", name: "持盾元帅", faction: "republic", type: "minion",
      cost: 6, attack: 4, health: 6, rarity: "epic", art: null,
      keywords: ["taunt", "battlecry"], target: "friendly",
      text: "嘲讽。战吼：使一个友方随从获得嘲讽。",
      flavor: "她从不站在队伍后面，只把队伍挡在身后。",
      battlecry: { type: "buffTaunt", attack: 0, health: 0 }
    },
    siege_train: {
      id: "siege_train", name: "攻城列车", faction: "empire", type: "minion",
      cost: 7, attack: 5, health: 7, rarity: "epic", art: null,
      keywords: ["battlecry"], target: "none",
      text: "战吼：对所有敌方随从造成 2 点伤害。",
      flavor: "帝国的铁轨铺到哪里，哪里就会先听见风声。",
      battlecry: { type: "damageAllEnemies", amount: 2 }
    },
    void_titan: {
      id: "void_titan", name: "虚空泰坦", faction: "neutral", type: "minion",
      cost: 10, attack: 8, health: 8, rarity: "legendary", art: null,
      keywords: ["battlecry"], target: "enemy",
      text: "战吼：消灭一个敌方随从。",
      flavor: "它没有影子，因为影子先被它吞掉了。",
      battlecry: { type: "destroy" }
    },

    /* ===== 机制新卡 ===== */
    spellstorm: {
      id: "spellstorm", name: "法术风暴", faction: "academy", type: "spell",
      cost: 6, rarity: "epic", art: null, target: "none",
      text: "对敌方英雄造成 2×本回合已施放法术数量的伤害。",
      flavor: "她数到第三声回响时，屋顶已经开始下雨。",
      spell: { type: "damagePerSpell", amount: 2 }
    },
    echo_adept: {
      id: "echo_adept", name: "回响学徒", faction: "academy", type: "minion",
      cost: 4, attack: 3, health: 3, rarity: "epic", art: null,
      keywords: ["passive"], target: "none",
      text: "被动：每当你施放一张法术，获得 +1/+1。",
      flavor: "同一个咒语念三遍，第三遍会自己回答。",
      passive: { type: "spellGrowth", attack: 1, health: 1 }
    },
    vein_engineer: {
      id: "vein_engineer", name: "引脉工程师", faction: "pus", type: "minion",
      cost: 4, attack: 3, health: 4, rarity: "epic", art: null,
      keywords: ["battlecry"], target: "none",
      text: "战吼：流脉 +2；引脉 6：获得 +1/+1。",
      flavor: "她不是在设计机器，是在给地脉接血管。",
      battlecry: { type: "veinBuff", amount: 2, vein: 6, attack: 1, health: 1 }
    },
    brood_matron: {
      id: "brood_matron", name: "育巢母兽", faction: "xizhao", type: "minion",
      cost: 4, attack: 3, health: 4, rarity: "epic", art: null,
      keywords: ["battlecry"], target: "none",
      text: "战吼：召唤一个 1/1 的洛斯汰魔物；若你控制另一个随从，它获得 +1/+1。",
      flavor: "潮水退去时，她把整座巢一起带上岸。",
      battlecry: { type: "summonTokenBuff", token: "losutai_imp", attack: 1, health: 1 }
    },
    bastion_captain: {
      id: "bastion_captain", name: "堡垒队长", faction: "republic", type: "minion",
      cost: 5, attack: 3, health: 6, rarity: "epic", art: null,
      keywords: ["battlecry"], target: "none",
      text: "战吼：使所有友方随从获得嘲讽和 +0/+1。",
      flavor: "她守过的每一道墙，最后都变成了人。",
      battlecry: { type: "buffAllTaunt", health: 1 }
    },
    powder_keg: {
      id: "powder_keg", name: "火药桶", faction: "empire", type: "minion",
      cost: 3, attack: 1, health: 4, rarity: "epic", art: null,
      keywords: ["deathrattle"], target: "none",
      text: "亡语：对所有敌方随从造成 3 点伤害。",
      flavor: "帝国工兵手册第一条：不要写第二条。",
      deathrattle: { type: "damageAllEnemies", amount: 3 }
    },
    chrono_scholar: {
      id: "chrono_scholar", name: "时序学者", faction: "neutral", type: "minion",
      cost: 6, attack: 4, health: 5, rarity: "epic", art: null,
      keywords: ["battlecry"], target: "none",
      text: "战吼：若本回合你施放过法术，抽 1 张牌。",
      flavor: "他研究时间，是为了把学费拖到下周。",
      battlecry: { type: "spellDraw", draw: 1 }
    },

    /* ===== 高费中立 ===== */
    obsidian_colossus: {
      id: "obsidian_colossus", name: "黑曜巨像", faction: "neutral", type: "minion",
      cost: 9, attack: 7, health: 8, rarity: "legendary", art: null,
      keywords: ["taunt", "deathrattle"], target: "none",
      text: "嘲讽。亡语：召唤一个 3/3 的黑曜碎片。",
      flavor: "它从地底站起来时，整座矿脉都跟着呼吸。",
      deathrattle: { type: "summon", token: "obsidian_spawn" }
    },
    world_serpent: {
      id: "world_serpent", name: "世界之蛇", faction: "neutral", type: "minion",
      cost: 10, attack: 8, health: 8, rarity: "legendary", art: null,
      keywords: ["battlecry"], target: "none",
      text: "战吼：对所有敌方随从造成 4 点伤害；引脉 7：再抽 1 张牌。",
      flavor: "它绕世界一圈，只是为了咬住自己的尾巴。",
      battlecry: { type: "damageAllEnemiesDraw", amount: 4, vein: 7, draw: 1 }
    },
    faceless_king: {
      id: "faceless_king", name: "无面君王", faction: "neutral", type: "minion",
      cost: 9, attack: 6, health: 6, rarity: "legendary", art: null,
      keywords: ["battlecry"], target: "friendly",
      text: "战吼：复制一个友方随从。",
      flavor: "王座之上没有脸，只有另一个人的影子。",
      battlecry: { type: "copyFriendly" }
    },
    chrono_archivist: {
      id: "chrono_archivist", name: "时序档案官", faction: "neutral", type: "minion",
      cost: 8, attack: 6, health: 7, rarity: "epic", art: null,
      keywords: ["battlecry"], target: "enemy",
      text: "战吼：将一个敌方随从移回其手牌。",
      flavor: "每一页都写着同一天，只是墨迹不同。",
      battlecry: { type: "returnToHand" }
    },
    frost_leviathan: {
      id: "frost_leviathan", name: "霜潮利维坦", faction: "neutral", type: "minion",
      cost: 8, attack: 6, health: 7, rarity: "epic", art: null,
      keywords: ["battlecry"], target: "none",
      text: "战吼：冻结所有敌方随从。",
      flavor: "港口的人说，那不是浪，是它在翻身。",
      battlecry: { type: "freezeAllEnemies" }
    },
    vein_behemoth: {
      id: "vein_behemoth", name: "流脉巨兽", faction: "neutral", type: "minion",
      cost: 8, attack: 6, health: 8, rarity: "epic", art: null,
      keywords: ["battlecry"], target: "none",
      text: "战吼：流脉 +2；引脉 7：获得 +2/+2 和嘲讽。",
      flavor: "它把流脉当作血管，把矿洞当作胸腔。",
      battlecry: { type: "veinBuff", amount: 2, vein: 7, attack: 2, health: 2 }
    },
    twin_weaver: {
      id: "twin_weaver", name: "双生织命者", faction: "neutral", type: "minion",
      cost: 7, attack: 5, health: 5, rarity: "epic", art: null,
      keywords: ["battlecry"], target: "none",
      text: "战吼：召唤一个自身的复制。",
      flavor: "她们从不吵架，因为意见总是同一个。",
      battlecry: { type: "summonSelfCopy" }
    },
    archive_devourer: {
      id: "archive_devourer", name: "档案吞噬者", faction: "neutral", type: "minion",
      cost: 7, attack: 5, health: 6, rarity: "epic", art: null,
      keywords: ["battlecry"], target: "enemy",
      text: "战吼：沉默一个敌方随从；抽 1 张牌。",
      flavor: "它吃掉的不是纸，是纸上写着的名字。",
      battlecry: { type: "silenceDraw", draw: 1 }
    },
    astral_colossus: {
      id: "astral_colossus", name: "星界巨像", faction: "neutral", type: "minion",
      cost: 6, attack: 4, health: 7, rarity: "epic", art: null,
      keywords: ["taunt", "battlecry"], target: "none",
      text: "嘲讽。战吼：获得 4 点护甲。",
      flavor: "它体内装着一整片没有名字的星空。",
      battlecry: { type: "armor", amount: 4 }
    },
    grave_titan: {
      id: "grave_titan", name: "墓钟泰坦", faction: "neutral", type: "minion",
      cost: 9, attack: 7, health: 7, rarity: "legendary", art: null,
      keywords: ["deathrattle"], target: "none",
      text: "亡语：召唤一个 5/5 的墓钟守卫。",
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
      text: "对所有角色造成 5 点伤害。",
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

  Object.assign(CARDS.emergency, { text: "恢复一个友方角色 3 点生命；抽 1 张牌。", spell: { type: "healDraw", amount: 3, draw: 1 } });
  Object.assign(CARDS.archive_search, { text: "抽 1 张牌。", spell: { type: "draw", amount: 1 } });
  Object.assign(CARDS.fortify, { text: "使一个友方角色获得 +0/+1 与嘲讽。", spell: { type: "buffTaunt", attack: 0, health: 1 } });
  Object.assign(CARDS.konrad, { text: "嘲讽。战吼：获得 5 点护甲。", battlecry: { type: "armor", amount: 5 } });
  Object.assign(CARDS.astral_colossus, { text: "嘲讽。战吼：获得 3 点护甲。", battlecry: { type: "armor", amount: 3 } });
  Object.assign(CARDS.vein_prism, { text: "抽 1 张牌；引脉 6：再抽 1 张牌。", spell: { type: "drawVein", amount: 1, vein: 6, bonus: 1 } });
  Object.assign(CARDS.bard, { text: "战吼：抽 1 张牌；引脉 6：再抽 1 张牌。", battlecry: { type: "drawVein", amount: 1, vein: 6, bonus: 1 } });
  Object.assign(CARDS.vein_behemoth, { text: "战吼：流脉 +2；引脉 10：获得 +0/+1 和嘲讽。", battlecry: { type: "veinBuff", amount: 2, vein: 10, attack: 0, health: 1 } });
  Object.assign(CARDS.tribal_warrior, { bloodCost: 3, text: "血祭 3：获得 +1/+1。" });
  Object.assign(CARDS.tiega, { bloodCost: 3, text: "冲锋。血祭 3：获得 +2 攻击。" });
  Object.assign(CARDS.guard, { keywords: ["taunt", "battlecry"], target: "none", text: "嘲讽。战吼：引脉 4：攻击力 +1。", battlecry: { type: "veinSelfBuff", vein: 4, attack: 1 } });
  Object.assign(CARDS.nina, { optionalTarget: true });
  Object.assign(CARDS.time_reflux, { disabled: true });
  Object.assign(CARDS.verious, { text: "战吼：沉默一个敌方角色；引脉 5：获得 +0/+2。", battlecry: { type: "silenceVeinBuff", vein: 5, health: 2 } });
  Object.assign(CARDS.miyuki, { text: "战吼：冻结一个敌方角色；引脉 6：改为冻结所有敌方角色；引脉 10：消灭所有敌方冻结随从。", battlecry: { type: "freeze", allAtVein: 6, destroyFrozenAtVein: 10 } });
  Object.assign(CARDS.hans, { keywords: ["taunt", "battlecry"], target: "none", text: "嘲讽。战吼：同阵位所有具有嘲讽的友方角色获得 +0/+1。", battlecry: { type: "buffTauntZone", health: 1 } });
  Object.assign(CARDS.klaus, { keywords: ["taunt", "battlecry"], target: "none", text: "嘲讽。战吼：场上每有一个铁甲步兵，获得 +2/+1。", battlecry: { type: "buffPerIronclad", attack: 2, health: 1 } });
  Object.assign(CARDS.ironclad, { keywords: ["taunt", "battlecry"], target: "none", text: "嘲讽。战吼：若同阵位有另一个铁甲步兵，获得 +0/+1。", battlecry: { type: "buffIfIronclad", health: 1 } });
  Object.assign(CARDS.cassian, { text: "冲锋。每回合结束时，对自身造成 1 点伤害。", passive: { type: "endTurnSelfDamage", amount: 1 } });
  Object.assign(CARDS.samuel, { text: "战吼：抽 1 张法术牌。", battlecry: { type: "drawSpell" } });
  Object.assign(CARDS.lecturer, { text: "战吼：若你的手牌数不少于 6，获得 +0/+2。", battlecry: { type: "handBuff", hand: 6, attack: 0, health: 2 } });
  Object.assign(CARDS.justus, { text: "战吼：抽 1 张牌；若你的手牌数不超过 6，再抽 1 张牌。", battlecry: { type: "drawHandCondition", hand: 6, draw: 1 } });
  Object.assign(CARDS.field_medic, { target: "none", text: "战吼：恢复你的英雄 2 点生命。", battlecry: { type: "healHero", amount: 2 } });


  const NEUTRAL_DECK = [
    "monarch",
    "gok_digger", "gok_digger",
    "fog_sailor",
    "snow_medic", "snow_medic",
    "mist_scout", "mist_scout",
    "caravan_guard", "caravan_guard",
    "astral_colossus", "moonfall"
  ];

  const DECK_STRATEGIES = {
    aggro: { name: "快攻", desc: "低费随从与直伤，抢在前中期结束。", curve: { 1: 7, 2: 8, 3: 7, 4: 5, 5: 2, 6: 1 } },
    midrange: { name: "中速", desc: "按费拍下高质量角色，靠阵位和战吼取得优势。", curve: { 1: 5, 2: 7, 3: 6, 4: 6, 5: 4, 6: 2 } },
    control: { name: "控制", desc: "解场、冻结、恢复与抽牌，拖到流脉与高费回合。", curve: { 1: 4, 2: 6, 3: 6, 4: 6, 5: 5, 6: 3 } }
  };

  function maxCopies(def) {
    if (!def || def.token) return 0;
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
    if (!Array.isArray(list) || list.length !== 30) errors.push("牌组必须正好 30 张");
    const counts = {};
    for (const id of list || []) {
      const d = CARDS[id];
      if (!d || d.token || d.disabled) { errors.push("包含不存在或不可用的牌：" + id); continue; }
      if (d.faction !== faction && d.faction !== "neutral") errors.push(d.name + " 不属于该阵营");
      counts[id] = (counts[id] || 0) + 1;
      if (counts[id] > maxCopies(d)) errors.push(d.name + " 超出同名张数上限");
    }
    return { ok: errors.length === 0 && (list || []).length === 30, errors: Array.from(new Set(errors)), counts: counts };
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
    const pool = cardPool(faction);
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
    while (chosen.length < 30) {
      let added = false;
      for (const id of rest) {
        if (chosen.length >= 30) break;
        if (take(id)) added = true;
      }
      if (!added) break;
    }
    return chosen.slice(0, 30);
  }

  const DECKS = {
    pus: [
      "shextena", "verious", "timon", "aidric", "orlicas", "miyuki",
      "medic_apprentice", "medic_apprentice",
      "guard", "guard",
      "courier", "courier",
      "coordination", "coordination",
      "emergency", "emergency",
      "resonance", "resonance",
      ...NEUTRAL_DECK
    ],
    xizhao: [
      "tiega", "lanxi", "lize", "grayfeather", "lanzhou", "molan",
      "tribal_warrior", "tribal_warrior",
      "blood_servant", "blood_servant",
      "losutai_hunter", "losutai_hunter",
      "blood_ritual", "blood_ritual",
      "monster_summon", "monster_summon",
      "shadow_raid", "shadow_raid",
      ...NEUTRAL_DECK
    ],
    academy: [
      "karl_desmond", "justus", "cassian", "samuel", "nina",
      "doorman", "doorman", "lecturer", "lecturer",
      "archive_search", "archive_search",
      "frost_seal", "frost_seal",
      "debate", "debate",
      "insight", "insight",
      "prohibition",
      ...NEUTRAL_DECK
    ],
    republic: [
      "konrad", "erhardt", "beatrix", "elena", "hans", "cedric",
      "republic_guard", "republic_guard",
      "shield_bearer", "shield_bearer",
      "fortify", "fortify",
      "volley", "volley",
      "levy", "levy",
      "martial_law", "martial_law",
      ...NEUTRAL_DECK
    ],
    empire: [
      "gunther", "klaus", "mia", "elsa", "karl_schwarz", "walter",
      "empire_guard", "empire_guard",
      "ironclad", "ironclad",
      "barrage", "barrage",
      "mobilize", "mobilize",
      "fortress", "fortress",
      "martial_court", "martial_court",
      ...NEUTRAL_DECK
    ]
  };

  const KEYWORDS = {
    taunt: { name: "嘲讽", icon: "🛡", color: "#d8b36a" },
    charge: { name: "冲锋", icon: "⚔", color: "#e07a5f" },
    battlecry: { name: "战吼", icon: "✦", color: "#7ec8e3" },
    deathrattle: { name: "亡语", icon: "☠", color: "#b58bd8" },
    freeze: { name: "冻结", icon: "❄", color: "#7fd3ff" },
    stealth: { name: "潜行", icon: "◐", color: "#9bb0c9" },
    counter: { name: "反击", icon: "↩", color: "#e0b36a" }
  };

  return { FACTIONS, FACTION_IDS, nextFaction, HEROES, CARDS, DECKS, NEUTRAL_DECK, KEYWORDS, DECK_STRATEGIES, cardPool, validateDeck, autoBuildDeck, maxCopies };
});
