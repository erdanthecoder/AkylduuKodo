export default {
  id: 'c2',
  title: 'Values and variables',
  blurb: 'The kinds of data C++ knows about, and how to give them names.',
  pages: [
    {
      id: 'c2p1',
      title: 'What a variable is',
      lede: 'A named box in memory, with a fixed kind of thing inside.',
      body: 'A variable is a piece of memory with a name and a **type**. The type is decided when you write the code and never changes — an `int` holds whole numbers and will hold whole numbers for as long as it exists.\n\nThis is the biggest difference from JavaScript. There is no `let` that holds anything. You say what kind of value it is, and the compiler holds you to it.',
      code: `int score = 0;          // whole number
double price = 4.99;    // number with a fractional part
char grade = 'A';       // one character, single quotes
bool passed = true;     // true or false`,
      points: [
        'Every variable has a type, fixed at compile time.',
        'The type decides how much memory it takes and what fits in it.',
        'Single quotes are a char; double quotes are text.',
      ],
    },
    {
      id: 'c2p2',
      title: 'int — whole numbers',
      lede: 'The workhorse type, and the one with a ceiling.',
      body: 'An `int` is normally 32 bits, which holds roughly -2.1 billion to +2.1 billion. Go past the top and it **overflows**: it silently wraps round to the most negative value. No error, no warning at runtime.\n\nWhen you need bigger, use `long long` (64 bits, about 9.2 quintillion). When a value can never be negative, `unsigned` doubles the positive range — but mixing signed and unsigned is a classic source of bugs, so do it deliberately.',
      code: `#include <iostream>
#include <climits>

int main() {
    int big = INT_MAX;
    std::cout << big << "\\n";
    std::cout << big + 1 << "\\n";   // wraps around!
    long long huge = 9000000000LL;
    std::cout << huge << "\\n";
    return 0;
}`,
      output: '2147483647\n-2147483648\n9000000000',
      points: [
        'int is about ±2.1 billion on almost every machine.',
        'Overflow wraps silently — it does not throw.',
        'long long for big values; check <climits> for the limits.',
      ],
    },
    {
      id: 'c2p3',
      title: 'double — numbers with a point',
      lede: 'Fast, enormous range, and never exactly right.',
      body: 'A `double` stores numbers in binary scientific notation. That makes it fast and wide-ranging, but many everyday decimals cannot be stored exactly — `0.1 + 0.2` is not `0.3`.\n\nSo never compare doubles with `==`. Compare the difference against a small tolerance instead. And never store money in a double: count cents in an integer.',
      code: `#include <iostream>
#include <cmath>

int main() {
    double a = 0.1 + 0.2;
    std::cout << (a == 0.3) << "\\n";              // 0 — false!
    std::cout << (std::fabs(a - 0.3) < 1e-9) << "\\n"; // 1 — true
    return 0;
}`,
      output: '0\n1',
      points: [
        'double is approximate. 0.1 + 0.2 != 0.3.',
        'Compare with a tolerance, never with ==.',
        'Money belongs in integer cents, not in a double.',
      ],
      tip: 'float is half the size and half the accuracy. Use double unless you have measured a reason not to.',
    },
    {
      id: 'c2p4',
      title: 'bool, char and the small types',
      lede: 'True or false, and single characters.',
      body: 'A `bool` is `true` or `false`. Printed with `cout` it shows `1` or `0` unless you ask for `std::boolalpha`.\n\nA `char` is one byte holding one character — `\'A\'`, `\'7\'`, `\'\\n\'`. It is also a small integer: `\'A\'` is 65, so `\'A\' + 1` gives you `\'B\'` if you cast it back.',
      code: `#include <iostream>

int main() {
    bool ready = true;
    std::cout << ready << " " << std::boolalpha << ready << "\\n";
    char c = 'A';
    std::cout << c << " is " << int(c) << "\\n";
    std::cout << char(c + 1) << "\\n";
    return 0;
}`,
      output: '1 true\nA is 65\nB',
      points: [
        'bool prints as 1/0 unless you use std::boolalpha.',
        "A char is a one-byte integer wearing a costume.",
        "'A' is 65, 'a' is 97, '0' is 48.",
      ],
    },
    {
      id: 'c2p5',
      title: 'std::string — text',
      lede: 'Text that grows, joins and measures itself.',
      body: 'C++ inherited raw character arrays from C, and they are painful. `std::string` from `<string>` is what you should use: it manages its own memory, grows when you add to it, and knows its own length.\n\nJoin strings with `+`. Compare them with `==`. Ask for a character with `[i]`. It behaves the way you expect.',
      code: `#include <iostream>
#include <string>

int main() {
    std::string city = "Bishkek";
    std::string greet = "Salam, " + city + "!";
    std::cout << greet << "\\n";
    std::cout << greet.length() << " characters\\n";
    std::cout << greet[0] << "\\n";
    return 0;
}`,
      output: 'Salam, Bishkek!\n15 characters\nS',
      points: [
        '#include <string> to use std::string.',
        '+ joins, == compares, .length() measures.',
        'Never use char arrays for text unless you must.',
      ],
    },
    {
      id: 'c2p6',
      title: 'Naming things',
      lede: 'The one skill that makes code readable.',
      body: 'Names may contain letters, digits and underscores, and cannot start with a digit. C++ is case sensitive: `total` and `Total` are different variables.\n\nPick names that say what the value **means**, not what type it is. `daysLeft` beats `d` and beats `intDays`. Loop counters are the one place where `i` and `j` are fine, because everybody knows them.',
      code: `int n;                 // meaningless
int daysUntilExam;     // good

double t;              // what is t?
double tempCelsius;    // now nobody has to ask

bool flag;             // flag for what?
bool hasPaid;          // reads like English in an if`,
      points: [
        'Letters, digits, underscores; never start with a digit.',
        'Case matters: total and Total are two variables.',
        'Name the meaning, not the type.',
      ],
    },
    {
      id: 'c2p7',
      title: 'const — values that must not move',
      lede: 'Say what cannot change and the compiler will guard it.',
      body: 'Mark a variable `const` and any attempt to change it becomes a compile error. That is not a restriction — it is a promise the compiler enforces for you, and it makes code far easier to read, because you know at a glance what can move.\n\n`constexpr` goes further: the value must be known while compiling, so it costs nothing at runtime. Use it for fixed sizes and mathematical constants.',
      code: `const double PI = 3.14159265358979;
constexpr int MAX_PLAYERS = 4;

int main() {
    // PI = 3.0;    // error: assignment of read-only variable
    int scores[MAX_PLAYERS] = {};   // a constexpr can size an array
    return 0;
}`,
      points: [
        'const means "this never changes after it is set".',
        'constexpr means "known at compile time".',
        'Make everything const that can be const.',
      ],
    },
    {
      id: 'c2p8',
      title: 'auto — let the compiler say the type',
      lede: 'Not a dynamic type. A way to avoid typing one out.',
      body: '`auto` asks the compiler to work out the type from the value on the right. The variable still has one fixed type; you simply did not spell it.\n\nIt pays off when the type is long and obvious from context — iterators especially. It hurts when the type is the important information, so do not hide `int` behind `auto` for the sake of it.',
      code: `auto count = 10;                 // int
auto ratio = 2.5;                // double
auto name = std::string("Nur");  // std::string

std::vector<int> v = {3, 1, 2};
for (auto it = v.begin(); it != v.end(); ++it) {
    // "auto" saved you std::vector<int>::iterator
}`,
      points: [
        'auto is compile-time deduction, not a dynamic type.',
        'Best for long types like iterators.',
        'auto x = 1; gives an int, not a double.',
      ],
    },
    {
      id: 'c2p9',
      title: 'Uninitialised variables',
      lede: 'The bug that changes every time you run it.',
      body: 'A local variable you do not initialise contains whatever was in that memory before. It could be zero. It could be the remains of another calculation. Reading it is **undefined behaviour**, and it is the cause of bugs that appear only on other people\'s machines.\n\nSo always initialise. Brace initialisation, `int n{};`, sets it to zero and refuses to compile if the value would lose information.',
      code: `int main() {
    int a;        // rubbish
    int b = 0;    // fine
    int c{};      // zero, and safest of all
    int d{2.7};   // error: narrowing — caught for you

    std::cout << b << " " << c << "\\n";
    return 0;
}`,
      output: '0 0',
      points: [
        'An uninitialised local holds whatever was there before.',
        'Reading it is undefined behaviour — anything may happen.',
        'Prefer braces: int n{}; starts at zero and blocks narrowing.',
      ],
      tip: 'If a bug appears and disappears depending on the weather, look for an uninitialised variable.',
    },
  ],
};
