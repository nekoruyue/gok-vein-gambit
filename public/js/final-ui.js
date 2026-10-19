/* Final battle UI overrides. Loaded after ui.js so card readability survives later style/UI passes. */
(function () {
  "use strict";
  const set = (el, prop, value) => { if (el) el.style.setProperty(prop, value, "important"); };
  const screenIsGame = () => document.body && document.body.dataset.screen === "game";

  function enforceSkill(hero) {
    const info = hero.querySelector(".hero-info");
    if (!info) return;
    const skill = hero.querySelector(".hero-skill-inline");
    const deck = hero.querySelector(".hero-deck");
    if (skill && deck && skill.previousElementSibling !== deck) deck.insertAdjacentElement("afterend", skill);
    if (skill) {
      set(skill, "min-height", "56px");
      set(skill, "margin-top", "6px");
      set(skill, "padding", "7px 10px");
      set(skill, "gap", "9px");
    }
  }

  function enforceHandCard(card) {
    const minion = card.classList.contains("type-minion");
    const text = card.querySelector(".card-text");
    const type = card.querySelector(".card-type");
    if (text) set(text, "display", "none");
    if (type) set(type, "display", "none");
    const art = card.querySelector(".card-art");
    if (art) set(art, "inset", minion ? "0 0 54px 0" : "0 0 37px 0");
    const name = card.querySelector(".card-name");
    if (name) {
      set(name, "font-size", "16px");
      set(name, "bottom", minion ? "32px" : "9px");
      set(name, "min-height", "24px");
      set(name, "display", "flex");
      set(name, "align-items", "center");
      set(name, "justify-content", "center");
    }
    const stats = card.querySelector(".card-stats");
    if (stats) {
      set(stats, "left", "5px"); set(stats, "right", "5px");
      set(stats, "bottom", "2px"); set(stats, "justify-content", "space-between");
    }
    card.querySelectorAll(".card-stat").forEach((s) => {
      set(s, "width", "30px"); set(s, "height", "30px"); set(s, "font-size", "14px");
    });
    const cost = card.querySelector(".card-cost");
    if (cost) { set(cost, "top", "5px"); set(cost, "left", "5px"); set(cost, "width", "30px"); set(cost, "height", "30px"); set(cost, "font-size", "15px"); }
    card.querySelectorAll(".card-tags, .hand-tags, .effect-flags").forEach((tags) => {
      set(tags, "display", "flex"); set(tags, "flex-wrap", "wrap"); set(tags, "z-index", "7");
    });
    card.querySelectorAll(".keyword-tag").forEach((tag) => { set(tag, "font-size", "8px"); set(tag, "padding", "3px 5px"); });
  }

  function enforceBoardCard(card) {
    const type = card.querySelector(".card-type-badge");
    if (type) set(type, "display", "none");
    const art = card.querySelector(".card-art");
    if (art) set(art, "inset", "0 0 34px 0");
    const name = card.querySelector(".card-name");
    if (name) { set(name, "font-size", "12px"); set(name, "bottom", "30px"); }
    const stats = card.querySelector(".card-stats");
    if (stats) { set(stats, "left", "4px"); set(stats, "right", "4px"); set(stats, "bottom", "2px"); set(stats, "justify-content", "space-between"); }
    card.querySelectorAll(".card-stat").forEach((s) => { set(s, "width", "26px"); set(s, "height", "26px"); set(s, "font-size", "12px"); });
    const cost = card.querySelector(".card-cost");
    if (cost) { set(cost, "top", "3px"); set(cost, "left", "3px"); set(cost, "width", "25px"); set(cost, "height", "25px"); set(cost, "font-size", "13px"); }
    const tags = card.querySelector(".card-tags");
    if (tags) {
      set(tags, "top", "27px"); set(tags, "left", "3px"); set(tags, "right", "3px");
      set(tags, "transform", "none"); set(tags, "flex-wrap", "wrap");
    }
    const status = card.querySelector(".attack-status");
    if (status) { set(status, "top", "3px"); set(status, "left", "50%"); set(status, "right", "auto"); set(status, "transform", "translateX(-50%)"); }
  }

  function enforceMana() {
    const box = document.querySelector(".mana-display.mana-hud");
    if (!box) return;
    set(box, "min-width", "250px"); set(box, "min-height", "64px");
    set(box, "display", "flex"); set(box, "flex-direction", "column");
    set(box, "align-items", "stretch"); set(box, "gap", "6px");
    set(box, "padding", "8px 12px 7px");
    set(box, "border", "1px solid rgba(125,224,206,.32)");
    set(box, "background", "linear-gradient(135deg,rgba(12,39,40,.98),rgba(4,18,21,.99))");
    const current = box.querySelector(".mana-current");
    if (current) { set(current, "font-size", "34px"); set(current, "color", "#ffe3a5"); }
  }

  function enforce() {
    if (!screenIsGame()) return;
    document.querySelectorAll(".hand-card").forEach(enforceHandCard);
    document.querySelectorAll(".board-card").forEach(enforceBoardCard);
    document.querySelectorAll("#player-hero, #opponent-hero").forEach(enforceSkill);
    enforceMana();
  }

  let scheduled = false;
  function schedule() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => { scheduled = false; enforce(); });
  }

  // Delegated skill feedback: works even if later CSS changes.
  document.addEventListener("mouseover", (ev) => {
    const skill = ev.target.closest && ev.target.closest(".hero-skill-inline");
    if (!skill || skill.disabled) return;
    set(skill, "transform", "translateY(-1px)");
    set(skill, "filter", "brightness(1.16)");
    set(skill, "border-color", "rgba(247,216,143,.92)");
    set(skill, "box-shadow", "0 0 0 1px rgba(247,216,143,.22),0 0 26px rgba(242,198,109,.34),inset 0 0 18px rgba(242,198,109,.1)");
  }, true);
  document.addEventListener("mouseout", (ev) => {
    const skill = ev.target.closest && ev.target.closest(".hero-skill-inline");
    if (!skill) return;
    if (ev.relatedTarget && skill.contains(ev.relatedTarget)) return;
    set(skill, "transform", "translateY(0)");
    set(skill, "filter", "brightness(1)");
    set(skill, "border-color", "");
    set(skill, "box-shadow", "");
  }, true);
  document.addEventListener("pointerdown", (ev) => {
    const skill = ev.target.closest && ev.target.closest(".hero-skill-inline");
    if (!skill || skill.disabled) return;
    set(skill, "transform", "translateY(1px) scale(.985)");
    set(skill, "filter", "brightness(.9)");
    set(skill, "box-shadow", "inset 0 2px 14px rgba(0,0,0,.6)");
  }, true);
  document.addEventListener("pointerup", (ev) => {
    const skill = ev.target.closest && ev.target.closest(".hero-skill-inline");
    if (!skill || skill.disabled) return;
    set(skill, "transform", "translateY(-1px)");
  }, true);

  new MutationObserver(schedule).observe(document.documentElement, { childList: true, subtree: true });
  document.addEventListener("DOMContentLoaded", enforce);
  setTimeout(enforce, 600);
  window.addEventListener("resize", schedule);
  window.GokFinalUI = { enforce: enforce };
})();
