/* 双通道：稳定版 / 抢先版
 * stable  https://gok-vein-gambit.onrender.com/
 * preview https://gok-vein-gambit-preview.onrender.com/
 * 如果之后改了 Render 地址，改下面两个链接即可。
 */
(function () {
  const params = new URLSearchParams(location.search);
  const injected = window.__GOK_CHANNEL_VALUE__ || window.__GOK_CHANNEL__;
  const host = String(location.hostname || "").toLowerCase();
  const hostPreview = /(^|[.-])(preview|canary|staging)([.-]|$)/.test(host);
  let channel = hostPreview ? "preview" : "stable";
  if (injected === "preview" || injected === "stable") channel = injected;
  if (params.get("channel") === "preview" || params.get("preview") === "1") channel = "preview";
  if (params.get("channel") === "stable" || params.get("preview") === "0") channel = "stable";
  window.GOK_CHANNEL = channel;
  window.GOK_IS_PREVIEW = channel === "preview";
  window.GOK_CHANNEL_LINKS = {
    stable: "https://gok-vein-gambit.onrender.com/",
    preview: "https://gok-vein-gambit-preview.onrender.com/"
  };
  const own = document.currentScript && document.currentScript.src;
  const version = own && own.match(/[?&]v=([^&]+)/);
  window.GOK_BUILD = version ? version[1] : "dev";
  document.documentElement.dataset.channel = channel;

  // 同一域名下也隔离抢先版存档；两个 Render 域名则天然隔离。
  if (channel === "preview") {
    const prefix = "gok_preview::";
    window.GOK_STORAGE_PREFIX = prefix;
    try {
      for (const name of ["getItem", "setItem", "removeItem"]) {
        const original = Storage.prototype[name];
        Storage.prototype[name] = function (key, value) {
          if (typeof key === "string" && key.indexOf("gok_") === 0) key = prefix + key;
          return original.call(this, key, value);
        };
      }
    } catch (e) {}
  }
})();
