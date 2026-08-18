/* John W. Fisher — behaviour layer.

   Everything here fixes something the audit found in this template family:
   reveals that never fire, anchors that land under a fixed header, a mobile
   menu with no keyboard story, and native lazy loading that downloads an
   image and then leaves the element blank. Vendor files are untouched. */
(function () {
  "use strict";

  var still = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- 1. Reveals ----------------------------------------------------
     WOW.js hides every .wow element and waits for a scroll callback. If
     that callback is missed the content never comes back. jf-custom.css
     defaults everything to visible and this opts into the fade instead. */
  var items = [].slice.call(document.querySelectorAll('.wow'));
  if (items.length && !still && 'IntersectionObserver' in window) {
    document.documentElement.classList.add('jf-anim');

    var show = function (el) {
      if (el.classList.contains('jf-in')) { return; }
      el.style.visibility = 'visible';
      el.classList.add('jf-in');
    };

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { show(e.target); io.unobserve(e.target); }
      });
    }, { threshold: 0.01, rootMargin: '0px 0px -4% 0px' });
    items.forEach(function (el) { io.observe(el); });

    // Backstop for anything the observer skipped.
    var sweep = function () {
      var limit = window.innerHeight * 0.95;
      items.forEach(function (el) {
        if (!el.classList.contains('jf-in') && el.getBoundingClientRect().top < limit) {
          show(el); io.unobserve(el);
        }
      });
    };
    var ticking = false;
    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; window.requestAnimationFrame(function () { ticking = false; sweep(); }); }
    }, { passive: true });
    window.addEventListener('resize', sweep, { passive: true });
    window.addEventListener('load', sweep);
    sweep();
    window.setTimeout(function () { items.forEach(show); }, 6000);
  }

  /* ---- 2. Lazy images ------------------------------------------------
     Native loading="lazy" has been observed downloading a file in full and
     then leaving the element unpainted. Rather than trust the browser's
     deferral, load each image outright as it approaches the viewport. */
  var lazies = [].slice.call(document.querySelectorAll('img[loading="lazy"]'));
  if (lazies.length) {
    var wake = function (img) {
      if (img.dataset.jfWoke) { return; }
      img.dataset.jfWoke = '1';
      img.removeAttribute('loading');
      var src = img.getAttribute('src');
      if (src && !img.complete) { img.src = src; }
    };
    if ('IntersectionObserver' in window) {
      var lio = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) { wake(e.target); lio.unobserve(e.target); }
        });
      }, { rootMargin: '600px 0px' });
      lazies.forEach(function (img) { lio.observe(img); });
    } else {
      lazies.forEach(wake);
    }
    window.setTimeout(function () {
      lazies.forEach(function (img) { if (!img.complete || !img.naturalWidth) { wake(img); } });
    }, 4000);
  }

  /* ---- 3. Anchors ----------------------------------------------------
     The demo animates to offset().top with no allowance for the fixed
     header, so a section lands underneath it. */
  var nav = document.querySelector('.navbar, header nav, .left-nav');
  if (window.jQuery) { window.jQuery('.scroll, a[href^="#"]').off('click'); }

  [].slice.call(document.querySelectorAll('a[href^="#"]')).forEach(function (a) {
    var id = a.getAttribute('href');
    if (!id || id === '#') { return; }
    a.addEventListener('click', function (e) {
      var target = document.querySelector(id);
      if (!target) { return; }
      e.preventDefault();
      closeMenu();
      var isSide = nav && nav.classList.contains('left-nav');
      var offset = (nav && !isSide) ? nav.getBoundingClientRect().height + 12 : 12;
      var y = target.getBoundingClientRect().top + window.pageYOffset - offset;
      window.scrollTo({ top: y < 0 ? 0 : y, behavior: still ? 'auto' : 'smooth' });
      if (history.replaceState) { history.replaceState(null, '', id); }
    });
  });

  /* ---- 4. Mobile menu ------------------------------------------------
     Announce state, close on Escape, and keep Tab inside while open. */
  var toggle = document.querySelector('.menu-icon, .nav-toggle, .navbar-toggler, [aria-controls][aria-expanded]');
  var panel = document.querySelector('.left-nav, .navbar-collapse, .nav-links');

  function isOpen() {
    if (!panel) { return false; }
    return /active|open|show/.test(panel.className);
  }
  function closeMenu() {
    if (toggle && isOpen()) { toggle.click(); }
  }

  if (toggle && panel) {
    if (!panel.id) { panel.id = 'jf-menu'; }
    toggle.setAttribute('aria-controls', panel.id);
    toggle.setAttribute('aria-expanded', 'false');
    if (!toggle.getAttribute('aria-label')) { toggle.setAttribute('aria-label', 'Menu'); }

    new MutationObserver(function () {
      var open = isOpen();
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (open) {
        var first = panel.querySelector('a, button, [tabindex]:not([tabindex="-1"])');
        if (first) { first.focus(); }
      }
    }).observe(panel, { attributes: true, attributeFilter: ['class'] });

    document.addEventListener('keydown', function (e) {
      if (!isOpen()) { return; }
      if (e.key === 'Escape' || e.key === 'Esc') { closeMenu(); toggle.focus(); return; }
      if (e.key !== 'Tab') { return; }
      var f = [].slice.call(panel.querySelectorAll('a[href], button, [tabindex]:not([tabindex="-1"])'))
                .filter(function (el) { return el.getBoundingClientRect().width > 0; });
      if (!f.length) { return; }
      if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
    });
  }

  /* ---- 5. Counters ---------------------------------------------------
     jquery.appear can miss its trigger the same way WOW does. Run them
     directly the first time the section is seen. */
  var counters = [].slice.call(document.querySelectorAll('.count'));
  if (counters.length && 'IntersectionObserver' in window) {
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) { return; }
        var el = e.target;
        cio.unobserve(el);
        if (el.dataset.counted) { return; }
        el.dataset.counted = '1';
        var target = parseInt(el.textContent.replace(/\D/g, ''), 10);
        if (!target) { return; }
        if (still) { el.textContent = target; return; }
        var start = null, dur = 1400;
        (function step(ts) {
          if (!start) { start = ts; }
          var k = Math.min((ts - start) / dur, 1);
          el.textContent = Math.ceil(target * (1 - Math.pow(1 - k, 3)));
          if (k < 1) { window.requestAnimationFrame(step); }
        }(performance.now()));
      });
    }, { threshold: 0.2 });
    counters.forEach(function (el) { cio.observe(el); });
  }
}());
