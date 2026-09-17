// ============================================================
//  Настройки магазина. Этот файл можно править без знания кода.
// ============================================================

window.SHOP = {
  name: 'MAC.FLO studio',
  city: 'Екатеринбург',

  // Ссылка на Telegram магазина (кнопки «Написать»)
  telegramLink: 'https://t.me/macflo66',

  // Демо-уведомления в Telegram: токен и chat ID лежат в secrets.js (в git не попадает).
  // На GitHub Pages secrets.js создаётся сборкой из секретов репозитория.
  ...(window.SECRETS || {}),

  // Доставка
  deliveryPrice: 300,
  freeDeliveryFrom: 5000,

  // Товары. image — имя файла в папке img/
  products: [
    // ---------- БУКЕТЫ ----------
    { id: 'b01', group: 'bouquets', name: 'Пастель в коробке', note: 'Розы, гортензия, ранункулюсы, маттиола', price: 6900, image: 'bouquet-01.jpg', badge: 'Хит' },
    { id: 'b02', group: 'bouquets', name: 'Солнечный',         note: 'Подсолнухи, розы, георгины, эустома',     price: 5400, image: 'bouquet-02.jpg' },
    { id: 'b03', group: 'bouquets', name: 'Белые пионы',       note: 'Монобукет · большой',                     price: 8900, image: 'bouquet-03.jpg', badge: 'Сезон' },
    { id: 'b04', group: 'bouquets', name: '51 красная роза',   note: 'Монобукет · классика',                    price: 9900, image: 'bouquet-04.jpg' },
    { id: 'b05', group: 'bouquets', name: 'Кремовые розы',     note: 'Пионовидные кустовые розы',               price: 5900, image: 'bouquet-05.jpg' },
    { id: 'b06', group: 'bouquets', name: 'Розовые розы · 51', note: 'Пионовидные кустовые, крафт',             price: 8400, image: 'bouquet-06.jpg', badge: 'Хит' },
    { id: 'b07', group: 'bouquets', name: 'Розовые пионы',     note: 'Монобукет · 25 шт.',                      price: 7500, image: 'bouquet-07.jpg', badge: 'Сезон' },
    { id: 'b08', group: 'bouquets', name: 'Корзина «Лимонад»', note: 'Розы, маттиола, эустома · корзина',       price: 7900, image: 'bouquet-08.jpg' },

    // ---------- КЛУБНИКА В ШОКОЛАДЕ / ЯГОДЫ ----------
    { id: 's01', group: 'berries', name: 'Клубника с цветами',       note: 'Ягоды, ромашки и гвоздики в шляпной коробке', price: 3200, image: 'berries-01.jpg', badge: 'Хит' },
    { id: 's02', group: 'berries', name: 'Черешня с георгинами',     note: 'Ягоды + живые цветы в шляпной коробке',      price: 3900, image: 'berries-04.jpg', badge: 'Новинка' },

  ],
};
