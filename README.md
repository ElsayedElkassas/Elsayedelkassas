# Odoo Connection

`odoo_client.py` connects to the `facelove-cosmetics-llc` Odoo instance
(https://facelove-cosmetics-llc.odoo.com) over XML-RPC using an
RPC-scoped API key.

## Setup

Copy `.env.example` to `.env`, fill in your API key, then export the
values (or use a tool like `direnv`/`python-dotenv`):

```bash
cp .env.example .env
export $(grep -v '^#' .env | xargs)
python3 odoo_client.py
```

This prints the connected user's info once authentication succeeds.

## Why this couldn't be tested from this session

This repo was set up from a Claude Code remote execution environment whose
outbound network policy does not allow connections to `*.odoo.com`. Run the
script from an environment/session that allows that host (or locally) to
verify connectivity.
