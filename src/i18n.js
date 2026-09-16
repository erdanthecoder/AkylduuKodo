// i18n.js — UI chrome in English and Kyrgyz. Lesson text falls back to English
// when a translation is missing (see `t()` and README → Translating lessons).

import { get, set } from './state.js';

export const LANGS = [
  { id: 'en', label: 'English', flag: '🌍' },
  { id: 'ky', label: 'Кыргызча', flag: '🇰🇬' },
];

const STRINGS = {
  en: {
    tagline: 'Learn to code the fun way',
    nav_home: 'Home',
    nav_journey: 'Journey',
    nav_arcade: 'Arcade',
    nav_play: 'Playground',
    nav_settings: 'Settings',
    welcome: 'Welcome back',
    welcome_new: 'Salam, coder!',
    this_week: 'This week',
    lessons_done: 'lessons done',
    streak: 'day streak',
    level: 'Level',
    xp: 'XP',
    continue: 'Continue learning',
    start: 'Start',
    replay: 'Replay',
    locked: 'Finish the lesson before to unlock',
    run: 'Run',
    run_hint: 'Run ▶ (Ctrl+Enter)',
    check: 'Check',
    next: 'Next',
    back: 'Back',
    hint: 'Hint',
    solution: 'Show solution',
    reset_code: 'Reset code',
    blocks_tab: 'Blocks',
    code_tab: 'Code',
    output: 'Output',
    correct: 'Correct!',
    not_yet: 'Not yet —',
    lesson_done: 'Lesson complete!',
    xp_earned: 'XP earned',
    back_to_journey: 'Back to journey',
    goal_q: 'How many lessons per week?',
    goal_note: '5 is the classic pace. Pick what fits your week.',
    name_q: 'What should we call you?',
    reset_all: 'Erase all progress',
    reset_confirm: 'This erases every lesson, badge and XP. Are you sure?',
    badges: 'Badges',
    play_title: 'Playground',
    play_sub: 'No rules here. Write anything and press Run.',
    arcade_title: 'Arcade',
    arcade_sub: 'Short games that sharpen real coding skills.',
    best: 'Best',
    score: 'Score',
    time: 'Time',
    play: 'Play',
    again: 'Play again',
    goal_reached: 'Weekly goal reached! 🎉',
    keep_going: 'to hit your goal',
    lang: 'Language',
    sound: 'Sound effects',
    typed_it: 'Type it exactly, character for character.',
    drag_hint: 'Put the lines in the right order.',
    new_badge: 'New badge',
  },
  ky: {
    tagline: 'Кызыктуу жол менен код жаз',
    nav_home: 'Башкы',
    nav_journey: 'Жол',
    nav_arcade: 'Оюндар',
    nav_play: 'Аянтча',
    nav_settings: 'Жөндөөлөр',
    welcome: 'Кайтып келдиңби',
    welcome_new: 'Салам, кодер!',
    this_week: 'Бул жума',
    lessons_done: 'сабак бүттү',
    streak: 'күн катары',
    level: 'Деңгээл',
    xp: 'XP',
    continue: 'Улантуу',
    start: 'Баштоо',
    replay: 'Кайра өтүү',
    locked: 'Мурунку сабакты бүтүр',
    run: 'Иштет',
    run_hint: 'Иштет ▶ (Ctrl+Enter)',
    check: 'Текшер',
    next: 'Кийинки',
    back: 'Артка',
    hint: 'Кеңеш',
    solution: 'Чечимди көрсөт',
    reset_code: 'Кодду тазалоо',
    blocks_tab: 'Блоктор',
    code_tab: 'Код',
    output: 'Натыйжа',
    correct: 'Туура!',
    not_yet: 'Азырынча эмес —',
    lesson_done: 'Сабак бүттү!',
    xp_earned: 'XP алдың',
    back_to_journey: 'Жолго кайтуу',
    goal_q: 'Жумасына канча сабак?',
    goal_note: '5 — классикалык темп. Өзүңө ылайыгын танда.',
    name_q: 'Атың ким?',
    reset_all: 'Бардык прогрессти өчүрүү',
    reset_confirm: 'Бардык сабак, белги жана XP өчөт. Макулсуңбу?',
    badges: 'Белгилер',
    play_title: 'Аянтча',
    play_sub: 'Эреже жок. Каалаганыңды жазып, Иштет баскычын бас.',
    arcade_title: 'Оюндар',
    arcade_sub: 'Код жазуу көндүмүн курчутуучу кыска оюндар.',
    best: 'Рекорд',
    score: 'Упай',
    time: 'Убакыт',
    play: 'Ойноо',
    again: 'Кайра ойноо',
    goal_reached: 'Жумалык максат аткарылды! 🎉',
    keep_going: 'максатка калды',
    lang: 'Тил',
    sound: 'Үн эффекттери',
    typed_it: 'Тамгасын тамгасына окшотуп жаз.',
    drag_hint: 'Саптарды туура тартипке кой.',
    new_badge: 'Жаңы белги',
  },
};

export function ui(key) {
  const lang = get().lang || 'en';
  return STRINGS[lang]?.[key] ?? STRINGS.en[key] ?? key;
}

/** Lesson text: accepts a plain string or a { en, ky } object. */
export function t(value) {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  const lang = get().lang || 'en';
  return value[lang] ?? value.en ?? Object.values(value)[0] ?? '';
}

export function setLang(lang) {
  set({ lang });
}
