# 📅 Calendar Breakout

<p align="center">
  <strong>An Outlook-styled breakout game to destroy your meetings!</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
  <img src="https://img.shields.io/badge/Phaser-3-purple?style=for-the-badge" alt="Phaser 3" />
  <img src="https://img.shields.io/badge/Node-20-green?style=for-the-badge&logo=node.js" alt="Node 20" />
</p>

---

## 🎮 Game Overview

Clear your Outlook calendar by destroying all meetings with physics-based gameplay! Navigate through 52 weeks of back-to-back meetings, double bookings, and meeting hell. Each meeting type has unique physics effects that modify ball behavior.

### Features

✨ **Outlook-Inspired Design** - Authentic Microsoft calendar aesthetic  
🎯 **52-Week Campaign** - Clear an entire year of meetings  
⚡ **Physics Effects** - Each meeting type modifies gameplay  
📊 **Multi-Hit Blocks** - Boss meetings require 3 hits to destroy  
🎨 **Theme Support** - Outlook, Google Calendar, or default themes  
📱 **Responsive** - Works on desktop and mobile  

---

## 🚀 Quick Start

### Prerequisites

* **Node.js 20 LTS** (use `.nvmrc` for automatic version)
* npm (not pnpm unless your repo uses it)

```bash
# Check Node version
node -v  # Should be v20.x

# If not, install via nvm
nvm install 20
nvm use 20
```

### Installation

```bash
# Clone the repository
git clone https://github.com/Savvyoverthinking/Bored_Ball.git
cd Bored_Ball

# Install dependencies
npm install

# Start development server
npm run dev
```

The game will be available at `http://localhost:3000`

### Build for Production

```bash
npm run build
npm run preview
```

---

## 🎮 Controls

| Input | Action |
|-------|--------|
| **Mouse / Touch** | Move paddle |
| **Click / Tap** | Launch ball |
| **Space** | Pause game |
| **R** | Restart level |
| **M** | Toggle mute |

---

## 🎯 Meeting Types & Effects

| Type | Hits | Effect | Color |
|------|------|--------|-------|
| **1:1** 🟣 | 2 | +10% speed | Purple |
| **Team** 🟢 | 2 | Split ball (max 3 total) | Green |
| **Boss** 🔴 | 3 | Speed ×1.8 | Red |
| **Lunch** 🟡 | 1 | Normalize speed | Yellow |
| **Personal** 🟣 | 1 | Reset bounce | Violet |

### Scoring
- **5 points** per hit
- **Bonus points** for destroying harder blocks (Boss = 30 total)
- Score persists across all 52 weeks

---

## 🎨 Themes

Add query parameters to try different calendar styles:

```
http://localhost:3000?theme=outlook   # Microsoft Outlook (default)
http://localhost:3000?theme=google    # Google Calendar
http://localhost:3000?theme=default   # Generic style
```

---

## 🛠️ Development

### Scripts

```bash
npm run dev        # Start dev server (port 3000)
npm run build      # Build for production
npm run preview    # Preview production build (port 4173)
npm run typecheck  # TypeScript type checking
npm run lint       # ESLint code linting
npm run format     # Prettier code formatting
```

### Project Structure

```
calendar-breakout/
├── src/
│   ├── components/
│   │   └── CalendarBreakout.tsx    # React wrapper
│   ├── game/
│   │   ├── MainScene.ts            # Core game logic ⭐
│   │   ├── calendarGenerator.ts    # Grid layout engine
│   │   ├── physicsModifiers.ts     # Meeting effects
│   │   ├── constants.ts            # Game balance config
│   │   └── theme.ts                # Theme system
│   ├── data/
│   │   └── mockCalendar.json       # Meeting data (36 meetings)
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── public/
│   └── sprites/                    # Sprite atlas (optional)
│       ├── outlook_sprites.json
│       └── README.md
├── .github/workflows/
│   ├── ci.yml                      # CI pipeline
│   └── pages.yml                   # GitHub Pages deploy
└── docs/                           # Documentation
```

