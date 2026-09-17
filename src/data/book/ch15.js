export default {
  id: 'c15',
  title: 'Getting it right',
  blurb: 'Errors, debugging, testing, and what to do after this book.',
  pages: [
    {
      id: 'c15p1',
      title: 'Exceptions',
      lede: 'Throw when a function cannot do what it promised.',
      body: '`throw` abandons the current path and unwinds the stack until a matching `catch` is found. Destructors run on the way out, so RAII objects clean up properly.\n\nUse exceptions for genuinely exceptional situations — a file that will not open, input that cannot be parsed — not for ordinary control flow.',
      code: `#include <iostream>
#include <stdexcept>

double divide(double a, double b) {
    if (b == 0) throw std::invalid_argument("divide by zero");
    return a / b;
}

int main() {
    try {
        std::cout << divide(10, 2) << "\\n";
        std::cout << divide(1, 0) << "\\n";
    } catch (const std::invalid_argument& e) {
        std::cout << "Error: " << e.what() << "\\n";
    }
    return 0;
}`,
      output: '5\nError: divide by zero',
      points: [
        'throw leaves the function; catch handles it.',
        'Catch by const reference, always.',
        'Destructors still run while the stack unwinds.',
      ],
    },
    {
      id: 'c15p2',
      title: 'Catching well',
      lede: 'Order matters, and catch(...) is a last resort.',
      body: 'Catch blocks are tried in order, so put the specific types first and the general ones after. `std::exception` is the base of everything in the standard library, and `.what()` gives the message.\n\n`catch (...)` catches anything at all but tells you nothing. Use it only to add context and rethrow.',
      code: `#include <iostream>
#include <stdexcept>
#include <vector>

int main() {
    try {
        std::vector<int> v(3);
        v.at(10) = 1;
    } catch (const std::out_of_range& e) {   // specific first
        std::cout << "Range: " << e.what() << "\\n";
    } catch (const std::exception& e) {      // then general
        std::cout << "Other: " << e.what() << "\\n";
    }
    return 0;
}`,
      output: 'Range: vector::_M_range_check: __n (which is 10) >= this->size() (which is 3)',
      points: [
        'Specific catch blocks before general ones.',
        'std::exception is the common base; .what() is the message.',
        'catch (...) hides the problem — use it sparingly.',
      ],
    },
    {
      id: 'c15p3',
      title: 'Undefined behaviour',
      lede: 'The rules you must not break, and why it is so dangerous.',
      body: 'Reading past the end of an array, dereferencing a null pointer, signed overflow, using an uninitialised variable — these are **undefined behaviour**. The standard does not say what happens, so the compiler assumes they never happen and optimises accordingly.\n\nThat is why UB bugs are so strange: the code appears to work, then stops working when you add a print statement or change the optimisation level.',
      code: `int v[3] = {1, 2, 3};
// int x = v[5];          // UB: reads whatever is next in memory

int* p = nullptr;
// *p = 1;                // UB: usually a crash, but not promised

int i;
// if (i > 0) { }         // UB: i was never initialised`,
      points: [
        'UB means the standard makes no promise at all.',
        'The program may work today and fail after any change.',
        'Sanitisers find most of it in seconds.',
      ],
      tip: 'g++ -fsanitize=address,undefined -g turns silent UB into a clear error message with a line number.',
    },
    {
      id: 'c15p4',
      title: 'Compiler warnings',
      lede: 'Free bug reports you are probably ignoring.',
      body: 'Compile with `-Wall -Wextra`. The warnings flag comparisons between signed and unsigned, unused variables, a function that forgets to return, and shadowed names — all real bugs in disguise.\n\nOnce a project is clean, add `-Werror` so a new warning stops the build. A warning you can see but ignore is the same as no warning.',
      code: `g++ -std=c++17 -Wall -Wextra -g main.cpp -o app

// warning: comparison of integer expressions of different signedness
for (int i = 0; i < v.size(); ++i)      // size() is unsigned

// fixed:
for (std::size_t i = 0; i < v.size(); ++i)`,
      file: 'terminal',
      points: [
        '-Wall -Wextra on every build.',
        'Signed/unsigned comparisons are real bugs.',
        '-Werror once the project is clean.',
      ],
    },
    {
      id: 'c15p5',
      title: 'Debugging',
      lede: 'Print, step, or isolate — in that order of effort.',
      body: 'The fastest tool is a print statement: show the values going in and coming out. When that is not enough, a debugger (`gdb`, `lldb`, or the one in your editor) lets you stop on a line and inspect everything.\n\nCompile with `-g` so the debugger can show you source lines instead of addresses. And narrow the problem: cut the program down until the bug has nowhere left to hide.',
      code: `#include <iostream>
#define TRACE(x) std::cerr << #x << " = " << (x) << "\\n"

int main() {
    int total = 0;
    for (int i = 1; i <= 3; ++i) {
        total += i;
        TRACE(total);          // prints "total = 1", "total = 3", ...
    }
    return 0;
}`,
      output: 'total = 1\ntotal = 3\ntotal = 6',
      points: [
        'cerr is unbuffered — it appears even if the program crashes.',
        '#x turns the expression into its own text.',
        'Compile with -g before using a debugger.',
      ],
    },
    {
      id: 'c15p6',
      title: 'Testing what you write',
      lede: 'A main that checks itself beats running it by hand.',
      body: 'You do not need a framework to start. A function, a set of known inputs, and `assert` from `<cassert>` will catch a regression the moment you introduce it.\n\nWhen the project grows, move to Catch2 or GoogleTest. The habit matters more than the tool: every bug you fix should get a test that would have caught it.',
      code: `#include <cassert>
#include <iostream>

int clampScore(int n) { return n < 0 ? 0 : (n > 100 ? 100 : n); }

int main() {
    assert(clampScore(50) == 50);
    assert(clampScore(-5) == 0);
    assert(clampScore(150) == 100);
    std::cout << "All tests passed\\n";
    return 0;
}`,
      output: 'All tests passed',
      points: [
        'assert(condition) aborts when the condition is false.',
        'Asserts vanish when NDEBUG is defined — do not put logic inside one.',
        'Every bug fixed deserves a test.',
      ],
    },
    {
      id: 'c15p7',
      title: 'Mistakes everyone makes',
      lede: 'The list worth rereading when something is wrong.',
      body: 'Nearly every beginner bug is on this list. When a program misbehaves, walk it before you do anything clever.\n\nThe pattern is always the same: a small assumption that was never checked.',
      code: `// = instead of ==               if (x = 5)
// Missing break in a switch     falls into the next case
// <= in a loop over n items     reads one past the end
// int division                  7 / 2 is 3
// Comparing doubles with ==     0.1 + 0.2 != 0.3
// Uninitialised variable        holds rubbish
// >> then getline               the newline is still waiting
// Returning a local by address  the object is already gone
// Missing virtual destructor    the derived part leaks`,
      points: [
        'Check the simple assumptions first.',
        'Most bugs are on this list.',
        'A sanitiser finds the memory half of them instantly.',
      ],
    },
    {
      id: 'c15p8',
      title: 'Style that survives',
      lede: 'Write for the person reading it in six months.',
      body: 'Consistency beats cleverness. Pick a naming convention and keep it. Keep functions short enough to see whole. Name things after what they mean. Write the comment that explains **why**.\n\nUse `clang-format` so nobody argues about spaces, and put the project rules in a `.clang-format` file where they are enforced rather than discussed.',
      code: `// Hard to read
int f(std::vector<int>&v){int r=0;for(int i=0;i<v.size();i++){if(v[i]>0)r+=v[i];}return r;}

// The same function, readable
int sumPositive(const std::vector<int>& values) {
    int total = 0;
    for (int value : values) {
        if (value > 0) total += value;
    }
    return total;
}`,
      points: [
        'Consistency matters more than which convention you pick.',
        'Short functions with honest names.',
        'Let clang-format handle the layout.',
      ],
    },
    {
      id: 'c15p9',
      title: 'Where to go next',
      lede: 'You have the language. Now build something with it.',
      body: 'The way forward is a project you actually want to exist: a text game, a calculator, a tool that renames your files, a small physics simulation. Finishing something small teaches more than reading three more chapters.\n\nWhen you need the exact rule, **cppreference.com** is the reference everyone uses. When you need a second opinion on style, the C++ Core Guidelines are free and written by the people who designed the language.',
      code: `// A first project that uses most of this book:
//   1. Read a CSV of names and scores          (fstream, getline, stringstream)
//   2. Store them in a vector of structs       (struct, vector)
//   3. Sort by score                           (algorithm, lambda)
//   4. Print a formatted table                 (iomanip)
//   5. Write the result to a new file          (ofstream)
//   6. Handle a missing or broken file         (exceptions)`,
      points: [
        'Finish something small; it teaches more than reading.',
        'cppreference.com for the exact rules.',
        'The C++ Core Guidelines for style and safety.',
      ],
      tip: 'Come back to any page here whenever you need it. That is what a handbook is for.',
    },
  ],
};
