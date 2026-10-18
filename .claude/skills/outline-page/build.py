"""晨興聖言 .md → 綱要網頁。

用法：
  python3 -I build.py list  <md>
      列出 .md 每一行綱要（含讀經行）的行號與經文出處原文，供人工判讀成 refs.txt。
  python3 -I build.py build <md> <refs.txt> <verses_dir> <out.html>
      依 refs.txt 從 verses_dir 取經文與註解，套 template/ 產出完整網頁。

出處判讀（省略書名、「16節」等）由人做，寫進 refs.txt；本程式只照表取經文。
"""
import json
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
LABEL = re.compile(r'^(\d+)\\\. |^([a-z])\. |^(\([一二三四五六七八九十]+\)) ')


# ---------------------------------------------------------------- list

def cmd_list(md_path):
    lines = open(md_path, encoding='utf-8').read().split('\n')
    section = None
    for i, l in enumerate(lines, 1):
        if l.startswith('**讀經**'):
            print(f'{i}\t讀經\t{l.split("：", 1)[1]}')
        if l == '## 綱要':
            section = 'outline'
        elif l == '## 晨興聖言':
            break
        if section != 'outline' or not l.strip() or l.startswith('#'):
            continue
        t = re.sub(r'^\s*(- )?\*{0,2}', '', l).rstrip('*')
        tail = re.findall(r'—([^—]*?)$', t)
        paren = re.findall(r'（([^（）]*\d[^（）]*)）', t)
        print(f'{i}\t{t[:14]}\t{tail[0] if tail else ""}\t{"；".join(paren)}')


# ---------------------------------------------------------------- build

