/**
 * Telegram Horoscope Bot
 * User sends zodiac sign (Hindi or English). Bot scrapes Prokerala horoscope URL and returns plain text.
 * Caches horoscope by date+sign; free plan: one rashi check per user per day.
 */

require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const { getHoroscopeFromProkerala } = require('./serper');
const { resolveRaashi, getSignName } = require('./raashi');

const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const SERPER_API_KEY = process.env.SERPER_API_KEY;

const PREMIUM_CONTACT_EMAIL = process.env.PREMIUM_CONTACT_EMAIL;

if (!TELEGRAM_TOKEN || !SERPER_API_KEY || !process.env.SERPER_SCRAPE_URL || !process.env.PROKERALA_HOROSCOPE_BASE || !PREMIUM_CONTACT_EMAIL) {
  console.error('Missing env: TELEGRAM_BOT_TOKEN, SERPER_API_KEY, SERPER_SCRAPE_URL, PROKERALA_HOROSCOPE_BASE, PREMIUM_CONTACT_EMAIL');
  process.exit(1);
}

const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: true });

// Cache: "YYYY-MM-DD:sign" -> formatted horoscope text (one fetch per sign per day)
const horoscopeTextCache = new Map();
// Free plan: chatId -> last date (YYYY-MM-DD) we sent a horoscope; one per user per day
const lastHoroscopeSentDate = new Map();

const getTodayDate = () => new Date().toISOString().slice(0, 10);
const getHoroscopeCacheKey = (sign) => `${getTodayDate()}:${sign}`;

const getDisplayName = (chat) => {
  const first = chat?.first_name?.trim();
  const last = chat?.last_name?.trim();
  if (first || last) return [first, last].filter(Boolean).join(' ');
  if (chat?.username) return chat.username;
  return 'there';
};

const escapeMd = (s) => (s || '').replace(/\*/g, '\\*').replace(/_/g, '\\_');

const PREMIUM_UPSELL_MESSAGE = (displayName) =>
  `Hey ${escapeMd(displayName)}, thanks for actively using AstroBaba! You're currently on the free plan, which allows one rashi check per day. To get access to our premium features like:

1) Unlimited rashi checks
2) Convert English to Hindi/Marathi
3) Advanced analytics (love, career, etc.)

Email us at ${escapeMd(PREMIUM_CONTACT_EMAIL)} with the subject "Interested in premium features", and include your name, email and mobile number.`;

const WELCOME = `Welcome. Send your zodiac sign (Hindi or English) to get today's horoscope.`;
const ASK_SIGN = `Examples: मेष, Aries, Mesha, कन्या, Virgo, Leo, सिंह`;

const MAX_MESSAGE_LENGTH = 4096;

const truncateForTelegram = (text) => {
  const t = (text || '').trim();
  if (t.length <= MAX_MESSAGE_LENGTH) return t;
  return t.slice(0, MAX_MESSAGE_LENGTH - 20) + '\n\n…(truncated)';
};

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, `${WELCOME}\n\n${ASK_SIGN}`);
});

bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const text = (msg.text || '').trim();
  if (!text || text.startsWith('/')) return;

  const resolved = resolveRaashi(text);
  if (!resolved) {
    await bot.sendMessage(chatId, `I didn't recognise that sign. ${ASK_SIGN}`);
    return;
  }

  const today = getTodayDate();
  const lastSent = lastHoroscopeSentDate.get(chatId);
  if (lastSent === today) {
    await bot.sendMessage(
      chatId,
      PREMIUM_UPSELL_MESSAGE(getDisplayName(msg.chat)),
      { parse_mode: 'Markdown' },
    );
    return;
  }

  lastHoroscopeSentDate.set(chatId, today);

  const cacheKey = getHoroscopeCacheKey(resolved.sign);
  const cachedText = horoscopeTextCache.get(cacheKey);
  if (cachedText) {
    await bot.sendMessage(chatId, cachedText);
    return;
  }

  try {
    await bot.sendMessage(chatId, `Fetching horoscope for ${getSignName(resolved.sign)}…`);
    const plainText = await getHoroscopeFromProkerala(SERPER_API_KEY, resolved.sign);
    const toSend = truncateForTelegram(plainText);
    horoscopeTextCache.set(cacheKey, toSend);
    await bot.sendMessage(chatId, toSend);
  } catch (err) {
    console.error(err);
    lastHoroscopeSentDate.delete(chatId);
    await bot.sendMessage(
      chatId,
      'Could not fetch horoscope. Try again later.',
    );
  }
});

console.log('Horoscope bot is running (Prokerala + Serper + Telegram).');
