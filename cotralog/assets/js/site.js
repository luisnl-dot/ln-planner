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
  window.cotralogReady = true;

  function onChange(mq, fn) {
    if (mq.addEventListener) mq.addEventListener('change', fn);
    else if (mq.addListener) mq.addListener(fn);
  }

  /* ---------- Kopfzeile: Linie erscheint, sobald gescrollt wird ----------- */
  var top = $('.top');
  if (top) {
    var ticking = false;
    var setStuck = function () {
      top.classList.toggle('is-stuck', window.scrollY > 4);
      ticking = false;
    };
    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; window.requestAnimationFrame(setStuck); }
    }, { passive: true });
    setStuck();
  }

  /* ---------- Menü auf schmalen Bildschirmen ------------------------------ */
  var menuBtn = $('.top__menu');
  var nav = $('#nav');
  if (menuBtn && nav) {
    menuBtn.hidden = false;
    var menuOpen = false;
    var setMenu = function (open) {
      menuOpen = open;
      menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
      nav.classList.toggle('is-open', open);
    };
    menuBtn.addEventListener('click', function () { setMenu(!menuOpen); });
    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) setMenu(false);
    });
    doc.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && menuOpen) { setMenu(false); menuBtn.focus(); }
    });
    doc.addEventListener('click', function (e) {
      if (menuOpen && !e.target.closest('.top')) setMenu(false);
    });
    onChange(mqNav, function () { setMenu(false); });
  }

  /* ---------- Navigation: aktueller Abschnitt ----------------------------- */
  var navLinks = $$('.nav a[href^="#"]');
  if (navLinks.length && 'IntersectionObserver' in window) {
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
  if ('IntersectionObserver' in window) {
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

  /* ---------- Module: Verzeichnis und Auswertung -------------------------- */
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
      var no = $('.mod__no', head);
      var title = $('.mod__title', head);

      var mark = doc.createElement('span');
      mark.className = 'mod__mark';
      while (title.firstChild) mark.appendChild(title.firstChild);
      title.appendChild(mark);

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
      btn.appendChild(icon);
      head.appendChild(btn);

      panel.setAttribute('role', 'region');
      panel.setAttribute('aria-labelledby', btn.id);
      btn.setAttribute('aria-expanded', isOpen(mod) ? 'true' : 'false');
      buttons.push(btn);

      btn.addEventListener('click', function () {
        if (mqWide.matches) { show(mod, true); return; }
        if (isOpen(mod)) setOpen(mod, false);
        else show(mod, true);
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

    // Sprungziele wie #modul-3 öffnen das passende Modul.
    var fromHash = function () {
      var id = window.location.hash.slice(1);
      if (!/^modul-[1-6]$/.test(id)) return;
      var head = doc.getElementById(id);
      var mod = head && head.closest('[data-mod]');
      if (!mod) return;
      show(mod, true);
      // Nebeneinander steht die Auswertung auf Höhe des Verzeichnisses: dorthin springen.
      (mqWide.matches ? head.closest('[data-mods]') : head).scrollIntoView();
    };
    window.addEventListener('hashchange', fromHash);
    fromHash();
    // Beim Laden springt der Browser selbst zur Überschrift; danach einmal nachführen.
    window.addEventListener('load', function () { window.setTimeout(fromHash, 0); });
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
