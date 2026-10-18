# 生成卡图投放说明 / Generated Card Art

把生成的图片命名为「卡牌 id」并放进本目录，支持 .webp / .png / .jpg。
服务器会自动通过 /api/art/<id> 读取；刷新游戏即可替换，不需要改代码。

示例：医疗学徒 -> medic_apprentice.webp

统一风格建议：
dark archive fantasy, painterly semi-realistic, chiaroscuro, muted teal/charcoal/gold palette, cinematic rim light, atmospheric fog, no text, no border, no logo, no watermark, no NSFW, 3:4 vertical card illustration

## 缺失卡图清单

| id | 名称 | 阵营 | 类型 | 费用 | 效果 |
|---|---|---|---|---|---|
| medic_apprentice | 医疗学徒 | 普卫岛 | 随从 | 1 | 战吼：恢复一个友方角色 1 点生命。 |
| guard | 保卫部卫兵 | 普卫岛 | 随从 | 3 | 嘲讽。 |
| courier | 协调部信使 | 普卫岛 | 随从 | 1 | 战吼：本回合你打出的下一张牌费用减少 1。 |
| coordination | 协同调度 | 普卫岛 | 法术 | 1 | 使一个友方角色获得 +1/+1；若它与另一个友方角色同阵位，再恢复 1 点生命。 |
| emergency | 应急响应 | 普卫岛 | 法术 | 3 | 恢复一个友方角色 6 点生命；抽 1 张牌。 |
| resonance | 流脉共鸣 | 普卫岛 | 法术 | 3 | 抽 2 张牌；采掘 1。 |
| tribal_warrior | 部落战士 | 西昭 | 随从 | 1 | 血祭 1：获得 +1/+1。 |
| blood_servant | 血族仆从 | 西昭 | 随从 | 3 | 亡语：使一个友方角色获得 +1 攻击。 |
| losutai_hunter | 洛斯汰猎手 | 西昭 | 随从 | 3 | 战吼：对一个敌方角色造成 1 点伤害。 |
| blood_ritual | 血祭仪式 | 西昭 | 法术 | 2 | 对一个友方角色造成 2 点伤害，抽 1 张牌；若该角色死亡，再抽 1 张牌。 |
| monster_summon | 魔物召唤 | 西昭 | 法术 | 3 | 召唤一个 3/3 洛斯汰魔物；引脉 4：再召唤一个 1/1 洛斯汰魔物。 |
| shadow_raid | 暗影突袭 | 西昭 | 法术 | 2 | 使一个友方角色获得 +2 攻击和冲锋。 |
| lecturer | 学院讲师 | 学院 | 随从 | 3 | 战吼：抽 1 张牌。 |
| archive_search | 档案检索 | 学院 | 法术 | 2 | 抽 2 张牌。 |
| frost_seal | 寒霜封印 | 学院 | 法术 | 2 | 冻结一个敌方角色；抽 1 张牌。 |
| debate | 学术辩论 | 学院 | 法术 | 1 | 对一个敌方角色造成 2 点伤害。 |
| insight | 洞察 | 学院 | 法术 | 1 | 抽 1 张牌；采掘 1。 |
| prohibition | 禁制令 | 学院 | 法术 | 3 | 冻结所有敌方角色。 |
| republic_guard | 共和国卫兵 | 共和国 | 随从 | 2 | 嘲讽。 |
| shield_bearer | 持盾侍从 | 共和国 | 随从 | 3 | 嘲讽。 |
| fortify | 筑防令 | 共和国 | 法术 | 2 | 使一个友方角色获得 +0/+2 与嘲讽。 |
| volley | 排枪齐射 | 共和国 | 法术 | 2 | 对一个敌方角色造成 2 点伤害。 |
| levy | 征募令 | 共和国 | 法术 | 3 | 抽 2 张牌。 |
| martial_law | 戒严令 | 共和国 | 法术 | 4 | 冻结所有敌方角色。 |
| empire_guard | 帝国卫兵 | 帝国 | 随从 | 2 | 嘲讽。 |
| ironclad | 铁甲步兵 | 帝国 | 随从 | 3 | 嘲讽。 |
| barrage | 炮火覆盖 | 帝国 | 法术 | 2 | 对一个敌方角色造成 2 点伤害。 |
| mobilize | 全国动员 | 帝国 | 法术 | 3 | 抽 2 张牌。 |
| fortress | 要塞令 | 帝国 | 法术 | 2 | 使一个友方角色获得 +0/+3 与嘲讽。 |
| martial_court | 军事法庭 | 帝国 | 法术 | 4 | 冻结所有敌方角色。 |
| gok_digger | 戈克采掘者 | 中立 | 随从 | 2 | 采掘 1；战吼：获得 2 点护甲。 |
| fog_sailor | 雾港水手 | 中立 | 随从 | 1 |  |
| snow_medic | 雪镇医者 | 中立 | 随从 | 1 | 战吼：恢复一个友方角色 1 点生命。 |
| sim_assistant | 推演助手 | 中立 | 随从 | 2 | 战吼：抽 1 张牌。 |
| bard | 吟游诗人 | 中立 | 随从 | 3 | 战吼：抽 1 张牌；引脉 4：再抽 1 张牌。 |
| blood_retainer | 血族侍从 | 中立 | 随从 | 2 | 血祭 1：获得 +1/+1。 |
| vein_prospect | 流脉勘探 | 中立 | 法术 | 2 | 抽 1 张牌；采掘 1。 |
| vein_channel | 流脉疏导 | 中立 | 法术 | 2 | 流脉 -2（最低 0）；抽 1 张牌。 |
| vein_warden | 流脉守望者 | 中立 | 随从 | 3 | 嘲讽。 |
| mist_hound | 雾猎犬 | 中立 | 随从 | 2 | 冲锋。 |
| archive_scribe | 档案抄写员 | 中立 | 随从 | 2 | 战吼：抽 1 张牌。 |
| field_medic | 战地医者 | 中立 | 随从 | 2 | 战吼：恢复一个友方角色 1 点生命。 |
| old_ledger | 旧账本 | 中立 | 法术 | 2 | 抽 1 张牌；采掘 1。 |
| vein_prism | 流脉棱镜 | 中立 | 法术 | 3 | 抽 1 张牌；引脉 4：再抽 1 张牌。 |
| mist_scout | 雾境斥候 | 中立 | 随从 | 2 | 冲锋。 |
| archive_guard | 档案守卫 | 中立 | 随从 | 2 | 嘲讽。 |
| vein_medic | 流脉医师 | 中立 | 随从 | 2 | 战吼：恢复一个友方角色 2 点生命。 |
| field_engineer | 战地工程师 | 中立 | 随从 | 3 | 战吼：获得 2 点护甲。 |
| caravan_guard | 商队护卫 | 中立 | 随从 | 4 | 嘲讽。 |
| mercenary | 自由佣兵 | 中立 | 随从 | 3 | 没有阵营，只有价钱。 |
| bounty_hunter | 赏金猎人 | 中立 | 随从 | 3 | 战吼：对一个敌方角色造成 1 点伤害。 |
| supply_cache | 补给箱 | 中立 | 法术 | 2 | 抽 1 张牌。 |
| smoke_screen | 烟雾弹 | 中立 | 法术 | 2 | 冻结一个敌方角色；抽 1 张牌。 |
| recon | 战前侦察 | 中立 | 法术 | 1 | 抽 1 张牌；采掘 1。 |

