export default {
  id: 'c14',
  title: 'Modern C++',
  blurb: 'Templates, move semantics, enums, namespaces and the features worth knowing.',
  pages: [
    {
      id: 'c14p1',
      title: 'Function templates',
      lede: 'Write it once, for every type.',
      body: 'A template is a pattern the compiler fills in. `template <typename T>` introduces a type name, and the compiler generates a real function for each type you use it with.\n\nThere is no runtime cost: each instantiation is compiled as if you had written it by hand.',
      code: `#include <iostream>
#include <string>

template <typename T>
T biggest(T a, T b) { return a > b ? a : b; }

int main() {
    std::cout << biggest(3, 9) << "\\n";
    std::cout << biggest(2.5, 1.5) << "\\n";
    std::cout << biggest(std::string("apple"), std::string("pear")) << "\\n";
    return 0;
}`,
      output: '9\n2.5\npear',
      points: [
        'template <typename T> before the function.',
        'The compiler makes one real function per type used.',
        'No runtime cost — it is all resolved at compile time.',
      ],
    },
    {
      id: 'c14p2',
      title: 'Class templates',
      lede: 'A whole type, parameterised.',
      body: 'Classes take template parameters too — that is exactly what `std::vector<int>` is. Write `template <typename T>` before the class and use `T` inside as an ordinary type.\n\nTemplate code normally lives entirely in the header, because the compiler needs the body at every place it is used.',
      code: `#include <iostream>
#include <vector>

template <typename T>
class Stack {
    std::vector<T> items;
public:
    void push(const T& v) { items.push_back(v); }
    T pop() { T v = items.back(); items.pop_back(); return v; }
    bool empty() const { return items.empty(); }
};

int main() {
    Stack<int> s;
    s.push(1); s.push(2);
    std::cout << s.pop() << s.pop() << "\\n";
    return 0;
}`,
      output: '21',
      points: [
        'template <typename T> class Name { ... };',
        'Use it as Name<int>, Name<std::string>.',
        'Template definitions belong in the header.',
      ],
    },
    {
      id: 'c14p3',
      title: 'enum class',
      lede: 'A named set of values that cannot be confused.',
      body: 'An `enum class` creates a small type with named values. Unlike the old plain `enum`, the names are scoped — `Colour::Red` — and it will not silently convert to `int`.\n\nUse one wherever a variable has a fixed set of states. It makes `switch` exhaustive and stops you passing a day-of-week where a month was expected.',
      code: `#include <iostream>

enum class Status { Waiting, Running, Done };

const char* text(Status s) {
    switch (s) {
        case Status::Waiting: return "waiting";
        case Status::Running: return "running";
        case Status::Done:    return "done";
    }
    return "?";
}

int main() {
    Status s = Status::Running;
    std::cout << text(s) << "\\n";
    return 0;
}`,
      output: 'running',
      points: [
        'enum class scopes the names and blocks conversions.',
        'Use it for any fixed set of states.',
        'The compiler warns when a switch misses a case.',
      ],
    },
    {
      id: 'c14p4',
      title: 'namespaces',
      lede: 'Your own surname for your own code.',
      body: 'Wrap your code in a namespace and its names cannot collide with anyone else\'s. Inside the namespace, names are used plainly; outside, they need the prefix.\n\nNested namespaces can be written with `::` since C++17: `namespace app::util { }`.',
      code: `#include <iostream>

namespace geometry {
    const double PI = 3.14159265358979;
    double circleArea(double r) { return PI * r * r; }
}

int main() {
    std::cout << geometry::circleArea(2) << "\\n";
    namespace g = geometry;                  // a short alias
    std::cout << g::PI << "\\n";
    return 0;
}`,
      output: '12.5664\n3.14159',
      points: [
        'namespace name { ... } groups your code.',
        'Reach in with name::thing.',
        'namespace alias = long::nested::name; shortens it.',
      ],
    },
    {
      id: 'c14p5',
      title: 'Copies cost, moves do not',
      lede: 'Why move semantics exist.',
      body: 'Returning a big vector used to copy every element. **Move semantics** let a value hand over its internal buffer instead: the source is left empty, the destination takes the memory, and nothing is duplicated.\n\nIt happens automatically for temporaries. `std::move` asks for it explicitly, and afterwards the source is valid but unspecified — do not read it.',
      code: `#include <iostream>
#include <vector>
#include <string>

int main() {
    std::vector<int> big(1000, 7);
    std::vector<int> copied = big;              // copies 1000 ints
    std::vector<int> moved = std::move(big);    // steals the buffer

    std::cout << copied.size() << " " << moved.size() << " " << big.size() << "\\n";
    return 0;
}`,
      output: '1000 1000 0',
      points: [
        'A move transfers the buffer instead of copying it.',
        'It happens automatically for temporaries.',
        'After std::move, do not read the source.',
      ],
    },
    {
      id: 'c14p6',
      title: 'auto, decltype and structured bindings',
      lede: 'Three ways to stop writing types out.',
      body: '`auto` deduces from the initialiser. `decltype(expr)` gives the type of an expression without evaluating it. **Structured bindings** unpack a pair, tuple or struct into named variables.\n\nTogether they cut a lot of noise, especially when walking a map.',
      code: `#include <iostream>
#include <map>
#include <string>

int main() {
    std::map<std::string, int> m = {{"a", 1}, {"b", 2}};
    for (const auto& [key, value] : m) {
        std::cout << key << "=" << value << " ";
    }
    std::cout << "\\n";
    int x = 5;
    decltype(x) y = 10;          // y is an int
    std::cout << x + y << "\\n";
    return 0;
}`,
      output: 'a=1 b=2 \n15',
      points: [
        'auto deduces from the value on the right.',
        'decltype(e) is the type of e, unevaluated.',
        'auto [a, b] = pair; names both halves.',
      ],
    },
    {
      id: 'c14p7',
      title: 'constexpr',
      lede: 'Work the compiler does so the program does not have to.',
      body: 'A `constexpr` function can run at compile time when its arguments are known then. The result is baked into the program — zero runtime cost.\n\nIt is not magic: the function must be simple enough for the compiler to evaluate. If it cannot, it simply runs normally at runtime.',
      code: `#include <iostream>

constexpr int factorial(int n) {
    return n <= 1 ? 1 : n * factorial(n - 1);
}

int main() {
    constexpr int f = factorial(5);       // computed while compiling
    int arr[factorial(4)] = {};           // 24 — a compile-time size
    std::cout << f << " " << sizeof(arr) / sizeof(int) << "\\n";
    return 0;
}`,
      output: '120 24',
      points: [
        'constexpr may run at compile time.',
        'The result can size an array or be a template argument.',
        'If it cannot be evaluated early, it runs normally.',
      ],
    },
    {
      id: 'c14p8',
      title: 'Which standard am I using?',
      lede: 'C++11, 14, 17, 20 — and what each one gave you.',
      body: 'The language grows every three years. **C++11** brought `auto`, lambdas, range-for, `nullptr` and move semantics — the split between old and modern C++. **C++14** and **17** added structured bindings, `optional`, `filesystem`, and `if` with an initialiser.\n\n**C++20** added concepts, ranges and modules. Tell the compiler which one you want with `-std=c++17`; without it you may be getting a decade-old default.',
      code: `#include <iostream>

int main() {
    std::cout << __cplusplus << "\\n";
    // 201103 = C++11, 201402 = C++14,
    // 201703 = C++17, 202002 = C++20
    return 0;
}`,
      output: '201703',
      points: [
        'C++11 is the line between old and modern style.',
        'Compile with -std=c++17 at least.',
        '__cplusplus tells you what you actually got.',
      ],
    },
    {
      id: 'c14p9',
      title: 'Modern style in one page',
      lede: 'The habits that separate current C++ from 1998.',
      body: 'Prefer `std::vector` and `std::string` to raw arrays and `char*`. Prefer smart pointers to `new` and `delete`. Prefer algorithms to hand-written loops, `enum class` to plain `enum`, and `nullptr` to `NULL`.\n\nMost importantly: let objects own their resources so destructors do the cleaning. Almost every rule above is a consequence of that one.',
      code: `// Old                          // Modern
// char name[50];                std::string name;
// int* a = new int[n];          std::vector<int> a(n);
// delete[] a;                   // nothing to write
// NULL                          nullptr
// typedef int Id;               using Id = int;
// enum Colour { RED };          enum class Colour { Red };
// for (int i=0;i<n;++i)         for (const auto& x : items)`,
      points: [
        'Containers instead of raw arrays.',
        'Smart pointers instead of new and delete.',
        'Let destructors do the cleanup.',
      ],
    },
  ],
};
