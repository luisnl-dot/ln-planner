"""One-off content importer: turns the downloaded pages of the existing site into
Markdown content collections + image assets for the redesign."""
import re, os, sys, json, html, base64, shutil, subprocess
from html.parser import HTMLParser

S = sys.argv[1]            # scratchpad
P = sys.argv[2]            # project root
RAW = S + '/img/raw'

def rawname(src):
    src = html.unescape(src).split('#')[0]
    src = re.sub(r'^https?://[^/]+', '', src)
    return re.sub(r'^/images/', '', src).replace('//', '/').replace('/', '__').replace('%20', '_')

class MD(HTMLParser):
    def __init__(s):
        super().__init__(convert_charrefs=True)
        s.o = []; s.lists = []; s.skip = 0; s.imgs = []; s.href = None; s.mail = False
    def w(s, t): s.o.append(t)
    def handle_starttag(s, t, a):
        a = dict(a)
        if t in ('script', 'style'): s.skip += 1; return
        if t in ('h1', 'h2', 'h3', 'h4', 'h5', 'h6'):
            lvl = {'h1': 2, 'h2': 2, 'h3': 3, 'h4': 3, 'h5': 4, 'h6': 4}[t]
            s.w('\n\n' + '#' * lvl + ' ')
        elif t == 'p': s.w('\n\n')
        elif t == 'br': s.w('@@BR@@')
        elif t in ('ul', 'ol'): s.lists.append([t, 0]); s.w('\n')
        elif t == 'li':
            if s.lists:
                s.lists[-1][1] += 1
                pre = '- ' if s.lists[-1][0] == 'ul' else f'{s.lists[-1][1]}. '
            else: pre = '- '
            s.w('\n' + '  ' * max(0, len(s.lists) - 1) + pre)
        elif t in ('strong', 'b'): s.w('**')
        elif t in ('em', 'i'): s.w('*')
        elif t == 'a':
            h = a.get('href', '')
            if h.startswith('/images/') or 'jw_sig' in h:
                s.imgs.append(h); s.href = ''
            else:
                s.href = h; s.w('[')
        elif t == 'img':
            src = a.get('src', '')
            if 'transparent.gif' not in src: s.imgs.append(src)
        elif t == 'joomla-hidden-mail':
            try: addr = base64.b64decode(a.get('text', '')).decode()
            except Exception: addr = ''
            if '@' in addr: s.w(f'[{addr}](mailto:{addr})')
            s.mail = True
    def handle_endtag(s, t):
        if t in ('script', 'style'): s.skip = max(0, s.skip - 1); return
        if t in ('strong', 'b'): s.w('**')
        elif t in ('em', 'i'): s.w('*')
        elif t in ('ul', 'ol'):
            if s.lists: s.lists.pop()
            s.w('\n')
        elif t == 'a':
            if s.href: s.w(f']({fix_link(s.href)})')
            elif s.href is not None and s.href != '': s.w(']')
            s.href = None
        elif t == 'joomla-hidden-mail': s.mail = False
    def handle_data(s, d):
        if s.skip or s.mail: return
        if s.href == '': return
        s.w(re.sub(r'\s+', ' ', d))

def fix_link(h):
    h = h.strip()
    if h.startswith('/index.php/'):
        return MAP.get(h.split('#')[0].rstrip('/'), '/')
    return h

MAP = {
    '/index.php/gebrauchte/weyarn-2': '/gebrauchte/weyarn/',
    '/index.php/gebrauchte/schongau-2': '/gebrauchte/schongau/',
    '/index.php/gebrauchte/oy-mittelberg-2': '/gebrauchte/oy-mittelberg/',
    '/index.php/motorraeder/editionen': '/martin-edition/',
    '/index.php/kontakt': '/kontakt/',
    '/index.php/ankauf': '/ankauf/',
}