def cmd_build(md_path, refs_path, vdir, out_path):
    lines = open(md_path, encoding='utf-8').read().split('\n')

    def verse_file(book, ch, v):
        w = 3 if book == '詩' else 2
        return os.path.join(vdir, book, f'{book}_{ch:0{w}d}_{v:0{w}d}.md')

    def chapter_len(book, ch):
        v = 1
        while os.path.exists(verse_file(book, ch, v + 1)):
            v += 1
        return v

    verses = {}

    def load(book, ch, v):
        key = f'{book}{ch}:{v}'
        if key in verses:
            return key
        src = open(verse_file(book, ch, v), encoding='utf-8').read()
        text = re.search(r'^> (.*)$', src, re.M).group(1).strip()
        notes = []
        body = src.split('## 註解', 1)[1] if '## 註解' in src else ''
        for m in re.finditer(r'\*\*註(\d+)\*\*\n(.*?)(?=\n\*\*註\d+\*\*|\Z)', body, re.S):
            paras = [p.strip() for p in m.group(2).strip().split('\n\n') if p.strip()]
            if paras:   # verses/ 裏同一個註號常重複一次且內容為空，略過
                notes.append([m.group(1), paras])
        verses[key] = {'t': text, 'n': notes}
        return key

    def expand(spec):
        book, rest = spec.split(' ')
        m = re.fullmatch(r'(\d+):(\d+)-(\d+):(\d+)', rest)
        if m:
            c1, v1, c2, v2 = map(int, m.groups())
        elif re.fullmatch(r'(\d+):(\d+)-(\d+)', rest):
            c1, v1, v2 = map(int, re.fullmatch(r'(\d+):(\d+)-(\d+)', rest).groups())
            c2 = c1
        elif re.fullmatch(r'(\d+):(\d+)', rest):
            c1, v1 = map(int, rest.split(':'))
            c2, v2 = c1, v1
        elif re.fullmatch(r'(\d+)-(\d+)', rest):
            c1, c2 = map(int, rest.split('-'))
            v1, v2 = 1, chapter_len(book, c2)
        else:
            c1 = c2 = int(rest)
            v1, v2 = 1, chapter_len(book, c1)
        # 跨章或整章：不列經文，改連到 bible-reading-loop
        if c1 != c2 or ':' not in rest:
            count = sum((v2 if c == c2 else chapter_len(book, c)) - (v1 if c == c1 else 1) + 1
                        for c in range(c1, c2 + 1))
            return {'label': book + rest, 'link': f'{book}{c1}:{v1}', 'count': count,
                    'chapters': c2 - c1 + 1, 'from': f'{c1}:{v1}'}
        return {'label': book + rest, 'keys': [load(book, c1, v) for v in range(v1, v2 + 1)]}

    refs = {}
    for l in open(refs_path, encoding='utf-8'):
        if l.startswith('#') or not l.strip():
            continue
        n, specs = l.rstrip('\n').split('\t')
        refs[int(n)] = [expand(s.strip()) for s in specs.split('；')]

    data = {'title': lines[0][2:], 'outline': [], 'days': []}
    section = day = part = None
    for i, l in enumerate(lines, 1):
        if l.startswith('**總題**：'):
            data['theme'] = l.split('：', 1)[1]
        elif l.startswith('## 第'):
            data['week'] = l[3:]
        elif l.startswith('**讀經**：'):
            data['reading'] = l.split('：', 1)[1]
            data['readingRefs'] = refs.get(i, [])
        elif l == '## 綱要':
            section = 'outline'
        elif l == '## 晨興聖言':
            section = 'mr'
        elif not l.strip() or section is None:
            continue
        elif section == 'outline':
            if l.startswith('### '):
                day = {'day': l[4:], 'items': []}
                data['outline'].append(day)
                continue
            if l.startswith('**'):
                t = l.strip('*')
                lv, lab, txt = 1, t[:2], t[2:]
            else:
                lv = (len(l) - len(l.lstrip(' '))) // 2 + 2
                t = l.strip()[2:]
                if lv == 2:
                    lab, txt = t[:2], t[2:]
                else:
                    m = LABEL.match(t)
                    if not m:
                        sys.exit(f'第 {i} 行沒有編號，.md 格式不對：{l}')
                    lab = (m.group(1) + '.') if m.group(1) else (m.group(2) + '.') if m.group(2) else m.group(3)
                    txt = t[m.end():]
            day['items'].append({'lv': lv, 'label': lab, 'text': txt, 'refs': refs.get(i, [])})
        elif section == 'mr':
            if l.startswith('### '):
                day = {'day': l[4:], 'feed': {'verses': [], 'paras': []}, 'read': {'paras': [], 'ref': None}}
                data['days'].append(day)
            elif l == '#### 晨興餧養':
                part = 'feed'
            elif l == '#### 信息選讀':
                part = 'read'
            elif re.match(r'^> \*\*(.+?)\*\* ', l):
                m = re.match(r'^> \*\*(.+?)\*\* (.*)$', l)
                day['feed']['verses'].append([m.group(1), m.group(2)])
            elif l.startswith('*參讀：'):
                day['read']['ref'] = l.strip('*')[3:]
            else:
                day[part]['paras'].append(l)

    for k in ('theme', 'week', 'reading'):
        if k not in data:
            sys.exit(f'.md 缺少 {k}（總題／## 第X週／讀經）')

    head = open(os.path.join(HERE, 'template', 'head.html'), encoding='utf-8').read()
    app = open(os.path.join(HERE, 'template', 'app.js'), encoding='utf-8').read()
    wk = re.match(r'^(第.週)', data['week'])
    title = data['theme'].strip('『』') + (f' {wk.group(1)}' if wk else '')
    payload = json.dumps({'doc': data, 'verses': verses}, ensure_ascii=False, separators=(',', ':'))
    html = ('<!doctype html>\n<html lang="zh-Hant">\n<meta charset="utf-8">\n'
            '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'
            + head.replace('{{TITLE}}', title)
            + '<script>\nconst DATA = ' + payload + ';\n' + app + '</script>\n</html>\n')
    with open(out_path, 'w', encoding='utf-8') as f:
        f.write(html)

    links = [g for d in data['outline'] for it in d['items'] for g in it['refs'] if 'link' in g]
    links += [g for g in data['readingRefs'] if 'link' in g]
    print(f'{out_path}: {os.path.getsize(out_path)} bytes')
    print(f'綱要 {sum(len(d["items"]) for d in data["outline"])} 條，晨興聖言 {len(data["days"])} 天，'
          f'內嵌經文 {len(verses)} 節（{sum(1 for v in verses.values() if v["n"])} 節有註解）')
    for g in links:
        print(f'連結卡片：{g["label"]}（{g["count"]} 節）')


if __name__ == '__main__':
    if len(sys.argv) == 3 and sys.argv[1] == 'list':
        cmd_list(sys.argv[2])
    elif len(sys.argv) == 6 and sys.argv[1] == 'build':
        cmd_build(*sys.argv[2:])
    else:
        sys.exit(__doc__)