## 逐卡提示词模板

> 建议每次批量生成 4 张，以「卡名 + 类型 + 效果」为主体，保留统一风格。

### 医疗学徒 / medic_apprentice
character card illustration, 普卫岛 faction, 战吼：恢复一个友方角色 1 点生命,, dark archive fantasy, painterly semi-realistic, chiaroscuro, muted teal/charcoal/gold palette, cinematic rim light, atmospheric fog, no text, no border, no logo, no watermark, no NSFW, 3:4 vertical card illustration

### 保卫部卫兵 / guard
character card illustration, 普卫岛 faction, 嘲讽,, dark archive fantasy, painterly semi-realistic, chiaroscuro, muted teal/charcoal/gold palette, cinematic rim light, atmospheric fog, no text, no border, no logo, no watermark, no NSFW, 3:4 vertical card illustration

### 协调部信使 / courier
character card illustration, 普卫岛 faction, 战吼：本回合你打出的下一张牌费用减少 1,, dark archive fantasy, painterly semi-realistic, chiaroscuro, muted teal/charcoal/gold palette, cinematic rim light, atmospheric fog, no text, no border, no logo, no watermark, no NSFW, 3:4 vertical card illustration

### 协同调度 / coordination
spell card illustration, 普卫岛 faction, 使一个友方角色获得 +1/+1；若它与另一个友方角色同阵位，再恢复 1 点生命,, dark archive fantasy, painterly semi-realistic, chiaroscuro, muted teal/charcoal/gold palette, cinematic rim light, atmospheric fog, no text, no border, no logo, no watermark, no NSFW, 3:4 vertical card illustration

