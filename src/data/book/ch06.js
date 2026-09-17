export default {
  id: 'c6',
  title: 'Functions',
  blurb: 'Naming a piece of work so you can do it again from anywhere.',
  pages: [
    {
      id: 'c6p1',
      title: 'Writing a function',
      lede: 'Return type, name, parameters, body.',
      body: 'A function definition says what it gives back, what it is called, what it needs, and what it does. Call it by writing its name with brackets.\n\nFunctions are how a program stays readable past a hundred lines. If you can name a piece of work, it should probably be a function.',
      code: `#include <iostream>

int square(int n) {        // returns int, takes one int
    return n * n;
}

int main() {
    std::cout << square(7) << "\\n";
    std::cout << square(3) + square(4) << "\\n";
    return 0;
}`,
      output: '49\n25',
      points: [
        'returnType name(parameters) { body }',
        'return sends a value back and ends the function.',
        'If you can name the work, make it a function.',
      ],
    },
    {
      id: 'c6p2',
      title: 'Parameters and arguments',
      lede: 'The names in the definition, the values at the call.',
      body: 'Parameters are the named slots in the definition. Arguments are the actual values you pass. They are matched by position, not by name, so the order is part of the contract.\n\nBy default the argument is **copied** into the parameter. Changing the parameter inside does not touch the caller\'s variable.',
      code: `#include <iostream>

void bump(int n) {     // n is a copy
    n = n + 100;
}

int main() {
    int score = 5;
    bump(score);
    std::cout << score << "\\n";   // still 5
    return 0;
}`,
      output: '5',
      points: [
        'Arguments match parameters by position.',
        'Plain parameters are copies.',
        'Changing a copy does nothing to the original.',
      ],
    },
    {
      id: 'c6p3',
      title: 'void and returning nothing',
      lede: 'Some functions do a job instead of answering a question.',
      body: 'A function that returns nothing has the return type `void`. You can still write a bare `return;` to leave early.\n\nIf a function has a non-void return type, every path through it must return something. Forgetting one branch is undefined behaviour, and `-Wall` warns about it.',
      code: `#include <iostream>
#include <string>

void greet(const std::string& name) {
    if (name.empty()) return;              // leave early
    std::cout << "Salam, " << name << "!\\n";
}

int main() {
    greet("Nurlan");
    greet("");
    return 0;
}`,
      output: 'Salam, Nurlan!',
      points: [
        'void means the function returns nothing.',
        'A bare return; leaves a void function early.',
        'Every path of a non-void function must return.',
      ],
    },
    {
      id: 'c6p4',
      title: 'Pass by reference',
      lede: 'An ampersand lets a function change the caller\'s variable.',
      body: 'Write `int&` instead of `int` and the parameter becomes another name for the caller\'s variable, not a copy. Changes are visible outside.\n\nUse `const T&` for large read-only values — strings, vectors, objects. It avoids the copy without allowing changes, and it is the default choice for any parameter bigger than a pointer.',
      code: `#include <iostream>
#include <string>

void addExclamation(std::string& s) { s += "!"; }
void print(const std::string& s) { std::cout << s << "\\n"; }  // no copy

int main() {
    std::string word = "Wow";
    addExclamation(word);
    print(word);
    return 0;
}`,
      output: 'Wow!',
      points: [
        'T& shares the caller\'s variable.',
        'const T& avoids a copy and forbids changes.',
        'Pass small types (int, double, char) by value.',
      ],
    },
    {
      id: 'c6p5',
      title: 'Default arguments',
      lede: 'A value used when the caller does not supply one.',
      body: 'Give a parameter a default in the declaration and callers may leave it out. Defaults must be the **last** parameters, because arguments are matched by position.\n\nPut the default in the declaration (the header), not in the definition, or you will get a duplicate-default error.',
      code: `#include <iostream>

double total(double price, double taxRate = 0.12) {
    return price * (1 + taxRate);
}

int main() {
    std::cout << total(100) << "\\n";        // uses 0.12
    std::cout << total(100, 0.20) << "\\n";  // overrides it
    return 0;
}`,
      output: '112\n120',
      points: [
        'Defaults go on the rightmost parameters only.',
        'Declare the default once, in the declaration.',
        'They cut the number of overloads you need.',
      ],
    },
    {
      id: 'c6p6',
      title: 'Overloading',
      lede: 'Same name, different parameters.',
      body: 'C++ lets several functions share a name as long as their parameter lists differ. The compiler picks the match at the call site.\n\nThe return type alone is **not** enough to tell two overloads apart. Overload when the functions do the same thing to different kinds of input; do not overload to do unrelated jobs.',
      code: `#include <iostream>
#include <string>

int biggest(int a, int b) { return a > b ? a : b; }
double biggest(double a, double b) { return a > b ? a : b; }
std::string biggest(const std::string& a, const std::string& b) {
    return a.length() > b.length() ? a : b;
}

int main() {
    std::cout << biggest(3, 9) << "\\n";
    std::cout << biggest(2.5, 1.5) << "\\n";
    std::cout << biggest(std::string("hi"), std::string("hello")) << "\\n";
    return 0;
}`,
      output: '9\n2.5\nhello',
      points: [
        'Overloads must differ in their parameters.',
        'Differing only by return type is an error.',
        'Overload for the same idea, not for different jobs.',
      ],
    },
    {
      id: 'c6p7',
      title: 'Scope and lifetime',
      lede: 'Where a name can be seen, and how long its value lives.',
      body: 'A local variable is created when control reaches it and destroyed at the closing brace. A global variable lives for the whole program and is visible everywhere, which is why globals make bugs hard to find.\n\nA `static` local is created once and keeps its value between calls, while still being invisible outside the function.',
      code: `#include <iostream>

int callCount() {
    static int calls = 0;    // created once, remembered
    return ++calls;
}

int main() {
    std::cout << callCount() << callCount() << callCount() << "\\n";
    return 0;
}`,
      output: '123',
      points: [
        'Locals die at the closing brace.',
        'static locals are created once and remember.',
        'Globals are visible everywhere, which is usually a problem.',
      ],
    },
    {
      id: 'c6p8',
      title: 'Declarations, definitions and headers',
      lede: 'Telling the compiler a function exists before you write it.',
      body: 'The compiler reads top to bottom, so a function must be known before it is called. A **declaration** (the signature and a semicolon) is enough; the **definition** can come later or live in another file.\n\nThat is what header files do. The `.h` carries declarations, the `.cpp` carries definitions, and `#pragma once` at the top of a header stops it being included twice.',
      code: `// maths.h
#pragma once
int square(int n);          // declaration only

// maths.cpp
#include "maths.h"
int square(int n) { return n * n; }   // definition

// main.cpp
#include "maths.h"
int main() { return square(4); }`,
      points: [
        'A declaration ends in a semicolon; a definition has a body.',
        'Headers hold declarations, .cpp files hold definitions.',
        '#pragma once guards against double inclusion.',
      ],
    },
    {
      id: 'c6p9',
      title: 'Recursion',
      lede: 'A function that calls itself, with a way out.',
      body: 'Recursion needs two things: a **base case** that returns without recursing, and a step that moves towards it. Miss either and the call stack fills until the program dies.\n\nSome problems are naturally recursive — trees, folders, divide-and-conquer. Most counting problems are clearer as loops.',
      code: `#include <iostream>

long long factorial(int n) {
    if (n <= 1) return 1;            // base case
    return n * factorial(n - 1);     // steps towards it
}

int main() {
    std::cout << factorial(10) << "\\n";
    return 0;
}`,
      output: '3628800',
      points: [
        'Every recursion needs a base case.',
        'Each call must make the problem smaller.',
        'Too deep and you get a stack overflow.',
      ],
      tip: 'Write the base case first. It is the part people forget.',
    },
  ],
};
