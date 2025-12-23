# Google Apps Script Backend

Backend для Telegram Mini App «Теремок».

## Установка

### 1. Создание Google Sheets

1. Создайте новую таблицу в Google Sheets
2. Скопируйте ID из URL (между `/d/` и `/edit`)
3. Вставьте ID в `CONFIG.SPREADSHEET_ID` в Code.gs

### 2. Деплой Apps Script

1. Откройте [script.google.com](https://script.google.com)
2. Создайте новый проект
3. Скопируйте содержимое `Code.gs`
4. Скопируйте `appsscript.json` (Editor → Project Settings → Show manifest)
5. Заполните `CONFIG`:
   - `BOT_TOKEN` — токен бота от @BotFather
   - `CHANNEL_ID` — ID канала для проверки подписки
   - `SPREADSHEET_ID` — ID Google Sheets

### 3. Настройка листов

Запустите функцию `setupSheets()` в редакторе:
1. Выберите функцию в выпадающем списке
2. Нажмите ▶️ Run
3. Разрешите доступ к Google Sheets

### 4. Заполнение вопросов

Запустите функцию `seedQuestions()` для добавления 20 вопросов.

### 5. Публикация

1. Deploy → New deployment
2. Type: Web app
3. Execute as: Me
4. Who has access: Anyone
5. Скопируйте URL Web App

## API Endpoints

### GET

- `?action=questions` — получить список вопросов
- `?action=typology&type=Лиса` — получить описание типажа

### POST

Все POST запросы должны содержать `initData` из Telegram Web App.

```json
{ "action": "init", "initData": "..." }
```

- `init` — инициализация сессии
- `checkSubscription` — проверка подписки на канал
- `saveLead` — сохранение контактов `{ phone: "..." }`
- `startAttempt` — начало теста
- `saveAnswer` — сохранение ответа `{ attemptId, questionId, answer }`
- `finishAttempt` — завершение теста `{ attemptId }`
