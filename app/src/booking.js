import { CONFIG } from './config.js';
import { order } from './order.js';
import { findItem } from './menu.js';
import { stepperHTML, handleOrderClick } from './menuUI.js';

const $ = (sel, root = document) => root.querySelector(sel);

const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

function todayISO() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function prettyDate(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function prettyTime(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  const suffix = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, '0')} ${suffix}`;
}

export function initBooking() {
  const form = $('#booking-form');
  if (!form) return;

  const fields = $('[data-fields]', form);
  const done = $('[data-done]', form);
  const areaSelect = $('#b-area', form);
  const occasionSelect = $('#b-occasion', form);
  const dateInput = $('#b-date', form);
  const list = $('[data-preorder-list]', form);
  const empty = $('[data-preorder-empty]', form);
  const submit = $('[data-submit]', form);
  const hasWhatsApp = Boolean(CONFIG.whatsapp);

  areaSelect.innerHTML = CONFIG.tableAreas.map((a) => `<option>${esc(a)}</option>`).join('');
  occasionSelect.innerHTML = CONFIG.occasions.map((o) => `<option>${esc(o)}</option>`).join('');
  dateInput.min = todayISO();
  submit.textContent = hasWhatsApp ? 'Send booking on WhatsApp' : 'Get my booking details';

  /* Links elsewhere on the page can pre-select a table area. */
  document.querySelectorAll('[data-area]').forEach((el) => {
    el.addEventListener('click', () => {
      const wanted = el.dataset.area;
      const option = Array.from(areaSelect.options).find((o) => o.value === wanted);
      if (option) areaSelect.value = wanted;
    });
  });

  /* Pre-order summary */
  function renderPreorder() {
    const entries = order.entries();
    empty.hidden = entries.length > 0;
    list.innerHTML = entries
      .map(([id]) => {
        const item = findItem(id);
        return item
          ? `<li class="preorder__item"><span>${esc(item.name)}</span>${stepperHTML(item)}</li>`
          : '';
      })
      .join('');
    window.dispatchEvent(new Event('layout-change'));
  }
  list.addEventListener('click', (e) => {
    handleOrderClick(e, (id) => {
      const li = Array.from(list.children).find((n) => n.querySelector(`[data-id="${id}"]`));
      const target = li && li.querySelector('[data-act="inc"]');
      if (target) target.focus();
      else if (submit) submit.focus();
    });
  });
  order.subscribe(renderPreorder);
  renderPreorder();

  /* Validation */
  function read() {
    const value = (id) => form.elements[id].value.trim();
    return {
      name: value('name'),
      phone: value('phone'),
      date: value('date'),
      time: value('time'),
      guests: value('guests'),
      area: value('area'),
      occasion: value('occasion'),
      notes: value('notes'),
    };
  }

  function validate(data) {
    const errors = {};
    if (data.name.length < 2) errors.name = 'Enter your name.';
    const digits = data.phone.replace(/\D/g, '');
    if (digits.length < 7 || digits.length > 15) errors.phone = 'Enter a phone number we can reach you on.';
    if (!data.date) errors.date = 'Pick a date.';
    else if (data.date < todayISO()) errors.date = 'Pick today or a later date.';
    if (!data.time) errors.time = 'Pick an arrival time.';
    const guests = Number(data.guests);
    if (!Number.isInteger(guests) || guests < 1 || guests > 500) {
      errors.guests = 'Enter how many people are coming, from 1 to 500.';
    }
    return errors;
  }

  function showErrors(errors) {
    ['name', 'phone', 'date', 'time', 'guests'].forEach((key) => {
      const input = form.elements[key];
      const msg = $(`[data-err="${key}"]`, form);
      msg.textContent = errors[key] || '';
      if (errors[key]) input.setAttribute('aria-invalid', 'true');
      else input.removeAttribute('aria-invalid');
    });
  }

  form.addEventListener('input', (e) => {
    const key = e.target.name;
    const msg = $(`[data-err="${key}"]`, form);
    if (msg && msg.textContent) {
      const errors = validate(read());
      msg.textContent = errors[key] || '';
      if (!errors[key]) e.target.removeAttribute('aria-invalid');
    }
  });

  /* Message that goes to WhatsApp (or is copied) */
  function buildMessage(data) {
    const lines = [
      'Table booking request: White House',
      `Name: ${data.name}`,
      `Phone: ${data.phone}`,
      `Date: ${prettyDate(data.date)}`,
      `Time: ${prettyTime(data.time)}`,
      `Guests: ${Number(data.guests)}`,
      `Table: ${data.area}`,
      `Occasion: ${data.occasion}`,
    ];
    const entries = order.entries();
    if (entries.length) {
      const dishes = entries
        .map(([id, qty]) => {
          const item = findItem(id);
          return item ? `${qty} x ${item.name}` : null;
        })
        .filter(Boolean)
        .join(', ');
      lines.push(`Pre-order: ${dishes}`);
    }
    if (data.notes) lines.push(`Notes: ${data.notes}`);
    return lines.join('\n');
  }

  const waLink = (text) =>
    `https://wa.me/${CONFIG.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(text)}`;

  function showDone(message) {
    const phoneDigits = CONFIG.phone ? CONFIG.phone.replace(/[^\d+]/g, '') : '';
    done.innerHTML = `
      <h4 class="done__title">${hasWhatsApp ? 'Your request is ready to send' : 'Your booking details are ready'}</h4>
      <p class="done__text">${
        hasWhatsApp
          ? 'WhatsApp should have opened with your details. Press send to finish. We confirm your table by reply. If nothing opened, use the button below.'
          : 'Copy these details and send them to us, or call to book. We confirm your table by reply.'
      }</p>
      <pre class="done__summary">${esc(message)}</pre>
      <div class="done__actions">
        ${hasWhatsApp ? `<a class="btn btn--ink" href="${waLink(message)}" target="_blank" rel="noopener">Open WhatsApp</a>` : ''}
        <button class="btn btn--outline" type="button" data-copy>Copy details</button>
        ${phoneDigits ? `<a class="btn btn--text" href="tel:${phoneDigits}">Call us</a>` : ''}
      </div>
      <p class="done__status" role="status" data-copy-status></p>
      <button class="linkbtn" type="button" data-edit>Change my details</button>`;
    fields.hidden = true;
    done.hidden = false;
    done.focus();
    window.dispatchEvent(new Event('layout-change'));

    const copyBtn = $('[data-copy]', done);
    copyBtn.addEventListener('click', async () => {
      const status = $('[data-copy-status]', done);
      try {
        await navigator.clipboard.writeText(message);
        status.textContent = 'Copied. Paste it into a message to us.';
      } catch (err) {
        const range = document.createRange();
        range.selectNodeContents($('.done__summary', done));
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
        status.textContent = 'Select the text above and copy it.';
      }
    });
    $('[data-edit]', done).addEventListener('click', () => {
      done.hidden = true;
      fields.hidden = false;
      form.elements.name.focus();
      window.dispatchEvent(new Event('layout-change'));
    });
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const data = read();
    const errors = validate(data);
    showErrors(errors);
    const firstBad = ['name', 'phone', 'date', 'time', 'guests'].find((k) => errors[k]);
    if (firstBad) {
      form.elements[firstBad].focus();
      return;
    }
    const message = buildMessage(data);
    if (hasWhatsApp) window.open(waLink(message), '_blank', 'noopener');
    showDone(message);
  });
}
