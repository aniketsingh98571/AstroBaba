/**
 * Horoscope API client: OAuth token + Daily Horoscope (basic only).
 * All URLs are configured via environment variables so that implementation
 * details and base URLs are not hard-coded in the repository.
 *
 * Required env vars:
 * - HOROSCOPE_API_TOKEN_URL    – OAuth2 token endpoint (Client Credentials)
 * - HOROSCOPE_API_BASE_URL     – Base URL for the horoscope API (e.g. https://.../v2)
 */

const TOKEN_URL = process.env.HOROSCOPE_API_TOKEN_URL;
const API_BASE = process.env.HOROSCOPE_API_BASE_URL;

if (!TOKEN_URL || !API_BASE) {
  throw new Error(
    'Missing env: HOROSCOPE_API_TOKEN_URL and/or HOROSCOPE_API_BASE_URL. Please set them in your .env file.',
  );
}

let cachedToken = null;
let tokenExpiry = 0;

const horoscopeCache = new Map();
const CACHE_KEY = (sign, datetime) => {
  const d = datetime || new Date().toISOString().slice(0, 10);
  return d.slice(0, 10) + ':' + sign;
};

/**
 * Get OAuth2 access token (Client Credentials). Reuses token until expiry.
 * @param {string} clientId
 * @param {string} clientSecret
 * @returns {Promise<string>} access_token
 */
const getAccessToken = async (clientId, clientSecret) => {
  const now = Date.now();
  if (cachedToken && tokenExpiry > now + 60000) {
    return cachedToken;
  }
  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: clientId,
    client_secret: clientSecret,
  });
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Token request failed: ${res.status} ${text}`);
  }
  const data = await res.json();
  cachedToken = data.access_token;
  tokenExpiry = now + (data.expires_in || 3600) * 1000;
  return cachedToken;
};

/**
 * Fetch basic daily horoscope for a sign. Cached per sign+date.
 * Returns data in same shape as formatHoroscope expects (daily_predictions array).
 * @param {string} accessToken
 * @param {string} sign - aries|taurus|gemini|cancer|leo|virgo|libra|scorpio|sagittarius|capricorn|aquarius|pisces
 * @param {string} [datetime] - ISO 8601 date. Default: today UTC.
 * @returns {Promise<object>} { daily_predictions: [...] }
 */
const getDailyHoroscope = async (accessToken, sign, datetime) => {
  const cacheKey = CACHE_KEY(sign, datetime);
  const cached = horoscopeCache.get(cacheKey);
  if (cached) return cached;

  const date = datetime || new Date().toISOString().slice(0, 10) + 'T00:00:00+00:00';
  const params = new URLSearchParams({ datetime: date, sign });
  const url = `${API_BASE}/horoscope/daily?${params.toString()}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Horoscope API failed: ${res.status} ${text}`);
  }
  const json = await res.json();
  if (json.status !== 'ok' || !json.data || !json.data.daily_prediction) {
    throw new Error(json.message || 'Horoscope API error');
  }
  const p = json.data.daily_prediction;
  const data = {
    daily_predictions: [
      {
        sign: { id: p.sign_id, name: p.sign_name || 'Your sign' },
        predictions: [{ type: 'General', prediction: p.prediction || '' }],
      },
    ],
  };
  horoscopeCache.set(cacheKey, data);
  return data;
};

module.exports = {
  getAccessToken,
  getDailyHoroscope,
};

