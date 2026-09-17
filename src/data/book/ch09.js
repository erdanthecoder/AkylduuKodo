export default {
  id: 'c9',
  title: 'Pointers and memory',
  blurb: 'Addresses, references, the heap, and how not to lose it.',
  pages: [
    {
      id: 'c9p1',
      title: 'Memory and addresses',
      lede: 'Every variable lives somewhere, and that somewhere has a number.',
      body: 'Memory is one long row of numbered bytes. A variable occupies some of them, and the number of its first byte is its **address**.\n\n`&x` gives you that address. Printing one shows a hexadecimal number that differs every run — which is the operating system deliberately moving things about.',
      code: `#include <iostream>

int main() {
    int x = 42;
    double d = 1.5;
    std::cout << &x << "\\n";
    std::cout << sizeof(x) << " bytes\\n";
    std::cout << sizeof(d) << " bytes\\n";
    return 0;
}`,
      output: '0x7ffd4c2a1b4c\n4 bytes\n8 bytes',
      points: [
        '&x is the address of x.',
        'sizeof tells you how many bytes a type takes.',
        'Addresses change between runs — that is normal.',
      ],
    },
    {
      id: 'c9p2',
      title: 'What a pointer is',
      lede: 'A variable that holds an address.',
      body: '`int* p = &x;` declares a pointer to an int and stores the address of `x` in it. The `*` in the declaration is part of the type.\n\n`*p` — the same symbol used differently — means "the value at that address". Writing to `*p` writes to `x`.',
      code: `#include <iostream>

int main() {
    int x = 42;
    int* p = &x;          // p points at x

    std::cout << p << "\\n";    // the address
    std::cout << *p << "\\n";   // the value: 42
    *p = 99;                    // writes through the pointer
    std::cout << x << "\\n";    // 99
    return 0;
}`,
      output: '0x7ffd4c2a1b4c\n42\n99',
      points: [
        'int* p — p holds the address of an int.',
        '*p reads or writes the value at that address.',
        'Writing through a pointer changes the original.',
      ],
    },
    {
      id: 'c9p3',
      title: 'nullptr',
      lede: 'A pointer that deliberately points at nothing.',
      body: '`nullptr` is the "points nowhere" value. Initialise every pointer — to a real address or to `nullptr` — so you never carry a random one.\n\nDereferencing a null pointer crashes the program. Check before you use one whose origin you do not control.',
      code: `#include <iostream>

int* findEven(int* data, int n) {
    for (int i = 0; i < n; ++i) if (data[i] % 2 == 0) return &data[i];
    return nullptr;                     // honest "not found"
}

int main() {
    int v[3] = {1, 3, 5};
    int* found = findEven(v, 3);
    if (found == nullptr) std::cout << "none\\n";
    else std::cout << *found << "\\n";
    return 0;
}`,
      output: 'none',
      points: [
        'nullptr means "points at nothing".',
        'Never leave a pointer uninitialised.',
        'Dereferencing null is an immediate crash.',
      ],
    },
    {
      id: 'c9p4',
      title: 'References',
      lede: 'Another name for an existing variable.',
      body: 'A reference, `int& r = x;`, is an alias. Everything you do to `r` happens to `x`. There is no separate object and no `*` needed.\n\nA reference must be set when it is created and can never be pointed at something else. That makes it safer than a pointer, and the right default for parameters.',
      code: `#include <iostream>

int main() {
    int x = 10;
    int& r = x;        // r IS x
    r += 5;
    std::cout << x << "\\n";     // 15

    int y = 100;
    r = y;             // copies y into x — does NOT rebind
    std::cout << x << " " << y << "\\n";
    return 0;
}`,
      output: '15\n100 100',
      points: [
        'A reference must be initialised and never rebinds.',
        'No * needed — it behaves as the variable itself.',
        'Prefer references to pointers when null is not a case.',
      ],
    },
    {
      id: 'c9p5',
      title: 'Pointers and arrays',
      lede: 'An array name decays into a pointer to its first element.',
      body: 'Pass an array to a function and what actually arrives is a pointer — the size is lost. That is why C-style code passes the length alongside.\n\nPointer arithmetic moves in **elements**, not bytes: `p + 1` on an int pointer advances four bytes.',
      code: `#include <iostream>

void show(int* data, int n) {            // size had to come too
    for (int i = 0; i < n; ++i) std::cout << *(data + i) << " ";
}

int main() {
    int v[4] = {10, 20, 30, 40};
    std::cout << *v << " " << *(v + 2) << "\\n";
    show(v, 4);
    return 0;
}`,
      output: '10 30\n10 20 30 40',
      points: [
        'An array decays to a pointer; the length is lost.',
        'p + 1 moves one element, not one byte.',
        'v[i] is exactly *(v + i).',
      ],
    },
    {
      id: 'c9p6',
      title: 'The stack and the heap',
      lede: 'Two kinds of memory with two different lifetimes.',
      body: 'Locals live on the **stack**: created on entry, destroyed at the closing brace, fast and automatic. The stack is small, a few megabytes.\n\nThe **heap** is the large pool you ask for explicitly with `new`. It lives until you free it, which is powerful and is where memory leaks come from.',
      code: `#include <iostream>

int main() {
    int onStack = 5;               // gone at the end of main

    int* onHeap = new int(5);      // lives until deleted
    std::cout << *onHeap << "\\n";
    delete onHeap;                 // give it back
    onHeap = nullptr;              // and do not keep the old address
    return 0;
}`,
      output: '5',
      points: [
        'Stack: automatic, fast, small, scoped.',
        'Heap: manual, large, lives until deleted.',
        'Every new needs exactly one delete.',
      ],
    },
    {
      id: 'c9p7',
      title: 'Leaks, double frees and dangling pointers',
      lede: 'The three ways manual memory goes wrong.',
      body: 'A **leak** is `new` without `delete` — the memory is never returned. A **double free** deletes the same address twice and corrupts the allocator. A **dangling pointer** still holds an address that has been deleted; using it is undefined behaviour.\n\nAll three are why modern C++ prefers containers and smart pointers, which do the bookkeeping for you.',
      code: `int* p = new int(1);
// delete p;        <-- missing: leak

int* q = new int(2);
delete q;
// delete q;        <-- second delete: corruption
// std::cout << *q; <-- dangling: undefined behaviour
q = nullptr;        // the habit that saves you`,
      points: [
        'new without delete leaks.',
        'delete twice corrupts the heap.',
        'Set a pointer to nullptr after deleting it.',
      ],
      tip: 'Compile with -fsanitize=address while developing. It finds all three instantly.',
    },
    {
      id: 'c9p8',
      title: 'Smart pointers',
      lede: 'Pointers that free themselves.',
      body: '`std::unique_ptr` from `<memory>` owns a heap object and deletes it automatically when it goes out of scope. There is exactly one owner; it cannot be copied, only moved.\n\n`std::shared_ptr` counts owners and frees when the last one goes. It costs a little more, so reach for `unique_ptr` first.',
      code: `#include <iostream>
#include <memory>

int main() {
    auto p = std::make_unique<int>(42);
    std::cout << *p << "\\n";
    // no delete needed — freed at the closing brace

    auto s1 = std::make_shared<int>(7);
    auto s2 = s1;                            // two owners
    std::cout << *s2 << " owners: " << s1.use_count() << "\\n";
    return 0;
}`,
      output: '42\n7 owners: 2',
      points: [
        'make_unique / make_shared instead of raw new.',
        'unique_ptr: one owner, zero overhead.',
        'shared_ptr: counted owners, freed at the last one.',
      ],
    },
    {
      id: 'c9p9',
      title: 'When to use what',
      lede: 'A short decision list you can trust.',
      body: 'Most C++ code should touch raw pointers rarely. Use a value if you can; a reference to borrow it; a container to hold many; a smart pointer if it must live on the heap.\n\nA raw pointer is fine as a **non-owning** observer — something that points at an object owned elsewhere and never deletes it.',
      code: `// A sequence of values:        std::vector<T>
// Borrow without copying:      const T&
// Optional, may be absent:     T* (non-owning) or std::optional<T>
// Heap object, one owner:      std::unique_ptr<T>
// Heap object, shared:         std::shared_ptr<T>
// Raw new/delete:              almost never`,
      points: [
        'Values and references first, always.',
        'unique_ptr for heap ownership.',
        'Raw pointers only to observe, never to own.',
      ],
    },
  ],
};
