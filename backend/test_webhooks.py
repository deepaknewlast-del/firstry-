"""End-to-end webhook tests for the Paddle fulfillment layer (step 04).

Runs the real route through FastAPI's TestClient with a fake in-memory Supabase,
so nothing touches live data. Run:  python test_webhooks.py
Exit code 0 = all passed.
"""
import hashlib
import hmac
import json
import time
import os
import sys

os.environ.setdefault("PADDLE_WEBHOOK_SECRET", "pdl_ntfset_test_secret")
os.environ.setdefault("PADDLE_PRICE_MONTHLY", "pri_test_monthly")
os.environ.setdefault("PADDLE_PRICE_ANNUAL", "pri_test_annual")
os.environ.setdefault("SUPABASE_URL", "https://test.supabase.co")
os.environ.setdefault("SUPABASE_SERVICE_ROLE_KEY", "test-service-role")

import importlib

import config
importlib.reload(config)
from config import get_settings  # noqa: E402

SECRET = get_settings().PADDLE_WEBHOOK_SECRET

import db  # noqa: E402
from routers import billing  # noqa: E402
import routers.billing as billing_mod  # noqa: E402
from services import paddle_service  # noqa: E402
from services import email_service  # noqa: E402

# ---------------------------------------------------------------------------
# Fake Supabase: profiles + subscriptions tables in memory.
# ---------------------------------------------------------------------------
PROFILES = {
    "11111111-1111-1111-1111-111111111111": {
        "id": "11111111-1111-1111-1111-111111111111",
        "email": "rector@stjames.example",
        "church_name": "St James",
        "paddle_customer_id": None,
        "subscription_status": "free",
    }
}


class FakeQuery:
    """Mimics supabase-py's chainable builder: every method returns self and
    only .execute() touches the data."""

    def __init__(self, table):
        self.table = table
        self.filters = []
        self._single = False
        self._maybe = False
        self._patch = None
        self._upsert = None

    def select(self, *_):
        return self

    def eq(self, col, val):
        self.filters.append((col, val))
        return self

    def single(self):
        self._single = True
        return self

    def maybe_single(self):
        self._maybe = True
        return self

    def update(self, patch):
        self._patch = patch
        return self

    def upsert(self, row, on_conflict=None):
        self._upsert = (row, on_conflict or "subscription_id")
        return self

    def _matches(self, row):
        return all(row.get(c) == v for c, v in self.filters)

    def execute(self):
        if self._upsert is not None:
            row, key = self._upsert
            match = [r for r in self.table.values() if r.get(key) == row.get(key)]
            if match:
                match[0].update(row)
            else:
                self.table[row[key]] = dict(row)
        if self._patch is not None:
            for r in self.table.values():
                if self._matches(r):
                    r.update(self._patch)
        rows = [dict(r) for r in self.table.values() if self._matches(r)]
        if self._single:
            class R:
                data = rows[0] if len(rows) == 1 else None
            return R()
        class R:
            data = (rows[0] if rows else None) if self._maybe else rows
        return R()


class FakeSupabase:
    def __init__(self):
        self._profiles = {k: dict(v) for k, v in PROFILES.items()}
        self._subs = {}

    def table(self, name):
        if name == "profiles":
            return FakeQuery(self._profiles)
        if name == "subscriptions":
            return FakeQuery(self._subs)
        raise AssertionError(f"unexpected table {name}")


# Emails: capture instead of sending.
SENT = []
async def fake_upgrade_email(email, church_name=""):
    SENT.append(email)


billing_mod.supabase_admin = FakeSupabase()
paddle_service.supabase_admin = billing_mod.supabase_admin  # module-level import target
email_service.send_upgrade_confirmation = fake_upgrade_email
billing_mod.send_upgrade_confirmation = fake_upgrade_email

# ---------------------------------------------------------------------------
# Event builders + signed delivery helper
# ---------------------------------------------------------------------------
USER_ID = next(iter(PROFILES))
CUSTOMER = "ctm_test01"
SUB = "sub_test01"
TS_BASE = 1_700_000_000


def signed(body: dict, ts: int | None = None, secret: str = SECRET, tamper: bool = False):
    """Return (raw_bytes, headers). With tamper=True the delivered bytes differ
    from what was signed (a trailing byte is appended after signing)."""
    raw = json.dumps(body).encode()
    ts = ts or int(time.time())
    digest = hmac.new(secret.encode(), f"{ts}:".encode() + raw, hashlib.sha256).hexdigest()
    if tamper:
        raw = raw + b" "
    sig = f"ts={ts};h1={digest}"
    return raw, {"Paddle-Signature": sig}


def sub_event(status="active", occurred=None, scheduled=None, custom=True):
    data = {
        "id": SUB, "status": status, "customer_id": CUSTOMER,
        "items": [{"price": {"id": "pri_test_monthly"}, "product": {"id": "pro_test"}}],
        "scheduled_change": scheduled,
    }
    if custom:
        data["custom_data"] = {"user_id": USER_ID}
    return {"event_type": "subscription.updated", "occurred_at": occurred, "data": data}


def deliver(client, body, headers):
    return client.post("/api/billing/webhooks/paddle", content=body, headers=headers)


# ---------------------------------------------------------------------------
# Test runner
# ---------------------------------------------------------------------------
from fastapi import FastAPI  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

app = FastAPI()
app.include_router(billing.router, prefix="/api/billing")
client = TestClient(app)

