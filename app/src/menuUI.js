import gsap from 'gsap';
import { MENU, formatPrice } from './menu.js';
import { order } from './order.js';

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

export function stepperHTML(item) {
  const qty = order.qty(item.id);
  const name = esc(item.name);
  if (qty === 0) {
    return `<button class="add" type="button" data-act="add" data-id="${item.id}" aria-label="Add ${name} to your booking">Add</button>`;
  }
  return `<div class="stepper" role="group" aria-label="${name} quantity">
    <button type="button" data-act="dec" data-id="${item.id}" aria-label="Remove one ${name}">&minus;</button>
    <output aria-live="polite">${qty}</output>
    <button type="button" data-act="inc" data-id="${item.id}" aria-label="Add one more ${name}">+</button>
  </div>`;
}

/* One click handler for every add / remove button (menu and booking summary). */
export function handleOrderClick(event, afterChange) {
  const btn = event.target.closest('button[data-act]');
  if (!btn) return false;
  const id = btn.dataset.id;
  const act = btn.dataset.act;
  const qty = order.qty(id);
  if (act === 'add' || act === 'inc') order.set(id, qty + 1);
  else if (act === 'dec') order.set(id, qty - 1);
  if (afterChange) afterChange(id, act);
  return true;
}

export function initMenu() {
  const tabsEl = document.querySelector('[data-menu-tabs]');
  const panel = document.querySelector('[data-menu-panel]');
  const chip = document.querySelector('.order-chip');
  const chipCount = document.querySelector('[data-chip-count]');
  if (!tabsEl || !panel) return;

  let active = MENU[0].id;

  function renderTabs() {
    tabsEl.innerHTML = MENU.map(
      (cat) =>
        `<button class="tab" type="button" role="tab" id="tab-${cat.id}" aria-controls="menu-panel"
          aria-selected="${cat.id === active}" tabindex="${cat.id === active ? 0 : -1}" data-cat="${cat.id}">${esc(cat.name)}</button>`
    ).join('');
  }

  function renderPanel(animate) {
    const cat = MENU.find((c) => c.id === active);
    panel.id = 'menu-panel';
    panel.setAttribute('aria-labelledby', `tab-${cat.id}`);
    panel.innerHTML = `
      <p class="menu__intro">${esc(cat.note)}</p>
      <ul class="dishes">
        ${cat.items
          .map(
            (item) => `<li class="dish" data-id="${item.id}">
              <div class="dish__text">
                <h4 class="dish__name">${esc(item.name)}</h4>
                <p class="dish__desc">${esc(item.desc)}</p>
              </div>
              <div class="dish__side">
                ${item.price ? `<span class="dish__price">${formatPrice(item.price)}</span>` : ''}
                <div class="dish__control">${stepperHTML(item)}</div>
              </div>
            </li>`
          )
          .join('')}
      </ul>`;
    if (animate && !reduced) {
      gsap.from(panel.querySelectorAll('.dish'), {
        opacity: 0,
        y: 18,
        duration: 0.5,
        stagger: 0.06,
        ease: 'power3.out',
        clearProps: 'opacity,transform',
      });
    }
  }

  function updateControls() {
    panel.querySelectorAll('.dish').forEach((li) => {
      const item = MENU.flatMap((c) => c.items).find((i) => i.id === li.dataset.id);
      li.querySelector('.dish__control').innerHTML = stepperHTML(item);
    });
    const count = order.count;
    if (chip) {
      chip.hidden = count === 0;
      chipCount.textContent = String(count);
    }
  }

  function selectTab(id, focus) {
    active = id;
    renderTabs();
    renderPanel(true);
    if (focus) tabsEl.querySelector(`[data-cat="${id}"]`).focus();
    window.dispatchEvent(new Event('layout-change'));
  }

  tabsEl.addEventListener('click', (e) => {
    const tab = e.target.closest('[data-cat]');
    if (tab && tab.dataset.cat !== active) selectTab(tab.dataset.cat, true);
  });
  tabsEl.addEventListener('keydown', (e) => {
    const keys = ['ArrowRight', 'ArrowLeft', 'Home', 'End'];
    if (!keys.includes(e.key)) return;
    e.preventDefault();
    const i = MENU.findIndex((c) => c.id === active);
    let next = i;
    if (e.key === 'ArrowRight') next = (i + 1) % MENU.length;
    if (e.key === 'ArrowLeft') next = (i - 1 + MENU.length) % MENU.length;
    if (e.key === 'Home') next = 0;
    if (e.key === 'End') next = MENU.length - 1;
    selectTab(MENU[next].id, true);
  });

  panel.addEventListener('click', (e) => {
    handleOrderClick(e, (id) => {
      updateControls();
      // The clicked button was replaced, so put keyboard focus back on its replacement.
      const li = panel.querySelector(`.dish[data-id="${id}"]`);
      const target = li && (li.querySelector('[data-act="inc"]') || li.querySelector('[data-act="add"]'));
      if (target) target.focus();
    });
  });

  order.subscribe(updateControls);
  renderTabs();
  renderPanel(false);
  updateControls();
}