HARD = chr(92) + chr(10)   # CommonMark hard line break
def fix_bold(t):
    """Paart **-Marker je Absatz, zieht Leerraum/Umbrüche an den Rändern nach außen."""
    out = []
    for absatz in re.split(r'(\n\s*\n)', t):
        teile = absatz.split('**')
        if len(teile) < 3 or len(teile) % 2 == 0:
            out.append(absatz); continue
        neu = [teile[0]]
        for i in range(1, len(teile), 2):
            innen, nach = teile[i], teile[i + 1]
            m = re.match(r'^((?:[ \t]|\\\n|\n)*)(.*?)((?:[ \t]|\\\n|\n)*)$', innen, re.S)
            l, kern, r = m.group(1), m.group(2), m.group(3)
            if not kern:
                neu[-1] += innen + nach; continue
            vor = neu[-1] + l
            if re.search(r'[,;]$', vor): vor += ' '
            neu[-1] = vor
            neu.append('**' + kern + '**' + r + nach)
        out.append(re.sub(r'(\w) :\*\*', r'\1:**', ''.join(neu)))
    return re.sub(r'\\\n?(?=\n\s*\n|\s*$)', '', ''.join(out))

def to_md(fragment, br=None):
    BR = br if br is not None else HARD
    p = MD(); p.feed(fragment)
    t = ''.join(p.o)
    t = t.replace('\xa0', ' ')
    t = re.sub(r'\*\*\s*\*\*', '', t)
    t = re.sub(r'[ \t]+\n', '\n', t)
    t = re.sub(r'(?m)^\s*(-|\d+\.)\s*$', '', t)
    t = re.sub(r'\s*@@BR@@\s*(?=\n\n|$)', '', t)
    t = re.sub(r'(?m)^\s*@@BR@@\s*', '', t)
    t = re.sub(r'\s*@@BR@@\s*', lambda m: BR, t)
    t = re.sub(r'https?://(?:www\.)?motorrad-martin\.de/index\.php/news/(?:news-[a-z-]+/)?([a-z0-9-]+)', r'/journal/\1/', t)
    t = re.sub(r'\n{3,}', '\n\n', t)
    t = re.sub(r'(?m)^(#+)\s*$', '', t)
    t = re.sub(r'\*\*(\s+)', r'\1**', t) if False else t
    t = re.sub(r' {2,}', ' ', t)
    return fix_bold(t.strip()), p.imgs

def body_of(h):
    i = h.find('com-content-article__body')
    if i < 0: return ''
    i = h.find('>', i) + 1
    # walk divs to find the matching close
    depth = 1; j = i
    for m in re.finditer(r'<(/?)div\b', h[i:]):
        depth += -1 if m.group(1) else 1
        if depth == 0: j = i + m.start(); break
    return h[i:j]

def title_of(h):
    m = re.search(r'<h1[^>]*>(.*?)</h1>', h, re.S)
    return re.sub(r'\s+', ' ', html.unescape(re.sub(r'<[^>]+>', '', m.group(1)))).strip() if m else ''

def copy_img(src, dst, maxw=1800):
    name = rawname(src)
    p = os.path.join(RAW, name)
    if not os.path.exists(p):
        alt = [f for f in os.listdir(RAW) if f.lower() == name.lower()]
        if not alt: return False
        p = os.path.join(RAW, alt[0])
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    subprocess.run(['convert', p, '-auto-orient', '-strip', '-resize', f'{maxw}x{maxw}>', '-quality', '80', dst], check=True)
    return True

def fm(d):
    out = ['---']
    for k, v in d.items():
        if v is None or v == '' or v == []: continue
        if isinstance(v, list):
            out.append(f'{k}:'); out += [f'  - {json.dumps(x, ensure_ascii=False)}' for x in v]
        elif isinstance(v, (int, float)): out.append(f'{k}: {v}')
        else: out.append(f'{k}: {json.dumps(v, ensure_ascii=False)}')
    out.append('---'); return '\n'.join(out) + '\n\n'

def first_para(md, n=220):
    for para in md.split('\n\n'):
        para = para.strip()
        if not para or para.startswith('#') or para.startswith('-'): continue
        txt = re.sub(r'\[([^\]]+)\]\([^)]+\)', r'\1', para)
        txt = re.sub(r'[*_`]', '', txt).replace('  \n', ' ').replace('\n', ' ')
        if len(txt) < 40: continue
        if len(txt) > n: txt = txt[:n].rsplit(' ', 1)[0].rstrip(',;:–-') + ' …'
        return txt
    return ''

