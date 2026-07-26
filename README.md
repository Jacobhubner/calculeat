# Calculeat

Calculeat – Räkna kalorier & näringsvärde enkelt. Det smarta verktyget för kostloggning, träning och aktivitetsnivåer – från nybörjare till avancerade bodybuilders.

## 🚀 Tech Stack

- **React 18** med TypeScript (strict mode)
- **Vite** för build tooling
- **React Router v6+** för routing
- **Zustand** för state management
- **TanStack Query** för data fetching
- **React Hook Form + Zod** för formulär och validering
- **Tailwind CSS** för styling
- **Lucide React** för ikoner
- **Framer Motion** för microinteraktioner
- **Recharts** för diagram
- **date-fns** för datumhantering

## 📦 Installation

```bash
npm install
```

## 🛠️ Development

Starta utvecklingsservern:

```bash
npm run dev
```

## 🔨 Build

Bygg för produktion:

```bash
npm run build
```

Preview av produktionsbygg:

```bash
npm run preview
```

## ✨ Code Quality

### Linting

Kör ESLint:

```bash
npm run lint
```

Fixa auto-fixable issues:

```bash
npm run lint:fix
```

### Formatting

Formatera kod med Prettier:

```bash
npm run format
```

Kontrollera formatering:

```bash
npm run format:check
```

## 🎨 Design System

### Färger

- **Primary**: Teal/emerald (#0EA5A3, #14B8A6)
- **Accent**: Orange (#F97316)
- **Success**: Grön (#22C55E)
- **Neutral**: Skalor från #F3F4F6 till #0B0F14

### Policy

- ❌ Inga lila färger
- ❌ Inga fade-in/out animationer
- ✅ Små scale/translate microinteraktioner (≤200ms)
- ✅ Modern, ren fitness/nutrition-känsla

## 📁 Projektstruktur

```
src/
├── components/       # Återanvändbara komponenter
│   ├── layout/      # Layout komponenter (Header, Footer)
│   └── ui/          # UI primitives (Button, Card)
├── pages/           # Sidor/routes
├── lib/             # Utilities
└── main.tsx         # Entry point
```

## 🚢 Deployment

Projektet är konfigurerat för GitHub Pages. Push till main branch för att deploya.

## 📝 Commits

Projektet använder [Conventional Commits](https://www.conventionalcommits.org/).

Exempel:

- `feat: add calorie tracking feature`
- `fix: resolve mobile navigation bug`
- `docs: update README`

## 🤝 Contributing

1. Skapa en feature branch
2. Gör dina ändringar
3. Commita med conventional commits
4. Push och skapa PR

## 📄 License

MIT
