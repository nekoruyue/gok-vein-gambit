# 稳定版 / 抢先版 双通道部署指南

## 最快路线（不想折腾分支就看这里）

1. 把 `发布/戈克世界-抢先版部署` 整个文件夹复制出来，作为第二个 GitHub 仓库上传。  
   仓库名建议：`gok-vein-gambit-preview`。
2. Render → New + → Web Service，连接这个新仓库。
3. 填：
   - Name：`gok-vein-gambit-preview`
   - Branch：`main`
   - Build Command：`npm install`
   - Start Command：`node server/server.js`
   - Environment：`GOK_CHANNEL=preview`、`NODE_VERSION=20`
4. 部署完复制 Render 地址，例如：
   `https://gok-vein-gambit-preview.onrender.com`
5. 把地址填回两个地方：
   - `public/js/channel.js` 里的 `stable` / `preview` 链接
   - `public/announcements.json` 可以顺手更新版本和公告
6. 原来的稳定版仓库和 Render 服务不要动。
7. 以后只更新抢先版仓库，觉得稳定了再把内容合并/复制到稳定版。

如果愿意用同一个仓库的分支，再看下面的分支流程。

目标：同一套代码，两条独立网站。

- 稳定版：已验证内容，排位/成就/存档以这里为准
- 抢先版：新卡、新机制、平衡实验，可能有 bug

---

## 1. 当前已经做好的双通道能力

- URL 或环境变量可识别 `stable` / `preview`
- 抢先版首次进入会显示警告和已知问题
- 首页右上角有“稳定版 STABLE / 抢先版 PREVIEW”标识
- 点标识可重新查看公告
- 抢先版 localStorage 自动加 `gok_preview::` 前缀，和稳定版隔离
- 服务端健康检查会返回 channel：`/api/health`
- Render 环境变量 `GOK_CHANNEL=preview` 会注入 index.html
- 公告由 `public/announcements.json` 控制

改地址的地方：

`public/js/channel.js`

```js
window.GOK_CHANNEL_LINKS = {
  stable: "https://你的稳定版地址/",
  preview: "https://你的抢先版地址/"
};
```

部署后把这两个地址改成 Render 显示的真实地址。

---

## 2. 推荐仓库结构

Render 的仓库根目录必须是：

```text
public/
server/
package.json
render.yaml
```

不要直接把整个含 Electron、发布 zip、截图、测试的工程根目录作为 Render 仓库根目录。  
如果现有稳定版网站已经能跑，就继续用现在这个在线部署仓库。

---

## 3. 推荐分支

```text
main / stable  → 稳定版
preview        → 抢先版
```

原则：

- 稳定版只从已验证提交部署
- 抢先版可以每次推送自动部署
- 不要直接在稳定版分支上做大改

### GitHub Desktop 操作

1. 打开 GitHub Desktop
2. 确认当前分支是稳定版分支（main 或 stable）
3. 先提交一次稳定版
4. 点 Current branch → New branch
5. 名字填 `preview`
6. 在 preview 分支上提交新卡/新机制
7. 点 Publish branch，把 `preview` 推到 GitHub

如果稳定版当前提交不是你想要的那版，先从历史里找到稳定版最后一次提交，创建一个 `stable` 分支，再在 stable 上建 preview。

---

## 4. 创建第二个网站（Render）

### 第一步：登录 Render

打开：

```text
https://render.com
```

用 GitHub 登录。

### 第二步：新建 Web Service

Render 控制台 → New + → Web Service。

选择同一个 GitHub 仓库。

### 第三步：填写配置

- Name：`gok-vein-gambit-preview`
- Region：Singapore
- Branch：`preview`
- Runtime：Node
- Build Command：`npm install`
- Start Command：`node server/server.js`
- Health Check Path：`/api/health`
- Instance Type：Free 先测试

### 第四步：环境变量

在 Environment 里加：

```text
GOK_CHANNEL=preview
NODE_VERSION=20
TRIAL_KEEPALIVE=1
```

`GOK_CHANNEL=preview` 一定要加，它会注入抢先版标识。

### 第五步：创建并等待部署

部署完成后会得到类似：

```text
https://gok-vein-gambit-preview.onrender.com
```

这个地址就是抢先版。

### 第六步：稳定版服务

回到原来的稳定版 Render 服务：

- Branch 选 `main` 或 `stable`
- Environment 加 `GOK_CHANNEL=stable`
- 自动部署建议关闭，改完稳定版后手动 Deploy latest commit

这样两个服务：

- 稳定版 → 稳定分支
- 抢先版 → preview 分支

---

## 5. 更新流程

### 平时加新卡/改机制

1. 在 `preview` 分支开发
2. 提交并推送
3. Render 抢先版自动部署
4. 自己先玩，收集问题
5. 修改 `announcements.json` 的 preview notes
6. 版本号变更后，玩家会看到抢先版公告

### 晋升到稳定版

1. 在 preview 验证完成
2. 把需要的内容合并到 main/stable
3. 跑测试
4. 手动部署稳定版
5. 更新 `announcements.json` 的 stable notes
6. 首页会显示稳定版更新公告

### 出问题回滚

Render → 稳定版服务 → Deploys → 找到上一个正常部署 → Redeploy。

稳定版不要自动部署 preview 分支。

---

## 6. 公告怎么写

编辑：

`public/announcements.json`

```json
{
  "stable": {
    "version": "20261020e21",
    "title": "稳定版",
    "notes": ["稳定版更新内容"],
    "knownIssues": []
  },
  "preview": {
    "version": "20261020e23",
    "title": "抢先版",
    "notes": ["新增 44 张卡牌", "新机制测试"],
    "knownIssues": ["新卡暂无专属卡图", "平衡仍在测试"]
  }
}
```

`version` 变化后，玩家下次进入会看到一次公告。  
同一个 version 不会反复弹。

---

## 7. 存档和联机

### 存档

两个 Render 域名不同，浏览器 localStorage 天然分开。  
代码又给 preview 加了 `gok_preview::` 前缀，双保险。

不要用同一个域名下的两个路径做稳定/抢先，因为 localStorage 会共享。

### 联机

两个 Render 服务是两台独立 Node 服务：

- 房间、匹配队列、在线对战天然分开
- 稳定版和抢先版不能互相匹配，这是正确行为

不要为了省钱让两个前端共用一个 Node 服务，除非之后专门做 channel 分房。

---

## 8. 最小验收清单

部署完抢先版后检查：

- [ ] 首页右上角显示“抢先版 PREVIEW”
- [ ] 第一次进入出现抢先版警告
- [ ] 点 badge 能重新打开公告
- [ ] 稳定版首页显示“稳定版 STABLE”
- [ ] 两个地址的存档互不影响
- [ ] 抢先版能创建组队码房间
- [ ] 抢先版在线对局能开始
- [ ] 点击“返回稳定版”能跳到稳定版地址
- [ ] 稳定版没有新卡实验内容

---

## 9. 最重要的一条

**稳定版分支不要自动部署 preview。**

稳定版只在你说“这版可以”时手动部署。  
抢先版坏了可以修，稳定版不要跟着一起坏。