# ---------------------------------------------------------------- JOURNAL
TITLES = {
 'weltklasse-trifft-auf-black-edition-uebergabe-an-thorsten-margis': 'Weltklasse trifft auf Black Edition: Übergabe an Thorsten Margis',
 'eroeffnung-bmw-martin-weyarn': 'Eröffnung BMW Martin Weyarn',
 'fahrzeuguebergabe-bmw-r-ninet-masterpiece': 'The Art of Timeless Motion: R nineT Black Edition',
 'fahrzeuguebergabe-r-1300-gs-martin-edition': 'Fahrzeugübergabe: R 1300 GS Martin Edition',
 'bmw-f-450-r-mittelklasse-bmw-mit-spitzenwerten': 'BMW F 450 R: Mittelklasse-BMW mit Spitzenwerten',
}
def category(slug):
    if re.search(r'uebergabe|-fuer-[a-z]+-(aus|vom)-|weltklasse', slug): return 'uebergaben'
    if re.search(r'martin-edition', slug): return 'martin-edition'
    if re.search(r'eroeffnung|neubau', slug): return 'haus'
    if re.search(r'winter|highlight', slug): return 'service'
    return 'neuheiten'

order_src = open(S + '/site/news.html', encoding='utf-8').read()
order = []
for m in re.finditer(r'href="/index\.php/(news/[^"#?]+)"', order_src):
    k = m.group(1)
    if k.count('/') >= 1 and k not in order and not re.fullmatch(r'news/(news-[a-z-]+|racing)', k): order.append(k)

os.makedirs(P + '/src/content/journal', exist_ok=True)
n = 0
for idx, key in enumerate(order):
    f = S + '/site2/' + key.replace('/', '_') + '.html'
    if not os.path.exists(f): print('missing', key); continue
    h = open(f, encoding='utf-8').read()
    slug = key.split('/')[-1]
    standort = 'weyarn' if '/news-weyarn/' in key else 'oy-mittelberg' if '/news-oy' in key else 'schongau' if '/news-schongau/' in key else None
    body = body_of(h)
    md, imgs = to_md(body)
    # intro image sits above the body
    lead = re.search(r'<figure[^>]*item-image[^>]*>.*?<img[^>]*src="([^"]+)"', h, re.S)
    if not lead: lead = re.search(r'itemprop="image"[^>]*src="([^"]+)"|src="([^"]+)"[^>]*itemprop="image"', h)
    cands = ([next(g for g in lead.groups() if g)] if lead else []) + imgs
    # list teaser image as fallback
    lm = re.search(r'href="/index\.php/' + re.escape(key) + r'"[^>]*>\s*<img[^>]*src="([^"]+)"', order_src, re.S)
    if lm: cands.insert(0, lm.group(1))
    seen = []; 
    for c in cands:
        c = html.unescape(c).split('#')[0]
        if c and c not in seen and 'jw_sig_cache' not in c and 'transparent' not in c: seen.append(c)
    cover = None; gallery = []
    for i, c in enumerate(seen[:4]):
        dst = f'{P}/src/assets/journal/{slug}-{i}.jpg'
        if copy_img(c, dst, 1600 if i == 0 else 1280):
            rel = f'../../assets/journal/{slug}-{i}.jpg'
            if cover is None: cover = rel
            else: gallery.append(rel)
    title = TITLES.get(slug) or title_of(h)
    md = re.sub(r'^\s*#+\s*' + re.escape(title) + r'\s*$', '', md, flags=re.I | re.M).strip()
    data = dict(title=title, kategorie=category(slug), standort=standort, teaser=first_para(md), cover=cover, galerie=gallery[:3], reihenfolge=idx + 1, quelle='https://www.motorrad-martin.de/index.php/' + key)
    open(f'{P}/src/content/journal/{slug}.md', 'w').write(fm(data) + md + '\n'); n += 1
print('journal', n)

