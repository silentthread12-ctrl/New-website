// The menu. Edit names, descriptions and prices here.
// Add a price as a number (example: price: 350) and it shows as "NPR 350".
// Items without a price show no price.
// These dishes are samples until you replace them with your real menu.
export const MENU = [
  {
    id: 'nepali',
    name: 'Nepali sets',
    note: 'Traditional meals, served as a set.',
    items: [{ id: 'nanglo-set', name: 'Nanglo set', desc: 'Traditional Nepali set meal' }],
  },
  {
    id: 'grill',
    name: 'From the grill',
    note: 'Over charcoal, served with flatbread.',
    items: [
      { id: 'charcoal-chicken', name: 'Charcoal chicken', desc: 'Lime, chili salt, grilled onions' },
      { id: 'lamb-chops', name: 'Lamb chops', desc: 'Garlic, mint, warm flatbread' },
      { id: 'grilled-fish', name: 'Whole grilled fish', desc: 'Lemon, herbs, charred greens' },
      { id: 'paneer-tikka', name: 'Paneer tikka', desc: 'Smoked in the tandoor, mint chutney' },
    ],
  },
  {
    id: 'small',
    name: 'Small plates',
    note: 'Made for sharing at the table.',
    items: [
      { id: 'hummus', name: 'Hummus', desc: 'Olive oil, paprika, warm flatbread' },
      { id: 'calamari', name: 'Crispy calamari', desc: 'Lemon aioli' },
      { id: 'corn-ribs', name: 'Corn ribs', desc: 'Chili butter, lime' },
      { id: 'mushroom-skewers', name: 'Mushroom skewers', desc: 'Garlic, parsley, smoked salt' },
    ],
  },
  {
    id: 'late',
    name: 'Late kitchen',
    note: 'Hot plates for the end of the night.',
    items: [
      { id: 'garlic-noodles', name: 'Chili garlic noodles', desc: 'Spring onion, fried egg' },
      { id: 'hot-wings', name: 'Hot wings', desc: 'Honey chili glaze, cooling dip' },
      { id: 'cheese-fries', name: 'Cheese fries', desc: 'Melted cheese, pickled jalapeño' },
      { id: 'egg-fried-rice', name: 'Egg fried rice', desc: 'Vegetables, soy, sesame' },
    ],
  },
  {
    id: 'drinks',
    name: 'Drinks',
    note: 'Every cocktail also comes without alcohol.',
    items: [
      { id: 'pool-light', name: 'Pool Light', desc: 'Gin, cucumber, mint, tonic' },
      { id: 'house-spritz', name: 'White House Spritz', desc: 'Sparkling wine, orange, soda' },
      { id: 'midnight-mule', name: 'Midnight Mule', desc: 'Vodka, ginger beer, lime' },
      { id: 'mango-cooler', name: 'Mango Cooler', desc: 'Mango, lime, soda' },
    ],
  },
];

const byId = new Map();
MENU.forEach((cat) => cat.items.forEach((item) => byId.set(item.id, item)));

export function findItem(id) {
  return byId.get(id);
}

export function formatPrice(price) {
  return typeof price === 'number' ? `NPR ${price.toLocaleString('en-US')}` : '';
}
