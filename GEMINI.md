# GEMINI.md

## Project Overview

This project is a web-based game called "Calendar Breakout," built with TypeScript, React, and the Phaser game engine. The game is a creative take on the classic Breakout/Arkanoid genre, where the player's objective is to clear their "Outlook calendar" by destroying meetings.

The game features:

*   **Outlook-Inspired Design:** The game's visual theme mimics the Microsoft Outlook calendar.
*   **52-Week Campaign:** The game has a progression system that spans 52 "weeks" (levels).
*   **Physics-Based Gameplay:** Different meeting types have unique physics effects that modify the ball's behavior.
*   **Power-ups:** Players can collect power-ups to help them clear the levels.
*   **Responsive Design:** The game is playable on both desktop and mobile devices.

The project is structured in two "phases." Phase 1 is the original version of the game, while Phase 2 includes enhanced features like a progressive difficulty curve and weekly power-ups.

## Building and Running

### Prerequisites

*   Node.js v20 or higher
*   npm

### Installation

```bash
npm install
```

### Running the Development Server

*   **Phase 2 (Enhanced Version):**
    ```bash
    npm run dev
    ```
    This will start the development server on `http://localhost:3000`.

*   **Phase 1 (Original Version):**
    ```bash
    npm run dev:v1
    ```

### Building for Production

*   **Phase 2 (Enhanced Version):**
    ```bash
    npm run build
    ```

*   **Phase 1 (Original Version):**
    ```bash
    npm run build:v1
    ```
The production build will be located in the `dist/` directory.

### Other Scripts

*   **Type Checking:**
    ```bash
    npm run typecheck
    ```

*   **Linting:**
    ```bash
    npm run lint
    ```

*   **Formatting:**
    ```bash
    npm run format
    ```

## Development Conventions

*   **Code Style:** The project uses Prettier for code formatting and ESLint for linting.
*   **Type Safety:** The project is written in TypeScript and uses `tsc` to check for type errors.
*   **Git:** The project follows standard Git practices, with a `main` branch and feature branches for new development.
*   **Testing:** The `README.md` file includes a manual testing checklist, but there are no automated tests in the project.
