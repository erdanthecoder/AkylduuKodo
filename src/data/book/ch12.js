export default {
  id: 'c12',
  title: 'The standard library',
  blurb: 'Containers, iterators, algorithms and lambdas — the code you do not have to write.',
  pages: [
    {
      id: 'c12p1',
      title: 'Iterators',
      lede: 'A position in a container, and the way everything connects.',
      body: 'An iterator points at an element. `begin()` gives the first, `end()` gives one **past** the last — a marker, not an element, which is why you never dereference `end()`.\n\nEvery container provides them, and every algorithm takes them. That is the whole design: containers and algorithms know nothing about each other.',
      code: `#include <iostream>
#include <vector>

int main() {
    std::vector<int> v = {10, 20, 30};
    for (auto it = v.begin(); it != v.end(); ++it) {
        std::cout << *it << " ";
    }
    std::cout << "\\n" << *(v.end() - 1) << "\\n";   // last element
    return 0;
}`,
      output: '10 20 30 \n30',
      points: [
        'begin() is the first, end() is one past the last.',
        'Never dereference end().',
        'Iterators are the glue between containers and algorithms.',
      ],
    },
    {
      id: 'c12p2',
      title: 'Lambdas',
      lede: 'A small function written where it is used.',
      body: 'A lambda is `[capture](parameters) { body }`. It makes a callable object on the spot, which is what most algorithms want.\n\nThe capture list says what from the surrounding scope the lambda can see: `[]` nothing, `[x]` a copy of x, `[&x]` a reference to it, `[&]` everything by reference.',
      code: `#include <iostream>
#include <vector>
#include <algorithm>

int main() {
    int limit = 50;
    std::vector<int> v = {12, 80, 33, 91, 7};

    auto small = [limit](int n) { return n < limit; };
    std::cout << std::count_if(v.begin(), v.end(), small) << "\\n";

    int total = 0;
    std::for_each(v.begin(), v.end(), [&total](int n) { total += n; });
    std::cout << total << "\\n";
    return 0;
}`,
      output: '3\n223',
      points: [
        '[capture](params) { body }',
        '[x] copies, [&x] refers, [&] takes everything by reference.',
        'Store one in an auto variable to name it.',
      ],
    },
    {
      id: 'c12p3',
      title: 'The algorithms you will use every week',
      lede: 'sort, find, count, accumulate, reverse.',
      body: '`<algorithm>` holds around a hundred functions. Five of them cover most days: `sort`, `find`, `count_if`, `reverse` and `max_element`. `accumulate` lives in `<numeric>`.\n\nThey take a begin and an end, so they work on vectors, arrays, strings and anything else with iterators.',
      code: `#include <iostream>
#include <vector>
#include <algorithm>
#include <numeric>

int main() {
    std::vector<int> v = {5, 3, 9, 1};
    std::cout << std::accumulate(v.begin(), v.end(), 0) << "\\n";
    std::cout << *std::max_element(v.begin(), v.end()) << "\\n";
    std::cout << std::count_if(v.begin(), v.end(), [](int n){ return n > 4; }) << "\\n";
    std::reverse(v.begin(), v.end());
    for (int n : v) std::cout << n << " ";
    return 0;
}`,
      output: '18\n9\n2\n1 9 3 5',
      points: [
        'accumulate is in <numeric>, the rest in <algorithm>.',
        'max_element returns an iterator — dereference it.',
        'Learn these before writing loops by hand.',
      ],
    },
    {
      id: 'c12p4',
      title: 'std::map',
      lede: 'Look a value up by a key.',
      body: 'A `std::map<Key, Value>` stores pairs sorted by key, with lookup in logarithmic time. `m["word"]` reads or creates an entry; `m.at("word")` throws if it is missing.\n\nBeware: `m["x"]` on a missing key **inserts** it with a default value. Use `count` or `find` when you only want to ask.',
      code: `#include <iostream>
#include <map>
#include <string>

int main() {
    std::map<std::string, int> ages;
    ages["Aida"] = 14;
    ages["Bek"] = 15;
    ages["Aida"] += 1;

    for (const auto& [name, age] : ages) std::cout << name << " " << age << "\\n";
    std::cout << ages.count("Nur") << "\\n";
    return 0;
}`,
      output: 'Aida 15\nBek 15\n0',
      points: [
        'map<K,V> keeps entries sorted by key.',
        '[] inserts a default when the key is missing.',
        'Structured bindings: for (const auto& [k, v] : m).',
      ],
    },
    {
      id: 'c12p5',
      title: 'unordered_map',
      lede: 'The same idea, hashed, and faster.',
      body: '`std::unordered_map` uses a hash table: average constant-time lookup, but no order at all when you iterate.\n\nChoose `map` when you need sorted order or a stable iteration sequence, and `unordered_map` when you only need lookups — which is most of the time.',
      code: `#include <iostream>
#include <unordered_map>
#include <string>

int main() {
    std::unordered_map<std::string, int> tally;
    for (const std::string& w : {"tea", "milk", "tea", "tea"}) tally[w]++;
    std::cout << tally["tea"] << " " << tally["milk"] << "\\n";
    return 0;
}`,
      output: '3 1',
      points: [
        'unordered_map: average O(1), no ordering.',
        'map: O(log n), sorted by key.',
        'Counting words is the classic use.',
      ],
    },
    {
      id: 'c12p6',
      title: 'std::set',
      lede: 'A collection with no duplicates.',
      body: 'A `set` holds unique values in sorted order. Inserting something already present does nothing, which makes it the simplest way to remove duplicates or track "have I seen this".\n\n`unordered_set` is the hashed version, with the same trade-off as the maps.',
      code: `#include <iostream>
#include <set>

int main() {
    std::set<int> seen;
    for (int n : {4, 1, 4, 9, 1, 7}) seen.insert(n);
    for (int n : seen) std::cout << n << " ";
    std::cout << "\\n" << seen.count(9) << seen.count(3) << "\\n";
    return 0;
}`,
      output: '1 4 7 9 \n10',
      points: [
        'A set keeps unique values, sorted.',
        'Inserting a duplicate is a silent no-op.',
        'count(x) is 1 or 0 — a membership test.',
      ],
    },
    {
      id: 'c12p7',
      title: 'pair and tuple',
      lede: 'Two or more values, without declaring a struct.',
      body: '`std::pair<A,B>` holds two values as `.first` and `.second`. `std::tuple` generalises it to any number, read with `std::get<0>(t)`.\n\nThey are handy for a quick return of two things. If the pair starts travelling around your program, give it a name and make it a struct — `.first` tells a reader nothing.',
      code: `#include <iostream>
#include <utility>
#include <tuple>

std::pair<int, int> minMax(const std::vector<int>& v) {
    auto p = std::minmax_element(v.begin(), v.end());
    return {*p.first, *p.second};
}

int main() {
    auto [lo, hi] = minMax({4, 9, 1, 7});
    std::cout << lo << " " << hi << "\\n";
    return 0;
}`,
      output: '1 9',
      points: [
        'pair has .first and .second.',
        'Structured bindings unpack them with names.',
        'If it travels, make it a struct instead.',
      ],
    },
    {
      id: 'c12p8',
      title: 'std::optional',
      lede: 'A value that might not be there.',
      body: '`std::optional<T>` from `<optional>` either holds a T or holds nothing. It replaces the old habits of returning -1, an empty string, or a null pointer to mean "no answer".\n\nTest it with `has_value()` or in an `if`, and read it with `*` or `.value()`.',
      code: `#include <iostream>
#include <optional>
#include <string>

std::optional<int> parseAge(const std::string& s) {
    try { return std::stoi(s); }
    catch (...) { return std::nullopt; }
}

int main() {
    if (auto age = parseAge("14")) std::cout << *age + 1 << "\\n";
    if (!parseAge("abc")) std::cout << "not a number\\n";
    return 0;
}`,
      output: '15\nnot a number',
      points: [
        'optional<T> holds a T or nothing.',
        'std::nullopt is the empty value.',
        'Better than -1 or "" as a secret failure code.',
      ],
    },
    {
      id: 'c12p9',
      title: 'Which container do I want?',
      lede: 'A short list that answers it almost every time.',
      body: 'Start with `vector`. It is contiguous, cache-friendly and fastest for nearly everything, even when theory suggests otherwise.\n\nMove away only for a reason: a key-value lookup, uniqueness, or heavy insertion at the front.',
      code: `// A list of things, in order:          std::vector<T>
// Look up by key:                        std::unordered_map<K,V>
// Look up by key, in sorted order:       std::map<K,V>
// Unique values:                         std::set<T> / unordered_set<T>
// Push and pop at both ends:             std::deque<T>
// Fixed size, known at compile time:     std::array<T, N>
// First in, first out:                   std::queue<T>
// Last in, first out:                    std::stack<T>`,
      points: [
        'vector is the default and usually the fastest.',
        'Reach for map or set when you need lookup or uniqueness.',
        'std::list is almost never the right answer.',
      ],
    },
  ],
};
