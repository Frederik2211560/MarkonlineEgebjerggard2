import hashlib
import hmac
import json
import math
import os
import re
import secrets
import sqlite3
import threading
import time
import uuid
import webbrowser
from contextlib import contextmanager
from datetime import date, datetime
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse


ROOT = Path(__file__).resolve().parent
DB_PATH = Path(os.environ.get("FARM_APP_DB", ROOT / "data" / "markstyring.sqlite3"))
PORT = int(os.environ.get("PORT", "8000"))
HOST = os.environ.get("HOST", "127.0.0.1")
COOKIE_SECURE = os.environ.get("COOKIE_SECURE", "").lower() in {"1", "true", "yes"}
SESSION_TTL = 12 * 60 * 60
SESSIONS = {}
SESSIONS_LOCK = threading.Lock()
PBKDF2_ROUNDS = 310_000
DATE_FORMAT = "%Y-%m-%d"
FIELD_STATUSES = {"Aktiv", "Høstet", "Hvile"}
PLAN_STATUSES = {"Planlagt", "Udført"}
ROLES = {"director", "employee"}


@contextmanager
def connect_db():
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    connection = sqlite3.connect(DB_PATH, timeout=10)
    connection.row_factory = sqlite3.Row
    connection.execute("PRAGMA foreign_keys = ON")
    try:
        yield connection
        connection.commit()
    except Exception:
        connection.rollback()
        raise
    finally:
        connection.close()


def init_db():
    with connect_db() as db:
        db.executescript(
            """
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                username TEXT NOT NULL UNIQUE COLLATE NOCASE,
                display_name TEXT NOT NULL,
                role TEXT NOT NULL CHECK (role IN ('director', 'employee')),
                password_hash TEXT NOT NULL,
                salt TEXT NOT NULL,
                active INTEGER NOT NULL DEFAULT 1,
                created_at TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS fields (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                area REAL NOT NULL,
                crop TEXT NOT NULL,
                variety TEXT NOT NULL DEFAULT '',
                soil_type TEXT NOT NULL DEFAULT '',
                last_crop TEXT NOT NULL DEFAULT '',
                status TEXT NOT NULL DEFAULT 'Aktiv',
                nitrogen_target REAL NOT NULL DEFAULT 0,
                notes TEXT NOT NULL DEFAULT '',
                created_at TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS plans (
                id TEXT PRIMARY KEY,
                field_id TEXT NOT NULL REFERENCES fields(id) ON DELETE CASCADE,
                date TEXT NOT NULL,
                product TEXT NOT NULL,
                amount REAL NOT NULL,
                unit TEXT NOT NULL,
                method TEXT NOT NULL DEFAULT '',
                status TEXT NOT NULL DEFAULT 'Planlagt',
                notes TEXT NOT NULL DEFAULT '',
                created_by TEXT NOT NULL,
                created_at TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS observations (
                id TEXT PRIMARY KEY,
                field_id TEXT NOT NULL REFERENCES fields(id) ON DELETE CASCADE,
                date TEXT NOT NULL,
                stage TEXT NOT NULL,
                health TEXT NOT NULL,
                notes TEXT NOT NULL DEFAULT '',
                created_by TEXT NOT NULL,
                created_at TEXT NOT NULL
            );
            """
        )


def now_iso():
    return datetime.now().astimezone().isoformat(timespec="seconds")


def password_digest(password, salt):
    return hashlib.pbkdf2_hmac(
        "sha256", password.encode("utf-8"), bytes.fromhex(salt), PBKDF2_ROUNDS
    ).hex()


def valid_date(value):
    if not isinstance(value, str):
        return False
    try:
        return datetime.strptime(value, DATE_FORMAT).strftime(DATE_FORMAT) == value
    except ValueError:
        return False


