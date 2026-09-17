export default {
  id: 'c3',
  title: 'Doing arithmetic',
  blurb: 'Operators, precedence, the traps in integer maths, and reading input.',
  pages: [
    {
      id: 'c3p1',
      title: 'The arithmetic operators',
      lede: 'Five symbols that cover nearly everything.',
      body: 'C++ gives you `+`, `-`, `*`, `/` and `%`. There is no power operator — use `std::pow` from `<cmath>`.\n\nThe result type follows the operands. Two ints give an int. One double anywhere makes the whole expression a double.',
      code: `#include <iostream>

int main() {
    std::cout << 7 + 3 << "\\n";
    std::cout << 7 - 3 << "\\n";
    std::cout << 7 * 3 << "\\n";
    std::cout << 7 / 3 << "\\n";   // integer division!
    std::cout << 7 % 3 << "\\n";   // remainder
    return 0;
}`,
      output: '10\n4\n21\n2\n1',
      points: [
        'No ** operator — std::pow(base, exp) from <cmath>.',
        'int op int gives an int.',
        '% is the remainder, and only works on integers.',
      ],
    },
    {
      id: 'c3p2',
      title: 'Integer division cuts the tail off',
      lede: 'The single most common beginner surprise.',
      body: '`7 / 2` is `3`, not `3.5`. When both sides are integers, C++ does integer division and throws away the fraction — it does not round, it truncates towards zero.\n\nTo get a real answer, make one side a double. Casting one operand is enough, because the other is promoted to match.',
      code: `#include <iostream>

int main() {
    int a = 7, b = 2;
    std::cout << a / b << "\\n";                    // 3
    std::cout << double(a) / b << "\\n";            // 3.5
    std::cout << static_cast<double>(a) / b << "\\n"; // 3.5, the C++ way
    std::cout << 7.0 / 2 << "\\n";                  // 3.5
    return 0;
}`,
      output: '3\n3.5\n3.5\n3.5',
      points: [
        'int / int truncates towards zero, always.',
        'Cast one side to double to get a fraction.',
        'static_cast<double>(x) is the modern spelling.',
      ],
    },
    {
      id: 'c3p3',
      title: 'The remainder operator',
      lede: '% answers "what is left over", and it is more useful than it looks.',
      body: '`a % b` gives the remainder of `a / b`. It is how you test whether a number divides evenly, how you get the last digit of a number, and how you wrap a counter round a fixed size.\n\nWith negative numbers the sign follows the left operand: `-7 % 3` is `-1`, not `2`.',
      code: `#include <iostream>

int main() {
    int n = 1234;
    std::cout << (n % 2 == 0 ? "even" : "odd") << "\\n";
    std::cout << n % 10 << "\\n";        // last digit
    std::cout << (n / 10) % 10 << "\\n"; // second-to-last
    for (int i = 0; i < 7; ++i) std::cout << i % 3;  // wraps 0,1,2
    return 0;
}`,
      output: 'even\n4\n3\n0120120',
      points: [
        'n % 2 == 0 tests for even.',
        'n % 10 peels off the last digit.',
        'i % size wraps an index round a buffer.',
      ],
    },
    {
      id: 'c3p4',
      title: 'Precedence and brackets',
      lede: 'Multiplication before addition, and brackets before everything.',
      body: 'C++ follows the maths you already know: `*`, `/` and `%` bind tighter than `+` and `-`. Comparisons come after arithmetic, and the logical operators come after those.\n\nDo not memorise the full table of twenty levels. Use brackets. Code with brackets is read correctly by tired people at midnight; code that relies on precedence trivia is not.',
      code: `#include <iostream>

int main() {
    std::cout << 2 + 3 * 4 << "\\n";        // 14
    std::cout << (2 + 3) * 4 << "\\n";      // 20
    std::cout << 10 - 4 - 3 << "\\n";       // 3  (left to right)
    bool ok = (5 > 3) && (2 + 2 == 4);      // brackets say it plainly
    std::cout << ok << "\\n";
    return 0;
}`,
      output: '14\n20\n3\n1',
      points: [
        '* / % bind tighter than + -.',
        'Same-level operators run left to right.',
        'Brackets cost nothing and save arguments.',
      ],
    },
    {
      id: 'c3p5',
      title: '++ and --',
      lede: 'Add one, subtract one, and the difference between ++i and i++.',
      body: '`++i` increases `i` and gives the new value. `i++` increases `i` and gives the **old** one. On their own, as a whole statement, they do the same thing.\n\nThe difference matters when the result is used in a bigger expression — and that is exactly where it becomes unreadable. Keep increments on their own line. For heavyweight types, prefer `++i`: it does not need to keep a copy of the old value.',
      code: `#include <iostream>

int main() {
    int i = 5;
    std::cout << i++ << "\\n";   // prints 5, then i becomes 6
    std::cout << i << "\\n";     // 6
    int j = 5;
    std::cout << ++j << "\\n";   // j becomes 6, prints 6
    return 0;
}`,
      output: '5\n6\n6',
      points: [
        'i++ yields the old value; ++i yields the new one.',
        'As a lone statement they are identical.',
        'Prefer ++i in loops — no temporary copy.',
      ],
    },
    {
      id: 'c3p6',
      title: 'Compound assignment',
      lede: '+= and friends: say the variable once.',
      body: '`total += 5` means `total = total + 5`. There is a compound form for every arithmetic operator, and each one removes a chance to mistype the variable name on one side.\n\nThey are also clearer with long names — you read the intention "add to this" instead of scanning both sides for a difference.',
      code: `#include <iostream>

int main() {
    int total = 10;
    total += 5;   std::cout << total << "\\n";  // 15
    total -= 3;   std::cout << total << "\\n";  // 12
    total *= 2;   std::cout << total << "\\n";  // 24
    total /= 4;   std::cout << total << "\\n";  // 6
    total %= 4;   std::cout << total << "\\n";  // 2
    return 0;
}`,
      output: '15\n12\n24\n6\n2',
      points: [
        'x += y is x = x + y, with the name written once.',
        'Works for - * / % and the bitwise operators too.',
        'Strings support += as well: s += "more".',
      ],
    },
    {
      id: 'c3p7',
      title: 'Reading input with cin',
      lede: 'The user types, your program receives.',
      body: '`std::cin >> x` reads one whitespace-separated value into `x`, converting it to the right type. It stops at the first space or newline, so `cin >> name` gets a first name only.\n\nIf the user types letters where a number was expected, the stream goes into a fail state and `x` is left at zero. Always check.',
      code: `#include <iostream>
#include <string>

int main() {
    std::string name;
    int age = 0;
    std::cout << "Name and age: ";
    std::cin >> name >> age;
    if (!std::cin) {
        std::cout << "That was not a number.\\n";
        return 1;
    }
    std::cout << name << " will be " << age + 1 << " next year.\\n";
    return 0;
}`,
      output: 'Name and age: Aizada 13\nAizada will be 14 next year.',
      points: [
        '>> reads one whitespace-separated token.',
        'Chain reads: cin >> a >> b;',
        'Check the stream; bad input leaves the variable at zero.',
      ],
    },
    {
      id: 'c3p8',
      title: 'Reading a whole line',
      lede: 'getline, and the newline that trips everyone up.',
      body: 'For text with spaces, use `std::getline(std::cin, line)`. It reads everything up to the newline.\n\nThe classic trap: after `cin >> age`, the newline you pressed is still sitting in the buffer, so the next `getline` returns an empty string. Clear it with `std::cin.ignore()`.',
      code: `#include <iostream>
#include <string>
#include <limits>

int main() {
    int age = 0;
    std::cin >> age;
    std::cin.ignore(std::numeric_limits<std::streamsize>::max(), '\\n');

    std::string fullName;
    std::getline(std::cin, fullName);
    std::cout << fullName << " is " << age << "\\n";
    return 0;
}`,
      output: '14\nAibek Sultanov\nAibek Sultanov is 14',
      points: [
        'getline reads a whole line, spaces included.',
        'After >>, the newline stays behind — ignore() clears it.',
        'Mixing >> and getline without ignore() is the classic bug.',
      ],
      tip: 'If a getline mysteriously reads nothing, look for a >> above it.',
    },
    {
      id: 'c3p9',
      title: 'The maths library',
      lede: 'Roots, powers, rounding and trigonometry.',
      body: '`<cmath>` carries the usual functions: `sqrt`, `pow`, `abs`, `floor`, `ceil`, `round`, and the trigonometry set. They work on doubles and return doubles.\n\nFor integers use `std::abs` from `<cstdlib>` — and remember `pow` returns a double, so `int(std::pow(10, 2))` can land on 99 on some machines. For small integer powers, multiply.',
      code: `#include <iostream>
#include <cmath>

int main() {
    std::cout << std::sqrt(144.0) << "\\n";
    std::cout << std::pow(2.0, 10) << "\\n";
    std::cout << std::floor(3.7) << " " << std::ceil(3.2) << "\\n";
    std::cout << std::round(2.5) << "\\n";
    std::cout << std::abs(-8.5) << "\\n";
    return 0;
}`,
      output: '12\n1024\n3 4\n3\n8.5',
      points: [
        '#include <cmath> for sqrt, pow, floor, ceil, round.',
        'They take and return doubles.',
        'For integer powers, multiplying is exact and faster.',
      ],
    },
  ],
};
