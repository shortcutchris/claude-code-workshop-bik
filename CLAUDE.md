# Projekt: Claude Code Workshop (BIK)

## Tech Stack

### Frontend
- **Framework:** React (mit TypeScript)
- **UI Library:** [shadcn/ui](https://ui.shadcn.com/) — copy-paste Komponenten auf Radix UI Basis
- **Styling:** [Tailwind CSS](https://tailwindcss.com/) — Utility-first CSS
- **Icons:** [Lucide Icons](https://lucide.dev/) — `lucide-react`

### Backend
- **Framework:** [FastAPI](https://fastapi.tiangolo.com/) (Python)
- **Server:** Uvicorn (ASGI)
- **Validation:** Pydantic (kommt mit FastAPI)

## Konventionen

### Frontend
- Komponenten als Function Components mit TypeScript
- shadcn/ui Komponenten via CLI hinzufügen: `npx shadcn@latest add <component>`
- Tailwind-Klassen direkt im JSX, keine separaten CSS-Dateien (außer `globals.css`)
- Icons aus `lucide-react` importieren, Größe via `className` (z.B. `<Search className="h-4 w-4" />`)
- Pfad-Alias `@/*` für Imports nutzen

### Backend
- Async/await für alle Routen (`async def`)
- Pydantic Models für Request/Response Schemas
- Dependency Injection via FastAPI `Depends()`
- API Versionierung: `/api/v1/...`
- OpenAPI Docs automatisch unter `/docs`

### Allgemein
- Konventionelle Commits (`feat:`, `fix:`, `docs:`, `chore:`, `refactor:`, `test:`)
- Commit-Messages auf Englisch
- Keine Secrets im Code — `.env` ist gitignored
- Frontend-Texte für UI: Deutsch (Workshop-Sprache)

## Setup-Hinweise

### Frontend initialisieren
```bash
npm create vite@latest frontend -- --template react-ts
cd frontend
npm install -D tailwindcss @tailwindcss/vite
npm install lucide-react
npx shadcn@latest init
```

### Backend initialisieren
```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install "fastapi[standard]"
fastapi dev main.py
```

## Projektstruktur (geplant)
```
/frontend     # React + Vite + shadcn/ui + Tailwind
/backend      # FastAPI
/Screenshots  # Workshop-Material
CLAUDE.md     # Diese Datei
```
