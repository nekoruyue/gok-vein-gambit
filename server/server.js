/* 《戈克世界：流脉牌局》局域网中继服务器
 * 仅使用 Node 标准库：静态文件 + 双人 HTTP 长轮询。
 * 房主浏览器是权威端；服务器只负责转发消息与提供页面。
 */
const http = require("http");
const fs = require("fs");
const path = require("path");
const os = require("os");
const { URL } = require("url");

const PORT = Number(process.env.PORT || 4173);
const PUBLIC = path.join(__dirname, "..", "public");
const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".webp": "image/webp",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".ico": "image/x-icon",
  ".ogg": "audio/ogg",
  ".wav": "audio/wav",
  ".mp3": "audio/mpeg",
  ".svg": "image/svg+xml"
};

const MAX_MESSAGES = 600;
const rooms = new Map();

function newRoom() {
  return { seq: 0, messages: [], lastSeen: { 0: 0, 1: 0 }, guestDecks: null, guestFaction: null, guestReady: false, ranked: false, createdAt: Date.now() };
}

function getRoom(id, create) {
  const key = String(id || "lan").toLowerCase();
  if (!rooms.has(key) && create) rooms.set(key, newRoom());
  return rooms.get(key) || null;
}

function roomFromRequest(u, create) {
  const id = String(u.searchParams.get("room") || "lan").toLowerCase();
  if (!/^[a-z0-9]{3,16}$/.test(id)) return null;
  return { id, room: getRoom(id, create) };
}

function touch(room, player) {
  if (room && (player === 0 || player === 1)) room.lastSeen[player] = Date.now();
}

function lanAddresses() {
  const nets = os.networkInterfaces();
  const candidates = [];
  for (const name of Object.keys(nets)) {
    for (const net of nets[name] || []) {
      if (net.family !== "IPv4" || net.internal) continue;
      let score = 1;
      const n = String(name).toLowerCase();
      if (net.address.indexOf("169.254.") === 0) score = 0;
      else if (n.indexOf("radmin") >= 0 || n.indexOf("zerotier") >= 0) score = 6;
      else if (n.indexOf("vpn") >= 0) score = 5;
      else if (net.address.indexOf("192.168.") === 0) score = 4;
      else if (net.address.indexOf("10.") === 0) score = 3;
      else if (/^172.(1[6-9]|2[0-9]|3[0-1])./.test(net.address)) score = 2;
      candidates.push({ address: net.address, score, name });
    }
  }
  candidates.sort((a, b) => b.score - a.score);
  return candidates;
}

function lanIp() {
  const a = lanAddresses();
  return a.length ? a[0].address : "127.0.0.1";
}

function json(res, code, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(code, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "Access-Control-Allow-Origin": "*"
  });
  res.end(body);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => {
      data += chunk;
      if (data.length > 2_000_000) { reject(new Error("body too large")); req.destroy(); }
    });
    req.on("end", () => resolve(data));
    req.on("error", reject);
  });
}



function serveStatic(req, res, pathname) {
  let rel = decodeURIComponent(pathname);
  if (rel === "/" || rel === "") rel = "/index.html";
  const file = path.normalize(path.join(PUBLIC, rel));
  if (!file.startsWith(PUBLIC)) { res.writeHead(403); res.end("forbidden"); return; }
  fs.stat(file, (err, st) => {
    if (err || !st.isFile()) { res.writeHead(404); res.end("not found"); return; }
    const ext = path.extname(file).toLowerCase();
    res.writeHead(200, {
      "Content-Type": MIME[ext] || "application/octet-stream",
      "Cache-Control": ext === ".html" || ext === ".js" || ext === ".css" ? "no-cache" : "public, max-age=3600"
    });
    fs.createReadStream(file).pipe(res);
  });
}

