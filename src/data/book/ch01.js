export default {
  id: 'c1',
  title: 'Starting out',
  blurb: 'What C++ is, how a program becomes a program, and the first one you will write.',
  pages: [
    {
      id: 'c1p1',
      title: 'What C++ actually is',
      lede: 'A language for telling a computer exactly what to do, with nothing hidden.',
      body: 'C++ is a **compiled** language. You write plain text, a program called a compiler turns it into machine instructions, and the result runs on its own — no interpreter standing between your code and the processor.\n\nThat is why C++ is used where speed and control matter: games, browsers, databases, aeroplanes, trading systems. It asks more of you than JavaScript or Python, and gives back exactness in return. Nothing happens that you did not write.',
      code: `// Every C++ program is text like this, saved in a .cpp file.
#include <iostream>

int main() {
    std::cout << "Salam, world!\\n";
    return 0;
}`,
      output: 'Salam, world!',
      points: [
        'C++ is compiled: source text in, a standalone program out.',
        'It gives you direct control over memory and speed.',
        'Files end in .cpp, and headers end in .h or .hpp.',
      ],
    },
    {
      id: 'c1p2',
      title: 'From text to a running program',
      lede: 'Four steps happen between saving the file and seeing output.',
      body: 'The **preprocessor** runs first and handles every line starting with `#`, pasting in the files you include. The **compiler** then turns your code into object code, one file at a time, and complains about anything it does not understand.\n\nThe **linker** joins your object files together with the library code they use and produces one executable. Finally you **run** it. Each step can fail, and the error messages look different — knowing which step you are in saves hours.',
      code: `# On the command line, with the GNU compiler:
g++ -std=c++17 -Wall main.cpp -o hello

# then run it
./hello`,
      file: 'terminal',
      output: 'Salam, world!',
      points: [
        'Preprocess, compile, link, run — in that order.',
        '"undefined reference" is a linker error, not a compiler error.',
        '-Wall turns on the warnings that catch real bugs.',
      ],
      tip: 'Always compile with -Wall. A warning you ignore today is a crash next week.',
    },
    {
      id: 'c1p3',
      title: 'Your first program, line by line',
      lede: 'Six lines, and every one of them earns its place.',
      body: '`#include <iostream>` brings in the input and output tools. `int main()` is where every C++ program begins — the operating system calls it, and nothing runs before it.\n\n`std::cout` is the standard output stream, and `<<` pushes values into it. `return 0;` tells the system the program finished without trouble; any other number means something went wrong.',
      code: `#include <iostream>        // input/output tools

int main() {                 // the program starts here
    std::cout << "Hello!";   // send text to the screen
    return 0;                // 0 means "all good"
}`,
      output: 'Hello!',
      points: [
        'main is the entry point. Exactly one program has exactly one main.',
        'std::cout writes, << sends a value into the stream.',
        'Every statement ends with a semicolon.',
      ],
    },
    {
      id: 'c1p4',
      title: 'Statements and semicolons',
      lede: 'A statement is one instruction, and it ends in a semicolon.',
      body: 'C++ does not care about line breaks or indentation. It reads statements, and it knows a statement has ended when it meets a `;`. That is why a missing semicolon produces a confusing error on the *next* line: the compiler was still reading.\n\nCurly braces `{ }` group statements into a block. A block is treated as a single unit — the body of a function, a loop, or an `if`.',
      code: `int main() {
    int a = 2; int b = 3;          // two statements on one line: legal
    std::cout
        << a + b                    // one statement over three lines: also legal
        << "\\n";
    return 0;
}`,
      output: '5',
      points: [
        'Line breaks mean nothing; semicolons mean everything.',
        'A missing ; usually reports an error on the line after the mistake.',
        'Braces group statements into one block.',
      ],
    },
    {
      id: 'c1p5',
      title: 'Comments',
      lede: 'Notes for humans that the compiler throws away.',
      body: 'Use `//` for a comment to the end of the line, and `/* ... */` for a block that spans lines. The compiler deletes both before it reads anything.\n\nGood comments say **why**, not what. The code already says what it does; what it cannot say is the reason you chose this way over the obvious one.',
      code: `// Bad: repeats the code
int n = n + 1;  // add one to n

/* Good: explains the decision.
   Prices arrive in cents so we never
   store money in a double. */
long long cents = 1999;`,
      points: [
        '// to end of line, /* */ for a block.',
        'Comments cost nothing at runtime — they are gone before compiling.',
        'Explain why. The code already shows what.',
      ],
    },
    {
      id: 'c1p6',
      title: 'Printing more than one thing',
      lede: 'Chain << as many times as you like.',
      body: 'Each `<<` sends one value and hands the stream back, so you can chain them. Numbers, text, characters and variables can all go into the same line.\n\n`"\\n"` starts a new line. `std::endl` does the same and also flushes the buffer, which is slower — prefer `"\\n"` unless you truly need the flush.',
      code: `#include <iostream>

int main() {
    int age = 14;
    std::cout << "I am " << age << " years old.\\n";
    std::cout << "Next year: " << age + 1 << "\\n";
    return 0;
}`,
      output: 'I am 14 years old.\nNext year: 15',
      points: [
        'Chain values with <<; the stream is passed along each time.',
        '"\\n" is a newline. std::endl also flushes, which is slower.',
        'Expressions are worked out before they are printed.',
      ],
    },
    {
      id: 'c1p7',
      title: 'When the compiler shouts at you',
      lede: 'Read the first error, fix it, compile again.',
      body: 'One mistake often produces a wall of errors, because the compiler keeps going and gets more confused. **Always fix the first one and recompile.** Half the wall usually disappears.\n\nErrors stop the build. Warnings do not, but they are the compiler telling you it found something that is legal and almost certainly wrong.',
      code: `int main() {
    std::cout << "Hi";   // error: 'cout' is not a member of 'std'
    return 0;
}
// Cause: <iostream> was never included.`,
      output: "error: 'cout' is not a member of 'std'",
      points: [
        'Fix the first error, then recompile. Do not read the whole wall.',
        'Errors stop the build; warnings do not, but they still matter.',
        'Most "not declared" errors mean a missing #include.',
      ],
      tip: 'Copy the error message into a search engine with the word "C++". Someone has hit it before.',
    },
    {
      id: 'c1p8',
      title: 'std:: and namespaces',
      lede: 'Everything in the standard library lives inside std.',
      body: 'A **namespace** is a surname for code. The standard library lives in `std`, which is why it is `std::cout` and `std::string` — cout belonging to std.\n\nYou will see `using namespace std;` in old tutorials. It drops the surname everywhere, and in real programs that causes name collisions. Prefer writing `std::`, or bring in single names with `using std::cout;`.',
      code: `#include <iostream>
#include <string>

int main() {
    std::string name = "Aisuluu";     // clear where it comes from
    using std::cout;                  // one name, on purpose
    cout << "Hi, " << name << "\\n";
    return 0;
}`,
      output: 'Hi, Aisuluu',
      points: [
        'std:: is the standard library namespace.',
        'Avoid "using namespace std;" in anything that grows.',
        '"using std::cout;" pulls in one name, which is safe.',
      ],
    },
    {
      id: 'c1p9',
      title: 'How to read this book',
      lede: 'One page, one idea, in order.',
      body: 'Every page is a single idea with a sample you can type out. Type them — do not copy. Typing forces you to read every character, and the errors you make while typing teach you more than the working version.\n\nThe note pad at the bottom of each page is yours. Write the idea in your own words before moving on; it is the difference between recognising something and knowing it.',
      points: [
        'Type the samples out by hand.',
        'Write a note in your own words before you move on.',
        'Arrow keys turn the page.',
      ],
    },
  ],
};
