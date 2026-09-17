// webchecks.js — helpers for checking hand-written HTML.
//
// Deliberately regex-based rather than DOM-based: the same checks then run in
// the browser and in the Node test suite, and beginner HTML is simple enough
// that a tag scanner is honest about it.

export const strip = (html) => String(html || '');

/** Does the page contain this tag at all? */
export function hasTag(ctx, tag, msg) {
  const re = new RegExp(`<${tag}(\\s[^>]*)?>`, 'i');
  return re.test(ctx.html) || msg || `Your page needs a <${tag}> tag.`;
}

export function countTag(html, tag) {
  const re = new RegExp(`<${tag}(\\s[^>]*)?>`, 'gi');
  return (String(html).match(re) || []).length;
}

export function tagCountIs(ctx, tag, n, msg) {
  const got = countTag(ctx.html, tag);
  return got === n || msg || `I expected ${n} <${tag}> tag(s), but found ${got}.`;
}

export function tagCountAtLeast(ctx, tag, n, msg) {
  const got = countTag(ctx.html, tag);
  return got >= n || msg || `I expected at least ${n} <${tag}> tag(s), but found ${got}.`;
}

/** The text written between <tag> and </tag>, with tags and spaces removed. */
export function textOf(html, tag) {
  const re = new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)</${tag}>`, 'i');
  const m = String(html).match(re);
  return m ? m[1].replace(/<[^>]*>/g, '').trim() : null;
}

export function tagSays(ctx, tag, text, msg) {
  const got = textOf(ctx.html, tag);
  if (got === null) return msg || `I could not find a <${tag}> tag with text inside it.`;
  const same = got.replace(/\s+/g, ' ').toLowerCase() === String(text).replace(/\s+/g, ' ').toLowerCase();
  return same || msg || `Your <${tag}> should say "${text}" — right now it says "${got}".`;
}

/** Any non-empty text inside the tag (used when the learner picks the words). */
export function tagHasText(ctx, tag, msg) {
  const got = textOf(ctx.html, tag);
  return (got && got.length > 0) || msg || `Write something inside your <${tag}> tag.`;
}

export function hasAttr(ctx, tag, attr, msg) {
  const re = new RegExp(`<${tag}\\s[^>]*${attr}\\s*=`, 'i');
  return re.test(ctx.html) || msg || `Your <${tag}> needs a ${attr}="..." attribute.`;
}

export function attrValue(html, tag, attr) {
  const re = new RegExp(`<${tag}\\s[^>]*${attr}\\s*=\\s*["']([^"']*)["']`, 'i');
  const m = String(html).match(re);
  return m ? m[1] : null;
}

/** Does the page's CSS mention this property (anywhere in a style block or attribute)? */
export function styleHas(ctx, prop, msg) {
  const re = new RegExp(`${prop}\\s*:`, 'i');
  return re.test(ctx.html) || msg || `Add a \`${prop}\` rule to your style.`;
}

export function includesText(ctx, text, msg) {
  return ctx.html.toLowerCase().includes(String(text).toLowerCase()) || msg || `Your page should contain "${text}".`;
}

/** Every opened tag in this list must also be closed. */
export function closesTags(ctx, tags, msg) {
  for (const tag of tags) {
    const open = countTag(ctx.html, tag);
    const close = (ctx.html.match(new RegExp(`</${tag}>`, 'gi')) || []).length;
    if (open !== close) {
      return msg || `Every <${tag}> needs a closing </${tag}> — you have ${open} open and ${close} closed.`;
    }
  }
  return true;
}
