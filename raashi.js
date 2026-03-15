/**
 * Map user input (Hindi or English raashi/zodiac name) to standard sign param for horoscope URL.
 * Expected values: aries, taurus, gemini, cancer, leo, virgo, libra, scorpio, sagittarius, capricorn, aquarius, pisces
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
 * Resolve user input (Hindi or English) to horoscope URL sign param.
 * @param {string} input - Raashi in Hindi or English
 * @returns {{ sign: string, name: string } | null} - sign for URL and display name, or null
 */
const resolveRaashi = (input) => {
  const text = normalize(input);
  if (!text) return null;
  for (const row of RAASHI_MAP) {
    const all = [...row.en, ...row.hi];
    if (all.some((v) => v === text || (v.length >= 2 && text.startsWith(v)))) {
      const name = row.sign.charAt(0).toUpperCase() + row.sign.slice(1);
      return { sign: row.sign, name };
    }
  }
  return null;
};

const getSignName = (sign) => (sign ? sign.charAt(0).toUpperCase() + sign.slice(1) : '');

module.exports = {
  resolveRaashi,
  getSignName,
};
