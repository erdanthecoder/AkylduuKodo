// tools/quizzes2.mjs — 40 more official quizzes on popular school topics.
// Same format and checks as tools/quizzes.mjs. Facts chosen to be settled.

let n = 0;
const id = () => `r${++n}`;
const mc = (text, options, answer, time = 20, points = 'standard') => ({ id: id(), type: 'mc', text, options, answer, time, points });
const tf = (text, answer, time = 10) => ({ id: id(), type: 'tf', text, answer, time, points: 'standard' });
const multi = (text, options, answer, time = 30) => ({ id: id(), type: 'multi', text, options, answer, time, points: 'standard' });
const type = (text, answer, time = 30) => ({ id: id(), type: 'type', text, answer, time, points: 'standard' });
const order = (text, options, time = 30) => ({ id: id(), type: 'order', text, options, time, points: 'standard' });
const num = (text, answer, tolerance = 0, unit = '', time = 20) => ({ id: id(), type: 'number', text, answer, tolerance, unit, time, points: 'standard' });

const quiz = (slug, cover, title, description, questions) => ({ slug, cover, title, description, questions });

export const MORE = [
  // ------------------------------------------------------------- maths
  quiz('times-tables', 0, 'Times Tables Challenge', 'Quick multiplication from 2 to 12. How fast can you go?', [
    num('7 × 8 = ?', 56), num('6 × 9 = ?', 54), num('12 × 12 = ?', 144), num('4 × 7 = ?', 28),
    mc('Which equals 9 × 6?', ['54', '56', '45', '63'], 0), num('11 × 11 = ?', 121), num('8 × 8 = ?', 64),
    tf('3 × 13 = 39', true), num('5 × 12 = ?', 60), mc('Which is NOT a multiple of 7?', ['21', '35', '48', '63'], 2),
  ]),
  quiz('fractions', 0, 'Fractions and Decimals', 'Halves, quarters, tenths and percentages.', [
    mc('What is 1/2 as a decimal?', ['0.2', '0.5', '0.12', '1.2'], 1), mc('What is 3/4 as a percentage?', ['34%', '43%', '75%', '80%'], 2),
    tf('2/4 is the same as 1/2.', true), mc('Which fraction is the largest?', ['1/3', '1/4', '1/2', '1/5'], 2),
    num('What is 1/4 of 20?', 5), mc('What is 0.1 as a fraction?', ['1/10', '1/100', '1/1', '10/1'], 0),
    num('What is 50% of 80?', 40), tf('0.25 is bigger than 0.5.', false),
    order('Put these in order, smallest first.', ['0.1', '0.25', '0.5', '0.9']),
  ]),
  quiz('shapes', 0, 'Shapes and Angles', 'Triangles, polygons, angles and solid shapes.', [
    num('How many sides does a hexagon have?', 6), num('How many degrees are in a right angle?', 90, 0, '°'),
    num('The angles in a triangle add up to how many degrees?', 180, 0, '°'), mc('A shape with 8 sides is called…', ['A hexagon', 'An octagon', 'A pentagon', 'A decagon'], 1),
    tf('A square is a type of rectangle.', true), mc('How many faces does a cube have?', ['4', '6', '8', '12'], 1),
    mc('An angle smaller than 90° is called…', ['Obtuse', 'Reflex', 'Acute', 'Straight'], 2),
    multi('Which of these are 3D shapes?', ['Sphere', 'Circle', 'Cylinder', 'Triangle'], [0, 2]),
    num('How many degrees in a full turn?', 360, 0, '°'),
  ]),
  quiz('number-facts', 0, 'Number Puzzles', 'Primes, squares, Roman numerals and more.', [
    mc('Which of these is a prime number?', ['9', '15', '17', '21'], 2), num('What is the square root of 81?', 9),
    mc('What is XII in Roman numerals?', ['10', '12', '14', '21'], 1), num('What is 2 to the power of 5?', 32),
    tf('Zero is an even number.', true), mc('How many zeros are in one million?', ['5', '6', '7', '9'], 1),
    num('What is 15% of 200?', 30), mc('What comes next: 1, 1, 2, 3, 5, 8, …', ['11', '12', '13', '15'], 2),
    tf('Every prime number is odd.', false),
  ]),
  quiz('money-time', 0, 'Time and Measurement', 'Hours, minutes, metres, kilograms and litres.', [
    num('How many minutes are in an hour?', 60), num('How many centimetres are in a metre?', 100),
    num('How many hours are in a day?', 24), mc('How many days are in a leap year?', ['364', '365', '366', '367'], 2),
    num('How many grams are in a kilogram?', 1000), tf('There are 1000 millilitres in a litre.', true),
    mc('How many seconds are in 2 minutes?', ['100', '120', '200', '60'], 1), num('How many months have 31 days?', 7),
    num('How many weeks are in a year (to the nearest whole number)?', 52),
  ]),

  // ----------------------------------------------------------- science
  quiz('solar-energy', 5, 'Energy and Electricity', 'Circuits, power sources and how energy changes form.', [
    mc('Which of these is a renewable energy source?', ['Coal', 'Oil', 'Wind', 'Natural gas'], 2),
    tf('Electricity flows easily through copper.', true), mc('What does a battery store?', ['Light', 'Chemical energy', 'Sound', 'Heat only'], 1),
    multi('Which of these conduct electricity?', ['Copper', 'Rubber', 'Iron', 'Plastic'], [0, 2]),
    mc('What is the unit of power?', ['Volt', 'Watt', 'Metre', 'Newton'], 1), tf('Solar panels turn sunlight into electricity.', true),
    mc('A complete loop that electricity flows around is called a…', ['Circuit', 'Switch', 'Magnet', 'Fuse'], 0),
    mc('Which energy does a moving car have?', ['Kinetic', 'Nuclear', 'Elastic', 'Chemical only'], 0),
  ]),
  quiz('chemistry', 5, 'Elements and Matter', 'Atoms, the periodic table and the states of matter.', [
    mc('What is the chemical symbol for water?', ['O2', 'H2O', 'CO2', 'HO'], 1), mc('What is the symbol for gold?', ['Go', 'Gd', 'Au', 'Ag'], 2),
    multi('Which are states of matter?', ['Solid', 'Liquid', 'Gas', 'Colour'], [0, 1, 2]),
    num('At what temperature does water boil at sea level?', 100, 0, '°C'), num('At what temperature does water freeze?', 0, 0, '°C'),
    mc('Which gas do we need to breathe to live?', ['Nitrogen', 'Oxygen', 'Helium', 'Carbon dioxide'], 1),
    tf('Ice floats on water.', true),
    mc('Which element has the symbol Fe?', ['Fluorine', 'Iron', 'Lead', 'Fermium'], 1),
    mc('What is the lightest element?', ['Oxygen', 'Hydrogen', 'Helium', 'Carbon'], 1),
  ]),
  quiz('plants', 4, 'Plants and Photosynthesis', 'How plants grow, make food and spread seeds.', [
    mc('What do plants take in from the air to make food?', ['Oxygen', 'Carbon dioxide', 'Nitrogen', 'Helium'], 1),
    mc('What gives leaves their green colour?', ['Chlorophyll', 'Calcium', 'Glucose', 'Sap'], 0), tf('Plants give off oxygen.', true),
    mc('Which part of a plant takes in water from the soil?', ['Leaves', 'Flowers', 'Roots', 'Petals'], 2),
    mc('What do bees carry from flower to flower?', ['Seeds', 'Pollen', 'Sap', 'Water'], 1),
    multi('What does a plant need to grow well?', ['Light', 'Water', 'Air', 'Darkness only'], [0, 1, 2]),
    tf('A tomato is a fruit.', true), mc('What is the process of making food from sunlight called?', ['Respiration', 'Photosynthesis', 'Digestion', 'Evaporation'], 1),
  ]),
  quiz('weather', 5, 'Weather and Climate', 'Clouds, rain, storms and the water cycle.', [
    mc('What do we call water falling from clouds?', ['Evaporation', 'Precipitation', 'Condensation', 'Erosion'], 1),
    mc('What instrument measures temperature?', ['Barometer', 'Thermometer', 'Anemometer', 'Compass'], 1),
    tf('Lightning is hotter than the surface of the Sun.', true), mc('A huge spinning storm over warm oceans is a…', ['Hurricane', 'Drizzle', 'Fog', 'Breeze'], 0),
    order('Put the water cycle in order.', ['Evaporation', 'Condensation', 'Precipitation', 'Collection']),
    mc('What are fluffy white heaps of cloud called?', ['Cumulus', 'Stratus', 'Cirrus', 'Nimbus'], 0),
    tf('Snowflakes usually have six sides.', true), mc('What do we call the weather of a place over many years?', ['Climate', 'Forecast', 'Season', 'Temperature'], 0),
  ]),
  quiz('dinosaurs', 4, 'Dinosaurs', 'Giant reptiles that ruled the Earth for millions of years.', [
    mc('Which dinosaur had three horns on its face?', ['Stegosaurus', 'Triceratops', 'Velociraptor', 'Brachiosaurus'], 1),
    mc('What does "dinosaur" roughly mean?', ['Terrible lizard', 'Old bird', 'Big tooth', 'Fast runner'], 0),
    tf('Tyrannosaurus rex ate meat.', true), mc('Scientists who study fossils are called…', ['Astronomers', 'Palaeontologists', 'Botanists', 'Chemists'], 1),
    tf('Humans and dinosaurs like T. rex lived at the same time.', false),
    mc('Which animals alive today are descended from dinosaurs?', ['Frogs', 'Birds', 'Sharks', 'Cats'], 1),
    mc('Which dinosaur had plates along its back?', ['Stegosaurus', 'T. rex', 'Triceratops', 'Diplodocus'], 0),
    tf('Some dinosaurs had feathers.', true),
  ]),
  quiz('ocean', 4, 'Ocean Life', 'Whales, coral reefs and the deep blue sea.', [
    mc('What is the largest animal that has ever lived?', ['African elephant', 'Blue whale', 'Great white shark', 'Giant squid'], 1),
    num('How many arms does an octopus have?', 8), tf('A dolphin is a mammal.', true),
    mc('Which is the largest ocean?', ['Atlantic', 'Indian', 'Arctic', 'Pacific'], 3),
    mc('What do we call a group of fish swimming together?', ['A herd', 'A school', 'A pack', 'A flock'], 1),
    tf('Coral reefs are made by tiny animals.', true), mc('Which sea animal has no bones and stings?', ['Jellyfish', 'Turtle', 'Seal', 'Crab'], 0),
    mc('About how much of Earth\'s surface is covered by oceans?', ['About 30%', 'About 50%', 'About 70%', 'About 90%'], 2),
  ]),
  quiz('insects', 4, 'Bugs and Insects', 'Six legs, wings and amazing tiny creatures.', [
    num('How many legs does an insect have?', 6), tf('A spider is an insect.', false),
    mc('A caterpillar turns into a…', ['Beetle', 'Butterfly', 'Spider', 'Ant'], 1), mc('Which insect makes honey?', ['Wasp', 'Bee', 'Fly', 'Ant'], 1),
    num('How many body parts does an insect have?', 3), mc('Which insect lights up at night?', ['Firefly', 'Ladybird', 'Moth', 'Grasshopper'], 0),
    tf('Ants live in groups called colonies.', true),
    order('Put a butterfly\'s life in order.', ['Egg', 'Caterpillar', 'Chrysalis', 'Butterfly']),
  ]),
  quiz('senses', 3, 'Health and the Five Senses', 'Seeing, hearing, eating well and staying healthy.', [
    num('How many senses do people usually learn about?', 5), mc('Which organ do we use to smell?', ['Ear', 'Nose', 'Tongue', 'Skin'], 1),
    tf('Drinking water helps your body work well.', true), mc('Which food group gives us the most protein?', ['Sweets', 'Beans and meat', 'Butter', 'Juice'], 1),
    mc('How many hours of sleep do most children need?', ['3–4', '5–6', '9–12', '15–18'], 2), tf('Washing your hands helps stop germs spreading.', true),
    mc('Which vitamin do we get from sunlight?', ['Vitamin A', 'Vitamin C', 'Vitamin D', 'Vitamin K'], 2),
    multi('Which are good for your teeth?', ['Brushing twice a day', 'Lots of sweets', 'Visiting the dentist', 'Drinking water'], [0, 2, 3]),
  ]),
  quiz('physics', 5, 'Forces and Motion', 'Gravity, friction, magnets and speed.', [
    mc('What force pulls things down towards Earth?', ['Friction', 'Gravity', 'Magnetism', 'Air'], 1),
    mc('What force slows a sliding object down?', ['Friction', 'Gravity', 'Lift', 'Thrust'], 0), tf('Magnets attract iron.', true),
    mc('Who is famous for describing gravity after (the story goes) seeing an apple fall?', ['Albert Einstein', 'Isaac Newton', 'Galileo', 'Marie Curie'], 1),
    tf('Sound travels faster than light.', false), mc('What is the unit of force?', ['Newton', 'Joule', 'Watt', 'Kilogram'], 0),
    mc('Two north poles of magnets will…', ['Attract', 'Repel', 'Melt', 'Do nothing'], 1), tf('Sound cannot travel through empty space.', true),
  ]),
  quiz('earth', 5, 'Our Planet Earth', 'Volcanoes, earthquakes, layers and rocks.', [
    mc('What is the centre of the Earth called?', ['Crust', 'Mantle', 'Core', 'Shell'], 2),
    mc('Hot melted rock coming out of a volcano is called…', ['Lava', 'Granite', 'Sand', 'Clay'], 0), tf('Earthquakes happen when parts of the Earth\'s crust move.', true),
    mc('What is the tallest mountain above sea level?', ['K2', 'Mount Everest', 'Kilimanjaro', 'Mont Blanc'], 1),
    num('How many continents are there?', 7), mc('Which is the largest continent?', ['Africa', 'Europe', 'Asia', 'Antarctica'], 2),
    tf('The Earth is round, a little wider at the equator.', true), mc('What kind of rock is formed from cooled lava?', ['Igneous', 'Sedimentary', 'Metamorphic', 'Plastic'], 0),
  ]),

  // --------------------------------------------------------- geography
  quiz('flags', 2, 'Flags of the World', 'Can you match the flag to the country?', [
    mc('Which country\'s flag has a red maple leaf?', ['USA', 'Canada', 'Japan', 'Peru'], 1),
    mc('Which country\'s flag is a red circle on white?', ['China', 'Japan', 'South Korea', 'Vietnam'], 1),
    mc('Which country\'s flag is red with a yellow sun of 40 rays and a yurt roof (tunduk) in the middle?', ['Kazakhstan', 'Kyrgyzstan', 'Mongolia', 'Turkey'], 1),
    mc('Which country\'s flag has 50 stars?', ['Australia', 'USA', 'Brazil', 'Chile'], 1),
    mc('What colour is the cross on the flag of Switzerland?', ['Red', 'White', 'Blue', 'Yellow'], 1),
    mc('Which country\'s flag has a crescent moon and star in white on red?', ['Turkey', 'Italy', 'Spain', 'Mexico'], 0),
    tf('The flag of Italy is green, white and red.', true), mc('Which country\'s flag is called the "Union Jack"?', ['Ireland', 'United Kingdom', 'New Zealand', 'Canada'], 1),
  ]),
  quiz('rivers-mountains', 2, 'Rivers, Lakes and Mountains', 'The longest, tallest and deepest places on Earth.', [
    mc('Which is often called the longest river in the world?', ['Amazon', 'Nile', 'Yangtze', 'Mississippi'], 1),
    mc('What is the deepest lake in the world?', ['Lake Baikal', 'Lake Victoria', 'Issyk-Kul', 'Lake Superior'], 0),
    mc('In which mountain range is Mount Everest?', ['Alps', 'Andes', 'Himalayas', 'Rockies'], 2), mc('Which river flows through Paris?', ['Thames', 'Seine', 'Danube', 'Rhine'], 1),
    mc('Which is the largest desert that is hot?', ['Gobi', 'Sahara', 'Kalahari', 'Atacama'], 1), tf('The Andes are in South America.', true),
    mc('Which river flows through London?', ['Thames', 'Seine', 'Volga', 'Tiber'], 0), mc('Which is the largest rainforest?', ['Congo', 'Amazon', 'Borneo', 'Daintree'], 1),
  ]),
  quiz('asia', 2, 'Countries of Asia', 'The biggest continent, from Turkey to Japan.', [
    mc('What is the capital of China?', ['Shanghai', 'Beijing', 'Hong Kong', 'Shenzhen'], 1), mc('What is the capital of Kazakhstan?', ['Almaty', 'Astana', 'Shymkent', 'Aktau'], 1),
    mc('What is the capital of Uzbekistan?', ['Samarkand', 'Bukhara', 'Tashkent', 'Khiva'], 2), mc('What is the capital of India?', ['Mumbai', 'New Delhi', 'Kolkata', 'Chennai'], 1),
    mc('Which country has the most people in Asia (and the world)?', ['India', 'Indonesia', 'Japan', 'Russia'], 0), mc('What is the capital of South Korea?', ['Busan', 'Seoul', 'Incheon', 'Daegu'], 1),
    mc('What is the capital of Tajikistan?', ['Dushanbe', 'Khujand', 'Bishkek', 'Osh'], 0), tf('Japan is made up of islands.', true),
  ]),
  quiz('europe', 2, 'Countries of Europe', 'Capitals, languages and famous places in Europe.', [
    mc('What is the capital of Germany?', ['Munich', 'Berlin', 'Hamburg', 'Frankfurt'], 1), mc('What is the capital of Spain?', ['Barcelona', 'Madrid', 'Seville', 'Valencia'], 1),
    mc('In which city is the Eiffel Tower?', ['London', 'Paris', 'Rome', 'Vienna'], 1), mc('What is the capital of Italy?', ['Milan', 'Venice', 'Rome', 'Naples'], 2),
    mc('Which language is spoken in Portugal?', ['Spanish', 'Portuguese', 'Italian', 'French'], 1), mc('What is the capital of Turkey?', ['Istanbul', 'Ankara', 'Izmir', 'Antalya'], 1),
    tf('Iceland is in Europe.', true), mc('What is the capital of the United Kingdom?', ['Manchester', 'Edinburgh', 'London', 'Cardiff'], 2),
  ]),
  quiz('americas', 2, 'The Americas', 'North and South America, from Canada to Chile.', [
    mc('What is the capital of the USA?', ['New York', 'Washington, D.C.', 'Los Angeles', 'Chicago'], 1), mc('What is the capital of Canada?', ['Toronto', 'Vancouver', 'Ottawa', 'Montreal'], 2),
    mc('Which language is mostly spoken in Brazil?', ['Spanish', 'Portuguese', 'English', 'French'], 1), mc('What is the capital of Mexico?', ['Cancún', 'Mexico City', 'Guadalajara', 'Tijuana'], 1),
    mc('What is the capital of Argentina?', ['Buenos Aires', 'Lima', 'Santiago', 'Bogotá'], 0), tf('The Amazon River is in South America.', true),
    mc('Which canal connects the Atlantic and Pacific Oceans?', ['Suez Canal', 'Panama Canal', 'Kiel Canal', 'Corinth Canal'], 1),
    mc('Machu Picchu is in which country?', ['Peru', 'Chile', 'Bolivia', 'Ecuador'], 0),
  ]),
  quiz('africa', 2, 'Amazing Africa', 'Countries, animals and wonders of Africa.', [
    mc('What is the capital of Egypt?', ['Cairo', 'Alexandria', 'Luxor', 'Giza'], 0), mc('What is the highest mountain in Africa?', ['Mount Kenya', 'Kilimanjaro', 'Atlas', 'Table Mountain'], 1),
    mc('Which desert covers much of North Africa?', ['Sahara', 'Gobi', 'Kalahari', 'Namib'], 0), mc('What is the capital of Kenya?', ['Mombasa', 'Nairobi', 'Kisumu', 'Nakuru'], 1),
    tf('The pyramids of Giza are in Egypt.', true), mc('Which is the most populous country in Africa?', ['Egypt', 'Nigeria', 'Ethiopia', 'South Africa'], 1),
    num('About how many countries are in Africa?', 54, 2), mc('Victoria Falls is on which river?', ['Nile', 'Congo', 'Zambezi', 'Niger'], 2),
  ]),
  quiz('central-asia', 3, 'Central Asia', 'Kyrgyzstan and its neighbours: mountains, steppes and the Silk Road.', [
    mc('What is the capital of Kyrgyzstan?', ['Osh', 'Bishkek', 'Karakol', 'Naryn'], 1), mc('Which ancient trade route crossed Central Asia?', ['Silk Road', 'Spice Route', 'Amber Road', 'Tea Path'], 0),
    mc('Samarkand is in which country?', ['Kazakhstan', 'Uzbekistan', 'Turkmenistan', 'Kyrgyzstan'], 1), mc('Which is the largest country in Central Asia by area?', ['Kazakhstan', 'Uzbekistan', 'Kyrgyzstan', 'Tajikistan'], 0),
    tf('Kyrgyzstan has no coastline on the sea.', true), mc('What is the currency of Kyrgyzstan?', ['Tenge', 'Som', 'Somoni', 'Manat'], 1),
    mc('Which mountain range covers much of Kyrgyzstan?', ['Tian Shan', 'Alps', 'Urals', 'Atlas'], 0), mc('What is the capital of Turkmenistan?', ['Ashgabat', 'Mary', 'Dashoguz', 'Turkmenbashi'], 0),
  ]),

  // ----------------------------------------------------------- history
  quiz('ancient-egypt', 1, 'Ancient Egypt', 'Pharaohs, pyramids, mummies and hieroglyphs.', [
    mc('What were the kings of ancient Egypt called?', ['Emperors', 'Pharaohs', 'Sultans', 'Tsars'], 1), mc('Ancient Egyptian picture writing is called…', ['Hieroglyphs', 'Runes', 'Cuneiform', 'Braille'], 0),
    tf('The Great Pyramid of Giza was built as a tomb.', true), mc('Which river was ancient Egypt built along?', ['Tigris', 'Nile', 'Euphrates', 'Indus'], 1),
    mc('Which young pharaoh\'s tomb was found almost untouched in 1922?', ['Ramesses II', 'Tutankhamun', 'Cleopatra', 'Khufu'], 1),
    mc('What did Egyptians make paper from?', ['Papyrus', 'Bamboo', 'Silk', 'Leather'], 0), tf('The Sphinx has the body of a lion.', true),
  ]),
  quiz('ancient-rome-greece', 1, 'Rome and Greece', 'Gods, gladiators, the Olympics and empires.', [
    mc('Where did the Olympic Games begin?', ['Rome', 'Ancient Greece', 'Egypt', 'China'], 1), mc('What was the huge arena in Rome where gladiators fought?', ['Parthenon', 'Colosseum', 'Pantheon', 'Acropolis'], 1),
    mc('Who was king of the Greek gods?', ['Zeus', 'Mars', 'Apollo', 'Poseidon'], 0), tf('Latin was the language of ancient Rome.', true),
    mc('What is the temple on the Acropolis in Athens?', ['Colosseum', 'Parthenon', 'Forum', 'Circus Maximus'], 1),
    mc('Who was the first emperor of Rome?', ['Julius Caesar', 'Augustus', 'Nero', 'Romulus'], 1), tf('Greek democracy began in Athens.', true),
  ]),
  quiz('explorers', 1, 'Great Explorers', 'Journeys across oceans, mountains and to the poles.', [
    mc('Who sailed to the Americas in 1492?', ['Christopher Columbus', 'Marco Polo', 'James Cook', 'Vasco da Gama'], 0),
    mc('Which traveller wrote about his journey to China along the Silk Road?', ['Marco Polo', 'Magellan', 'Amundsen', 'Drake'], 0),
    mc('Who led the first team to reach the South Pole?', ['Roald Amundsen', 'Robert Scott', 'Edmund Hillary', 'Neil Armstrong'], 0),
    mc('Which two climbers first reached the top of Everest in 1953?', ['Hillary and Tenzing', 'Mallory and Irvine', 'Scott and Oates', 'Lewis and Clark'], 0),
    tf('Ferdinand Magellan\'s expedition was the first to sail all the way around the world.', true),
    mc('Who was the first person to travel into space?', ['Neil Armstrong', 'Yuri Gagarin', 'John Glenn', 'Alan Shepard'], 1),
    num('In which year did people first walk on the Moon?', 1969),
  ]),
  quiz('famous-scientists', 1, 'Famous Scientists', 'The people behind big discoveries.', [
    mc('Who came up with the theory of relativity?', ['Isaac Newton', 'Albert Einstein', 'Nikola Tesla', 'Galileo'], 1),
    mc('Who was the first person to win two Nobel Prizes?', ['Marie Curie', 'Ada Lovelace', 'Rosalind Franklin', 'Jane Goodall'], 0),
    mc('Who wrote about evolution and natural selection?', ['Charles Darwin', 'Louis Pasteur', 'Gregor Mendel', 'Alexander Fleming'], 0),
    mc('Who discovered penicillin?', ['Alexander Fleming', 'Edward Jenner', 'Robert Koch', 'Joseph Lister'], 0),
    mc('Who is often called the first computer programmer?', ['Ada Lovelace', 'Grace Hopper', 'Alan Turing', 'Charles Babbage'], 0),
    mc('Galileo used which tool to study the planets?', ['Microscope', 'Telescope', 'Compass', 'Thermometer'], 1),
    tf('Thomas Edison is famous for work on the light bulb.', true),
  ]),
  quiz('wonders', 1, 'Wonders of the World', 'Famous buildings and places everyone should know.', [
    mc('In which country is the Great Wall?', ['Japan', 'China', 'India', 'Mongolia'], 1), mc('The Taj Mahal is in which country?', ['India', 'Pakistan', 'Iran', 'Nepal'], 0),
    mc('In which city is the Statue of Liberty?', ['Washington', 'New York', 'Boston', 'Chicago'], 1), mc('Petra, the city carved in rock, is in…', ['Jordan', 'Egypt', 'Greece', 'Turkey'], 0),
    mc('Christ the Redeemer stands over which city?', ['Rio de Janeiro', 'Lima', 'Buenos Aires', 'Mexico City'], 0), tf('Big Ben is in London.', true),
    mc('The Leaning Tower is in which Italian city?', ['Pisa', 'Rome', 'Florence', 'Milan'], 0), mc('Angkor Wat is in which country?', ['Thailand', 'Cambodia', 'Laos', 'Vietnam'], 1),
  ]),

  // ----------------------------------------------------------- language
  quiz('grammar', 3, 'Grammar Detective', 'Nouns, verbs, adjectives and punctuation.', [
    mc('Which word is a noun?', ['Run', 'Happy', 'Table', 'Quickly'], 2), mc('Which word is a verb?', ['Jump', 'Blue', 'Chair', 'Soft'], 0),
    mc('Which word is an adjective?', ['Sing', 'Bright', 'Dog', 'Slowly'], 1), mc('Which word is an adverb?', ['Quickly', 'Quick', 'Quickness', 'Quicken'], 0),
    mc('What goes at the end of a question?', ['.', '!', '?', ','], 2), tf('"They\'re" is short for "they are".', true),
    mc('What is the plural of "child"?', ['Childs', 'Children', 'Childes', 'Childrens'], 1), mc('What is the past tense of "go"?', ['Goed', 'Gone', 'Went', 'Going'], 2),
  ]),
  quiz('spelling', 3, 'Spelling Bee', 'Tricky words that catch everyone out.', [
    mc('Which is spelled correctly?', ['Becuase', 'Because', 'Becauze', 'Beacause'], 1), mc('Which is spelled correctly?', ['Freind', 'Friend', 'Frend', 'Friind'], 1),
    mc('Which is spelled correctly?', ['Necessary', 'Neccessary', 'Necesary', 'Neccesary'], 0), mc('Which is spelled correctly?', ['Beautiful', 'Beutiful', 'Beautifull', 'Beatiful'], 0),
    mc('Which is spelled correctly?', ['Wensday', 'Wednesday', 'Wedensday', 'Wendsday'], 1), mc('Which is spelled correctly?', ['Separate', 'Seperate', 'Separete', 'Seprate'], 0),
    type('Spell the number 12 in words.', ['twelve']), mc('Which is spelled correctly?', ['Calender', 'Calendar', 'Calandar', 'Calendur'], 1),
  ]),
  quiz('opposites', 3, 'Opposites and Synonyms', 'Words that mean the same, and words that mean the opposite.', [
    mc('What is the opposite of "hot"?', ['Warm', 'Cold', 'Wet', 'Dry'], 1), mc('What is the opposite of "ancient"?', ['Old', 'Modern', 'Huge', 'Quiet'], 1),
    mc('Which word means the same as "happy"?', ['Joyful', 'Angry', 'Tired', 'Grumpy'], 0), mc('Which word means the same as "big"?', ['Tiny', 'Large', 'Thin', 'Short'], 1),
    mc('What is the opposite of "brave"?', ['Bold', 'Cowardly', 'Strong', 'Kind'], 1), mc('Which word means the same as "fast"?', ['Slow', 'Rapid', 'Heavy', 'Late'], 1),
    mc('What is the opposite of "generous"?', ['Kind', 'Selfish', 'Giving', 'Rich'], 1), tf('"Begin" and "start" mean the same thing.', true),
  ]),
  quiz('books', 3, 'Famous Stories', 'Characters and authors from much-loved books and tales.', [
    mc('Who wrote "Romeo and Juliet"?', ['Charles Dickens', 'William Shakespeare', 'Jane Austen', 'Mark Twain'], 1),
    mc('In the fairy tale, who climbs a beanstalk?', ['Jack', 'Hansel', 'Peter', 'Aladdin'], 0), mc('Who lost a glass slipper at the ball?', ['Snow White', 'Cinderella', 'Rapunzel', 'Belle'], 1),
    mc('In "The Jungle Book", what kind of animal is Baloo?', ['Tiger', 'Bear', 'Panther', 'Wolf'], 1), mc('What is the name of the long Kyrgyz epic poem about a hero?', ['Manas', 'Odyssey', 'Beowulf', 'Iliad'], 0),
    mc('Who wrote "Alice\'s Adventures in Wonderland"?', ['Lewis Carroll', 'Roald Dahl', 'C. S. Lewis', 'J. M. Barrie'], 0),
    mc('Who is the boy who never grows up?', ['Peter Pan', 'Pinocchio', 'Oliver Twist', 'Tom Sawyer'], 0), tf('Chingiz Aitmatov was a famous writer from Kyrgyzstan.', true),
  ]),
  quiz('languages', 3, 'Languages of the World', 'Hello, thank you and the languages people speak.', [
    mc('"Hola" means hello in which language?', ['French', 'Spanish', 'Italian', 'German'], 1), mc('"Bonjour" means hello in which language?', ['French', 'Portuguese', 'Dutch', 'Spanish'], 0),
    mc('Which language has the most native speakers?', ['English', 'Mandarin Chinese', 'Spanish', 'Hindi'], 1), mc('"Rakhmat" means "thank you" in which language?', ['Kyrgyz', 'Japanese', 'Arabic', 'Swedish'], 0),
    mc('"Danke" means thank you in…', ['German', 'Russian', 'Polish', 'Greek'], 0), tf('Kyrgyz and Russian are both official languages of Kyrgyzstan.', true),
    mc('Which alphabet does Russian use?', ['Latin', 'Cyrillic', 'Arabic', 'Greek'], 1), mc('"Arigato" means thank you in…', ['Chinese', 'Korean', 'Japanese', 'Thai'], 2),
  ]),

  // ------------------------------------------------- arts, tech, fun
  quiz('music', 1, 'Music Maestro', 'Instruments, notes and famous composers.', [
    num('How many keys does a standard piano have?', 88), mc('Which instrument has 6 strings, usually?', ['Violin', 'Guitar', 'Harp', 'Cello'], 1),
    mc('Which composer wrote music even after losing his hearing?', ['Mozart', 'Beethoven', 'Bach', 'Chopin'], 1), mc('Which family is the trumpet in?', ['Strings', 'Brass', 'Woodwind', 'Percussion'], 1),
    mc('What is the Kyrgyz three-stringed instrument called?', ['Komuz', 'Sitar', 'Balalaika', 'Ukulele'], 0), tf('A drum is a percussion instrument.', true),
    num('How many lines are on a music staff?', 5), mc('Which instrument is the biggest in the string family?', ['Viola', 'Violin', 'Double bass', 'Cello'], 2),
  ]),
  quiz('art', 1, 'Art and Colours', 'Primary colours, famous paintings and artists.', [
    multi('Which are the three primary colours (for paint)?', ['Red', 'Yellow', 'Blue', 'Green'], [0, 1, 2]), mc('What do you get by mixing blue and yellow?', ['Purple', 'Green', 'Orange', 'Brown'], 1),
    mc('Who painted the Mona Lisa?', ['Leonardo da Vinci', 'Pablo Picasso', 'Vincent van Gogh', 'Michelangelo'], 0), mc('Who painted "The Starry Night"?', ['Monet', 'Van Gogh', 'Rembrandt', 'Dalí'], 1),
    mc('What do you get by mixing red and white?', ['Pink', 'Purple', 'Orange', 'Grey'], 0), tf('Michelangelo painted the ceiling of the Sistine Chapel.', true),
    num('How many colours are in a rainbow?', 7), mc('What do you get by mixing red and yellow?', ['Green', 'Orange', 'Brown', 'Purple'], 1),
  ]),
  quiz('computers', 5, 'Computers and Coding', 'Bits, bytes, the internet and how code works.', [
    mc('What does "CPU" stand for?', ['Central Processing Unit', 'Computer Power Unit', 'Core Program Utility', 'Central Print Unit'], 0),
    num('How many bits are in a byte?', 8), mc('Which is a programming language?', ['Python', 'Cobra Mail', 'Bluetooth', 'Pixel'], 0),
    tf('A strong password should be long and hard to guess.', true), mc('What does "www" stand for?', ['World Wide Web', 'Wide World Window', 'Web Wire World', 'World Web Wide'], 0),
    mc('In code, a set of steps that repeats is called a…', ['Loop', 'Bug', 'Pixel', 'Virus'], 0), mc('A mistake in a program is called a…', ['Bug', 'Byte', 'Cookie', 'Mouse'], 0),
    tf('You should never share your password, even with friends.', true),
  ]),
  quiz('online-safety', 5, 'Staying Safe Online', 'Smart choices on the internet.', [
    tf('It is safe to share your home address with people you meet online.', false), tf('If something online makes you upset, tell a trusted adult.', true),
    mc('What should you do with a message from a stranger asking to meet?', ['Meet them', 'Tell a trusted adult', 'Reply with your address', 'Keep it secret'], 1),
    mc('Which is the strongest password?', ['123456', 'password', 'Blue!Tiger7Mountain', 'myname'], 2), tf('Everything you read online is true.', false),
    mc('What is "phishing"?', ['A fishing game', 'Tricking people into giving private information', 'A type of computer', 'A safe website'], 1),
    tf('Being kind online is just as important as being kind in person.', true),
  ]),
  quiz('food', 4, 'Food Around the World', 'Famous dishes and where they come from.', [
    mc('Sushi comes from which country?', ['China', 'Japan', 'Thailand', 'Korea'], 1), mc('Pizza comes from which country?', ['Italy', 'France', 'Greece', 'Spain'], 0),
    mc('Beshbarmak is a famous dish in Kyrgyzstan and Kazakhstan. What is its main meat often?', ['Fish', 'Horse or lamb', 'Chicken', 'None'], 1),
    mc('Tacos come from…', ['Mexico', 'Peru', 'Spain', 'Chile'], 0), mc('What is the main ingredient in guacamole?', ['Avocado', 'Tomato', 'Cucumber', 'Pea'], 0),
    mc('Croissants are famous in…', ['Germany', 'France', 'Russia', 'Turkey'], 1), mc('Plov, a rice dish, is popular in…', ['Central Asia', 'Scandinavia', 'Australia', 'Canada'], 0),
    tf('Chocolate is made from cacao beans.', true),
  ]),
  quiz('olympics', 1, 'The Olympic Games', 'Rings, medals and sports from the Olympics.', [
    num('How many rings are on the Olympic flag?', 5), mc('How often are the Summer Olympics usually held?', ['Every year', 'Every 2 years', 'Every 4 years', 'Every 10 years'], 2),
    mc('What is given for first place?', ['Silver medal', 'Gold medal', 'Bronze medal', 'Trophy'], 1), multi('Which of these are Winter Olympic sports?', ['Skiing', 'Ice hockey', 'Swimming', 'Curling'], [0, 1, 3]),
    mc('Which runner is famous for world records in the 100 m?', ['Usain Bolt', 'Michael Phelps', 'Simone Biles', 'Serena Williams'], 0),
    mc('Michael Phelps won most of his medals in…', ['Running', 'Swimming', 'Cycling', 'Boxing'], 1), tf('Wrestling is an Olympic sport.', true),
  ]),
  quiz('football', 1, 'Football Fever', 'The world\'s most popular sport.', [
    num('How many players does each team have on the pitch?', 11), mc('How long is a normal football match?', ['60 minutes', '80 minutes', '90 minutes', '120 minutes'], 2),
    mc('Which country has won the most World Cups?', ['Germany', 'Brazil', 'Italy', 'Argentina'], 1), tf('Only the goalkeeper may handle the ball in their own penalty area.', true),
    mc('What card sends a player off the pitch?', ['Yellow', 'Red', 'Green', 'Blue'], 1), num('How often is the FIFA World Cup held (in years)?', 4),
    mc('What is it called when a player scores three goals in one match?', ['Hat-trick', 'Triple kick', 'Treble shot', 'Goal storm'], 0),
  ]),
  quiz('riddles', 0, 'Riddles and Brain Teasers', 'Think twice before you answer!', [
    mc('What has hands but cannot clap?', ['A clock', 'A tree', 'A river', 'A shoe'], 0), mc('What has to be broken before you can use it?', ['An egg', 'A chair', 'A cup', 'A book'], 0),
    mc('What gets wetter the more it dries?', ['A towel', 'Rain', 'A sponge cake', 'The sun'], 0), num('A farmer has 17 sheep. All but 9 run away. How many are left?', 9),
    mc('What has keys but cannot open locks?', ['A piano', 'A door', 'A car', 'A box'], 0), num('How many months have 28 days?', 12),
    mc('What can you catch but not throw?', ['A cold', 'A ball', 'A fish', 'A bus'], 0), tf('If you have it, you want to share it; if you share it, you don\'t have it. The answer is a secret.', true),
  ]),
  quiz('general-knowledge', 3, 'General Knowledge Mix', 'A bit of everything. Perfect to start a class!', [
    num('How many days are in a week?', 7), mc('What colour do you get by mixing blue and red?', ['Green', 'Purple', 'Orange', 'Yellow'], 1),
    mc('Which animal is known as the "king of the jungle"?', ['Tiger', 'Lion', 'Elephant', 'Gorilla'], 1), mc('Which planet do we live on?', ['Mars', 'Earth', 'Venus', 'Jupiter'], 1),
    mc('What is frozen water called?', ['Steam', 'Ice', 'Fog', 'Dew'], 1), tf('A year has 12 months.', true),
    mc('Which is the fastest land animal?', ['Cheetah', 'Horse', 'Lion', 'Greyhound'], 0), mc('What do bees make?', ['Milk', 'Honey', 'Silk', 'Wax only'], 1),
    num('How many letters are in the English alphabet?', 26),
  ]),
  quiz('kyrgyz-culture', 3, 'Kyrgyz Culture and Traditions', 'Yurts, the kalpak, Nooruz, the World Nomad Games and more.', [
    mc('What is the traditional felt hat worn by Kyrgyz men?', ['Kalpak', 'Fez', 'Beret', 'Sombrero'], 0), mc('What is the traditional round tent home of Kyrgyz nomads?', ['Igloo', 'Yurt', 'Tipi', 'Cabin'], 1),
    mc('Which spring holiday celebrates the new year on 21 March?', ['Nooruz', 'Diwali', 'Hanukkah', 'Carnival'], 0), mc('Which international games celebrating nomad sports started in Kyrgyzstan?', ['World Nomad Games', 'Asian Games', 'Silk Games', 'Steppe Cup'], 0),
    mc('What is the Kyrgyz word for the hero epic that is one of the longest in the world?', ['Manas', 'Alpamysh', 'Shahnameh', 'Gesar'], 0), mc('Kymyz is a drink made from…', ['Mare\'s milk', 'Apples', 'Tea leaves', 'Honey'], 0),
    mc('Shyrdak is a traditional…', ['Felt carpet', 'Song', 'Dance', 'Horse race'], 0), tf('Eagle hunting (burkutchu) is a Kyrgyz tradition.', true),
  ]),
];
