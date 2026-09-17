export default {
  id: 'c13',
  title: 'Files and streams',
  blurb: 'Reading and writing real files on disk.',
  pages: [
    {
      id: 'c13p1',
      title: 'Streams are all the same',
      lede: 'cin, cout and files share one interface.',
      body: 'A stream is a sequence of characters you push into or pull out of. `cout` is a stream to the screen, `cin` from the keyboard, and `ofstream`/`ifstream` from `<fstream>` are streams to and from files.\n\nBecause they share the interface, code written against `std::ostream&` works for the screen, a file, or a string buffer without changing a line.',
      code: `#include <iostream>
#include <fstream>

void report(std::ostream& out) {         // works for any stream
    out << "Total: 42\\n";
}

int main() {
    report(std::cout);                   // to the screen
    std::ofstream file("report.txt");
    report(file);                        // to a file
    return 0;
}`,
      output: 'Total: 42',
      points: [
        'cin, cout, files and string buffers are all streams.',
        'Take std::ostream& to write anywhere.',
        '#include <fstream> for file streams.',
      ],
    },
    {
      id: 'c13p2',
      title: 'Writing a file',
      lede: 'ofstream, and the file closes itself.',
      body: 'Create an `std::ofstream` with a filename and write to it with `<<`. Opening in the default mode **erases** any existing contents; pass `std::ios::app` to append instead.\n\nYou do not need to call `close()`. The destructor closes the file when the object goes out of scope — RAII again.',
      code: `#include <fstream>
#include <string>

int main() {
    std::ofstream out("cities.txt");
    out << "London\\n" << "Rome\\n" << "Bishkek\\n";
    // closed automatically here

    std::ofstream more("cities.txt", std::ios::app);
    more << "Almaty\\n";
    return 0;
}`,
      file: 'cities.txt',
      output: 'London\nRome\nBishkek\nAlmaty',
      points: [
        'ofstream("name") truncates; std::ios::app appends.',
        'Write with << exactly like cout.',
        'The destructor closes the file for you.',
      ],
    },
    {
      id: 'c13p3',
      title: 'Reading a file',
      lede: 'ifstream, line by line.',
      body: 'Open with `std::ifstream` and read with `getline` in a while loop. The loop ends when the stream fails, which happens at the end of the file.\n\nAlways check that the file actually opened. A missing file does not throw — the stream simply comes back in a failed state.',
      code: `#include <iostream>
#include <fstream>
#include <string>

int main() {
    std::ifstream in("cities.txt");
    if (!in) {
        std::cerr << "Could not open the file\\n";
        return 1;
    }
    std::string line;
    int count = 0;
    while (std::getline(in, line)) {
        ++count;
        std::cout << count << ": " << line << "\\n";
    }
    return 0;
}`,
      output: '1: London\n2: Rome\n3: Bishkek\n4: Almaty',
      points: [
        'while (std::getline(in, line)) is the reading idiom.',
        'A missing file fails silently — test the stream.',
        'cerr is the error stream; it is not buffered with cout.',
      ],
    },
    {
      id: 'c13p4',
      title: 'Reading values',
      lede: '>> pulls typed data out of a file.',
      body: '`in >> number` works on a file exactly as on `cin`, converting text to the type you asked for and stopping at whitespace.\n\nMix it with getline carefully, for the same newline reason as the keyboard. When a format is fixed and simple, `>>` in a while loop is the shortest correct code.',
      code: `#include <iostream>
#include <fstream>
#include <vector>

int main() {
    std::ofstream("marks.txt") << "70 82 91 55";

    std::ifstream in("marks.txt");
    std::vector<int> marks;
    int m = 0;
    while (in >> m) marks.push_back(m);

    int sum = 0;
    for (int v : marks) sum += v;
    std::cout << marks.size() << " marks, average " << sum / marks.size() << "\\n";
    return 0;
}`,
      output: '4 marks, average 74',
      points: [
        'while (in >> value) reads until the format breaks.',
        '>> skips whitespace, including newlines.',
        'The loop stops at the end of the file or at bad data.',
      ],
    },
    {
      id: 'c13p5',
      title: 'Stream state',
      lede: 'good, eof, fail and bad.',
      body: 'Every stream carries flags. `eof()` means you reached the end, `fail()` means a conversion failed or the file would not open, and `bad()` means a real I/O error.\n\nUsing the stream in an `if` tests for "not failed", which is what you want almost always. After a failure you must `clear()` the flags before the stream will do anything again.',
      code: `#include <iostream>
#include <sstream>

int main() {
    std::istringstream in("12 abc");
    int a = 0, b = 0;
    in >> a >> b;                       // second read fails
    std::cout << in.fail() << " a=" << a << " b=" << b << "\\n";
    in.clear();                         // reset the flags
    std::string rest;
    in >> rest;
    std::cout << rest << "\\n";
    return 0;
}`,
      output: '1 a=12 b=0\nabc',
      points: [
        'if (stream) means "has not failed".',
        'A failed read leaves the variable at zero.',
        'clear() resets the flags so you can carry on.',
      ],
    },
    {
      id: 'c13p6',
      title: 'Parsing a data file',
      lede: 'Putting getline, stringstream and a struct together.',
      body: 'Real files usually hold one record per line with separators. Read the line with `getline`, then hand the line to an `istringstream` and split it.\n\nThis two-step is the standard shape: it keeps line handling and field handling separate, so a broken line never eats the next one.',
      code: `#include <iostream>
#include <fstream>
#include <sstream>
#include <string>
#include <vector>

struct Row { std::string city; int population = 0; };

int main() {
    std::ofstream("data.csv") << "Bishkek,1074000\\nOsh,322000\\n";

    std::ifstream in("data.csv");
    std::vector<Row> rows;
    std::string line;
    while (std::getline(in, line)) {
        std::istringstream fields(line);
        Row r;
        std::string pop;
        if (std::getline(fields, r.city, ',') && std::getline(fields, pop)) {
            r.population = std::stoi(pop);
            rows.push_back(r);
        }
    }
    for (const auto& r : rows) std::cout << r.city << ": " << r.population << "\\n";
    return 0;
}`,
      output: 'Bishkek: 1074000\nOsh: 322000',
      points: [
        'getline for the line, stringstream for the fields.',
        'Check every read before you trust the values.',
        'Skip a malformed line rather than crashing.',
      ],
    },
    {
      id: 'c13p7',
      title: 'Paths and file safety',
      lede: 'Where the file actually is, and what to check.',
      body: 'A relative path is resolved from the **working directory** — where the program was started, not where the executable lives. That is why "the file is right there" so often fails.\n\n`<filesystem>` (C++17) gives you `std::filesystem::exists`, `file_size` and directory iteration, portably across Windows and Unix.',
      code: `#include <iostream>
#include <filesystem>
namespace fs = std::filesystem;

int main() {
    std::cout << fs::current_path() << "\\n";
    if (fs::exists("data.csv")) {
        std::cout << fs::file_size("data.csv") << " bytes\\n";
    }
    return 0;
}`,
      output: '"/home/aisuluu/project"\n28 bytes',
      points: [
        'Relative paths start from the working directory.',
        '#include <filesystem>, C++17 and later.',
        'exists(), file_size(), and directory iteration are all there.',
      ],
    },
  ],
};