### 应急响应 / emergency
spell card illustration, 普卫岛 faction, 恢复一个友方角色 6 点生命；抽 1 张牌,, dark archive fantasy, painterly semi-realistic, chiaroscuro, muted teal/charcoal/gold palette, cinematic rim light, atmospheric fog, no text, no border, no logo, no watermark, no NSFW, 3:4 vertical card illustration

### 流脉共鸣 / resonance
spell card illustration, 普卫岛 faction, 抽 2 张牌；采掘 1,, dark archive fantasy, painterly semi-realistic, chiaroscuro, muted teal/charcoal/gold palette, cinematic rim light, atmospheric fog, no text, no border, no logo, no watermark, no NSFW, 3:4 vertical card illustration

### 部落战士 / tribal_warrior
character card illustration, 西昭 faction, 血祭 1：获得 +1/+1,, dark archive fantasy, painterly semi-realistic, chiaroscuro, muted teal/charcoal/gold palette, cinematic rim light, atmospheric fog, no text, no border, no logo, no watermark, no NSFW, 3:4 vertical card illustration

### 血族仆从 / blood_servant
character card illustration, 西昭 faction, 亡语：使一个友方角色获得 +1 攻击,, dark archive fantasy, painterly semi-realistic, chiaroscuro, muted teal/charcoal/gold palette, cinematic rim light, atmospheric fog, no text, no border, no logo, no watermark, no NSFW, 3:4 vertical card illustration

### 洛斯汰猎手 / losutai_hunter
character card illustration, 西昭 faction, 战吼：对一个敌方角色造成 1 点伤害,, dark archive fantasy, painterly semi-realistic, chiaroscuro, muted teal/charcoal/gold palette, cinematic rim light, atmospheric fog, no text, no border, no logo, no watermark, no NSFW, 3:4 vertical card illustration

### 血祭仪式 / blood_ritual
spell card illustration, 西昭 faction, 对一个友方角色造成 2 点伤害，抽 1 张牌；若该角色死亡，再抽 1 张牌,, dark archive fantasy, painterly semi-realistic, chiaroscuro, muted teal/charcoal/gold palette, cinematic rim light, atmospheric fog, no text, no border, no logo, no watermark, no NSFW, 3:4 vertical card illustration

### 魔物召唤 / monster_summon
spell card illustration, 西昭 faction, 召唤一个 3/3 洛斯汰魔物；引脉 4：再召唤一个 1/1 洛斯汰魔物,, dark archive fantasy, painterly semi-realistic, chiaroscuro, muted teal/charcoal/gold palette, cinematic rim light, atmospheric fog, no text, no border, no logo, no watermark, no NSFW, 3:4 vertical card illustration

### 暗影突袭 / shadow_raid
spell card illustration, 西昭 faction, 使一个友方角色获得 +2 攻击和冲锋,, dark archive fantasy, painterly semi-realistic, chiaroscuro, muted teal/charcoal/gold palette, cinematic rim light, atmospheric fog, no text, no border, no logo, no watermark, no NSFW, 3:4 vertical card illustration

### 学院讲师 / lecturer
character card illustration, 学院 faction, 战吼：抽 1 张牌,, dark archive fantasy, painterly semi-realistic, chiaroscuro, muted teal/charcoal/gold palette, cinematic rim light, atmospheric fog, no text, no border, no logo, no watermark, no NSFW, 3:4 vertical card illustration

### 档案检索 / archive_search
spell card illustration, 学院 faction, 抽 2 张牌,, dark archive fantasy, painterly semi-realistic, chiaroscuro, muted teal/charcoal/gold palette, cinematic rim light, atmospheric fog, no text, no border, no logo, no watermark, no NSFW, 3:4 vertical card illustration

### 寒霜封印 / frost_seal
spell card illustration, 学院 faction, 冻结一个敌方角色；抽 1 张牌,, dark archive fantasy, painterly semi-realistic, chiaroscuro, muted teal/charcoal/gold palette, cinematic rim light, atmospheric fog, no text, no border, no logo, no watermark, no NSFW, 3:4 vertical card illustration

### 学术辩论 / debate
spell card illustration, 学院 faction, 对一个敌方角色造成 2 点伤害,, dark archive fantasy, painterly semi-realistic, chiaroscuro, muted teal/charcoal/gold palette, cinematic rim light, atmospheric fog, no text, no border, no logo, no watermark, no NSFW, 3:4 vertical card illustration