const server = http.createServer(async (req, res) => {
  const u = new URL(req.url, "http://localhost");
  const p = u.pathname;
  try {
    if (p === "/api/health") {
      json(res, 200, { ok: true, service: "gok-vein-gambit", time: Date.now(), rooms: rooms.size });
      return;
    }
    if (p === "/api/room/create" && req.method === "POST") {
      let code = "";
      for (let i = 0; i < 20; i++) {
        code = Math.random().toString(36).slice(2, 8).toLowerCase();
        if (code.length === 6 && !rooms.has(code)) break;
      }
      if (!code || rooms.has(code)) { json(res, 500, { ok: false, error: "无法创建房间" }); return; }
      rooms.set(code, newRoom());
      json(res, 200, { ok: true, code });
      return;
    }
    if (p === "/api/room/mode" && req.method === "POST") {
      const raw = await readBody(req);
      let body = {};
      try { body = JSON.parse(raw); } catch (e) { body = {}; }
      const rrMode = roomFromRequest(u, false);
      if (!rrMode) { json(res, 404, { ok: false, error: "房间不存在" }); return; }
      rrMode.room.ranked = !!body.ranked;
      rrMode.room.guestReady = false;
      rrMode.room.seq = 0;
      rrMode.room.messages.length = 0;
      json(res, 200, { ok: true, ranked: rrMode.room.ranked });
      return;
    }
    const requestedRoom = u.searchParams.get("room") || "lan";
    const rr = roomFromRequest(u, requestedRoom === "lan");
    if (p.startsWith("/api/") && p !== "/api/room/create" && !rr) {
      json(res, requestedRoom === "lan" ? 500 : 404, { ok: false, error: "房间不存在或已过期" });
      return;
    }
    if (p === "/api/status") {
      const room = rr.room;
      json(res, 200, {
        ok: true,
        room: rr.id,
        port: PORT,
        ip: lanIp(),
        addresses: lanAddresses().map((x) => ({ address: x.address, name: x.name })),
        now: Date.now(),
        hostOnline: Date.now() - room.lastSeen[0] < 6000,
        guestOnline: Date.now() - room.lastSeen[1] < 6000,
        guestDecksReady: !!room.guestDecks,
        guestDecks: room.guestDecks,
        guestFaction: room.guestFaction,
        guestReady: room.guestReady,
        ranked: !!room.ranked,
        seq: room.seq
      });
      return;
    }
    if (p === "/api/hello") {
      const player = Number(u.searchParams.get("player"));
      touch(rr.room, player);
      json(res, 200, { ok: true, player, room: rr.id, ip: lanIp(), port: PORT });
      return;
    }
    if (p.startsWith("/api/art/")) {
      const id = p.slice("/api/art/".length).replace(/\.\./g, "");
      if (!/^[a-z0-9_]+$/.test(id)) { json(res, 400, { ok: false, error: "bad art id" }); return; }
      const candidates = [id + ".webp", id + ".png", id + ".jpg", id + ".jpeg", id + ".svg", "placeholder.svg"];
      let file = null;
      for (const name of candidates) {
        const f = path.join(PUBLIC, "assets", "generated", name);
        if (fs.existsSync(f)) { file = f; break; }
      }
      if (!file) { res.writeHead(404); res.end("not found"); return; }
      const ext = path.extname(file).toLowerCase();
      res.writeHead(200, { "Content-Type": MIME[ext] || "application/octet-stream", "Cache-Control": "no-store" });
      fs.createReadStream(file).pipe(res);
      return;
    }
    if (p === "/api/join" && req.method === "POST") {
      const player = Number(u.searchParams.get("player"));
      if (player !== 1) { json(res, 400, { ok: false, error: "only guest" }); return; }
      const room = rr.room;
      touch(room, player);
      const raw = await readBody(req);
      let payload;
      try { payload = JSON.parse(raw); } catch (e) { payload = {}; }
      room.guestDecks = payload && payload.decks && typeof payload.decks === "object" ? payload.decks : {};
      room.guestFaction = payload && typeof payload.faction === "string" && /^[a-z_]+$/.test(payload.faction) ? payload.faction : null;
      room.guestReady = true;
      room.messages.length = 0;
      room.seq = 0;
      json(res, 200, { ok: true, ready: true, faction: room.guestFaction });
      return;
    }
    if (p === "/api/send" && req.method === "POST") {
      const player = Number(u.searchParams.get("player"));
      if (player !== 0 && player !== 1) { json(res, 400, { ok: false, error: "bad player" }); return; }
      const room = rr.room;
      touch(room, player);
      const raw = await readBody(req);
      let payload;
      try { payload = JSON.parse(raw); } catch (e) { json(res, 400, { ok: false, error: "bad json" }); return; }
      room.messages.push({ seq: ++room.seq, from: player, payload, at: Date.now() });
      if (room.messages.length > MAX_MESSAGES) room.messages.splice(0, room.messages.length - MAX_MESSAGES);
      json(res, 200, { ok: true, seq: room.seq });
      return;
    }
    if (p === "/api/poll") {
      const player = Number(u.searchParams.get("player"));
      if (player !== 0 && player !== 1) { json(res, 400, { ok: false, error: "bad player" }); return; }
      const room = rr.room;
      touch(room, player);
      const since = Number(u.searchParams.get("since") || 0);
      const out = room.messages.filter((m) => m.seq > since && m.from !== player).map((m) => ({ seq: m.seq, from: m.from, payload: m.payload }));
      json(res, 200, { ok: true, seq: room.seq, messages: out });
      return;
    }
    if (p === "/api/reset" && req.method === "POST") {
      const room = rr.room;
      room.messages.length = 0;
      room.guestDecks = null;
      room.guestFaction = null;
      room.guestReady = false;
      room.seq = 0;
      json(res, 200, { ok: true });
      return;
    }
    if (p === "/api/shutdown" && req.method === "POST") {
      json(res, 200, { ok: true });
      setTimeout(() => process.exit(0), 200);
      return;
    }
    if (p.startsWith("/api/")) { json(res, 404, { ok: false }); return; }
    serveStatic(req, res, p);
  } catch (e) {
    json(res, 500, { ok: false, error: String(e.message || e) });
  }
});

server.listen(PORT, "0.0.0.0", () => {
  console.log("Gok Vein Gambit LAN server");
  console.log("http://" + lanIp() + ":" + PORT + "/");
});

// 没有任何客户端活跃 10 分钟后自动退出，避免留下后台进程。
setInterval(() => {
  if (process.env.TRIAL_KEEPALIVE === "1") return;
  const now = Date.now();
  const active = Array.from(rooms.values()).some((r) => now - r.lastSeen[0] < 10 * 60 * 1000 || now - r.lastSeen[1] < 10 * 60 * 1000);
  if (!active) process.exit(0);
}, 60 * 1000);
