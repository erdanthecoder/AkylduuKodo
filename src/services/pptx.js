// pptx.js — read a PowerPoint (.pptx) file in the browser and turn its
// slides into Presentation+ slides: title, text and the main picture.
// (Google Slides and Keynote can export .pptx too.) Nothing is uploaded:
// pictures are shrunk and kept inside the presentation.

const JSZIP_URL = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
const IMG_BUDGET = 760000;     // characters of picture data per presentation (Firestore holds 1 MB)

function loadJSZip() {
  if (window.JSZip) return Promise.resolve(window.JSZip);
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = JSZIP_URL; s.async = true;
    s.onload = () => (window.JSZip ? resolve(window.JSZip) : reject(new Error('Could not load the reader')));
    s.onerror = () => reject(new Error('Could not load the reader. Check your connection.'));
    document.head.append(s);
  });
}

const xml = (text) => new DOMParser().parseFromString(text, 'application/xml');
const resolvePath = (base, target) => {
  if (target.startsWith('/')) return target.slice(1);
  const parts = base.split('/').slice(0, -1);
  for (const p of target.split('/')) { if (p === '..') parts.pop(); else if (p !== '.') parts.push(p); }
  return parts.join('/');
};
async function rels(zip, path) {
  const dir = path.split('/').slice(0, -1).join('/');
  const name = path.split('/').pop();
  const f = zip.file(`${dir}/_rels/${name}.rels`);
  const map = {};
  if (!f) return map;
  const doc = xml(await f.async('text'));
  for (const r of doc.getElementsByTagName('Relationship')) map[r.getAttribute('Id')] = resolvePath(path, r.getAttribute('Target'));
  return map;
}

/** A picture from the file, shrunk to a small JPEG (or null). */
async function picture(zip, path) {
  const f = zip.file(path);
  if (!f || !/\.(png|jpe?g|gif|bmp|webp)$/i.test(path)) return null;
  try {
    const blob = new Blob([await f.async('uint8array')], { type: /png$/i.test(path) ? 'image/png' : /gif$/i.test(path) ? 'image/gif' : 'image/jpeg' });
    const bmp = await createImageBitmap(blob);
    const scale = Math.min(1, 720 / bmp.width, 480 / bmp.height);
    const c = document.createElement('canvas');
    c.width = Math.max(1, Math.round(bmp.width * scale)); c.height = Math.max(1, Math.round(bmp.height * scale));
    const g = c.getContext('2d');
    g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height);
    g.drawImage(bmp, 0, 0, c.width, c.height);
    return c.toDataURL('image/jpeg', 0.62);
  } catch { return null; }
}

/**
 * Read a .pptx File. Resolves with { title, slides }, slides in Presentation+
 * form ({t: 'title'|'content', head, body, img, bg}).
 */
export async function readPptx(file, { onProgress = () => {} } = {}) {
  if (!/\.pptx$/i.test(file.name)) throw new Error('Pick a .pptx file. (Old .ppt files: open them in PowerPoint and "Save as" .pptx first.)');
  if (file.size > 60 * 1024 * 1024) throw new Error('That file is over 60 MB. Try saving it with smaller pictures.');
  const JSZip = await loadJSZip();
  const zip = await JSZip.loadAsync(file);
  const presPath = 'ppt/presentation.xml';
  const pres = zip.file(presPath);
  if (!pres) throw new Error('This does not look like a PowerPoint file.');
  const presRels = await rels(zip, presPath);
  const order = [...xml(await pres.async('text')).getElementsByTagName('p:sldId')].map((n) => presRels[n.getAttribute('r:id')]).filter(Boolean);
  let budget = IMG_BUDGET;
  const slides = [];
  for (let i = 0; i < order.length && slides.length < 38; i++) {
    onProgress(i + 1, order.length);
    const path = order[i];
    const f = zip.file(path);
    if (!f) continue;
    const doc = xml(await f.async('text'));
    let head = ''; let isTitle = false;
    const lines = [];
    for (const sp of doc.getElementsByTagName('p:sp')) {
      const ph = sp.getElementsByTagName('p:ph')[0];
      const type = ph ? ph.getAttribute('type') || 'body' : '';
      const paras = [...sp.getElementsByTagName('a:p')].map((p) => [...p.getElementsByTagName('a:t')].map((t) => t.textContent).join('').trim()).filter(Boolean);
      if (!paras.length) continue;
      if ((type === 'title' || type === 'ctrTitle') && !head) { head = paras.join(' '); isTitle = type === 'ctrTitle'; } else if (type === 'sldNum' || type === 'dt' || type === 'ftr') { /* page numbers, dates, footers */ } else lines.push(...paras);
    }
    if (!head && lines.length) head = lines.shift();
    // the biggest picture on the slide
    let img = '';
    const slideRels = await rels(zip, path);
    const pics = [...doc.getElementsByTagName('p:pic')].map((p) => {
      const blip = p.getElementsByTagName('a:blip')[0];
      const ext = p.getElementsByTagName('a:ext')[0];
      return { id: blip && (blip.getAttribute('r:embed') || blip.getAttribute('r:link')), area: ext ? (+ext.getAttribute('cx') || 0) * (+ext.getAttribute('cy') || 0) : 0 };
    }).filter((p) => p.id && slideRels[p.id]).sort((a, b) => b.area - a.area);
    if (pics.length && budget > 20000) {
      const data = await picture(zip, slideRels[pics[0].id]);
      if (data && data.length < Math.min(budget, 120000)) { img = data; budget -= data.length; }
    }
    slides.push({ t: isTitle && !img ? 'title' : 'content', head: head.slice(0, 140), body: lines.join('\n').slice(0, 600), img, bg: [0, 3, 5, 2, 1, 4][slides.length % 6] });
  }
  if (!slides.length) throw new Error('No slides found in that file.');
  return { title: (slides[0].head || file.name.replace(/\.pptx$/i, '')).slice(0, 80), slides };
}
