# Chinese Learning App Walkthrough

I have updated the application to fetch data dynamically, improved font rendering, enhanced TTS quality using a proxy, and optimized the layout for mobile devices.

## Updates
- **Dynamic Data**: The app fetches vocabulary directly from your Google Sheet via `/api/words`.
- **Font Improvement**: Added `Noto Sans SC` font for correct Pinyin rendering.
- **Better Audio**: Switched to Google Translate TTS API via a local proxy (`/api/tts`) to ensure reliable playback and accurate pronunciation.
- **Responsive Design**: Adjusted font sizes and padding to look great on all screen sizes (mobile, tablet, desktop).

## How to Run

1.  Open your terminal.
2.  Navigate to the project directory:
    ```bash
    cd "d:\WEB China\chinese-app"
    ```
3.  Start the development server:
    ```bash
    npm run dev
    ```
4.  Open your browser and go to `http://localhost:3000`.

## Project Structure
- `src/app/page.js`: Main page with responsive grid.
- `src/components/WordCard.js`: Card component with proxied Google TTS integration.
- `src/app/api/words/route.js`: API endpoint for Google Sheet data.
- `src/app/api/tts/route.js`: API endpoint for proxying TTS audio.