---

## 🎨 Sprite System (Optional)

The game currently uses code-drawn graphics. For Outlook-authentic sprites:

1. Generate sprite atlas using TexturePacker
2. Place in `public/sprites/outlook_sprites.png`
3. See `public/sprites/README.md` for details

**Atlas Frames:**
- `bg_grid`, `frame_outer`
- `event_15`, `event_30`, `event_45`, `event_60`
- `time_rule`, `day_header`

---

## 🧪 Testing

### Manual Testing Checklist

- [ ] Ball visible and launches on click
- [ ] Paddle follows mouse/touch
- [ ] Blocks require correct number of hits
- [ ] Ball speed clamped (doesn't go infinite)
- [ ] Max 3 balls enforced (team meetings)
- [ ] Week progression works (1 → 52)
- [ ] Score persists across weeks
- [ ] Lives system functional
- [ ] Win/lose overlays display
- [ ] Keyboard controls work

---

## 🚀 Deployment

### GitHub Pages (Automatic)

Push to `main` branch triggers automatic deployment to GitHub Pages.

**Setup:**
1. Go to repo **Settings → Pages**
2. Source: **GitHub Actions**
3. Push code to `main`
4. Game will be live at: `https://savvyoverthinking.github.io/Bored_Ball/`

### Vercel (Alternative)

1. Import project at [vercel.com](https://vercel.com)
2. Connect GitHub repository
3. Deploy automatically on push

---

## 📊 Game Mechanics

### Calendar Layout
- **Days:** Monday - Friday (5 columns)
- **Hours:** 9 AM - 5 PM (8 hours)
- **Meeting Durations:** 15, 30, 45, or 60 minutes
- **Double Bookings:** Overlapping meetings (realistic chaos!)

### Physics System
- **Base Speed:** 260 px/s
- **Min Speed:** 200 px/s (prevents too slow)
- **Max Speed:** 700 px/s (prevents runaway acceleration)
- **Ball Pooling:** Efficient multi-ball management
- **Velocity Clamping:** Applied after every collision

### Progression
- **52 Weeks** total (full year)
- **3 Lives** per game
- Lives carry over between weeks
- Score accumulates across entire year

---

## 🔮 Roadmap

### Planned Features
- [ ] Sound effects (paddle hit, block destroy)
- [ ] Particle effects on block destruction
- [ ] Power-ups (wider paddle, slow ball, extra life)
- [ ] Difficulty scaling (later weeks harder)
- [ ] Local high score persistence
- [ ] Mobile touch optimization

### Calendar API Integration
- [ ] Google Calendar OAuth2 PKCE
- [ ] Microsoft Graph API (Outlook)
- [ ] Real-time calendar sync
- [ ] Custom meeting import

---

## 📝 Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style
- Run `npm run format` before committing
- Ensure `npm run typecheck` passes
- Follow existing patterns

---

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details

Copyright (c) 2025 Savvy Overthinking

---

## 🙏 Credits

**Built with:**
- [Phaser 3](https://phaser.io/) - HTML5 game framework
- [React 18](https://react.dev/) - UI library
- [TypeScript](https://www.typescriptlang.org/) - Type safety
- [Vite](https://vitejs.dev/) - Build tool
- [Tailwind CSS](https://tailwindcss.com/) - Styling

**Inspired by:**
- Microsoft Outlook Calendar
- Classic Breakout/Arkanoid
- Meeting overload culture

---

## 💬 Support

- **Issues:** [GitHub Issues](https://github.com/Savvyoverthinking/Bored_Ball/issues)
- **Discussions:** [GitHub Discussions](https://github.com/Savvyoverthinking/Bored_Ball/discussions)

---

<p align="center">
  <strong>Destroy your meetings!</strong> 🎉
</p>

<p align="center">
  Made with ❤️ by <a href="https://github.com/Savvyoverthinking">Savvy Overthinking</a>
</p>
