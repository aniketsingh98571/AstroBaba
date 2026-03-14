/**
 * AstroBaba Telegram Bot
 * Asks user for raashi (Hindi or English), then fetches daily horoscope from a third-party horoscope API (basic).
 */

require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const { getAccessToken, getDailyHoroscope } = require('./horoscopeApi');
const { resolveRaashi, getSignName } = require('./raashi');

const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CLIENT_ID = process.env.HOROSCOPE_API_CLIENT_ID;
const CLIENT_SECRET = process.env.HOROSCOPE_API_CLIENT_SECRET;

if (!TELEGRAM_TOKEN || !CLIENT_ID || !CLIENT_SECRET) {
  console.error(
    'Missing env: TELEGRAM_BOT_TOKEN, HOROSCOPE_API_CLIENT_ID, HOROSCOPE_API_CLIENT_SECRET',
  );
  process.exit(1);
}

const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: true });

// In-memory: chatId -> { sign }
const chatState = new Map();

// Cache: "YYYY-MM-DD:sign" -> formatted horoscope text (static per day per sign)
const horoscopeTextCache = new Map();

// Free plan: chatId -> last date (YYYY-MM-DD) we sent a horoscope; one per user per day
const lastHoroscopeSentDate = new Map();

/** Cache key for today + sign (UTC date). */
const getHoroscopeCacheKey = (sign) => {
  const date = new Date().toISOString().slice(0, 10);
  return `${date}:${sign}`;
};

/** Today's date in YYYY-MM-DD (UTC). */
const getTodayDate = () => new Date().toISOString().slice(0, 10);

/** Display name from Telegram chat (first name, or username, or fallback). */
const getDisplayName = (chat) => {
  const first = chat?.first_name?.trim();
  const last = chat?.last_name?.trim();
  if (first || last) return [first, last].filter(Boolean).join(' ');
  if (chat?.username) return chat.username;
  return 'there';
};

const PREMIUM_UPSELL_MESSAGE = (displayName) =>
  `Hey ${escapeMd(displayName)}, thanks for actively using AstroBaba! You're currently on the free plan, which allows one rashi check per day. To get access to our premium features like:

1) Unlimited rashi checks
2) Convert English to Hindi/Marathi
3) Advanced analytics (love, career, etc.)

Email us at thor98571@gmail.com with the subject "Interested in premium features", and include your name, email and mobile number.`;

const WELCOME = `🙏 Welcome to *AstroBaba*!

I'll fetch your daily horoscope from the stars.`;

const ASK_RAASHI =
  'Please send your raashi (zodiac sign) in Hindi or English.\n\nExamples: मेष, Aries, Mesha, कन्या, Virgo, Leo, सिंह';

// Escape * and _ for Telegram Markdown so API text doesn't break formatting
const escapeMd = (s) => (s || '').replace(/\*/g, '\\*').replace(/_/g, '\\_');

/**
 * Format horoscope daily_predictions[0] (one sign) for Telegram.
 * @param {object} data - API data with daily_predictions array
 * @returns {string} Markdown text for Telegram
 */
const formatHoroscope = (data) => {
  const list = data.daily_predictions;
  if (!list || list.length === 0) return 'No predictions for this sign today.';
  const block = list[0];
  const signName = block.sign?.name || 'Your sign';
  const lines = [`🌟 *${escapeMd(signName)} – Daily Horoscope*`, ''];

  const predictions = block.predictions || [];
  for (const p of predictions) {
    const type = p.type || 'General';
    lines.push(`*${escapeMd(type)}*`);
    if (p.prediction) lines.push(escapeMd(p.prediction));
    if (p.seek) lines.push(`_Seek:_ ${escapeMd(p.seek)}`);
    if (p.challenge) lines.push(`_Challenge:_ ${escapeMd(p.challenge)}`);
    if (p.insight) lines.push(`_Insight:_ ${escapeMd(p.insight)}`);
    lines.push('');
  }
  return lines.join('\n').slice(0, 4000);
};

