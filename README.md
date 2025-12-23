# Теремок — Telegram Mini App Test

Telegram Mini App для определения рабочего типажа по методике «Теремок».

## 🏗 Структура

```
teremok-test/
├── bot/        # Telegram Bot (Telegraf)
├── webapp/     # Mini App (Next.js + Tailwind)
├── backend/    # API (Google Apps Script)
└── README.md
```

## 🚀 Быстрый старт

### 1. Создание бота

1. Откройте [@BotFather](https://t.me/BotFather)
2. `/newbot` → создайте бота
3. Сохраните **BOT_TOKEN**
4. `/mybots` → ваш бот → **Bot Settings** → **Menu Button**
   - Укажите URL вашего Web App (https://your-domain.com)

### 2. Google Sheets

1. Создайте таблицу → скопируйте ID из URL
2. ID находится между `/d/` и `/edit`

### 3. Google Apps Script

1. Откройте [script.google.com](https://script.google.com)
2. Создайте проект → вставьте `backend/Code.gs`
3. Заполните `CONFIG`:
   ```javascript
   const CONFIG = {
     BOT_TOKEN: 'ваш_токен',
     CHANNEL_ID: '@ваш_канал',
     SPREADSHEET_ID: 'id_вашей_таблицы'
   };
   ```
4. Запустите `setupSheets()` и `seedQuestions()`
5. **Deploy** → **New deployment** → **Web app**
6. Execute as: **Me**, Access: **Anyone**
7. Скопируйте URL

### 4. Запуск бота

```bash
cd bot
npm install
cp .env.example .env
# Заполните BOT_TOKEN и WEB_APP_URL
npm run dev
```

### 5. Запуск Web App

```bash
cd webapp
npm install
# Создайте .env.local:
# NEXT_PUBLIC_GAS_URL=ваш_url_apps_script
npm run dev
```

## 🎭 7 Типажей

| Эмодзи | Типаж | Мотивация |
|--------|-------|-----------|
| 🐦 | Птица | Принуждение |
| 🐹 | Хомяк | Деньги |
| 🦊 | Лиса | Личная выгода |
| 💼 | Профи | Нравится работа |
| 🐺 | Волк | Своя стая |
| 🐻 | Медведь | Исключение |
| 🐀 | Крыса | Токсичность |

## 📋 Проверка подписки

Для работы проверки:
1. Сделайте бота **администратором** канала
2. Бот должен иметь право читать сообщения
3. Укажите `CHANNEL_ID` в настройках

## ✅ Чек-лист запуска

- [ ] Бот отвечает на /start
- [ ] Кнопка открывает Web App
- [ ] Проверка подписки работает
- [ ] Контактная форма сохраняет данные
- [ ] Тест из 20 вопросов работает
- [ ] Результат показывается правильно
- [ ] Данные записываются в Sheets
- [ ] 24-часовой кулдаун работает

## 📄 Лицензия

© Stalker Media
