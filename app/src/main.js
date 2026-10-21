import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin';
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';
import '@fontsource-variable/syne';
import '@fontsource-variable/instrument-sans';
import './styles.css';

import { CONFIG } from './config.js';
import { createWater } from './water.js';
import { initCursor, initMagnetic } from './cursor.js';

gsap.registerPlugin(ScrollTrigger, SplitText, DrawSVGPlugin);

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- Contact details from config.js ---------- */
function bindContact() {
  const { phone, whatsapp, email, address, hours, whatsappMessage } = CONFIG;
  const digits = (v) => String(v).replace(/[^\d+]/g, '');
  let any = false;

  $$('[data-contact="whatsapp"]').forEach((el) => {
    if (!whatsapp) return;
    el.href = `https://wa.me/${digits(whatsapp).replace('+', '')}?text=${encodeURIComponent(whatsappMessage)}`;
    el.target = '_blank';
    el.rel = 'noopener';
    el.hidden = false;
    any = true;
  });
  $$('[data-contact="call"]').forEach((el) => {
    if (!phone) return;
    el.href = `tel:${digits(phone)}`;
    if (el.closest('.footer')) el.textContent = phone;
    el.hidden = false;
    any = true;
  });
  $$('[data-contact="email"]').forEach((el) => {
    if (!email) return;
    el.href = `mailto:${email}`;
    if (el.closest('.footer')) el.textContent = email;
    el.hidden = false;
    any = true;
  });
  const hoursEl = $('[data-config="hours"]');
  if (hoursEl && hours) hoursEl.textContent = hours;
  const addrEl = $('[data-config="address"]');
  if (addrEl && address) {
    addrEl.textContent = address;
    addrEl.hidden = false;
  }
  const soon = $('[data-contact-empty]');
  if (soon) soon.hidden = any;
  const year = $('[data-year]');
  if (year) year.textContent = new Date().getFullYear();
}

