#!/usr/bin/env python3
"""Generate the Spanish pages under site/es/ from the English ones.

Why this exists
---------------
Spanish used to be applied in the browser: i18n.js swapped text on the same
six URLs and remembered the choice in localStorage. That works for a visitor
already on the site, but the Spanish text has no URL of its own, so it cannot
be shared, cannot be indexed by a search engine, and cannot carry hreflang.

This script bakes the same dictionary into a real second set of pages. The
translation source of truth stays site/js/i18n.js -- the dictionary is read
straight out of that file rather than duplicated here, so the pages and the
reservation dialog can never disagree about a string.

Run it after ANY edit to an English page or to the dictionary:

    python3 tools/build-es.py

It rewrites site/es/ from scratch each time. Nothing under site/es/ should be
edited by hand; those edits are silently discarded on the next run.
"""

import html
import json
import os
import re
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SITE = os.path.join(ROOT, "site")
OUT = os.path.join(SITE, "es")
I18N = os.path.join(SITE, "js", "i18n.js")
BASE = "https://miguels-restaurante.netlify.app"

PAGES = ["index.html", "dinner.html", "dishes.html", "lunch.html",
         "story.html", "visit.html"]

# Root-relative path each page is served at, without the .html extension.
# Netlify serves both /lunch and /lunch.html; the site links to the short form.
PRETTY = {
    "index.html": "/",
    "dinner.html": "/dinner",
    "dishes.html": "/dishes",
    "lunch.html": "/lunch",
    "story.html": "/story",
    "visit.html": "/visit",
}


def load_dict():
    """Read DICT out of i18n.js by evaluating just that object literal.

    Parsing it with a regex would mean re-implementing JavaScript string
    escaping; handing the literal to node keeps one source of truth and fails
    loudly if the file is ever restructured.

    On the eval: the input is a slice of this repository's own
    site/js/i18n.js, read from disk by a developer running a build script on
    their own machine. It is never user input and never reaches a server.
    JSON.parse cannot be used instead because the literal is JavaScript, not
    JSON -- its keys are unquoted and its strings are single-quoted. Anyone
    able to edit i18n.js can already change what the site ships, so this adds
    no capability an attacker did not already have.
    """
    js = r"""
    const fs = require('fs');
    const s = fs.readFileSync(process.argv[1], 'utf8');
    const start = s.indexOf('var DICT = {');
    if (start < 0) throw new Error('DICT not found in i18n.js');
    const end = s.indexOf('\n  };', start);
    if (end < 0) throw new Error('end of DICT not found in i18n.js');
    const literal = s.slice(start + 'var DICT = '.length, end + 4);
    process.stdout.write(JSON.stringify(eval('(' + literal + ')')));
    """
    try:
        raw = subprocess.run(["node", "-e", js, I18N],
                             capture_output=True, text=True, check=True).stdout
    except FileNotFoundError:
        sys.exit("node is required to read the dictionary out of i18n.js")
    except subprocess.CalledProcessError as e:
        sys.exit("could not read DICT from i18n.js:\n" + e.stderr)
    return json.loads(raw)


def find_close(s, tag, start):
    """Index just past the close tag matching the element opened before `start`.

    Counts nested same-name tags, because three translated paragraphs contain
    inline <span> and <a> children.
    """
    depth = 1
    pat = re.compile(r"</?" + re.escape(tag) + r"\b")
    i = start
    while depth:
        m = pat.search(s, i)
        if not m:
            return -1
        depth += -1 if s[m.start() + 1] == "/" else 1
        i = m.end()
        if depth == 0:
            close = s.find(">", i)
            return -1 if close < 0 else close + 1
    return -1


def translate_text(page, s, dct, missing):
    """Replace the inner HTML of every [data-i18n] element with its Spanish."""
    open_tag = re.compile(
        r"<(?P<tag>[a-z0-9]+)(?P<attrs>[^>]*?\sdata-i18n=(?P<q>[\"'])(?P<key>[^\"']+)(?P=q)[^>]*)>")
    out, pos = [], 0
    while True:
        m = open_tag.search(s, pos)
        if not m:
            out.append(s[pos:])
            break
        end = find_close(s, m.group("tag"), m.end())
        if end < 0:
            missing.append((page, m.group("key"), "unclosed element"))
            out.append(s[pos:m.end()])
            pos = m.end()
            continue
        key = m.group("key")
        entry = dct.get(key)
        if not entry or entry.get("es") is None:
            missing.append((page, key, "no Spanish value"))
            out.append(s[pos:end])
        else:
            close_len = len(m.group("tag")) + 3  # </tag>
            out.append(s[pos:m.end()])
            out.append(entry["es"])
            out.append(s[end - close_len:end])
        pos = end
    return "".join(out)