# ---------------------------------------------------------------- JOBS
os.makedirs(P + '/src/content/jobs', exist_ok=True)
n = 0
for f in sorted(os.listdir(S + '/site2')):
    m = re.fullmatch(r'karriere_jobs-([a-z-]+?)_(.+)\.html', f)
    if not m: continue
    standort, slug = m.group(1), m.group(2)
    h = open(S + '/site2/' + f, encoding='utf-8').read()
    title = title_of(h)
    md, _ = to_md(body_of(h), br=chr(10))
    # bullets typed as "• …<br>" become list items; other single breaks are soft wraps
    lines = []
    for block in md.split(chr(10) * 2):
        rows = [r.strip() for r in block.split(chr(10)) if r.strip()]
        if any(r.startswith('•') for r in rows):
            head = [r for r in rows if not r.startswith('•')]
            if head: lines.append(' '.join(head))
            lines.append(chr(10).join('- ' + r.lstrip('• ').strip() for r in rows if r.startswith('•')))
        elif rows and all(r.startswith(('- ', '#')) for r in rows):
            lines.append(chr(10).join(rows))
        else:
            lines.append(' '.join(rows))
    md = (chr(10) * 2).join(lines).replace('BMW- ', 'BMW-')
    txt = re.sub(r'<[^>]+>', ' ', h); txt = html.unescape(re.sub(r'\s+', ' ', txt))
    art = re.search(r'Beschäftigungsart:\s*(Vollzeit|Teilzeit|Freiberuflich / Werkvertrag|[A-Za-zäöü /]+?)\s+(?:Remote|Für|Gültig)', txt)
    gb = re.search(r'Gültig bis:\s*(\d{2}\.\d{2}\.\d{4})', txt)
    mail = re.search(r'\(mailto:([^)]+)\)', md)
    short = re.sub(r'\s*[–-]\s*(Schongau|Weyarn|Oy-Mittelberg( bei Kempten)?)\s*$', '', title)
    data = dict(title=short, standort=standort, art=art.group(1).strip() if art else 'Vollzeit', gueltigBis=gb.group(1) if gb else None, teaser=first_para(md, 200), kontakt=mail.group(1) if mail else None, quelle=f'https://www.motorrad-martin.de/index.php/karriere/jobs-{standort}/{slug}')
    open(f'{P}/src/content/jobs/{standort}-{slug}.md', 'w').write(fm(data) + md + '\n'); n += 1
print('jobs', n)

# ---------------------------------------------------------------- MODEL GUIDES
os.makedirs(P + '/src/content/modelle', exist_ok=True)
n = 0
src_list = open(S + '/site/gebrauchte_modelle.html', encoding='utf-8').read()
keys = re.findall(r'href="/index\.php/gebrauchte/modelle/([^"#?]+)"', src_list)
for idx, slug in enumerate(dict.fromkeys(keys)):
    f = f'{S}/site2/gebrauchte_modelle_{slug}.html'
    h = open(f, encoding='utf-8').read()
    title = title_of(h)
    md, _ = to_md(body_of(h))
    md = md.split('## Motorrad Martin — drei Standorte')[0].strip()
    model = re.sub(r'^BMW\s+|\s+gebraucht kaufen$', '', title)
    new_slug = re.sub(r'^bmw-|-gebraucht-kaufen$', '', slug).replace('r1250', 'r-1250')
    data = dict(title=title, modell=model, teaser=first_para(md, 230), reihenfolge=idx + 1, quelle=f'https://www.motorrad-martin.de/index.php/gebrauchte/modelle/{slug}')
    open(f'{P}/src/content/modelle/{new_slug}.md', 'w').write(fm(data) + md + '\n'); n += 1
print('modelle', n)

# ---------------------------------------------------------------- LEGAL
os.makedirs(P + '/src/content/recht', exist_ok=True)
for name, src in (('datenschutz', 'kontakt_datenschutz'), ('impressum', 'kontakt_impressum')):
    h = open(f'{S}/site/{src}.html', encoding='utf-8').read()
    md, _ = to_md(body_of(h))
    open(f'{P}/src/content/recht/{name}.md', 'w').write(fm(dict(title=name.capitalize())) + md + '\n')
    print(name, len(md))
