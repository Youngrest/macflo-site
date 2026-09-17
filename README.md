# MAC.FLO — демо-сайт цветочного магазина

## Структура
- `site/` — сам сайт (статический, открывается без сервера)
  - `index.html`, `styles.css`, `app.js`
  - `config.js` — товары, цены, Telegram-настройки. Правится без знания кода.
  - `img/` — сжатые фото под нужными именами
- `photos/` — оригиналы фото из Instagram (сюда кидать новые)
- `prepare-photos.ps1` — раскладывает фото из `photos/` в `site/img/` и сжимает
- `serve.ps1` — локальный сервер для просмотра: http://localhost:8765/
- `old/` — первый макет от ChatGPT (для истории)

## Демо-ссылка
GitHub Pages: https://youngrest.github.io/macflo-site/ — деплой автоматически при push в `main`.

## Запуск локально
```
powershell -ExecutionPolicy Bypass -File serve.ps1
```
и открыть http://localhost:8765/ — либо просто открыть `site/index.html` двойным кликом.

## Telegram-уведомления (демо)
Токен бота и chat ID лежат в `site/secrets.js` — файл в git не попадает (`.gitignore`).
Шаблон:
```js
window.SECRETS = { telegramBotToken: "123:AAA...", telegramChatId: "123456789" };
```
На GitHub Pages этот файл создаёт сборка из секретов репозитория
`TELEGRAM_BOT_TOKEN` и `TELEGRAM_CHAT_ID` (Settings → Secrets and variables → Actions).
Использовать одноразового бота — токен всё равно виден в браузере.

## Чего не хватает
- фото макарун (`img/macarons-01..04.jpg`, `img/cat-macarons.jpg`)
- фото клубники в шоколаде без цветов (`img/berries-02.jpg`, `img/berries-03.jpg`)
- реальные телефон, адрес, ссылка на Telegram, условия доставки
