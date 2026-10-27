# AquaShare – Water Resources Management Application

AquaShare is a web application for recording and reviewing shared water-resource information. It provides a React interface backed by an Express API and MongoDB, with optional AI-assisted descriptions.

## Problem statement

Farmers and communities need a clear way to record the locations and conditions of shared water sources. When resource information is scattered or difficult to maintain, it is harder to discover what is available and keep records current.

## Proposed solution

AquaShare provides a web form and API for creating, viewing, updating, and deleting water-resource records. The form can request an AI-assisted description from a server-side LLM provider or use a clearly labelled local template when no provider key is configured. Suggestions remain editable before they are saved.

## Technology stack

- **Frontend:** React 19, Vite 8, JavaScript, CSS
- **Backend:** Node.js, Express 5 (CommonJS)
- **Database:** MongoDB through Mongoose
- **Authentication:** bcryptjs password hashing, JWT, Passport Google OAuth 2.0
- **AI integration:** OpenAI-compatible chat-completions API using Node's built-in `fetch`; no additional runtime package
- **Testing:** Jest
- **API documentation:** Bruno
- **Optional local deployment:** Docker and Docker Compose

## Architecture overview

```text
Browser (React/Vite)
  └── HTTP requests ──> Express API (server/index.js)
                          ├── Mongoose models ──> MongoDB
                          ├── JWT and Passport Google OAuth
                          ├── Multer file uploads ──> server/uploads
                          └── AI description service ──> configured LLM API
                                                         or local template
```

In local development, the Vite development server proxies `/api` and `/uploads` to `http://localhost:5000`. A production frontend can set the build-time `VITE_API_URL` to the backend origin. The AI API key and database credentials are backend-only environment variables; they must never be exposed as `VITE_*` variables.

## Key features in this repository

- Create and list water-resource records, including name, type, location, optional condition, description, and farmer reference.
- Update a water-resource record with a valid JWT and delete a record through the API.
- Register and log in with a password; passwords are hashed with bcryptjs and login returns a signed JWT.
- Optional Google OAuth routes when server-side OAuth credentials are configured.
- Upload files up to 5 MB through the API.
- Generate an editable resource-description suggestion using a configured LLM, or return a clearly labelled local fallback.
- Health-check endpoints for the API.

The current React interface focuses on listing, adding, and deleting resources and suggesting descriptions. Authentication and update routes exist in the backend; the frontend does not currently provide a complete sign-in or edit workflow.

## Installation

### Requirements

- Node.js 20.19+ (or 22.12+) and npm
- A MongoDB instance, such as a local MongoDB server or MongoDB Atlas
- Optional: Docker Desktop to use Compose

Clone the existing repository:

```powershell
git clone https://github.com/kalviumcommunity/S92_KevinJoeRatchagar_Capstone_Waterresources.git
cd S92_KevinJoeRatchagar_Capstone_Waterresources
```

## Environment setup

For the backend, copy the safe template and edit it locally:

```powershell
Copy-Item server\.env.example server\.env
```

Set these values in `server/.env`:

| Variable | Required | Purpose |
|---|---:|---|
| `MONGODB_URI` | Yes | MongoDB connection string. Use a URL reachable from the backend process. |
| `JWT_SECRET` | Yes for login | Private key used to sign login tokens. Generate your own long random value. |
| `PORT` | No | API port; defaults to `5000`. |
| `GOOGLE_CLIENT_ID` | Optional | Google OAuth client ID. |
| `GOOGLE_CLIENT_SECRET` | Optional | Google OAuth client secret. |
| `GOOGLE_CALLBACK_URL` | Optional | Public URL for `/api/auth/google/callback`. |
| `LLM_API_KEY` | Optional | Server-only API key for an OpenAI-compatible chat-completions provider. Empty selects the local fallback. |
| `LLM_API_URL` | Optional | Provider endpoint; defaults to `https://api.openai.com/v1/chat/completions`. |
| `LLM_MODEL` | Optional | Model name; defaults to `gpt-4o-mini`. |

Never commit `server/.env`, API keys, OAuth secrets, database passwords, or JWT secrets. The checked-in `.env.example` files contain placeholders only.

The client uses `VITE_API_URL` as a build-time setting for the API origin. When unset, API requests are relative to the frontend origin; local Vite development proxies these requests to `http://localhost:5000`. Set `VITE_API_URL` to the public backend origin in the frontend hosting provider's build environment when hosting the frontend separately.

For Docker Compose, copy the root template instead:

```powershell
Copy-Item .env.example .env
```

Set a private MongoDB root password and `JWT_SECRET` in the root `.env` before starting Compose. The sample values are placeholders and must be replaced. Compose forwards optional Google OAuth and LLM configuration to the API service.

## Run the application locally

Start the backend in one terminal:

```powershell
cd server
npm install
npm start
```

Start the frontend in a second terminal:

```powershell
cd client
npm install
npm run dev
```

Open the Vite URL printed in the client terminal (normally `http://localhost:5173`). The API listens on `http://localhost:5000`.

### Optional Docker Compose

After setting up the root `.env` file and installing Docker Desktop:

```powershell
docker compose up --build -d
docker compose ps
```

The Compose configuration exposes the frontend on `http://localhost:8080` and API on `http://localhost:5000`. Stop the services with `docker compose down`. Docker was not available in the environment used to prepare this submission, so this configuration has not been built or run here.

