export default {
  id: 'c5',
  title: 'Loops',
  blurb: 'Doing something many times without writing it many times.',
  pages: [
    {
      id: 'c5p1',
      title: 'while',
      lede: 'Keep going as long as this stays true.',
      body: 'A `while` loop checks its condition, runs the block, and checks again. If the condition is false the first time, the block never runs at all.\n\nSomething inside the block must eventually make the condition false, or the program hangs. That is an infinite loop, and you will write one today.',
      code: `#include <iostream>

int main() {
    int count = 3;
    while (count > 0) {
        std::cout << count << "...\\n";
        --count;                 // without this: forever
    }
    std::cout << "Go!\\n";
    return 0;
}`,
      output: '3...\n2...\n1...\nGo!',
      points: [
        'The condition is checked before each pass.',
        'Zero passes is a normal outcome.',
        'Change something inside, or it never ends.',
      ],
    },
    {
      id: 'c5p2',
      title: 'do-while',
      lede: 'Run once, then ask.',
      body: '`do { ... } while (cond);` puts the check at the bottom, so the body always runs at least once. It fits menus and input validation, where you must ask before you can judge the answer.\n\nNote the semicolon after the closing `while` — it is the one place a loop needs one.',
      code: `#include <iostream>

int main() {
    int choice = 0;
    do {
        std::cout << "Pick 1-3: ";
        std::cin >> choice;
    } while (choice < 1 || choice > 3);

    std::cout << "You picked " << choice << "\\n";
    return 0;
}`,
      output: 'Pick 1-3: 9\nPick 1-3: 2\nYou picked 2',
      points: [
        'The body runs before the first check.',
        'A semicolon is required after while(...).',
        'Ideal for "ask until the answer is valid".',
      ],
    },
    {
      id: 'c5p3',
      title: 'for',
      lede: 'Setup, condition and step, all on one line.',
      body: 'A `for` loop gathers the three parts of a counted loop into its header: start, keep-going test, and what to do after each pass.\n\nThat makes counted loops readable at a glance, and keeps the counter inside the loop where it belongs.',
      code: `#include <iostream>

int main() {
    for (int i = 1; i <= 5; ++i) {
        std::cout << i << " x 7 = " << i * 7 << "\\n";
    }
    // i does not exist here
    return 0;
}`,
      output: '1 x 7 = 7\n2 x 7 = 14\n3 x 7 = 21\n4 x 7 = 28\n5 x 7 = 35',
      points: [
        'for (init; condition; step) { body }',
        'The counter is scoped to the loop.',
        'Any of the three parts may be left empty.',
      ],
    },
    {
      id: 'c5p4',
      title: 'Counting from zero',
      lede: 'Why loops start at 0 and use <, not <=.',
      body: 'Array indices start at zero, so a loop over `n` items runs `0` to `n - 1`. The idiom `for (int i = 0; i < n; ++i)` covers exactly `n` passes, and the condition uses `<` rather than `<=`.\n\nSwapping `<` for `<=` runs one pass too many and reads past the end — the off-by-one error, and the most common bug in the language.',
      code: `#include <iostream>

int main() {
    int marks[5] = {70, 82, 91, 55, 66};
    for (int i = 0; i < 5; ++i) {        // 0,1,2,3,4
        std::cout << marks[i] << " ";
    }
    // for (int i = 0; i <= 5; ++i)  <-- reads marks[5]: out of bounds
    return 0;
}`,
      output: '70 82 91 55 66',
      points: [
        'n items means indices 0 .. n-1.',
        'i < n gives exactly n passes.',
        '<= is the off-by-one waiting to happen.',
      ],
    },
    {
      id: 'c5p5',
      title: 'The range-for loop',
      lede: 'Every item, no counter, no mistakes.',
      body: 'When you want each element and do not care about positions, `for (auto x : container)` is shorter and cannot run off the end.\n\nUse `const auto&` to avoid copying each element, and plain `auto&` when you intend to modify them in place.',
      code: `#include <iostream>
#include <vector>
#include <string>

int main() {
    std::vector<std::string> cities = {"London", "Rome", "Bishkek"};

    for (const auto& city : cities) std::cout << city << "\\n";

    std::vector<int> nums = {1, 2, 3};
    for (auto& n : nums) n *= 10;      // & means change the real one
    for (int n : nums) std::cout << n << " ";
    return 0;
}`,
      output: 'London\nRome\nBishkek\n10 20 30',
      points: [
        'for (auto x : c) copies each element.',
        'const auto& avoids the copy; auto& lets you edit.',
        'No index means no off-by-one.',
      ],
    },
    {
      id: 'c5p6',
      title: 'break and continue',
      lede: 'Leave early, or skip to the next pass.',
      body: '`break` jumps out of the loop entirely. `continue` abandons the current pass and goes straight to the next one.\n\nBoth are useful and both can hide the real shape of a loop when overused. In nested loops, `break` leaves only the innermost one.',
      code: `#include <iostream>

int main() {
    for (int i = 1; i <= 10; ++i) {
        if (i % 2 == 0) continue;     // skip evens
        if (i > 7) break;             // stop entirely
        std::cout << i << " ";
    }
    return 0;
}`,
      output: '1 3 5 7',
      points: [
        'break leaves the loop; continue starts the next pass.',
        'In a for loop, continue still runs the ++i step.',
        'break escapes one level only.',
      ],
    },
    {
      id: 'c5p7',
      title: 'Nested loops',
      lede: 'A loop inside a loop — rows and columns.',
      body: 'The inner loop runs completely for every single pass of the outer one. Two loops of `n` mean `n * n` passes, which is why a nested loop over 10,000 items is a performance problem.\n\nGive the counters different names. `i` and `j` are conventional; reusing `i` shadows the outer one and produces chaos.',
      code: `#include <iostream>

int main() {
    for (int row = 1; row <= 3; ++row) {
        for (int col = 1; col <= 3; ++col) {
            std::cout << row * col << "\\t";
        }
        std::cout << "\\n";
    }
    return 0;
}`,
      output: '1\t2\t3\n2\t4\t6\n3\t6\t9',
      points: [
        'The inner loop completes for each outer pass.',
        'n by n is n squared passes — watch the cost.',
        'Different counter names, always.',
      ],
    },
    {
      id: 'c5p8',
      title: 'Accumulating a result',
      lede: 'The pattern behind sums, counts, maximums and averages.',
      body: 'Nearly every loop that produces an answer follows the same shape: set up a variable before the loop, update it inside, use it after.\n\nThe only thing that changes is the update. Start a sum at 0, a product at 1, a maximum at the first element — not at zero, or a list of negatives gives the wrong answer.',
      code: `#include <iostream>
#include <vector>

int main() {
    std::vector<int> temps = {-4, -9, -2, -7};
    int sum = 0;
    int hottest = temps[0];            // not 0!
    for (int t : temps) {
        sum += t;
        if (t > hottest) hottest = t;
    }
    std::cout << "Average: " << double(sum) / temps.size() << "\\n";
    std::cout << "Hottest: " << hottest << "\\n";
    return 0;
}`,
      output: 'Average: -5.5\nHottest: -2',
      points: [
        'Declare the accumulator before the loop.',
        'Sums start at 0, products at 1.',
        'Maximums start at the first element, never at zero.',
      ],
    },
    {
      id: 'c5p9',
      title: 'Infinite loops, on purpose and by accident',
      lede: 'How they happen and how to stop one.',
      body: 'A loop runs forever when the condition can never become false — you forgot the increment, or you changed the wrong variable. Ctrl+C stops a runaway program in the terminal.\n\nDeliberate infinite loops are normal in games and servers: `while (true)` with a `break` inside. Write them plainly so a reader knows it was intended.',
      code: `#include <iostream>

int main() {
    int guess = 0;
    while (true) {                     // deliberate
        std::cin >> guess;
        if (guess == 42) break;
        std::cout << "Not yet\\n";
    }
    std::cout << "Correct!\\n";
    return 0;
}`,
      output: '7\nNot yet\n42\nCorrect!',
      points: [
        'Forgetting ++i is the usual accident.',
        'Ctrl+C kills a runaway program.',
        'while (true) with a break is a fine, honest pattern.',
      ],
      tip: 'If a loop hangs, print the counter inside it. You will see instantly what is not moving.',
    },
  ],
};