### 洞察 / insight
spell card illustration, 学院 faction, 抽 1 张牌；采掘 1,, dark archive fantasy, painterly semi-realistic, chiaroscuro, muted teal/charcoal/gold palette, cinematic rim light, atmospheric fog, no text, no border, no logo, no watermark, no NSFW, 3:4 vertical card illustration

### 禁制令 / prohibition
spell card illustration, 学院 faction, 冻结所有敌方角色,, dark archive fantasy, painterly semi-realistic, chiaroscuro, muted teal/charcoal/gold palette, cinematic rim light, atmospheric fog, no text, no border, no logo, no watermark, no NSFW, 3:4 vertical card illustration

### 共和国卫兵 / republic_guard
character card illustration, 共和国 faction, 嘲讽,, dark archive fantasy, painterly semi-realistic, chiaroscuro, muted teal/charcoal/gold palette, cinematic rim light, atmospheric fog, no text, no border, no logo, no watermark, no NSFW, 3:4 vertical card illustration

### 持盾侍从 / shield_bearer
character card illustration, 共和国 faction, 嘲讽,, dark archive fantasy, painterly semi-realistic, chiaroscuro, muted teal/charcoal/gold palette, cinematic rim light, atmospheric fog, no text, no border, no logo, no watermark, no NSFW, 3:4 vertical card illustration

### 筑防令 / fortify
spell card illustration, 共和国 faction, 使一个友方角色获得 +0/+2 与嘲讽,, dark archive fantasy, painterly semi-realistic, chiaroscuro, muted teal/charcoal/gold palette, cinematic rim light, atmospheric fog, no text, no border, no logo, no watermark, no NSFW, 3:4 vertical card illustration

### 排枪齐射 / volley
spell card illustration, 共和国 faction, 对一个敌方角色造成 2 点伤害,, dark archive fantasy, painterly semi-realistic, chiaroscuro, muted teal/charcoal/gold palette, cinematic rim light, atmospheric fog, no text, no border, no logo, no watermark, no NSFW, 3:4 vertical card illustration

### 征募令 / levy
spell card illustration, 共和国 faction, 抽 2 张牌,, dark archive fantasy, painterly semi-realistic, chiaroscuro, muted teal/charcoal/gold palette, cinematic rim light, atmospheric fog, no text, no border, no logo, no watermark, no NSFW, 3:4 vertical card illustration

### 戒严令 / martial_law
spell card illustration, 共和国 faction, 冻结所有敌方角色,, dark archive fantasy, painterly semi-realistic, chiaroscuro, muted teal/charcoal/gold palette, cinematic rim light, atmospheric fog, no text, no border, no logo, no watermark, no NSFW, 3:4 vertical card illustration

### 帝国卫兵 / empire_guard
character card illustration, 帝国 faction, 嘲讽,, dark archive fantasy, painterly semi-realistic, chiaroscuro, muted teal/charcoal/gold palette, cinematic rim light, atmospheric fog, no text, no border, no logo, no watermark, no NSFW, 3:4 vertical card illustration

### 铁甲步兵 / ironclad
character card illustration, 帝国 faction, 嘲讽,, dark archive fantasy, painterly semi-realistic, chiaroscuro, muted teal/charcoal/gold palette, cinematic rim light, atmospheric fog, no text, no border, no logo, no watermark, no NSFW, 3:4 vertical card illustration

### 炮火覆盖 / barrage
spell card illustration, 帝国 faction, 对一个敌方角色造成 2 点伤害,, dark archive fantasy, painterly semi-realistic, chiaroscuro, muted teal/charcoal/gold palette, cinematic rim light, atmospheric fog, no text, no border, no logo, no watermark, no NSFW, 3:4 vertical card illustration

### 全国动员 / mobilize
spell card illustration, 帝国 faction, 抽 2 张牌,, dark archive fantasy, painterly semi-realistic, chiaroscuro, muted teal/charcoal/gold palette, cinematic rim light, atmospheric fog, no text, no border, no logo, no watermark, no NSFW, 3:4 vertical card illustration

### 要塞令 / fortress
spell card illustration, 帝国 faction, 使一个友方角色获得 +0/+3 与嘲讽,, dark archive fantasy, painterly semi-realistic, chiaroscuro, muted teal/charcoal/gold palette, cinematic rim light, atmospheric fog, no text, no border, no logo, no watermark, no NSFW, 3:4 vertical card illustration

