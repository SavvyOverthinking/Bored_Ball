# 📅 Calendar Breakout

A fully playable Breakout-style arcade game that uses calendar meeting data to render breakable blocks. Clear your busy calendar by destroying all meetings with physics-based gameplay!

![Calendar Breakout](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Phaser](https://img.shields.io/badge/Phaser-3-purple?style=for-the-badge)

## 🎮 Game Features

- **Breakout Gameplay**: Classic arcade physics with modern polish
- **Calendar Grid**: Meetings mapped to weekdays (Mon-Fri) × time slots (9 AM - 5 PM)
- **Meeting Physics**: Each meeting type modifies ball behavior
- **Smooth Controls**: Mouse/touch-based paddle movement
- **Lives System**: 3 lives to clear all meetings
- **Win/Lose States**: "Week Cleared" or "Meeting Overload" overlays

## 🧱 Meeting Types & Effects

| Type | Effect | Color | Description |
|------|--------|-------|-------------|
| **1:1** | +10% speed | Purple | Increases ball velocity slightly |
| **Team** | Split ball | Green | Creates 2 extra balls |
| **Boss** | Speed ×1.8 | Red | Ball accelerates sharply |
| **Lunch** | Normalize speed | Yellow | Slows ball to baseline |
| **Personal** | Reset bounce | Violet | Stabilizes direction and speed |

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm (or yarn/pnpm)

### Installation & Run

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

The game will be available at `http://localhost:3000`

## 📂 Project Structure

```
calendar-breakout/
├── public/                   # Static assets
├── src/
│   ├── components/
│   │   └── CalendarBreakout.tsx    # React wrapper for Phaser
│   ├── game/
│   │   ├── MainScene.ts            # Core game logic & rendering
│   │   ├── calendarGenerator.ts    # Maps meetings to grid positions
│   │   └── physicsModifiers.ts     # Meeting type physics effects
│   ├── data/
│   │   └── mockCalendar.json       # Sample meeting data
│   ├── App.tsx               # Main React app
│   ├── main.tsx             # React entry point
│   └── index.css            # Tailwind CSS styles
├── package.json
├── vite.config.ts
└── tsconfig.json
```

## 🎯 How to Play

1. **Move your mouse** to control the paddle
2. **Click** to launch the ball
3. **Destroy meeting blocks** by hitting them with the ball
4. **Watch out** for physics effects when you hit different meeting types
5. **Clear all meetings** to win the week!
6. **Don't let the ball fall** or you'll lose a life

## 🛠️ Tech Stack

- **Frontend**: React 18 + TypeScript
- **Game Engine**: Phaser 3.70
- **Build Tool**: Vite 5
- **Styling**: Tailwind CSS 3
- **Physics**: Arcade Physics (Phaser)

## 🎨 Design Philosophy

- **Clean Calendar Aesthetic**: Mimics enterprise calendar apps (Outlook/Google Calendar)
- **Enterprise Parody**: Playful take on meeting overload culture
- **Modern UI**: Inter/Segoe UI fonts, smooth animations, gradient effects
- **Responsive**: Scales to fit different screen sizes

## 🔮 Future Enhancements (Roadmap)

### Planned Features
- [ ] Sound effects (paddle bounce, block destruction)
- [ ] Power-ups (wider paddle, slower ball, multi-ball)
- [ ] Multiple difficulty levels
- [ ] Local high score persistence
- [ ] Mobile-responsive touch controls optimization

### API Integration
- [ ] Replace `mockCalendar.json` with Google Calendar API
- [ ] OAuth2 authentication flow
- [ ] Real-time calendar sync
- [ ] Microsoft Outlook Calendar support

### Social Features
- [ ] "Share your score" modal
- [ ] LinkedIn joke edition sharing
- [ ] Global leaderboard

## 📦 Deployment

### Vercel
```bash
npm install -g vercel
vercel
```

### Netlify
```bash
npm run build
# Drag and drop the 'dist' folder to Netlify
```

### GitHub Pages
```bash
# Update vite.config.ts base to match your repo name
npm run build
# Deploy the 'dist' folder
```

## 🧪 Development

### Mock Data Format

The game uses `src/data/mockCalendar.json` with this structure:

```json
{
  "week": {
    "start": "2025-10-13",
    "end": "2025-10-17"
  },
  "meetings": [
    {
      "id": "m1",
      "title": "1:1 with Sarah",
      "type": "1:1",
      "day": "Monday",
      "startTime": "09:00",
      "endTime": "09:30",
      "color": "#5c6bc0"
    }
  ]
}
```

You can easily replace this with real calendar data from an API.

### Key Files to Modify

- **`MainScene.ts`**: Game logic, collision detection, scoring
- **`calendarGenerator.ts`**: Grid layout and positioning algorithms
- **`physicsModifiers.ts`**: Ball physics behavior per meeting type
- **`mockCalendar.json`**: Meeting data source

## 📝 Code Quality

- **TypeScript**: Full type safety throughout
- **Comments**: Comprehensive documentation
- **Modular**: Clean separation of concerns
- **Best Practices**: React hooks, Phaser lifecycle methods

## 🐛 Troubleshooting

**Game doesn't start**: Check browser console for errors. Ensure all dependencies are installed.

**Ball behavior is erratic**: This is intentional! Different meeting types modify physics dynamically.

**Screen is too small**: The game scales responsively. Try zooming out or using a larger viewport.

## 📄 License

MIT License - Feel free to use this project for learning or building your own calendar game!

## 🙏 Credits

Built with ❤️ using:
- [Phaser 3](https://phaser.io/) - Amazing HTML5 game framework
- [React](https://react.dev/) - UI library
- [Vite](https://vitejs.dev/) - Lightning-fast build tool
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS

---

**Enjoy destroying your meetings!** 🎉

If you have any questions or suggestions, feel free to open an issue or contribute to the project.


