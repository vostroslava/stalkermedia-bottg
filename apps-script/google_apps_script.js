/**
 * Google Apps Script для приёма заявок с лендингов и результатов тестов от TG бота
 * Поддерживает FormData и JSON форматы
 * 
 * Лиды с лендингов → лист "Лиды"
 * Результаты тестов → лист "tg_bot"
 * 
 * Инструкция:
 * 1. Откройте вашу Google Таблицу
 * 2. Расширения → Apps Script
 * 3. Удалите старый код и вставьте этот
 * 4. Нажмите "Развернуть" → "Управление развертываниями"
 * 5. Создайте новую версию или обновите существующую
 */

const LEADS_SHEET_NAME = 'Лиды';
const TG_BOT_SHEET_NAME = 'tg_bot';

function doPost(e) {
    try {
        let data = {};

        // Обработка FormData (с сайта через форму)
        if (e.parameter && Object.keys(e.parameter).length > 0) {
            data = e.parameter;
        }
        // Обработка JSON (от TG бота или других источников)
        else if (e.postData && e.postData.contents) {
            try {
                data = JSON.parse(e.postData.contents);
            } catch (jsonErr) {
                data = {};
            }
        }

        // Определяем тип запроса: результат теста или лид с лендинга
        if (data.telegram_id && data.result_type) {
            // Это результат теста от TG бота
            return handleTestResult(data);
        } else {
            // Это лид с лендинга
            return handleLead(data);
        }

    } catch (error) {
        return ContentService
            .createTextOutput(JSON.stringify({ success: false, error: error.toString() }))
            .setMimeType(ContentService.MimeType.JSON);
    }
}

/**
 * Обработка результата теста от TG бота
 */
function handleTestResult(data) {
    const sheet = getOrCreateTgBotSheet();

    const row = [
        data.timestamp ? new Date(data.timestamp) : new Date(),
        data.telegram_id || '',
        data.telegram_username || '',
        data.phone || '',
        data.test_code || '',
        data.result_type || '',
        data.result_title || ''
    ];

    sheet.appendRow(row);

    return ContentService
        .createTextOutput(JSON.stringify({ success: true, message: 'Результат теста сохранён' }))
        .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Обработка лида с лендинга
 */
function handleLead(data) {
    const sheet = getOrCreateLeadsSheet();
    const timestamp = new Date();

    // Источник: 'Лид Формула' или 'Лид Теремок' (по умолчанию Теремок)
    const source = data.source || 'Лид Теремок';

    const row = [
        timestamp,
        source,
        data.name || '',
        data.phone || '',
        data.company || '',
        data.position || '',
        'Новый'
    ];

    sheet.appendRow(row);

    return ContentService
        .createTextOutput(JSON.stringify({ success: true, message: 'Заявка принята' }))
        .setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
    return ContentService
        .createTextOutput(JSON.stringify({ status: 'OK', message: 'Скрипт работает. Поддерживает лиды и результаты тестов.' }))
        .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Получить или создать лист для лидов
 */
function getOrCreateLeadsSheet() {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(LEADS_SHEET_NAME);

    if (!sheet) {
        sheet = ss.insertSheet(LEADS_SHEET_NAME);
        const headers = ['Дата/время', 'Источник', 'Имя', 'Телефон', 'Компания', 'Должность', 'Статус'];
        sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
        sheet.getRange(1, 1, 1, headers.length).setBackground('#4a90d9').setFontColor('#ffffff').setFontWeight('bold');
        sheet.setFrozenRows(1);
    }
    return sheet;
}

/**
 * Получить или создать лист для результатов TG бота
 */
function getOrCreateTgBotSheet() {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(TG_BOT_SHEET_NAME);

    if (!sheet) {
        sheet = ss.insertSheet(TG_BOT_SHEET_NAME);
        const headers = ['Дата/время', 'Telegram ID', 'Username', 'Телефон', 'Тест', 'Результат (код)', 'Результат'];
        sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
        sheet.getRange(1, 1, 1, headers.length).setBackground('#34a853').setFontColor('#ffffff').setFontWeight('bold');
        sheet.setFrozenRows(1);
    }
    return sheet;
}

/**
 * Тестовая функция для лида
 */
function testLead() {
    const testFormula = {
        parameter: {
            name: 'Тест Формула',
            phone: '+375291234567',
            company: 'Компания',
            source: 'Лид Формула'
        }
    };
    const result = doPost(testFormula);
    Logger.log(result.getContent());
}

/**
 * Тестовая функция для результата теста
 */
function testBotResult() {
    const testBot = {
        postData: {
            contents: JSON.stringify({
                timestamp: new Date().toISOString(),
                telegram_id: 123456789,
                telegram_username: 'test_user',
                phone: '',
                test_code: 'teremok',
                result_type: 'wolf',
                result_title: 'Волк'
            })
        }
    };
    const result = doPost(testBot);
    Logger.log(result.getContent());
}