### 军事法庭 / martial_court
spell card illustration, 帝国 faction, 冻结所有敌方角色,, dark archive fantasy, painterly semi-realistic, chiaroscuro, muted teal/charcoal/gold palette, cinematic rim light, atmospheric fog, no text, no border, no logo, no watermark, no NSFW, 3:4 vertical card illustration

### 戈克采掘者 / gok_digger
character card illustration, 中立 faction, 采掘 1；战吼：获得 2 点护甲,, dark archive fantasy, painterly semi-realistic, chiaroscuro, muted teal/charcoal/gold palette, cinematic rim light, atmospheric fog, no text, no border, no logo, no watermark, no NSFW, 3:4 vertical card illustration

### 雾港水手 / fog_sailor
character card illustration, 中立 faction, , dark archive fantasy, painterly semi-realistic, chiaroscuro, muted teal/charcoal/gold palette, cinematic rim light, atmospheric fog, no text, no border, no logo, no watermark, no NSFW, 3:4 vertical card illustration

### 雪镇医者 / snow_medic
character card illustration, 中立 faction, 战吼：恢复一个友方角色 1 点生命,, dark archive fantasy, painterly semi-realistic, chiaroscuro, muted teal/charcoal/gold palette, cinematic rim light, atmospheric fog, no text, no border, no logo, no watermark, no NSFW, 3:4 vertical card illustration

### 推演助手 / sim_assistant
character card illustration, 中立 faction, 战吼：抽 1 张牌,, dark archive fantasy, painterly semi-realistic, chiaroscuro, muted teal/charcoal/gold palette, cinematic rim light, atmospheric fog, no text, no border, no logo, no watermark, no NSFW, 3:4 vertical card illustration

### 吟游诗人 / bard
character card illustration, 中立 faction, 战吼：抽 1 张牌；引脉 4：再抽 1 张牌,, dark archive fantasy, painterly semi-realistic, chiaroscuro, muted teal/charcoal/gold palette, cinematic rim light, atmospheric fog, no text, no border, no logo, no watermark, no NSFW, 3:4 vertical card illustration

### 血族侍从 / blood_retainer
character card illustration, 中立 faction, 血祭 1：获得 +1/+1,, dark archive fantasy, painterly semi-realistic, chiaroscuro, muted teal/charcoal/gold palette, cinematic rim light, atmospheric fog, no text, no border, no logo, no watermark, no NSFW, 3:4 vertical card illustration

### 流脉勘探 / vein_prospect
spell card illustration, 中立 faction, 抽 1 张牌；采掘 1,, dark archive fantasy, painterly semi-realistic, chiaroscuro, muted teal/charcoal/gold palette, cinematic rim light, atmospheric fog, no text, no border, no logo, no watermark, no NSFW, 3:4 vertical card illustration

### 流脉疏导 / vein_channel
spell card illustration, 中立 faction, 流脉 -2（最低 0）；抽 1 张牌,, dark archive fantasy, painterly semi-realistic, chiaroscuro, muted teal/charcoal/gold palette, cinematic rim light, atmospheric fog, no text, no border, no logo, no watermark, no NSFW, 3:4 vertical card illustration

### 流脉守望者 / vein_warden
character card illustration, 中立 faction, 嘲讽,, dark archive fantasy, painterly semi-realistic, chiaroscuro, muted teal/charcoal/gold palette, cinematic rim light, atmospheric fog, no text, no border, no logo, no watermark, no NSFW, 3:4 vertical card illustration

### 雾猎犬 / mist_hound
character card illustration, 中立 faction, 冲锋,, dark archive fantasy, painterly semi-realistic, chiaroscuro, muted teal/charcoal/gold palette, cinematic rim light, atmospheric fog, no text, no border, no logo, no watermark, no NSFW, 3:4 vertical card illustration

### 档案抄写员 / archive_scribe
character card illustration, 中立 faction, 战吼：抽 1 张牌,, dark archive fantasy, painterly semi-realistic, chiaroscuro, muted teal/charcoal/gold palette, cinematic rim light, atmospheric fog, no text, no border, no logo, no watermark, no NSFW, 3:4 vertical card illustration

### 战地医者 / field_medic
character card illustration, 中立 faction, 战吼：恢复一个友方角色 1 点生命,, dark archive fantasy, painterly semi-realistic, chiaroscuro, muted teal/charcoal/gold palette, cinematic rim light, atmospheric fog, no text, no border, no logo, no watermark, no NSFW, 3:4 vertical card illustration

