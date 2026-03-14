# AstroBaba – Telegram Horoscope Bot

**Bot name:** AstroBaba  
**Telegram:** [@GetYourHoroscopeBot](https://t.me/GetYourHoroscopeBot)

AstroBaba asks for your **raashi** (in Hindi or English), then fetches your **daily horoscope** from a third-party horoscope API (configured via environment variables, not hard-coded in this repo).

## Auth (Horoscope API)

The bot uses a third-party horoscope API secured via **OAuth 2.0 Client Credentials**.
Concrete endpoints and provider details are configured only via environment variables
and are not documented here, so the implementation details stay private.

## Setup

1. **Node.js** 18+ (for `fetch`).
2. Clone and install:
   ```bash
   cd telegram-horoscope-bot
   npm install
   ```
3. Copy env and fill in values:
   ```bash
   cp .env.example .env
   ```
   In `.env` set:
   - `TELEGRAM_BOT_TOKEN` – from [@BotFather](https://t.me/BotFather)
   - `HOROSCOPE_API_CLIENT_ID` – client ID for your horoscope API app
   - `HOROSCOPE_API_CLIENT_SECRET` – client secret for your horoscope API app
   - `HOROSCOPE_API_TOKEN_URL` – OAuth2 token endpoint URL (Client Credentials)
   - `HOROSCOPE_API_BASE_URL` – base URL for the horoscope API (e.g. https://.../v2)
4. Run:
   ```bash
   npm start
   ```
   For development with auto-restart: `npm run dev`

## Usage (in Telegram)

- **/start** – Welcome and ask for your raashi.
- Send your **raashi** in Hindi or English (e.g. मेष, Aries, Mesha, कन्या, Virgo, Leo).  
  The bot will set it and send today's daily horoscope.
- **/daily** – Get today's horoscope again (uses last set raashi).
- **/raashi** – Clear saved raashi and ask for a new one.

### Free plan behaviour

- Each user (Telegram chat) can receive **one horoscope per calendar day** (UTC) on the free plan.
- If a user tries to check their rashi more than once on the same day, the bot **does not send another horoscope** and instead replies with a **premium upsell** message explaining the limit and how to contact you for premium access.

### Premium upsell message

When the daily limit is reached, the bot sends a personalised message using the user's name/username:

> Hey {name}, thanks for actively using AstroBaba! You're currently on the free plan, which allows one rashi check per day. To get access to our premium features like:
>
> 1) Unlimited rashi checks  
> 2) Convert English to Hindi/Marathi  
> 3) Advanced analytics (love, career, etc.)  
>
> Email us at thor98571@gmail.com with the subject "Interested in premium features", and include your name, email and mobile number.

This logic is implemented in `index.js` using:

- An in-memory **per-user, per-day quota map** to track when a horoscope has already been sent for that day.
- A helper that builds the premium message with the user's display name and escapes it for Telegram Markdown.

## Raashi / sign mapping

The bot maps common Hindi and English names to the API sign, e.g.:

| Hindi   | English             | API sign    |
| ------- | ------------------- | ----------- |
| मेष     | Aries, Mesha        | aries       |
| वृषभ    | Taurus, Vrishabha   | taurus      |
| मिथुन   | Gemini, Mithuna     | gemini      |
| कर्क    | Cancer, Karka       | cancer      |
| सिंह    | Leo, Simha          | leo         |
| कन्या   | Virgo, Kanya        | virgo       |
| तुला    | Libra, Tula         | libra       |
| वृश्चिक | Scorpio, Vrishchika | scorpio     |
| धनु     | Sagittarius, Dhanu  | sagittarius |
| मकर     | Capricorn, Makara   | capricorn   |
| कुम्भ   | Aquarius, Kumbha    | aquarius    |
| मीन     | Pisces, Meena       | pisces      |

## License

MIT
