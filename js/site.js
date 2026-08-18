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
