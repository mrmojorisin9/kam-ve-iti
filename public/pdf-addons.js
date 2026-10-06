/*
 * Kam denes — dodaci za samostalnu /pdf stranicu (public/pdf.html).
 *
 * pdf.html nije dio App Routera pa ne dobiva root layout (PageViewTracker,
 * SponsorWidget). Ova skripta to nadoknađuje:
 *   1. bilježi anonimni pregled stranice (POST /api/page-view, ADR-023)
 *   2. prikazuje generalnog sponzora (GET /api/sponsor) — vanilla JS kopija
 *      ponašanja src/components/SponsorWidget.tsx: splash po admin postavci
 *      učestalosti → skupljeni pomični logo u kutu → modal s ponudom.
 *      localStorage/sessionStorage ključevi su ISTI kao na portalu
 *      (src/lib/sponsor-frequency.ts), pa se splash broji zajedno s portalom.
 *
 * Ako se pdf.html zamijeni novom verzijom, u <head> mora ostati:
 *   <script src="/pdf-addons.js" defer></script>
 * Ako se mijenja SponsorWidget.tsx/sponsor-frequency.ts, uskladiti i ovo.
 */
(function () {
  "use strict";

  var PATH = "/pdf";

  try {
    fetch("/api/page-view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: PATH }),
      keepalive: true,
    }).catch(function () {});
  } catch (e) {
    // best effort — brojač ne smije ometati alat
  }

  fetch("/api/sponsor", { cache: "no-store" })
    .then(function (r) {
      return r.ok ? r.json() : null;
    })
    .then(function (sponsor) {
      if (sponsor) mountSponsor(sponsor);
    })
    .catch(function () {});

  // ---------------------------------------------------------------- frekvencija
  var STORAGE_KEY = "kd_sponsor_splash_shown_at";
  var SESSION_KEY = "kd_sponsor_splash_shown_session";
  var DAY_MS = 24 * 60 * 60 * 1000;
  var LIMITS = { once_per_day: 1, three_per_day: 3 };

  function recentTimestamps() {
    var raw = localStorage.getItem(STORAGE_KEY);
    var list = raw ? JSON.parse(raw) : [];
    var now = Date.now();
    return list.filter(function (t) {
      return now - t < DAY_MS;
    });
  }

  function shouldPlaySplash(frequency) {
    try {
      if (frequency === "every_session") {
        return sessionStorage.getItem(SESSION_KEY) === null;
      }
      return recentTimestamps().length < LIMITS[frequency];
    } catch (e) {
      return false;
    }
  }

  function recordSplashPlayed(frequency) {
    try {
      if (frequency === "every_session") {
        sessionStorage.setItem(SESSION_KEY, "1");
        return;
      }
      var recent = recentTimestamps();
      recent.push(Date.now());
      localStorage.setItem(STORAGE_KEY, JSON.stringify(recent));
    } catch (e) {
      // storage nedostupan — tiho ignorirano, isto kao na portalu
    }
  }

  // ---------------------------------------------------------------- widget
  var HOLD_MS = 2000;
  var TRANSITION_MS = 700;
  var SIZE = 48;
  var SPLASH_SIZE = 112;
  var MARGIN = 12;
  var DRAG_THRESHOLD = 6;
  var POS_STORAGE_KEY = "kd_sponsor_widget_pos";

  var CSS =
    ".kdsp-overlay{position:fixed;inset:0;z-index:2147483000;background:rgba(255,255,255,.5);transition:opacity .7s}" +
    ".kdsp-skip{position:fixed;top:16px;right:16px;z-index:2147483002;border:1px solid rgba(30,43,34,.3);background:rgba(255,255,255,.7);color:#1e2b22;border-radius:9999px;padding:6px 12px;font:500 12px/1.2 system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;cursor:pointer;transition:opacity .7s}" +
    ".kdsp-skip:hover{background:rgba(30,43,34,.1)}" +
    ".kdsp-label{position:fixed;left:50%;top:calc(50% - 3.5rem);z-index:2147483001;transform:translateX(-50%);margin:0;color:#1e2b22;font:700 12px/1 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;letter-spacing:.2em;text-transform:uppercase;text-shadow:0 1px 3px rgba(0,0,0,.35);opacity:.9;transition:opacity .7s;animation:kdsp-fade .4s ease-out both}" +
    "@keyframes kdsp-fade{from{opacity:0;transform:translate(-50%,4px)}to{opacity:.9;transform:translate(-50%,0)}}" +
    ".kdsp-logo{position:fixed;z-index:2147483001;display:flex;align-items:center;justify-content:center;padding:0;border-radius:9999px;border:1px solid transparent;background:transparent;touch-action:none;user-select:none;-webkit-user-select:none;transform:translate(-50%,-50%) scale(0);opacity:0}" +
    ".kdsp-logo.kdsp-anim{transition:all .7s ease-in-out}" +
    ".kdsp-logo.kdsp-shown{transform:translate(-50%,-50%) scale(1);opacity:1}" +
    ".kdsp-logo.kdsp-settled{border-color:#3c4a38;background:#332a1e;box-shadow:0 10px 15px -3px rgba(0,0,0,.2),0 4px 6px -4px rgba(0,0,0,.2)}" +
    ".kdsp-logo.kdsp-ready{cursor:grab}.kdsp-logo.kdsp-ready:active{cursor:grabbing}" +
    ".kdsp-logo:focus-visible,.kdsp-skip:focus-visible,.kdsp-modal button:focus-visible,.kdsp-modal a:focus-visible{outline:2px solid #d4a94a;outline-offset:2px}" +
    ".kdsp-logo img{width:100%;height:100%;border-radius:9999px;background:#fff;object-fit:contain;padding:8px;box-sizing:border-box;pointer-events:none}" +
    ".kdsp-badge{position:absolute;top:-8px;right:-8px;display:none;border-radius:9999px;background:rgba(30,43,34,.7);color:#a9ac9a;padding:2px 6px;font:9px/1.2 system-ui,sans-serif;letter-spacing:.025em;pointer-events:none}" +
    "@media (min-width:640px){.kdsp-ready .kdsp-badge{display:block}}" +
    "@media (prefers-reduced-motion:no-preference){.kdsp-pulse{animation:kdsp-pulse 3s ease-in-out infinite}}" +
    "@keyframes kdsp-pulse{0%,100%{box-shadow:0 0 0 0 rgba(212,169,74,.45)}50%{box-shadow:0 0 0 10px rgba(212,169,74,0)}}" +
    ".kdsp-backdrop{position:fixed;inset:0;z-index:2147483001;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.7);padding:16px;box-sizing:border-box}" +
    ".kdsp-modal{position:relative;width:100%;max-width:24rem;box-sizing:border-box;border:1px solid #3c4a38;background:#332a1e;color:#f2e8d5;border-radius:8px;padding:24px;box-shadow:0 20px 25px -5px rgba(0,0,0,.3);font:14px/1.45 system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;text-align:left}" +
    ".kdsp-close{position:absolute;top:12px;right:12px;border:0;background:none;color:#a9ac9a;font-size:14px;cursor:pointer;padding:0}" +
    ".kdsp-close:hover{color:#f2e8d5}" +
    ".kdsp-ad{color:#a9ac9a;font-size:10px;letter-spacing:.2em;text-transform:uppercase}" +
    ".kdsp-head{margin-top:12px;display:flex;align-items:center;gap:12px}" +
    ".kdsp-head img{width:48px;height:48px;border-radius:6px;background:#fff;object-fit:contain;padding:4px;box-sizing:border-box}" +
    ".kdsp-head h2{margin:0;color:#f2e8d5;font-size:18px;font-weight:600}" +
    ".kdsp-promo{margin:12px 0 0;color:#a9ac9a;font-size:14px}" +
    ".kdsp-visit{margin-top:16px;display:inline-flex;border:1px solid #d4a94a;color:#d4a94a;border-radius:6px;padding:8px 16px;font-size:14px;font-weight:500;text-decoration:none}" +
    ".kdsp-visit:hover{background:#d4a94a;color:#1e2b22}";

  function el(tag, cls, text) {
    var node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text) node.textContent = text;
    return node;
  }

  function clampToViewport(p) {
    var half = SIZE / 2;
    return {
      x: Math.min(Math.max(p.x, half), window.innerWidth - half),
      y: Math.min(Math.max(p.y, half), window.innerHeight - half),
    };
  }

  function resolveCollapsedPos() {
    var saved = null;
    try {
      var parsed = JSON.parse(localStorage.getItem(POS_STORAGE_KEY));
      if (parsed && typeof parsed.x === "number" && typeof parsed.y === "number") {
        saved = parsed;
      }
    } catch (e) {
      saved = null;
    }
    var half = SIZE / 2;
    return clampToViewport(
      saved || { x: MARGIN + half, y: window.innerHeight - MARGIN - half },
    );
  }

  function mountSponsor(sponsor) {
    var style = el("style");
    style.textContent = CSS;
    document.head.appendChild(style);

    var phase = "active"; // "active" | "collapsed"
    var collapsing = false;
    var pos = null;
    var holdTimer = null;
    var moved = false;
    var dragStart = null;
    var modal = null;

    var logo = el("button", "kdsp-logo");
    logo.type = "button";
    var logoImg = el("img");
    logoImg.src = sponsor.logoUrl;
    logoImg.alt = sponsor.sponsorName;
    logoImg.draggable = false;
    logo.appendChild(logoImg);
    logo.appendChild(el("span", "kdsp-badge", "Oglas"));

    function setPos(p, size) {
      pos = p;
      logo.style.top = p.y + "px";
      logo.style.left = p.x + "px";
      logo.style.width = size + "px";
      logo.style.height = size + "px";
    }

    function settle() {
      phase = "collapsed";
      logo.disabled = false;
      logo.removeAttribute("aria-hidden");
      logo.setAttribute(
        "aria-label",
        sponsor.sponsorName + " — otvori ponudu sponzora (povuci za pomicanje)",
      );
      logoImg.alt = "";
      logo.classList.add("kdsp-ready", "kdsp-pulse");
    }

    var splash = [];

    function beginCollapse() {
      if (collapsing) return;
      collapsing = true;
      clearTimeout(holdTimer);
      logo.classList.add("kdsp-settled");
      setPos(resolveCollapsedPos(), SIZE);
      recordSplashPlayed(sponsor.displayFrequency);
      splash.forEach(function (node) {
        node.style.opacity = "0";
        node.style.pointerEvents = "none";
      });
      setTimeout(function () {
        splash.forEach(function (node) {
          node.remove();
        });
        settle();
      }, TRANSITION_MS);
    }

    logo.disabled = true;
    logo.setAttribute("aria-hidden", "true");

    if (shouldPlaySplash(sponsor.displayFrequency)) {
      var overlay = el("div", "kdsp-overlay");
      var skip = el("button", "kdsp-skip");
      skip.type = "button";
      skip.innerHTML = '<span aria-hidden="true">✕</span> Preskoči';
      skip.addEventListener("click", beginCollapse);
      var label = el("p", "kdsp-label", "Generalni sponzor");
      splash = [overlay, skip, label];
      document.body.append(overlay, skip, label, logo);

      setPos({ x: window.innerWidth / 2, y: window.innerHeight / 2 + 24 }, SPLASH_SIZE);
      // Isti "sljedeći tick" trik kao SponsorWidget — tranzicija mora
      // vidjeti početno scale(0) stanje prije zoomiranja.
      setTimeout(function () {
        logo.classList.add("kdsp-anim", "kdsp-shown");
      }, 20);
      holdTimer = setTimeout(beginCollapse, HOLD_MS);
    } else {
      logo.classList.add("kdsp-settled", "kdsp-shown");
      document.body.appendChild(logo);
      setPos(resolveCollapsedPos(), SIZE);
      settle();
      setTimeout(function () {
        logo.classList.add("kdsp-anim");
      }, 20);
    }

    // ------------------------------------------------------------ povlačenje
    logo.addEventListener("pointerdown", function (e) {
      if (phase !== "collapsed" || !pos) return;
      logo.setPointerCapture(e.pointerId);
      moved = false;
      logo.classList.remove("kdsp-anim");
      dragStart = { px: e.clientX, py: e.clientY, x: pos.x, y: pos.y };
    });

    logo.addEventListener("pointermove", function (e) {
      if (!dragStart) return;
      var dx = e.clientX - dragStart.px;
      var dy = e.clientY - dragStart.py;
      if (Math.abs(dx) > DRAG_THRESHOLD || Math.abs(dy) > DRAG_THRESHOLD) moved = true;
      if (moved) setPos(clampToViewport({ x: dragStart.x + dx, y: dragStart.y + dy }), SIZE);
    });

    function endDrag() {
      if (!dragStart) return;
      dragStart = null;
      logo.classList.add("kdsp-anim");
      if (moved && pos) {
        try {
          localStorage.setItem(POS_STORAGE_KEY, JSON.stringify(pos));
        } catch (e) {
          // pozicija se ne pamti — bez drugog utjecaja
        }
      }
    }
    logo.addEventListener("pointerup", endDrag);
    logo.addEventListener("pointercancel", endDrag);

    window.addEventListener("resize", function () {
      if (phase === "collapsed" && pos) setPos(clampToViewport(pos), SIZE);
    });

    // ------------------------------------------------------------ modal
    function closeModal() {
      if (!modal) return;
      modal.remove();
      modal = null;
      document.removeEventListener("keydown", onKeydown);
    }

    function onKeydown(e) {
      if (e.key === "Escape") closeModal();
    }

    function openModal() {
      modal = el("div", "kdsp-backdrop");
      modal.addEventListener("click", closeModal);

      var box = el("div", "kdsp-modal");
      box.setAttribute("role", "dialog");
      box.setAttribute("aria-label", sponsor.sponsorName);
      box.addEventListener("click", function (e) {
        e.stopPropagation();
      });

      var close = el("button", "kdsp-close", "✕");
      close.type = "button";
      close.setAttribute("aria-label", "Zatvori");
      close.addEventListener("click", closeModal);

      var head = el("div", "kdsp-head");
      var img = el("img");
      img.src = sponsor.logoUrl;
      img.alt = "";
      head.append(img, el("h2", "", sponsor.sponsorName));

      var visit = el("a", "kdsp-visit", "Posjeti stranicu");
      visit.href = sponsor.linkUrl;
      visit.target = "_blank";
      visit.rel = "sponsored noopener noreferrer";

      box.append(close, el("span", "kdsp-ad", "Oglas"), head);
      if (sponsor.promoText) box.appendChild(el("p", "kdsp-promo", sponsor.promoText));
      box.appendChild(visit);

      modal.appendChild(box);
      document.body.appendChild(modal);
      document.addEventListener("keydown", onKeydown);
      close.focus();
    }

    logo.addEventListener("click", function () {
      if (moved || phase !== "collapsed") return;
      logo.classList.remove("kdsp-pulse");
      openModal();
    });
  }
})();
