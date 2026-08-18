/* John W. Fisher — behaviour.
   Small on purpose. Reveals, nav state, mobile drawer, lazy-image backstop.
   Every visual default lives in CSS so a failure here costs an effect, never
   the content. */
(function () {
  "use strict";

  var still = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- reveals ---- */
  var items = [].slice.call(document.querySelectorAll('.rv'));
  if (items.length && !still && 'IntersectionObserver' in window) {
    document.documentElement.classList.add('anim');
    var show = function (el) { el.classList.add('in'); };
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { show(e.target); io.unobserve(e.target); } });
    }, { threshold: 0.04, rootMargin: '0px 0px -6% 0px' });
    items.forEach(function (el) { io.observe(el); });
    // Nothing may stay hidden because a callback was missed.
    window.setTimeout(function () { items.forEach(show); }, 6000);
  }

  /* ---- lazy images: native deferral has been seen to download a file and
         still leave the element blank, so drive it explicitly ---- */
  var lazies = [].slice.call(document.querySelectorAll('img[loading="lazy"]'));
  if (lazies.length) {
    var wake = function (img) {
      if (img.dataset.woke) { return; }
      img.dataset.woke = '1';
      img.removeAttribute('loading');
      var s = img.getAttribute('src');
      if (s && !img.complete) { img.src = s; }
    };
    if ('IntersectionObserver' in window) {
      var lio = new IntersectionObserver(function (es) {
        es.forEach(function (e) { if (e.isIntersecting) { wake(e.target); lio.unobserve(e.target); } });
      }, { rootMargin: '700px 0px' });
      lazies.forEach(function (i) { lio.observe(i); });
    } else { lazies.forEach(wake); }
    window.setTimeout(function () {
      lazies.forEach(function (i) { if (!i.complete || !i.naturalWidth) { wake(i); } });
    }, 4500);
  }

  /* ---- rail active state ---- */
  var links = [].slice.call(document.querySelectorAll('.rail nav a'));
  var targets = links.map(function (a) {
    return document.querySelector(a.getAttribute('href'));
  });
  if (links.length && 'IntersectionObserver' in window) {
    var sio = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) { return; }
        var i = targets.indexOf(e.target);
        if (i < 0) { return; }
        links.forEach(function (l) { l.classList.remove('on'); });
        links[i].classList.add('on');
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    targets.forEach(function (t) { if (t) { sio.observe(t); } });
  }

  /* ---- mobile drawer ---- */
  var btn = document.getElementById('menuBtn');
  var drawer = document.getElementById('drawer');
  if (btn && drawer) {
    var setOpen = function (open) {
      drawer.classList.toggle('open', open);
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      document.body.style.overflow = open ? 'hidden' : '';
      if (open) {
        var f = drawer.querySelector('a');
        if (f) { f.focus(); }
      }
    };
    btn.addEventListener('click', function () {
      setOpen(!drawer.classList.contains('open'));
    });
    drawer.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') { setOpen(false); }
    });
    document.addEventListener('keydown', function (e) {
      if (!drawer.classList.contains('open')) { return; }
      if (e.key === 'Escape') { setOpen(false); btn.focus(); return; }
      if (e.key !== 'Tab') { return; }
      var f = [].slice.call(drawer.querySelectorAll('a'));
      if (!f.length) { return; }
      if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
    });
  }
}());

/* The Sermon Song words-to-notation cross-fade.

   The class is added by script, not written into the stylesheet, so the
   default rendering for a visitor whose JS never runs is both layers
   visible rather than an empty band. Everything after that is CSS. */
(function () {
  var morph = document.querySelector('[data-morph]');
  if (!morph || !('IntersectionObserver' in window)) { return; }

  document.documentElement.classList.add('js-morph');

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { e.target.classList.add('is-lit'); io.unobserve(e.target); }
    });
  }, { threshold: 0.45 });
  io.observe(morph);

  // If the band is taller than the viewport the threshold can never be met.
  window.setTimeout(function () { morph.classList.add('is-lit'); }, 5000);
}());

