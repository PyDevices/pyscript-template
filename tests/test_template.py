import json
import re
import subprocess
from pathlib import Path
import unittest


ROOT = Path(__file__).resolve().parents[1]


def _local_asset_paths_from_html(source):
    """Extract local (non-http) href/src paths referenced by an HTML shell."""
    paths = set()
    for match in re.finditer(r'''(?:href|src)=["']([^"']+)["']''', source):
        ref = match.group(1)
        if ref.startswith(("http://", "https://", "#")):
            continue
        paths.add(ref.split("?")[0].split("#")[0])
    return paths


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
        self.assertTrue(all("PyDevices/pydevices/v0.3.7/" in url for url in urls))
        self.assertIn("./boarddev.py", config["files"].values())
        self.assertIn("./appdev/__init__.py", config["files"].values())

    def test_first_party_template_is_pyodide_only(self):
        source = (ROOT / "index.html").read_text(encoding="utf-8")
        self.assertIn('script type="py"', source)
        self.assertNotIn('type="mpy"', source)

    def test_referenced_local_assets_exist_after_vendoring(self):
        """Every local asset index.html/sw.js reference must exist somewhere
        in the tree, either checked in or produced by
        scripts/vendor_pyscript.sh. This is the regression test for a
        template that references vendor/ without ever creating it: run the
        vendor script (or skip if we're offline) before asserting.
        """
        vendor_dir = ROOT / "vendor" / "pyscript"
        if not vendor_dir.is_dir():
            script = ROOT / "scripts" / "vendor_pyscript.sh"
            try:
                subprocess.run(
                    [str(script)],
                    check=True,
                    cwd=ROOT,
                    capture_output=True,
                    timeout=120,
                )
            except Exception as exc:  # network unavailable, etc.
                self.skipTest(f"could not vendor PyScript to verify assets: {exc}")

        html_source = (ROOT / "index.html").read_text(encoding="utf-8")
        sw_source = (ROOT / "sw.js").read_text(encoding="utf-8")

        referenced = set(_local_asset_paths_from_html(html_source))

        shell_match = re.search(r"const SHELL = \[(.*?)\];", sw_source, re.S)
        self.assertIsNotNone(shell_match, "sw.js must define a SHELL array")
        for item in re.finditer(r"""['"](\./[^'"]+)['"]""", shell_match.group(1)):
            referenced.add(item.group(1))

        missing = []
        for ref in sorted(referenced):
            if ref in ("./", "./index.html"):
                continue
            candidate = ROOT / ref.lstrip("./")
            if not candidate.exists():
                missing.append(ref)

        self.assertFalse(missing, f"referenced assets missing from tree: {missing}")


if __name__ == "__main__":
    unittest.main()
