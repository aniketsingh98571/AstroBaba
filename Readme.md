# Telegram Horoscope Bot

User sends **zodiac sign in Hindi or English**. The bot scrapes **Prokerala** horoscope page via Serper and replies with **plain text** in Telegram.

## Setup

1. **Node.js** 18+ (for `fetch`).
2. Install and configure env:

   ```bash
   cd telegram-horoscope-bot
   npm install
   cp .env.example .env
   ```

   In `.env` set:

   - `TELEGRAM_BOT_TOKEN` – from [@BotFather](https://t.me/BotFather)
   - `SERPER_API_KEY` – your API key from [serper.dev](https://serper.dev) (used for scraping)

3. Run:

   ```bash
   npm start
   ```

   For development with auto-restart: `npm run dev`

## Usage (Telegram)

- **/start** – Welcome and prompt for zodiac sign.
- Send your **zodiac sign in Hindi or English** (e.g. मेष, Aries, Mesha, कन्या, Virgo, Leo, सिंह).  
  The bot scrapes `https://www.prokerala.com/astrology/horoscope/?sign=<sign>` via [scrape.serper.dev](https://scrape.serper.dev) and replies with the plain text (truncated to Telegram’s limit if needed).

## How it works

1. User sends a zodiac sign (Hindi or English); bot maps it to Prokerala’s `sign` param (e.g. aries, leo, virgo).
2. Bot builds URL: `https://www.prokerala.com/astrology/horoscope/?sign=aries` (and similar for other signs).
3. Bot calls Serper **scrape** (`https://scrape.serper.dev`) with that URL.
4. Bot sends the scraped plain text back in Telegram.

## Sign mapping (Hindi / English → query param)

| Hindi   | English             | URL param   |
| ------- | ------------------- | ----------- |
| मेष     | Aries, Mesha        | aries       |
| वृषभ    | Taurus, Vrishabha   | taurus      |
| मिथुन   | Gemini, Mithuna     | gemini      |
| कर्क    | Cancer, Karka      | cancer      |
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