/* ---------- Helpers ---------- */
function formatClock(hours24) {
  const total = Math.round(hours24 * 12) / 12; // snap to 5 minutes
  const h = Math.floor(total) % 24;
  const m = Math.round((total - Math.floor(total)) * 60);
  const suffix = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, '0')} ${suffix}`;
}

function revealLines(root, trigger = root, start = 'top 85%') {
  const inners = $$('.line__inner', root);
  if (!inners.length) return;
  gsap.set(inners, { yPercent: 110 });
  gsap.to(inners, {
    yPercent: 0,
    duration: 1.1,
    ease: 'expo.out',
    stagger: 0.12,
    scrollTrigger: { trigger, start, once: true },
  });
}

/* ---------- Boot ---------- */
async function boot() {
  bindContact();
  initCursor();
  initMagnetic();

  const water = createWater($('#water'), { reduced });

  try {
    await Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 1500))]);
  } catch (e) {
    /* fonts API unavailable: carry on */
  }

  /* Smooth scrolling (skipped when the visitor prefers reduced motion) */
  let lenis = null;
  if (!reduced) {
    lenis = new Lenis({ lerp: 0.085, wheelMultiplier: 0.95, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  $$('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      const target = id.length > 1 ? $(id) : null;
      if (!target) return;
      e.preventDefault();
      if (lenis) lenis.scrollTo(target, { duration: 1.6, easing: (t) => 1 - Math.pow(1 - t, 4) });
      else target.scrollIntoView();
      history.replaceState(null, '', id);
    });
  });

  /* ---------- Water follows the pointer and the scroll ---------- */
  let lastRipple = { x: -999, y: -999 };
  window.addEventListener(
    'pointermove',
    (e) => {
      const dx = e.clientX - lastRipple.x;
      const dy = e.clientY - lastRipple.y;
      if (dx * dx + dy * dy < 70 * 70) return;
      lastRipple = { x: e.clientX, y: e.clientY };
      water.ripple(e.clientX, e.clientY, 0.7);
      water.addEnergy(0.15);
    },
    { passive: true }
  );
  window.addEventListener('pointerdown', (e) => {
    water.ripple(e.clientX, e.clientY, 1.3);
    water.addEnergy(0.5);
  });

  const waterZones = new Set();
  const syncWater = () => water.setActive(waterZones.size > 0);
  $$('[data-water]').forEach((zone) => {
    ScrollTrigger.create({
      trigger: zone,
      start: 'top bottom',
      end: 'bottom top',
      onToggle: (self) => {
        if (self.isActive) waterZones.add(zone);
        else waterZones.delete(zone);
        syncWater();
      },
    });
  });

  let lastScrollRipple = 0;
  const onScroll = (velocity) => {
    const v = Math.abs(velocity);
    if (v < 0.4) return;
    water.addEnergy(Math.min(v * 0.02, 0.25));
    const t = performance.now();
    if (v > 1.5 && t - lastScrollRipple > 380) {
      lastScrollRipple = t;
      water.ripple(Math.random() * window.innerWidth, Math.random() * window.innerHeight * 0.8, 0.55);
    }
  };
  if (lenis) lenis.on('scroll', ({ velocity }) => onScroll(velocity));

  /* ---------- Nav colour on light sections ---------- */
  $$('.on-light').forEach((section) => {
    ScrollTrigger.create({
      trigger: section,
      start: 'top 48px',
      end: 'bottom 48px',
      onToggle: (self) => document.body.classList.toggle('nav-light', self.isActive),
    });
  });

  /* ---------- Scroll level (pool filling up) ---------- */
  gsap.to('.level__fill', {
    scaleY: 1,
    ease: 'none',
    scrollTrigger: { start: 0, end: 'max', scrub: 0.3 },
  });

  /* ---------- Hero entrance ---------- */
  const heroInners = $$('.hero__title .line__inner');
  const heroLoad = gsap.timeline({ defaults: { ease: 'expo.out' } });
  if (!reduced) {
    gsap.set(heroInners, { yPercent: 110 });
    gsap.set(['.hero__sub', '.hero__cta', '.hero__hint', '.nav'], { opacity: 0, y: 24 });
    heroLoad
      .to(heroInners, { yPercent: 0, duration: 1.5, stagger: 0.14 }, 0.15)
      .to('.nav', { opacity: 1, y: 0, duration: 1 }, 0.6)
      .to('.hero__sub', { opacity: 1, y: 0, duration: 1 }, 0.9)
      .to('.hero__cta', { opacity: 1, y: 0, duration: 1 }, 1.0)
      .to('.hero__hint', { opacity: 1, y: 0, duration: 1 }, 1.1);
  }

  const mm = gsap.matchMedia();

  mm.add('(prefers-reduced-motion: no-preference)', () => {
    /* Hero drifts away as you scroll */
    gsap.to('.hero__inner', {
      yPercent: -14,
      opacity: 0.1,
      ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true },
    });

    /* The house: words light up, the villa draws itself */
    const split = SplitText.create('.house__text', { type: 'words' });
    gsap.fromTo(
      split.words,
      { opacity: 0.12 },
      {
        opacity: 1,
        ease: 'none',
        stagger: 0.12,
        scrollTrigger: { trigger: '.house__text', start: 'top 78%', end: 'bottom 45%', scrub: 0.6 },
      }
    );
    gsap.from('[data-draw]', {
      drawSVG: 0,
      ease: 'none',
      stagger: 0.14,
      scrollTrigger: { trigger: '.villa', start: 'top 85%', end: 'bottom 45%', scrub: 0.8 },
    });

    /* One night: pinned, sideways, with the sky changing colour and the clock ticking */
    const scenes = $$('.scene');
    const count = scenes.length;
    const sky = $('.night__sky');
    const clock = $('.night__time');
    const bar = $('.night__progress span');
    const track = $('.night__track');
    track.style.setProperty('--n', count);

    gsap.set(sky, { '--sky-top': '#2b3a67', '--sky-bot': '#f4a261' });
    let activeIndex = 0;
    scenes.forEach((s, n) => s.classList.toggle('is-active', n === 0));

    const night = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: {
        trigger: '.night',
        pin: true,
        scrub: 0.8,
        start: 'top top',
        end: () => '+=' + Math.round((count - 1) * window.innerHeight * 0.95),
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          const i = self.progress * (count - 1);
          clock.textContent = formatClock(17 + 2 * i);
          gsap.set(bar, { scaleX: self.progress });
          const idx = Math.round(i);
          if (idx !== activeIndex) {
            activeIndex = idx;
            scenes.forEach((s, n) => s.classList.toggle('is-active', n === idx));
          }
        },
      },
    });
    night
      .to(track, { x: () => -(count - 1) * window.innerWidth, duration: 1 }, 0)
      .to(sky, { '--sky-top': '#1b2350', '--sky-bot': '#b85c7a', duration: 0.2 }, 0)
      .to(sky, { '--sky-top': '#071a2b', '--sky-bot': '#0b4a5c', duration: 0.2 }, 0.2)
      .to(sky, { '--sky-top': '#0a0a22', '--sky-bot': '#4a1f66', duration: 0.2 }, 0.4)
      .to(sky, { '--sky-top': '#03060e', '--sky-bot': '#14233a', duration: 0.2 }, 0.6)
      .to(sky, { '--sky-top': '#010204', '--sky-bot': '#0b1320', duration: 0.2 }, 0.8)
      .to('.sun', { y: () => window.innerHeight, duration: 0.3 }, 0.02)
      .fromTo('.moon', { y: () => window.innerHeight }, { y: 0, duration: 0.35 }, 0.25)
      .fromTo('.stars', { opacity: 0 }, { opacity: 1, duration: 0.3 }, 0.12);

    /* The pool: the deck opens like a window until the water fills the screen */
    const pool = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: {
        trigger: '.pool',
        pin: true,
        scrub: 0.7,
        start: 'top top',
        end: '+=110%',
        // The nav sits on the light deck at first, then on dark water.
        onUpdate: (self) => document.body.classList.toggle('nav-light', self.progress < 0.45),
        onToggle: (self) => {
          if (!self.isActive) document.body.classList.remove('nav-light');
        },
      },
    });
    pool
      .fromTo(
        '.pool__deck',
        { left: '14vw', right: '14vw', top: '16vh', bottom: '16vh', borderRadius: 56 },
        { left: '0vw', right: '0vw', top: '0vh', bottom: '0vh', borderRadius: 0, duration: 0.7 },
        0
      )
      .fromTo('.pool__copy', { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.3 }, 0.55);

    /* Menu */
    const menuSplit = SplitText.create('.menu__title', {
      type: 'lines',
      mask: 'lines',
      autoSplit: true,
      onSplit(self) {
        return gsap.from(self.lines, {
          yPercent: 110,
          duration: 1.1,
          ease: 'expo.out',
          stagger: 0.1,
          scrollTrigger: { trigger: '.menu__title', start: 'top 85%', once: true },
        });
      },
    });
    $$('.menu__group').forEach((group) => {
      gsap.from($$('.dish', group), {
        opacity: 0,
        y: 28,
        duration: 0.9,
        ease: 'power3.out',
        stagger: 0.08,
        scrollTrigger: { trigger: group, start: 'top 80%', once: true },
      });
    });

    /* Book */
    revealLines($('.book__title'), '.book', 'top 65%');
    gsap.from('.party', {
      opacity: 0,
      x: 30,
      duration: 0.9,
      ease: 'power3.out',
      stagger: 0.1,
      scrollTrigger: { trigger: '.parties', start: 'top 80%', once: true },
    });

    /* Footer marquee reacts to scroll speed and direction */
    const row = $('.marquee__row');
    const groupWidth = () => row.firstElementChild.offsetWidth;
    let x = 0;
    gsap.ticker.add((time, delta) => {
      const velocity = lenis ? lenis.velocity : 0;
      const dir = lenis && lenis.direction < 0 ? -1 : 1;
      x -= (50 + Math.abs(velocity) * 45) * (delta / 1000) * dir;
      const w = groupWidth();
      if (w) {
        if (x <= -w) x += w;
        if (x > 0) x -= w;
      }
      row.style.transform = `translate3d(${x}px,0,0)`;
    });

    return () => {
      split.revert();
      menuSplit.revert();
    };
  });

  mm.add('(prefers-reduced-motion: reduce)', () => {
    $('.night__time').textContent = '';
    $$('.scene').forEach((s) => s.classList.add('is-active'));
  });

  if (!reduced) {
    window.addEventListener('load', () => ScrollTrigger.refresh());
  }
}

boot();
