/*
 * Rascal Pages Overlay -snippet.
 *
 * Asennus asiakkaan sivun <head>-osioon mahdollisimman ylös:
 *   <script src="https://app.rascalpages.fi/overlay/o.js" data-site="SIVUSTON_ID"></script>
 *
 * Hakee kävijälle kohdennetun variantin (utm_campaign / utm_content / rp) ja
 * korvaa sisällön. Editorin esikatselussa (data-rp-preview) vain paljastaa
 * apply-funktion eikä hae mitään.
 */
(function () {
  "use strict";

  var MATCH_KEYS = ["utm_campaign", "utm_content", "rp"];
  var STORAGE_KEY = "rp_overlay_params";
  var HIDE_TIMEOUT_MS = 800;
  var OBSERVE_MS = 15000;

  function normalize(value) {
    return (value || "").replace(/\s+/g, " ").trim();
  }

  function fingerprint(el, type) {
    if (type === "image") return el.getAttribute("src") || "";
    if (type === "link") return el.getAttribute("href") || "";
    // Piilotettavan säiliön teksti voi muuttua muiden muutosten myötä.
    if (type === "hide") return el.tagName.toLowerCase();
    return normalize(el.textContent);
  }

  function applyOne(doc, change) {
    var el;
    try {
      el = doc.querySelector(change.selector);
    } catch {
      return false;
    }
    if (!el) return false;

    var applied = el.getAttribute("data-rp-change") === change.id;
    if (!applied && fingerprint(el, change.type) !== change.original) {
      // Sivu on muuttunut — ei korvata väärää elementtiä.
      return false;
    }

    if (change.type === "text") {
      if (el.textContent !== change.value) el.textContent = change.value;
    } else if (change.type === "image") {
      if (el.getAttribute("src") !== change.value) {
        el.setAttribute("src", change.value);
        el.removeAttribute("srcset");
      }
    } else if (change.type === "link") {
      if (el.getAttribute("href") !== change.value) el.setAttribute("href", change.value);
    } else if (change.type === "hide") {
      el.style.setProperty("display", "none", "important");
    }
    el.setAttribute("data-rp-change", change.id);
    return true;
  }

  function apply(changes, doc) {
    doc = doc || document;
    var count = 0;
    for (var i = 0; i < changes.length; i++) {
      if (applyOne(doc, changes[i])) count++;
    }
    return count;
  }

  window.__rpOverlay = { apply: apply, normalize: normalize };

  var script = document.currentScript;
  if (!script || script.hasAttribute("data-rp-preview")) return;

  var siteId = script.getAttribute("data-site");
  if (!siteId) return;

  // Kohdennusparametrit: URL:sta, tai session aikana aiemmin tallennetut,
  // jotta variantti säilyy sivulta toiselle siirryttäessä.
  var query = new URLSearchParams(window.location.search);
  var params = {};
  var fromUrl = false;
  MATCH_KEYS.forEach(function (key) {
    var value = query.get(key);
    if (value) {
      params[key] = value;
      fromUrl = true;
    }
  });
  try {
    if (fromUrl) sessionStorage.setItem(STORAGE_KEY, JSON.stringify(params));
    else params = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || "{}") || {};
  } catch {
    // sessionStorage ei käytettävissä — jatketaan URL:n parametreilla.
  }
  var targeted = Object.keys(params).length > 0;

  // Anti-flicker vain kohdennetuille kävijöille, ja aina aikakatkaisulla.
  var root = document.documentElement;
  var style;
  function reveal() {
    if (style && style.parentNode) style.parentNode.removeChild(style);
  }
  if (targeted) {
    style = document.createElement("style");
    style.textContent = "body{opacity:0!important}";
    (document.head || root).appendChild(style);
    setTimeout(reveal, HIDE_TIMEOUT_MS);
  }

  var url = new URL("/api/overlay/config", script.src);
  url.searchParams.set("s", siteId);
  url.searchParams.set("u", window.location.origin + window.location.pathname);
  Object.keys(params).forEach(function (key) {
    url.searchParams.set(key, params[key]);
  });

  function whenReady(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn);
    } else {
      fn();
    }
  }

  fetch(url.toString(), { credentials: "omit" })
    .then(function (res) {
      return res.ok ? res.json() : { changes: [] };
    })
    .then(function (data) {
      var changes = (data && data.changes) || [];
      whenReady(function () {
        apply(changes);
        reveal();
        if (!changes.length || !window.MutationObserver) return;

        // SPA-kehykset voivat hydraation yhteydessä palauttaa alkuperäisen
        // sisällön — ajetaan korvaukset uudelleen hetken ajan.
        var scheduled = false;
        var observer = new MutationObserver(function () {
          if (scheduled) return;
          scheduled = true;
          requestAnimationFrame(function () {
            scheduled = false;
            apply(changes);
          });
        });
        observer.observe(document.body, {
          childList: true,
          subtree: true,
          characterData: true,
        });
        setTimeout(function () {
          observer.disconnect();
        }, OBSERVE_MS);
      });
    })
    .catch(reveal);
})();
