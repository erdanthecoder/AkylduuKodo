// tools/quizzes.mjs — the quizzes published by the official Quickzy account.
//
// Written in the editor's full form (answers inline). tools/seed.mjs checks
// every question with the same rules the editor uses, splits off the answers
// and publishes them. Facts were chosen to be settled, not disputed.

let n = 0;
const id = () => `q${++n}`;
const mc = (text, options, answer, time = 20, points = 'standard') => ({ id: id(), type: 'mc', text, options, answer, time, points });
const tf = (text, answer, time = 10) => ({ id: id(), type: 'tf', text, answer, time, points: 'standard' });
const multi = (text, options, answer, time = 30) => ({ id: id(), type: 'multi', text, options, answer, time, points: 'standard' });
const type = (text, answer, time = 30) => ({ id: id(), type: 'type', text, answer, time, points: 'standard' });
const order = (text, options, time = 30) => ({ id: id(), type: 'order', text, options, time, points: 'standard' });
const num = (text, answer, tolerance = 0, unit = '', time = 20) => ({ id: id(), type: 'number', text, answer, tolerance, unit, time, points: 'standard' });
const poll = (text, options) => ({ id: id(), type: 'poll', text, options, time: 20, points: 'none' });

import { MORE } from './quizzes2.mjs';

