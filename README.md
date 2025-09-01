# Pokemon Tracker Vue

A modern Pokemon collection tracker built with Vue 3, featuring Google Sheets integration for cloud sync and a beautiful responsive interface.

## ✨ Features

- 🎯 **Complete Pokemon Database** - All 1025+ Pokemon from PokeAPI
- ☁️ **Google Sheets Sync** - Automatic cloud backup of your collection
- 🔍 **Smart Search** - Jump to any Pokemon with autocomplete
- 📱 **Responsive Design** - Works perfectly on desktop and mobile
- 💾 **Local Caching** - 7-day cache for instant loading
- 🎨 **Pokemon-themed UI** - Beautiful cards with official artwork
- 🔄 **Individual Sync** - Real-time sync when toggling Pokemon

## 🚀 Live Demo

Visit the live application: [Pokemon Tracker](https://pedrofabrino.github.io/PokemonTracker-Vue/)

## 🛠️ Setup & Development

### Prerequisites

- Node.js 20+ 
- npm or yarn
- Google account (for cloud sync)

### Environment Variables

Create a `.env` file in the root directory:

```env
VITE_GOOGLE_OAUTH_CLIENT_ID=your_google_oauth_client_id_here
```

### Installation

```bash
# Clone the repository
git clone https://github.com/PedroFabrino/PokemonTracker-Vue.git
cd PokemonTracker-Vue

# Install dependencies
npm install

# Start development server
npm run dev
```

## 📋 Available Scripts

### Development

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build locally
```

### Quality Assurance

```bash
npm run test:unit    # Run unit tests
npm run test:e2e     # Run end-to-end tests
npm run lint         # Run ESLint
npm run format       # Format code with Prettier
```

## 🔧 Configuration

### Google Sheets Integration

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing one
3. Enable Google Sheets API
4. Create OAuth 2.0 Client ID credentials
5. Add your domain to authorized origins
6. Copy the Client ID to your `.env` file

### GitHub Pages Deployment

The project includes automated GitHub Pages deployment via GitHub Actions. To deploy:

1. Fork this repository
2. Add `VITE_GOOGLE_OAUTH_CLIENT_ID` to repository secrets
3. Enable GitHub Pages in repository settings
4. Push changes to trigger deployment

## 🏗️ Architecture

- **Vue 3** with Composition API
- **TypeScript** for type safety  
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **Pinia** for state management
- **Vue Router** for navigation

## 📝 License

MIT License - see LICENSE file for details.

## 📋 Available Scripts

### Project Setup

```sh
npm install
```

### Compile and Hot-Reload for Development

```sh
npm run dev
```

### Type-Check, Compile and Minify for Production

```sh
npm run build
```

### Run Unit Tests with [Vitest](https://vitest.dev/)

```sh
npm run test:unit
```

### Run End-to-End Tests with [Playwright](https://playwright.dev)

```sh
# Install browsers for the first run
npx playwright install

# When testing on CI, must build the project first
npm run build

# Runs the end-to-end tests
npm run test:e2e
# Runs the tests only on Chromium
npm run test:e2e -- --project=chromium
# Runs the tests of a specific file
npm run test:e2e -- tests/example.spec.ts
# Runs the tests in debug mode
npm run test:e2e -- --debug
```

### Lint with [ESLint](https://eslint.org/)

```sh
npm run lint
```
