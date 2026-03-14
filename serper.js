/**
 * Serper API: scrape a URL to plain text.
 * Uses X-API-KEY header and scrape endpoint from env.
 * Parses JSON response (text field) and formats horoscope only (no links/CTAs).
 */

const SERPER_SCRAPE_URL = process.env.SERPER_SCRAPE_URL;
const PROKERALA_HOROSCOPE_BASE = process.env.PROKERALA_HOROSCOPE_BASE;

// Lines containing these (case-insensitive) start the "junk" section we drop
const HOROSCOPE_CUTOFF_PHRASES = [
  'understand compatibility',
  'check love percentage',
  'love calculator',
  'to unfold what lies further ahead',
  'take a look at your',
  'weekly and',
  'monthly horoscope',
  'to read ',
  'horoscope in hindi',
  'rashifal today',
  'daily horoscope highlighting',
  'horoscope for other zodiac signs',
  'back to horoscope main page',
  'related links',
];

/**
 * Returns true if the line starts the footer/links section we want to drop.
 * @param {string} line
 * @returns {boolean}
 */
const isCutoffLine = (line) => {
  const lower = line.toLowerCase().trim();
  if (!lower) return false;
  return HOROSCOPE_CUTOFF_PHRASES.some((phrase) => lower.includes(phrase));
};

/**
 * Keep only horoscope content: drop links, "read more", other signs, related links.
 * @param {string} raw - Raw text from scrape (e.g. Serper JSON .text)
 * @returns {string} Formatted horoscope only
 */
const formatHoroscopeOnly = (raw) => {
  const text = (raw || '').trim();
  if (!text) return '';

  const lines = text.split(/\n+/).map((l) => l.trim()).filter(Boolean);
  const kept = [];

  for (const line of lines) {
    if (isCutoffLine(line)) break;
    kept.push(line);
  }

  return kept.join('\n\n').trim();
};

/**
 * Scrape a URL; if response is JSON with .text, return that, else return body as text.
 * @param {string} apiKey - Serper API key
 * @param {string} url - Full URL to scrape
 * @returns {Promise<string>} Scraped content as text
 */
const scrapeUrl = async (apiKey, url) => {
  const response = await fetch(SERPER_SCRAPE_URL, {
    method: 'POST',
    headers: {
      'X-API-KEY': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ url }),
  });

  if (!response.ok) {
    throw new Error(`Serper scrape failed: ${response.status}`);
  }

  const body = await response.text();
  try {
    const data = JSON.parse(body);
    if (data && typeof data.text === 'string') return data.text.trim();
  } catch {
    // not JSON, use as-is
  }
  return body;
};

/**
 * Get horoscope from Prokerala for a zodiac sign: scrape URL, then format to horoscope-only text.
 * @param {string} apiKey - Serper API key
 * @param {string} sign - Zodiac sign for query param (e.g. "aries", "leo")
 * @returns {Promise<string>} Formatted horoscope content only (no links/CTAs)
 */
const getHoroscopeFromProkerala = async (apiKey, sign) => {
  const url = `${PROKERALA_HOROSCOPE_BASE}${encodeURIComponent(sign)}`;
  const raw = await scrapeUrl(apiKey, url);
  return formatHoroscopeOnly(raw);
};

module.exports = {
  scrapeUrl,
  formatHoroscopeOnly,
  getHoroscopeFromProkerala,
};
