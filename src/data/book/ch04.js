export default {
  id: 'c4',
  title: 'Making decisions',
  blurb: 'if, else, comparisons, logic and switch — how a program chooses.',
  pages: [
    {
      id: 'c4p1',
      title: 'if',
      lede: 'Run this block only when the condition is true.',
      body: 'An `if` takes a condition in brackets and a block in braces. If the condition is true the block runs; otherwise it is skipped entirely.\n\nThe braces are optional for a single statement, and leaving them out has caused famous security bugs. Always write the braces.',
      code: `#include <iostream>

int main() {
    int score = 72;
    if (score >= 50) {
        std::cout << "Passed\\n";
    }
    if (score >= 90) {
        std::cout << "Distinction\\n";
    }
    return 0;
}`,
      output: 'Passed',
      points: [
        'if (condition) { ... } — condition must be a bool.',
        'Braces are optional and you should write them anyway.',
        'No semicolon after the closing brace.',
      ],
      tip: 'if (x = 5) assigns and is always true. The compiler warns — listen to it.',
    },
    {
      id: 'c4p2',
      title: 'else and else if',
      lede: 'What to do when the condition was false.',
      body: '`else` catches everything the `if` did not. Chain `else if` to test several conditions in order; the first one that is true wins and the rest are never checked.\n\nThe order matters. Put the most specific test first, or a broader one above will swallow it.',
      code: `#include <iostream>

int main() {
    int score = 85;
    if (score >= 90)      std::cout << "A\\n";
    else if (score >= 80) std::cout << "B\\n";
    else if (score >= 70) std::cout << "C\\n";
    else                  std::cout << "Try again\\n";
    return 0;
}`,
      output: 'B',
      points: [
        'Only the first true branch runs.',
        'else with no condition catches the rest.',
        'Order from most specific to most general.',
      ],
    },
    {
      id: 'c4p3',
      title: 'Comparison operators',
      lede: 'Six of them, and one that catches everybody.',
      body: '`==` equal, `!=` not equal, `<`, `>`, `<=`, `>=`. They produce a `bool`.\n\n`=` assigns, `==` compares. Writing `if (x = 5)` sets x to 5 and is always true. Modern compilers warn; some people write `if (5 == x)` so the mistake becomes a compile error.',
      code: `#include <iostream>

int main() {
    int a = 5, b = 8;
    std::cout << (a == b) << "\\n";   // 0
    std::cout << (a != b) << "\\n";   // 1
    std::cout << (a < b)  << "\\n";   // 1
    std::cout << (a >= 5) << "\\n";   // 1
    return 0;
}`,
      output: '0\n1\n1\n1',
      points: [
        '= assigns, == compares.',
        'Comparisons give a bool, printed as 1 or 0.',
        'Comparing doubles with == is unreliable.',
      ],
    },
    {
      id: 'c4p4',
      title: 'Logical operators',
      lede: 'and, or, not — written &&, || and !.',
      body: '`&&` is true when both sides are; `||` when either is; `!` flips a bool.\n\nBoth `&&` and `||` **short-circuit**: if the left side already decides the answer, the right side is never evaluated. That is not a detail — it is how you guard a check that would otherwise crash.',
      code: `#include <iostream>
#include <string>

int main() {
    int age = 15;
    bool member = true;
    if (age >= 13 && member) std::cout << "Allowed\\n";
    if (age < 13 || !member) std::cout << "Blocked\\n";

    std::string s = "";
    if (!s.empty() && s[0] == 'A')   // safe: [0] never runs on empty
        std::cout << "Starts with A\\n";
    return 0;
}`,
      output: 'Allowed',
      points: [
        '&& is and, || is or, ! is not.',
        'They short-circuit: the right side may never run.',
        'Use that to guard an unsafe check on the right.',
      ],
    },
    {
      id: 'c4p5',
      title: 'Truthiness',
      lede: 'Zero is false and everything else is true.',
      body: 'Any number can be used where a bool is expected. `0` is false; every other value is true. Pointers work the same way: a null pointer is false.\n\nThis is legal but rarely clear. Write the comparison you mean: `if (count != 0)` reads better than `if (count)`.',
      code: `#include <iostream>

int main() {
    int count = 3;
    if (count) std::cout << "There are some\\n";   // legal
    if (count != 0) std::cout << "Clearer\\n";     // better

    int zero = 0;
    if (!zero) std::cout << "Nothing here\\n";
    return 0;
}`,
      output: 'There are some\nClearer\nNothing here',
      points: [
        '0 is false, anything else is true.',
        'A null pointer is false, a valid one is true.',
        'Write the comparison out; it reads better.',
      ],
    },
    {
      id: 'c4p6',
      title: 'Nested ifs',
      lede: 'A decision inside a decision.',
      body: 'An `if` can live inside another. It is sometimes exactly right, but three levels deep is a sign the logic wants rearranging.\n\nThe usual fix is an **early return**: handle the failures first, get out, and let the main path run unindented at the bottom.',
      code: `// Nested — hard to follow
if (loggedIn) {
    if (hasTicket) {
        if (onTime) { enter(); }
    }
}

// Flat — same logic, easier to read
if (!loggedIn) return;
if (!hasTicket) return;
if (!onTime) return;
enter();`,
      points: [
        'Nesting is legal at any depth, readable at about two.',
        'Handle failure cases first and return early.',
        'Deep indentation is a smell, not a style.',
      ],
    },
    {
      id: 'c4p7',
      title: 'switch',
      lede: 'One value, many exact matches.',
      body: '`switch` compares one integer or char against a list of `case` labels. It is clearer than a long `else if` chain when you are matching exact values.\n\nEvery case needs a `break`, or execution **falls through** into the next one. That is occasionally what you want, and usually a bug.',
      code: `#include <iostream>

int main() {
    char grade = 'B';
    switch (grade) {
        case 'A': std::cout << "Excellent\\n"; break;
        case 'B':
        case 'C': std::cout << "Good\\n"; break;      // A and B share
        default:  std::cout << "Keep going\\n";
    }
    return 0;
}`,
      output: 'Good',
      points: [
        'switch works on integers, chars and enums — not strings.',
        'Without break, control falls into the next case.',
        'default catches everything else.',
      ],
    },
    {
      id: 'c4p8',
      title: 'The conditional operator',
      lede: 'A small if that produces a value.',
      body: '`condition ? a : b` evaluates to `a` when the condition is true and `b` when it is false. It is an expression, so it can sit inside a bigger one — including on the right of an assignment or inside a `cout`.\n\nKeep it short. Nested ternaries are unreadable and an `if` is right there.',
      code: `#include <iostream>
#include <string>

int main() {
    int n = 7;
    std::string kind = (n % 2 == 0) ? "even" : "odd";
    std::cout << n << " is " << kind << "\\n";
    std::cout << "Bigger: " << (n > 10 ? n : 10) << "\\n";
    return 0;
}`,
      output: '7 is odd\nBigger: 10',
      points: [
        'cond ? a : b produces a value; if does not.',
        'Both branches must give compatible types.',
        'Do not nest them.',
      ],
    },
    {
      id: 'c4p9',
      title: 'Scope inside a block',
      lede: 'A variable exists only between its braces.',
      body: 'A variable declared inside `{ }` disappears at the closing brace. That is a feature: it keeps names small and lets the compiler reuse the memory.\n\nC++17 lets you declare the variable in the `if` itself, which limits it to that decision and its `else`.',
      code: `#include <iostream>

int main() {
    if (int remainder = 17 % 5; remainder != 0) {
        std::cout << "Left over: " << remainder << "\\n";
    } else {
        std::cout << "Divides exactly\\n";
    }
    // remainder no longer exists here
    return 0;
}`,
      output: 'Left over: 2',
      points: [
        'Braces open and close a scope.',
        'if (init; condition) keeps the variable local — C++17.',
        'Declare variables as late and as small as you can.',
      ],
    },
  ],
};