/* Motion controller: hero entrance, mask reveals, timeline draw, stat count-up,
   hero parallax. One observer drives everything that reacts to scroll.

   .js-motion is set here rather than in the stylesheet so that the start
   states (opacity 0, clipped) only exist when something is guaranteed to
   clear them. If this file fails to parse, the page renders fully visible. */
(function () {
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!('IntersectionObserver' in window)) { return; }

  var root = document.documentElement;
  if (!reduce) { root.classList.add('js-motion'); }

  /* ---- hero entrance ---- */
  var art = document.querySelector('.hero-art');
  var text = document.querySelector('.hero-text');

  /* Not requestAnimationFrame. rAF is throttled to zero in a background tab,
     and the hero's start state is clipped and transparent — so a visitor who
     opened the page in a background tab, or a bot rendering it headless, got
     an invisible hero that only appeared once the tab was focused. Timers
     keep running when rAF does not, so the reveal is driven by a timer and
     backed by a hard fallback that shows the hero regardless. */
  var showHero = function () {
    if (art) { art.classList.add('in'); }
    window.setTimeout(function () { if (text) { text.classList.add('in'); } }, 120);
  };
  window.setTimeout(showHero, 40);
  window.addEventListener('load', showHero);
  window.setTimeout(showHero, 2500);

  /* ---- one observer for every scroll-driven section ---- */
  var targets = [].slice.call(document.querySelectorAll('.spread, .overlay, .quote-plate, .ledger'));
  if (targets.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) { return; }
        e.target.classList.add('in-view');
        io.unobserve(e.target);
      });
    }, { threshold: 0.16, rootMargin: '0px 0px -6% 0px' });
    targets.forEach(function (t) { io.observe(t); });

    // Anything already on screen at load, or missed, is shown outright.
    window.setTimeout(function () {
      targets.forEach(function (t) { t.classList.add('in-view'); });
    }, 5000);
  }

  /* ---- statistics count up once ----
     Only whole numbers are animated. A value like "50+" keeps its suffix, and
     anything non-numeric is left exactly as written. */
  var stats = [].slice.call(document.querySelectorAll('.stat b'));
  stats.forEach(function (el) {
    var raw = (el.textContent || '').trim();
    var m = raw.match(/^(\d+)(\D*)$/);
    if (!m || reduce) { return; }
    var end = parseInt(m[1], 10);
    if (end > 999) { return; }   // years stay put
    var suffix = m[2] || '';
    var pad = m[1].length > 1 && m[1][0] === '0' ? m[1].length : 0;
    var fmt = function (n) {
      var v = String(n);
      while (pad && v.length < pad) { v = '0' + v; }
      return v + suffix;
    };
    el.textContent = fmt(0);

    var sio = new IntersectionObserver(function (entries) {
      if (!entries[0].isIntersecting) { return; }
      sio.disconnect();
      var t0 = null;
      var run = function (ts) {
        if (t0 === null) { t0 = ts; }
        var k = Math.min((ts - t0) / 900, 1);
        var eased = 1 - Math.pow(1 - k, 3);
        el.textContent = fmt(Math.round(end * eased));
        if (k < 1) { requestAnimationFrame(run); }
      };
      requestAnimationFrame(run);
    }, { threshold: 0.6 });
    sio.observe(el);
  });

  /* ---- hero parallax, capped and desktop only ----
     Bound to rAF and skipped entirely on coarse pointers, where the paint
     cost is real and the effect is barely visible. */
  var fine = window.matchMedia('(hover:hover) and (pointer:fine)').matches;
  var heroImg = art && art.querySelector('img');
  if (heroImg && fine && !reduce) {
    var ticking = false;
    var move = function () {
      ticking = false;
      var y = window.pageYOffset;
      if (y > window.innerHeight) { return; }
      heroImg.style.transform = 'translate3d(0,' + Math.min(y * 0.08, 26) + 'px,0)';
    };
    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; requestAnimationFrame(move); }
    }, { passive: true });
  }
}());