def translate_attr(page, s, dct, data_attr, target_attr, missing):
    """Set aria-label / placeholder from their data-i18n-* companion."""
    def repl(m):
        key = m.group("key")
        entry = dct.get(key)
        if not entry or entry.get("es") is None:
            missing.append((page, key, "no Spanish value"))
            return m.group(0)
        # These land in an attribute, so entities must be resolved and the
        # quote character escaped rather than passed through as markup.
        value = html.unescape(entry["es"]).replace('"', "&quot;")
        tag = m.group(0)
        pat = re.compile(target_attr + r"=([\"'])(?:(?!\1).)*\1")
        if pat.search(tag):
            return pat.sub(target_attr + '="' + value + '"', tag, count=1)
        return tag[:-1] + ' ' + target_attr + '="' + value + '">'

    return re.sub(r"<[a-z0-9]+[^>]*?\s" + data_attr +
                  r"=([\"'])(?P<key>[^\"']+)\1[^>]*>", repl, s)


def rewrite_links(s):
    """Point in-site navigation at the Spanish tree."""
    # href='/lunch' -> href='/es/lunch', and href='/' -> href='/es/'
    s = re.sub(r"href=([\"'])/(?![/e])(?P<rest>[a-z-]*)\1",
               lambda m: "href=%s/es/%s%s" % (m.group(1), m.group("rest"), m.group(1)), s)
    s = re.sub(r"href=([\"'])/\1", lambda m: "href=%s/es/%s" % (m.group(1), m.group(1)), s)
    return s


def rewrite_assets(s):
    """Make asset paths root-absolute so they resolve from one level deeper.

    This must cover every attribute that holds a path, not just src and href.
    main.js loads the hero and band videos lazily from data-src, poster and
    their mobile and portrait variants; those are relative too, so under /es/
    they would resolve to /es/assets/... and 404. Matching on the attribute
    name rather than a fixed list of two caught that.
    """
    return re.sub(r"\b(src|href|poster|data-src|data-src-mobile|data-src-portrait"
                  r"|data-poster-mobile|data-poster-portrait)=([\"'])(assets|css|js)/",
                  lambda m: "%s=%s/%s/" % (m.group(1), m.group(2), m.group(3)), s)


def set_meta(page, s, dct, missing):
    """Translate the <head> strings a search engine and a share card show.

    Without this the Spanish pages would be indexed under English titles,
    which defeats the reason for giving them their own URLs.
    """
    slug = page[:-len(".html")]
    fields = [
        ("title", r"<title>.*?</title>", "<title>%s</title>"),
        ("desc", r'<meta name="description" content="[^"]*">',
         '<meta name="description" content="%s">'),
        ("ogTitle", r'<meta property="og:title" content="[^"]*">',
         '<meta property="og:title" content="%s">'),
        ("ogDesc", r'<meta property="og:description" content="[^"]*">',
         '<meta property="og:description" content="%s">'),
    ]
    for name, pattern, template in fields:
        key = "meta.%s.%s" % (slug, name)
        entry = dct.get(key)
        if not entry or entry.get("es") is None:
            missing.append((page, key, "no Spanish value"))
            continue
        value = entry["es"]
        if name != "title":
            value = value.replace('"', "&quot;")
        s = re.sub(pattern, lambda _m, v=template % value: v, s, count=1, flags=re.S)
    return s


def set_head(s, page):
    """Point canonical and og:url at this Spanish page, and pair the languages."""
    en_url = BASE + PRETTY[page]
    es_url = BASE + "/es" + (PRETTY[page] if PRETTY[page] != "/" else "/")
    s = re.sub(r'<link rel="canonical" href="[^"]*">',
               '<link rel="canonical" href="%s">' % es_url, s)
    s = re.sub(r'<meta property="og:url" content="[^"]*">',
               '<meta property="og:url" content="%s">' % es_url, s)
    s = re.sub(r'<meta property="og:locale" content="[^"]*">', "", s)
    alternates = (
        '<link rel="alternate" hreflang="en" href="%s">\n'
        '<link rel="alternate" hreflang="es" href="%s">\n'
        '<link rel="alternate" hreflang="x-default" href="%s">'
        % (en_url, es_url, en_url))
    # Replace the English page's own alternates rather than stacking a copy.
    s = re.sub(r'<link rel="alternate" hreflang="[^"]*" href="[^"]*">\n?', "", s)
    s = s.replace('<link rel="canonical" href="%s">' % es_url,
                  '<link rel="canonical" href="%s">\n%s' % (es_url, alternates), 1)
    return s.replace('<html lang="en">', '<html lang="es">', 1)


