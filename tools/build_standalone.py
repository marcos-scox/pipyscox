#!/usr/bin/env python3
"""Gera dist/pipyscox-standalone.html: um único arquivo com todo o CSS e JS embutidos.
Uso: python3 tools/build_standalone.py  (rodar na pasta raiz do projeto)"""
import re, pathlib
root = pathlib.Path(__file__).resolve().parent.parent
html = (root / "index.html").read_text(encoding="utf-8")
def css(m): return "<style>\n" + (root / m.group(1)).read_text(encoding="utf-8") + "\n</style>"
def js(m):  return "<script>\n" + (root / m.group(1)).read_text(encoding="utf-8").replace("</script>", "<\\/script>") + "\n</script>"
html = re.sub(r'<link rel="stylesheet" href="([^"]+)">', css, html)
html = re.sub(r'<script src="([^"]+)"></script>', js, html)
logo = (root / "assets/img/logo.svg").read_text(encoding="utf-8").strip()
import base64
html = html.replace('href="assets/img/logo.svg"', 'href="data:image/svg+xml;base64,' + base64.b64encode(logo.encode()).decode() + '"')
out = root / "dist" / "pipyscox-standalone.html"
out.parent.mkdir(exist_ok=True)
out.write_text(html, encoding="utf-8")
print("Gerado:", out)
