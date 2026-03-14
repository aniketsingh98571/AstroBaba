/**
 * Map user input (Hindi or English raashi/zodiac name) to the horoscope API sign.
 * API expects: aries, taurus, gemini, cancer, leo, virgo, libra, scorpio, sagittarius, capricorn, aquarius, pisces
 */

const RAASHI_MAP = [
  { sign: 'aries', en: ['aries', 'mesha', 'mesh'], hi: ['मेष'] },
  { sign: 'taurus', en: ['taurus', 'vrishabha', 'vrishabh'], hi: ['वृषभ'] },
  { sign: 'gemini', en: ['gemini', 'mithuna', 'mithun'], hi: ['मिथुन'] },
  { sign: 'cancer', en: ['cancer', 'karka', 'kark'], hi: ['कर्क'] },
  { sign: 'leo', en: ['leo', 'simha', 'sinh'], hi: ['सिंह'] },
  { sign: 'virgo', en: ['virgo', 'kanya'], hi: ['कन्या'] },
  { sign: 'libra', en: ['libra', 'tula', 'tulaa'], hi: ['तुला'] },
  { sign: 'scorpio', en: ['scorpio', 'vrishchika', 'vrishchik', 'vrischika'], hi: ['वृश्चिक'] },
  { sign: 'sagittarius', en: ['sagittarius', 'dhanu'], hi: ['धनु'] },
  { sign: 'capricorn', en: ['capricorn', 'makara', 'makar'], hi: ['मकर'] },
  { sign: 'aquarius', en: ['aquarius', 'kumbha', 'kumbh'], hi: ['कुम्भ'] },
  { sign: 'pisces', en: ['pisces', 'meena', 'meen'], hi: ['मीन'] },
];

const normalize = (str) => (str || '').trim().toLowerCase().replace(/\s+/g, ' ');

/**
 * Resolve user input to API sign.
 * @param {string} input - Raashi in Hindi or English
 * @returns {{ sign: string, name: string } | null} - API sign and display name, or null if not found
 */
const resolveRaashi = (input) => {
  const text = normalize(input);
  if (!text) return null;
  for (const r of RAASHI_MAP) {
    if (r.en.some((s) => s === text || text === s)) {
      return { sign: r.sign, name: r.sign.charAt(0).toUpperCase() + r.sign.slice(1) };
    }
    if (r.hi.some((h) => text === h || text.includes(h))) {
      return { sign: r.sign, name: r.sign.charAt(0).toUpperCase() + r.sign.slice(1) };
    }
  }
  return null;
};

/** Display names for sign (English) for messages */
const SIGN_NAMES = {
  aries: 'Aries (मेष)',
  taurus: 'Taurus (वृषभ)',
  gemini: 'Gemini (मिथुन)',
  cancer: 'Cancer (कर्क)',
  leo: 'Leo (सिंह)',
  virgo: 'Virgo (कन्या)',
  libra: 'Libra (तुला)',
  scorpio: 'Scorpio (वृश्चिक)',
  sagittarius: 'Sagittarius (धनु)',
  capricorn: 'Capricorn (मकर)',
  aquarius: 'Aquarius (कुम्भ)',
  pisces: 'Pisces (मीन)',
};

const getSignName = (sign) => SIGN_NAMES[sign] || sign;

module.exports = {
  resolveRaashi,
  getSignName,
  RAASHI_MAP,
};
