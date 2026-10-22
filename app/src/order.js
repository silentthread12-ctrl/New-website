// The guest's pre-order, shared by the menu and the booking form.
const items = new Map();
const listeners = new Set();
const MAX_PER_ITEM = 99;

function notify() {
  listeners.forEach((fn) => fn());
}

export const order = {
  get count() {
    let total = 0;
    items.forEach((qty) => (total += qty));
    return total;
  },
  qty(id) {
    return items.get(id) || 0;
  },
  set(id, qty) {
    if (qty <= 0) items.delete(id);
    else items.set(id, Math.min(qty, MAX_PER_ITEM));
    notify();
  },
  entries() {
    return Array.from(items.entries());
  },
  clear() {
    items.clear();
    notify();
  },
  subscribe(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },
};