### 旧账本 / old_ledger
spell card illustration, 中立 faction, 抽 1 张牌；采掘 1,, dark archive fantasy, painterly semi-realistic, chiaroscuro, muted teal/charcoal/gold palette, cinematic rim light, atmospheric fog, no text, no border, no logo, no watermark, no NSFW, 3:4 vertical card illustration

### 流脉棱镜 / vein_prism
spell card illustration, 中立 faction, 抽 1 张牌；引脉 4：再抽 1 张牌,, dark archive fantasy, painterly semi-realistic, chiaroscuro, muted teal/charcoal/gold palette, cinematic rim light, atmospheric fog, no text, no border, no logo, no watermark, no NSFW, 3:4 vertical card illustration

### 雾境斥候 / mist_scout
character card illustration, 中立 faction, 冲锋,, dark archive fantasy, painterly semi-realistic, chiaroscuro, muted teal/charcoal/gold palette, cinematic rim light, atmospheric fog, no text, no border, no logo, no watermark, no NSFW, 3:4 vertical card illustration

### 档案守卫 / archive_guard
character card illustration, 中立 faction, 嘲讽,, dark archive fantasy, painterly semi-realistic, chiaroscuro, muted teal/charcoal/gold palette, cinematic rim light, atmospheric fog, no text, no border, no logo, no watermark, no NSFW, 3:4 vertical card illustration

### 流脉医师 / vein_medic
character card illustration, 中立 faction, 战吼：恢复一个友方角色 2 点生命,, dark archive fantasy, painterly semi-realistic, chiaroscuro, muted teal/charcoal/gold palette, cinematic rim light, atmospheric fog, no text, no border, no logo, no watermark, no NSFW, 3:4 vertical card illustration

### 战地工程师 / field_engineer
character card illustration, 中立 faction, 战吼：获得 2 点护甲,, dark archive fantasy, painterly semi-realistic, chiaroscuro, muted teal/charcoal/gold palette, cinematic rim light, atmospheric fog, no text, no border, no logo, no watermark, no NSFW, 3:4 vertical card illustration

### 商队护卫 / caravan_guard
character card illustration, 中立 faction, 嘲讽,, dark archive fantasy, painterly semi-realistic, chiaroscuro, muted teal/charcoal/gold palette, cinematic rim light, atmospheric fog, no text, no border, no logo, no watermark, no NSFW, 3:4 vertical card illustration

### 自由佣兵 / mercenary
character card illustration, 中立 faction, 没有阵营，只有价钱,, dark archive fantasy, painterly semi-realistic, chiaroscuro, muted teal/charcoal/gold palette, cinematic rim light, atmospheric fog, no text, no border, no logo, no watermark, no NSFW, 3:4 vertical card illustration

### 赏金猎人 / bounty_hunter
character card illustration, 中立 faction, 战吼：对一个敌方角色造成 1 点伤害,, dark archive fantasy, painterly semi-realistic, chiaroscuro, muted teal/charcoal/gold palette, cinematic rim light, atmospheric fog, no text, no border, no logo, no watermark, no NSFW, 3:4 vertical card illustration

### 补给箱 / supply_cache
spell card illustration, 中立 faction, 抽 1 张牌,, dark archive fantasy, painterly semi-realistic, chiaroscuro, muted teal/charcoal/gold palette, cinematic rim light, atmospheric fog, no text, no border, no logo, no watermark, no NSFW, 3:4 vertical card illustration

### 烟雾弹 / smoke_screen
spell card illustration, 中立 faction, 冻结一个敌方角色；抽 1 张牌,, dark archive fantasy, painterly semi-realistic, chiaroscuro, muted teal/charcoal/gold palette, cinematic rim light, atmospheric fog, no text, no border, no logo, no watermark, no NSFW, 3:4 vertical card illustration

### 战前侦察 / recon
spell card illustration, 中立 faction, 抽 1 张牌；采掘 1,, dark archive fantasy, painterly semi-realistic, chiaroscuro, muted teal/charcoal/gold palette, cinematic rim light, atmospheric fog, no text, no border, no logo, no watermark, no NSFW, 3:4 vertical card illustration

## UI 备选素材提示词（暂未自动接入）

- end_turn_button: ornate dark archive end-turn button, gold filigree corners, obsidian and brass, no text, game UI, 4:1
- panel_frame: vertical dark fantasy archive panel frame, thin gold linework, weathered brass corners, transparent background, no text, 3:4
- card_frame: vertical fantasy trading card frame, charcoal and antique gold, subtle rune corners, no text, transparent center, 3:4