passed = failed = 0

def check(name, cond, extra=""):
    global passed, failed
    if cond:
        passed += 1
        print(f"  PASS  {name}")
    else:
        failed += 1
        print(f"  FAIL  {name} {extra}")


def profile():
    return billing_mod.supabase_admin._profiles[USER_ID]


print("— Signature verification —")
r = deliver(client, *signed(sub_event()))
check("valid signature accepted", r.status_code == 200 and r.json()["received"] is True)

body, hdrs = signed(sub_event(), tamper=True)
r = deliver(client, body, hdrs)
check("tampered body rejected (non-2xx)", r.status_code == 403)

body, hdrs = signed(sub_event())
r = deliver(client, body, {})
check("missing header rejected", r.status_code == 403)

body, hdrs = signed(sub_event(), secret="pdl_ntfset_wrong")
r = deliver(client, body, hdrs)
check("wrong secret rejected", r.status_code == 403)

body, hdrs = signed(sub_event(), ts=int(time.time()) - 3600)
r = deliver(client, body, hdrs)
check("stale timestamp rejected", r.status_code == 403)

print("— Routing —")
r = deliver(client, *signed({"event_type": "adjustment.created", "occurred_at": "2023-11-14T00:00:00Z", "data": {}}))
check("unknown event acknowledged + ignored", r.status_code == 200 and r.json().get("ignored") == "adjustment.created")

print("— Fulfillment: subscription.updated (active) —")
check("profile granted access", profile()["subscription_status"] == "active")
check("customer linked to user", profile()["paddle_customer_id"] == CUSTOMER)
sub_row = billing_mod.supabase_admin._subs.get(SUB)
check("subscription mirrored with price+product", bool(sub_row) and sub_row["price_id"] == "pri_test_monthly" and sub_row["product_id"] == "pro_test")
check("welcome email sent once", SENT == ["rector@stjames.example"])

print("— Idempotency —")
deliver(client, *signed(sub_event()))
check("duplicate delivery: email NOT re-sent", SENT == ["rector@stjames.example"])
check("duplicate delivery: still one mirror row", len(billing_mod.supabase_admin._subs) == 1)

print("— Out-of-order deliveries —")
deliver(client, *signed(sub_event(status="canceled", occurred="2023-11-20T00:00:00Z")))
check("newer canceled event revokes access", profile()["subscription_status"] == "canceled")
deliver(client, *signed(sub_event(status="active", occurred="2023-11-14T00:00:00Z")))
check("stale active event dropped, access stays revoked", profile()["subscription_status"] == "canceled")

print("— Scheduled changes don't revoke; only real status does —")
deliver(client, *signed(sub_event(status="active", occurred="2023-11-21T00:00:00Z",
                                  scheduled={"action": "pause", "effective_at": "2023-12-01T00:00:00Z"})))
check("scheduled pause: access retained", profile()["subscription_status"] == "active")
check("scheduled change mirrored", billing_mod.supabase_admin._subs[SUB]["scheduled_change_action"] == "pause")
deliver(client, *signed(sub_event(status="paused", occurred="2023-12-01T00:00:00Z")))
check("actual paused: access blocked, mapped to past_due", profile()["subscription_status"] == "past_due")
deliver(client, *signed(sub_event(status="trialing", occurred="2023-12-02T00:00:00Z")))
check("trialing grants access", profile()["subscription_status"] == "active")

print("— transaction.completed before subscription.created —")
billing_mod.supabase_admin._profiles[USER_ID]["subscription_status"] = "free"
txn = {"event_type": "transaction.completed", "occurred_at": "2023-12-03T00:00:00Z", "data": {
    "id": "txn_test01", "status": "completed", "customer_id": CUSTOMER, "subscription_id": SUB,
    "items": [{"price": {"id": "pri_test_annual"}, "product": {"id": "pro_test"}}],
    "custom_data": {"user_id": USER_ID},
}}
r = deliver(client, *signed(txn))
check("transaction grants access despite missing sub mirror", r.status_code == 200 and profile()["subscription_status"] == "active")

print("— transaction on canceled subscription must NOT re-grant —")
deliver(client, *signed(sub_event(status="canceled", occurred="2023-12-04T00:00:00Z")))
r = deliver(client, *signed(txn))
check("canceled sub blocks transaction re-grant", profile()["subscription_status"] == "canceled")

print("— customer.updated links email —")
cust = {"event_type": "customer.updated", "occurred_at": "2023-12-05T00:00:00Z", "data": {
    "id": CUSTOMER, "email": "rector@stjames.example", "custom_data": {"user_id": USER_ID},
}}
deliver(client, *signed(cust))
check("customer event keeps link intact", profile()["paddle_customer_id"] == CUSTOMER)

print("— Access helper unit rules —")
check("active grants", paddle_service.grants_paid_access({"status": "active"}))
check("trialing grants", paddle_service.grants_paid_access({"status": "trialing"}))
check("scheduled cancel does NOT revoke", paddle_service.grants_paid_access({"status": "active", "scheduled_change_action": "cancel"}))
check("canceled revokes", not paddle_service.grants_paid_access({"status": "canceled"}))
check("is_paid_price matches monthly", paddle_service.is_paid_price("pri_test_monthly"))
check("is_paid_price rejects unknown", not paddle_service.is_paid_price("pri_other"))

print(f"\n{'='*50}\n{passed} passed, {failed} failed")
sys.exit(1 if failed else 0)
