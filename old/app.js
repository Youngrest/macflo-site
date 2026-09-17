const slides = [...document.querySelectorAll('.slide')];
const track = document.querySelector('.slides');
const carousel = document.querySelector('.carousel');
let currentSlide = 0;
let autoplayTimer;
let swipeStartX = 0;
let swipeStartY = 0;
let activePointerId = null;
let suppressClick = false;

function showSlide(index) {
  currentSlide = (index + slides.length) % slides.length;
  track.style.transform = `translateX(-${currentSlide * 100}%)`;
  slides.forEach((slide, i) => {
    const hidden = i !== currentSlide;
    slide.setAttribute('aria-hidden', String(hidden));
    slide.inert = hidden;
  });
}

function stopAutoplay() { window.clearInterval(autoplayTimer); }
function startAutoplay() {
  stopAutoplay();
  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    autoplayTimer = window.setInterval(() => showSlide(currentSlide + 1), 6000);
  }
}

carousel.addEventListener('pointerdown', (event) => {
  if (!event.isPrimary) return;
  activePointerId = event.pointerId;
  swipeStartX = event.clientX;
  swipeStartY = event.clientY;
  carousel.classList.add('is-swiping');
  stopAutoplay();
});

function finishSwipe(event) {
  if (event.pointerId !== activePointerId) return;
  const deltaX = event.clientX - swipeStartX;
  const deltaY = event.clientY - swipeStartY;
  if (Math.abs(deltaX) > 50 && Math.abs(deltaX) > Math.abs(deltaY) * 1.15) {
    showSlide(deltaX < 0 ? currentSlide + 1 : currentSlide - 1);
    suppressClick = true;
    window.setTimeout(() => { suppressClick = false; }, 120);
  }
  activePointerId = null;
  carousel.classList.remove('is-swiping');
  startAutoplay();
}

carousel.addEventListener('pointerup', finishSwipe);
carousel.addEventListener('pointercancel', (event) => {
  if (event.pointerId !== activePointerId) return;
  activePointerId = null;
  carousel.classList.remove('is-swiping');
  startAutoplay();
});
carousel.addEventListener('click', (event) => {
  if (suppressClick) event.preventDefault();
}, true);
carousel.addEventListener('mouseenter', stopAutoplay);
carousel.addEventListener('mouseleave', startAutoplay);
carousel.addEventListener('focusin', stopAutoplay);
carousel.addEventListener('focusout', startAutoplay);
carousel.addEventListener('keydown', (event) => {
  if (event.key === 'ArrowLeft') showSlide(currentSlide - 1);
  if (event.key === 'ArrowRight') showSlide(currentSlide + 1);
});
document.addEventListener('visibilitychange', () => document.hidden ? stopAutoplay() : startAutoplay());
showSlide(0);
startAutoplay();

const filterButtons = [...document.querySelectorAll('.filter-button')];
const productCards = [...document.querySelectorAll('.product-card')];
filterButtons.forEach((button) => button.addEventListener('click', () => {
  const filter = button.dataset.filter;
  filterButtons.forEach((item) => {
    const active = item === button;
    item.classList.toggle('is-active', active);
    item.setAttribute('aria-pressed', String(active));
  });
  productCards.forEach((product) => {
    product.hidden = product.dataset.category !== filter;
  });
}));

const menuButton = document.querySelector('.menu-toggle');
const menu = document.querySelector('.site-nav');
menuButton.addEventListener('click', () => {
  const open = menu.classList.toggle('is-open');
  menuButton.setAttribute('aria-expanded', String(open));
});
menu.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => {
  menu.classList.remove('is-open');
  menuButton.setAttribute('aria-expanded', 'false');
}));

const products = new Map(productCards.map((card) => [card.dataset.id, {
  id: card.dataset.id,
  name: card.dataset.name,
  price: Number(card.dataset.price),
  emoji: card.querySelector('.placeholder-emoji')?.textContent || '💐'
}]));
const cart = new Map();
const cartButton = document.querySelector('.cart-button');
const cartCount = document.querySelector('.cart-count');
const cartDrawer = document.querySelector('.cart-drawer');
const cartOverlay = document.querySelector('.cart-overlay');
const cartClose = document.querySelector('.cart-close');
const cartItems = document.querySelector('.cart-items');
const cartEmpty = document.querySelector('.cart-empty');
const cartFooter = document.querySelector('.cart-drawer-footer');
const cartTotal = document.querySelector('.cart-total');
const toast = document.querySelector('.toast');
let toastTimer;
let previousFocus;

function formatPrice(value) {
  return `${new Intl.NumberFormat('ru-RU').format(value)} ₽`;
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('is-visible');
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast.classList.remove('is-visible'), 2200);
}

function updateProductControls() {
  productCards.forEach((card) => {
    const quantity = cart.get(card.dataset.id) || 0;
    const addButton = card.querySelector('.add-button');
    const controls = card.querySelector('.quantity-control');
    addButton.hidden = quantity > 0;
    controls.hidden = quantity === 0;
    card.querySelector('.quantity-value').textContent = String(quantity);
  });
}

