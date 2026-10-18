# 《戈克世界：流脉牌局》素材说明（P1 垂直切片）

> 生成日期：2026-10-18 · 输出目录：`流脉牌局/public/assets/`  
> 本次只写入本目录；未改动 HTML / CSS / JS / 设计文档或其他目录。未使用网络图片。

---

## 1. 目录与数量

| 目录 / 文件 | 数量 | 规格 | 说明 |
|---|---:|---|---|
| `portraits/` | 36 | 480×640 WebP q84 | 卡图，3:4 |
| `heroes/` | 36 | 512×512 WebP q84 | 英雄头像，1:1 |
| `backgrounds/` | 3 | 1920×1080 WebP q84 | menu / battle / xizhao |
| `manifest.json` | 1 | — | 36 位角色 + 3 张背景的清单 |
| `_contact_sheet.jpg` | 1 | 1516×1824 | 6×6 验收联系表，带 ID 与中文名 |
| `README_assets.md` | 1 | — | 本说明 |

- **图像素材：75 张**（36 portraits + 36 heroes + 3 backgrounds）
- **WebP 合计：3,667,696 字节（约 3.50 MiB / 3.67 MB）**
- **目录合计（含 manifest、联系表、本说明）：约 4.19 MiB / 4.40 MB**
- 阵营分布：普卫岛 7 · 学院 7 · 共和国 7 · 西昭 7 · 帝国 7 · 中立/自由人 1 = **36**
- 前端引用：`assets/portraits/{id}.webp`、`assets/heroes/{id}.webp`、`assets/backgrounds/menu.webp` / `battle.webp` / `xizhao.webp`。

---

## 2. 源素材

### 2.1 角色立绘（36 张）

- 路径：`C:/Users/ASUS/Desktop/戈克世界/立绘/精二/`
- 规格：PNG，统一 **3040×5404**（4K，9:16），无文字精二立绘。
- 变体选择（按要求优先）：
  - 莱恩 → `莱恩_精二v2.png`
  - 维里欧斯 → `维里欧斯_精二v3.png`
  - 希斯蒂娜 → `希斯蒂娜_精二v2.png`
  - 提蒙 → `提蒙_精二v2.png`
  - 其余 32 位使用各自唯一文件；未选用 `莱恩_精二.png`、`维里欧斯_精二.png`、`维里欧斯_精二v2.png`、`希斯蒂娜_精二.png`、`提蒙_精二.png` 等旧变体。

### 2.2 背景配图（3 张）

- 路径：`C:/Users/ASUS/Desktop/戈克世界/（小说正文）戈克降临/配图/`
- 源规格：PNG，2560×1440。
- `menu.webp` ← `配图1_雾港浮空城.png`
- `battle.webp` ← `配图16_雪都全景.png`
- `xizhao.webp` ← `配图17_雪都之战.png`

### 2.3 未使用的素材

- 未使用 NSFW 私设图、参考图、介绍卡/带文字图。
- 未使用 `（小说正文）戈克降临/配图/` 中除上述 3 张外的剧情配图。
- 未联网下载任何图片。

---

## 3. 裁切与压缩规则

### 3.1 portraits（卡图，480×640）

1. 从原图**顶部**取 **75% 高度**：3040×5404 → **3040×4053**；
2. 水平居中：因 3040×4053 已精确为 3:4，宽度方向无需再裁；
3. Lanczos 缩放到 **480×640**；
4. WebP，quality **84**，method 6。

### 3.2 heroes（英雄头像，512×512）

1. 从原图**顶部**取 **55% 高度**：3040×5404 → 3040×2972；
2. 水平居中裁成正方形：**2972×2972**（左右各去掉 34px）；
3. Lanczos 缩放到 **512×512**；
4. WebP，quality **84**，method 6。

### 3.3 背景（1920×1080）

- 2560×1440 → Lanczos 缩放到 **1920×1080**；
- WebP，quality **84**，method 6；保持 16:9，无裁切。

### 3.4 裁切锚点与异常记录

- 36 张立绘规格一致，全部使用统一锚点 **top-center**；`manifest.json` 的 `crop.box` 记录了每张图的实际像素裁切框。
- 已逐张检查 `_contact_sheet.jpg`（36 张 portraits）与 heroes 预览：**未发现脸部、眼睛、耳朵、角被裁切**，上半身均保留。
- **本批没有需要逐角色改锚点的异常**，因此未使用例外锚点；所有图的裁切框均为：
  - portrait：`[0, 0, 3040, 4053]`
  - hero：`[34, 0, 3006, 2972]`
- 说明：按设计方案 10.4 的裁切原则，角色武器/尾巴允许出框；本批严格执行“顶部 75%”统一规则，未为个别角色偏移锚点，优先保证脸部与标志性耳朵、角完整。

---

## 4. 角色清单（36 位）

> 路径约定：卡图 `portraits/{id}.webp`；头像 `heroes/{id}.webp`；源文件位于 `立绘/精二/`。