const BASE = [
  {
    slug: 'space', cover: 5, title: 'Planets and Space',
    description: 'A tour of the Solar System: planets, the Moon, the Sun and the people who went to space.',
    questions: [
      mc('Which is the largest planet in our Solar System?', ['Mars', 'Jupiter', 'Earth', 'Venus'], 1),
      tf('The Sun is a star.', true),
      num('How many planets are in our Solar System?', 8),
      mc('Which planet is closest to the Sun?', ['Venus', 'Earth', 'Mercury', 'Mars'], 2),
      type('Which planet is known as the Red Planet?', ['Mars']),
      multi('Which of these planets have rings? Pick all that do.', ['Saturn', 'Uranus', 'Mars', 'Venus'], [0, 1]),
      order('Put these planets in order, starting nearest the Sun.', ['Mercury', 'Venus', 'Earth', 'Mars']),
      tf('Light from the Sun takes about 8 minutes to reach Earth.', true),
      mc('Who was the first person to walk on the Moon?', ['Yuri Gagarin', 'Neil Armstrong', 'Buzz Aldrin', 'Valentina Tereshkova'], 1, 20, 'double'),
      num('About how many days does Earth take to travel once around the Sun?', 365, 1, 'days'),
      poll('Which planet would you most like to visit?', ['Saturn', 'Mars', 'Jupiter', 'Neptune']),
    ],
  },
  {
    slug: 'capitals', cover: 2, title: 'World Capitals',
    description: 'Capital cities from every continent. Some of them are not the biggest city in their country!',
    questions: [
      mc('What is the capital of France?', ['Lyon', 'Paris', 'Marseille', 'Nice'], 1),
      mc('What is the capital of Japan?', ['Osaka', 'Kyoto', 'Tokyo', 'Hiroshima'], 2),
      mc('What is the capital of Australia?', ['Sydney', 'Melbourne', 'Canberra', 'Perth'], 2, 20, 'double'),
      mc('What is the capital of Canada?', ['Toronto', 'Ottawa', 'Vancouver', 'Montreal'], 1),
      type('What is the capital of Italy?', ['Rome', 'Roma']),
      tf('New York is the capital of the United States.', false),
      mc('What is the capital of Brazil?', ['Rio de Janeiro', 'São Paulo', 'Brasília', 'Salvador'], 2),
      mc('What is the capital of Turkey?', ['Istanbul', 'Ankara', 'Izmir', 'Antalya'], 1),
      multi('Which of these are capital cities in Europe?', ['Madrid', 'Berlin', 'Lima', 'Nairobi'], [0, 1]),
      type('What is the capital of Egypt?', ['Cairo']),
      mc('What is the capital of Kyrgyzstan?', ['Osh', 'Bishkek', 'Karakol', 'Naryn'], 1),
    ],
  },
  {
    slug: 'animals', cover: 4, title: 'Amazing Animals',
    description: 'Fast, huge, strange and wonderful: how well do you know the animal kingdom?',
    questions: [
      mc('What is the largest animal that has ever lived?', ['African elephant', 'Blue whale', 'Giraffe', 'T. rex'], 1),
      tf('Bats are mammals.', true),
      num('How many legs does a spider have?', 8),
      mc('What is the fastest land animal?', ['Lion', 'Horse', 'Cheetah', 'Greyhound'], 2),
      multi('Which of these are birds?', ['Penguin', 'Ostrich', 'Bat', 'Dolphin'], [0, 1]),
      type('What is a baby kangaroo called?', ['Joey']),
      order('Put these animals in order from smallest to largest.', ['Ant', 'Mouse', 'Cat', 'Elephant']),
      mc('What do giant pandas eat most of the time?', ['Fish', 'Bamboo', 'Berries', 'Insects'], 1),
      tf('An octopus has three hearts.', true, 15),
      mc('Which animal can change the colour of its skin to blend in?', ['Chameleon', 'Rabbit', 'Camel', 'Owl'], 0),
      poll('Which animal is the coolest?', ['Octopus', 'Cheetah', 'Penguin', 'Blue whale']),
    ],
  },
  {
    slug: 'body', cover: 1, title: 'The Human Body',
    description: 'Bones, blood, organs and senses: a quiz about the most amazing machine you own.',
    questions: [
      num('How many bones are in an adult human body?', 206),
      mc('What is the largest organ of the human body?', ['Liver', 'Brain', 'Skin', 'Lungs'], 2),
      tf('The heart is a muscle.', true),
      mc('What carries oxygen around your body?', ['Red blood cells', 'White blood cells', 'Bones', 'Nerves'], 0),
      type('Which organ pumps blood around the body?', ['Heart', 'The heart']),
      multi('Which of these are human senses?', ['Sight', 'Hearing', 'Digestion', 'Smell'], [0, 1, 3]),
      mc('Which organs do you breathe with?', ['Kidneys', 'Lungs', 'Stomach', 'Liver'], 1),
      num('How many teeth does a full set of adult teeth have?', 32),
      tf('Your bones are alive and grow.', true),
      order('Put the journey of food in order.', ['Mouth', 'Food pipe (oesophagus)', 'Stomach', 'Small intestine']),
    ],
  },
  {
    slug: 'maths', cover: 0, title: 'Mental Maths Sprint',
    description: 'Times tables, percentages, fractions and primes. No calculators! Fast answers score the most.',
    questions: [
      num('7 × 8 = ?', 56, 0, '', 15),
      num('12 × 12 = ?', 144, 0, '', 15),
      num('100 − 37 = ?', 63, 0, '', 15),
      num('15 + 27 = ?', 42, 0, '', 15),
      num('What is half of 90?', 45, 0, '', 15),
      tf('0.5 is the same as one half.', true),
      mc('What is 25% of 80?', ['15', '20', '25', '40'], 1),
      order('Put these numbers in order from smallest to largest.', ['0.2', '1/4', '0.3', '1/2']),
      multi('Which of these are prime numbers?', ['2', '9', '11', '15'], [0, 2]),
      type('How many sides does a hexagon have?', ['6', 'six']),
      mc('Which is the biggest?', ['3/4', '2/3', '1/2', '5/8'], 0, 30, 'double'),
    ],
  },
  {
    slug: 'science', cover: 3, title: 'Science Around You',
    description: 'Water, air, magnets, gravity and light: the science you meet every day.',
    questions: [
      num('At sea level, water boils at how many degrees Celsius?', 100, 0, '°C'),
      tf('Sound travels faster than light.', false),
      mc('Which gas do plants take in from the air to make their food?', ['Oxygen', 'Carbon dioxide', 'Nitrogen', 'Helium'], 1),
      mc('Which force pulls things down towards the ground?', ['Magnetism', 'Friction', 'Gravity', 'Electricity'], 2),
      type('H₂O is the chemical formula for what?', ['Water']),
      multi('Which of these are states of matter?', ['Solid', 'Liquid', 'Gas', 'Sound'], [0, 1, 2]),
      mc('Which of these does a magnet attract?', ['An iron nail', 'A wooden spoon', 'A plastic cup', 'A glass marble'], 0),
      tf('Ice floats because it is less dense than liquid water.', true, 15),
      order('Put the water cycle in order.', ['Evaporation', 'Condensation', 'Precipitation', 'Collection']),
      mc('Where does almost all the energy for life on Earth come from?', ['The Moon', 'Volcanoes', 'The Sun', 'The wind'], 2),
    ],
  },
  {
    slug: 'geography', cover: 2, title: 'World Geography',
    description: 'Oceans, continents, deserts and mountains. Find out how well you know our planet.',
    questions: [
      mc('Which is the largest ocean on Earth?', ['Atlantic', 'Indian', 'Arctic', 'Pacific'], 3),
      num('How many continents are there?', 7),
      mc('Which is the highest mountain in the world?', ['K2', 'Mount Everest', 'Kilimanjaro', 'Mont Blanc'], 1),
      mc('Which is the largest hot desert in the world?', ['Gobi', 'Kalahari', 'Sahara', 'Atacama'], 2),
      tf('Australia is both a country and a continent.', true),
      mc('Which is the largest country by area?', ['Canada', 'China', 'USA', 'Russia'], 3),
      multi('Which of these countries are in Asia?', ['Kyrgyzstan', 'Japan', 'Kenya', 'Peru'], [0, 1]),
      type('On which continent is Egypt?', ['Africa']),
      order('Put these continents in order from largest to smallest.', ['Asia', 'Africa', 'North America', 'Europe']),
      mc('Which country has the most people?', ['India', 'USA', 'Indonesia', 'Brazil'], 0, 20, 'double'),
    ],
  },
  {
    slug: 'english', cover: 0, title: 'English Words',
    description: 'Plurals, opposites, spelling and parts of speech. A quick workout for your English.',
    questions: [
      type('What is the plural of "mouse"?', ['mice']),
      mc('What is the opposite of "ancient"?', ['Old', 'Modern', 'Broken', 'Famous'], 1),
      mc('Which of these words is a noun?', ['Quickly', 'Happiness', 'Run', 'Blue'], 1),
      tf('"Their", "there" and "they\'re" sound the same.', true),
      mc('What is the past tense of "go"?', ['Goed', 'Gone', 'Went', 'Going'], 2),
      multi('Which of these words are adjectives?', ['Bright', 'Slowly', 'Tall', 'Jump'], [0, 2]),
      mc('Which word means the same as "huge"?', ['Tiny', 'Enormous', 'Narrow', 'Quiet'], 1),
      order('Put these words in alphabetical order.', ['Can', 'Cap', 'Car', 'Cat']),
      num('How many letters are in the English alphabet?', 26),
      mc('Which word is spelled correctly?', ['Neccessary', 'Necesary', 'Necessary', 'Neccesary'], 2, 20, 'double'),
    ],
  },
  {
    slug: 'inventions', cover: 3, title: 'Inventions and History',
    description: 'From the wheel to the internet: the inventions and moments that changed the world.',
    questions: [
      mc('Who was granted the first patent for the telephone?', ['Thomas Edison', 'Alexander Graham Bell', 'Nikola Tesla', 'Isaac Newton'], 1),
      mc('Who made the first powered aeroplane flight, in 1903?', ['The Wright brothers', 'Amelia Earhart', 'Leonardo da Vinci', 'Charles Lindbergh'], 0),
      tf('The Great Wall is in China.', true),
      mc('Who built the first printing press with movable metal type in Europe?', ['Johannes Gutenberg', 'Galileo Galilei', 'William Shakespeare', 'Marie Curie'], 0),
      mc('In which country are the Pyramids of Giza?', ['Mexico', 'Greece', 'Egypt', 'India'], 2),
      order('Put these inventions in order, oldest first.', ['The wheel', 'The printing press', 'The telephone', 'The internet']),
      num('In which year did people first land on the Moon?', 1969),
      tf('The internet was invented before the telephone.', false),
      multi('Which of these were invented in the 1900s?', ['The aeroplane', 'Television', 'The telephone', 'The printing press'], [0, 1]),
      type('Which scientist is famous for the theory of relativity? (surname)', ['Einstein', 'Albert Einstein']),
    ],
  },
  {
    slug: 'sports', cover: 1, title: 'Sports and Games',
    description: 'Balls, rings, medals and chess pieces. A quiz for every kind of player.',
    questions: [
      num('How many players does a football (soccer) team have on the pitch?', 11),
      num('How many rings are on the Olympic flag?', 5),
      mc('Which sport uses a shuttlecock?', ['Tennis', 'Badminton', 'Squash', 'Table tennis'], 1),
      tf('A marathon is about 42 kilometres long.', true),
      mc('In chess, which piece moves in an L shape?', ['Bishop', 'Rook', 'Knight', 'Queen'], 2),
      order('Put the Olympic medals in order, best first.', ['Gold', 'Silver', 'Bronze']),
      type('Which sport is played at Wimbledon?', ['Tennis']),
      mc('How often are the Summer Olympic Games held?', ['Every year', 'Every 2 years', 'Every 4 years', 'Every 10 years'], 2),
      multi('Which of these sports are played with a ball?', ['Tennis', 'Swimming', 'Volleyball', 'Cycling'], [0, 2]),
      poll('Which sport do you like best?', ['Football', 'Basketball', 'Tennis', 'Swimming']),
    ],
  },
  {
    slug: 'kyrgyzstan', cover: 5, title: 'Kyrgyzstan: Land of Mountains',
    description: 'Lakes, peaks, horses and the epic of Manas. How well do you know Kyrgyzstan?',
    questions: [
      mc('What is the capital of Kyrgyzstan?', ['Osh', 'Bishkek', 'Talas', 'Naryn'], 1),
      type('What is the largest lake in Kyrgyzstan?', ['Issyk-Kul', 'Issyk Kul', 'Ysyk-Kol', 'Ysyk Kol', 'Issykkul']),
      mc('What is the currency of Kyrgyzstan?', ['Tenge', 'Som', 'Rouble', 'Lira'], 1),
      mc('What is the name of the great Kyrgyz national epic?', ['Manas', 'Shahnameh', 'Odyssey', 'Gilgamesh'], 0),
      tf('Kyrgyzstan has a coastline on the sea.', false),
      num('In which year did Kyrgyzstan become independent?', 1991),
      mc('Which is the highest mountain in Kyrgyzstan?', ['Lenin Peak', 'Jengish Chokusu (Victory Peak)', 'Khan Tengri', 'Mount Elbrus'], 1, 20, 'double'),
      mc('What does the circle in the middle of the Kyrgyz flag show?', ['A wheel', 'The top of a yurt (tunduk)', 'A shield', 'The Moon'], 1),
      mc('Which traditional game is played on horseback?', ['Kok-boru', 'Cricket', 'Bowling', 'Lacrosse'], 0),
      multi('Which of these countries share a border with Kyrgyzstan?', ['Kazakhstan', 'China', 'Mongolia', 'Russia'], [0, 1]),
    ],
  },
];

export const QUIZZES = [...BASE, ...MORE];
