"""Unit tests for skills/tools/api.py (no network required)."""

import os
import sys
import tempfile
import unittest
from unittest.mock import MagicMock, patch

TOOLS_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, TOOLS_DIR)

import api


class TestSlugify(unittest.TestCase):
    def test_ascii(self):
        self.assertEqual(api._slugify("Hello World"), "hello-world")

    def test_special_chars(self):
        self.assertEqual(api._slugify("Tool & Co. v2!"), "tool-co-v2")

    def test_extra_spaces(self):
        self.assertEqual(api._slugify("  Multiple   Spaces "), "multiple-spaces")

    def test_empty_after_strip(self):
        result = api._slugify("###")
        self.assertTrue(result.startswith("item-"))

    def test_non_alpha_none_fallback(self):
        result = api._slugify("中文工具")
        self.assertTrue(result.startswith("item-"))

    def test_underscore_to_dash(self):
        self.assertEqual(api._slugify("my_awesome_tool"), "my-awesome-tool")

    def test_uppercase(self):
        self.assertEqual(api._slugify("ChatGPT"), "chatgpt")


class TestPadToWidth(unittest.TestCase):
    def test_ascii(self):
        self.assertEqual(api._pad_to_width("abc", 5), "abc  ")

    def test_chinese(self):
        self.assertEqual(api._pad_to_width("中文", 6), "中文  ")

    def test_no_pad_needed(self):
        self.assertEqual(api._pad_to_width("abc", 3), "abc")


class TestDisplayWidth(unittest.TestCase):
    def test_ascii(self):
        self.assertEqual(api._display_width("abc"), 3)

    def test_chinese(self):
        self.assertEqual(api._display_width("中文"), 4)

    def test_mixed(self):
        self.assertEqual(api._display_width("a中"), 3)


class TestPrintTable(unittest.TestCase):
    def test_empty(self):
        with patch("builtins.print") as m:
            api._print_table([], ["a"])
            m.assert_called_once_with("  (空)")

    def test_chinese_alignment(self):
        items = [{"id": 1, "name": "中文产品"}]
        with patch("builtins.print") as m:
            api._print_table(items, ["id", "name"])
            lines = [c.args[0] for c in m.call_args_list]
            self.assertEqual(api._display_width(lines[0]), api._display_width(lines[1]))


class TestSetTagsParsing(unittest.TestCase):
    def test_clean(self):
        with patch.object(api, "_write", return_value=(True, {})):
            ns = MagicMock()
            ns.product_id = 1
            ns.tag_ids = "1,2,3"
            ns.dry_run = False
            ns.yes = True
            ns.op_id = None
            api._GLOBAL_ARGS = ns
            api.cmd_set_tags(ns)

    def test_trailing_comma(self):
        with patch.object(api, "_write", return_value=(True, {})):
            ns = MagicMock()
            ns.product_id = 1
            ns.tag_ids = "1,2,3,"
            ns.dry_run = False
            ns.yes = True
            ns.op_id = None
            api._GLOBAL_ARGS = ns
            api.cmd_set_tags(ns)

    def test_spaces(self):
        with patch.object(api, "_write", return_value=(True, {})):
            ns = MagicMock()
            ns.product_id = 1
            ns.tag_ids = " 1 , 2 , 3 "
            ns.dry_run = False
            ns.yes = True
            ns.op_id = None
            api._GLOBAL_ARGS = ns
            api.cmd_set_tags(ns)

    def test_invalid(self):
        ns = MagicMock()
        ns.product_id = 1
        ns.tag_ids = "1,abc,3"
        ns.dry_run = False
        ns.yes = True
        ns.op_id = None
        api._GLOBAL_ARGS = ns
        with self.assertRaises(SystemExit):
            api.cmd_set_tags(ns)

    def test_empty(self):
        ns = MagicMock()
        ns.product_id = 1
        ns.tag_ids = ",,"
        ns.dry_run = False
        ns.yes = True
        ns.op_id = None
        api._GLOBAL_ARGS = ns
        with self.assertRaises(SystemExit):
            api.cmd_set_tags(ns)