function renderCart() {
  cartItems.replaceChildren();
  let itemCount = 0;
  let total = 0;

  cart.forEach((quantity, id) => {
    const product = products.get(id);
    if (!product || quantity < 1) return;
    itemCount += quantity;
    total += product.price * quantity;

    const item = document.createElement('li');
    item.className = 'cart-item';
    item.dataset.id = id;

    const visual = document.createElement('span');
    visual.className = 'cart-item-visual';
    visual.setAttribute('aria-hidden', 'true');
    visual.textContent = product.emoji;

    const main = document.createElement('div');
    main.className = 'cart-item-main';
    const heading = document.createElement('div');
    heading.className = 'cart-item-heading';
    const name = document.createElement('h3');
    name.textContent = product.name;
    const price = document.createElement('span');
    price.className = 'cart-item-price';
    price.textContent = formatPrice(product.price * quantity);
    heading.append(name, price);

    const actions = document.createElement('div');
    actions.className = 'cart-item-actions';
    const controls = document.createElement('div');
    controls.className = 'cart-item-controls';
    controls.innerHTML = `<button type="button" data-cart-action="decrease" aria-label="Уменьшить количество ${product.name}">−</button><span>${quantity}</span><button type="button" data-cart-action="increase" aria-label="Увеличить количество ${product.name}">+</button>`;
    const remove = document.createElement('button');
    remove.className = 'cart-remove';
    remove.type = 'button';
    remove.dataset.cartAction = 'remove';
    remove.textContent = 'Удалить';
    remove.setAttribute('aria-label', `Удалить ${product.name} из корзины`);
    actions.append(controls, remove);
    main.append(heading, actions);
    item.append(visual, main);
    cartItems.append(item);
  });

  cartCount.textContent = String(itemCount);
  cartButton.setAttribute('aria-label', `Корзина, товаров: ${itemCount}`);
  cartEmpty.hidden = itemCount > 0;
  cartFooter.hidden = itemCount === 0;
  cartTotal.textContent = formatPrice(total);
}

function setQuantity(id, quantity, message) {
  const product = products.get(id);
  if (!product) return;
  const safeQuantity = Math.max(0, Math.min(99, quantity));
  if (safeQuantity === 0) cart.delete(id);
  else cart.set(id, safeQuantity);
  updateProductControls();
  renderCart();
  if (message) showToast(message);
}

productCards.forEach((card) => {
  const id = card.dataset.id;
  card.querySelector('.add-button').addEventListener('click', () => {
    setQuantity(id, 1, `${products.get(id).name} добавлен в корзину`);
  });
  card.querySelector('[data-action="increase"]').addEventListener('click', () => {
    setQuantity(id, (cart.get(id) || 0) + 1, `Добавлен ещё один: ${products.get(id).name}`);
  });
  card.querySelector('[data-action="decrease"]').addEventListener('click', () => {
    const nextQuantity = (cart.get(id) || 0) - 1;
    setQuantity(id, nextQuantity, nextQuantity > 0 ? `Количество уменьшено: ${products.get(id).name}` : `${products.get(id).name} убран из корзины`);
  });
});

function openCart() {
  previousFocus = document.activeElement;
  cartDrawer.inert = false;
  cartDrawer.setAttribute('aria-hidden', 'false');
  cartDrawer.classList.add('is-open');
  cartOverlay.classList.add('is-open');
  cartOverlay.setAttribute('aria-hidden', 'false');
  document.body.classList.add('cart-open');
  cartClose.focus();
}

function closeCart() {
  cartDrawer.classList.remove('is-open');
  cartOverlay.classList.remove('is-open');
  cartOverlay.setAttribute('aria-hidden', 'true');
  cartDrawer.setAttribute('aria-hidden', 'true');
  cartDrawer.inert = true;
  document.body.classList.remove('cart-open');
  if (previousFocus instanceof HTMLElement) previousFocus.focus();
}

cartButton.addEventListener('click', openCart);
cartClose.addEventListener('click', closeCart);
cartOverlay.addEventListener('click', closeCart);
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && cartDrawer.classList.contains('is-open')) closeCart();
});

cartDrawer.addEventListener('keydown', (event) => {
  if (event.key !== 'Tab') return;
  const focusable = [...cartDrawer.querySelectorAll('button:not([disabled])')];
  if (!focusable.length) return;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
});

cartItems.addEventListener('click', (event) => {
  const button = event.target.closest('button[data-cart-action]');
  if (!button) return;
  const item = button.closest('.cart-item');
  const id = item?.dataset.id;
  if (!id) return;
  const action = button.dataset.cartAction;
  if (action === 'increase') setQuantity(id, (cart.get(id) || 0) + 1);
  if (action === 'decrease') setQuantity(id, (cart.get(id) || 0) - 1);
  if (action === 'remove') setQuantity(id, 0);
});

document.querySelector('.secondary-button').addEventListener('click', () => {
  showToast('В макете уже показаны все товары');
});

updateProductControls();
renderCart();
document.getElementById('year').textContent = new Date().getFullYear();