def set_toggle(s, page):
    """Flip the language switch so it points back at English."""
    return re.sub(
        r'<a class="lang-toggle"[^>]*>[^<]*</a>',
        '<a class="lang-toggle" href="%s" hreflang="en" '
        'aria-label="Switch to English">EN</a>' % PRETTY[page], s)


def write_sitemap():
    """List both languages, each entry naming its counterpart.

    The site had no sitemap at all. With two language trees it matters more:
    the alternate links are how a search engine learns the pages are the same
    content rather than duplicates competing with each other.
    """
    rows = []
    for page in PAGES:
        en_url = BASE + PRETTY[page]
        es_url = BASE + "/es" + (PRETTY[page] if PRETTY[page] != "/" else "/")
        for url in (en_url, es_url):
            rows.append(
                "  <url>\n"
                "    <loc>%s</loc>\n"
                '    <xhtml:link rel="alternate" hreflang="en" href="%s"/>\n'
                '    <xhtml:link rel="alternate" hreflang="es" href="%s"/>\n'
                '    <xhtml:link rel="alternate" hreflang="x-default" href="%s"/>\n'
                "  </url>" % (url, en_url, es_url, en_url))
    xml = ('<?xml version="1.0" encoding="UTF-8"?>\n'
           '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n'
           '        xmlns:xhtml="http://www.w3.org/1999/xhtml">\n'
           + "\n".join(rows) + "\n</urlset>\n")
    open(os.path.join(SITE, "sitemap.xml"), "w", encoding="utf-8").write(xml)

    robots = ("User-agent: *\n"
              "Allow: /\n\n"
              "Sitemap: %s/sitemap.xml\n" % BASE)
    open(os.path.join(SITE, "robots.txt"), "w", encoding="utf-8").write(robots)


def build(check_only=False):
    """Generate site/es/. With check_only, report staleness instead of writing.

    The check mode exists because nothing forces a regeneration: edit an
    English page, forget to run this, and the two languages drift apart
    silently. Run `python3 tools/build-es.py --check` before deploying.
    """
    dct = load_dict()
    missing = []
    os.makedirs(OUT, exist_ok=True)
    written = []
    stale = []
    for page in PAGES:
        src = os.path.join(SITE, page)
        if not os.path.exists(src):
            sys.exit("missing English page: " + src)
        s = open(src, encoding="utf-8").read()
        s = translate_text(page, s, dct, missing)
        s = translate_attr(page, s, dct, "data-i18n-aria", "aria-label", missing)
        s = translate_attr(page, s, dct, "data-i18n-placeholder", "placeholder", missing)
        s = set_meta(page, s, dct, missing)
        s = rewrite_links(s)
        s = rewrite_assets(s)
        s = set_head(s, page)
        s = set_toggle(s, page)
        dest = os.path.join(OUT, page)
        if check_only:
            current = open(dest, encoding="utf-8").read() if os.path.exists(dest) else None
            if current != s:
                stale.append(page)
        else:
            open(dest, "w", encoding="utf-8").write(s)
        written.append(page)
    if missing:
        print("Untranslated keys:", file=sys.stderr)
        for page, key, why in missing:
            print("  %-14s %-32s %s" % (page, key, why), file=sys.stderr)
        sys.exit(1)
    if check_only:
        if stale:
            print("site/es/ is out of date for: " + ", ".join(stale), file=sys.stderr)
            print("Run: python3 tools/build-es.py", file=sys.stderr)
            sys.exit(1)
        print("site/es/ is up to date with the English pages")
        return
    write_sitemap()
    print("wrote %d Spanish pages to site/es/, plus sitemap.xml and robots.txt"
          % len(written))


if __name__ == "__main__":
    build(check_only="--check" in sys.argv)