/**
 * Fetch and send daily horoscope for a chat. Uses cache per day per sign so the same
 * API response is not requested again for the same day and rashi.
 * Free plan: only one horoscope per user per day; otherwise sends premium upsell.
 * @param {number} chatId
 * @param {string} sign - API sign (e.g. aries)
 * @param {string} userDisplayName - for premium upsell message
 */
const sendHoroscope = async (chatId, sign, userDisplayName) => {
  const today = getTodayDate();
  const lastSent = lastHoroscopeSentDate.get(chatId);
  if (lastSent === today) {
    await bot.sendMessage(
      chatId,
      PREMIUM_UPSELL_MESSAGE(userDisplayName || 'there'),
      { parse_mode: 'Markdown' },
    );
    return;
  }

  // Mark quota used immediately to avoid race when user sends multiple messages quickly
  lastHoroscopeSentDate.set(chatId, today);

  const cacheKey = getHoroscopeCacheKey(sign);
  const cachedText = horoscopeTextCache.get(cacheKey);
  if (cachedText) {
    await bot.sendMessage(chatId, cachedText, { parse_mode: 'Markdown' });
    return;
  }
  try {
    await bot.sendMessage(chatId, '⏳ Fetching your daily horoscope…', {
      parse_mode: 'Markdown',
    });
    const token = await getAccessToken(CLIENT_ID, CLIENT_SECRET);
    const data = await getDailyHoroscope(token, sign);
    const text = formatHoroscope(data);
    horoscopeTextCache.set(cacheKey, text);
    await bot.sendMessage(chatId, text, { parse_mode: 'Markdown' });
  } catch (err) {
    console.error(err);
    // On failure, clear today's quota so user can try again
    lastHoroscopeSentDate.delete(chatId);
    await bot.sendMessage(
      chatId,
      '❌ Could not fetch horoscope. Please try again later.',
      { parse_mode: 'Markdown' },
    );
  }
};

// /start – welcome and ask for raashi
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  chatState.set(chatId, {});
  bot.sendMessage(chatId, `${WELCOME}\n\n${ASK_RAASHI}`, {
    parse_mode: 'Markdown',
  });
});

// Any text message: resolve raashi or resend horoscope with saved sign
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const text = (msg.text || '').trim();
  if (!text) return;
  if (text.startsWith('/')) return;

  const state = chatState.get(chatId) || {};

  const resolved = resolveRaashi(text);
  if (resolved) {
    state.sign = resolved.sign;
    chatState.set(chatId, state);
    await bot.sendMessage(
      chatId,
      `✅ Raashi set to *${getSignName(resolved.sign)}*. Fetching today's horoscope...`,
      { parse_mode: 'Markdown' },
    );
    await sendHoroscope(chatId, resolved.sign, getDisplayName(msg.chat));
    return;
  }

  const savedSign = state.sign;
  if (savedSign) {
    await sendHoroscope(chatId, savedSign, getDisplayName(msg.chat));
    return;
  }

  await bot.sendMessage(
    chatId,
    `I didn't recognise that raashi. ${ASK_RAASHI}`,
    { parse_mode: 'Markdown' },
  );
});

// /raashi – ask to change raashi
bot.onText(/\/raashi/, (msg) => {
  const chatId = msg.chat.id;
  const state = chatState.get(chatId) || {};
  delete state.sign;
  chatState.set(chatId, state);
  bot.sendMessage(chatId, ASK_RAASHI, { parse_mode: 'Markdown' });
});

// /daily – get today's horoscope with saved raashi
bot.onText(/\/daily/, async (msg) => {
  const chatId = msg.chat.id;
  const state = chatState.get(chatId) || {};
  const savedSign = state.sign;
  if (!savedSign) {
    await bot.sendMessage(chatId, `First send your raashi. ${ASK_RAASHI}`, {
      parse_mode: 'Markdown',
    });
    return;
  }
  await sendHoroscope(chatId, savedSign, getDisplayName(msg.chat));
});

console.log('AstroBaba bot is running (polling).');
