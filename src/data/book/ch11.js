export default {
  id: 'c11',
  title: 'Objects working together',
  blurb: 'Inheritance, virtual functions, polymorphism and the alternatives.',
  pages: [
    {
      id: 'c11p1',
      title: 'Inheritance',
      lede: 'A new type that starts as a copy of an old one.',
      body: 'A derived class gets every member of its base and can add more. Write `class Dog : public Animal`. The `public` matters: it says a Dog **is an** Animal and can be used wherever one is expected.\n\nThe base constructor runs first, then the derived one. Destructors run in the opposite order.',
      code: `#include <iostream>
#include <string>

class Animal {
protected:
    std::string name;
public:
    Animal(std::string n) : name(std::move(n)) {}
    void sleep() const { std::cout << name << " sleeps\\n"; }
};

class Dog : public Animal {
public:
    Dog(std::string n) : Animal(std::move(n)) {}
    void bark() const { std::cout << name << " barks\\n"; }
};

int main() {
    Dog d("Akbar");
    d.sleep();
    d.bark();
    return 0;
}`,
      output: 'Akbar sleeps\nAkbar barks',
      points: [
        'class Derived : public Base',
        'protected members are visible to derived classes.',
        'Base constructs first, destructs last.',
      ],
    },
    {
      id: 'c11p2',
      title: 'virtual functions',
      lede: 'Let the derived class change what a function does.',
      body: 'Mark a base function `virtual` and a derived class may `override` it. When you call it through a base pointer or reference, the **derived** version runs.\n\nWithout `virtual`, the call is decided by the pointer type at compile time, and the base version runs — the single most common surprise in C++ inheritance.',
      code: `#include <iostream>

class Shape {
public:
    virtual double area() const { return 0; }
    virtual ~Shape() = default;
};

class Circle : public Shape {
    double r;
public:
    Circle(double radius) : r(radius) {}
    double area() const override { return 3.14159 * r * r; }
};

int main() {
    Circle c(2);
    Shape& s = c;
    std::cout << s.area() << "\\n";   // Circle's version: 12.57
    return 0;
}`,
      output: '12.5664',
      points: [
        'virtual in the base, override in the derived class.',
        'Without virtual, the base version runs.',
        'override makes the compiler check you matched the signature.',
      ],
    },
    {
      id: 'c11p3',
      title: 'Polymorphism',
      lede: 'One loop, many different types.',
      body: 'Because a base pointer can hold any derived object, a single container can hold a mixture and one loop can treat them all the same. Each one does its own thing.\n\nThis is what inheritance is actually for. If you are not calling virtual functions through a base handle, you probably wanted composition instead.',
      code: `#include <iostream>
#include <vector>
#include <memory>

struct Shape { virtual double area() const = 0; virtual ~Shape() = default; };
struct Square : Shape { double s; Square(double v):s(v){} double area() const override { return s*s; } };
struct Circle : Shape { double r; Circle(double v):r(v){} double area() const override { return 3.14159*r*r; } };

int main() {
    std::vector<std::unique_ptr<Shape>> shapes;
    shapes.push_back(std::make_unique<Square>(3));
    shapes.push_back(std::make_unique<Circle>(1));
    double total = 0;
    for (const auto& s : shapes) total += s->area();
    std::cout << total << "\\n";
    return 0;
}`,
      output: '12.1416',
      points: [
        'Store base pointers to keep mixed types together.',
        'The right override runs for each object.',
        'unique_ptr<Base> is the usual way to own them.',
      ],
    },
    {
      id: 'c11p4',
      title: 'Abstract classes',
      lede: 'A base that cannot be built on its own.',
      body: '`= 0` makes a virtual function **pure**: it has no body and every derived class must supply one. A class with a pure virtual function is abstract and cannot be instantiated.\n\nThat is how you describe an interface — a contract that says "anything calling itself a Shape can tell me its area".',
      code: `class Shape {
public:
    virtual double area() const = 0;      // pure virtual
    virtual void draw() const = 0;
    virtual ~Shape() = default;
};

// Shape s;            // error: cannot instantiate an abstract class

class Dot : public Shape {
public:
    double area() const override { return 0; }
    void draw() const override { /* ... */ }
};`,
      points: [
        '= 0 makes a pure virtual function.',
        'A class with one is abstract and cannot be created.',
        'Derived classes must implement every pure function.',
      ],
    },
    {
      id: 'c11p5',
      title: 'Virtual destructors',
      lede: 'Delete through a base pointer and you must have one.',
      body: 'If you delete a derived object through a base pointer and the base destructor is **not** virtual, only the base part is destroyed. The derived part leaks, silently.\n\nThe rule is simple: any class meant to be inherited from gets a virtual destructor, usually `virtual ~Base() = default;`.',
      code: `#include <iostream>

struct Bad { ~Bad() { std::cout << "Bad\\n"; } };
struct BadChild : Bad { ~BadChild() { std::cout << "BadChild\\n"; } };

struct Good { virtual ~Good() { std::cout << "Good\\n"; } };
struct GoodChild : Good { ~GoodChild() override { std::cout << "GoodChild\\n"; } };

int main() {
    Bad* b = new BadChild;  delete b;    // only "Bad"
    Good* g = new GoodChild; delete g;   // both
    return 0;
}`,
      output: 'Bad\nGoodChild\nGood',
      points: [
        'Any base class you delete through needs a virtual destructor.',
        'Without it the derived part is never destroyed.',
        'virtual ~Base() = default; costs one line.',
      ],
    },
    {
      id: 'c11p6',
      title: 'Object slicing',
      lede: 'Copying a derived object into a base variable loses the rest.',
      body: 'Assign a `Circle` to a `Shape` **by value** and only the Shape part is copied. The extra members are sliced off and the virtual dispatch is gone.\n\nIt compiles without a murmur. This is why polymorphism uses pointers or references, never values.',
      code: `#include <iostream>

struct Shape { virtual const char* name() const { return "Shape"; } };
struct Circle : Shape { const char* name() const override { return "Circle"; } };

int main() {
    Circle c;
    Shape sliced = c;              // the Circle part is cut away
    Shape& ref = c;                // no copy at all
    std::cout << sliced.name() << " " << ref.name() << "\\n";
    return 0;
}`,
      output: 'Shape Circle',
      points: [
        'Copying a derived object into a base value slices it.',
        'It compiles silently and behaves wrongly.',
        'Use Base& or Base* for polymorphism.',
      ],
    },
    {
      id: 'c11p7',
      title: 'Composition over inheritance',
      lede: 'Has-a is usually better than is-a.',
      body: 'Inheritance couples two types together permanently. Composition — holding an object as a member — is looser, easier to change, and easier to test.\n\nAsk which sentence is true. A Car **is a** Vehicle: inheritance may fit. A Car **has an** Engine: composition, certainly.',
      code: `#include <iostream>

class Engine {
public:
    void start() { std::cout << "Engine running\\n"; }
};

class Car {
    Engine engine;                 // Car HAS an Engine
public:
    void drive() { engine.start(); std::cout << "Driving\\n"; }
};

int main() { Car c; c.drive(); return 0; }`,
      output: 'Engine running\nDriving',
      points: [
        '"is a" suggests inheritance; "has a" means composition.',
        'Composition is easier to change later.',
        'Reach for inheritance only when you need polymorphism.',
      ],
    },
    {
      id: 'c11p8',
      title: 'Encapsulation in practice',
      lede: 'Keep the data private and the rules in one place.',
      body: 'The point of private data is not secrecy — it is that every change goes through code you control, so the rules cannot be broken from outside.\n\nAvoid a getter and a setter for every member; that is public data in a costume. Expose operations that mean something in your problem.',
      code: `class BankAccount {
    long long cents = 0;
public:
    // Not: setBalance(x) — that lets anyone write anything.
    void deposit(long long amount) {
        if (amount > 0) cents += amount;
    }
    bool withdraw(long long amount) {
        if (amount <= 0 || amount > cents) return false;
        cents -= amount;
        return true;
    }
    long long balance() const { return cents; }
};`,
      points: [
        'Private data plus meaningful operations.',
        'A getter and setter for everything is just public data.',
        'Rules belong inside the type that owns the data.',
      ],
    },
    {
      id: 'c11p9',
      title: 'The rule of zero, three and five',
      lede: 'Which special functions you must write, and when.',
      body: 'If your class holds only values and containers, write **none** of the copy, move and destructor functions — the defaults are right. That is the rule of zero, and it should be your normal case.\n\nIf you manage a raw resource, you need the destructor, the copy constructor and copy assignment (rule of three), plus the move pair in modern C++ (rule of five). Better: wrap the resource in a type that already does it.',
      code: `// Rule of zero — nothing special needed
class Profile {
    std::string name;
    std::vector<int> scores;
};   // copy, move and destroy all work correctly for free

// If you ever write one of these five, think hard about the other four:
//   ~T();  T(const T&);  T& operator=(const T&);  T(T&&);  T& operator=(T&&);`,
      points: [
        'Rule of zero: hold values, write none of them.',
        'Write one of the five and you probably need all five.',
        'Wrapping the resource is better than managing it.',
      ],
    },
  ],
};
