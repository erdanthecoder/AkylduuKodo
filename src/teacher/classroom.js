// classroom.js — Google Classroom, within what the API actually allows.
//
// Worth knowing before reading on, because it shapes everything here:
//
//   A submission can only be turned in by the Google Cloud project that
//   CREATED the coursework. So this dashboard can create an assignment in your
//   own Classroom course and work with it fully — but it can never hand in
//   homework that Malika's school teacher set, from any account. No app can.
//   That is Google's rule, not a gap in this code.
//
// What that leaves is genuinely useful:
//   • create the assignment in your course, with a link that opens her task
//   • once her result comes in, grade it and return it, which is the part
//     that usually takes the longest by hand
//
// She never signs in to Google. The link carries the family code, and the
// marking happens from your session here.

import { token, hasClassroom } from './auth.js';

const API = 'https://classroom.googleapis.com/v1';

async function call(path, { method = 'GET', body } = {}) {
  if (!hasClassroom()) throw new Error('Classroom is not connected.');
  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token()}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const detail = await res.json().catch(() => ({}));
    const message = detail?.error?.message || `${res.status} ${res.statusText}`;
    throw new Error(message);
  }
  return res.json();
}

/** The courses you teach, newest first. */
export async function courses() {
  const data = await call('/courses?teacherId=me&courseStates=ACTIVE&pageSize=40');
  return (data.courses || []).map((c) => ({ id: c.id, name: c.name, section: c.section }));
}

/**
 * Put today's task into a course as an assignment, linking straight to it.
 * Returns the coursework, whose id is kept so the result can be graded later.
 */
export async function postAssignment({ courseId, day, title, description, link, points = 100, dueAt }) {
  const body = {
    title: title || `Maths — ${day}`,
    description,
    materials: [{ link: { url: link, title: 'Open the task' } }],
    workType: 'ASSIGNMENT',
    state: 'PUBLISHED',
    maxPoints: points,
  };
  if (dueAt) {
    const d = new Date(dueAt);
    body.dueDate = { year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate() };
    body.dueTime = { hours: 23, minutes: 59 };
  }
  return call(`/courses/${courseId}/courseWork`, { method: 'POST', body });
}

/** Everyone's submissions for one piece of coursework. */
export async function submissions(courseId, courseWorkId) {
  const data = await call(`/courses/${courseId}/courseWork/${courseWorkId}/studentSubmissions`);
  return data.studentSubmissions || [];
}

/**
 * Grade a submission and hand it back. Only works on coursework this dashboard
 * created — see the note at the top of the file.
 */
export async function gradeAndReturn({ courseId, courseWorkId, submissionId, score }) {
  await call(
    `/courses/${courseId}/courseWork/${courseWorkId}/studentSubmissions/${submissionId}?updateMask=assignedGrade,draftGrade`,
    { method: 'PATCH', body: { assignedGrade: score, draftGrade: score } },
  );
  return call(
    `/courses/${courseId}/courseWork/${courseWorkId}/studentSubmissions/${submissionId}:return`,
    { method: 'POST', body: {} },
  );
}

/**
 * For homework somebody else set: a link that opens Classroom's own share
 * window, so it can be attached by hand. No API permission needed, and it is
 * the only route that works for a school's own assignment.
 */
export function shareLink(url, title) {
  const params = new URLSearchParams({ url, title: title || 'Maths task', body: '' });
  return `https://classroom.google.com/share?${params}`;
}
