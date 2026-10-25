# AGENTS.md

## What this is
Ember: a mobile-first AI wellbeing companion. It sends gentle check-in
notifications (no background drain on the phone); tapping one opens a chat.
Hackathon project. Prefer simple, readable code over clever code.

## Run it
pip install -r requirements.txt
export ANTHROPIC_API_KEY=...
uvicorn server:app --host 0.0.0.0 --port 8000
Push notifications need HTTPS, so use `ngrok http 8000` and open that URL on a phone.
There is no test suite. After changing server code, smoke-test with FastAPI's TestClient.

## Layout
- main.py     Core API: chat, crisis safety, mood tracking, adaptive timing
- server.py   Imports main.py; adds push notifications, the scheduler, quick replies, follow-ups
- static/     Frontend (plain HTML/JS, no build step): index.html, sw.js, manifest.json, icons
- preview.html / ember-preview.html  Standalone demos with fake data; not part of the app

## Rules that must not be broken
- Safety: never weaken or remove crisis handling. The assistant is a friend, not a therapist; it never diagnoses.
- Resources: the model picks IDs from the curated RESOURCES dict. Never let it invent URLs.
- Privacy: notification text is visible on lock screens. Never put sensitive details
  (like a follow-up topic) in a notification body; show them only inside the app.
- Energy: no polling or timers on the phone. The server sleeps until a check-in is due.
  Don't add background work, always-on connections, or frequent wakeups.
- Never commit secrets or data: API keys, vapid_private.pem, wellbeing.db, .env.

## Conventions
- Python: stdlib sqlite3, FastAPI, small functions. Don't add dependencies without a reason.
- Frontend: plain JS, no frameworks or build tools. Use textContent, never innerHTML,
  for any text that came from a user or the model.
- Keep replies from the assistant short and warm (1-4 sentences, one question at a time).

## Gotchas
- In server.py, the StaticFiles mount must stay LAST, or it swallows the API routes.
- The service worker (sw.js) must be served from the same origin as the page.
- iPhone: notifications only work after "Add to Home Screen" (iOS 16.4+), and iOS
  doesn't show notification action buttons.
- Service-worker changes may need a hard refresh or reinstall on the phone to take effect.
