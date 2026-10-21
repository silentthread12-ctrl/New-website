import gsap from 'gsap';

const GROW = 'a, button, [data-cursor="grow"], .dish, .party';

export function hasFinePointer() {
  return window.matchMedia('(hover: hover) and (pointer: fine)').matches;
}

export function initCursor() {
  if (!hasFinePointer()) return;

  const root = document.querySelector('.cursor');
  const ring = root.querySelector('.cursor__ring');
  const dot = root.querySelector('.cursor__dot');
  document.documentElement.classList.add('has-cursor');

  gsap.set([ring, dot], { xPercent: -50, yPercent: -50 });
  const ringX = gsap.quickTo(ring, 'x', { duration: 0.5, ease: 'power3' });
  const ringY = gsap.quickTo(ring, 'y', { duration: 0.5, ease: 'power3' });
  const dotX = gsap.quickTo(dot, 'x', { duration: 0.1, ease: 'power3' });
  const dotY = gsap.quickTo(dot, 'y', { duration: 0.1, ease: 'power3' });

  window.addEventListener(
    'pointermove',
    (e) => {
      ringX(e.clientX);
      ringY(e.clientY);
      dotX(e.clientX);
      dotY(e.clientY);
      document.documentElement.classList.add('cursor-visible');
    },
    { passive: true }
  );
  document.documentElement.addEventListener('pointerleave', () =>
    document.documentElement.classList.remove('cursor-visible')
  );
  document.addEventListener('pointerover', (e) => {
    if (e.target.closest && e.target.closest(GROW)) document.documentElement.classList.add('cursor-grow');
  });
  document.addEventListener('pointerout', (e) => {
    if (e.target.closest && e.target.closest(GROW)) document.documentElement.classList.remove('cursor-grow');
  });
  window.addEventListener('pointerdown', () => document.documentElement.classList.add('cursor-down'));
  window.addEventListener('pointerup', () => document.documentElement.classList.remove('cursor-down'));
}

export function initMagnetic() {
  if (!hasFinePointer()) return;
  document.querySelectorAll('[data-magnetic]').forEach((el) => {
    const xTo = gsap.quickTo(el, 'x', { duration: 0.7, ease: 'elastic.out(1, 0.5)' });
    const yTo = gsap.quickTo(el, 'y', { duration: 0.7, ease: 'elastic.out(1, 0.5)' });
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      xTo((e.clientX - (r.left + r.width / 2)) * 0.35);
      yTo((e.clientY - (r.top + r.height / 2)) * 0.35);
    });
    el.addEventListener('pointerleave', () => {
      xTo(0);
      yTo(0);
    });
  });
}
