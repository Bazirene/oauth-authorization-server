# In-Memory OAuth 2.0 Authorization Server

A lightweight, production-focused OAuth 2.0 Authorization Server built using Node.js, Express, and `@node-oauth/express-oauth-server`. This project implements the secure `authorization_code` grant flow alongside an isolated Docker Compose infrastructure featuring Python, PostgreSQL (with SCRAM-SHA-256 encryption), and Redis.

## 🚀 System Architecture & Infrastructure

The application decouples its functional routing boundaries from data models, utilizing an in-memory data store for authorization artifacts while provisioning isolated multi-tier networks via Docker:

*   **Auth Server (Node.js/Express):** Handles client verification, authorization code generation, and access/refresh token issue cycles.
*   **App Service (`ihifix_app_week3`):** Python-based isolated worker execution module.
*   **Database Module (`ihifix_postgres_week3`):** Secure PostgreSQL 15 engine utilizing SCRAM-SHA-256 password authentication.
*   **Caching Engine (`ihifix_redis_week3`):** Password-protected Redis 7 instance handling data caching boundaries.

---

## 🛠️ Installation & Local Setup

### Prerequisites
*   Node.js (v18+ or v24+)
*   `pnpm` (Package Manager)
*   Docker & Docker Compose V2

### 1. Repository Installation
Ensure you install dependencies using `pnpm` to preserve the system lockfile configuration:
```bash
pnpm install
```

### 2. Provisioning Infrastructure
Boot up the isolated multi-network data containers in detached mode:
```bash
docker compose up -d
```
*Verification Check:* Run `docker compose ps` to ensure `ihifix_app_week3`, `ihifix_postgres_week3`, and `ihifix_redis_week3` display an active, green `Running` status.

### 3. Launching the Auth Server
Start the local development server process:
```bash
node server.js
```
The server will bind cleanly and listen for incoming HTTP traffic on `http://localhost:3002`.

---

## 🔄 Executing the OAuth 2.0 Flow Sequentially

Because this development server utilizes an in-memory data store (`const codes = []`, `const accessTokens = []`), **restarting the Node.js process will flush all active sessions.** Follow this sequence sequentially without restarting the server mid-flow.

### Step 1: Request an Authorization Code
Paste the following URL into your browser address bar to initiate the user authorization request:
```text
http://localhost:3002/oauth/authorize?response_type=code&client_id=osc-client&redirect_uri=http://localhost:8888/callback&scope=read&state=abc123xyz
```
The server will process the middleware request and redirect you to the specified `redirect_uri` target callback payload. Look at your browser address bar and copy the newly generated `code` value:
```text
http://localhost:8888/callback?code=YOUR_GENERATED_CODE_HERE&state=abc123xyz
```

### Step 2: Exchange Authorization Code for Access & Refresh Tokens
Open your terminal and execute the following token-exchange payload via `curl`, replacing `YOUR_GENERATED_CODE_HERE` with the token extracted from the step above:

```bash
curl -s -X POST "http://localhost:3002/oauth/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=authorization_code&code=YOUR_GENERATED_CODE_HERE&client_id=osc-client&client_secret=osc-secret-123&redirect_uri=http://localhost:8888/callback"
```

**Expected JSON Response:**
```json
{
  "access_token": "f0a479702a1c6de6ec170ac1e4b5...",
  "token_type": "Bearer",
  "expires_in": 7199,
  "refresh_token": "0af4cbe5a9bd93d42c844db720e..."
}
```

### Step 3: Access the Protected Profile Resource
Execute an authorized API resource lookup request. Ensure you extract the specific `"access_token"` string value (do **not** pass the refresh token) to authenticate against the user secure layer:

```bash
curl -i -H "Authorization: Bearer YOUR_EXTRACTED_ACCESS_TOKEN" "http://localhost:3002/api/profile"
```

**Expected Response Payload:**
```json
HTTP/1.1 200 OK
Content-Type: application/json; charset=utf-8

{
  "user": {
    "id": 1,
    "name": "User 1"
  },
  "issued_to": "osc-client"
}
```

---

## 📁 Repository Structure Blueprint

```text
auth-server/
├── .gitignore               # Strict project file whitelist map
├── README.md                # Project architecture and flow guide
├── model.js                 # In-memory token & validation logic
├── package.json             # Engine script declarations and node manifests
├── pnpm-lock.yaml           # pnpm resolution dependency tree map
└── server.js                # Core Express API middleware routing logic
```
