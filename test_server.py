import http.cookiejar
import json
import tempfile
import threading
import unittest
from datetime import date
from http.server import ThreadingHTTPServer
from pathlib import Path
from urllib.error import HTTPError
from urllib.request import HTTPCookieProcessor, Request, build_opener

import server


class MarkstyringApiTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.temp_dir = tempfile.TemporaryDirectory()
        server.DB_PATH = Path(cls.temp_dir.name) / "test.sqlite3"
        server.SESSIONS.clear()
        server.init_db()
        cls.httpd = ThreadingHTTPServer(("127.0.0.1", 0), server.Handler)
        cls.thread = threading.Thread(target=cls.httpd.serve_forever, daemon=True)
        cls.thread.start()
        cls.base = f"http://127.0.0.1:{cls.httpd.server_port}"

    @classmethod
    def tearDownClass(cls):
        cls.httpd.shutdown()
        cls.httpd.server_close()
        cls.thread.join(timeout=3)
        server.SESSIONS.clear()
        cls.temp_dir.cleanup()

    def setUp(self):
        with server.connect_db() as db:
            db.executescript(
                "DELETE FROM observations; DELETE FROM plans; DELETE FROM fields; DELETE FROM users;"
            )
        server.SESSIONS.clear()
        self.cookies = http.cookiejar.CookieJar()
        self.client = build_opener(HTTPCookieProcessor(self.cookies))
        self.request(
            "/api/setup",
            "POST",
            {"username": "direktor", "display_name": "Gårdens direktør", "password": "EnStærkKode2026!"},
            201,
        )
        _, field = self.request(
            "/api/fields",
            "POST",
            {"name": "Testmark", "area": 12.5, "crop": "Vinterhvede", "status": "Aktiv", "nitrogen_target": 160},
            201,
        )
        self.field_id = field["id"]

    def request(self, path, method="GET", body=None, expected=200):
        data = json.dumps(body).encode() if body is not None else None
        headers = {"X-Requested-With": "test"} if data is not None else {}
        request = Request(self.base + path, data=data, headers=headers, method=method)
        try:
            response = self.client.open(request)
        except HTTPError as error:
            raw = error.read().decode()
            error.close()
            self.assertEqual(error.code, expected, raw)
            return error.code, json.loads(raw)
        self.assertEqual(response.status, expected)
        raw = response.read()
        return response.status, json.loads(raw) if raw else {}

    def test_setup_login_and_authenticated_field_creation(self):
        _, status = self.request("/api/setup/status")
        self.assertFalse(status["setupRequired"])
        self.request(
            "/api/setup",
            "POST",
            {"username": "anden", "display_name": "Anden direktør", "password": "EnStærkKode2026!"},
            409,
        )
        self.request("/api/logout", "POST", {})
        self.request("/api/login", "POST", {"username": "direktor", "password": "EnStærkKode2026!"})
        self.assertEqual(self.request("/api/me")[1]["user"]["role"], "director")
        _, created = self.request(
            "/api/fields",
            "POST",
            {"name": "Nordmarken", "area": 8.5, "crop": "Vårbyg", "status": "Aktiv", "nitrogen_target": 130},
            201,
        )
        _, result = self.request("/api/fields")
        saved = next(field for field in result["fields"] if field["id"] == created["id"])
        self.assertEqual(saved["area"], 8.5)

    def test_setup_cannot_be_repeated_and_password_policy_is_enforced(self):
        self.request(
            "/api/setup",
            "POST",
            {"username": "direktor", "display_name": "Direktør", "password": "kort"},
            400,
        )
        self.request(
            "/api/setup",
            "POST",
            {"username": "anden", "display_name": "Anden direktør", "password": "EnStærkKode2026!"},
            409,
        )

    def test_employee_cannot_manage_users_or_delete_fields(self):
        self.request(
            "/api/users",
            "POST",
            {"username": "medarbejder", "display_name": "Markarbejder", "password": "EnAndenKode2026!"},
            201,
        )
        employee = build_opener(HTTPCookieProcessor(http.cookiejar.CookieJar()))
        data = json.dumps({"username": "medarbejder", "password": "EnAndenKode2026!"}).encode()
        response = employee.open(Request(self.base + "/api/login", data=data, headers={"X-Requested-With": "test"}))
        self.assertEqual(response.status, 200)
        with self.assertRaises(HTTPError) as error:
            employee.open(Request(self.base + "/api/users"))
        self.assertEqual(error.exception.code, 403)
        error.exception.close()
        fields = self.request("/api/fields")[1]["fields"]
        with self.assertRaises(HTTPError) as error:
            employee.open(Request(
                self.base + "/api/fields",
                data=json.dumps({"id": fields[0]["id"]}).encode(),
                headers={"X-Requested-With": "test"},
                method="DELETE",
            ))
        self.assertEqual(error.exception.code, 403)
        error.exception.close()

    def test_unauthenticated_access_is_rejected(self):
        unauthenticated = build_opener(HTTPCookieProcessor(http.cookiejar.CookieJar()))
        with self.assertRaises(HTTPError) as error:
            unauthenticated.open(self.base + "/api/fields")
        self.assertEqual(error.exception.code, 401)
        error.exception.close()

    def test_invalid_field_and_plan_dates_are_rejected(self):
        self.request("/api/fields", "POST", {"name": "Mangler afgrøde", "area": 1, "status": "Aktiv"}, 400)
        field_id = self.request("/api/fields")[1]["fields"][0]["id"]
        self.request(
            "/api/plans",
            "POST",
            {"field_id": field_id, "date": "næste uge", "product": "NPK", "amount": 20, "unit": "kg/ha"},
            400,
        )

    def test_plan_and_growth_records_can_be_created_updated_and_reloaded(self):
        today = date.today().isoformat()
        _, plan = self.request(
            "/api/plans",
            "POST",
            {
                "field_id": self.field_id,
                "date": today,
                "product": "NPK 21-3-10",
                "amount": 240,
                "unit": "kg/ha",
                "method": "Gødningsspreder",
            },
            201,
        )
        self.request(
            "/api/plans",
            "PATCH",
            {
                "id": plan["id"],
                "field_id": self.field_id,
                "date": today,
                "product": "NPK 21-3-10",
                "amount": 240,
                "unit": "kg/ha",
                "method": "Gødningsspreder",
                "status": "Udført",
            },
        )
        _, plans = self.request("/api/plans")
        self.assertEqual(plans["plans"][0]["status"], "Udført")
        self.assertEqual(plans["plans"][0]["field_name"], "Testmark")

        _, observation = self.request(
            "/api/observations",
            "POST",
            {
                "field_id": self.field_id,
                "date": today,
                "stage": "BBCH 31",
                "health": "God",
                "notes": "Ensartet vækst.",
            },
            201,
        )
        self.request(
            "/api/observations",
            "PATCH",
            {
                "id": observation["id"],
                "field_id": self.field_id,
                "date": today,
                "stage": "BBCH 32",
                "health": "Middel",
                "notes": "Følg op efter regn.",
            },
        )
        _, observations = self.request("/api/observations")
        self.assertEqual(observations["observations"][0]["stage"], "BBCH 32")
        self.assertEqual(observations["observations"][0]["health"], "Middel")

    def test_static_page_and_brand_logo_are_served(self):
        page = self.client.open(self.base + "/")
        self.assertEqual(page.status, 200)
        self.assertIn("text/html", page.headers.get("Content-Type", ""))
        self.assertIn("Markstyring", page.read().decode("utf-8"))
        page.close()
        logo = self.client.open(self.base + "/Logo.png")
        self.assertEqual(logo.status, 200)
        self.assertEqual(logo.headers.get("Content-Type"), "image/png")
        self.assertTrue(logo.read().startswith(b"\x89PNG"))
        logo.close()

    def test_health_check_reports_database_status(self):
        _, health = self.request("/healthz")
        self.assertEqual(health["status"], "ok")

    def test_github_pages_build_uses_public_supabase_key_and_only_static_files(self):
        root = Path(__file__).resolve().parent
        workflow = (root / ".github" / "workflows" / "deploy-pages.yml").read_text(encoding="utf-8")
        schema = (root / "supabase" / "schema.sql").read_text(encoding="utf-8")
        index = (root / "index.html").read_text(encoding="utf-8")
        config = (root / "supabase-config.js").read_text(encoding="utf-8")

        self.assertIn("SUPABASE_URL", workflow)
        self.assertIn("SUPABASE_ANON_KEY", workflow)
        self.assertIn("actions/deploy-pages@v4", workflow)
        self.assertIn('"index.html", "app.js", "styles.css", "Logo.png"', workflow)
        self.assertNotIn("service_role", workflow)
        self.assertNotIn("service_role", config)
        self.assertIn("enable row level security", schema.lower())
        self.assertIn("claim_initial_director", schema)
        self.assertIn("Directors can delete plans", schema)
        self.assertIn("@2.118.0", index)


if __name__ == "__main__":
    unittest.main()
