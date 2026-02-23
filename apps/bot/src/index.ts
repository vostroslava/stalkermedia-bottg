import { Bot, InlineKeyboard } from 'grammy';
import * as dotenv from 'dotenv';
import path from 'path';

// Загрузка переменных окружения из корня
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const token = process.env.BOT_TOKEN;
if (!token) {
    throw new Error('BOT_TOKEN is not defined in environment variables.');
}

const appUrl = process.env.APP_URL;
if (!appUrl) {
    console.warn('APP_URL is not defined! Using fallback URL.');
}

const botUrl = appUrl || 'https://example.com';

const bot = new Bot(token);

bot.command('start', async (ctx) => {
    const username = ctx.from?.first_name || 'друг';

    // Создаем inline клавиатуру с Web App кнопкой
    const keyboard = new InlineKeyboard()
        .webApp('Открыть Mini App 🚀', botUrl);

    await ctx.reply(`Привет, ${username}! 👋\n\nЯ бот-ассистент Сталкер Медиа.\nНажми на кнопку ниже, чтобы пройти тесты и узнать больше!`, {
        reply_markup: keyboard,
    });
});

bot.command('help', async (ctx) => {
    await ctx.reply('Просто напиши /start чтобы начать работу с Mini App!');
});

// Глобальный обработчик ошибок
bot.catch((err) => {
    const ctx = err.ctx;
    console.error(`Error while handling update ${ctx.update.update_id}:`);
    const e = err.error;
    console.error(e);
});

async function start() {
    console.log('🤖 Starting Telegram Bot...');
    await bot.start({
        onStart: (botInfo) => {
            console.log(`✅ Bot @${botInfo.username} successfully started!`);
        }
    });
}

start().catch(console.error);
