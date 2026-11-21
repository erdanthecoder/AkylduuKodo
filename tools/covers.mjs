// tools/covers.mjs — a real photo for each official quiz (Unsplash, free to
// use under the Unsplash licence). Each was checked by eye.

const u = (id) => `https://images.unsplash.com/photo-${id}?w=800&h=480&fit=crop&q=70`;
export const COVER_PHOTOS = {
  space: u('1462331940025-496dfbfc7564'), capitals: u('1488085061387-422e29b40080'), animals: u('1564349683136-77e08dba1ef7'),
  body: u('1530026405186-ed1f139313f8'), maths: u('1453733190371-0a9bedd82893'), science: u('1532094349884-543bc11b234d'),
  geography: u('1501785888041-af3ef285b470'), english: u('1456513080510-7bf3a84b82f8'), inventions: u('1564325724739-bae0bd08762c'),
  sports: u('1461896836934-ffe607ba8211'), kyrgyzstan: u('1464822759023-fed622ff2c3b'), 'times-tables': u('1503676260728-1c00da094a0b'),
  fractions: u('1494253109108-2e30c049369b'), shapes: u('1550684848-fac1c5b4e853'), 'number-facts': u('1551288049-bebda4e38f71'),
  'money-time': u('1517842645767-c639042777db'), 'solar-energy': u('1526779259212-939e64788e3c'), chemistry: u('1532094349884-543bc11b234d'),
  plants: u('1490750967868-88aa4486c946'), weather: u('1504608524841-42fe6f032b4b'), dinosaurs: u('1525877442103-5ddb2089b2bb'),
  ocean: u('1437622368342-7a3d73a34c8f'), insects: u('1558642452-9d2a7deb7f62'), senses: u('1503454537195-1dcabb73ffb9'),
  physics: u('1546519638-68e109498ffc'), earth: u('1446776811953-b23d57bd21aa'), flags: u('1524661135-423995f22d0b'),
  'rivers-mountains': u('1506905925346-21bda4d32df4'), asia: u('1533577116850-9cc66cad8a9b'), europe: u('1518709268805-4e9042af9f23'),
  americas: u('1477959858617-67f85cf4f1df'), africa: u('1557050543-4d5f4e07ef46'), 'central-asia': u('1500534314209-a25ddb2bd429'),
  'ancient-egypt': u('1503177119275-0aa32b3a9368'), 'ancient-rome-greece': u('1552832230-c0197dd311b5'), explorers: u('1478131143081-80f7f84ca84d'),
  'famous-scientists': u('1509228468518-180dd4864904'), wonders: u('1519681393784-d120267933ba'), grammar: u('1517842645767-c639042777db'),
  spelling: u('1434030216411-0b793f4b4173'), opposites: u('1559827260-dc66d52bef19'), books: u('1507842217343-583bb7270b66'),
  languages: u('1612831455359-970e23a1e4e9'), music: u('1511671782779-c97d3d27a1d4'), art: u('1513364776144-60967b0f800f'),
  computers: u('1518770660439-4636190af475'), 'online-safety': u('1563013544-824ae1b704d3'), food: u('1504674900247-0877df9cc836'),
  olympics: u('1517649763962-0c623066013b'), football: u('1579952363873-27f3bade9f55'), riddles: u('1529699211952-734e80c4d42b'),
  'general-knowledge': u('1452570053594-1b985d6ea890'), 'kyrgyz-culture': u('1520962922320-2038eebab146'),
};
