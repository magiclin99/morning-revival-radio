(() => {
  const D = DATA.doc, V = DATA.verses;
  const esc = s => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const DAYS = ['一', '二', '三', '四', '五', '六'];

  const verseHTML = key => {
    const v = V[key], has = v.n.length > 0;
    return `<div class="v${has ? ' has-note' : ''}" data-k="${esc(key)}"${has ? ' role="button" tabindex="0" aria-expanded="false"' : ''}>`
      + `<span class="ref">${esc(key)}</span><span class="vt">${esc(v.t)}</span></div>`;
  };
  const LOOP = 'https://magiclin99.github.io/bible-reading-loop/#ref=';
  const groupHTML = g => {
    if (!g.link) return g.keys.map(verseHTML).join('');
    const span = g.chapters > 1 ? `共 ${g.count} 節・跨 ${g.chapters} 章` : `整章 ${g.count} 節`;
    return `<a class="xlink" href="${LOOP + encodeURIComponent(g.link)}" target="_blank" rel="noopener">`
      + `<span class="xl-top"><span class="xl-ref">${esc(g.label)}</span><span class="xl-go">讀經網頁 ↗</span></span>`
      + `<span class="xl-sub">${span}，在讀經網頁從 ${esc(g.from)} 讀起</span></a>`;
  };
  const scriptureHTML = refs => refs.length ? `<div class="scripture">${refs.map(groupHTML).join('')}</div>` : '';

  let h = '';
  const m = D.week.match(/^(第.週)、(.*)$/);
  h += `<header class="top">`
    + `<p class="eyebrow">${esc(D.title)}</p>`
    + `<h1 class="theme">${esc(D.theme)}</h1>`
    + `<h2 class="week"><span class="wk">${esc(m ? m[1] : '')}</span>${esc(m ? m[2] : D.week)}</h2>`
    + `<p class="reading"><b>讀經</b>${esc(D.reading)}</p>`
    + scriptureHTML(D.readingRefs)
    + `</header>`;

  h += `<section class="sec" id="outline"><h2 class="sec-h">綱要<small>點有虛線的經文看註解</small></h2>`;
  for (const day of D.outline) {
    h += `<div class="day-h">${esc(day.day)}</div>`;
    for (const it of day.items) {
      h += `<div class="pt lv${it.lv}"><span class="lab">${esc(it.label)}</span>`
        + `<span class="txt">${esc(it.text)}</span>${scriptureHTML(it.refs)}</div>`;
    }
  }
  h += `</section>`;

  h += `<section class="sec" id="mr"><h2 class="sec-h">晨興聖言</h2>`;
  D.days.forEach((d, i) => {
    h += `<article class="day" id="d${i + 1}"><div class="day-h">${esc(d.day)}</div>`
      + `<h3 class="part">晨興餧養</h3>`
      + d.feed.verses.map(([r, t]) => `<p class="feedv"><b>${esc(r)}</b>${esc(t)}</p>`).join('')
      + `<div class="prose">${d.feed.paras.map(p => `<p>${esc(p)}</p>`).join('')}</div>`
      + `<h3 class="part">信息選讀</h3>`
      + `<div class="prose">${d.read.paras.map(p => `<p>${esc(p)}</p>`).join('')}</div>`
      + (d.read.ref ? `<p class="also"><b>參讀：</b>${esc(d.read.ref)}</p>` : '')
      + `</article>`;
  });
  h += `</section>`;

  const app = document.getElementById('app');
  app.innerHTML = h;

  // ── nav ──
  const nav = document.getElementById('nav');
  nav.innerHTML = `<a href="#outline">綱要</a><span class="sep"></span>`
    + D.days.map((d, i) => `<a href="#d${i + 1}" title="晨興聖言 ${esc(d.day)}">${esc(d.day)}</a>`).join('');
  const links = [...nav.querySelectorAll('a')];
  const targets = links.map(a => document.getElementById(a.getAttribute('href').slice(1)));
  const mark = () => {
    const y = (document.getElementById('bar').getBoundingClientRect().bottom) + 40;
    let cur = -1;
    targets.forEach((t, i) => { if (t.getBoundingClientRect().top <= y) cur = i; });
    if (cur === lastCur) return;
    lastCur = cur;
    links.forEach((a, i) => a.classList.toggle('on', i === cur));
    // 只水平捲導覽列本身；scrollIntoView 會連整頁一起捲回黏住的導覽列
    if (cur >= 0) {
      const a = links[cur];
      if (a.offsetLeft < nav.scrollLeft) nav.scrollLeft = a.offsetLeft;
      else if (a.offsetLeft + a.offsetWidth > nav.scrollLeft + nav.clientWidth)
        nav.scrollLeft = a.offsetLeft + a.offsetWidth - nav.clientWidth;
    }
  };
  let lastCur = null;
  let tick = false;
  addEventListener('scroll', () => { if (!tick) { tick = true; requestAnimationFrame(() => { tick = false; mark(); }); } }, { passive: true });
  mark();

  // ── 返回收聽：從 radio 首頁點進來的就退回上一頁（首頁會記住選到的週），否則連到首頁 ──
  document.getElementById('back').addEventListener('click', e => {
    let fromRadio = false;
    try { fromRadio = new URL(document.referrer).origin === location.origin; } catch (err) {}
    if (fromRadio && history.length > 1) { e.preventDefault(); history.back(); }
  });

  // ── scripture toggle ──
  const tog = document.getElementById('tog');
  const setShow = on => {
    document.body.classList.toggle('hide-scripture', !on);
    tog.setAttribute('aria-pressed', String(on));
    try { localStorage.setItem('showScripture', on ? '1' : '0'); } catch (e) {}
  };
  let saved = null;
  try { saved = localStorage.getItem('showScripture'); } catch (e) {}
  setShow(saved !== '0');
  tog.addEventListener('click', () => setShow(tog.getAttribute('aria-pressed') !== 'true'));

  // ── notes + big groups (event delegation) ──
  const notesHTML = key => `<div class="notes">` + V[key].n.map(([l, ps]) =>
    `<div class="note"><span class="nl">註${esc(l)}</span>${ps.map((p, i) => i ? `<p>${esc(p)}</p>` : esc(p)).join('')}</div>`
  ).join('') + `</div>`;

  const toggleVerse = el => {
    const nx = el.nextElementSibling;
    if (nx && nx.classList.contains('notes')) {
      nx.remove(); el.classList.remove('open'); el.setAttribute('aria-expanded', 'false'); return;
    }
    el.insertAdjacentHTML('afterend', notesHTML(el.dataset.k));
    el.classList.add('open'); el.setAttribute('aria-expanded', 'true');
  };
  app.addEventListener('click', e => {
    if (window.getSelection && String(window.getSelection()).length) return;   // 選字時不觸發
    const v = e.target.closest('.v.has-note');
    if (v) toggleVerse(v);
  });
  app.addEventListener('keydown', e => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const v = e.target.closest('.v.has-note');
    if (v && e.target === v) { e.preventDefault(); toggleVerse(v); }
  });
})();
