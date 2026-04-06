# 🛡️ ANTIGRAVITY PROJECT — SECURITY & BEST PRACTICES SKILL

> **Version:** 1.0.0  
> **Scope:** Full-stack project security, Git hygiene, deployment hardening, secret management, CI/CD safety  
> **Use this when:** Starting, maintaining, or deploying any Antigravity project module

---

## 📋 TABLE OF CONTENTS

1. [Secret & Credential Management](#1-secret--credential-management)
2. [Git Security & Hygiene](#2-git-security--hygiene)
3. [Environment Configuration](#3-environment-configuration)
4. [Dependency Security](#4-dependency-security)
5. [Code-Level Security Practices](#5-code-level-security-practices)
6. [Deployment Security](#6-deployment-security)
7. [API & Network Security](#7-api--network-security)
8. [Access Control & Authentication](#8-access-control--authentication)
9. [Logging & Monitoring](#9-logging--monitoring)
10. [Pre-Push & Pre-Deploy Checklist](#10-pre-push--pre-deploy-checklist)
11. [Incident Response Playbook](#11-incident-response-playbook)
12. [Repository Structure Template](#12-repository-structure-template)

---

## 1. SECRET & CREDENTIAL MANAGEMENT

### ❌ NEVER DO THIS
```bash
# Never hardcode secrets anywhere in source files
API_KEY = "sk-prod-abc123xyz789"              # ❌ CRITICAL VIOLATION
DB_PASSWORD = "MySecretPass123"               # ❌ CRITICAL VIOLATION
JWT_SECRET = "supersecretjwt"                 # ❌ CRITICAL VIOLATION
```

### ✅ ALWAYS DO THIS

#### Use `.env` files locally
```bash
# .env (NEVER commit this file)
ANTIGRAVITY_API_KEY=sk-prod-abc123xyz789
DB_PASSWORD=MySecretPass123
JWT_SECRET=supersecretjwt
STRIPE_SECRET=sk_live_xxxxx
AWS_SECRET_ACCESS_KEY=xxxxxxxxxxxxxxxx
```

#### Load them safely in code
```python
# Python
import os
from dotenv import load_dotenv

load_dotenv()
api_key = os.getenv("ANTIGRAVITY_API_KEY")
if not api_key:
    raise EnvironmentError("ANTIGRAVITY_API_KEY is not set. Check your .env file.")
```

```javascript
// Node.js
require('dotenv').config();
const apiKey = process.env.ANTIGRAVITY_API_KEY;
if (!apiKey) throw new Error("ANTIGRAVITY_API_KEY missing from environment.");
```

#### Use Secret Managers in Production
| Platform | Secret Manager |
|---|---|
| AWS | AWS Secrets Manager / SSM Parameter Store |
| GCP | Google Secret Manager |
| Azure | Azure Key Vault |
| Self-hosted | HashiCorp Vault |
| GitHub Actions | GitHub Encrypted Secrets |
| Vercel/Netlify | Platform Environment Variables (encrypted) |

---

## 2. GIT SECURITY & HYGIENE

### 2.1 The `.gitignore` — THE MOST IMPORTANT FILE

Create this at the **project root** before the first commit:

```gitignore
# ============================================
# ANTIGRAVITY PROJECT — .gitignore
# ============================================

# --- SECRETS & CREDENTIALS (CRITICAL) ---
.env
.env.*
.env.local
.env.development
.env.production
.env.staging
*.pem
*.key
*.p12
*.pfx
*.cer
*.crt
id_rsa
id_ed25519
credentials.json
service-account*.json
secrets/
vault/
.secrets

# --- API KEYS & CONFIG ---
config/secrets.yml
config/secrets.json
*_credentials.json
*secret*
*password*
*apikey*
*.token

# --- CLOUD PROVIDER FILES ---
.aws/
.gcloud/
.azure/
terraform.tfvars
*.tfstate
*.tfstate.backup
.terraform/

# --- DATABASES ---
*.sqlite
*.sqlite3
*.db
dump.sql
*.sql.gz

# --- DEPENDENCY DIRECTORIES ---
node_modules/
__pycache__/
*.pyc
*.pyo
.venv/
venv/
env/
.env/
dist/
build/
*.egg-info/
.eggs/

# --- IDE & EDITOR ---
.idea/
.vscode/settings.json
.vscode/*.code-workspace
*.suo
*.swp
*.swo
.DS_Store
Thumbs.db

# --- LOGS & TEMP ---
logs/
*.log
*.tmp
*.temp
tmp/
temp/
.cache/

# --- COVERAGE & TEST OUTPUT ---
coverage/
.coverage
htmlcov/
.pytest_cache/
.nyc_output/

# --- BUILD ARTIFACTS ---
*.min.js.map
*.chunk.js
.next/
.nuxt/
out/
```

### 2.2 Git Hooks — Catch Secrets Before They Land

Install **pre-commit** hooks to auto-scan before every commit:

```bash
# Install gitleaks (secret scanner)
brew install gitleaks                    # macOS
# OR
curl -sSfL https://github.com/gitleaks/gitleaks/releases/latest/download/gitleaks_linux_x64.tar.gz | tar -xz

# Install pre-commit framework
pip install pre-commit
```

Create `.pre-commit-config.yaml` at project root:
```yaml
repos:
  - repo: https://github.com/gitleaks/gitleaks
    rev: v8.18.0
    hooks:
      - id: gitleaks
        name: 🔍 Scan for secrets (gitleaks)

  - repo: https://github.com/pre-commit/pre-commit-hooks
    rev: v4.5.0
    hooks:
      - id: check-merge-conflict
      - id: check-yaml
      - id: check-json
      - id: check-toml
      - id: end-of-file-fixer
      - id: trailing-whitespace
      - id: detect-private-key
        name: 🔑 Detect private keys
      - id: check-added-large-files
        args: ['--maxkb=500']
        name: 📦 Block large file commits

  - repo: https://github.com/PyCQA/bandit
    rev: 1.7.5
    hooks:
      - id: bandit
        name: 🐍 Python security lint (bandit)
        args: ["-r", ".", "-x", "tests/,venv/"]
```

```bash
# Activate the hooks
pre-commit install
pre-commit install --hook-type commit-msg
```

### 2.3 Branch Protection Rules (GitHub)

Set these on your GitHub repository under **Settings → Branches → Add Rule**:

```
Branch name pattern: main (and develop)

✅ Require a pull request before merging
✅ Require approvals (minimum: 1)
✅ Dismiss stale pull request approvals when new commits are pushed
✅ Require status checks to pass before merging
✅ Require branches to be up to date before merging
✅ Require conversation resolution before merging
✅ Do not allow bypassing the above settings
❌ Allow force pushes → DISABLED
❌ Allow deletions → DISABLED
```

### 2.4 Signed Commits (GPG)

```bash
# Generate GPG key
gpg --full-generate-key

# List keys
gpg --list-secret-keys --keyid-format=long

# Configure Git to use it
git config --global user.signingkey YOUR_KEY_ID
git config --global commit.gpgsign true

# Export public key to GitHub
gpg --armor --export YOUR_KEY_ID
# Add to GitHub: Settings → SSH and GPG keys → New GPG key
```

### 2.5 Secret Already Committed? (Emergency Response)

```bash
# Step 1 — IMMEDIATELY rotate the exposed credential (do this FIRST)

# Step 2 — Remove from entire Git history using BFG
brew install bfg
git clone --mirror https://github.com/your-org/antigravity.git
bfg --delete-files .env antigravity.git
bfg --replace-text secrets.txt antigravity.git   # secrets.txt contains the leaked values
cd antigravity.git
git reflog expire --expire=now --all && git gc --prune=now --aggressive
git push --force

# Step 3 — Force all collaborators to re-clone (their local copies still have history)

# Step 4 — Audit GitHub's Secret Scanning alerts in Security tab
```

---

## 3. ENVIRONMENT CONFIGURATION

### 3.1 Environment Hierarchy

```
.env.example        ← COMMIT THIS (template with fake values, no real secrets)
.env                ← NEVER COMMIT (actual local dev values)
.env.staging        ← NEVER COMMIT (staging values)
.env.production     ← NEVER COMMIT (prod values, use secret manager instead)
```

### 3.2 `.env.example` Template (Safe to Commit)
```bash
# ============================================
# ANTIGRAVITY PROJECT — Environment Template
# Copy to .env and fill in real values
# ============================================

# App
NODE_ENV=development
PORT=3000
APP_SECRET=CHANGE_ME_STRONG_RANDOM_STRING

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/antigravity_dev
REDIS_URL=redis://localhost:6379

# Authentication
JWT_SECRET=CHANGE_ME_MIN_32_CHARS
JWT_EXPIRES_IN=7d
REFRESH_TOKEN_SECRET=CHANGE_ME_DIFFERENT_FROM_JWT

# External APIs
ANTHROPIC_API_KEY=sk-ant-REPLACE_WITH_REAL_KEY
STRIPE_PUBLIC_KEY=pk_test_REPLACE_WITH_REAL_KEY
STRIPE_SECRET_KEY=sk_test_REPLACE_WITH_REAL_KEY
SENDGRID_API_KEY=SG.REPLACE_WITH_REAL_KEY

# Cloud Storage
AWS_ACCESS_KEY_ID=REPLACE_WITH_REAL_KEY
AWS_SECRET_ACCESS_KEY=REPLACE_WITH_REAL_KEY
AWS_REGION=ap-south-1
S3_BUCKET_NAME=antigravity-dev-assets

# Feature Flags
ENABLE_DEBUG_LOGS=true
ENABLE_RATE_LIMITING=false
```

### 3.3 Config Validation on Startup

```python
# Python — config/settings.py
from pydantic import BaseSettings, validator

class Settings(BaseSettings):
    APP_SECRET: str
    DATABASE_URL: str
    JWT_SECRET: str
    ANTHROPIC_API_KEY: str

    @validator("JWT_SECRET")
    def jwt_must_be_strong(cls, v):
        if len(v) < 32:
            raise ValueError("JWT_SECRET must be at least 32 characters")
        return v

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

settings = Settings()  # Fails fast on startup if env vars are missing
```

```javascript
// Node.js — config/validateEnv.js
const required = [
  'DATABASE_URL', 'JWT_SECRET', 'ANTHROPIC_API_KEY', 'APP_SECRET'
];

const missing = required.filter(key => !process.env[key]);
if (missing.length > 0) {
  console.error(`❌ Missing required environment variables: ${missing.join(', ')}`);
  process.exit(1);
}
```

---

## 4. DEPENDENCY SECURITY

### 4.1 Audit Dependencies Regularly

```bash
# Node.js
npm audit
npm audit fix
npx snyk test                    # Deeper scan

# Python
pip install safety
safety check
pip-audit

# Go
govulncheck ./...

# Run audits in CI — fail build if HIGH/CRITICAL vulnerabilities exist
npm audit --audit-level=high     # exits non-zero if high+ found
```

### 4.2 Lock Files — Always Commit These

```bash
# Always commit lock files
package-lock.json       ✅ commit
yarn.lock               ✅ commit
requirements.txt        ✅ commit (pinned versions)
Pipfile.lock            ✅ commit
go.sum                  ✅ commit
Cargo.lock              ✅ commit
```

### 4.3 Pin Dependency Versions

```json
// package.json — use exact versions in production
{
  "dependencies": {
    "express": "4.18.2",        // ✅ exact
    "axios": "^1.6.0"           // ⚠️ allows minor updates — acceptable
    // "lodash": "*"            // ❌ NEVER use wildcard
  }
}
```

```txt
# requirements.txt — pin everything
fastapi==0.109.0
pydantic==2.5.3
sqlalchemy==2.0.25
httpx==0.26.0
```

### 4.4 Dependabot Configuration

Create `.github/dependabot.yml`:
```yaml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
    open-pull-requests-limit: 10
    reviewers:
      - "your-github-username"
    labels:
      - "dependencies"
      - "security"

  - package-ecosystem: "pip"
    directory: "/"
    schedule:
      interval: "weekly"
```

---

## 5. CODE-LEVEL SECURITY PRACTICES

### 5.1 Input Validation & Sanitization

```python
# Always validate and sanitize user inputs
from pydantic import BaseModel, EmailStr, validator
import re

class UserInput(BaseModel):
    email: EmailStr
    username: str
    
    @validator("username")
    def username_alphanumeric(cls, v):
        if not re.match(r'^[a-zA-Z0-9_-]{3,30}$', v):
            raise ValueError("Username must be 3-30 alphanumeric characters")
        return v
```

### 5.2 SQL Injection Prevention

```python
# ❌ NEVER — Raw string concatenation
query = f"SELECT * FROM users WHERE email = '{email}'"  # ❌ VULNERABLE

# ✅ ALWAYS — Parameterized queries
query = "SELECT * FROM users WHERE email = %s"
cursor.execute(query, (email,))  # ✅ SAFE

# ✅ Use ORM (SQLAlchemy, Django ORM, Prisma)
user = db.query(User).filter(User.email == email).first()  # ✅ SAFE
```

### 5.3 XSS Prevention

```javascript
// ❌ NEVER
element.innerHTML = userInput;                // ❌ XSS vulnerability

// ✅ ALWAYS
element.textContent = userInput;              // ✅ SAFE — escapes HTML
// OR use DOMPurify for rich HTML
import DOMPurify from 'dompurify';
element.innerHTML = DOMPurify.sanitize(userInput);  // ✅ SAFE
```

### 5.4 Authentication & Password Handling

```python
# ❌ NEVER store plain passwords
user.password = request.password             # ❌ CRITICAL VIOLATION

# ✅ Always hash with bcrypt/argon2
from passlib.context import CryptContext
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

hashed = pwd_context.hash(plain_password)    # ✅ Store this
pwd_context.verify(plain_password, hashed)   # ✅ Compare this way
```

### 5.5 JWT Best Practices

```python
import jwt
from datetime import datetime, timedelta

SECRET_KEY = os.getenv("JWT_SECRET")         # Min 256-bit (32 chars)
ALGORITHM = "HS256"

def create_token(user_id: str) -> str:
    payload = {
        "sub": user_id,
        "iat": datetime.utcnow(),
        "exp": datetime.utcnow() + timedelta(hours=1),  # Short expiry
        "jti": str(uuid.uuid4()),                        # Unique ID per token
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

def verify_token(token: str) -> dict:
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(401, "Token expired")
    except jwt.JWTError:
        raise HTTPException(401, "Invalid token")
```

### 5.6 Rate Limiting

```python
# FastAPI with slowapi
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)

@app.post("/api/login")
@limiter.limit("5/minute")                   # Max 5 login attempts per minute
async def login(request: Request, data: LoginData):
    ...
```

```javascript
// Express with express-rate-limit
const rateLimit = require('express-rate-limit');

const loginLimiter = rateLimit({
  windowMs: 60 * 1000,    // 1 minute
  max: 5,                  // 5 requests per window
  message: { error: 'Too many login attempts. Try again in 1 minute.' }
});

app.post('/api/login', loginLimiter, loginHandler);
```

---

## 6. DEPLOYMENT SECURITY

### 6.1 GitHub Actions — Secure CI/CD

Create `.github/workflows/deploy.yml`:
```yaml
name: 🚀 Antigravity Secure Deploy

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  security-scan:
    name: 🔍 Security Audit
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0                      # Full history for secret scanning

      - name: 🔐 Run Gitleaks
        uses: gitleaks/gitleaks-action@v2
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}

      - name: 📦 Audit npm dependencies
        run: npm audit --audit-level=high

      - name: 🐍 Python security check
        run: |
          pip install safety
          safety check

  test:
    name: ✅ Test Suite
    needs: security-scan
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run tests
        env:
          DATABASE_URL: ${{ secrets.TEST_DATABASE_URL }}
          JWT_SECRET: ${{ secrets.JWT_SECRET }}
          # ✅ Secrets injected from GitHub Secrets — never hardcoded
        run: npm test

  deploy:
    name: 🚀 Deploy
    needs: [security-scan, test]
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    environment: production                  # Requires manual approval
    steps:
      - uses: actions/checkout@v4
      - name: Deploy to production
        env:
          DEPLOY_KEY: ${{ secrets.DEPLOY_KEY }}
        run: ./scripts/deploy.sh
```

### 6.2 Docker Security

```dockerfile
# Dockerfile — Secure base
FROM node:20-alpine AS base              # Use specific version, Alpine = smaller attack surface

# Create non-root user
RUN addgroup -S antigravity && adduser -S antigravity -G antigravity

WORKDIR /app

# Copy dependency manifests first (layer caching)
COPY package*.json ./
RUN npm ci --only=production             # --only=production skips dev deps
                                         # ci is stricter than install

# Copy source code
COPY --chown=antigravity:antigravity . .

# Remove sensitive files if accidentally included
RUN rm -f .env* *.pem *.key secrets/

USER antigravity                         # Run as non-root

EXPOSE 3000

# Use exec form (not shell form) to handle signals properly
CMD ["node", "server.js"]
```

```yaml
# docker-compose.yml — Don't expose ports unnecessarily
version: "3.9"
services:
  api:
    build: .
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}     # From host .env — NOT hardcoded
    ports:
      - "127.0.0.1:3000:3000"           # ✅ Bind to localhost only (not 0.0.0.0)
    read_only: true                      # Read-only filesystem
    security_opt:
      - no-new-privileges:true           # Prevent privilege escalation
    
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_PASSWORD: ${DB_PASSWORD}  # From env — NOT hardcoded
    # ❌ Don't expose 5432 to host unless debugging locally
    expose:
      - "5432"                           # Only accessible within Docker network
```

### 6.3 HTTPS & TLS

```nginx
# nginx.conf — Force HTTPS
server {
    listen 80;
    server_name antigravity.yourdomain.com;
    return 301 https://$host$request_uri;   # Redirect all HTTP → HTTPS
}

server {
    listen 443 ssl http2;
    server_name antigravity.yourdomain.com;

    ssl_certificate     /etc/letsencrypt/live/antigravity.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/antigravity.yourdomain.com/privkey.pem;

    # Strong TLS settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers off;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;

    # Security headers
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'" always;
    add_header Permissions-Policy "geolocation=(), microphone=(), camera=()" always;
}
```

---

## 7. API & NETWORK SECURITY

### 7.1 CORS Configuration

```python
# FastAPI
from fastapi.middleware.cors import CORSMiddleware

ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,          # ❌ Never use ["*"] in production
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["Authorization", "Content-Type"],
)
```

```javascript
// Express
const cors = require('cors');

const allowedOrigins = process.env.ALLOWED_ORIGINS.split(',');

app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));
```

### 7.2 Security Headers with Helmet

```javascript
// Express — add all security headers automatically
const helmet = require('helmet');
app.use(helmet());                          // ✅ Adds 12+ security headers

// Customize CSP
app.use(helmet.contentSecurityPolicy({
    directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", "https://api.antigravity.com"],
    }
}));
```

### 7.3 Webhook Security

```python
# Validate webhook signatures (e.g., Stripe, GitHub)
import hmac, hashlib

def verify_webhook_signature(payload: bytes, signature: str, secret: str) -> bool:
    expected = hmac.new(
        secret.encode(), payload, hashlib.sha256
    ).hexdigest()
    received = signature.replace("sha256=", "")
    return hmac.compare_digest(expected, received)  # Timing-safe comparison
```

---

## 8. ACCESS CONTROL & AUTHENTICATION

### 8.1 Principle of Least Privilege

```yaml
# IAM Policy — only grant what's needed
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject"
      ],
      "Resource": "arn:aws:s3:::antigravity-assets/*"
      # ❌ Never use "Resource": "*" unless absolutely required
    }
  ]
}
```

### 8.2 SSH Key Security

```bash
# Generate strong SSH keys
ssh-keygen -t ed25519 -C "deploy@antigravity" -f ~/.ssh/antigravity_deploy

# Set correct permissions
chmod 700 ~/.ssh
chmod 600 ~/.ssh/antigravity_deploy
chmod 644 ~/.ssh/antigravity_deploy.pub

# Use SSH config
# ~/.ssh/config
Host antigravity-prod
    HostName your-server-ip
    User deploy
    IdentityFile ~/.ssh/antigravity_deploy
    IdentitiesOnly yes
    
# ❌ Never use root for SSH access in production
# ❌ Never use password authentication — keys only
```

### 8.3 Database Access Control

```sql
-- Create dedicated app user with minimal permissions
CREATE USER antigravity_app WITH PASSWORD 'strong-random-password';
GRANT CONNECT ON DATABASE antigravity_db TO antigravity_app;
GRANT USAGE ON SCHEMA public TO antigravity_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO antigravity_app;
-- ❌ NEVER grant SUPERUSER, CREATEDB, or CREATEROLE to app user
```

---

## 9. LOGGING & MONITORING

### 9.1 What TO Log

```python
import logging
import json
from datetime import datetime

def log_security_event(event_type: str, user_id: str = None, ip: str = None, details: dict = None):
    """Structured security event logging"""
    log_entry = {
        "timestamp": datetime.utcnow().isoformat(),
        "event_type": event_type,
        "user_id": user_id,
        "ip_address": ip,
        "details": details or {}
    }
    logging.warning(json.dumps(log_entry))

# Log these events
log_security_event("LOGIN_FAILED", ip=request.client.host, details={"email": email})
log_security_event("LOGIN_SUCCESS", user_id=user.id, ip=request.client.host)
log_security_event("PASSWORD_CHANGED", user_id=user.id)
log_security_event("PERMISSION_DENIED", user_id=user.id, details={"resource": endpoint})
log_security_event("RATE_LIMIT_HIT", ip=request.client.host)
```

### 9.2 What NEVER to Log

```python
# ❌ NEVER log these
logging.info(f"User login: password={password}")          # ❌ CRITICAL
logging.info(f"API key used: {api_key}")                  # ❌ CRITICAL
logging.info(f"JWT token: {token}")                       # ❌ HIGH
logging.info(f"Card number: {card_number}")               # ❌ PCI VIOLATION
logging.debug(f"Full request body: {request.body()}")     # ❌ May contain secrets
```

### 9.3 Log Sanitization

```python
def sanitize_log(data: dict) -> dict:
    """Remove sensitive fields before logging"""
    SENSITIVE_FIELDS = {"password", "token", "api_key", "secret", "credit_card", "ssn"}
    return {
        k: "***REDACTED***" if k.lower() in SENSITIVE_FIELDS else v
        for k, v in data.items()
    }
```

---

## 10. PRE-PUSH & PRE-DEPLOY CHECKLIST

Run this checklist before every push to `main` or production deployment:

```markdown
## 🛡️ ANTIGRAVITY PRE-PUSH SECURITY CHECKLIST

### SECRETS & CREDENTIALS
- [ ] No API keys, passwords, or tokens hardcoded in source files
- [ ] .env file is in .gitignore
- [ ] .env.example is updated with new variable names (fake values only)
- [ ] All new secrets are added to GitHub Secrets / Secret Manager
- [ ] No sensitive files staged: git diff --cached | grep -i "password\|secret\|key\|token"

### CODE QUALITY
- [ ] No TODO/FIXME comments left in security-critical code
- [ ] Input validation added for all new API endpoints
- [ ] SQL queries use parameterized statements / ORM
- [ ] Error messages don't leak stack traces or system info to users
- [ ] New dependencies audited: npm audit / safety check

### GIT HYGIENE
- [ ] Commit message is descriptive (not "fix" or "wip")
- [ ] Branch is up to date with main: git pull origin main
- [ ] No merge conflicts
- [ ] Pre-commit hooks ran clean

### DEPLOYMENT
- [ ] Environment variables set correctly in deployment platform
- [ ] Database migrations tested on staging first
- [ ] Rollback plan documented
- [ ] Health check endpoint is working

### POST-DEPLOY
- [ ] Smoke test the critical user flows
- [ ] Check monitoring dashboard / logs for errors
- [ ] Verify HTTPS is working
```

### 10.1 Automated Scan Script

Save as `scripts/security-check.sh`:
```bash
#!/bin/bash
set -e

echo "🔍 Running Antigravity Security Checks..."

# Check for secrets in staged files
echo "→ Scanning for secrets in staged files..."
git diff --cached --name-only | xargs -I{} gitleaks detect --source {} --no-git 2>/dev/null && echo "✅ No secrets found" || { echo "❌ SECRETS DETECTED — aborting"; exit 1; }

# Check .env is not staged
if git diff --cached --name-only | grep -q "^\.env$"; then
    echo "❌ .env file is staged for commit! Remove it with: git reset HEAD .env"
    exit 1
fi

# Node.js audit
if [ -f package.json ]; then
    echo "→ Running npm audit..."
    npm audit --audit-level=high && echo "✅ npm audit passed"
fi

# Python audit
if [ -f requirements.txt ]; then
    echo "→ Running safety check..."
    safety check && echo "✅ Python dependencies safe"
fi

echo "✅ All security checks passed!"
```

```bash
chmod +x scripts/security-check.sh
```

---

## 11. INCIDENT RESPONSE PLAYBOOK

### If a Secret is Exposed

```
IMMEDIATE (within 15 minutes):
1. Rotate/revoke the compromised credential NOW
   - GitHub token → github.com/settings/tokens → Delete
   - API key → Provider dashboard → Revoke & generate new
   - DB password → ALTER USER ... PASSWORD 'newpassword'
   - AWS key → IAM console → Deactivate → Create new

2. Remove from git history (see Section 2.5)

3. Check access logs for unauthorized use during exposure window

4. Notify team leads / security officer

5. Document incident: what was exposed, when, how, resolution
```

### If a Dependency Vulnerability is Found

```
1. npm audit fix / pip install --upgrade PACKAGE
2. Test that upgrade doesn't break anything
3. Update lock files
4. Push with message: "security: patch CVE-XXXX-XXXX in dependency-name"
5. Deploy to staging → verify → deploy to production
```

---

## 12. REPOSITORY STRUCTURE TEMPLATE

```
antigravity-project/
├── .github/
│   ├── workflows/
│   │   ├── ci.yml                  # CI tests
│   │   ├── deploy.yml              # CD pipeline
│   │   └── security.yml            # Security scans
│   └── dependabot.yml              # Auto-update deps
├── config/
│   ├── settings.py                 # Config loading (NO secrets here)
│   └── validateEnv.js
├── scripts/
│   ├── security-check.sh           # Pre-deploy scan
│   └── deploy.sh
├── src/
│   └── ...                         # Application code
├── tests/
│   └── ...
├── .env.example                    ✅ COMMIT — template only
├── .gitignore                      ✅ COMMIT — critical
├── .pre-commit-config.yaml         ✅ COMMIT
├── .gitleaks.toml                  ✅ COMMIT — custom rules
├── SECURITY.md                     ✅ COMMIT — vulnerability disclosure policy
├── README.md                       ✅ COMMIT
├── package.json / requirements.txt ✅ COMMIT
├── package-lock.json / Pipfile.lock✅ COMMIT
│
├── .env                            ❌ NEVER COMMIT
├── .env.production                 ❌ NEVER COMMIT
└── secrets/                        ❌ NEVER COMMIT
```

### SECURITY.md Template

```markdown
# Security Policy

## Supported Versions
| Version | Supported |
|---------|-----------|
| 1.x     | ✅ Yes    |
| < 1.0   | ❌ No     |

## Reporting a Vulnerability
Please DO NOT open a public GitHub issue for security vulnerabilities.

Email: security@antigravity.com
Response time: Within 48 hours
Disclosure: Coordinated disclosure after patch is released

## Scope
- Authentication bypass
- Privilege escalation
- Data exposure
- Remote code execution
- SQL injection
- XSS vulnerabilities
```

---

## QUICK REFERENCE — TOP 10 RULES

| # | Rule | Severity |
|---|------|----------|
| 1 | Never hardcode secrets in source code | 🔴 CRITICAL |
| 2 | Always have .env in .gitignore before first commit | 🔴 CRITICAL |
| 3 | Use pre-commit hooks with gitleaks | 🔴 CRITICAL |
| 4 | Rotate any accidentally committed credential immediately | 🔴 CRITICAL |
| 5 | Never use `"*"` in CORS origins for production | 🟠 HIGH |
| 6 | Pin exact dependency versions in production | 🟠 HIGH |
| 7 | Run `npm audit` / `safety check` in CI | 🟠 HIGH |
| 8 | Use HTTPS everywhere, never HTTP in production | 🟠 HIGH |
| 9 | Never log passwords, tokens, or keys | 🟡 MEDIUM |
| 10 | Follow principle of least privilege for all IAM/DB access | 🟡 MEDIUM |

---

*Last updated: 2025 | Antigravity Project Security Team*
*Review this document every quarter and after every security incident.*