| ID | 中文名 | 阵营 | 源文件 |
|---|---|---|---|
| `lain` | 莱恩·科斯特 | 普卫岛 | `莱恩_精二v2.png` |
| `shextena` | 希斯蒂娜 | 普卫岛 | `希斯蒂娜_精二v2.png` |
| `verious` | 维里欧斯 | 普卫岛 | `维里欧斯_精二v3.png` |
| `timon` | 提蒙·克若诺 | 普卫岛 | `提蒙_精二v2.png` |
| `aidric` | 艾德里克 | 普卫岛 | `艾德里克_精二.png` |
| `orlicas` | 欧莉卡斯 | 普卫岛 | `欧莉卡斯_精二.png` |
| `miyuki` | 一之濑·深雪 | 普卫岛 | `一之濑·深雪_精二.png` |
| `marta` | 玛尔塔·冯·艾森 | 学院 | `玛尔塔·冯·艾森.png` |
| `karl_desmond` | 卡尔·德斯蒙德 | 学院 | `卡尔·德斯蒙德.png` |
| `justus` | 尤斯图斯·维尔纳 | 学院 | `尤斯图斯·维尔纳.png` |
| `cassian` | 卡西安·维尔 | 学院 | `卡西安·维尔_精二.png` |
| `samuel` | 塞缪尔·奎因 | 学院 | `塞缪尔·奎因.png` |
| `nina` | 妮娜·索雷尔 | 学院 | `妮娜·索雷尔.png` |
| `doorman` | 老门房 | 学院 | `老门房.png` |
| `wolfram` | 沃尔夫拉姆·冯·施泰因 | 共和国 | `沃尔夫拉姆·冯·施泰因.png` |
| `konrad` | 康拉德·威廉莱斯 | 共和国 | `康拉德·威廉莱斯.png` |
| `erhardt` | 埃尔哈特·冯·罗森 | 共和国 | `埃尔哈特·冯·罗森.png` |
| `beatrix` | 贝娅特丽克丝·冯·艾森胡特 | 共和国 | `贝娅特丽克丝·冯·艾森胡特.png` |
| `elena` | 伊莲娜·索菲 | 共和国 | `伊莲娜·索菲.png` |
| `hans` | 汉斯·冯·霍尔姆 | 共和国 | `汉斯·冯·霍尔姆.png` |
| `cedric` | 塞德里克·威廉莱斯 | 共和国 | `塞德里克·威廉莱斯.png` |
| `karna` | 卡尔纳 | 西昭 | `卡尔纳.png` |
| `tiega` | 铁牙·阿古 | 西昭 | `铁牙·阿古.png` |
| `lanxi` | 澜汐 | 西昭 | `澜汐.png` |
| `lize` | 莉泽 | 西昭 | `莉泽.png` |
| `grayfeather` | 灰羽·乌恩 | 西昭 | `灰羽·乌恩.png` |
| `lanzhou` | 澜舟 | 西昭 | `澜舟.png` |
| `molan` | 墨兰 | 西昭 | `墨兰.png` |
| `otto` | 奥托·汉瑟尔 | 帝国 | `奥托·汉瑟尔.png` |
| `gunther` | 京特·冯·艾森瓦尔德 | 帝国 | `京特·冯·艾森瓦尔德.png` |
| `klaus` | 克劳斯·莱茵哈特 | 帝国 | `克劳斯·莱茵哈特.png` |
| `mia` | 米娅·科尔贝 | 帝国 | `米娅·科尔贝.png` |
| `elsa` | 艾尔莎·汉瑟尔 | 帝国 | `艾尔莎·汉瑟尔.png` |
| `karl_schwarz` | 卡尔·冯·施瓦茨 | 帝国 | `卡尔·冯·施瓦茨.png` |
| `walter` | 瓦尔特·克鲁格 | 帝国 | `瓦尔特·克鲁格.png` |
| `monarch` | 莫纳克 | 中立/自由人 | `莫纳克_精二.png` |

---

## 5. 验证结果

| 检查项 | 结果 |
|---|---|
| portraits 数量 / 尺寸 | **36 / 36**，全部 480×640，WebP |
| heroes 数量 / 尺寸 | **36 / 36**，全部 512×512，WebP |
| backgrounds 数量 / 尺寸 | **3 / 3**，全部 1920×1080，WebP |
| 文件非空 | 通过；portrait 25.3–69.5 KB，hero 16.4–59.9 KB，background 129.3–380.8 KB |
| manifest 条目 | 36 条，ID 唯一，路径全部可解析，source 全部存在 |
| 源文件缺失 | 0 |
| 损坏文件 | 0（Pillow 全部可解码） |
| 联系表 | `_contact_sheet.jpg` 1516×1824，6 列 × 6 行，含 ID 与中文名 |
| 阵营分布 | pus 7 / academy 7 / republic 7 / xizhao 7 / empire 7 / neutral 1 |

---

## 6. 复现说明

- 工具：Pillow（Python 运行时：`C:/Users/ASUS/.dsh/dsh-runtimes/dsh-primary-runtime/dependencies/python/python.exe`）。
- 处理流程：EXIF 方向校正 → 统一裁切框 → Lanczos 缩放 → WebP q84（method 6）。
- `manifest.json` 为 UTF-8，字段包含：`id`、`name`、`faction`、`portrait`、`hero`、`source`、`crop`（portrait/hero 两套 `box` 与规则）、`source_size`、`bytes`。
- `_contact_sheet.jpg` 缩略图取自 portraits，顺序同 `manifest.characters`；左上角色条对应阵营色。
- 本目录不含构建脚本；如后续需要批量重跑，可按第 3 节规则重新生成。
