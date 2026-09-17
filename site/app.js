/* ============================================================
   MAC.FLO — витрина, корзина, оформление, заявки «на заказ».
   Данные и настройки — в config.js
   ============================================================ */
(() => {
  const SHOP = window.SHOP || { products: [] };
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const fmt = (n) => `${new Intl.NumberFormat('ru-RU').format(n)} ₽`;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Плейсхолдеры для отсутствующих фото ---------- */
  function markMissing(img) {
    img.classList.add('is-missing');
    const box = img.closest('.media, .hero__frame');
    if (!box) return;
    box.classList.add('ph');
    if (img.dataset.ph) box.dataset.ph = img.dataset.ph;
  }
  document.addEventListener('error', (e) => { if (e.target.tagName === 'IMG') markMissing(e.target); }, true);
  $$('img.is-missing, img[data-ph]').forEach((img) => { if (img.complete && img.naturalWidth === 0) markMissing(img); });

  /* ---------- Telegram-ссылки ---------- */
  $$('[data-tg-link]').forEach((a) => { a.href = SHOP.telegramLink || '#'; });
  $('[data-year]').textContent = new Date().getFullYear();

  /* ---------- Hero: схлопывание при скролле ---------- */
  const heroFrame = $('[data-hero-frame]');
  if (heroFrame && !reduceMotion) {
    let ticking = false;
    const update = () => {
      const range = Math.max(heroFrame.offsetHeight * 0.85, 300);
      const p = Math.min(Math.max(window.scrollY / range, 0), 1);
      document.documentElement.style.setProperty('--hero-p', p.toFixed(3));
      ticking = false;
    };
    window.addEventListener('scroll', () => { if (!ticking) { requestAnimationFrame(update); ticking = true; } }, { passive: true });
    update();
  }

  /* ---------- Toast ---------- */
  const toast = $('[data-toast]');
  let toastTimer;
  function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 2200);
  }

  /* ---------- Каталог ---------- */
  const products = new Map(SHOP.products.map((p) => [p.id, p]));

  function cardHTML(p) {
    const badge = p.badge ? `<span class="card__badge ${p.badge === 'Хит' ? 'card__badge--hit' : ''}">${p.badge}</span>` : '';
    return `
      <article class="card" data-id="${p.id}">
        <div class="card__media media">
          <img src="img/${p.image}" alt="${p.name}" loading="lazy" data-ph="${p.image}" />
          ${badge}
        </div>
        <div class="card__body">
          <h3 class="card__name">${p.name}</h3>
          <p class="card__note">${p.note || ''}</p>
          <div class="card__foot">
            <span class="card__price">${fmt(p.price)}</span>
            <button class="btn btn--primary card__add" type="button" data-add aria-label="Добавить ${p.name} в корзину">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" d="M12 5v14M5 12h14"/></svg>В корзину
            </button>
            <div class="stepper" hidden>
              <button type="button" data-dec aria-label="Убрать один">−</button>
              <span data-qty>1</span>
              <button type="button" data-inc aria-label="Добавить ещё один">+</button>
            </div>
          </div>
        </div>
      </article>`;
  }

  $$('[data-products]').forEach((grid) => {
    const group = grid.dataset.products;
    grid.innerHTML = SHOP.products.filter((p) => p.group === group).map(cardHTML).join('');
  });

  /* ---------- Корзина (состояние) ---------- */
  const STORAGE = 'macflo_cart';
  const cart = new Map();
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE) || '{}');
    Object.entries(saved).forEach(([id, q]) => { if (products.has(id) && q > 0) cart.set(id, q); });
  } catch (_) { /* ignore */ }
  const persist = () => { try { localStorage.setItem(STORAGE, JSON.stringify(Object.fromEntries(cart))); } catch (_) {} };

  const cartList = $('[data-cart-list]');
  const cartEmpty = $('[data-cart-empty]');
  const cartFoot = $('[data-cart-foot]');
  const countEls = $$('[data-cart-count]');
  const totalEls = $$('[data-cart-total]');

  function cartTotals() {
    let count = 0, total = 0;
    cart.forEach((q, id) => { const p = products.get(id); if (p) { count += q; total += p.price * q; } });
    return { count, total };
  }

  function setQty(id, qty, msg) {
    const q = Math.max(0, Math.min(99, qty));
    if (q === 0) cart.delete(id); else cart.set(id, q);
    persist();
    renderCards();
    renderCart();
    if (msg) showToast(msg);
  }

  function renderCards() {
    $$('.card[data-id]').forEach((card) => {
      const q = cart.get(card.dataset.id) || 0;
      $('[data-add]', card).hidden = q > 0;
      $('.stepper', card).hidden = q === 0;
      $('[data-qty]', card).textContent = q;
    });
  }

  function renderCart() {
    const { count, total } = cartTotals();
    cartList.innerHTML = [...cart.entries()].map(([id, q]) => {
      const p = products.get(id);
      return `
        <li class="cart-item" data-id="${id}">
          <div class="media"><img src="img/${p.image}" alt="" data-ph="фото" /></div>
          <div>
            <div class="cart-item__name">${p.name}</div>
            <div class="cart-item__note">${p.note || ''}</div>
            <div class="cart-item__row">
              <div class="stepper">
                <button type="button" data-dec aria-label="Убрать один">−</button>
                <span>${q}</span>
                <button type="button" data-inc aria-label="Добавить ещё один">+</button>
              </div>
              <span class="cart-item__price">${fmt(p.price * q)}</span>
            </div>
            <button class="cart-item__remove" type="button" data-remove>Удалить</button>
          </div>
        </li>`;
    }).join('');
    $$('img', cartList).forEach((img) => { img.addEventListener('error', () => markMissing(img), { once: true }); });
    cartEmpty.hidden = count > 0;
    cartFoot.hidden = count === 0 || currentView !== 'items';
    countEls.forEach((el) => { el.textContent = count; el.hidden = count === 0; });
    totalEls.forEach((el) => { el.textContent = fmt(total); });
  }

  // Клики по карточкам и по корзине — делегирование
  document.addEventListener('click', (e) => {
    const card = e.target.closest('.card[data-id], .cart-item[data-id]');
    if (!card) return;
    const id = card.dataset.id;
    const p = products.get(id);
    const q = cart.get(id) || 0;
    if (e.target.closest('[data-add]')) setQty(id, 1, `${p.name} — в корзине`);
    else if (e.target.closest('[data-inc]')) setQty(id, q + 1);
    else if (e.target.closest('[data-dec]')) setQty(id, q - 1, q - 1 === 0 ? `${p.name} убран из корзины` : '');
    else if (e.target.closest('[data-remove]')) setQty(id, 0, `${p.name} убран из корзины`);
  });

  /* ---------- Кнопки категорий: подсветка текущего раздела ---------- */
  const catBtns = $$('.catnav__btn');
  if (catBtns.length && 'IntersectionObserver' in window) {
    const targets = catBtns.map((b) => $(b.getAttribute('href'))).filter(Boolean);
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        catBtns.forEach((b) => b.classList.toggle('is-active', b.getAttribute('href') === '#' + en.target.id));
      });
    }, { rootMargin: '-35% 0px -55% 0px' });
    targets.forEach((t) => io.observe(t));
  }

  /* ---------- Drawer корзины ---------- */
  const overlay = $('[data-overlay]');
  const drawer = $('#cart');
  const views = { items: $('[data-cart-view="items"]'), checkout: $('[data-cart-view="checkout"]'), success: $('[data-cart-view="success"]') };
  let currentView = 'items';
  let lastFocus;

  function showView(name) {
    currentView = name;
    Object.entries(views).forEach(([k, el]) => { el.hidden = k !== name; });
    cartFoot.hidden = name !== 'items' || cartTotals().count === 0;
    $('.drawer__head h2', drawer).textContent = name === 'checkout' ? 'Оформление' : 'Корзина';
  }

  function lock(on) { document.body.classList.toggle('is-locked', on); }

  function openCart() {
    lastFocus = document.activeElement;
    showView('items');
    renderCart();
    overlay.hidden = false; drawer.hidden = false;
    requestAnimationFrame(() => { overlay.classList.add('is-open'); drawer.classList.add('is-open'); });
    lock(true);
    $('[data-close-drawer]', drawer).focus();
  }
  function closeCart() {
    overlay.classList.remove('is-open'); drawer.classList.remove('is-open');
    setTimeout(() => { overlay.hidden = true; drawer.hidden = true; }, 300);
    lock(false);
    if (lastFocus instanceof HTMLElement) lastFocus.focus();
  }
  $$('[data-open-cart]').forEach((b) => b.addEventListener('click', openCart));
  $$('[data-close-drawer]').forEach((b) => b.addEventListener('click', closeCart));
  $('[data-go-checkout]').addEventListener('click', () => { showView('checkout'); $('input[name="name"]', views.checkout).focus(); });
  $('[data-back-to-cart]').addEventListener('click', () => showView('items'));

  /* ---------- Форма заказа ---------- */
  const checkout = views.checkout;
  const today = new Date(); today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
  $$('input[type="date"]').forEach((i) => { i.min = today.toISOString().slice(0, 10); });

  $$('input[name="fulfil"]', checkout).forEach((r) => r.addEventListener('change', () => {
    const delivery = $('input[name="fulfil"]:checked', checkout).value === 'delivery';
    $('[data-address-field]', checkout).hidden = !delivery;
  }));

  function validate(form) {
    let ok = true;
    $$('[required]', form).forEach((f) => {
      const bad = !f.value.trim() || (f.type === 'tel' && f.value.replace(/\D/g, '').length < 10);
      f.classList.toggle('is-invalid', bad);
      if (bad && ok) { f.focus(); ok = false; }
    });
    if (!ok) showToast('Заполните обязательные поля');
    return ok;
  }

  function nextOrderNo() {
    const n = Number(localStorage.getItem('macflo_order_no') || 100) + 1;
    try { localStorage.setItem('macflo_order_no', n); } catch (_) {}
    return n;
  }

  checkout.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!validate(checkout)) return;
    const f = Object.fromEntries(new FormData(checkout).entries());
    const { total } = cartTotals();
    const no = nextOrderNo();
    const items = [...cart.entries()].map(([id, q]) => { const p = products.get(id); return `— ${p.name} × ${q} — ${fmt(p.price * q)}`; });
    const text = [
      `🌸 Новый заказ №${no}`, '',
      `Покупатель: ${f.name}`, `Телефон: ${f.phone}`,
      f.fulfil === 'pickup' ? 'Самовывоз' : `Адрес: ${f.address || '—'}`,
      `Когда: ${f.date} · ${f.time}`, '',
      'Состав:', ...items, '', `Итого: ${fmt(total)}`,
    ];
    if (f.card) text.push(`Открытка: ${f.card}`);
    if (f.comment) text.push(`Комментарий: ${f.comment}`);

    const btn = $('button[type="submit"]', checkout);
    btn.disabled = true; btn.textContent = 'Отправляем…';
    await sendTelegram(text.join('\n'));
    btn.disabled = false; btn.textContent = 'Отправить заказ';

    $('[data-order-no]').textContent = `№${no}`;
    cart.clear(); persist(); renderCards(); renderCart();
    checkout.reset();
    showView('success');
  });

  /* ---------- Отправка в Telegram (демо) ---------- */
  async function sendTelegram(text) {
    const { telegramBotToken: token, telegramChatId: chat } = SHOP;
    if (!token || !chat) {
      console.info('[demo] Telegram не настроен. Сообщение:\n' + text);
      await new Promise((r) => setTimeout(r, 600));
      return true;
    }
    try {
      const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chat, text }),
      });
      if (!res.ok) throw new Error(res.status);
      return true;
    } catch (err) {
      console.error('Telegram error', err);
      showToast('Не удалось отправить уведомление, но заказ сохранён');
      return false;
    }
  }

  /* ---------- Модалка «на заказ» ---------- */
  const modal = $('#custom-modal');
  const modalForm = $('form', modal);
  const modalSuccess = $('.modal__success', modal);
  let modalLastFocus;

  $$('.chips', modal).forEach((group) => {
    group.addEventListener('click', (e) => {
      const chip = e.target.closest('.chip'); if (!chip) return;
      if (group.hasAttribute('data-multi')) chip.classList.toggle('is-active');
      else $$('.chip', group).forEach((c) => c.classList.toggle('is-active', c === chip));
    });
  });

  // Варианты формы: букет / корзина / коробка с ягодами
  const KINDS = {
    bouquet: {
      title: 'Букет на заказ', label: 'букет на заказ',
      budgets: ['до 3 000 ₽', '3 000 – 5 000 ₽', '5 000 – 8 000 ₽', 'от 8 000 ₽'],
      paletteLabel: 'Оттенки',
      palette: [['Розовые', '#f3c9d1'], ['Белые', '#f7f1e3'], ['Красные', '#d4423f'], ['Персиковые', '#f2b98b'], ['Сиреневые', '#b9a6d8'], ['На вкус флориста', '#dfe6d3']],
      wish: 'Любит пионы, без лилий, нужен большой…',
    },
    basket: {
      title: 'Корзина на заказ', label: 'корзина на заказ',
      budgets: ['до 5 000 ₽', '5 000 – 8 000 ₽', '8 000 – 12 000 ₽', 'от 12 000 ₽'],
      paletteLabel: 'Что внутри',
      palette: [['Только цветы', '#dfe6d3'], ['Цветы + клубника', '#e05a5a'], ['Цветы + макаруны', '#f3c9d1'], ['Всё вместе', '#f2b98b'], ['Добавить открытку', '#f7f1e3']],
      wish: 'Большая корзина на юбилей, нежные оттенки, клубника отдельно в коробочке…',
    },
    berries: {
      title: 'Коробка с ягодами', label: 'коробка с ягодами',
      budgets: ['до 2 000 ₽', '2 000 – 3 500 ₽', '3 500 – 5 000 ₽', 'от 5 000 ₽'],
      paletteLabel: 'Шоколад',
      palette: [['Молочный', '#8b5a3c'], ['Белый', '#f7f1e3'], ['Тёмный', '#3b2620'], ['Микс', '#c98a6b'], ['С цветами', '#f3c9d1']],
      wish: 'Клубника в молочном шоколаде, 15 ягод, добавить ромашки, без орехов…',
    },
    macarons: {
      title: 'Набор макарун', label: 'набор макарун',
      budgetLabel: 'Количество',
      budgets: ['6 шт.', '12 шт.', '24 шт.', 'Коробка-сердце с цветами'],
      paletteLabel: 'Цвета',
      palette: [['Розовые', '#f3c9d1'], ['Сиреневые', '#c9b3e0'], ['Зелёные', '#b9dba0'], ['Бежевые', '#e8d6c0'], ['Красные', '#e05a5a'], ['Микс', '#f2b98b']],
      extraLabel: 'Вкусы',
      extra: ['Сладкие', 'Ягодные кислые', 'Солёная карамель', 'Шоколад', 'Фисташка', 'Кофе', 'На вкус кондитера'],
      wish: 'Без кофе, побольше малины, коробка с надписью «С днём рождения»…',
    },
  };

  function fillChips(group, items, colored) {
    group.innerHTML = items.map((it, i) => {
      const [text, color] = Array.isArray(it) ? it : [it];
      const style = colored ? ` style="--c:${color}"` : '';
      const active = !colored && i === 1 ? ' is-active' : '';
      return `<button type="button" class="chip${active}"${style}>${text}</button>`;
    }).join('');
  }

  function openCustom(kind) {
    const cfg = KINDS[kind] || KINDS.bouquet;
    modalLastFocus = document.activeElement;
    modalForm.reset();
    $('input[name="kind"]', modal).value = kind;
    $('#custom-title').textContent = cfg.title;
    $('[data-budget-label]', modal).textContent = cfg.budgetLabel || 'Бюджет';
    fillChips($('[data-chips="budget"]', modal), cfg.budgets, false);
    $('[data-palette-label]', modal).textContent = cfg.paletteLabel;
    fillChips($('[data-chips="colors"]', modal), cfg.palette, true);
    const extraField = $('[data-extra-field]', modal);
    extraField.hidden = !cfg.extra;
    if (cfg.extra) {
      $('[data-extra-label]', modal).textContent = cfg.extraLabel;
      fillChips($('[data-chips="extra"]', modal), cfg.extra, false);
      $$('[data-chips="extra"] .chip', modal).forEach((c) => c.classList.remove('is-active'));
    }
    $$('[data-chips="occasion"] .chip', modal).forEach((c) => c.classList.remove('is-active'));
    $('textarea[name="wish"]', modal).placeholder = cfg.wish;
    modalSuccess.hidden = true;
    modal.hidden = false; overlay.hidden = false;
    requestAnimationFrame(() => { modal.classList.add('is-open'); overlay.classList.add('is-open'); });
    lock(true);
    $('[data-close-modal]', modal).focus();
  }
  function closeCustom() {
    modal.classList.remove('is-open'); overlay.classList.remove('is-open');
    setTimeout(() => { modal.hidden = true; overlay.hidden = true; }, 300);
    lock(false);
    if (modalLastFocus instanceof HTMLElement) modalLastFocus.focus();
  }
  $$('[data-open-custom]').forEach((b) => b.addEventListener('click', () => openCustom(b.dataset.openCustom)));
  $$('[data-close-modal]').forEach((b) => b.addEventListener('click', closeCustom));

  modalForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!validate(modalForm)) return;
    const f = Object.fromEntries(new FormData(modalForm).entries());
    const pick = (name) => $$(`[data-chips="${name}"] .chip.is-active`, modal).map((c) => c.textContent.trim()).join(', ') || '—';
    const cfg = KINDS[f.kind] || KINDS.bouquet;
    const text = [
      `💐 Заявка: ${cfg.label}`, '',
      `Имя: ${f.name}`, `Телефон: ${f.phone}`,
      `${cfg.budgetLabel || 'Бюджет'}: ${pick('budget')}`, `Повод: ${pick('occasion')}`, `${cfg.paletteLabel}: ${pick('colors')}`,
    ];
    if (cfg.extra) text.push(`${cfg.extraLabel}: ${pick('extra')}`);
    if (f.date) text.push(`Когда: ${f.date}`);
    if (f.wish) text.push(`Пожелания: ${f.wish}`);
    const btn = $('button[type="submit"]', modalForm);
    btn.disabled = true; btn.textContent = 'Отправляем…';
    await sendTelegram(text.join('\n'));
    btn.disabled = false; btn.textContent = 'Отправить заявку';
    modalForm.reset();
    modalSuccess.hidden = false;
  });

  /* ---------- Общее: overlay / Esc ---------- */
  overlay.addEventListener('click', () => { if (!modal.hidden) closeCustom(); else closeCart(); });
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (!modal.hidden) closeCustom(); else if (!drawer.hidden) closeCart();
  });

  // Закрыть корзину по якорной ссылке внутри неё
  $$('a[data-close-drawer]').forEach((a) => a.addEventListener('click', closeCart));

  renderCards();
  renderCart();
})();
