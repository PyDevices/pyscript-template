import json
from pathlib import Path
import unittest


ROOT = Path(__file__).resolve().parents[1]


class TemplateTests(unittest.TestCase):
    def test_manifest_and_config_are_valid_json(self):
        manifest = json.loads((ROOT / "manifest.json").read_text(encoding="utf-8"))
        config = json.loads((ROOT / "pyscript.json").read_text(encoding="utf-8"))
        self.assertEqual(manifest["start_url"], "./index.html")
        self.assertIn("files", config)

    def test_shell_references_existing_local_files(self):
        source = (ROOT / "sw.js").read_text(encoding="utf-8")
        for name in (
            "index.html",
            "main.py",
            "pyscript.json",
            "manifest.json",
            "style.css",
            "pwa.js",
            "icon-192.png",
            "icon-512.png",
        ):
            self.assertTrue((ROOT / name).is_file(), name)
            self.assertIn("./" + name, source)

    def test_product_sources_are_pinned_to_canonical_repo(self):
        config = json.loads((ROOT / "pyscript.json").read_text(encoding="utf-8"))
        urls = tuple(config["files"])
        self.assertTrue(urls)
        self.assertTrue(all("PyDevices/pydevices/v0.1.0/" in url for url in urls))
        self.assertIn("./boarddev.py", config["files"].values())

    def test_first_party_template_is_pyodide_only(self):
        for page in (ROOT / "index.html", ROOT / "pwa" / "index.html"):
            source = page.read_text(encoding="utf-8")
            self.assertIn('script type="py"', source)
            self.assertNotIn('type="mpy"', source)


if __name__ == "__main__":
    unittest.main()
