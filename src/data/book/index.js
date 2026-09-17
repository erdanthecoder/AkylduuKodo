// The C++ handbook, assembled. Each chapter is its own file; this gives every
// page a running number so the reader can say "page 63 of 132".

import ch01 from './ch01.js';
import ch02 from './ch02.js';
import ch03 from './ch03.js';
import ch04 from './ch04.js';
import ch05 from './ch05.js';
import ch06 from './ch06.js';
import ch07 from './ch07.js';
import ch08 from './ch08.js';
import ch09 from './ch09.js';
import ch10 from './ch10.js';
import ch11 from './ch11.js';
import ch12 from './ch12.js';
import ch13 from './ch13.js';
import ch14 from './ch14.js';
import ch15 from './ch15.js';

export const CHAPTERS = [ch01, ch02, ch03, ch04, ch05, ch06, ch07, ch08, ch09, ch10, ch11, ch12, ch13, ch14, ch15];

let n = 0;
for (const chapter of CHAPTERS) {
  for (const page of chapter.pages) {
    page.number = ++n;
    page.chapterId = chapter.id;
  }
}

export const PAGES = CHAPTERS.flatMap((c) => c.pages);

const BY_ID = new Map(PAGES.map((p) => [p.id, p]));

export function findPage(id) {
  return BY_ID.get(id) || null;
}

export function pageAt(number) {
  return PAGES[number - 1] || null;
}

export function chapterOf(pageId) {
  const page = findPage(pageId);
  return CHAPTERS.find((c) => c.id === page?.chapterId) || CHAPTERS[0];
}
