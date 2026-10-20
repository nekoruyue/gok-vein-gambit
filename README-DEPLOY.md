# 戈克世界：流脉牌局 · 永久在线版部署指南

当前构建：**20261020e21** · 六阵营（普卫岛 / 学院 / 西昭 / 共和国 / 帝国 / 灰港同盟）· 242 个可收藏条目。

部署后可用 `/card-lab.html` 打开逐卡效果测试台；`/cheat.html` 打开沙盒对局作弊台。

这个目录可以部署到公网，包含：

- public/：游戏页面、卡图、音频
- server/server.js：Node 服务器，静态页面和在线房间消息转发
- package.json：启动配置
- render.yaml：Render 一键部署配置

不需要域名也能先得到一个固定网址，例如：

    https://gok-vein-gambit.onrender.com

---

## 推荐路线：GitHub + Render

整体流程：

    GitHub 存代码  →  Render 运行 Node 服务  →  固定 HTTPS 网址

不需要买服务器，不需要会 Linux。

### 费用

免费档：
- 有固定网址；
- 自动 HTTPS；
- 15 分钟没人访问会休眠；
- 休眠后第一次打开要等约 30–60 秒。

Starter 档：
- 约 7 美元/月起（以 Render 实际价格为准）；
- 不休眠，点开就进；
- 适合稳定发给朋友玩。

先用免费档验证，确认后再升级。

---

## 第一步：注册 GitHub

地址：

    https://github.com

注册并登录。 GitHub 打不开的话需要先解决网络访问。

---

## 第二步：上传项目到 GitHub

不要上传 148MB 的压缩包，上传本目录的解压内容：

- public/
- server/
- package.json
- render.yaml
- .gitignore

推荐使用 GitHub Desktop：

1. 下载 https://desktop.github.com/
2. 登录 GitHub；
3. File → New repository；
4. 名称填 gok-vein-gambit；
5. 创建一个空文件夹作为本地仓库；
6. 把本目录里的 public、server、package.json、render.yaml、.gitignore 复制进去；
7. 在 GitHub Desktop 写提交信息 first deploy；
8. Commit to main；
9. Publish repository。

如果你不想公开源码，可以选择 Private；Render 仍可部署私有仓库。

---

## 第三步：注册 Render

地址：

    https://render.com

用 GitHub 账号登录。

---

## 第四步：一键部署

1. 登录 Render；
2. 点 New +；
3. 选择 Blueprint；
4. 选择 gok-vein-gambit 仓库；
5. Render 自动读取根目录的 render.yaml；
6. 服务名可以保持 gok-vein-gambit，被占用就换一个；
7. 地区选 Singapore；如果报错就选 Oregon；
8. 点 Apply / Create；
9. 等待部署完成。

完成后会得到固定地址：

    https://你的服务名.onrender.com

实际地址以 Render 页面显示为准。

---

## 如果 Blueprint 失败：手动建 Web Service

Render → New + → Web Service：

- Repository：gok-vein-gambit
- Runtime：Node
- Region：Singapore
- Root Directory：留空
- Build Command：npm install
- Start Command：node server/server.js
- Health Check Path：/api/health
- Instance Type：Free

Environment 添加：

    TRIAL_KEEPALIVE = 1
    NODE_VERSION = 20

然后点 Create Web Service。

这些配置已经在 render.yaml 里写好，正常不需要手动填。

---

## 第五步：测试

打开 Render 地址：

1. 首页能打开；
2. 点「开始推演」能进入单人局；
3. 点「在线房间」→「创建房间」；
4. 页面生成 6 位房间码；
5. 复制邀请链接；
6. 用另一台设备打开邀请链接；
7. 选阵营、准备；
8. 房主开始对局。

如果创建房间 404，说明服务器没启动或不是最新版本。检查 Render Logs，确认启动命令。

---

## 第六步：绑定自己的域名（可选）

不做也能玩，只是地址是 onrender.com。

以后想更正式：

1. 在 Cloudflare Registrar / Namecheap 买域名；
2. Render → Settings → Custom Domains；
3. 添加 game.你的域名.com；
4. Render 给你一条 CNAME；
5. 到域名 DNS 添加 CNAME；
6. 等待 HTTPS 签发。

域名不是必需的。

---

## 免费档的真实限制

- 地址永久，但服务会休眠；
- 冷启动 30–60 秒；
- 房间数据在服务器内存，Render 重启后房间消失；
- 多人同时在线时，免费实例资源有限；
- 单人模式不需要房间，资源加载完可以玩；
- 在线房间需要服务器醒着。

想要永远即时在线，升级 Starter，或换 Railway / Fly / VPS。

---

## 以后更新游戏

拿到新版本后：

1. 用新的 public/ 和 server/ 替换本地文件；
2. GitHub Desktop 里 Commit；
3. Push；
4. Render 自动重新部署。

不需要重新配置。

---

## 方案对比

| 方案 | 固定网址 | 在线房间 | 费用 |
|---|---|---|---|
| Render 免费 | 是 | 会休眠 | 0 |
| Render Starter | 是 | 是 | 约 $7/月 |
| Railway | 是 | 是 | 约 $5/月起 |
| Cloudflare Pages | 是 | 否，只能单机 | 0 |
| 自己的 VPS | 是 | 是 | 约 ¥30–60/月 |

---

## 常见问题

Q：页面 502 / 第一次很慢？  
A：免费档在冷启动，等 30–60 秒再刷新。

Q：创建房间 404？  
A：服务器没有部署成功，或者部署了旧版本。检查 Render Logs 和 Start Command。

Q：图片不显示？  
A：确认仓库里有 public/assets/generated/。

Q：房间过一段时间消失？  
A：Render 免费档休眠/重启会清空内存中的房间，重新创建即可。

Q：搜索引擎能搜到吗？  
A：不能。固定地址只能分享；正式收录需要自己的域名和后续 SEO。

Q：能不能只放 Cloudflare Pages？  
A：只能单机。在线房间必须有 Node 服务。

---

## 你需要准备

只需要：

1. GitHub 账号；
2. Render 账号（可以用 GitHub 登录）。

不用域名，不用买服务器。部署完把 Render 地址发给我，我继续帮你检查在线房间和排位。














