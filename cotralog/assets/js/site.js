/* cotralog – Verhalten der Seite.
   Alles hier ist Zugabe: Ohne Skript sind sämtliche Inhalte sichtbar und lesbar. */
(function () {
  'use strict';

  var doc = document;
  var root = doc.documentElement;
  var $ = function (sel, ctx) { return (ctx || doc).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || doc).querySelectorAll(sel)); };

  var mqNav = window.matchMedia('(min-width: 56.25em)');   // Navigation in der Kopfzeile
  var mqWide = window.matchMedia('(min-width: 62em)');     // Module nebeneinander
  // Ob Bewegung gezeigt wird, entscheidet das kleine Skript im Seitenkopf.
  var motionOK = root.classList.contains('motion');
  var hasIO = 'IntersectionObserver' in window;
  window.cotralogReady = true;

  function onChange(mq, fn) {
    if (mq.addEventListener) mq.addEventListener('change', fn);
    else if (mq.addListener) mq.addListener(fn);
  }
  function setInert(el, on) {
    if (!el) return;
    if (on) el.setAttribute('inert', ''); else el.removeAttribute('inert');
  }

  var top = $('.top');
  var menuBtn = $('.top__menu');
  var nav = $('#nav');
  var bar = $('[data-bar]');
  var menuOpen = false;
  var updateBar = function () {};

  /* ---------- Kopfzeile ---------------------------------------------------
     Linie erscheint, sobald gescrollt wird. Auf dem Handy weicht die Kopfzeile
     beim Lesen nach unten und kommt beim Zurückscrollen wieder. */
  if (top) {
    var ticking = false;
    var lastY = Math.max(0, window.scrollY);
    var turnY = lastY;   // Stelle, an der zuletzt die Richtung gewechselt hat
    var dir = 0;
    var away = false;
    var setAway = function (v) {
      if (away === v) return;
      away = v;
      top.classList.toggle('is-away', v);
    };
    var onScroll = function () {
      var y = Math.max(0, window.scrollY);
      top.classList.toggle('is-stuck', y > 4);
      if (y !== lastY) {
        var now = y > lastY ? 1 : -1;
        if (now !== dir) { dir = now; turnY = lastY; }
      }
      // Erst nach einem deutlichen Stück weichen, schon nach einem kleinen wiederkommen.
      // Nie weichen, solange der Tastaturfokus in der Kopfzeile liegt.
      if (mqNav.matches || menuOpen || y < 96 || top.contains(doc.activeElement)) setAway(false);
      else if (Date.now() < landUntil) setAway(true);
      else if (dir > 0 && y - turnY > 40) setAway(true);
      else if (dir < 0 && turnY - y > 12) setAway(false);
      lastY = y;
      ticking = false;
    };
    // Sprung zu einem Abschnitt: Er soll oben am Bildschirmrand beginnen, auch
    // wenn es nach oben geht. Solange der Sprung läuft, bleibt die Kopfzeile weg.
    var landUntil = 0;
    doc.addEventListener('click', function (e) {
      var a = e.target.closest('a[href^="#"]');
      if (a && a.getAttribute('href').length > 1 && a.getAttribute('href') !== '#top') landUntil = Date.now() + 1200;
    });
    window.addEventListener('hashchange', function () {
      if (window.location.hash && window.location.hash !== '#top') landUntil = Date.now() + 1200;
    });
    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; window.requestAnimationFrame(onScroll); }
    }, { passive: true });
    // Tastatur: Wer in die Kopfzeile springt, muss sie auch sehen.
    top.addEventListener('focusin', function () { setAway(false); });
    onChange(mqNav, function () { setAway(false); });
    onScroll();
  }

  /* ---------- Menü auf schmalen Bildschirmen ------------------------------ */
  if (menuBtn && nav) {
    menuBtn.hidden = false;
    var behind = [$('main'), $('.foot'), bar];
    var setMenu = function (open) {
      if (menuOpen === open) return;
      menuOpen = open;
      menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
      nav.classList.toggle('is-open', open);
      root.classList.toggle('is-menu', open);
      // Solange das Menü den Bildschirm füllt, ist die Seite dahinter nicht bedienbar.
      behind.forEach(function (el) { if (el !== bar) setInert(el, open); });
      if (open && top) top.classList.remove('is-away');
      updateBar();
    };
    menuBtn.addEventListener('click', function () { setMenu(!menuOpen); });
    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) setMenu(false);
    });
    doc.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && menuOpen) { setMenu(false); menuBtn.focus(); }
    });
    onChange(mqNav, function () { setMenu(false); });
  }

  /* ---------- Aktionsleiste auf dem Handy ---------------------------------
     Sichtbar, solange kein anderer Weg zur Anfrage im Bild ist: nicht neben
     dem Knopf im Einstieg, nicht über dem Formular, nicht über dem Fuß. */
  if (bar && hasIO) {
    var seen = [];
    var barOn = false;
    bar.hidden = false;
    setInert(bar, true);
    updateBar = function () {
      var on = !mqNav.matches && !menuOpen && seen.length === 0;
      if (on === barOn) return;
      barOn = on;
      bar.classList.toggle('is-on', on);
      setInert(bar, !on);
    };
    var mark = function (el, visible) {
      var i = seen.indexOf(el);
      if (visible && i < 0) seen.push(el);
      if (!visible && i >= 0) seen.splice(i, 1);
    };
    // Der Knopf im Einstieg zählt erst, wenn er weitgehend zu sehen ist.
    var ctaIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { mark(en.target, en.isIntersecting && en.intersectionRatio >= 0.75); });
      updateBar();
    }, { threshold: [0, 0.75, 1] });
    $$('[data-bar-watch]').forEach(function (el) { ctaIO.observe(el); });
    // Formular und Fuß zählen, sobald sie über die Leiste hinausragen.
    var zoneIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { mark(en.target, en.isIntersecting); });
      updateBar();
    }, { rootMargin: '0px 0px -76px 0px' });
    [$('#testangebot'), $('.foot')].forEach(function (el) { if (el) zoneIO.observe(el); });
    onChange(mqNav, updateBar);
  }

  /* ---------- Weg zur Anfrage ----------------------------------------------
     Breit steht das Formular neben dem Angebot: direkt dorthin. Auf dem Handy
     erst zum Angebot, das Formular beginnt gleich darunter. */
  var formLinks = $$('a[href="#anfrage"]');
  if (formLinks.length && doc.getElementById('testangebot')) {
    var aimLinks = function () {
      formLinks.forEach(function (a) { a.setAttribute('href', mqNav.matches ? '#anfrage' : '#testangebot'); });
    };
    onChange(mqNav, aimLinks);
    aimLinks();
  }

  /* ---------- Navigation: aktueller Abschnitt ----------------------------- */
  var navLinks = $$('.nav__list a[href^="#"]');
  if (navLinks.length && hasIO) {
    var byId = {};
    navLinks.forEach(function (a) { byId[a.getAttribute('href').slice(1)] = a; });
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        var link = byId[en.target.id];
        if (!link) return;
        if (en.isIntersecting) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      });
    }, { rootMargin: '-45% 0px -54% 0px' });
    Object.keys(byId).forEach(function (id) {
      var sec = doc.getElementById(id);
      if (sec) spy.observe(sec);
    });
  }

  /* ---------- Einblenden beim Erreichen ----------------------------------- */
  var reveal = function (el) { el.classList.add('is-in'); };
  var io = null;
  if (hasIO) {
    io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var mod = en.target.closest('[data-mod]');
        if (mod && !mod.classList.contains('is-open')) return; // wird beim Öffnen gestartet
        reveal(en.target);
        io.unobserve(en.target);
      });
    }, { threshold: 0.25, rootMargin: '0px 0px -8% 0px' });
  }
  $$('[data-reveal], [data-fig]').forEach(function (el) {
    if (io && motionOK) io.observe(el); else reveal(el);
  });

  function replay(fig) {
    if (!fig) return;
    if (!motionOK) { reveal(fig); return; }
    fig.classList.remove('is-in');
    void fig.offsetWidth; // Ausgangszustand anwenden, dann neu abspielen
    fig.classList.add('is-in');
  }

  /* ---------- Einstieg: Stichprobe gegen Vollprüfung ---------------------- */
  var hero = $('.hero');
  var sheet = $('[data-sheet]');
  if (sheet) {
    var radios = $$('input[name="pruefumfang"]', sheet);
    var cap = $('.sheet__cap', sheet);
    var timers = [];
    var setState = function (state) {
      sheet.setAttribute('data-state', state);
      radios.forEach(function (r) { r.checked = (r.value === state); });
    };
    var stopIntro = function () {
      timers.forEach(window.clearTimeout);
      timers = [];
      if (cap) cap.setAttribute('aria-live', 'polite');
    };
    radios.forEach(function (r) {
      r.addEventListener('change', function () {
        stopIntro();
        if (motionOK) sheet.classList.add('is-live');
        setState(r.value);
      });
    });

    if (motionOK && io) {
      // Ablauf einmal zeigen: Die Stichprobe steht schon da, dann folgt jede Zeile.
      if (sheet.getAttribute('data-state') !== 'sample') setState('sample');
      var started = false;
      var play = function () {
        if (started) return;
        started = true;
        sheet.classList.add('is-live');
        timers.push(window.setTimeout(function () { setState('full'); }, 1500));
        timers.push(window.setTimeout(stopIntro, 3400));
      };
      var sheetIO = new IntersectionObserver(function (entries) {
        if (entries[0].isIntersecting) { sheetIO.disconnect(); play(); }
      }, { threshold: 0.3 });
      var armed = false;
      var arm = function () { if (!armed) { armed = true; sheetIO.observe(sheet); } };
      if (doc.fonts && doc.fonts.ready) {
        doc.fonts.ready.then(arm);
        window.setTimeout(arm, 1500);
      } else {
        arm();
      }
    } else if (cap) {
      cap.setAttribute('aria-live', 'polite');
    }
  }
  if (hero) {
    if (motionOK && doc.fonts && doc.fonts.ready) {
      var heroIn = function () { reveal(hero); };
      doc.fonts.ready.then(heroIn);
      window.setTimeout(heroIn, 1500);
    } else {
      reveal(hero);
    }
  }

  /* ---------- Module: Verzeichnis und Auswertung --------------------------
     Breit: Liste links, eine Auswertung rechts. Schmal: aufklappbare Liste,
     zu Beginn geschlossen, damit alle sechs Module auf einen Blick stehen. */
  var mods = $$('[data-mod]');
  if (mods.length) {
    var buttons = [];

    var setOpen = function (mod, open) {
      mod.classList.toggle('is-open', open);
      var b = $('.mod__btn', mod);
      if (b) b.setAttribute('aria-expanded', open ? 'true' : 'false');
    };
    var isOpen = function (mod) { return mod.classList.contains('is-open'); };

    var show = function (mod, play) {
      if (mqWide.matches) {
        mods.forEach(function (m) { if (m !== mod) setOpen(m, false); });
      }
      var was = isOpen(mod);
      setOpen(mod, true);
      if (play && !was) replay($('[data-fig]', mod));
    };

    mods.forEach(function (mod, index) {
      var head = $('.mod__head', mod);
      var panel = $('.mod__panel', mod);
      var body = $('.mod__body', mod);
      var no = $('.mod__no', head);
      var title = $('.mod__title', head);
      var teaser = $('.mod__teaser', head);

      var icon = doc.createElement('span');
      icon.className = 'mod__icon';
      icon.setAttribute('aria-hidden', 'true');

      var btn = doc.createElement('button');
      btn.type = 'button';
      btn.className = 'mod__btn';
      btn.id = head.id + '-btn';
      btn.setAttribute('aria-controls', panel.id);
      btn.appendChild(no);
      btn.appendChild(title);
      // Der Satz unter dem Titel gehört zur Schaltfläche: Was sichtbar ist, wird auch vorgelesen.
      if (teaser) btn.appendChild(teaser);
      btn.appendChild(icon);
      head.appendChild(btn);

      panel.setAttribute('role', 'region');
      panel.setAttribute('aria-labelledby', btn.id);
      btn.setAttribute('aria-expanded', isOpen(mod) ? 'true' : 'false');
      buttons.push(btn);

      btn.addEventListener('click', function () {
        if (mqWide.matches) { show(mod, true); return; }
        if (isOpen(mod)) { setOpen(mod, false); return; }
        show(mod, true);
        // Liegt die Zeile weit unten, wäre vom Inhalt nichts zu sehen: nach oben holen.
        var topNow = head.getBoundingClientRect().top;
        if (topNow > window.innerHeight * 0.42) {
          window.scrollTo({ top: window.scrollY + topNow - 16, behavior: motionOK ? 'smooth' : 'auto' });
        }
      });

      btn.addEventListener('keydown', function (e) {
        var to = -1;
        if (e.key === 'ArrowDown') to = (index + 1) % buttons.length;
        else if (e.key === 'ArrowUp') to = (index - 1 + buttons.length) % buttons.length;
        else if (e.key === 'Home') to = 0;
        else if (e.key === 'End') to = buttons.length - 1;
        if (to < 0) return;
        e.preventDefault();
        buttons[to].focus();
      });

      // Am Ende eines langen Moduls: schließen, ohne zurückscrollen zu müssen.
      if (body) {
        var end = doc.createElement('p');
        end.className = 'mod__end';
        var close = doc.createElement('button');
        close.type = 'button';
        close.className = 'mod__close';
        close.appendChild(doc.createElement('i'));
        close.appendChild(doc.createTextNode('Schließen'));
        end.appendChild(close);
        body.appendChild(end);
        close.addEventListener('click', function () {
          // In einem Schritt zuklappen und zur Zeile springen. Sonst rutscht die
          // Seite in Browsern ohne Scroll-Verankerung um die Höhe des Moduls weg.
          mod.classList.add('is-snap');
          setOpen(mod, false);
          head.scrollIntoView({ block: 'start', behavior: 'instant' });
          btn.focus({ preventScroll: true });
          window.setTimeout(function () { mod.classList.remove('is-snap'); }, 60);
        });
      }
    });

    // Breite Ansicht zeigt immer genau ein Modul.
    var normalize = function () {
      if (!mqWide.matches) return;
      var open = mods.filter(isOpen);
      var keep = open[0] || mods[0];
      mods.forEach(function (m) { setOpen(m, m === keep); });
    };
    onChange(mqWide, normalize);
    normalize();

    // Nebeneinander steht die Auswertung auf Höhe des Verzeichnisses. Jede Zeile
    // bekommt ihren Abstand zur ersten als Sprungabstand: So landet auch der
    // Browser selbst (Link von außen, Zurück-Taste) am Anfang des Verzeichnisses.
    var heads = mods.map(function (m) { return $('.mod__head', m); });
    var alignHeads = function () {
      var wide = mqWide.matches;
      var first = heads[0].getBoundingClientRect().top;
      heads.forEach(function (h) {
        h.style.scrollMarginTop = wide ? Math.round(h.getBoundingClientRect().top - first) + 'px' : '';
      });
    };
    var alignQueued = false;
    var queueAlign = function () {
      if (alignQueued) return;
      alignQueued = true;
      window.requestAnimationFrame(function () { alignQueued = false; alignHeads(); });
    };
    onChange(mqWide, alignHeads);
    window.addEventListener('resize', queueAlign);
    if (doc.fonts && doc.fonts.ready) doc.fonts.ready.then(alignHeads);
    alignHeads();

    // Sprungziele wie #modul-3 öffnen das passende Modul.
    var fromHash = function () {
      var id = window.location.hash.slice(1);
      if (!/^modul-[1-6]$/.test(id)) return;
      var head = doc.getElementById(id);
      var mod = head && head.closest('[data-mod]');
      if (!mod) return;
      show(mod, true);
      head.scrollIntoView();
    };
    window.addEventListener('hashchange', fromHash);
    fromHash();
    // Nach dem Laden stehen Schriften und Maße fest: einmal nachführen.
    window.addEventListener('load', function () { alignHeads(); window.setTimeout(fromHash, 0); });
    // Derselbe Link zweimal: kein hashchange, also beim Klick nachführen.
    doc.addEventListener('click', function (e) {
      var link = e.target.closest('a[href^="#modul-"]');
      if (link) window.setTimeout(fromHash, 0);
    });
  }

  /* ---------- Anfrageformular --------------------------------------------- */
  var form = $('.form');
  if (form) {
    var statusEl = $('.form__status', form);
    var submitBtn = $('button[type="submit"]', form);
    var required = $$('[required]', form);

    var check = function (input) {
      var err = doc.getElementById(input.id + '-err');
      var ok = input.validity.valid && input.value.trim() !== '';
      input.setAttribute('aria-invalid', ok ? 'false' : 'true');
      if (err) err.hidden = ok;
      return ok;
    };
    var say = function (text, ok) {
      statusEl.textContent = text;
      statusEl.classList.toggle('is-ok', !!ok);
    };

    required.forEach(function (input) {
      input.addEventListener('blur', function () {
        if (input.value !== '' || input.getAttribute('aria-invalid') === 'true') check(input);
      });
      input.addEventListener('input', function () {
        if (input.getAttribute('aria-invalid') === 'true') check(input);
      });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      say('', false);

      var firstBad = null;
      required.forEach(function (input) {
        if (!check(input) && !firstBad) firstBad = input;
      });
      if (firstBad) { firstBad.focus(); return; }

      // Feld für Menschen unsichtbar; ist es gefüllt, war es ein Automat.
      if (form.elements.website && form.elements.website.value) { form.reset(); return; }

      var endpoint = form.getAttribute('data-endpoint');
      if (!endpoint) {
        say('Platzhalter: Der Versand dieses Formulars ist noch nicht eingerichtet. Ihre Angaben wurden nicht übertragen.', false);
        statusEl.focus();
        return;
      }

      submitBtn.disabled = true;
      window.fetch(endpoint, {
        method: 'POST',
        headers: { 'Accept': 'application/json' },
        body: new window.FormData(form)
      }).then(function (res) {
        if (!res.ok) throw new Error('Versand fehlgeschlagen');
        form.reset();
        required.forEach(function (input) { input.removeAttribute('aria-invalid'); });
        say('Vielen Dank. Ihre Anfrage ist eingegangen.', true);
        statusEl.focus();
      }).catch(function () {
        say('Ihre Anfrage konnte nicht gesendet werden. Bitte versuchen Sie es noch einmal.', false);
        statusEl.focus();
      }).then(function () {
        submitBtn.disabled = false;
      });
    });
  }
})();
