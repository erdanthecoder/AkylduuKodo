export default {
  id: 'c8',
  title: 'Working with text',
  blurb: 'std::string in depth: searching, slicing, converting and formatting.',
  pages: [
    {
      id: 'c8p1',
      title: 'Building strings',
      lede: 'Create, join and grow.',
      body: 'A `std::string` can be built from a literal, from a repeated character, or from part of another string. `+` and `+=` join them.\n\nJoining with `+` inside a loop copies repeatedly. For a long build-up, use `+=`, which appends in place.',
      code: `#include <iostream>
#include <string>

int main() {
    std::string a = "Kyrgyz";
    std::string b(3, '!');           // "!!!"
    std::string c = a + "stan" + b;
    c += " 2026";
    std::cout << c << "\\n";
    return 0;
}`,
      output: 'Kyrgyzstan!!! 2026',
      points: [
        'string(n, ch) repeats a character n times.',
        '+ joins; += appends without a fresh copy.',
        'Prefer += inside loops.',
      ],
    },
    {
      id: 'c8p2',
      title: 'Length and characters',
      lede: 'size(), [] and the loop over every letter.',
      body: '`.size()` and `.length()` are the same function with two names. `[i]` gives one character, and `.empty()` tests for nothing at all.\n\nBe careful: `size()` returns an **unsigned** type, so `s.size() - 1` on an empty string is an enormous number, not `-1`.',
      code: `#include <iostream>
#include <string>

int main() {
    std::string s = "Bishkek";
    std::cout << s.size() << "\\n";
    for (char c : s) std::cout << char(std::toupper(c));
    std::cout << "\\n" << (s.empty() ? "empty" : "has text") << "\\n";
    return 0;
}`,
      output: '7\nBISHKEK\nhas text',
      points: [
        'size() and length() are identical.',
        'size() is unsigned — subtracting can wrap around.',
        'range-for walks the characters.',
      ],
    },
    {
      id: 'c8p3',
      title: 'Finding text',
      lede: 'find returns a position, or npos when it fails.',
      body: '`.find(text)` returns the index of the first match, or the special value `std::string::npos` if there is none. Always compare against `npos` rather than testing for a negative number.\n\n`rfind` searches backwards, and passing a start position lets you find every occurrence in a loop.',
      code: `#include <iostream>
#include <string>

int main() {
    std::string s = "the road to the mountain";
    std::cout << s.find("road") << "\\n";
    if (s.find("sea") == std::string::npos) std::cout << "no sea\\n";

    for (size_t p = s.find("the"); p != std::string::npos; p = s.find("the", p + 1))
        std::cout << "the at " << p << "\\n";
    return 0;
}`,
      output: 'the at 0\nthe at 12',
      points: [
        'find gives an index, or std::string::npos.',
        'npos is a huge unsigned value, never -1.',
        'Pass a start position to find the next one.',
      ],
    },
    {
      id: 'c8p4',
      title: 'Slicing with substr',
      lede: 'A copy of part of a string.',
      body: '`s.substr(start)` gives everything from `start` onwards. `s.substr(start, count)` takes `count` characters — note the second argument is a **length**, not an end index.\n\nCombine it with `find` to split text at a separator.',
      code: `#include <iostream>
#include <string>

int main() {
    std::string full = "Aisuluu Turatbekova";
    size_t space = full.find(' ');
    std::string first = full.substr(0, space);
    std::string last = full.substr(space + 1);
    std::cout << last << ", " << first << "\\n";
    return 0;
}`,
      output: 'Turatbekova, Aisuluu',
      points: [
        'substr(start, count) — the second value is a length.',
        'Omit the length to take the rest.',
        'find + substr is the usual way to split.',
      ],
    },
    {
      id: 'c8p5',
      title: 'Changing a string',
      lede: 'insert, erase, replace and clear.',
      body: 'Strings can be edited in place. `insert(pos, text)` pushes text in, `erase(pos, count)` cuts it out, and `replace(pos, count, text)` swaps a span for something else.\n\nAll of them shift the characters after the change, so they cost time proportional to the length.',
      code: `#include <iostream>
#include <string>

int main() {
    std::string s = "I like tea";
    s.insert(2, "really ");           // I really like tea
    s.replace(s.find("tea"), 3, "kymyz");
    std::cout << s << "\\n";
    s.erase(0, 2);
    std::cout << s << "\\n";
    return 0;
}`,
      output: 'I really like kymyz\nreally like kymyz',
      points: [
        'insert, erase and replace edit in place.',
        'replace(pos, count, text) swaps a span.',
        'Each one shifts the tail of the string.',
      ],
    },
    {
      id: 'c8p6',
      title: 'Comparing strings',
      lede: '== works, and < sorts alphabetically.',
      body: 'Unlike C strings, `std::string` compares with `==`, `!=`, `<` and friends. Ordering is by character code, so uppercase sorts before lowercase.\n\nFor case-insensitive comparison, convert both to the same case first — there is no built-in option.',
      code: `#include <iostream>
#include <string>
#include <algorithm>

std::string lower(std::string s) {
    std::transform(s.begin(), s.end(), s.begin(), ::tolower);
    return s;
}

int main() {
    std::cout << (std::string("apple") < std::string("banana")) << "\\n";
    std::cout << (lower("HELLO") == lower("hello")) << "\\n";
    return 0;
}`,
      output: '1\n1',
      points: [
        '== compares contents, not addresses.',
        '< orders by character code: A < a.',
        'Lowercase both sides for a case-insensitive test.',
      ],
    },
    {
      id: 'c8p7',
      title: 'Numbers to text and back',
      lede: 'std::to_string, std::stoi, std::stod.',
      body: '`std::to_string(n)` turns a number into text. `std::stoi`, `std::stol` and `std::stod` go the other way.\n\nThe `sto*` functions throw `std::invalid_argument` on rubbish and `std::out_of_range` on something too big, so wrap them when the input comes from a user.',
      code: `#include <iostream>
#include <string>

int main() {
    std::string s = std::to_string(42) + " and " + std::to_string(3.5);
    std::cout << s << "\\n";

    try {
        int n = std::stoi("123abc");      // stops at the letters: 123
        std::cout << n + 1 << "\\n";
        std::stoi("hello");               // throws
    } catch (const std::invalid_argument&) {
        std::cout << "not a number\\n";
    }
    return 0;
}`,
      output: '42 and 3.500000\n124\nnot a number',
      points: [
        'to_string for numbers into text.',
        'stoi / stod for text into numbers.',
        'They throw on invalid input — catch it.',
      ],
    },
    {
      id: 'c8p8',
      title: 'Splitting a line',
      lede: 'stringstream turns a line into pieces.',
      body: 'A `std::istringstream` from `<sstream>` reads out of a string the same way `cin` reads from the keyboard. Use `>>` for whitespace-separated words, or `getline` with a delimiter for CSV-style data.\n\nThis is the standard answer to "how do I split a string in C++", because the language has no split function.',
      code: `#include <iostream>
#include <sstream>
#include <string>
#include <vector>

int main() {
    std::string line = "London,Rome,Tbilisi,Bishkek";
    std::istringstream in(line);
    std::string city;
    std::vector<std::string> cities;
    while (std::getline(in, city, ',')) cities.push_back(city);

    std::cout << cities.size() << " cities, last " << cities.back() << "\\n";
    return 0;
}`,
      output: '4 cities, last Bishkek',
      points: [
        '#include <sstream> for istringstream.',
        'getline(stream, out, delim) splits on a character.',
        'There is no built-in split — this is the idiom.',
      ],
    },
    {
      id: 'c8p9',
      title: 'Formatting output',
      lede: 'Decimal places, widths and alignment.',
      body: '`<iomanip>` controls how numbers print. `std::fixed` with `std::setprecision(2)` gives two decimal places, and `std::setw(n)` pads the next value to a width.\n\n`setprecision` and `fixed` stay on until changed. `setw` applies to one value only.',
      code: `#include <iostream>
#include <iomanip>

int main() {
    double price = 3.14159;
    std::cout << std::fixed << std::setprecision(2) << price << "\\n";
    std::cout << std::setw(10) << "Item" << std::setw(8) << "Price" << "\\n";
    std::cout << std::setw(10) << "Bread" << std::setw(8) << 1.5 << "\\n";
    return 0;
}`,
      output: '3.14\n      Item   Price\n     Bread    1.50',
      points: [
        '#include <iomanip> for setprecision and setw.',
        'fixed + setprecision(n) gives n decimal places.',
        'setw affects only the next value printed.',
      ],
    },
  ],
};
