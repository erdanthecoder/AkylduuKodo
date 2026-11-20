// report.js — game results as a spreadsheet file.

import { modeOf } from './modes/index.js';

/** Quote a cell, and defuse anything a spreadsheet would run as a formula. */
export function cell(v) {
  let s = String(v ?? '');
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCSV(report) {
  const rows = [['Rank', 'Name', 'Score', 'Correct', 'Answered', 'Accuracy', 'Notes']];
  (report.players || []).forEach((p, i) => {
    const acc = p.answered ? `${Math.round((p.correct / p.answered) * 100)}%` : '';
    rows.push([p.rank || i + 1, p.name, p.score, p.correct, p.answered, acc, p.notes || '']);
  });
  return rows.map((r) => r.map(cell).join(',')).join('\r\n');
}

export function downloadCSV(report) {
  const blob = new Blob(['﻿', toCSV(report)], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a');
  const date = new Date(report.at || Date.now()).toISOString().slice(0, 10);
  const safe = String(report.quizTitle || 'game').replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '').slice(0, 40) || 'game';
  a.href = URL.createObjectURL(blob);
  a.download = `quickzy-${safe}-${modeOf(report.mode).id}-${date}.csv`;
  document.body.append(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
}
