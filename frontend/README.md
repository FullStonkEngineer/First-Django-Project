# Notes App

A full-stack notes application built to demonstrate production-ready patterns across the Django and React ecosystems.
---

## Stack

| Layer         | Technology                                                 |
| ------------- | ---------------------------------------------------------- |
| Backend       | Django 5 + Django REST Framework                           |
| Real-time     | Django Channels 4 + Daphne (ASGI)                          |
| Database      | PostgreSQL                                                 |
| Auth          | JWT via `djangorestframework-simplejwt`                    |
| Frontend      | React 18 + React Router v6                                 |
| Data fetching | TanStack Query v5 (`useInfiniteQuery`, optimistic updates) |
| HTTP client   | Axios (request/response interceptors)                      |

---

## Features

- Register, log in, and log out with JWT auth (access + refresh tokens, silent refresh)
- Create, edit, and delete personal notes
- **Tag notes** with a chip-style tag input; filter the list by any tag
- **Full-text search** across title and content (debounced, wired through React Query)
- **Paginated list** (10 per page, infinite scroll with Load More)
- **Optimistic UI** — deletes and edits update the cache instantly and roll back on error
- **Real-time sync** — a WebSocket connection pushes note events to all open tabs
- Users can only see and modify their own notes (enforced at the service layer and tested)
- Toast notifications for all user-facing errors and successes
- Error boundary around the notes list with a recoverable fallback

---

## Architecture

### Backend

```
backend/
├── api/
│   ├── models.py       # Note + Tag (M2M, unique_together per user)
│   ├── serializers.py  # Separate read (tags) and write (tag_names) fields
│   ├── selectors.py    # Read-only queries: search_notes_for_user, get_tags_for_user
│   ├── services.py     # Mutation logic + WebSocket broadcast after each change
│   ├── views.py        # Thin HTTP layer — delegates to selectors and services
│   ├── urls.py         # REST URL patterns
│   ├── consumers.py    # JWT-authenticated AsyncWebsocketConsumer
│   ├── routing.py      # WebSocket URL patterns
│   └── tests.py        # Service, selector, API view, and WS consumer tests
└── backend/
    ├── settings.py
    └── asgi.py         # ProtocolTypeRouter: HTTP → Django, WS → Channels
```

**Design principles:**

- **Thin views.** Views handle HTTP concerns only — no business logic.
- **Service layer.** All mutations live in `services.py`. Each one broadcasts a WebSocket event after completing.
- **Selector layer.** Read-only queries live in `selectors.py`. `search_notes_for_user` uses Django `Q` objects for OR-based full-text search and `.distinct()` to prevent duplicates on tag joins.
- **Correct HTTP semantics.** Missing/unauthorized resources raise `NotFound` (404), not `ValidationError` (400).
- **User-scoped tags.** `unique_together = ('name', 'author')` means two users can both have a tag named "python" without colliding.

### Frontend

```
src/
├── pages/
│   ├── Home.jsx        # Search bar, tag filter pills, notes list, form, load more
│   ├── Login.jsx
│   ├── Register.jsx
│   └── NotFound.jsx
├── components/
│   ├── Note.jsx        # Card with inline edit + tag display/editing
│   ├── NotesList.jsx   # Wrapped in ErrorBoundary; shows EmptyState when empty
│   ├── NoteForm.jsx    # Chip-style tag input (Enter/comma to add, Backspace to remove)
│   ├── Form.jsx        # Auth form with toast error handling
│   ├── EmptyState.jsx
│   ├── ErrorBoundary.jsx
│   ├── ProtectedRoute.jsx
│   └── Loading.jsx
├── hooks/
│   ├── useAuth.jsx     # AuthContext: user, login, logout, silent token refresh
│   ├── useNotes.js     # useInfiniteQuery + optimistic mutations + search/filter state
│   └── useWebSocket.js # Authenticated WebSocket with exponential backoff reconnect
├── context/
│   └── ToastContext.jsx
└── lib/
    ├── api.js          # Axios instance: Bearer token injection + 401 refresh retry
    └── notes.js        # getNotes, createNote, updateNote, deleteNote, getTags
```

**Design principles:**

- **No API calls in components.** All data fetching goes through `useNotes` or `useAuth`.
- **Optimistic updates with rollback.** Mutations patch the cache immediately in `onMutate`, store a snapshot, and restore it in `onError`. `onSettled` refetches to reconcile.
- **Debounced search.** A 400ms debounce on `searchInput` prevents a request on every keystroke.
- **Query key scoping.** The notes query key is `['notes', { search, tags }]` so filtered and unfiltered results live in separate cache entries.
- **WebSocket invalidation.** Any incoming WS event calls `queryClient.invalidateQueries` on `['notes']` and `['tags']`, triggering a background refetch.

---

## API Reference

### Auth

| Method | Endpoint              | Auth | Description                                   |
| ------ | --------------------- | ---- | --------------------------------------------- |
| POST   | `/api/user/register/` | No   | Create an account                             |
| POST   | `/api/token/`         | No   | Log in — returns `access` + `refresh` tokens  |
| POST   | `/api/token/refresh/` | No   | Exchange refresh token for a new access token |

