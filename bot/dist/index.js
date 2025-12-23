"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const telegraf_1 = require("telegraf");
const dotenv = __importStar(require("dotenv"));
dotenv.config();
const BOT_TOKEN = process.env.BOT_TOKEN;
const WEB_APP_URL = process.env.WEB_APP_URL;
if (!BOT_TOKEN) {
    throw new Error('BOT_TOKEN is required');
}
if (!WEB_APP_URL) {
    throw new Error('WEB_APP_URL is required');
}
const bot = new telegraf_1.Telegraf(BOT_TOKEN);
// /start command
bot.start(async (ctx) => {
    const firstName = ctx.from?.first_name || 'Друг';
    await ctx.reply(`Привет, ${firstName}! 👋\n\n` +
        `🏠 Добро пожаловать в тест «Теремок»!\n\n` +
        `Узнай свой рабочий типаж за 2-3 минуты.\n` +
        `20 вопросов • 7 возможных типажей\n\n` +
        `Нажми кнопку ниже, чтобы начать:`, telegraf_1.Markup.inlineKeyboard([
        [telegraf_1.Markup.button.webApp('🚀 Открыть тест', WEB_APP_URL)]
    ]));
});
// Help command
bot.help(async (ctx) => {
    await ctx.reply(`📖 О тесте «Теремок»\n\n` +
        `Этот тест определит ваш рабочий типаж:\n` +
        `🐦 Птица • 🐹 Хомяк • 🦊 Лиса\n` +
        `💼 Профи • 🐺 Волк • 🐻 Медведь • 🐀 Крыса\n\n` +
        `Каждый типаж имеет свои особенности поведения ` +
        `и методы мотивации.\n\n` +
        `Тест можно проходить 1 раз в 24 часа.`, telegraf_1.Markup.inlineKeyboard([
        [telegraf_1.Markup.button.webApp('🚀 Пройти тест', WEB_APP_URL)]
    ]));
});
// Handle any text message
bot.on('text', async (ctx) => {
    await ctx.reply(`Нажмите кнопку ниже, чтобы пройти тест:`, telegraf_1.Markup.inlineKeyboard([
        [telegraf_1.Markup.button.webApp('🚀 Открыть тест', WEB_APP_URL)]
    ]));
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