## Tests and checks

Run backend tests and syntax checks:

```powershell
cd server
npm install
npm test
npm run check
```

Run frontend checks:

```powershell
cd client
npm install
npm run lint
npm run build
```

The Jest API tests mock external database and LLM behavior; they do not prove that a live MongoDB or LLM account is configured.

## Deployment links and verification status

- **Frontend:** [https://dulcet-rugelach-deabd2.netlify.app/](https://dulcet-rugelach-deabd2.netlify.app/)
- **Backend:** [https://s92-kevinjoeratchagar-capstone.onrender.com/](https://s92-kevinjoeratchagar-capstone.onrender.com/)

These are the deployment URLs provided for the project. Checked on **27 October 2026**, the frontend returned **401 Unauthorized**. Requests to the backend timed out in one check, and a separate health-endpoint check returned **503 Service Unavailable**. The links therefore could not be verified as publicly usable, and live authentication and end-to-end workflows could not be tested. A local API startup did connect to MongoDB, and local `GET /api/health` and `GET /api/water-resources` both returned HTTP 200.

To investigate, check that the latest Netlify deploy is published and review the site's access/password protection settings. For Render, check the service state and deploy logs, confirm its required environment variables are set, and verify that its MongoDB URI is reachable from Render. The repository's `netlify.toml` sets the frontend API origin to the supplied Render URL. Re-test both links after deployment changes; do not treat them as confirmed working until they respond successfully.

## API routes

The Bruno requests are in [`bruno/`](./bruno). API routes currently implemented in `server/index.js`:

| Method | Path | Purpose | Authentication |
|---|---|---|---|
| `GET` | `/` | API status message | None |
| `GET` | `/api/health` | Health response | None |
| `POST` | `/api/upload` | Upload one `file` (maximum 5 MB) | None |
| `POST` | `/api/auth/register` | Register a local account | None |
| `POST` | `/api/auth/login` | Verify credentials and return a JWT | None |
| `GET` | `/api/auth/google` | Begin Google OAuth | Google credentials required |
| `GET` | `/api/auth/google/callback` | Complete Google OAuth and return a JWT | Google credentials required |
| `GET` | `/api/auth/google/failure` | OAuth failure response | None |
| `POST` | `/api/farmers` | Create a farmer | None |
| `GET` | `/api/farmers` | List farmers | None |
| `POST` | `/api/ai/description` | Return an LLM or local description suggestion | None |
| `POST` | `/api/water-resources` | Create a resource | None |
| `GET` | `/api/water-resources` | List resources | None |
| `PUT` | `/api/water-resources/:id` | Update a resource | Bearer JWT |
| `DELETE` | `/api/water-resources/:id` | Delete a resource | None in current implementation |

`POST /api/ai/description` accepts JSON containing `name`, `type`, `location`, and optional `condition`. Required details must be non-empty text; each detail is limited to 500 characters. A successful response includes `description` and `source` (`llm` or `local`).

For protected updates, send `Authorization: Bearer <token>`. Resource writes require a valid farmer reference when MongoDB model validation is applied.

## Environment and security notes

- Root `.gitignore` and `client/.gitignore` exclude local environment files, dependencies, uploads, and frontend build output; `.dockerignore` keeps environment files and unnecessary files out of build contexts.
- Google OAuth is disabled unless both `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set on the server.
- The AI provider is called only by the backend. Without `LLM_API_KEY`, the backend uses a deterministic local text template and labels the response `source: "local"`.
- Current API routes for creating/deleting records and file uploads are not authenticated. Add authorization and rate limits before using the service with sensitive or production data.

## Project structure

```text
client/                 React/Vite frontend, Dockerfile, and Nginx config
  src/                  Application components and styles
server/                 Express API and Dockerfile
  config/               Passport OAuth configuration
  models/               Mongoose User, Farmer, and WaterResource schemas
  services/             AI description provider and local fallback
  tests/                Jest tests
  uploads/              Local upload storage (ignored by Git)
bruno/                  Bruno API request collection
docker-compose.yml      Optional frontend/API/MongoDB stack
.env.example            Compose environment template
server/.env.example     Backend local environment template
```

## Technical decisions, challenges, and limitations

- The frontend and backend are separate apps. Vite proxies API/upload requests locally; production frontend builds need the correct backend origin.
- MongoDB connection and web-server startup happen in the backend's `startServer`; the API does not start if `MONGODB_URI` is missing or connection fails.
- Passport registers Google OAuth only when server credentials exist, so the app can start without OAuth secrets.
- The description provider uses the built-in Node `fetch` API to avoid a new runtime dependency. A local template keeps the interface usable without claiming a real LLM was used.
- Uploaded files are stored on local disk under `server/uploads`; persistent storage and upload protections should be reviewed for production.
- Backend create/delete/upload routes are unauthenticated, the frontend has no full auth UI, and public deployment access remains unverified as noted above.

## Future improvements

- Restore public deployment access and test the full live workflow.
- Add frontend authentication and authorization for write, delete, and upload endpoints.
- Add automated integration tests against an isolated test database and provider contract tests.
- Move uploads to durable object storage and add file-type validation.
- Add pagination, search, monitoring measurements, and water-allocation workflows as the product scope grows.

## Contributors

- **Kevin Joe Ratchagar** — Kalvium Capstone, Squad S92
