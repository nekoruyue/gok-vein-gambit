/* 《戈克世界：流脉牌局》剧情 CG 播放器
 * 全屏播放 assets/cinematics/ 下的过场视频，可点击/空格/Esc 跳过。
 * 播放失败、被浏览器拦截或超时都会自动放行，不阻塞游戏流程。
 */
(function (global) {
  "use strict";
  var BASE = "assets/cinematics/";
  var active = null;
  var styleInjected = false;

  function injectStyle() {
    if (styleInjected) return;
    styleInjected = true;
    var css = [
      ".cinema-overlay{position:fixed;inset:0;z-index:99990;background:#000;display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity .45s ease;cursor:pointer}",
      ".cinema-overlay.show{opacity:1}",
      ".cinema-overlay video{width:100%;height:100%;object-fit:contain;background:#000;pointer-events:none}",
      ".cinema-caption{position:absolute;left:0;right:0;bottom:9%;text-align:center;color:#e9f3f1;pointer-events:none;text-shadow:0 2px 18px rgba(0,0,0,.92);padding:0 8vw}",
      ".cinema-caption .eyebrow{font-size:12px;letter-spacing:.28em;color:#7fd3c8;margin-bottom:10px}",
      ".cinema-caption h2{margin:0;font-size:34px;letter-spacing:.08em;font-weight:600}",
      ".cinema-caption p{margin:10px auto 0;max-width:62ch;font-size:14px;line-height:1.75;color:#c8d6d3}",
      ".cinema-skip{position:absolute;right:26px;bottom:24px;background:rgba(10,18,17,.72);border:1px solid rgba(127,211,200,.45);color:#cfe9e4;padding:9px 16px;border-radius:999px;font-size:13px;letter-spacing:.1em;cursor:pointer;font-family:inherit}",
      ".cinema-skip:hover{border-color:#7fd3c8;color:#fff}",
      "body.cinema-open{overflow:hidden}"
    ].join("");
    var s = document.createElement("style");
    s.id = "cinema-style";
    s.textContent = css;
    document.head.appendChild(s);
  }

  function automationBlocked() {
    try {
      if (global.localStorage && localStorage.getItem("gok_cg_off") === "1") return true;
      // 自动化/无头环境默认跳过 CG，避免拖慢回归测试；需要验证时设置 gok_cg_force=1
      if (global.navigator && navigator.webdriver && localStorage.getItem("gok_cg_force") !== "1") return true;
    } catch (e) { /* 隐私模式 */ }
    return false;
  }

  function play(file, opts) {
    opts = opts || {};
    injectStyle();
    return new Promise(function (resolve) {
      if (!file || automationBlocked()) { resolve(false); return; }
      var overlay = document.createElement("div");
      overlay.className = "cinema-overlay";
      var video = document.createElement("video");
      video.src = BASE + file;
      video.muted = true;
      video.playsInline = true;
      video.autoplay = true;
      video.preload = "auto";
      overlay.appendChild(video);

      if (opts.eyebrow || opts.title || opts.text) {
        var cap = document.createElement("div");
        cap.className = "cinema-caption";
        if (opts.eyebrow) { var e = document.createElement("div"); e.className = "eyebrow"; e.textContent = opts.eyebrow; cap.appendChild(e); }
        if (opts.title) { var h = document.createElement("h2"); h.textContent = opts.title; cap.appendChild(h); }
        if (opts.text) { var p = document.createElement("p"); p.textContent = opts.text; cap.appendChild(p); }
        overlay.appendChild(cap);
      }
      var skip = document.createElement("button");
      skip.className = "cinema-skip";
      skip.type = "button";
      skip.textContent = "跳过 ▶";
      overlay.appendChild(skip);

      var done = false;
      var timer = null;
      function finish(ok) {
        if (done) return;
        done = true;
        if (timer) clearTimeout(timer);
        document.removeEventListener("keydown", onKey);
        overlay.classList.remove("show");
        document.body.classList.remove("cinema-open");
        setTimeout(function () {
          if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
          active = null;
          resolve(ok !== false);
        }, 460);
      }
      function onKey(ev) {
        if (ev.key === "Escape" || ev.key === " " || ev.key === "Enter") {
          ev.preventDefault();
          finish(true);
        }
      }
      overlay.addEventListener("click", function (ev) {
        if (ev.target === skip) return;
        finish(true);
      });
      skip.addEventListener("click", function (ev) { ev.stopPropagation(); finish(true); });
      video.addEventListener("ended", function () { finish(true); });
      video.addEventListener("error", function () { finish(false); });
      document.addEventListener("keydown", onKey);

      document.body.appendChild(overlay);
      document.body.classList.add("cinema-open");
      requestAnimationFrame(function () { overlay.classList.add("show"); });
      var p = video.play();
      if (p && typeof p.catch === "function") p.catch(function () { /* 等用户点击/超时 */ });
      timer = setTimeout(function () { finish(true); }, opts.timeout || 20000);
      active = { finish: finish };
    });
  }

  function playOnce(key, file, opts) {
    if (automationBlocked()) return Promise.resolve(false);
    try {
      if (global.localStorage && localStorage.getItem("gok_cg_" + key) === "1") return Promise.resolve(false);
      localStorage.setItem("gok_cg_" + key, "1");
    } catch (e) { /* 隐私模式忽略 */ }
    return play(file, opts);
  }

  function stop() {
    if (active) active.finish(true);
  }

  global.GokCinema = { play: play, playOnce: playOnce, stop: stop };
})(typeof globalThis !== "undefined" ? globalThis : this);
