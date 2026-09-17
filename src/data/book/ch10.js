export default {
  id: 'c10',
  title: 'Structs and classes',
  blurb: 'Making your own types, with data and behaviour together.',
  pages: [
    {
      id: 'c10p1',
      title: 'struct — grouping data',
      lede: 'One name for several related values.',
      body: 'A `struct` bundles values into a new type. Instead of three loose variables you get one `Student` with a name, an age and a mark.\n\nAccess the parts with a dot. A struct can be copied, returned from a function and stored in a vector like any other value.',
      code: `#include <iostream>
#include <string>

struct Student {
    std::string name;
    int age;
    double mark;
};

int main() {
    Student s{"Aisuluu", 14, 87.5};
    std::cout << s.name << " scored " << s.mark << "\\n";
    s.mark += 2;
    std::cout << s.mark << "\\n";
    return 0;
}`,
      output: 'Aisuluu scored 87.5\n89.5',
      points: [
        'struct Name { members; };  — note the semicolon.',
        'Reach members with a dot.',
        'Structs copy, return and store like any value.',
      ],
    },
    {
      id: 'c10p2',
      title: 'Structs in containers',
      lede: 'A vector of your own type.',
      body: 'Once you have a type, a `std::vector<Student>` holds as many as you like, and range-for walks them.\n\nSorting works too, if you tell `std::sort` how to compare them — usually with a small lambda naming the member.',
      code: `#include <iostream>
#include <vector>
#include <string>
#include <algorithm>

struct Student { std::string name; double mark; };

int main() {
    std::vector<Student> cls = {{"Nur", 72}, {"Aida", 91}, {"Bek", 84}};
    std::sort(cls.begin(), cls.end(),
              [](const Student& a, const Student& b) { return a.mark > b.mark; });
    for (const auto& s : cls) std::cout << s.name << " " << s.mark << "\\n";
    return 0;
}`,
      output: 'Aida 91\nBek 84\nNur 72',
      points: [
        'vector<YourType> works out of the box.',
        'Pass a comparator to sort by a member.',
        'Take const auto& in the loop to avoid copies.',
      ],
    },
    {
      id: 'c10p3',
      title: 'Adding behaviour',
      lede: 'Functions that live inside the type.',
      body: 'A function declared inside a struct is a **member function**. It can use the members directly, without qualification, because it is called on a particular object.\n\nMark it `const` when it does not change anything. That lets it be called on const objects, and documents the intent.',
      code: `#include <iostream>
#include <string>

struct Rectangle {
    double width, height;

    double area() const { return width * height; }
    bool isSquare() const { return width == height; }
    void scale(double f) { width *= f; height *= f; }
};

int main() {
    Rectangle r{3, 4};
    std::cout << r.area() << "\\n";
    r.scale(2);
    std::cout << r.area() << " " << r.isSquare() << "\\n";
    return 0;
}`,
      output: '12\n48 0',
      points: [
        'Member functions see the members directly.',
        'const after the brackets means "changes nothing".',
        'Call them with a dot, like a member.',
      ],
    },
    {
      id: 'c10p4',
      title: 'class and access control',
      lede: 'public, private, and why you would hide anything.',
      body: '`class` and `struct` are the same thing with one difference: members of a `struct` are public by default, members of a `class` are private.\n\nPrivate members can only be touched by the type\'s own functions. That lets you guarantee things — a `Temperature` that can never be below absolute zero, because nothing outside can set it.',
      code: `#include <iostream>

class Counter {
private:
    int value = 0;                       // nobody outside can touch this

public:
    void add(int n) { if (n > 0) value += n; }   // the rule lives here
    int get() const { return value; }
};

int main() {
    Counter c;
    c.add(5);
    c.add(-100);            // refused by the rule
    std::cout << c.get() << "\\n";
    return 0;
}`,
      output: '5',
      points: [
        'struct = public by default; class = private by default.',
        'Private members are reachable only from inside the type.',
        'Hiding data is how you enforce a rule.',
      ],
    },
    {
      id: 'c10p5',
      title: 'Constructors',
      lede: 'The function that sets an object up.',
      body: 'A constructor has the same name as the class and no return type. It runs when an object is created, so an object can never exist in a half-built state.\n\nUse the **initialiser list** — the part after the colon — to set members. It initialises them directly instead of default-building and then assigning.',
      code: `#include <iostream>
#include <string>

class Student {
    std::string name;
    int age;
public:
    Student(std::string n, int a) : name(std::move(n)), age(a) {}
    void print() const { std::cout << name << " (" << age << ")\\n"; }
};

int main() {
    Student s("Aibek", 15);
    s.print();
    return 0;
}`,
      output: 'Aibek (15)',
      points: [
        'Same name as the class, no return type.',
        'The : list initialises members directly.',
        'An object is fully built before anyone can use it.',
      ],
    },
    {
      id: 'c10p6',
      title: 'Several constructors',
      lede: 'Different ways to build the same thing.',
      body: 'Constructors overload like any function. A **default constructor** takes no arguments; if you write any constructor at all, you no longer get one for free.\n\nMark a single-argument constructor `explicit` to stop the compiler quietly converting values into your type behind your back.',
      code: `#include <iostream>

class Point {
    double x, y;
public:
    Point() : x(0), y(0) {}                  // default
    explicit Point(double v) : x(v), y(v) {} // no silent conversion
    Point(double a, double b) : x(a), y(b) {}
    void print() const { std::cout << x << "," << y << "\\n"; }
};

int main() {
    Point a; a.print();
    Point b(3); b.print();
    Point c(1, 2); c.print();
    return 0;
}`,
      output: '0,0\n3,3\n1,2',
      points: [
        'Write any constructor and the free default disappears.',
        'explicit blocks accidental implicit conversion.',
        'Overload constructors like any other function.',
      ],
    },
    {
      id: 'c10p7',
      title: 'Destructors and RAII',
      lede: 'The function that runs when an object goes away.',
      body: 'A destructor, `~ClassName()`, runs automatically when an object leaves scope. That is the hook that makes C++ safe without a garbage collector.\n\nThe idea is called **RAII**: acquire the resource in the constructor, release it in the destructor. A file opened by an object is closed when the object dies, even if an exception is thrown.',
      code: `#include <iostream>

class Timer {
    const char* label;
public:
    Timer(const char* l) : label(l) { std::cout << label << " started\\n"; }
    ~Timer() { std::cout << label << " finished\\n"; }
};

int main() {
    Timer t("Work");
    std::cout << "doing things\\n";
    return 0;                     // ~Timer runs here, whatever happens
}`,
      output: 'Work started\ndoing things\nWork finished',
      points: [
        '~Class() runs automatically at the end of scope.',
        'RAII: acquire in the constructor, release in the destructor.',
        'It still runs when an exception unwinds the stack.',
      ],
    },
    {
      id: 'c10p8',
      title: 'this',
      lede: 'A pointer to the object the function was called on.',
      body: 'Inside a member function, `this` points at the current object. You rarely need it — members are visible by name — but it is essential when a parameter shadows a member, or when you return the object for chaining.\n\n`return *this;` gives back a reference to the object itself, which is how `a.set(1).set(2)` works.',
      code: `#include <iostream>

class Box {
    int width = 0, height = 0;
public:
    Box& setWidth(int width) { this->width = width; return *this; }
    Box& setHeight(int height) { this->height = height; return *this; }
    int area() const { return width * height; }
};

int main() {
    Box b;
    std::cout << b.setWidth(4).setHeight(5).area() << "\\n";
    return 0;
}`,
      output: '20',
      points: [
        'this is a pointer to the current object.',
        'this->member disambiguates from a parameter.',
        'return *this; enables chained calls.',
      ],
    },
    {
      id: 'c10p9',
      title: 'static members',
      lede: 'One copy shared by every object of the type.',
      body: 'A `static` data member belongs to the class, not to any object — there is exactly one, shared by all. A `static` member function likewise has no object and cannot use `this`.\n\nUse them for counters, caches, and factory functions that build an object in a particular way.',
      code: `#include <iostream>

class User {
    static int count;
public:
    User() { ++count; }
    static int howMany() { return count; }
};
int User::count = 0;             // one definition, outside the class

int main() {
    User a, b, c;
    std::cout << User::howMany() << "\\n";
    return 0;
}`,
      output: '3',
      points: [
        'One static member exists for the whole class.',
        'Call a static function with Class::name().',
        'A static data member needs a definition outside the class.',
      ],
    },
    {
      id: 'c10p10',
      title: 'Operator overloading',
      lede: 'Teaching + and << what your type means.',
      body: 'You can define what the operators do for your own type. `operator+` for addition, `operator==` for comparison, `operator<<` so `cout` can print it.\n\nThe rule is restraint: only overload when the meaning is obvious. `+` on two vectors is clear; `+` on two users is not.',
      code: `#include <iostream>

struct Money {
    long long cents = 0;
    Money operator+(const Money& o) const { return Money{cents + o.cents}; }
    bool operator==(const Money& o) const { return cents == o.cents; }
};

std::ostream& operator<<(std::ostream& out, const Money& m) {
    return out << m.cents / 100 << "." << m.cents % 100;
}

int main() {
    Money a{1250}, b{399};
    std::cout << a + b << "\\n";
    std::cout << (a == b) << "\\n";
    return 0;
}`,
      output: '16.49\n0',
      points: [
        'operator+ , operator== , operator<< and the rest.',
        'operator<< is a free function taking std::ostream&.',
        'Only overload when the meaning is unmistakable.',
      ],
    },
    {
      id: 'c10p11',
      title: 'const correctness',
      lede: 'Say what cannot change, everywhere.',
      body: 'Mark member functions `const` when they do not modify the object, and take parameters as `const T&` when you only read them. The compiler then enforces the promise everywhere.\n\nIt is worth the discipline: const-correct code can be reasoned about locally, and a const object can only call const functions, so mistakes are caught at compile time.',
      code: `class Circle {
    double r;
public:
    Circle(double radius) : r(radius) {}
    double radius() const { return r; }      // reads only
    void setRadius(double v) { r = v; }      // changes
};

void report(const Circle& c) {
    c.radius();        // fine
    // c.setRadius(3); // error: c is const
}`,
      points: [
        'const after a member function means "does not modify".',
        'const objects can only call const functions.',
        'Take read-only parameters as const T&.',
      ],
      tip: 'Start const and remove it when the compiler makes you. Doing it the other way round never happens.',
    },
  ],
};
