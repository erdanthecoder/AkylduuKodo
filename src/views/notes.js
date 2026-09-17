// notes.js (view) — everything the learner has written, in one place.

import { h, toast } from '../ui.js';
import { icon } from '../icons.js';
import { allNotes, setNote, notePad, noteKey } from '../notes.js';
import * as store from '../state.js';

function when(iso) {
  if (!iso) return '';
  const then = new Date(iso);
  const days = Math.floor((Date.now() - then.getTime()) / 86400000);
  if (days === 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days} days ago`;
  return then.toLocaleDateString();
}

export function NotesView(go, rerender) {
  const notes = allNotes();
  const loose = `free:${store.today()}`;

  const list = h('div', { class: 'note-list' },
    ...notes.map((note) =>
      h('article', { class: 'note-card' },
        h('header', { class: 'note-head' },
          h('div', {},
            h('h3', {}, note.label || note.title || 'Note'),
            h('span', { class: 'muted small' }, when(note.at)),
          ),
          h('div', { class: 'note-actions' },
            note.href
              ? h('button', { class: 'btn btn-ghost btn-sm', onclick: () => go(note.href) },
                  'Open', icon('arrowRight', { size: 14 }))
              : null,
            h('button', {
              class: 'btn btn-ghost btn-sm btn-quiet',
              title: 'Delete this note',
              onclick: () => {
                if (!confirm('Delete this note?')) return;
                setNote(note.key, '');
                toast('Note deleted.', 'warn');
                rerender();
              },
            }, icon('close', { size: 14 })),
          ),
        ),
        h('p', { class: 'note-text' }, note.text),
      ),
    ),
  );

  return h('div', { class: 'view notes-view' },
    h('div', { class: 'journey-head' },
      h('div', {},
        h('h1', { class: 'view-title' }, icon('pencil', { size: 22 }), 'Notebook'),
        h('p', { class: 'muted' },
          notes.length
            ? `${notes.length} note${notes.length === 1 ? '' : 's'}. Everything you have written, newest first.`
            : 'Nothing written yet. Every lesson and every page of the book has a pad at the bottom.'),
      ),
    ),
    notePad({
      key: loose,
      title: "Today's note",
      label: `Notebook · ${store.today()}`,
      href: '#/notes',
      placeholder: 'Anything at all — an idea, a question, something to look up later.',
      open: true,
    }),
    notes.length ? list : null,
  );
}