### Notes

| Method | Endpoint                  | Auth | Description                        |
| ------ | ------------------------- | ---- | ---------------------------------- |
| GET    | `/api/notes/`             | Yes  | List notes (paginated, filterable) |
| POST   | `/api/notes/`             | Yes  | Create a note                      |
| PATCH  | `/api/notes/<id>/update/` | Yes  | Update a note                      |
| DELETE | `/api/notes/<id>/`        | Yes  | Delete a note                      |

**Query parameters for `GET /api/notes/`**

| Param       | Type   | Example               | Description                                |
| ----------- | ------ | --------------------- | ------------------------------------------ |
| `page`      | int    | `?page=2`             | Page number (default 1)                    |
| `page_size` | int    | `?page_size=20`       | Results per page (default 10, max 100)     |
| `search`    | string | `?search=django`      | Case-insensitive match on title or content |
| `tags`      | string | `?tags=python,django` | Comma-separated tag names; OR semantics    |

**Paginated response shape**

```json
{
  "count": 42,
  "next": "http://localhost:8000/api/notes/?page=2",
  "previous": null,
  "results": [
    {
      "id": 1,
      "title": "Django tips",
      "content": "The ORM is great",
      "created_at": "2025-01-01T12:00:00Z",
      "updated_at": "2025-01-02T09:30:00Z",
      "author": 1,
      "tags": [
        { "id": 1, "name": "django" },
        { "id": 2, "name": "backend" }
      ]
    }
  ]
}
```

**Create / update request body**

```json
{
  "title": "My note",
  "content": "Some content",
  "tag_names": ["python", "django"]
}
```

Tags are created automatically if they don't exist and are normalised to lowercase.

### Tags

| Method | Endpoint     | Auth | Description                              |
| ------ | ------------ | ---- | ---------------------------------------- |
| GET    | `/api/tags/` | Yes  | List all tags for the authenticated user |

### WebSocket

```
ws://localhost:8000/ws/notes/?token=<access_token>
```

The server pushes events after any note mutation. The client never sends messages.

**Event shape**

```json
{ "action": "created", "note_id": 42 }
{ "action": "updated", "note_id": 42 }
{ "action": "deleted", "note_id": 42 }
```

---

## Local Setup

### Prerequisites

- Python 3.11+
- Node.js 18+
- PostgreSQL (or change `DATABASES` to SQLite for local dev)

### Backend

```bash
git clone <repo-url>
cd notes-app

python -m venv venv
source venv/bin/activate       # Windows: venv\Scripts\activate

pip install -r requirements.txt

cp backend/.env.example backend/.env
# Edit .env — fill in SECRET_KEY and DATABASE_URL

python manage.py migrate
python manage.py createsuperuser  # optional

python manage.py runserver        # Daphne handles both HTTP and WS
```

### Frontend

```bash
cd frontend
npm install

cp .env.example .env
# Set VITE_API_URL=http://localhost:8000

npm run dev
```

---

## Environment Variables

### Backend — `backend/.env`

```env
SECRET_KEY=your-secret-key-here
DEBUG=True
DATABASE_URL=postgres://user:password@localhost:5432/notesdb
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:5173
```

### Frontend — `frontend/.env`

```env
VITE_API_URL=http://localhost:8000
# VITE_WS_URL=ws://localhost:8000  # optional — derived from VITE_API_URL by default
```

---

## Running Tests

```bash
# Run the full test suite
python manage.py test api

# Run a specific class
python manage.py test api.tests.NoteAPITests
python manage.py test api.tests.NoteWebSocketTests
```

| Test class           | Coverage                                                                    |
| -------------------- | --------------------------------------------------------------------------- |
| `NoteServiceTests`   | create, update, delete, tag normalisation, cross-user isolation             |
| `NoteSearchTests`    | full-text search, tag filtering, combined filters                           |
| `NoteAPITests`       | auth enforcement, CRUD, pagination, search, tag endpoints (via `APIClient`) |
| `NoteWebSocketTests` | JWT auth, rejection, end-to-end broadcast from service layer → WS client    |

---

## Deployment

### Backend — Railway

1. Create a new Railway project, connect the repo, add a **PostgreSQL** plugin
2. Set env vars: `SECRET_KEY`, `DEBUG=False`, `ALLOWED_HOSTS`, `CORS_ALLOWED_ORIGINS`
3. Set the start command: `daphne -b 0.0.0.0 -p $PORT backend.asgi:application`
4. Run migrations via the Railway shell: `python manage.py migrate`

> **WebSockets at scale:** The default `InMemoryChannelLayer` works for a single instance. For horizontal scaling, add a Redis plugin to Railway and switch to `channels_redis` in `CHANNEL_LAYERS`.

### Frontend — Vercel

1. Import the `frontend/` directory into Vercel
2. Set `VITE_API_URL` to your Railway backend URL
3. Deploy — Vercel auto-detects Vite

---

## Key Packages

### Backend

```
django
djangorestframework
djangorestframework-simplejwt
django-cors-headers
channels
daphne
psycopg2-binary
python-decouple
```

### Frontend

```
react
react-router-dom
@tanstack/react-query
axios
jwt-decode
```
