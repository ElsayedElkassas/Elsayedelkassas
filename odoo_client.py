#!/usr/bin/env python3
"""Minimal XML-RPC client for connecting to an Odoo instance.

Credentials come from environment variables so nothing sensitive is
committed to the repo:

    ODOO_URL       Base URL of the Odoo instance, e.g. https://nordvera-ltd.odoo.com
    ODOO_DB        Database name, e.g. nordvera-ltd
    ODOO_USERNAME  Login/email used to authenticate
    ODOO_API_KEY   RPC-scoped API key (used in place of a password)

Usage:
    export ODOO_URL="https://nordvera-ltd.odoo.com"
    export ODOO_DB="nordvera-ltd"
    export ODOO_USERNAME="Elsayed@suitsfinance.com"
    export ODOO_API_KEY="..."
    python3 odoo_client.py
"""
import os
import sys
import xmlrpc.client


def get_client():
    url = os.environ["ODOO_URL"].rstrip("/")
    db = os.environ["ODOO_DB"]
    username = os.environ["ODOO_USERNAME"]
    api_key = os.environ["ODOO_API_KEY"]

    common = xmlrpc.client.ServerProxy(f"{url}/xmlrpc/2/common")
    uid = common.authenticate(db, username, api_key, {})
    if not uid:
        raise RuntimeError("Authentication failed: check ODOO_DB/ODOO_USERNAME/ODOO_API_KEY")

    models = xmlrpc.client.ServerProxy(f"{url}/xmlrpc/2/object")
    return url, db, uid, api_key, models


def execute_kw(model, method, args=None, kwargs=None):
    url, db, uid, api_key, models = get_client()
    return models.execute_kw(db, uid, api_key, model, method, args or [], kwargs or {})


def main():
    try:
        url, db, uid, api_key, models = get_client()
    except KeyError as missing:
        sys.exit(f"Missing required environment variable: {missing}")
    except Exception as exc:
        sys.exit(f"Connection failed: {exc}")

    print(f"Connected to {url} (db={db}) as uid={uid}")
    user = models.execute_kw(db, uid, api_key, "res.users", "read", [[uid]], {"fields": ["name", "login"]})
    print("Authenticated user:", user)


if __name__ == "__main__":
    main()
