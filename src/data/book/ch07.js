export default {
  id: 'c7',
  title: 'Arrays and vectors',
  blurb: 'Holding many values under one name.',
  pages: [
    {
      id: 'c7p1',
      title: 'The plain array',
      lede: 'A fixed run of values, side by side in memory.',
      body: 'An array holds a fixed number of values of one type, laid out in a single block. Its size must be known when the program is compiled, and it never changes.\n\nIndices start at zero. An array of five has indices 0 to 4.',
      code: `#include <iostream>

int main() {
    int marks[5] = {70, 82, 91, 55, 66};
    std::cout << marks[0] << "\\n";
    std::cout << marks[4] << "\\n";
    marks[2] = 95;
    std::cout << marks[2] << "\\n";
    return 0;
}`,
      output: '70\n66\n95',
      points: [
        'Size is fixed at compile time.',
        'Indices run 0 to size-1.',
        'All elements share one type.',
      ],
    },
    {
      id: 'c7p2',
      title: 'Walking an array',
      lede: 'A counted loop and the size, together.',
      body: 'A plain array does not know its own length, so you must carry the size yourself. Keep it in a `const int` and use it in both the declaration and the loop, so the two can never disagree.\n\nReading past the end is not checked. It gives you whatever was next in memory, or a crash.',
      code: `#include <iostream>

int main() {
    const int N = 5;
    int marks[N] = {70, 82, 91, 55, 66};

    int sum = 0;
    for (int i = 0; i < N; ++i) sum += marks[i];
    std::cout << "Total " << sum << ", average " << double(sum) / N << "\\n";
    return 0;
}`,
      output: 'Total 364, average 72.8',
      points: [
        'An array does not know its own size.',
        'Store the size in one const and use it everywhere.',
        'Out-of-bounds access is never checked.',
      ],
    },
    {
      id: 'c7p3',
      title: 'std::vector — the array that grows',
      lede: 'What you should reach for nine times out of ten.',
      body: '`std::vector` from `<vector>` is a sequence that manages its own memory. It knows its size, it can grow, and it cleans up after itself.\n\nUnless you have a specific reason to use a raw array, use a vector.',
      code: `#include <iostream>
#include <vector>

int main() {
    std::vector<int> scores = {70, 82, 91};
    scores.push_back(66);              // grows
    std::cout << scores.size() << "\\n";
    std::cout << scores[1] << "\\n";
    std::cout << scores.front() << " " << scores.back() << "\\n";
    return 0;
}`,
      output: '4\n82\n70 66',
      points: [
        '#include <vector>; the type is std::vector<T>.',
        'push_back adds to the end and grows the storage.',
        '.size(), .front(), .back(), .empty() all exist.',
      ],
    },
    {
      id: 'c7p4',
      title: 'Building a vector as you go',
      lede: 'Start empty, add what you find.',
      body: 'A common shape: declare an empty vector, loop over some input, and `push_back` each item you want to keep. The vector grows as needed.\n\nIf you know roughly how many there will be, call `reserve(n)` first. It allocates once instead of repeatedly, which matters in a hot loop.',
      code: `#include <iostream>
#include <vector>

int main() {
    std::vector<int> evens;
    evens.reserve(50);
    for (int i = 1; i <= 100; ++i) {
        if (i % 2 == 0) evens.push_back(i);
    }
    std::cout << evens.size() << " evens, last is " << evens.back() << "\\n";
    return 0;
}`,
      output: '50 evens, last is 100',
      points: [
        'Declare empty, push_back inside the loop.',
        'reserve(n) avoids repeated reallocation.',
        'size() is the count; capacity() is the room.',
      ],
    },
    {
      id: 'c7p5',
      title: 'at() and bounds',
      lede: '[] is fast and trusting; at() checks.',
      body: '`v[i]` does no checking at all. If `i` is out of range you get undefined behaviour — often a silent wrong answer.\n\n`v.at(i)` checks and throws `std::out_of_range` instead. It costs a comparison. While you are learning, that is a good trade.',
      code: `#include <iostream>
#include <vector>
#include <stdexcept>

int main() {
    std::vector<int> v = {1, 2, 3};
    try {
        std::cout << v.at(10) << "\\n";
    } catch (const std::out_of_range& e) {
        std::cout << "Out of range caught\\n";
    }
    return 0;
}`,
      output: 'Out of range caught',
      points: [
        '[] does not check; at() throws out_of_range.',
        'Out-of-bounds with [] is undefined behaviour.',
        'Use at() while learning, [] in measured hot loops.',
      ],
    },
    {
      id: 'c7p6',
      title: 'Inserting and removing',
      lede: 'Adding or deleting in the middle costs a shuffle.',
      body: '`insert` and `erase` take iterators, not indices — `v.begin() + 2` is the third position. Everything after the point moves along, so both are O(n).\n\n`pop_back` removes the last element cheaply, and `clear` empties the whole thing.',
      code: `#include <iostream>
#include <vector>

int main() {
    std::vector<int> v = {1, 2, 4, 5};
    v.insert(v.begin() + 2, 3);       // 1 2 3 4 5
    v.erase(v.begin());               // 2 3 4 5
    v.pop_back();                     // 2 3 4
    for (int n : v) std::cout << n << " ";
    return 0;
}`,
      output: '2 3 4',
      points: [
        'insert and erase take iterators.',
        'Both shuffle everything after the point.',
        'pop_back and push_back at the end are cheap.',
      ],
    },
    {
      id: 'c7p7',
      title: 'Two-dimensional data',
      lede: 'A grid is a vector of vectors.',
      body: 'For a grid, use `std::vector<std::vector<int>>`. The first index is the row, the second the column.\n\nBuild it with a size and a fill value so every row is the right length from the start. Ragged rows are a common source of crashes.',
      code: `#include <iostream>
#include <vector>

int main() {
    int rows = 3, cols = 4;
    std::vector<std::vector<int>> grid(rows, std::vector<int>(cols, 0));

    grid[1][2] = 7;
    for (const auto& row : grid) {
        for (int cell : row) std::cout << cell << " ";
        std::cout << "\\n";
    }
    return 0;
}`,
      output: '0 0 0 0\n0 0 7 0\n0 0 0 0',
      points: [
        'vector<vector<T>> is the straightforward grid.',
        'grid[row][col] — rows first.',
        'Size every row when you build it.',
      ],
    },
    {
      id: 'c7p8',
      title: 'std::array',
      lede: 'A fixed-size array that behaves like a container.',
      body: '`std::array<T, N>` from `<array>` has the fixed size of a raw array and the manners of a vector: it knows its size, works with range-for, and can be copied and returned.\n\nUse it when the size is genuinely fixed and known at compile time.',
      code: `#include <iostream>
#include <array>

int main() {
    std::array<int, 4> temps = {12, 15, 9, 20};
    std::cout << temps.size() << "\\n";
    for (int t : temps) std::cout << t << " ";
    std::cout << "\\n" << temps.at(2) << "\\n";
    return 0;
}`,
      output: '4\n12 15 9 20 \n9',
      points: [
        'std::array<T, N> — size is part of the type.',
        'Knows its size, unlike a raw array.',
        'No heap allocation, unlike a vector.',
      ],
    },
    {
      id: 'c7p9',
      title: 'Sorting and searching',
      lede: 'The library already wrote it.',
      body: '`std::sort` from `<algorithm>` sorts any range in place. Give it a comparison function to sort differently — largest first, or by a member.\n\nOn a sorted range, `std::binary_search` and `std::lower_bound` find things in logarithmic time instead of scanning.',
      code: `#include <iostream>
#include <vector>
#include <algorithm>

int main() {
    std::vector<int> v = {5, 2, 9, 1, 7};
    std::sort(v.begin(), v.end());
    for (int n : v) std::cout << n << " ";
    std::cout << "\\n";

    std::sort(v.begin(), v.end(), [](int a, int b) { return a > b; });
    for (int n : v) std::cout << n << " ";
    return 0;
}`,
      output: '1 2 5 7 9 \n9 7 5 2 1',
      points: [
        '#include <algorithm> for sort, find, count, reverse.',
        'sort takes a begin and an end.',
        'Pass a comparator to change the order.',
      ],
      tip: 'Never write your own bubble sort in real code. std::sort is faster than anything you will write by hand.',
    },
  ],
};
