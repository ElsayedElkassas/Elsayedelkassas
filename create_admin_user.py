#!/usr/bin/env python3
"""Create (or convert) an Odoo user as an internal Administrator and send
the login / password reset email.

Uses the same ODOO_* environment variables as odoo_client.py.

Usage:
    python3 create_admin_user.py "Sem" "Nieuwenhuis.sj@gmail.com"
"""
import sys
import xmlrpc.client

from odoo_client import get_client


def main(name, login):
    url, db, uid, api_key, models = get_client()

    def call(model, method, args, kwargs=None):
        return models.execute_kw(db, uid, api_key, model, method, args, kwargs or {})

    def xmlid(ref):
        module, name_ = ref.split(".")
        rec = call("ir.model.data", "search_read",
                   [[["module", "=", module], ["name", "=", name_]]], {"fields": ["res_id"]})
        return rec[0]["res_id"]

    # Odoo 18 and earlier call it groups_id, Odoo 19+ group_ids.
    fields = call("res.users", "fields_get", [], {"attributes": ["type"]})
    groups_field = "group_ids" if "group_ids" in fields else "groups_id"

    internal = xmlid("base.group_user")
    portal = xmlid("base.group_portal")
    public = xmlid("base.group_public")
    admin_settings = xmlid("base.group_system")
    admin_access = xmlid("base.group_erp_manager")

    # Remove portal/public, add internal + Settings administrator.
    group_cmds = [(3, portal), (3, public),
                  (4, internal), (4, admin_access), (4, admin_settings)]

    ctx = {"context": {"active_test": False, "no_reset_password": True}}
    existing = call("res.users", "search", [[["login", "=ilike", login]]], ctx)

    if existing:
        user_id = existing[0]
        call("res.users", "write",
             [[user_id], {"name": name, "email": login, "active": True, groups_field: group_cmds}], ctx)
        print(f"Updated existing user id={user_id}")
    else:
        user_id = call("res.users", "create",
                       [{"name": name, "login": login, "email": login, groups_field: group_cmds}], ctx)
        print(f"Created user id={user_id}")

    user = call("res.users", "read", [[user_id]], {"fields": ["name", "login", "share", groups_field]})[0]
    print(f"{user['name']} <{user['login']}> internal={not user['share']} groups={user[groups_field]}")

    try:
        call("res.users", "action_reset_password", [[user_id]])
    except xmlrpc.client.Fault as fault:
        # The method returns None, which some servers can't marshal; the email is still sent.
        if "marshal None" not in str(fault):
            raise
    print(f"Login / password reset email sent to {login}")


if __name__ == "__main__":
    if len(sys.argv) != 3:
        sys.exit(__doc__)
    main(sys.argv[1], sys.argv[2])
