# Chinese Learning App Walkthrough

I have updated the application to fetch data dynamically, improved font rendering, styled the Pinyin, implemented exclusive audio playback, and added a feature to add new words.

## Updates
- **Dynamic Data**: The app fetches vocabulary directly from your Google Sheet via `/api/words`.
- **Add Word Feature**: A new page (`/add`) allows you to add new words. These are saved locally and merged with the Google Sheet data.
- **Font Improvement**: Added `Noto Sans SC` font for correct Pinyin rendering.
- **Pinyin Styling**: Pinyin text now uses **Arial font** and dark gray color.
- **Chinese TTS**: The app reads the **Chinese Characters** (`word.char`) using a Chinese voice.
- **Exclusive Playback**: Clicking a new card **immediately stops** any currently playing audio.
- **Male Voice Preference**: It attempts to use a **Male Chinese Voice** (e.g., "Microsoft Kangkang") if available.
- **Robust Audio**: Fallback to Google Translate TTS if browser voice is missing.
- **Responsive Design**: Adjusted font sizes and padding to look great on all screen sizes.

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
- `src/app/page.js`: Main page with responsive grid and audio state management.
- `src/app/add/page.js`: Page for adding new vocabulary.
- `src/components/WordCard.js`: Card component with exclusive playback logic.
- `src/app/api/words/route.js`: API endpoint that merges Google Sheet and local data.
- `src/app/api/add/route.js`: API endpoint to save new words locally.
- `src/app/api/tts/route.js`: API endpoint for proxying TTS audio.