class TestOpIds(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.NamedTemporaryFile(delete=False, suffix=".op_ids")  # noqa: SIM115
        self.tmp.close()

    def tearDown(self):
        if os.path.exists(self.tmp.name):
            os.remove(self.tmp.name)

    def test_load_empty(self):
        with patch.object(api, "OP_IDS_FILE", self.tmp.name):
            self.assertEqual(api._load_op_ids(), set())

    def test_save_and_load(self):
        with patch.object(api, "OP_IDS_FILE", self.tmp.name):
            api._save_op_id("abc123")
            api._save_op_id("def456")
            self.assertEqual(api._load_op_ids(), {"abc123", "def456"})

    def test_dedup_on_overflow(self):
        with patch.object(api, "OP_IDS_FILE", self.tmp.name):
            for i in range(api._OP_IDS_MAX + 10):
                api._save_op_id(f"id{i:04d}")
            ids = api._load_op_ids()
            self.assertEqual(len(ids), api._OP_IDS_MAX)
            self.assertNotIn("id0000", ids)
            self.assertIn(f"id{api._OP_IDS_MAX + 9:04d}", ids)


class TestRequestRetry(unittest.TestCase):
    def test_write_not_retried_on_500(self):
        import urllib.error

        err = urllib.error.HTTPError(
            "url",
            500,
            "Server Error",
            MagicMock(),
            MagicMock(read=MagicMock(return_value=b"err")),
        )
        with patch("urllib.request.urlopen", side_effect=err) as m:
            with self.assertRaises(SystemExit):
                api._request_with_headers("POST", "/products", {"a": 1})
            self.assertEqual(m.call_count, 1)

    def test_read_retried_on_500(self):
        import urllib.error

        err = urllib.error.HTTPError(
            "url",
            500,
            "Server Error",
            MagicMock(),
            MagicMock(read=MagicMock(return_value=b"err")),
        )
        success_resp = MagicMock()
        success_resp.__enter__ = MagicMock(return_value=success_resp)
        success_resp.__exit__ = MagicMock(return_value=False)
        success_resp.status = 200
        success_resp.headers = {}
        success_resp.read = MagicMock(return_value=b'{"ok": true}')
        with patch("urllib.request.urlopen", side_effect=[err, success_resp]):
            with patch("time.sleep"):
                result, _ = api._request_with_headers("GET", "/products")
            self.assertEqual(result, {"ok": True})


class TestCancelledError(unittest.TestCase):
    def test_cancel_raises_not_exit(self):
        ns = MagicMock()
        ns.dry_run = False
        ns.yes = False
        ns.op_id = "test"
        api._GLOBAL_ARGS = ns
        with (
            patch.object(api, "_confirm", return_value=False),
            self.assertRaises(api.CancelledError),
        ):
            api._write("POST", "/products", {"a": 1}, summary="test", confirm="?")


class TestFetchAll(unittest.TestCase):
    def test_single_page(self):
        def side_effect(*args, **kwargs):
            return [{"id": 1}], {}

        with patch.object(api, "_request_with_headers", side_effect=side_effect):
            result = api._fetch_all("/products", page_size=100)
            self.assertEqual(len(result), 1)

    def test_multi_page(self):
        pages = iter(
            [
                ([{"id": i} for i in range(100)], {}),
                ([{"id": 100}], {}),
            ]
        )

        def side_effect(*args, **kwargs):
            return next(pages)

        with patch.object(api, "_request_with_headers", side_effect=side_effect):
            result = api._fetch_all("/products", page_size=100)
            self.assertEqual(len(result), 101)

    def test_honors_max_pages(self):
        pages = iter(
            [
                ([{"id": i} for i in range(100)], {})
                for _ in range(api._MAX_FETCH_PAGES + 5)
            ]
        )

        def side_effect(*args, **kwargs):
            return next(pages)

        with patch.object(api, "_request_with_headers", side_effect=side_effect):
            result = api._fetch_all("/products", page_size=100)
            self.assertEqual(len(result), api._MAX_FETCH_PAGES * 100)
            self.assertEqual(api._request_with_headers.call_count, api._MAX_FETCH_PAGES)


class TestSearchFilter(unittest.TestCase):
    def test_server_side_search_passes_param(self):
        with patch.object(
            api,
            "_request_with_headers",
            return_value=([], {"x-supported-params": "search"}),
        ) as m:
            ns = MagicMock()
            ns.status = None
            ns.category_id = None
            ns.featured = False
            ns.search = "chat"
            ns.page = 1
            ns.page_size = 20
            ns.json = False
            api.cmd_products(ns)
            called_url = m.call_args[0][1]
            self.assertIn("search=chat", called_url)

    def test_client_side_search(self):
        products = [
            {"id": 1, "name": "ChatGPT", "slug": "chatgpt"},
            {"id": 2, "name": "Claude", "slug": "claude"},
            {"id": 3, "name": "Perplexity", "slug": "perplexity"},
        ]
        with (
            patch.object(api, "_request_with_headers", return_value=(products, {})),
            patch.object(api, "_print_table") as table_mock,
        ):
            ns = MagicMock()
            ns.status = None
            ns.category_id = None
            ns.featured = False
            ns.search = "chat"
            ns.page = 1
            ns.page_size = 20
            ns.json = False
            api.cmd_products(ns)
            displayed = table_mock.call_args[0][0]
            self.assertEqual(len(displayed), 1)
            names = [p["name"] for p in displayed]
            self.assertIn("ChatGPT", names)
            self.assertNotIn("Claude", names)


if __name__ == "__main__":
    unittest.main()
