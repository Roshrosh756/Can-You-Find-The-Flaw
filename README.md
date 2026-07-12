# Can You Find the Flaw? — Web Security CTF (Sub-challenge)

Three-part web challenge covering real-world vulnerability classes:

- **Part 1** — Rate limit bypass (`X-Forwarded-For` spoofing + hidden internal endpoint)
- **Part 2** — Cache poisoning via `X-Original-URL`
- **Part 3** — Blind/Union-based SQL injection (PostgreSQL)

Each part is solved independently: exploit the endpoint to reveal the flag, then submit it via the flag box on that part's card. Flags persist in the header "captured flags" widget for the rest of the session.

---

## Requirements

This app requires **PostgreSQL**. There is no SQLite fallback — `DATABASE_URL` must be set.

```bash
export DATABASE_URL="postgresql://user:password@host:5432/dbname"
```

## Setup

```bash
python3 -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
export DATABASE_URL="postgresql://user:password@localhost:5432/ctf"
python app.py
```

Visit `http://localhost:5000`.

## Hints for players

- **Part 1**: The rate limiter trusts the last IP in `X-Forwarded-For`. There's also a hidden internal endpoint that leaks the answer to the security question.
- **Part 2**: The `/api/stage2/profile` endpoint caches responses under the *original* request path, not the rewritten one — poison it with `X-Original-URL`, then request normally.
- **Part 3**: The `id` parameter on `/api/stage3/product` is injectable. This is PostgreSQL — enumerate tables via `information_schema.tables`, then UNION SELECT the flag out of `flag_table`.

## Project structure

```
.
├── app.py
├── config.py
├── database.py          # PostgreSQL only
├── requirements.txt
├── routes/
│   ├── stage1.py         # Part 1 — rate limit bypass
│   ├── stage2.py         # Part 2 — cache poisoning
│   ├── stage3.py         # Part 3 — Union SQLi
│   ├── hints.py
│   └── submit.py         # unified /api/submit/<part> flag validation
├── static/
│   ├── css/
│   └── js/main.js
└── templates/
    ├── header.html
    ├── index.html
    └── footer.html
```

## Security note

This app contains deliberate vulnerabilities. Do not deploy it on a public server without proper isolation (e.g. inside a CTF framework with network restrictions).

## License

MIT — for educational use only.
