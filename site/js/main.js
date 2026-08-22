/* Miguel's Restaurante — hero scroll choreography.
   The hero is a 180vh section with a sticky 100vh stage. As it scrolls the
   headline and nav fade out, the veil lifts, and the video un-zooms and
   brightens — so the food is what's left on screen at the handoff. */

(function () {
  'use strict';

  var HERO_DARKNESS = 0.5; // starting brightness of the video
  var PHONE_MAX_WIDTH = 700; // below this, use the portrait clip/poster instead

  var stick  = document.querySelector('[data-hero-stick]');
  var video  = document.querySelector('[data-hero-video]');
  var veil   = document.querySelector('[data-hero-veil]');
  var body   = document.querySelector('[data-hero-body]');

  if (!stick) {
    /* No hero on this page to compete with the call bar's CTA — show it right away. */
    var callbarNoHero = document.querySelector('.callbar');
    if (callbarNoHero) callbarNoHero.classList.add('is-visible');
    return;
  }

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* Autoplay: iOS needs muted + playsinline set on the element, not just the
     attribute, and will still refuse until the media is actually ready. */
  function nudgePlay() {
    if (!video) return;
    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;
    var p = video.play();
    if (p && p.catch) p.catch(function () {});
  }

  /* The clip is the single heaviest asset on the page and it sits behind a veil
     at half brightness. It is a garnish, so it loads like one: never before the
     page is done, never on a metered connection, never when the visitor has
     asked for less motion. The poster carries the hero either way. */
  function videoEarnsItsBytes() {
    if (!video) return false;
    if (reduced.matches) return false;
    var conn = navigator.connection;
    if (conn && (conn.saveData || /2g/.test(conn.effectiveType || ''))) return false;
    return true;
  }

  /* Phones get the portrait clip/poster shot for their screen shape; tablets
     and desktops keep the landscape one this hero was designed around. */
  function wantsPortrait() {
    return window.innerWidth <= PHONE_MAX_WIDTH && video.hasAttribute('data-src-portrait');
  }

  function applyPoster() {
    if (!video) return;
    if (wantsPortrait()) {
      video.setAttribute('poster', video.getAttribute('data-poster-portrait'));
      video.classList.add('is-portrait');
    } else {
      video.classList.remove('is-portrait');
    }
  }
  applyPoster();

  function loadVideo() {
    if (!videoEarnsItsBytes() || video.getAttribute('src')) return;
    var portrait = wantsPortrait();
    var src = video.getAttribute(portrait ? 'data-src-portrait' : 'data-src');
    if (!src) return;
    video.addEventListener('canplay', nudgePlay);
    video.addEventListener('loadeddata', nudgePlay);
    video.setAttribute('src', src);
    video.load();
  }

  function whenIdle(fn) {
    if (window.requestIdleCallback) requestIdleCallback(fn, { timeout: 2500 });
    else setTimeout(fn, 900);
  }

  if (document.readyState === 'complete') whenIdle(loadVideo);
  else window.addEventListener('load', function () { whenIdle(loadVideo); });

  var clamp01 = function (n) { return Math.max(0, Math.min(1, n)); };

  function frame() {
    var section = stick.parentElement;
    if (!section) return;

    var travelled = -section.getBoundingClientRect().top;
    var scrollRoom = Math.max(1, section.offsetHeight - window.innerHeight);
    var raw = clamp01(travelled / scrollRoom);

    var textP  = clamp01((raw - 0.22) / 0.22);  // copy fades first
    var reveal = clamp01((raw - 0.22) / 0.5);   // then the image opens up

    if (body) {
      body.style.opacity = String(1 - textP);
      body.style.pointerEvents = textP > 0.6 ? 'none' : 'auto';
    }
    if (veil) veil.style.opacity = String(0.86 - reveal * 0.72);
    if (video) {
      video.style.filter = 'brightness(' + (HERO_DARKNESS + (0.98 - HERO_DARKNESS) * reveal) + ') saturate(1.05)';
      var isPortrait = video.classList.contains('is-portrait');
      video.style.transform = isPortrait ? 'scale(1)' : 'scale(' + (1.18 - reveal * 0.18) + ')';
    }
  }

  /* Phone action bar: reveal it once the hero's own CTA is gone, so the two
     never ask for the same tap at the same time. */
  var callbar = document.querySelector('.callbar');
  function syncCallbar() {
    if (!callbar) return;
    var section = stick.parentElement;
    if (!section) return;
    var past = section.getBoundingClientRect().bottom < window.innerHeight * 0.6;
    callbar.classList.toggle('is-visible', past);
  }

  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      frame();
      syncCallbar();
      ticking = false;
    });
  }

  function start() {
    window.removeEventListener('scroll', syncCallbar);
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    frame();
    syncCallbar();
  }

  function stop() {
    window.removeEventListener('scroll', onScroll);
    window.removeEventListener('resize', onScroll);
    /* Hand the hero back to the stylesheet's static state. */
    [body, veil, video].forEach(function (el) {
      if (el) el.removeAttribute('style');
    });
    if (video) video.pause();
    /* the bar is not decoration — it stays, it just stops animating in */
    window.addEventListener('scroll', syncCallbar, { passive: true });
    syncCallbar();
  }

  function apply() { reduced.matches ? stop() : start(); }

  apply();
  if (reduced.addEventListener) reduced.addEventListener('change', apply);
})();