def required_text(data, key, label, maximum=120, minimum=1):
    value = data.get(key)
    if not isinstance(value, str):
        raise ApiError(f"{label} skal udfyldes.")
    value = value.strip()
    if len(value) < minimum or len(value) > maximum:
        raise ApiError(f"{label} skal være mellem {minimum} og {maximum} tegn.")
    return value


def optional_text(data, key, label, maximum=1000):
    value = data.get(key, "")
    if not isinstance(value, str) or len(value.strip()) > maximum:
        raise ApiError(f"{label} må højst være {maximum} tegn.")
    return value.strip()


def numeric(data, key, label, minimum=0.0, maximum=1_000_000.0):
    value = data.get(key)
    if isinstance(value, bool):
        raise ApiError(f"{label} skal være et tal.")
    try:
        value = float(value)
    except (TypeError, ValueError):
        raise ApiError(f"{label} skal være et tal.") from None
    if not math.isfinite(value) or value < minimum or value > maximum:
        raise ApiError(f"{label} skal være mellem {minimum:g} og {maximum:g}.")
    return value


class ApiError(Exception):
    def __init__(self, message, status=HTTPStatus.BAD_REQUEST):
        super().__init__(message)
        self.status = status


class Handler(BaseHTTPRequestHandler):
    server_version = "EgebjerggaardMarkstyring/1.0"

    def log_message(self, _format, *args):
        print(f"[{self.log_date_time_string()}] {self.address_string()} {_format % args}")

    def send_json(self, data, status=HTTPStatus.OK, extra_headers=None):
        body = json.dumps(data, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("Referrer-Policy", "same-origin")
        self.send_header(
            "Content-Security-Policy",
            "default-src 'self'; img-src 'self' data:; style-src 'self'; "
            "script-src 'self' https://cdn.jsdelivr.net; "
            "connect-src 'self' https://*.supabase.co wss://*.supabase.co; "
            "form-action 'self'; base-uri 'none'; frame-ancestors 'none'",
        )
        for key, value in (extra_headers or {}).items():
            self.send_header(key, value)
        cookie = getattr(self, "_session_cookie", None)
        if cookie:
            self.send_header("Set-Cookie", cookie)
            del self._session_cookie
        self.end_headers()
        self.wfile.write(body)

    def read_json(self):
        try:
            length = int(self.headers.get("Content-Length", "0"))
        except ValueError:
            raise ApiError("Ugyldig forespørgsel.", HTTPStatus.BAD_REQUEST) from None
        if length < 1 or length > 1_000_000:
            raise ApiError("Forespørgslen er tom eller for stor.", HTTPStatus.BAD_REQUEST)
        try:
            data = json.loads(self.rfile.read(length))
        except (json.JSONDecodeError, UnicodeDecodeError):
            raise ApiError("Ugyldigt JSON-format.", HTTPStatus.BAD_REQUEST) from None
        if not isinstance(data, dict):
            raise ApiError("Forespørgslen skal være et JSON-objekt.")
        return data

    def cookie_token(self):
        cookie = self.headers.get("Cookie", "")
        for item in cookie.split(";"):
            key, separator, value = item.strip().partition("=")
            if separator and key == "session":
                return value
        return None

    def current_user(self, required=True):
        token = self.cookie_token()
        session = None
        if token:
            with SESSIONS_LOCK:
                session = SESSIONS.get(token)
                if session and session["expires"] <= time.time():
                    SESSIONS.pop(token, None)
                    session = None
        if session:
            with connect_db() as db:
                user = db.execute(
                    "SELECT id, username, display_name, role, active FROM users WHERE id = ?",
                    (session["user_id"],),
                ).fetchone()
            if user and user["active"]:
                return dict(user)
            with SESSIONS_LOCK:
                SESSIONS.pop(token, None)
        if required:
            raise ApiError("Du skal logge ind for at fortsætte.", HTTPStatus.UNAUTHORIZED)
        return None

    def require_director(self, user):
        if user["role"] != "director":
            raise ApiError("Kun direktøren har adgang til denne funktion.", HTTPStatus.FORBIDDEN)

    def do_GET(self):
        path = urlparse(self.path).path
        if path == "/healthz":
            try:
                with connect_db() as db:
                    db.execute("SELECT 1").fetchone()
                self.send_json({"status": "ok"})
            except sqlite3.Error:
                self.send_json(
                    {"status": "error", "error": "Database health check failed."},
                    HTTPStatus.INTERNAL_SERVER_ERROR,
                )
            return
        if path == "/":
            self.serve_file("index.html", "text/html; charset=utf-8")
            return
        if path in {"/app.js", "/styles.css", "/Logo.png", "/supabase-config.js"}:
            content_type = (
                "text/javascript; charset=utf-8"
                if path.endswith(".js")
                else "text/css; charset=utf-8"
                if path.endswith(".css")
                else "image/png"
                if path.endswith(".png")
                else "text/javascript; charset=utf-8"
            )
            self.serve_file(path.lstrip("/"), content_type)
            return
        try:
            if path == "/api/setup/status":
                with connect_db() as db:
                    count = db.execute("SELECT COUNT(*) FROM users").fetchone()[0]
                self.send_json({"setupRequired": count == 0})
                return
            if path == "/api/me":
                user = self.current_user()
                self.send_json({"user": user})
                return

            user = self.current_user()
            if path == "/api/fields":
                with connect_db() as db:
                    rows = db.execute("SELECT * FROM fields ORDER BY name COLLATE NOCASE").fetchall()
                self.send_json({"fields": [dict(row) for row in rows]})
            elif path == "/api/plans":
                with connect_db() as db:
                    rows = db.execute(
                        """SELECT plans.*, fields.name AS field_name,
                                  users.display_name AS created_by_name
                           FROM plans JOIN fields ON fields.id = plans.field_id
                           LEFT JOIN users ON users.id = plans.created_by
                           ORDER BY plans.date DESC, plans.created_at DESC"""
                    ).fetchall()
                self.send_json({"plans": [dict(row) for row in rows]})
            elif path == "/api/observations":
                with connect_db() as db:
                    rows = db.execute(
                        """SELECT observations.*, fields.name AS field_name,
                                  users.display_name AS created_by_name
                           FROM observations JOIN fields ON fields.id = observations.field_id
                           LEFT JOIN users ON users.id = observations.created_by
                           ORDER BY observations.date DESC, observations.created_at DESC"""
                    ).fetchall()
                self.send_json({"observations": [dict(row) for row in rows]})
            elif path == "/api/users":
                self.require_director(user)
                with connect_db() as db:
                    rows = db.execute(
                        """SELECT id, username, display_name, role, active, created_at
                           FROM users ORDER BY role, display_name COLLATE NOCASE"""
                    ).fetchall()
                self.send_json({"users": [dict(row) for row in rows]})
            else:
                self.send_json({"error": "Siden blev ikke fundet."}, HTTPStatus.NOT_FOUND)
        except ApiError as error:
            self.send_json({"error": str(error)}, error.status)
        except sqlite3.Error:
            self.send_json({"error": "Data kunne ikke læses. Prøv igen om lidt."}, HTTPStatus.INTERNAL_SERVER_ERROR)

    def do_POST(self):
        path = urlparse(self.path).path
        if not self.headers.get("X-Requested-With"):
            self.send_json({"error": "Ugyldig forespørgsel."}, HTTPStatus.FORBIDDEN)
            return
        try:
            data = self.read_json()
            if path == "/api/setup":
                self.setup_director(data)
            elif path == "/api/login":
                self.login(data)
            elif path == "/api/logout":
                self.logout()
            else:
                user = self.current_user()
                if path == "/api/change-password":
                    self.change_password(data, user)
                elif path == "/api/fields":
                    self.save_field(data, user)
                elif path == "/api/plans":
                    self.save_plan(data, user)
                elif path == "/api/observations":
                    self.save_observation(data, user)
                elif path == "/api/users":
                    self.create_user(data, user)
                else:
                    self.send_json({"error": "Siden blev ikke fundet."}, HTTPStatus.NOT_FOUND)
        except ApiError as error:
            self.send_json({"error": str(error)}, error.status)
        except sqlite3.IntegrityError:
            self.send_json({"error": "Brugernavnet findes allerede, eller marken er ikke længere tilgængelig."}, HTTPStatus.CONFLICT)
        except sqlite3.Error:
            self.send_json({"error": "Ændringen kunne ikke gemmes. Prøv igen om lidt."}, HTTPStatus.INTERNAL_SERVER_ERROR)

    def do_PATCH(self):
        if not self.headers.get("X-Requested-With"):
            self.send_json({"error": "Ugyldig forespørgsel."}, HTTPStatus.FORBIDDEN)
            return
        try:
            user = self.current_user()
            data = self.read_json()
            path = urlparse(self.path).path
            if path == "/api/fields":
                self.save_field(data, user, update=True)
            elif path == "/api/plans":
                self.save_plan(data, user, update=True)
            elif path == "/api/observations":
                self.save_observation(data, user, update=True)
            elif path == "/api/users":
                self.update_user(data, user)
            else:
                self.send_json({"error": "Siden blev ikke fundet."}, HTTPStatus.NOT_FOUND)
        except ApiError as error:
            self.send_json({"error": str(error)}, error.status)
        except sqlite3.IntegrityError:
            self.send_json({"error": "Brugernavnet findes allerede."}, HTTPStatus.CONFLICT)
        except sqlite3.Error:
            self.send_json({"error": "Ændringen kunne ikke gemmes. Prøv igen om lidt."}, HTTPStatus.INTERNAL_SERVER_ERROR)

    def do_DELETE(self):
        if not self.headers.get("X-Requested-With"):
            self.send_json({"error": "Ugyldig forespørgsel."}, HTTPStatus.FORBIDDEN)
            return
        try:
            user = self.current_user()
            self.require_director(user)
            path = urlparse(self.path).path
            resource = {
                "/api/fields": ("fields", "marken"),
                "/api/plans": ("plans", "gødningsplanen"),
                "/api/observations": ("observations", "registreringen"),
            }.get(path)
            if not resource:
                self.send_json({"error": "Siden blev ikke fundet."}, HTTPStatus.NOT_FOUND)
                return
            item_id = self.read_json().get("id")
            if not isinstance(item_id, str) or len(item_id) > 64:
                raise ApiError("Ugyldigt id.")
            with connect_db() as db:
                result = db.execute(f"DELETE FROM {resource[0]} WHERE id = ?", (item_id,))
                if result.rowcount == 0:
                    raise ApiError(f"{resource[1].capitalize()} blev ikke fundet.", HTTPStatus.NOT_FOUND)
            self.send_json({"ok": True})
        except ApiError as error:
            self.send_json({"error": str(error)}, error.status)
        except sqlite3.Error:
            self.send_json({"error": "Ændringen kunne ikke gemmes. Prøv igen om lidt."}, HTTPStatus.INTERNAL_SERVER_ERROR)

    def setup_director(self, data):
        username = required_text(data, "username", "Brugernavn", 40, 3)
        if not re.fullmatch(r"[A-Za-z0-9._-]+", username):
            raise ApiError("Brugernavnet må kun indeholde bogstaver, tal, punktum, bindestreg og underscore.")
        name = required_text(data, "display_name", "Navn", 80)
        password = required_text(data, "password", "Adgangskode", 128, 12)
        with connect_db() as db:
            if db.execute("SELECT 1 FROM users LIMIT 1").fetchone():
                raise ApiError("Førstegangsopsætningen er allerede gennemført.", HTTPStatus.CONFLICT)
            user_id = str(uuid.uuid4())
            salt = secrets.token_hex(16)
            db.execute(
                """INSERT INTO users (id, username, display_name, role, password_hash, salt, created_at)
                   VALUES (?, ?, ?, 'director', ?, ?, ?)""",
                (user_id, username, name, password_digest(password, salt), salt, now_iso()),
            )
        self.create_session(user_id)
        self.send_json({"user": self.lookup_user(user_id)}, HTTPStatus.CREATED)

    def login(self, data):
        username = required_text(data, "username", "Brugernavn", 80)
        password = required_text(data, "password", "Adgangskode", 128)
        with connect_db() as db:
            user = db.execute("SELECT * FROM users WHERE username = ? COLLATE NOCASE", (username,)).fetchone()
        if not user or not user["active"]:
            raise ApiError("Brugernavn eller adgangskode er forkert.", HTTPStatus.UNAUTHORIZED)
        candidate = password_digest(password, user["salt"])
        if not hmac.compare_digest(candidate, user["password_hash"]):
            raise ApiError("Brugernavn eller adgangskode er forkert.", HTTPStatus.UNAUTHORIZED)
        self.create_session(user["id"])
        self.send_json({"user": self.lookup_user(user["id"])})

    def create_session(self, user_id):
        token = secrets.token_urlsafe(32)
        with SESSIONS_LOCK:
            SESSIONS[token] = {"user_id": user_id, "expires": time.time() + SESSION_TTL}
        secure = "; Secure" if COOKIE_SECURE else ""
        self._session_cookie = f"session={token}; Path=/; HttpOnly; SameSite=Strict; Max-Age={SESSION_TTL}{secure}"

    def logout(self):
        token = self.cookie_token()
        if token:
            with SESSIONS_LOCK:
                SESSIONS.pop(token, None)
        secure = "; Secure" if COOKIE_SECURE else ""
        self.send_json(
            {"ok": True},
            extra_headers={"Set-Cookie": f"session=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0{secure}"},
        )

    def lookup_user(self, user_id):
        with connect_db() as db:
            user = db.execute(
                "SELECT id, username, display_name, role FROM users WHERE id = ?",
                (user_id,),
            ).fetchone()
        return dict(user)

    def change_password(self, data, user):
        current = required_text(data, "current_password", "Nuværende adgangskode", 128)
        new = required_text(data, "new_password", "Ny adgangskode", 128, 12)
        with connect_db() as db:
            record = db.execute("SELECT password_hash, salt FROM users WHERE id = ?", (user["id"],)).fetchone()
            if not hmac.compare_digest(password_digest(current, record["salt"]), record["password_hash"]):
                raise ApiError("Den nuværende adgangskode er forkert.", HTTPStatus.UNAUTHORIZED)
            salt = secrets.token_hex(16)
            db.execute(
                "UPDATE users SET password_hash = ?, salt = ? WHERE id = ?",
                (password_digest(new, salt), salt, user["id"]),
            )
        self.send_json({"ok": True})

    def save_field(self, data, _user, update=False):
        item_id = data.get("id")
        if update and (not isinstance(item_id, str) or len(item_id) > 64):
            raise ApiError("Marken blev ikke fundet.", HTTPStatus.NOT_FOUND)
        values = (
            required_text(data, "name", "Marknavn", 100),
            numeric(data, "area", "Areal", 0.01, 100_000),
            required_text(data, "crop", "Afgrøde", 80),
            optional_text(data, "variety", "Sort", 80),
            optional_text(data, "soil_type", "Jordtype", 80),
            optional_text(data, "last_crop", "Forfrugt", 80),
            data.get("status", "Aktiv"),
            numeric(data, "nitrogen_target", "N-mål", 0, 1000),
            optional_text(data, "notes", "Noter"),
        )
        if values[6] not in FIELD_STATUSES:
            raise ApiError("Vælg en gyldig markstatus.")
        with connect_db() as db:
            if update:
                cursor = db.execute(
                    """UPDATE fields SET name=?, area=?, crop=?, variety=?, soil_type=?,
                           last_crop=?, status=?, nitrogen_target=?, notes=? WHERE id=?""",
                    (*values, item_id),
                )
                if not cursor.rowcount:
                    raise ApiError("Marken blev ikke fundet.", HTTPStatus.NOT_FOUND)
            else:
                item_id = str(uuid.uuid4())
                db.execute(
                    """INSERT INTO fields
                       (id, name, area, crop, variety, soil_type, last_crop, status, nitrogen_target, notes, created_at)
                       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                    (item_id, *values, now_iso()),
                )
        self.send_json({"id": item_id}, HTTPStatus.OK if update else HTTPStatus.CREATED)

    def save_plan(self, data, user, update=False):
        item_id = data.get("id")
        if update and (not isinstance(item_id, str) or len(item_id) > 64):
            raise ApiError("Gødningsplanen blev ikke fundet.", HTTPStatus.NOT_FOUND)
        field_id = required_text(data, "field_id", "Mark", 64)
        plan_date = data.get("date")
        if not valid_date(plan_date):
            raise ApiError("Vælg en gyldig dato.")
        product = required_text(data, "product", "Gødningsprodukt", 100)
        amount = numeric(data, "amount", "Mængde", 0.01, 100_000)
        unit = data.get("unit", "kg/ha")
        if unit not in {"kg/ha", "l/ha", "ton/ha"}:
            raise ApiError("Vælg en gyldig enhed.")
        method = optional_text(data, "method", "Udbringningsmetode", 100)
        status = data.get("status", "Planlagt")
        if status not in PLAN_STATUSES:
            raise ApiError("Vælg en gyldig status.")
        notes = optional_text(data, "notes", "Noter")
        with connect_db() as db:
            if not db.execute("SELECT 1 FROM fields WHERE id = ?", (field_id,)).fetchone():
                raise ApiError("Den valgte mark findes ikke.", HTTPStatus.NOT_FOUND)
            if update:
                cursor = db.execute(
                    """UPDATE plans SET field_id=?, date=?, product=?, amount=?, unit=?,
                           method=?, status=?, notes=? WHERE id=?""",
                    (field_id, plan_date, product, amount, unit, method, status, notes, item_id),
                )
                if not cursor.rowcount:
                    raise ApiError("Gødningsplanen blev ikke fundet.", HTTPStatus.NOT_FOUND)
            else:
                item_id = str(uuid.uuid4())
                db.execute(
                    """INSERT INTO plans
                       (id, field_id, date, product, amount, unit, method, status, notes, created_by, created_at)
                       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                    (item_id, field_id, plan_date, product, amount, unit, method, status, notes, user["id"], now_iso()),
                )
        self.send_json({"id": item_id}, HTTPStatus.OK if update else HTTPStatus.CREATED)

    def save_observation(self, data, user, update=False):
        item_id = data.get("id")
        if update and (not isinstance(item_id, str) or len(item_id) > 64):
            raise ApiError("Registreringen blev ikke fundet.", HTTPStatus.NOT_FOUND)
        field_id = required_text(data, "field_id", "Mark", 64)
        observation_date = data.get("date")
        if not valid_date(observation_date):
            raise ApiError("Vælg en gyldig dato.")
        stage = required_text(data, "stage", "Vækststadie", 80)
        health = data.get("health")
        if health not in {"God", "Middel", "Kræver opmærksomhed"}:
            raise ApiError("Vælg en gyldig vurdering.")
        notes = optional_text(data, "notes", "Observation", 2000)
        with connect_db() as db:
            if not db.execute("SELECT 1 FROM fields WHERE id = ?", (field_id,)).fetchone():
                raise ApiError("Den valgte mark findes ikke.", HTTPStatus.NOT_FOUND)
            if update:
                cursor = db.execute(
                    """UPDATE observations SET field_id=?, date=?, stage=?, health=?, notes=? WHERE id=?""",
                    (field_id, observation_date, stage, health, notes, item_id),
                )
                if not cursor.rowcount:
                    raise ApiError("Registreringen blev ikke fundet.", HTTPStatus.NOT_FOUND)
            else:
                item_id = str(uuid.uuid4())
                db.execute(
                    """INSERT INTO observations
                       (id, field_id, date, stage, health, notes, created_by, created_at)
                       VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
                    (item_id, field_id, observation_date, stage, health, notes, user["id"], now_iso()),
                )
        self.send_json({"id": item_id}, HTTPStatus.OK if update else HTTPStatus.CREATED)

    def create_user(self, data, user):
        self.require_director(user)
        username = required_text(data, "username", "Brugernavn", 40, 3)
        if not re.fullmatch(r"[A-Za-z0-9._-]+", username):
            raise ApiError("Brugernavnet må kun indeholde bogstaver, tal, punktum, bindestreg og underscore.")
        name = required_text(data, "display_name", "Navn", 80)
        password = required_text(data, "password", "Startadgangskode", 128, 12)
        user_id = str(uuid.uuid4())
        salt = secrets.token_hex(16)
        with connect_db() as db:
            db.execute(
                """INSERT INTO users (id, username, display_name, role, password_hash, salt, created_at)
                   VALUES (?, ?, ?, 'employee', ?, ?, ?)""",
                (user_id, username, name, password_digest(password, salt), salt, now_iso()),
            )
        self.send_json({"id": user_id}, HTTPStatus.CREATED)

    def update_user(self, data, user):
        self.require_director(user)
        target_id = data.get("id")
        if not isinstance(target_id, str) or len(target_id) > 64:
            raise ApiError("Medarbejderen blev ikke fundet.", HTTPStatus.NOT_FOUND)
        active = data.get("active")
        if not isinstance(active, bool):
            raise ApiError("Vælg, om medarbejderen skal være aktiv.")
        if target_id == user["id"] and not active:
            raise ApiError("Du kan ikke deaktivere din egen konto.")
        with connect_db() as db:
            cursor = db.execute("UPDATE users SET active = ? WHERE id = ?", (int(active), target_id))
            if not cursor.rowcount:
                raise ApiError("Medarbejderen blev ikke fundet.", HTTPStatus.NOT_FOUND)
        self.send_json({"ok": True})

    def serve_file(self, filename, content_type):
        path = ROOT / filename
        try:
            body = path.read_bytes()
        except OSError:
            self.send_error(HTTPStatus.NOT_FOUND)
            return
        self.send_response(HTTPStatus.OK)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(body)))
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("Referrer-Policy", "same-origin")
        self.send_header(
            "Content-Security-Policy",
            "default-src 'self'; img-src 'self' data:; style-src 'self'; "
            "script-src 'self' https://cdn.jsdelivr.net; "
            "connect-src 'self' https://*.supabase.co wss://*.supabase.co; "
            "form-action 'self'; base-uri 'none'; frame-ancestors 'none'",
        )
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        self.send_response(HTTPStatus.NO_CONTENT)
        self.send_header("Allow", "GET, POST, PATCH, DELETE, OPTIONS")
        self.send_header("Content-Length", "0")
        self.end_headers()


def run():
    init_db()
    server = ThreadingHTTPServer((HOST, PORT), Handler)
    url = f"http://{HOST}:{PORT}"
    print(f"Egebjerggaard Markstyring kører på {url}")
    print(f"Database: {DB_PATH}")
    if os.environ.get("OPEN_BROWSER", "").lower() in {"1", "true", "yes"}:
        threading.Timer(0.8, webbrowser.open, args=(url,)).start()
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nServeren stoppes.")
    finally:
        server.server_close()


if __name__ == "__main__":
    run()
