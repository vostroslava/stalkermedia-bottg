import { Telegraf, Markup } from 'telegraf';
import * as dotenv from 'dotenv';

dotenv.config();

const BOT_TOKEN = process.env.BOT_TOKEN;
const WEB_APP_URL = process.env.WEB_APP_URL;

if (!BOT_TOKEN) {
    throw new Error('BOT_TOKEN is required');
}

if (!WEB_APP_URL) {
    throw new Error('WEB_APP_URL is required');
}

const bot = new Telegraf(BOT_TOKEN);

// /start command
bot.start(async (ctx) => {
    const firstName = ctx.from?.first_name || 'Друг';

    await ctx.reply(
        `Привет, ${firstName}! 👋\n\n` +
        `🏠 Добро пожаловать в тест «Теремок»!\n\n` +
        `Узнай свой рабочий типаж за 2-3 минуты.\n` +
        `20 вопросов • 7 возможных типажей\n\n` +
        `Нажми кнопку ниже, чтобы начать:`,
        Markup.inlineKeyboard([
            [Markup.button.webApp('🚀 Открыть тест', WEB_APP_URL)]
        ])
    );
});

// Help command
bot.help(async (ctx) => {
    await ctx.reply(
        `📖 О тесте «Теремок»\n\n` +
        `Этот тест определит ваш рабочий типаж:\n` +
        `🐦 Птица • 🐹 Хомяк • 🦊 Лиса\n` +
        `💼 Профи • 🐺 Волк • 🐻 Медведь • 🐀 Крыса\n\n` +
        `Каждый типаж имеет свои особенности поведения ` +
        `и методы мотивации.\n\n` +
        `Тест можно проходить 1 раз в 24 часа.`,
        Markup.inlineKeyboard([
            [Markup.button.webApp('🚀 Пройти тест', WEB_APP_URL)]
        ])
    );
});

// Handle any text message
bot.on('text', async (ctx) => {
    await ctx.reply(
        `Нажмите кнопку ниже, чтобы пройти тест:`,
        Markup.inlineKeyboard([
            [Markup.button.webApp('🚀 Открыть тест', WEB_APP_URL)]
        ])
    );
});

// Error handling
bot.catch((err, ctx) => {
    console.error(`Error for ${ctx.updateType}:`, err);
});

// Start bot
bot.launch().then(() => {
    console.log('🤖 Teremok Bot is running!');
});

// Graceful shutdown
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