/* Ambient clips further down the page (the story section's grill loop).
   Same bargain as the hero: the poster is the real asset and the motion is a
   garnish, so the bytes only load when the clip is actually about to be seen —
   and never for a visitor who asked for less motion or is paying by the megabyte.
   Off-screen clips are paused rather than left looping into a dead battery. */
(function () {
  'use strict';

  var PHONE_MAX_WIDTH = 700; // matches the hero's own portrait cutover

  var videos = document.querySelectorAll('[data-ambient-video]');
  if (!videos.length) return;

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* Phones get their own encode: smaller, and in the band's case re-framed for a
     near-square section that would otherwise crop 40% of a 16:9 frame away.
     Swapping the poster too keeps the still and the clip showing the same shot. */
  function isPhone() {
    return window.innerWidth <= PHONE_MAX_WIDTH;
  }

  function sourceFor(video) {
    var mobile = video.getAttribute('data-src-mobile');
    return (isPhone() && mobile) ? mobile : video.getAttribute('data-src');
  }

  function applyPoster(video) {
    var mobilePoster = video.getAttribute('data-poster-mobile');
    if (isPhone() && mobilePoster) video.setAttribute('poster', mobilePoster);
  }
  videos.forEach(applyPoster);

  function earnsItsBytes() {
    if (reduced.matches) return false;
    var conn = navigator.connection;
    if (conn && (conn.saveData || /2g/.test(conn.effectiveType || ''))) return false;
    return true;
  }

  /* No IntersectionObserver means an old browser that is better off with the
     poster than with a clip we cannot schedule politely. */
  if (!window.IntersectionObserver || !earnsItsBytes()) return;

  function play(video) {
    video.muted = true;
    video.playsInline = true;
    var p = video.play();
    if (p && p.catch) p.catch(function () {});
  }

  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      var video = entry.target;
      if (!entry.isIntersecting) {
        if (video.getAttribute('src')) video.pause();
        return;
      }
      if (!video.getAttribute('src')) {
        video.addEventListener('canplay', function () { play(video); });
        video.setAttribute('src', sourceFor(video));
        video.load();
        return;
      }
      play(video);
    });
  }, { rootMargin: '200px 0px' });

  videos.forEach(function (video) { observer.observe(video); });

  /* If the visitor flips on reduce-motion mid-visit, stop honouring the loop. */
  function onPreferenceChange() {
    if (!reduced.matches) return;
    videos.forEach(function (video) {
      observer.unobserve(video);
      video.pause();
    });
  }
  if (reduced.addEventListener) reduced.addEventListener('change', onPreferenceChange);
})();

/* Mobile topbar: below 1000px the nav collapses behind a hamburger toggle
   (see the fixed topbar's mobile styles in styles.css). */
(function () {
  'use strict';

  var topbar = document.querySelector('[data-topbar]');
  var toggle = document.querySelector('[data-topbar-toggle]');
  if (!topbar || !toggle) return;

  function setOpen(open) {
    topbar.setAttribute('data-open', open ? 'true' : 'false');
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  }

  toggle.addEventListener('click', function () {
    setOpen(topbar.getAttribute('data-open') !== 'true');
  });

  topbar.querySelectorAll('.topbar__link').forEach(function (link) {
    link.addEventListener('click', function () { setOpen(false); });
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') setOpen(false);
  });

  document.addEventListener('click', function (e) {
    if (!topbar.contains(e.target)) setOpen(false);
  });
})();
