export interface InterviewQuestionItem {
  id: number;
  category: string;
  question: string;
  answer: string;
  codeSnippet?: string;
  jobTypes: ("Backend" | "Frontend" | "Full Stack" | "DevOps" | "Data" | "General" | "System Architecture" | "CyberSecurity")[];
  difficulty: "Beginner" | "Intermediate" | "Advanced" | "Expert";
}

export interface QuestionCategoryGroup {
  id: string;
  title: string;
  icon: string;
  range: string;
  count: number;
  description: string;
}

export const QUESTION_CATEGORY_GROUPS: QuestionCategoryGroup[] = [
  { id: "fundamentals", title: "1. Programming Fundamentals", icon: "code", range: "Q1 - Q20", count: 20, description: "Core concepts of software engineering, variables, recursion, control flow, and debugging." },
  { id: "oop", title: "2. Object-Oriented Programming", icon: "settings", range: "Q21 - Q40", count: 20, description: "Encapsulation, abstraction, inheritance, polymorphism, design patterns, and interfaces." },
  { id: "ds", title: "3. Data Structures", icon: "bar-chart", range: "Q41 - Q80", count: 40, description: "Arrays, Linked Lists, Stacks, Queues, Hash Tables, Trees, Heaps, Graphs, and Tries." },
  { id: "algorithms", title: "4. Algorithms", icon: "rocket", range: "Q81 - Q120", count: 40, description: "Big O, Sorting, Searching, Dynamic Programming, Greedy, Backtracking, and Graph algorithms." },
  { id: "languages", title: "5. Programming Languages", icon: "terminal", range: "Q121 - Q145", count: 25, description: "C++, Java, Python, JS runtime internals, memory management, garbage collection, and concurrency." },
  { id: "database", title: "6. Database & SQL", icon: "database", range: "Q146 - Q165", count: 20, description: "Relational vs NoSQL, SQL Joins, Normalization, Indexing, ACID transactions, and optimization." },
  { id: "system_design", title: "7. System Design & CS Fundamentals", icon: "globe", range: "Q166 - Q180", count: 15, description: "Operating Systems, Threading, Virtual Memory, REST APIs, Caching, Load Balancing, and CDNs." },
  { id: "scenarios", title: "8. Coding Interview Scenarios", icon: "target", range: "Q181 - Q190", count: 10, description: "Essential string, array, pointer, and hash map algorithm problem patterns." },
  { id: "advanced", title: "9. Advanced Coding Problems", icon: "award", range: "Q191 - Q200", count: 10, description: "Complex LeetCode Hard/Medium challenges: DP, LRU Cache, Trapping Rain Water, and URL Shortener." },
  { id: "cybersecurity", title: "10. Cybersecurity & Digital Forensics", icon: "shield", range: "Q201 - Q210", count: 10, description: "Network security, penetration testing, cryptography, memory forensics, incident response, and SOC analysis." },
  { id: "hr_behavioral", title: "11. HR, Behavioral & Cultural Fit", icon: "users", range: "Q211 - Q225", count: 15, description: "Common HR questions, STAR method responses, career aspirations, strengths/weaknesses, and company alignment." },
  { id: "salary", title: "12. Salary Negotiation & Offers", icon: "dollar-sign", range: "Q226 - Q232", count: 7, description: "How to negotiate salary, evaluate offers, counter-offer politely, and discuss compensation confidently." },
  { id: "leadership", title: "13. Leadership & Management", icon: "crown", range: "Q233 - Q238", count: 6, description: "Managing teams, handling conflict, giving feedback, promoting engineers, and engineering leadership styles." },
  { id: "remote", title: "14. Remote Work & Collaboration", icon: "earth", range: "Q239 - Q241", count: 3, description: "Staying productive remotely, async communication, building trust across time zones, and distributed teams." },
];

export const TOP_200_QUESTIONS: InterviewQuestionItem[] = [
  // ── 1. Programming Fundamentals (Q1 - Q20) ──
  {
    id: 1,
    category: "1. Programming Fundamentals",
    question: "What is programming?",
    answer: "Programming is the process of creating a set of instructions that direct a computer to perform specific tasks, solve problems, or automate processes using a programming language.",
    jobTypes: ["General", "Backend", "Frontend", "Full Stack"],
    difficulty: "Beginner"
  },
  {
    id: 2,
    category: "1. Programming Fundamentals",
    question: "What is an algorithm?",
    answer: "An algorithm is a finite, step-by-step sequence of well-defined instructions designed to solve a specific problem or execute a computation in finite time.",
    codeSnippet: "// Algorithm Example: Linear Search\nfunction linearSearch(arr, target) {\n  for (let i = 0; i < arr.length; i++) {\n    if (arr[i] === target) return i;\n  }\n  return -1;\n}",
    jobTypes: ["General", "Backend", "Frontend", "Full Stack"],
    difficulty: "Beginner"
  },
  {
    id: 3,
    category: "1. Programming Fundamentals",
    question: "What is pseudocode?",
    answer: "Pseudocode is an informal, high-level description of a computer program or algorithm intended for human reading rather than machine execution. It omits syntax details.",
    jobTypes: ["General", "Backend"],
    difficulty: "Beginner"
  },
  {
    id: 4,
    category: "1. Programming Fundamentals",
    question: "What is a flowchart?",
    answer: "A flowchart is a visual diagram representing the sequence of steps, decisions, and flow of control in an algorithm using standard geometrical shapes (ovals, rectangles, diamonds).",
    jobTypes: ["General"],
    difficulty: "Beginner"
  },
  {
    id: 5,
    category: "1. Programming Fundamentals",
    question: "What is a variable?",
    answer: "A variable is a named storage location in memory that holds data which can be modified during program execution.",
    codeSnippet: "let userScore = 100; // Named memory allocation",
    jobTypes: ["General", "Frontend", "Backend"],
    difficulty: "Beginner"
  },
  {
    id: 6,
    category: "1. Programming Fundamentals",
    question: "What are data types?",
    answer: "Data types define the classification of data values (e.g., Integer, Float, String, Boolean, Array, Object) which tell the compiler or interpreter how data will be used and stored.",
    jobTypes: ["General", "Backend", "Frontend"],
    difficulty: "Beginner"
  },
  {
    id: 7,
    category: "1. Programming Fundamentals",
    question: "What is type casting?",
    answer: "Type casting is converting a variable from one primitive or object data type to another (e.g., converting a string '123' into integer 123). It can be implicit (coercion) or explicit.",
    codeSnippet: "let str = '42';\nlet num = Number(str); // Explicit type casting",
    jobTypes: ["Backend", "Frontend"],
    difficulty: "Beginner"
  },
  {
    id: 8,
    category: "1. Programming Fundamentals",
    question: "What are operators in programming?",
    answer: "Operators are special symbols used to perform operations on variables and values (Arithmetic `+,-,*`, Relational `==,!=,>`, Logical `&&,||,!`, Bitwise `&,|`).",
    jobTypes: ["General", "Backend"],
    difficulty: "Beginner"
  },
  {
    id: 9,
    category: "1. Programming Fundamentals",
    question: "What are conditional statements?",
    answer: "Conditional statements (`if`, `else if`, `else`, `switch`) execute different blocks of code depending on whether a boolean expression evaluates to true or false.",
    jobTypes: ["General", "Frontend", "Backend"],
    difficulty: "Beginner"
  },
  {
    id: 10,
    category: "1. Programming Fundamentals",
    question: "What are loops?",
    answer: "Loops are control flow structures that repeatedly execute a block of code as long as a specified condition remains true.",
    jobTypes: ["General", "Backend", "Frontend"],
    difficulty: "Beginner"
  },
  {
    id: 11,
    category: "1. Programming Fundamentals",
    question: "Difference between for, while, and do-while loops?",
    answer: "`for` loop is used when iteration count is known; `while` loop checks condition before executing body (0 or more times); `do-while` executes body first before condition check (at least 1 time).",
    jobTypes: ["General", "Backend"],
    difficulty: "Beginner"
  },
  {
    id: 12,
    category: "1. Programming Fundamentals",
    question: "What are functions?",
    answer: "Functions are reusable blocks of organized code designed to perform a single, related action. They improve modularity and code reuse.",
    jobTypes: ["General", "Frontend", "Backend"],
    difficulty: "Beginner"
  },
  {
    id: 13,
    category: "1. Programming Fundamentals",
    question: "Difference between parameters and arguments?",
    answer: "Parameters are variable names listed in the function definition. Arguments are actual values passed to the function when it is invoked.",
    codeSnippet: "function greet(name) { ... } // 'name' is parameter\ngreet('Alex'); // 'Alex' is argument",
    jobTypes: ["General", "Frontend", "Backend"],
    difficulty: "Beginner"
  },
  {
    id: 14,
    category: "1. Programming Fundamentals",
    question: "What is recursion?",
    answer: "Recursion is a programming technique where a function calls itself directly or indirectly to solve a smaller instance of the same problem until a base condition is met.",
    codeSnippet: "function factorial(n) {\n  if (n <= 1) return 1; // Base case\n  return n * factorial(n - 1); // Recursive step\n}",
    jobTypes: ["Backend", "Full Stack"],
    difficulty: "Intermediate"
  },
  {
    id: 15,
    category: "1. Programming Fundamentals",
    question: "What is scope?",
    answer: "Scope refers to the visibility and accessibility of variables, functions, and objects in a specific region of code (Global, Function/Local, Block scope).",
    jobTypes: ["Frontend", "Backend"],
    difficulty: "Beginner"
  },
  {
    id: 16,
    category: "1. Programming Fundamentals",
    question: "What are global and local variables?",
    answer: "Global variables are declared outside functions and accessible throughout the program. Local variables are declared inside a function/block and accessible only within that block.",
    jobTypes: ["General", "Frontend", "Backend"],
    difficulty: "Beginner"
  },
  {
    id: 17,
    category: "1. Programming Fundamentals",
    question: "What are arrays?",
    answer: "An array is a data structure containing an ordered collection of elements stored at contiguous memory locations, indexed starting from 0.",
    jobTypes: ["General", "Frontend", "Backend"],
    difficulty: "Beginner"
  },
  {
    id: 18,
    category: "1. Programming Fundamentals",
    question: "What are strings?",
    answer: "A string is a sequence of characters used to represent text. In many languages (like Java, Python, JS), strings are immutable.",
    jobTypes: ["General", "Frontend", "Backend"],
    difficulty: "Beginner"
  },
  {
    id: 19,
    category: "1. Programming Fundamentals",
    question: "What is debugging?",
    answer: "Debugging is the systematic process of finding, analyzing, and removing bugs, errors, or unexpected behavior from software source code.",
    jobTypes: ["General", "Full Stack", "DevOps"],
    difficulty: "Beginner"
  },
  {
    id: 20,
    category: "1. Programming Fundamentals",
    question: "What are syntax, logical, and runtime errors?",
    answer: "Syntax errors violate language rules (prevent compilation/execution); Runtime errors occur during program execution (e.g. division by zero); Logical errors produce incorrect output without crashing.",
    jobTypes: ["General", "Backend", "Frontend"],
    difficulty: "Beginner"
  },

  // ── 2. Object-Oriented Programming (Q21 - Q40) ──
  {
    id: 21,
    category: "2. Object-Oriented Programming",
    question: "What is Object-Oriented Programming (OOP)?",
    answer: "OOP is a programming paradigm organized around objects containing data (attributes) and code (methods). Core principles are Encapsulation, Abstraction, Inheritance, and Polymorphism.",
    jobTypes: ["Backend", "Full Stack"],
    difficulty: "Intermediate"
  },
  {
    id: 22,
    category: "2. Object-Oriented Programming",
    question: "What is a class?",
    answer: "A class is a blueprint or template defining the structure and behavior (properties and methods) of objects created from it.",
    jobTypes: ["Backend", "Full Stack"],
    difficulty: "Beginner"
  },
  {
    id: 23,
    category: "2. Object-Oriented Programming",
    question: "What is an object?",
    answer: "An object is an instance of a class that holds actual state values and offers behaviors defined by its class.",
    jobTypes: ["Backend", "Full Stack"],
    difficulty: "Beginner"
  },
  {
    id: 24,
    category: "2. Object-Oriented Programming",
    question: "What is encapsulation?",
    answer: "Encapsulation is bundling data and methods into a single unit (class) while restricting direct access to internal state using private/protected access modifiers and getters/setters.",
    codeSnippet: "class Account {\n  #balance = 0; // Private property\n  deposit(amount) { this.#balance += amount; }\n}",
    jobTypes: ["Backend", "Full Stack"],
    difficulty: "Intermediate"
  },
  {
    id: 25,
    category: "2. Object-Oriented Programming",
    question: "What is abstraction?",
    answer: "Abstraction is hiding complex internal implementation details and showing only essential interfaces to the caller.",
    jobTypes: ["Backend", "Full Stack"],
    difficulty: "Intermediate"
  },
  {
    id: 26,
    category: "2. Object-Oriented Programming",
    question: "What is inheritance?",
    answer: "Inheritance allows a child class to inherit properties and methods from a parent class, promoting code reuse and hierarchical relationships.",
    jobTypes: ["Backend", "Full Stack"],
    difficulty: "Beginner"
  },
  {
    id: 27,
    category: "2. Object-Oriented Programming",
    question: "What is polymorphism?",
    answer: "Polymorphism means 'many forms' — the ability of different classes to respond to the same method call in their own specific way (via overloading or overriding).",
    jobTypes: ["Backend", "Full Stack"],
    difficulty: "Intermediate"
  },
  {
    id: 28,
    category: "2. Object-Oriented Programming",
    question: "What is method overloading?",
    answer: "Method overloading is defining multiple methods in the same class with the exact same name but different parameter lists (compile-time polymorphism).",
    jobTypes: ["Backend", "Full Stack"],
    difficulty: "Intermediate"
  },
  {
    id: 29,
    category: "2. Object-Oriented Programming",
    question: "What is method overriding?",
    answer: "Method overriding is when a subclass provides a specific implementation of a method already declared in its parent class (run-time polymorphism).",
    jobTypes: ["Backend", "Full Stack"],
    difficulty: "Intermediate"
  },
  {
    id: 30,
    category: "2. Object-Oriented Programming",
    question: "Difference between overloading and overriding?",
    answer: "Overloading occurs within the same class with different method signatures (Compile-time). Overriding occurs between superclass and subclass with identical signatures (Runtime).",
    jobTypes: ["Backend", "Full Stack"],
    difficulty: "Intermediate"
  },
  {
    id: 31,
    category: "2. Object-Oriented Programming",
    question: "What is a constructor?",
    answer: "A constructor is a special class method automatically executed when a new object instance is created, used to initialize state.",
    jobTypes: ["Backend", "Full Stack"],
    difficulty: "Beginner"
  },
  {
    id: 32,
    category: "2. Object-Oriented Programming",
    question: "Types of constructors?",
    answer: "Default constructor (no args), Parameterized constructor (custom values), and Copy constructor (creates new object by copying existing instance).",
    jobTypes: ["Backend"],
    difficulty: "Intermediate"
  },
  {
    id: 33,
    category: "2. Object-Oriented Programming",
    question: "What is destructor?",
    answer: "A destructor is a special method automatically invoked when an object is destroyed or garbage collected to release resources.",
    jobTypes: ["Backend"],
    difficulty: "Intermediate"
  },
  {
    id: 34,
    category: "2. Object-Oriented Programming",
    question: "What is static keyword?",
    answer: "`static` belongs to the class itself rather than instances. Static members are shared across all instances of the class.",
    jobTypes: ["Backend", "Full Stack"],
    difficulty: "Intermediate"
  },
  {
    id: 35,
    category: "2. Object-Oriented Programming",
    question: "What is final keyword?",
    answer: "In Java/C++, `final` prevents variable modification (constant), prevents method overriding in subclasses, or prevents class inheritance.",
    jobTypes: ["Backend"],
    difficulty: "Intermediate"
  },
  {
    id: 36,
    category: "2. Object-Oriented Programming",
    question: "What is interface?",
    answer: "An interface is a contract that specifies what methods a class must implement, containing abstract method signatures without code bodies.",
    jobTypes: ["Backend", "Full Stack"],
    difficulty: "Intermediate"
  },
  {
    id: 37,
    category: "2. Object-Oriented Programming",
    question: "What is abstract class?",
    answer: "An abstract class is a restricted class that cannot be instantiated directly and can contain both abstract methods (without body) and concrete methods.",
    jobTypes: ["Backend", "Full Stack"],
    difficulty: "Intermediate"
  },
  {
    id: 38,
    category: "2. Object-Oriented Programming",
    question: "Difference between interface and abstract class?",
    answer: "Interfaces support multiple inheritance and contain only method signatures. Abstract classes support single inheritance and can contain member fields & concrete implementation.",
    jobTypes: ["Backend", "Full Stack"],
    difficulty: "Intermediate"
  },
  {
    id: 39,
    category: "2. Object-Oriented Programming",
    question: "What is object cloning?",
    answer: "Object cloning is creating an exact copy of an object. Shallow copy copies references; Deep copy recursively duplicates referenced objects.",
    jobTypes: ["Backend", "Full Stack"],
    difficulty: "Intermediate"
  },
  {
    id: 40,
    category: "2. Object-Oriented Programming",
    question: "What are access modifiers?",
    answer: "Keywords (`public`, `private`, `protected`, `default`) that set the scope and visibility of classes, constructors, methods, and fields.",
    jobTypes: ["Backend", "Full Stack"],
    difficulty: "Beginner"
  },

  // ── 3. Data Structures (Q41 - Q80) ──
  {
    id: 41,
    category: "3. Data Structures",
    question: "What is a data structure?",
    answer: "A data structure is a specialized format for organizing, processing, retrieving, and storing data in computer memory efficiently.",
    jobTypes: ["Backend", "Frontend", "Full Stack"],
    difficulty: "Beginner"
  },
  {
    id: 42,
    category: "3. Data Structures",
    question: "Types of data structures?",
    answer: "Linear (Array, Linked List, Stack, Queue) and Non-linear (Trees, Heaps, Hash Tables, Graphs).",
    jobTypes: ["Backend", "Full Stack"],
    difficulty: "Beginner"
  },
  {
    id: 43,
    category: "3. Data Structures",
    question: "What is an array?",
    answer: "A linear collection of fixed or dynamic size holding contiguous memory elements with O(1) indexed access.",
    jobTypes: ["Backend", "Frontend", "Full Stack"],
    difficulty: "Beginner"
  },
  {
    id: 44,
    category: "3. Data Structures",
    question: "What is a linked list?",
    answer: "A linear data structure where elements (nodes) contain data and pointers/references to the next (or previous) node in memory.",
    codeSnippet: "class Node {\n  constructor(val) {\n    this.val = val;\n    this.next = null;\n  }\n}",
    jobTypes: ["Backend", "Full Stack"],
    difficulty: "Intermediate"
  },
  {
    id: 45,
    category: "3. Data Structures",
    question: "Types of linked lists?",
    answer: "Singly Linked List (forward pointers), Doubly Linked List (forward and backward pointers), Circular Linked List (last node points to head).",
    jobTypes: ["Backend"],
    difficulty: "Intermediate"
  },
  {
    id: 46,
    category: "3. Data Structures",
    question: "What is a stack?",
    answer: "A LIFO (Last-In, First-Out) data structure supporting push, pop, and peek operations in O(1) time.",
    jobTypes: ["Backend", "Full Stack"],
    difficulty: "Intermediate"
  },
  {
    id: 47,
    category: "3. Data Structures",
    question: "What is a queue?",
    answer: "A FIFO (First-In, First-Out) data structure supporting enqueue (rear) and dequeue (front) operations in O(1) time.",
    jobTypes: ["Backend", "Full Stack"],
    difficulty: "Intermediate"
  },
  {
    id: 48,
    category: "3. Data Structures",
    question: "Difference between stack and queue?",
    answer: "Stack follows LIFO (Last-In First-Out like plates stack). Queue follows FIFO (First-In First-Out like line queue).",
    jobTypes: ["Backend", "Full Stack"],
    difficulty: "Beginner"
  },
  {
    id: 49,
    category: "3. Data Structures",
    question: "What is a deque?",
    answer: "A Double-Ended Queue allowing elements to be inserted and removed from both front and rear in O(1) time.",
    jobTypes: ["Backend"],
    difficulty: "Intermediate"
  },
  {
    id: 50,
    category: "3. Data Structures",
    question: "What is a priority queue?",
    answer: "An abstract data type where each element has a priority, and elements with higher priority are dequeued before lower priority ones.",
    jobTypes: ["Backend"],
    difficulty: "Intermediate"
  },
  {
    id: 51,
    category: "3. Data Structures",
    question: "What is a hash table?",
    answer: "A data structure mapping key-value pairs using a hash function to achieve average O(1) lookups, insertions, and deletions.",
    jobTypes: ["Backend", "Frontend", "Full Stack"],
    difficulty: "Intermediate"
  },
  {
    id: 52,
    category: "3. Data Structures",
    question: "What is hashing?",
    answer: "Converting arbitrary-sized key data into a fixed-size integer hash code using a hash function.",
    jobTypes: ["Backend", "Full Stack"],
    difficulty: "Intermediate"
  },
  {
    id: 53,
    category: "3. Data Structures",
    question: "What are collisions in hashing?",
    answer: "A collision occurs when two different keys map to the exact same hash index in a hash table.",
    jobTypes: ["Backend"],
    difficulty: "Intermediate"
  },
  {
    id: 54,
    category: "3. Data Structures",
    question: "What is a binary tree?",
    answer: "A hierarchical tree structure where every node has at most two child nodes (left and right).",
    jobTypes: ["Backend"],
    difficulty: "Intermediate"
  },
  {
    id: 55,
    category: "3. Data Structures",
    question: "What is a binary search tree (BST)?",
    answer: "A binary tree where left child values < node value < right child values, offering average O(log n) lookup.",
    jobTypes: ["Backend", "Full Stack"],
    difficulty: "Intermediate"
  },
  {
    id: 56,
    category: "3. Data Structures",
    question: "What is AVL tree?",
    answer: "A self-balancing binary search tree where height difference between left and right subtrees is at most 1.",
    jobTypes: ["Backend"],
    difficulty: "Advanced"
  },
  {
    id: 57,
    category: "3. Data Structures",
    question: "What is heap?",
    answer: "A complete binary tree-based data structure satisfying the heap property (parent >= child in Max Heap, parent <= child in Min Heap).",
    jobTypes: ["Backend"],
    difficulty: "Advanced"
  },
  {
    id: 58,
    category: "3. Data Structures",
    question: "Min Heap vs Max Heap?",
    answer: "Min Heap root holds the minimum element. Max Heap root holds the maximum element.",
    jobTypes: ["Backend"],
    difficulty: "Intermediate"
  },
  {
    id: 59,
    category: "3. Data Structures",
    question: "What is a graph?",
    answer: "A non-linear data structure consisting of a set of vertices (nodes) connected by edges.",
    jobTypes: ["Backend"],
    difficulty: "Intermediate"
  },
  {
    id: 60,
    category: "3. Data Structures",
    question: "Types of graphs?",
    answer: "Directed/Undirected, Weighted/Unweighted, Cyclic/Acyclic (DAG), Connected/Disconnected.",
    jobTypes: ["Backend"],
    difficulty: "Intermediate"
  },
  {
    id: 61,
    category: "3. Data Structures",
    question: "What is graph traversal?",
    answer: "Visiting all vertices in a graph systematically using BFS (breadth-first) or DFS (depth-first).",
    jobTypes: ["Backend"],
    difficulty: "Intermediate"
  },
  {
    id: 62,
    category: "3. Data Structures",
    question: "BFS vs DFS?",
    answer: "BFS uses Queue to explore level-by-level (shortest path unweighted). DFS uses Stack/Recursion to explore as deep as possible.",
    jobTypes: ["Backend", "Full Stack"],
    difficulty: "Intermediate"
  },
  {
    id: 63,
    category: "3. Data Structures",
    question: "What is a trie?",
    answer: "A prefix tree data structure used for fast string retrieval and autocomplete in O(L) time where L is string length.",
    jobTypes: ["Backend"],
    difficulty: "Advanced"
  },
  {
    id: 64,
    category: "3. Data Structures",
    question: "What is a segment tree?",
    answer: "A tree structure used for answering range queries (min, max, sum) and point updates in O(log n) time.",
    jobTypes: ["Backend"],
    difficulty: "Advanced"
  },
  {
    id: 65,
    category: "3. Data Structures",
    question: "What is Fenwick tree (Binary Indexed Tree)?",
    answer: "A space-efficient tree array maintaining prefix sums and updating elements in O(log n) time.",
    jobTypes: ["Backend"],
    difficulty: "Advanced"
  },
  {
    id: 66,
    category: "3. Data Structures",
    question: "What is disjoint set (Union-Find)?",
    answer: "A data structure tracking partition of set elements into non-overlapping subsets with Find and Union operations.",
    jobTypes: ["Backend"],
    difficulty: "Advanced"
  },
  {
    id: 67,
    category: "3. Data Structures",
    question: "What is adjacency matrix?",
    answer: "A 2D array representation of a graph where `matrix[i][j]` indicates edge presence/weight between vertices i and j.",
    jobTypes: ["Backend"],
    difficulty: "Intermediate"
  },
  {
    id: 68,
    category: "3. Data Structures",
    question: "What is adjacency list?",
    answer: "An array of lists representation where each vertex stores a list of adjacent neighbor vertices.",
    jobTypes: ["Backend"],
    difficulty: "Intermediate"
  },
  {
    id: 69,
    category: "3. Data Structures",
    question: "What is a circular linked list?",
    answer: "A linked list where the last node's pointer connects back to the first node forming a closed ring.",
    jobTypes: ["Backend"],
    difficulty: "Intermediate"
  },
  {
    id: 70,
    category: "3. Data Structures",
    question: "What is doubly linked list?",
    answer: "A linked list where nodes contain `prev` and `next` pointers, allowing bi-directional traversal.",
    jobTypes: ["Backend"],
    difficulty: "Intermediate"
  },
  {
    id: 71,
    category: "3. Data Structures",
    question: "What is a sparse matrix?",
    answer: "A matrix in which most elements are zero, efficiently represented via coordinate or compressed sparse row formats.",
    jobTypes: ["Data", "Backend"],
    difficulty: "Intermediate"
  },
  {
    id: 72,
    category: "3. Data Structures",
    question: "What is dynamic array?",
    answer: "An array that resizes automatically when capacity is reached (e.g. vector in C++, ArrayList in Java, JS Array) with amortized O(1) push.",
    jobTypes: ["Backend", "Frontend"],
    difficulty: "Beginner"
  },
  {
    id: 73,
    category: "3. Data Structures",
    question: "What is load factor?",
    answer: "Ratio of number of stored elements to total hash table capacity (`n/k`). Triggers rehashing when threshold (e.g. 0.75) is exceeded.",
    jobTypes: ["Backend"],
    difficulty: "Intermediate"
  },
  {
    id: 74,
    category: "3. Data Structures",
    question: "What is collision resolution?",
    answer: "Techniques to handle hash collisions: Chaining (linked list at bucket) and Open Addressing (linear probing, quadratic probing).",
    jobTypes: ["Backend"],
    difficulty: "Intermediate"
  },
  {
    id: 75,
    category: "3. Data Structures",
    question: "Linear probing vs chaining?",
    answer: "Chaining stores colliding keys in a list at index. Linear probing searches next contiguous empty slot in array.",
    jobTypes: ["Backend"],
    difficulty: "Intermediate"
  },
  {
    id: 76,
    category: "3. Data Structures",
    question: "What is tree traversal?",
    answer: "Process of visiting every node in a tree structure exactly once.",
    jobTypes: ["Backend"],
    difficulty: "Intermediate"
  },
  {
    id: 77,
    category: "3. Data Structures",
    question: "Preorder vs Inorder vs Postorder?",
    answer: "Preorder: Root -> Left -> Right; Inorder: Left -> Root -> Right (sorted in BST); Postorder: Left -> Right -> Root.",
    jobTypes: ["Backend"],
    difficulty: "Intermediate"
  },
  {
    id: 78,
    category: "3. Data Structures",
    question: "What is level-order traversal?",
    answer: "BFS traversal visiting tree nodes level by level from top to bottom, left to right using a queue.",
    jobTypes: ["Backend"],
    difficulty: "Intermediate"
  },
  {
    id: 79,
    category: "3. Data Structures",
    question: "What is recursion stack?",
    answer: "Call stack memory reserved by OS to track active recursive function calls and local variables.",
    jobTypes: ["Backend"],
    difficulty: "Intermediate"
  },
  {
    id: 80,
    category: "3. Data Structures",
    question: "Time complexity of common data structures?",
    answer: "Array: Access O(1), Search O(n); Hash Table: Access/Insert/Search O(1) avg; BST: Search/Insert O(log n); Linked List: Access O(n), Insert at head O(1).",
    jobTypes: ["Backend", "Full Stack"],
    difficulty: "Intermediate"
  },

  // ── 4. Algorithms (Q81 - Q120) ──
  {
    id: 81,
    category: "4. Algorithms",
    question: "What is an algorithm?",
    answer: "A unambiguous computational procedure taking input values and producing output in finite steps.",
    jobTypes: ["General"],
    difficulty: "Beginner"
  },
  {
    id: 82,
    category: "4. Algorithms",
    question: "What is time complexity?",
    answer: "Computational complexity measuring how execution time of an algorithm grows relative to input size N.",
    jobTypes: ["Backend", "Frontend", "Full Stack"],
    difficulty: "Intermediate"
  },
  {
    id: 83,
    category: "4. Algorithms",
    question: "What is space complexity?",
    answer: "Amount of memory space required by an algorithm to run as a function of input size N.",
    jobTypes: ["Backend", "Full Stack"],
    difficulty: "Intermediate"
  },
  {
    id: 84,
    category: "4. Algorithms",
    question: "What is Big O notation?",
    answer: "Mathematical notation describing upper bound execution time or space requirement (worst-case scenario).",
    jobTypes: ["Backend", "Frontend", "Full Stack"],
    difficulty: "Intermediate"
  },
  {
    id: 85,
    category: "4. Algorithms",
    question: "What is Big Theta notation?",
    answer: "Mathematical notation bounding function execution time from above and below (tight bound / average-case).",
    jobTypes: ["Backend"],
    difficulty: "Intermediate"
  },
  {
    id: 86,
    category: "4. Algorithms",
    question: "What is Big Omega notation?",
    answer: "Mathematical notation defining lower bound execution time (best-case scenario).",
    jobTypes: ["Backend"],
    difficulty: "Intermediate"
  },
  {
    id: 87,
    category: "4. Algorithms",
    question: "What is binary search?",
    answer: "Divide-and-conquer algorithm searching sorted array by halving search space in O(log n) time.",
    codeSnippet: "function binarySearch(arr, target) {\n  let low = 0, high = arr.length - 1;\n  while (low <= high) {\n    let mid = Math.floor((low + high) / 2);\n    if (arr[mid] === target) return mid;\n    if (arr[mid] < target) low = mid + 1;\n    else high = mid - 1;\n  }\n  return -1;\n}",
    jobTypes: ["Backend", "Frontend", "Full Stack"],
    difficulty: "Intermediate"
  },
  {
    id: 88,
    category: "4. Algorithms",
    question: "What is linear search?",
    answer: "Iterative search checking every element sequentially in O(n) time.",
    jobTypes: ["Backend", "General"],
    difficulty: "Beginner"
  },
  {
    id: 89,
    category: "4. Algorithms",
    question: "Difference between linear and binary search?",
    answer: "Linear works on unsorted arrays in O(n). Binary requires sorted array and runs in O(log n).",
    jobTypes: ["Backend", "Frontend"],
    difficulty: "Beginner"
  },
  {
    id: 90,
    category: "4. Algorithms",
    question: "What is merge sort?",
    answer: "Stable divide-and-conquer algorithm dividing array in halves, sorting recursively, and merging in O(n log n) time.",
    jobTypes: ["Backend"],
    difficulty: "Intermediate"
  },
  {
    id: 91,
    category: "4. Algorithms",
    question: "What is quick sort?",
    answer: "Divide-and-conquer algorithm partitioning around pivot. Average time O(n log n), worst O(n^2).",
    jobTypes: ["Backend"],
    difficulty: "Intermediate"
  },
  {
    id: 92,
    category: "4. Algorithms",
    question: "What is bubble sort?",
    answer: "Simple sorting algorithm repeatedly swapping adjacent elements out of order in O(n^2) time.",
    jobTypes: ["Backend"],
    difficulty: "Beginner"
  },
  {
    id: 93,
    category: "4. Algorithms",
    question: "What is insertion sort?",
    answer: "Builds final sorted array one item at a time by shifting elements in O(n^2) time (efficient for small N).",
    jobTypes: ["Backend"],
    difficulty: "Beginner"
  },
  {
    id: 94,
    category: "4. Algorithms",
    question: "What is selection sort?",
    answer: "Repeatedly finds minimum element from unsorted part and places it at beginning in O(n^2) time.",
    jobTypes: ["Backend"],
    difficulty: "Beginner"
  },
  {
    id: 95,
    category: "4. Algorithms",
    question: "What is heap sort?",
    answer: "Comparison sorting algorithm using Binary Heap data structure running in O(n log n) time with O(1) auxiliary space.",
    jobTypes: ["Backend"],
    difficulty: "Intermediate"
  },
  {
    id: 96,
    category: "4. Algorithms",
    question: "What is counting sort?",
    answer: "Non-comparison sorting algorithm counting element occurrences for keys within specific integer range in O(n + k) time.",
    jobTypes: ["Backend"],
    difficulty: "Intermediate"
  },
  {
    id: 97,
    category: "4. Algorithms",
    question: "What is radix sort?",
    answer: "Non-comparison integer sorting processing digits from least to most significant in O(d * (n + k)) time.",
    jobTypes: ["Backend"],
    difficulty: "Advanced"
  },
  {
    id: 98,
    category: "4. Algorithms",
    question: "What is divide and conquer?",
    answer: "Paradigm breaking problem into subproblems, solving recursively, and combining solutions (e.g. Merge Sort, Quick Sort).",
    jobTypes: ["Backend"],
    difficulty: "Intermediate"
  },
  {
    id: 99,
    category: "4. Algorithms",
    question: "What is greedy algorithm?",
    answer: "Algorithmic approach making locally optimal choice at each step hoping to find global optimum (e.g. Prim's, Huffman).",
    jobTypes: ["Backend"],
    difficulty: "Intermediate"
  },
  {
    id: 100,
    category: "4. Algorithms",
    question: "What is dynamic programming?",
    answer: "Optimization technique solving complex problems by breaking them into overlapping subproblems and storing subproblem results.",
    jobTypes: ["Backend", "Full Stack"],
    difficulty: "Advanced"
  },
  {
    id: 101,
    category: "4. Algorithms",
    question: "What is memoization?",
    answer: "Top-down optimization storing results of expensive recursive function calls in lookup table.",
    jobTypes: ["Backend", "Full Stack"],
    difficulty: "Intermediate"
  },
  {
    id: 102,
    category: "4. Algorithms",
    question: "What is tabulation?",
    answer: "Bottom-up dynamic programming solving subproblems iteratively from smallest to target value in table.",
    jobTypes: ["Backend"],
    difficulty: "Intermediate"
  },
  {
    id: 103,
    category: "4. Algorithms",
    question: "What is backtracking?",
    answer: "Algorithmic technique incrementally building candidates and abandoning ('backtracking') when candidate cannot lead to valid solution.",
    jobTypes: ["Backend"],
    difficulty: "Advanced"
  },
  {
    id: 104,
    category: "4. Algorithms",
    question: "What is branch and bound?",
    answer: "Optimization algorithm state-space tree traversal pruning branches exceeding bounding bounds.",
    jobTypes: ["Backend"],
    difficulty: "Advanced"
  },
  {
    id: 105,
    category: "4. Algorithms",
    question: "What is recursion?",
    answer: "Function self-invocation reduced toward base case.",
    jobTypes: ["Backend"],
    difficulty: "Beginner"
  },
  {
    id: 106,
    category: "4. Algorithms",
    question: "What is tail recursion?",
    answer: "Recursive call is final statement of function, allowing compiler optimization to reuse call stack frame (O(1) space).",
    jobTypes: ["Backend"],
    difficulty: "Intermediate"
  },
  {
    id: 107,
    category: "4. Algorithms",
    question: "What is sliding window?",
    answer: "Pattern maintaining window range over array/string to solve range problems in O(n) time.",
    codeSnippet: "let left = 0, sum = 0;\nfor (let right = 0; right < arr.length; right++) {\n  sum += arr[right];\n  while (sum > K) { sum -= arr[left++]; }\n}",
    jobTypes: ["Backend", "Full Stack"],
    difficulty: "Intermediate"
  },
  {
    id: 108,
    category: "4. Algorithms",
    question: "What is two pointers technique?",
    answer: "Algorithmic pattern using two pointer indices moving toward each other or same direction to process sorted arrays in O(n).",
    jobTypes: ["Backend", "Frontend"],
    difficulty: "Intermediate"
  },
  {
    id: 109,
    category: "4. Algorithms",
    question: "What is prefix sum?",
    answer: "Precomputing array cumulative sum `prefix[i] = prefix[i-1] + arr[i]` enabling O(1) range sum queries.",
    jobTypes: ["Backend"],
    difficulty: "Intermediate"
  },
  {
    id: 110,
    category: "4. Algorithms",
    question: "What is binary lifting?",
    answer: "Precomputing `2^k` ancestors for tree nodes allowing O(log n) Lowest Common Ancestor (LCA) queries.",
    jobTypes: ["Backend"],
    difficulty: "Advanced"
  },
  {
    id: 111,
    category: "4. Algorithms",
    question: "What is topological sorting?",
    answer: "Linear ordering of vertices in Directed Acyclic Graph (DAG) such that for every edge `u -> v`, `u` comes before `v`.",
    jobTypes: ["Backend"],
    difficulty: "Advanced"
  },
  {
    id: 112,
    category: "4. Algorithms",
    question: "What is Dijkstra's algorithm?",
    answer: "Greedy algorithm finding single-source shortest paths in weighted non-negative graphs using Priority Queue in O((V + E) log V).",
    jobTypes: ["Backend"],
    difficulty: "Advanced"
  },
  {
    id: 113,
    category: "4. Algorithms",
    question: "What is Bellman-Ford algorithm?",
    answer: "Shortest path algorithm handling graphs with negative edge weights and detecting negative cycles in O(V * E) time.",
    jobTypes: ["Backend"],
    difficulty: "Advanced"
  },
  {
    id: 114,
    category: "4. Algorithms",
    question: "What is Floyd-Warshall algorithm?",
    answer: "Dynamic programming algorithm computing all-pairs shortest paths in O(V^3) time.",
    jobTypes: ["Backend"],
    difficulty: "Advanced"
  },
  {
    id: 115,
    category: "4. Algorithms",
    question: "What is Kruskal's algorithm?",
    answer: "Greedy algorithm finding Minimum Spanning Tree (MST) by sorting edges and adding edges using Union-Find in O(E log E).",
    jobTypes: ["Backend"],
    difficulty: "Advanced"
  },
  {
    id: 116,
    category: "4. Algorithms",
    question: "What is Prim's algorithm?",
    answer: "Greedy algorithm building Minimum Spanning Tree (MST) node-by-node using Priority Queue in O((V + E) log V).",
    jobTypes: ["Backend"],
    difficulty: "Advanced"
  },
  {
    id: 117,
    category: "4. Algorithms",
    question: "What is Kadane's algorithm?",
    answer: "Dynamic programming technique finding maximum subarray sum in 1D array in O(n) time.",
    codeSnippet: "let maxSoFar = arr[0], maxEndingHere = arr[0];\nfor (let i = 1; i < arr.length; i++) {\n  maxEndingHere = Math.max(arr[i], maxEndingHere + arr[i]);\n  maxSoFar = Math.max(maxSoFar, maxEndingHere);\n}",
    jobTypes: ["Backend", "Full Stack"],
    difficulty: "Intermediate"
  },
  {
    id: 118,
    category: "4. Algorithms",
    question: "What is KMP algorithm?",
    answer: "Knuth-Morris-Pratt pattern searching algorithm using LPS (longest prefix suffix) array to search substring in O(N + M) time.",
    jobTypes: ["Backend"],
    difficulty: "Advanced"
  },
  {
    id: 119,
    category: "4. Algorithms",
    question: "What is Rabin-Karp algorithm?",
    answer: "String matching algorithm using rolling hash function to search pattern in O(N + M) average time.",
    jobTypes: ["Backend"],
    difficulty: "Advanced"
  },
  {
    id: 120,
    category: "4. Algorithms",
    question: "What is Huffman coding?",
    answer: "Greedy data compression algorithm building prefix binary trees based on frequency of characters.",
    jobTypes: ["Backend"],
    difficulty: "Advanced"
  },

  // ── 5. Programming Languages (Q121 - Q145) ──
  {
    id: 121,
    category: "5. Programming Languages",
    question: "What is C?",
    answer: "Low-level compiled procedural language featuring direct memory access via pointers.",
    jobTypes: ["Backend"],
    difficulty: "Beginner"
  },
  {
    id: 122,
    category: "5. Programming Languages",
    question: "What is C++?",
    answer: "Extension of C adding Object-Oriented Programming, templates (STL), and modern memory management features.",
    jobTypes: ["Backend"],
    difficulty: "Intermediate"
  },
  {
    id: 123,
    category: "5. Programming Languages",
    question: "What is Java?",
    answer: "Object-oriented class-based language compiled to bytecode running on Java Virtual Machine (JVM) ('Write Once, Run Anywhere').",
    jobTypes: ["Backend", "Full Stack"],
    difficulty: "Intermediate"
  },
  {
    id: 124,
    category: "5. Programming Languages",
    question: "What is Python?",
    answer: "High-level interpreted language known for clean syntax, dynamic typing, rich standard libraries, and AI/Data ecosystems.",
    jobTypes: ["Backend", "Data", "Full Stack"],
    difficulty: "Beginner"
  },
  {
    id: 125,
    category: "5. Programming Languages",
    question: "What is JavaScript?",
    answer: "High-level single-threaded dynamic language powering web client scripts and Node.js backend servers via V8 event loop.",
    jobTypes: ["Frontend", "Full Stack", "Backend"],
    difficulty: "Beginner"
  },
  {
    id: 126,
    category: "5. Programming Languages",
    question: "Difference between compiled and interpreted languages?",
    answer: "Compiled (C++, Rust) translates entire code to machine code before execution (faster). Interpreted (Python, JS) translates line-by-line during runtime.",
    jobTypes: ["Backend", "Full Stack"],
    difficulty: "Beginner"
  },
  {
    id: 127,
    category: "5. Programming Languages",
    question: "What is garbage collection?",
    answer: "Automatic memory management process reclaiming heap memory occupied by objects no longer referenced by application.",
    jobTypes: ["Backend", "Full Stack"],
    difficulty: "Intermediate"
  },
  {
    id: 128,
    category: "5. Programming Languages",
    question: "What is memory management?",
    answer: "Process of allocating memory (stack/heap), tracking usage, and freeing unused memory during runtime.",
    jobTypes: ["Backend", "DevOps"],
    difficulty: "Intermediate"
  },
  {
    id: 129,
    category: "5. Programming Languages",
    question: "What is pointer?",
    answer: "Variable storing exact memory address of another variable.",
    jobTypes: ["Backend"],
    difficulty: "Intermediate"
  },
  {
    id: 130,
    category: "5. Programming Languages",
    question: "What is reference?",
    answer: "An alias or alternative name for an existing variable, bound permanently upon initialization.",
    jobTypes: ["Backend"],
    difficulty: "Intermediate"
  },
  {
    id: 131,
    category: "5. Programming Languages",
    question: "Pointer vs Reference?",
    answer: "Pointer can be null, reassigned, and supports arithmetic (`ptr++`). Reference cannot be null, cannot be reassigned, and no pointer arithmetic.",
    jobTypes: ["Backend"],
    difficulty: "Intermediate"
  },
  {
    id: 132,
    category: "5. Programming Languages",
    question: "What is exception handling?",
    answer: "Mechanism (`try`, `catch`, `finally`, `throw`) handling runtime errors gracefully without unexpected application crashes.",
    jobTypes: ["Backend", "Frontend", "Full Stack"],
    difficulty: "Beginner"
  },
  {
    id: 133,
    category: "5. Programming Languages",
    question: "What is multithreading?",
    answer: "Concurrent execution of multiple threads within a single process to maximize CPU utilization.",
    jobTypes: ["Backend", "Full Stack"],
    difficulty: "Intermediate"
  },
  {
    id: 134,
    category: "5. Programming Languages",
    question: "What is concurrency?",
    answer: "Ability of a system to decompose a program into tasks that can execute out-of-order or in overlapping time frames.",
    jobTypes: ["Backend", "DevOps"],
    difficulty: "Intermediate"
  },
  {
    id: 135,
    category: "5. Programming Languages",
    question: "What is synchronization?",
    answer: "Coordinating execution of threads using locks (mutex, semaphores) to ensure shared resources are accessed safely.",
    jobTypes: ["Backend"],
    difficulty: "Advanced"
  },
  {
    id: 136,
    category: "5. Programming Languages",
    question: "What is deadlock?",
    answer: "Situation where two or more threads are blocked forever, each waiting for a lock held by the other.",
    jobTypes: ["Backend"],
    difficulty: "Advanced"
  },
  {
    id: 137,
    category: "5. Programming Languages",
    question: "What is race condition?",
    answer: "Flaw where system outcome depends on un-synchronized timing of thread execution sequence.",
    jobTypes: ["Backend"],
    difficulty: "Advanced"
  },
  {
    id: 138,
    category: "5. Programming Languages",
    question: "What is lambda function?",
    answer: "Anonymous inline function defined without identifier (`(x) => x * 2` in JS, `lambda x: x * 2` in Python).",
    jobTypes: ["Frontend", "Backend"],
    difficulty: "Beginner"
  },
  {
    id: 139,
    category: "5. Programming Languages",
    question: "What are generics?",
    answer: "Feature allowing classes, interfaces, and methods to operate on parameterized data types while maintaining compile-time type safety.",
    jobTypes: ["Backend", "Full Stack"],
    difficulty: "Intermediate"
  },
  {
    id: 140,
    category: "5. Programming Languages",
    question: "What is iterator?",
    answer: "Object enabling traversal through container collections (lists, sets) sequential access without exposing internal structure.",
    jobTypes: ["Backend", "Frontend"],
    difficulty: "Intermediate"
  },
  {
    id: 141,
    category: "5. Programming Languages",
    question: "What is collection framework?",
    answer: "Unified architecture in languages (Java Collections, C++ STL) providing data structure interfaces and utility classes.",
    jobTypes: ["Backend"],
    difficulty: "Intermediate"
  },
  {
    id: 142,
    category: "5. Programming Languages",
    question: "What is immutable object?",
    answer: "An object whose state cannot be modified after creation (e.g. String in Java/Python). Modifying creates a new object.",
    jobTypes: ["Backend", "Frontend"],
    difficulty: "Intermediate"
  },
  {
    id: 143,
    category: "5. Programming Languages",
    question: "What is mutable object?",
    answer: "Object whose internal state or property fields can be updated after creation (e.g. List, Array, Map).",
    jobTypes: ["Backend", "Frontend"],
    difficulty: "Beginner"
  },
  {
    id: 144,
    category: "5. Programming Languages",
    question: "What is package/module?",
    answer: "Mechanism grouping related classes, functions, and interfaces into namespaces to prevent naming collisions and organize code.",
    jobTypes: ["Backend", "Frontend"],
    difficulty: "Beginner"
  },
  {
    id: 145,
    category: "5. Programming Languages",
    question: "What is namespace?",
    answer: "Declarative region providing scope to identifiers (names of types, functions, variables) preventing name conflicts.",
    jobTypes: ["Backend"],
    difficulty: "Intermediate"
  },

  // ── 6. Database & SQL (Q146 - Q165) ──
  {
    id: 146,
    category: "6. Database & SQL",
    question: "What is a database?",
    answer: "Organized collection of structured data stored electronically in computer system managed by DBMS.",
    jobTypes: ["Backend", "Full Stack", "Data"],
    difficulty: "Beginner"
  },
  {
    id: 147,
    category: "6. Database & SQL",
    question: "What is SQL?",
    answer: "Structured Query Language used to query, insert, update, and manage relational databases.",
    jobTypes: ["Backend", "Full Stack", "Data"],
    difficulty: "Beginner"
  },
  {
    id: 148,
    category: "6. Database & SQL",
    question: "Difference between SQL and NoSQL?",
    answer: "SQL: Relational, rigid schema, ACID compliant (PostgreSQL, MySQL). NoSQL: Non-relational, dynamic schema, horizontal scaling (MongoDB, Redis).",
    jobTypes: ["Backend", "Full Stack", "Data"],
    difficulty: "Intermediate"
  },
  {
    id: 149,
    category: "6. Database & SQL",
    question: "What is normalization?",
    answer: "Process of structuring relational database (1NF, 2NF, 3NF, BCNF) to reduce data redundancy and improve data integrity.",
    jobTypes: ["Backend", "Data"],
    difficulty: "Intermediate"
  },
  {
    id: 150,
    category: "6. Database & SQL",
    question: "What is denormalization?",
    answer: "Optimization strategy adding redundant data to relational tables to minimize slow join operations and improve read performance.",
    jobTypes: ["Backend", "Data"],
    difficulty: "Intermediate"
  },
  {
    id: 151,
    category: "6. Database & SQL",
    question: "What is a primary key?",
    answer: "Column or set of columns uniquely identifying each row in a database table (cannot be NULL).",
    jobTypes: ["Backend", "Full Stack"],
    difficulty: "Beginner"
  },
  {
    id: 152,
    category: "6. Database & SQL",
    question: "What is a foreign key?",
    answer: "Field in table referring to Primary Key of another table, establishing relational link and referential integrity.",
    jobTypes: ["Backend", "Full Stack"],
    difficulty: "Beginner"
  },
  {
    id: 153,
    category: "6. Database & SQL",
    question: "What are joins?",
    answer: "SQL clauses combining columns from one or more tables based on related field values (INNER, LEFT, RIGHT, FULL OUTER).",
    codeSnippet: "SELECT u.name, o.total\nFROM users u\nJOIN orders o ON u.id = o.user_id;",
    jobTypes: ["Backend", "Full Stack", "Data"],
    difficulty: "Intermediate"
  },
  {
    id: 154,
    category: "6. Database & SQL",
    question: "Difference between INNER JOIN and LEFT JOIN?",
    answer: "INNER JOIN returns matching records in both tables. LEFT JOIN returns all records from left table and matched records from right (NULL if no match).",
    jobTypes: ["Backend", "Full Stack", "Data"],
    difficulty: "Intermediate"
  },
  {
    id: 155,
    category: "6. Database & SQL",
    question: "What is indexing?",
    answer: "B-Tree/Hash data structure created on database columns speeding up data retrieval queries at cost of slower writes.",
    jobTypes: ["Backend", "Data"],
    difficulty: "Intermediate"
  },
  {
    id: 156,
    category: "6. Database & SQL",
    question: "What is a transaction?",
    answer: "Sequence of database operations executed as a single logical unit of work (all-or-nothing).",
    jobTypes: ["Backend", "Full Stack"],
    difficulty: "Intermediate"
  },
  {
    id: 157,
    category: "6. Database & SQL",
    question: "What are ACID properties?",
    answer: "Atomicity (all or nothing), Consistency (valid state transitions), Isolation (concurrent transactions don't interfere), Durability (persisted commits).",
    jobTypes: ["Backend", "Full Stack", "Data"],
    difficulty: "Intermediate"
  },
  {
    id: 158,
    category: "6. Database & SQL",
    question: "What is a view?",
    answer: "Virtual table based on result set of a pre-written SQL query.",
    jobTypes: ["Backend", "Data"],
    difficulty: "Intermediate"
  },
  {
    id: 159,
    category: "6. Database & SQL",
    question: "What is a stored procedure?",
    answer: "Precompiled set of SQL statements saved in database server for reuse and execution efficiency.",
    jobTypes: ["Backend", "Data"],
    difficulty: "Intermediate"
  },
  {
    id: 160,
    category: "6. Database & SQL",
    question: "What is a trigger?",
    answer: "Procedural code executed automatically in response to events (INSERT, UPDATE, DELETE) on database tables.",
    jobTypes: ["Backend", "Data"],
    difficulty: "Intermediate"
  },
  {
    id: 161,
    category: "6. Database & SQL",
    question: "What is aggregate function?",
    answer: "SQL functions operating on multiple values to compute single summary result (`COUNT`, `SUM`, `AVG`, `MIN`, `MAX`).",
    jobTypes: ["Backend", "Data"],
    difficulty: "Beginner"
  },
  {
    id: 162,
    category: "6. Database & SQL",
    question: "What is GROUP BY?",
    answer: "SQL clause grouping rows with same values into summary rows alongside aggregate functions.",
    jobTypes: ["Backend", "Data"],
    difficulty: "Beginner"
  },
  {
    id: 163,
    category: "6. Database & SQL",
    question: "What is HAVING clause?",
    answer: "SQL clause filtering grouped records after `GROUP BY` aggregation (unlike `WHERE` which filters before grouping).",
    jobTypes: ["Backend", "Data"],
    difficulty: "Intermediate"
  },
  {
    id: 164,
    category: "6. Database & SQL",
    question: "Difference between DELETE, DROP, and TRUNCATE?",
    answer: "`DELETE`: DML row-by-row removal (rollbackable). `TRUNCATE`: DDL fast table reset (removes all rows, resets identity). `DROP`: DDL removes entire table structure.",
    jobTypes: ["Backend", "Data"],
    difficulty: "Intermediate"
  },
  {
    id: 165,
    category: "6. Database & SQL",
    question: "What is database optimization?",
    answer: "Improving database performance using query indexing, EXPLAIN plan tuning, connection pooling, partition tables, and caching.",
    jobTypes: ["Backend", "Data", "DevOps"],
    difficulty: "Advanced"
  },

  // ── 7. System Design & CS Fundamentals (Q166 - Q180) ──
  {
    id: 166,
    category: "7. System Design & CS Fundamentals",
    question: "What is an operating system?",
    answer: "Core system software managing computer hardware, memory resources, process execution, and file I/O operations.",
    jobTypes: ["DevOps", "Backend"],
    difficulty: "Beginner"
  },
  {
    id: 167,
    category: "7. System Design & CS Fundamentals",
    question: "What is a process?",
    answer: "An executing program instance with its own private virtual memory address space, file handles, and security context.",
    jobTypes: ["Backend", "DevOps"],
    difficulty: "Intermediate"
  },
  {
    id: 168,
    category: "7. System Design & CS Fundamentals",
    question: "What is a thread?",
    answer: "Smallest unit of CPU execution within a process sharing process memory space with other threads.",
    jobTypes: ["Backend", "DevOps"],
    difficulty: "Intermediate"
  },
  {
    id: 169,
    category: "7. System Design & CS Fundamentals",
    question: "Process vs Thread?",
    answer: "Process has isolated memory space; heavy context switching. Thread shares process memory space; lightweight context switching.",
    jobTypes: ["Backend", "DevOps"],
    difficulty: "Intermediate"
  },
  {
    id: 170,
    category: "7. System Design & CS Fundamentals",
    question: "What is CPU scheduling?",
    answer: "OS process selection algorithm determining which process runs on CPU (Round Robin, FCFS, Priority, SJF).",
    jobTypes: ["DevOps", "Backend"],
    difficulty: "Intermediate"
  },
  {
    id: 171,
    category: "7. System Design & CS Fundamentals",
    question: "What is virtual memory?",
    answer: "Memory management technique giving processes illusion of large contiguous RAM by mapping virtual addresses to physical RAM/disk swap.",
    jobTypes: ["DevOps", "Backend"],
    difficulty: "Intermediate"
  },
  {
    id: 172,
    category: "7. System Design & CS Fundamentals",
    question: "What is paging?",
    answer: "Memory allocation scheme retrieving data from secondary storage in fixed-size blocks ('pages') into physical RAM ('frames').",
    jobTypes: ["DevOps", "Backend"],
    difficulty: "Intermediate"
  },
  {
    id: 173,
    category: "7. System Design & CS Fundamentals",
    question: "What is caching?",
    answer: "High-speed temporary storage layer (In-memory Redis, Memcached, CDN) serving frequent data quickly to reduce latency.",
    jobTypes: ["Backend", "Full Stack", "DevOps"],
    difficulty: "Intermediate"
  },
  {
    id: 174,
    category: "7. System Design & CS Fundamentals",
    question: "What is load balancing?",
    answer: "Distributing incoming network traffic across multiple backend servers using algorithms (Round Robin, Least Connections, IP Hash) to ensure high availability.",
    jobTypes: ["DevOps", "Backend", "Full Stack"],
    difficulty: "Intermediate"
  },
  {
    id: 175,
    category: "7. System Design & CS Fundamentals",
    question: "What is client-server architecture?",
    answer: "Network architecture where client devices request services and resources from centralized server providers over network protocols.",
    jobTypes: ["Full Stack", "Frontend", "Backend"],
    difficulty: "Beginner"
  },
  {
    id: 176,
    category: "7. System Design & CS Fundamentals",
    question: "What is REST API?",
    answer: "Representational State Transfer architectural style for web APIs utilizing HTTP verbs (GET, POST, PUT, DELETE) and stateless JSON communications.",
    jobTypes: ["Backend", "Frontend", "Full Stack"],
    difficulty: "Intermediate"
  },
  {
    id: 177,
    category: "7. System Design & CS Fundamentals",
    question: "What is HTTP?",
    answer: "Hypertext Transfer Protocol — application-layer stateless protocol used to transmit hypermedia documents across web networks.",
    jobTypes: ["Frontend", "Backend", "Full Stack"],
    difficulty: "Beginner"
  },
  {
    id: 178,
    category: "7. System Design & CS Fundamentals",
    question: "What is HTTPS?",
    answer: "HTTP encrypted with TLS/SSL providing communication confidentiality, integrity, and server authentication over TCP port 443.",
    jobTypes: ["Backend", "DevOps", "Full Stack"],
    difficulty: "Intermediate"
  },
  {
    id: 179,
    category: "7. System Design & CS Fundamentals",
    question: "What is DNS?",
    answer: "Domain Name System — distributed hierarchical database resolving human-readable domain names (e.g. denno.com) into numerical IP addresses.",
    jobTypes: ["DevOps", "Backend"],
    difficulty: "Intermediate"
  },
  {
    id: 180,
    category: "7. System Design & CS Fundamentals",
    question: "What is CDN?",
    answer: "Content Delivery Network — geographically distributed network of proxy servers delivering static web assets quickly to users.",
    jobTypes: ["Frontend", "DevOps", "Full Stack"],
    difficulty: "Intermediate"
  },

  // ── 8. Coding Interview Scenarios (Q181 - Q190) ──
  {
    id: 181,
    category: "8. Coding Interview Scenarios",
    question: "Reverse a string.",
    answer: "Reverse character order using two-pointer approach or built-in split-reverse-join pattern in O(n) time.",
    codeSnippet: "function reverseString(str) {\n  return str.split('').reverse().join('');\n}",
    jobTypes: ["Frontend", "Backend", "Full Stack"],
    difficulty: "Beginner"
  },
  {
    id: 182,
    category: "8. Coding Interview Scenarios",
    question: "Find the largest element in an array.",
    answer: "Iterate through array tracking current maximum value in O(n) time and O(1) space.",
    codeSnippet: "function findMax(arr) {\n  let max = arr[0];\n  for (let num of arr) if (num > max) max = num;\n  return max;\n}",
    jobTypes: ["Backend", "Frontend"],
    difficulty: "Beginner"
  },
  {
    id: 183,
    category: "8. Coding Interview Scenarios",
    question: "Find the second largest element.",
    answer: "Maintain `firstMax` and `secondMax` variables in single traversal O(n) time.",
    codeSnippet: "function secondLargest(arr) {\n  let first = -Infinity, second = -Infinity;\n  for (let n of arr) {\n    if (n > first) { second = first; first = n; }\n    else if (n > second && n !== first) { second = n; }\n  }\n  return second;\n}",
    jobTypes: ["Backend", "Full Stack"],
    difficulty: "Intermediate"
  },
  {
    id: 184,
    category: "8. Coding Interview Scenarios",
    question: "Check whether a string is a palindrome.",
    answer: "Compare start pointer and end pointer moving inward until pointers meet in O(n) time.",
    codeSnippet: "function isPalindrome(s) {\n  let clean = s.toLowerCase().replace(/[^a-z0-9]/g, '');\n  return clean === clean.split('').reverse().join('');\n}",
    jobTypes: ["Frontend", "Backend"],
    difficulty: "Beginner"
  },
  {
    id: 185,
    category: "8. Coding Interview Scenarios",
    question: "Find duplicate elements in an array.",
    answer: "Use Hash Set or Frequency Map to detect repeated elements in O(n) time and O(n) space.",
    codeSnippet: "function findDuplicates(arr) {\n  let seen = new Set(), dupes = new Set();\n  for (let item of arr) {\n    if (seen.has(item)) dupes.add(item);\n    else seen.add(item);\n  }\n  return Array.from(dupes);\n}",
    jobTypes: ["Backend", "Frontend"],
    difficulty: "Intermediate"
  },
  {
    id: 186,
    category: "8. Coding Interview Scenarios",
    question: "Remove duplicates from an array.",
    answer: "Convert array to Set `[...new Set(arr)]` or use two-pointer technique in sorted array in O(n) time.",
    jobTypes: ["Frontend", "Backend"],
    difficulty: "Beginner"
  },
  {
    id: 187,
    category: "8. Coding Interview Scenarios",
    question: "Find the missing number in an array.",
    answer: "Use Gauss Sum formula `expectedSum = n*(n+1)/2` and subtract actual array sum in O(n) time and O(1) space.",
    codeSnippet: "function findMissing(nums) {\n  let n = nums.length;\n  let expected = (n * (n + 1)) / 2;\n  let actual = nums.reduce((a, b) => a + b, 0);\n  return expected - actual;\n}",
    jobTypes: ["Backend", "Full Stack"],
    difficulty: "Intermediate"
  },
  {
    id: 188,
    category: "8. Coding Interview Scenarios",
    question: "Merge two sorted arrays.",
    answer: "Use two pointers starting at index 0 of both arrays, appending smaller element to result array in O(n + m) time.",
    jobTypes: ["Backend", "Full Stack"],
    difficulty: "Intermediate"
  },
  {
    id: 189,
    category: "8. Coding Interview Scenarios",
    question: "Check if two strings are anagrams.",
    answer: "Count character frequencies using Hash Map / Array of size 26 and ensure all frequencies match in O(n) time.",
    codeSnippet: "function isAnagram(s, t) {\n  if (s.length !== t.length) return false;\n  let count = {};\n  for (let c of s) count[c] = (count[c] || 0) + 1;\n  for (let c of t) {\n    if (!count[c]) return false;\n    count[c]--;\n  }\n  return true;\n}",
    jobTypes: ["Frontend", "Backend"],
    difficulty: "Intermediate"
  },
  {
    id: 190,
    category: "8. Coding Interview Scenarios",
    question: "Find the first non-repeating character.",
    answer: "Count character frequencies in pass 1, then find first character with count 1 in pass 2 in O(n) time.",
    jobTypes: ["Frontend", "Backend"],
    difficulty: "Intermediate"
  },

  // ── 9. Advanced Coding Problems (Q191 - Q200) ──
  {
    id: 191,
    category: "9. Advanced Coding Problems",
    question: "Solve the Two Sum problem.",
    answer: "Store target complement `target - nums[i]` in Hash Map during iteration for O(n) time and O(n) space.",
    codeSnippet: "function twoSum(nums, target) {\n  let map = new Map();\n  for (let i = 0; i < nums.length; i++) {\n    let diff = target - nums[i];\n    if (map.has(diff)) return [map.get(diff), i];\n    map.set(nums[i], i);\n  }\n}",
    jobTypes: ["Backend", "Frontend", "Full Stack"],
    difficulty: "Intermediate"
  },
  {
    id: 192,
    category: "9. Advanced Coding Problems",
    question: "Solve the Longest Substring Without Repeating Characters problem.",
    answer: "Use Sliding Window pattern with Hash Set storing current window characters, advancing left pointer on duplicate in O(n) time.",
    codeSnippet: "function lengthOfLongestSubstring(s) {\n  let set = new Set(), left = 0, max = 0;\n  for (let right = 0; right < s.length; right++) {\n    while (set.has(s[right])) { set.delete(s[left++]); }\n    set.add(s[right]);\n    max = Math.max(max, right - left + 1);\n  }\n  return max;\n}",
    jobTypes: ["Backend", "Full Stack"],
    difficulty: "Advanced"
  },
  {
    id: 193,
    category: "9. Advanced Coding Problems",
    question: "Solve the Longest Common Subsequence problem.",
    answer: "Use 2D Dynamic Programming table `dp[i][j]` tracking max LCS length between prefixes of string A and string B in O(m * n) time.",
    jobTypes: ["Backend"],
    difficulty: "Advanced"
  },
  {
    id: 194,
    category: "9. Advanced Coding Problems",
    question: "Solve the Longest Increasing Subsequence problem.",
    answer: "Use DP array in O(n^2) or Binary Search patient sorting in O(n log n) time.",
    jobTypes: ["Backend"],
    difficulty: "Advanced"
  },
  {
    id: 195,
    category: "9. Advanced Coding Problems",
    question: "Solve the Maximum Subarray Sum problem (Kadane's).",
    answer: "Iterate tracking current local maximum sum and global maximum sum in O(n) time and O(1) space.",
    jobTypes: ["Backend", "Full Stack"],
    difficulty: "Intermediate"
  },
  {
    id: 196,
    category: "9. Advanced Coding Problems",
    question: "Solve the Merge Intervals problem.",
    answer: "Sort intervals by start time, then iterate merging overlapping intervals when `curr.start <= prev.end` in O(n log n) time.",
    codeSnippet: "function mergeIntervals(intervals) {\n  intervals.sort((a, b) => a[0] - b[0]);\n  let res = [intervals[0]];\n  for (let curr of intervals) {\n    let prev = res[res.length - 1];\n    if (curr[0] <= prev[1]) prev[1] = Math.max(prev[1], curr[1]);\n    else res.push(curr);\n  }\n  return res;\n}",
    jobTypes: ["Backend", "Full Stack"],
    difficulty: "Advanced"
  },
  {
    id: 197,
    category: "9. Advanced Coding Problems",
    question: "Solve the Trapping Rain Water problem.",
    answer: "Use Two Pointers algorithm tracking `leftMax` and `rightMax` bounds accumulating trapped water in O(n) time and O(1) space.",
    jobTypes: ["Backend"],
    difficulty: "Expert"
  },
  {
    id: 198,
    category: "9. Advanced Coding Problems",
    question: "Solve the Median of Two Sorted Arrays problem.",
    answer: "Use Binary Search on smaller array partitioning both arrays such that left half elements <= right half elements in O(log(min(m, n))) time.",
    jobTypes: ["Backend"],
    difficulty: "Expert"
  },
  {
    id: 199,
    category: "9. Advanced Coding Problems",
    question: "Solve the LRU Cache problem.",
    answer: "Combine Hash Map for O(1) lookup with Doubly Linked List for O(1) element eviction and movement to head.",
    codeSnippet: "class LRUCache {\n  constructor(capacity) {\n    this.cap = capacity;\n    this.map = new Map(); // Preserves insertion order in JS\n  }\n  get(key) {\n    if (!this.map.has(key)) return -1;\n    let val = this.map.get(key);\n    this.map.delete(key);\n    this.map.set(key, val);\n    return val;\n  }\n}",
    jobTypes: ["Backend", "Full Stack", "System Architecture"],
    difficulty: "Expert"
  },
  {
    id: 200,
    category: "9. Advanced Coding Problems",
    question: "Design a URL Shortener.",
    answer: "System design solution using Base62 encoding on auto-incrementing DB IDs, Redis caching layer, load balancer, and 301/302 HTTP redirects.",
    codeSnippet: "// Base62 Character Set: [0-9][a-z][A-Z]\nfunction encodeBase62(id) {\n  const chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';\n  let shortUrl = '';\n  while (id > 0) {\n    shortUrl = chars[id % 62] + shortUrl;\n    id = Math.floor(id / 62);\n  }\n  return shortUrl || '0';\n}",
    jobTypes: ["Backend", "Full Stack", "DevOps"],
    difficulty: "Expert"
  },

  // ── 10. Cybersecurity & Digital Forensics (Q201 - Q215) ──
  {
    id: 201,
    category: "10. Cybersecurity & Digital Forensics",
    question: "What is the CIA Triad in Cybersecurity?",
    answer: "Confidentiality (preventing unauthorized data access), Integrity (protecting data from tampering), and Availability (ensuring timely, reliable access to data and systems).",
    jobTypes: ["CyberSecurity", "DevOps", "General"],
    difficulty: "Beginner"
  },
  {
    id: 202,
    category: "10. Cybersecurity & Digital Forensics",
    question: "Explain the difference between Symmetric and Asymmetric Encryption.",
    answer: "Symmetric uses one shared secret key for encryption and decryption (AES, DES). Asymmetric uses a public-private key pair (RSA, ECC), where public key encrypts and private key decrypts.",
    codeSnippet: "# Python Cryptography AES-256 Symmetric Example\nfrom cryptography.fernet import Fernet\nkey = Fernet.generate_key()\nf = Fernet(key)\ntoken = f.encrypt(b\"Secret Data\")\nplain = f.decrypt(token)",
    jobTypes: ["CyberSecurity", "Backend", "System Architecture"],
    difficulty: "Intermediate"
  },
  {
    id: 203,
    category: "10. Cybersecurity & Digital Forensics",
    question: "What is a SQL Injection (SQLi) attack and how do you prevent it?",
    answer: "SQLi occurs when malicious SQL statements are inserted into user input fields. Prevent it using Parameterized Queries (Prepared Statements), ORMs, input sanitization, and least privilege database roles.",
    codeSnippet: "// Secure Prepared Statement in Node.js PostgreSQL\nconst res = await db.query('SELECT * FROM users WHERE id = $1', [userId]);",
    jobTypes: ["CyberSecurity", "Backend", "Full Stack"],
    difficulty: "Intermediate"
  },
  {
    id: 204,
    category: "10. Cybersecurity & Digital Forensics",
    question: "What is Cross-Site Scripting (XSS) and what are its types?",
    answer: "XSS executes malicious scripts in the victim's browser. Types: Stored XSS (saved in database), Reflected XSS (returned in HTTP response), DOM-based XSS (executed client-side via DOM API). Prevent using Content Security Policy (CSP) and HTML output encoding.",
    jobTypes: ["CyberSecurity", "Frontend", "Full Stack"],
    difficulty: "Intermediate"
  },
  {
    id: 205,
    category: "10. Cybersecurity & Digital Forensics",
    question: "What is Digital Forensics Artifact Analysis?",
    answer: "Extracting and analyzing evidence from operating system artifacts such as Windows Registry, Event Logs, Prefetch files, MFT (Master File Table), and browser history to reconstruct threat actor activity.",
    jobTypes: ["CyberSecurity"],
    difficulty: "Advanced"
  },
  {
    id: 206,
    category: "10. Cybersecurity & Digital Forensics",
    question: "How do Memory Forensics and Volatility work in Incident Response?",
    answer: "Memory forensics analyzes volatile RAM dumps to identify running malware processes, hidden network connections, injected DLLs, and decrypted cryptographic keys using tools like Volatility Framework.",
    codeSnippet: "# Volatility 3 Command Line Execution\nvol -f memory_dump.raw windows.pslist\nvol -f memory_dump.raw windows.netscan",
    jobTypes: ["CyberSecurity"],
    difficulty: "Advanced"
  },
  {
    id: 207,
    category: "10. Cybersecurity & Digital Forensics",
    question: "What is the MITRE ATT&CK Framework?",
    answer: "A globally accessible knowledge base of adversary tactics, techniques, and procedures (TTPs) based on real-world threat intelligence, structured across stages from Initial Access to Impact.",
    jobTypes: ["CyberSecurity", "System Architecture"],
    difficulty: "Intermediate"
  },
  {
    id: 208,
    category: "10. Cybersecurity & Digital Forensics",
    question: "What is a Buffer Overflow attack and how is memory protected?",
    answer: "Writing more data to a buffer than allocated, overwriting adjacent stack memory and return addresses. Protection mechanisms: ASLR (Address Space Layout Randomization), DEP/NX bit, Stack Canaries, and safe memory functions.",
    jobTypes: ["CyberSecurity", "Backend"],
    difficulty: "Advanced"
  },
  {
    id: 209,
    category: "10. Cybersecurity & Digital Forensics",
    question: "Explain the Zero Trust Architecture model.",
    answer: "A security model based on the principle 'Never Trust, Always Verify'. Requires strict identity verification and continuous authentication for every user and device accessing network resources, regardless of location.",
    jobTypes: ["CyberSecurity", "DevOps", "System Architecture"],
    difficulty: "Intermediate"
  },
  {
    id: 210,
    category: "10. Cybersecurity & Digital Forensics",
    question: "What is PCAP Packet Analysis and how is Wireshark used?",
    answer: "Packet capture analysis inspects raw network traffic to detect anomalies, unauthorized C2 server communication, and unencrypted credentials. Wireshark filters isolate protocols (e.g. `http.request` or `ip.addr == x.x.x.x`).",
    codeSnippet: "// Wireshark Display Filter Example\nhttp.request || ip.addr == 192.168.1.100",
    jobTypes: ["CyberSecurity", "DevOps"],
    difficulty: "Intermediate"
  },

  // ── 11. HR, Behavioral & Cultural Fit (Q211 - Q225) ──
  {
    id: 211,
    category: "11. HR, Behavioral & Cultural Fit",
    question: "Tell me about yourself / Who are you?",
    answer: "Use the Present-Past-Future framework:\n1. Present: State your current role, primary domain expertise, and recent achievements.\n2. Past: Briefly highlight relevant experience, technical background, and key projects that built your core skills.\n3. Future: Explain why you are excited about this specific opportunity and how it aligns with your career trajectory.",
    codeSnippet: "// Winning Answer Framework:\n// 1. 'I am a [Title] with [X] years of experience building [Systems/Products].'\n// 2. 'Recently at [Company], I led [Project] which resulted in [Quantifiable Impact].'\n// 3. 'I am looking to leverage my expertise in [Tech/Domain] to contribute to [Target Company].'",
    jobTypes: ["General", "Backend", "Frontend", "Full Stack", "DevOps", "Data", "CyberSecurity"],
    difficulty: "Beginner"
  },
  {
    id: 212,
    category: "11. HR, Behavioral & Cultural Fit",
    question: "Where do you see yourself in 5 years in this company?",
    answer: "Demonstrate long-term commitment, technical growth, and leadership intent without making unrealistic claims:\n- Express desire to master the domain and tech stack.\n- Express ambition to take on higher technical ownership (e.g. Lead Architect or Tech Lead).\n- Emphasize contributing to the company's long-term business roadmap and mentoring junior engineers.",
    codeSnippet: "// Structure:\n// 'In 5 years, I see myself having deep domain mastery over [Company Product].'\n// 'I aim to transition into a Tech Lead/Architect role where I can drive system design decisions and mentor team members.'",
    jobTypes: ["General", "Backend", "Frontend", "Full Stack", "DevOps", "Data", "CyberSecurity"],
    difficulty: "Intermediate"
  },
  {
    id: 213,
    category: "11. HR, Behavioral & Cultural Fit",
    question: "Why do you want to work at this specific company?",
    answer: "Show that you have researched the company thoroughly:\n1. Product / Mission Alignment: Mention specific products, engineering challenges, or market impact that excite you.\n2. Technical Alignment: Highlight tech stack, engineering culture, or scale.\n3. Company Values: Connect your personal work ethics with their company core values.",
    jobTypes: ["General", "Backend", "Frontend", "Full Stack", "DevOps", "Data", "CyberSecurity"],
    difficulty: "Beginner"
  },
  {
    id: 214,
    category: "11. HR, Behavioral & Cultural Fit",
    question: "Why should we hire you over other candidates?",
    answer: "Combine 3 pillars: Tech Skills + Domain Experience + Problem-Solving Mindset:\n- 'I bring strong hands-on experience in [Key Tech required for job].'\n- 'I have a proven track record of delivering scalable solutions (e.g. [Past Impact Metric]).'\n- 'I hit the ground running with minimal onboarding overhead and strong cross-functional communication.'",
    jobTypes: ["General", "Backend", "Frontend", "Full Stack", "DevOps", "Data", "CyberSecurity"],
    difficulty: "Intermediate"
  },
  {
    id: 215,
    category: "11. HR, Behavioral & Cultural Fit",
    question: "What are your greatest strengths and weaknesses?",
    answer: "Strengths: Pick real professional strengths relevant to the job (e.g. system architecture, rapid debugging, cross-team collaboration) backed by an example.\nWeaknesses: Pick a real technical/professional weakness that is NOT fatal for the role, and immediately state the active steps you take to improve it.",
    codeSnippet: "// Weakness Example:\n// 'I used to struggle with delegating tasks because I wanted to oversee every line of code. However, I learned to trust my team, establish clear documentation standards, and perform code reviews instead of micromanaging.'",
    jobTypes: ["General", "Backend", "Frontend", "Full Stack", "DevOps", "Data", "CyberSecurity"],
    difficulty: "Intermediate"
  },
  {
    id: 216,
    category: "11. HR, Behavioral & Cultural Fit",
    question: "Tell me about a time you faced a difficult conflict at work (STAR Method).",
    answer: "Use the STAR Method (Situation, Task, Action, Result):\n- Situation: Describe a disagreement over technical architecture, timeline, or prioritization.\n- Task: Define your responsibility in resolving the conflict.\n- Action: Explain how you communicated objectively, presented benchmark data/tradeoffs, and listened actively.\n- Result: State the successful outcome, consensus reached, and lessons learned.",
    jobTypes: ["General", "Backend", "Frontend", "Full Stack", "DevOps", "Data", "CyberSecurity"],
    difficulty: "Intermediate"
  },
  {
    id: 217,
    category: "11. HR, Behavioral & Cultural Fit",
    question: "Tell me about a time a project failed or you made a production mistake.",
    answer: "Focus on ownership and post-mortem growth:\n1. Take full accountability without blaming external factors.\n2. Explain the immediate remediation steps taken to mitigate impact.\n3. Describe the blameless post-mortem analysis and permanent system fixes implemented to prevent reoccurrence.",
    jobTypes: ["General", "Backend", "Frontend", "Full Stack", "DevOps", "Data", "CyberSecurity"],
    difficulty: "Advanced"
  },
  {
    id: 218,
    category: "11. HR, Behavioral & Cultural Fit",
    question: "How do you handle tight deadlines, pressure, or shifting requirements?",
    answer: "Outline a calm, structured approach:\n1. Re-prioritize core MVP requirements with product managers.\n2. Break down complex deliverables into manageable milestones.\n3. Maintain transparent asynchronous communication regarding trade-offs and risks.",
    jobTypes: ["General", "Backend", "Frontend", "Full Stack", "DevOps", "Data", "CyberSecurity"],
    difficulty: "Beginner"
  },
  {
    id: 219,
    category: "11. HR, Behavioral & Cultural Fit",
    question: "What is your expected salary / compensation range?",
    answer: "Show market awareness and flexibility:\n- 'Based on my research of market rates in [Location/Role] and my experience level, I am looking for a package in the range of [X] to [Y]. However, total compensation including growth opportunities and culture is most important to me.'",
    jobTypes: ["General", "Backend", "Frontend", "Full Stack", "DevOps", "Data", "CyberSecurity"],
    difficulty: "Beginner"
  },
  {
    id: 220,
    category: "11. HR, Behavioral & Cultural Fit",
    question: "How do you stay updated with new technologies and industry trends?",
    answer: "Demonstrate active learning habits:\n- Reading tech blogs (HackerNews, Engineering blogs of Netflix/Uber/Meta).\n- Building side projects or contributing to open source repositories.\n- Enrolling in targeted certification courses and attending technical webinars.",
    jobTypes: ["General", "Backend", "Frontend", "Full Stack", "DevOps", "Data", "CyberSecurity"],
    difficulty: "Beginner"
  },
  {
    id: 221,
    category: "11. HR, Behavioral & Cultural Fit",
    question: "Tell me about a time you explained a complex technical topic to non-technical stakeholders.",
    answer: "Emphasize empathy and business outcome focus:\n- Avoid jargon and use real-world analogies.\n- Focus on business metrics (cost savings, uptime, user experience) rather than internal implementation details.\n- Use visual diagrams and interactive prototypes to validate understanding.",
    jobTypes: ["General", "Backend", "Frontend", "Full Stack", "DevOps", "Data", "CyberSecurity"],
    difficulty: "Intermediate"
  },
  {
    id: 222,
    category: "11. HR, Behavioral & Cultural Fit",
    question: "What type of team culture or work environment brings out your best performance?",
    answer: "Highlight positive collaborative values:\n- Psychological safety where ideas and constructive code reviews are welcomed.\n- High engineering standards, clear documentation, and automated CI/CD pipelines.\n- Autonomy with clear goals and strong cross-functional alignment.",
    jobTypes: ["General", "Backend", "Frontend", "Full Stack", "DevOps", "Data", "CyberSecurity"],
    difficulty: "Beginner"
  },
  {
    id: 223,
    category: "11. HR, Behavioral & Cultural Fit",
    question: "Why are you looking to leave your current role?",
    answer: "Keep it positive and forward-looking:\n- Focus on seeking new technical challenges, professional growth, or larger scale.\n- Avoid negative remarks about past managers or company decisions.\n- 'I am proud of what I accomplished at my current role, but I am looking for a position where I can take on greater responsibility in [Target Tech/Domain].'",
    jobTypes: ["General", "Backend", "Frontend", "Full Stack", "DevOps", "Data", "CyberSecurity"],
    difficulty: "Beginner"
  },
  {
    id: 224,
    category: "11. HR, Behavioral & Cultural Fit",
    question: "Do you have any questions for us? (Reverse Interview Questions)",
    answer: "Always ask insightful questions to demonstrate interest:\n1. 'What are the biggest technical or product challenges the team is facing in the next 6 months?'\n2. 'What does success look like for someone in this role in the first 90 days?'\n3. 'How does the engineering team handle technical debt and continuous deployment?'",
    jobTypes: ["General", "Backend", "Frontend", "Full Stack", "DevOps", "Data", "CyberSecurity"],
    difficulty: "Beginner"
  },
  {
    id: 225,
    category: "11. HR, Behavioral & Cultural Fit",
    question: "How do you handle receiving critical code review feedback?",
    answer: "Demonstrate a growth mindset:\n- Separate personal identity from code quality.\n- Welcome code reviews as a learning tool that elevates team code quality.\n- Ask clarifying questions if unsure and update pull requests promptly.",
    jobTypes: ["General", "Backend", "Frontend", "Full Stack", "DevOps", "Data", "CyberSecurity"],
    difficulty: "Beginner"
  },

  // ── 12. Salary Negotiation & Offers (Q226 - Q232) ──
  {
    id: 226,
    category: "12. Salary Negotiation & Offers",
    question: "How do you answer 'What is your expected salary?'",
    answer: "Research first, anchor high, and stay flexible:\n1. Research market rates on Glassdoor, Levels.fyi, and LinkedIn Salary for your exact role and location.\n2. Give a range: 'Based on my research and experience, I'm targeting KES 280,000–350,000/month. I'm open to discussing the full compensation package.'\n3. Never reveal a number first if you can avoid it — ask 'What is the budget for this role?'",
    codeSnippet: "// Negotiation Formula:\n// Research Range → Add 15–20% buffer → State as range (not a floor)\n// 'Based on the role scope and my 5 years in [Domain], I'm targeting $X–$Y.'\n// Silence after stating your number is your friend — let them respond first.",
    jobTypes: ["General", "Backend", "Frontend", "Full Stack", "DevOps", "Data", "CyberSecurity"],
    difficulty: "Intermediate"
  },
  {
    id: 227,
    category: "12. Salary Negotiation & Offers",
    question: "How do you negotiate a higher salary after receiving an offer?",
    answer: "Use the PAUSE-RESEARCH-COUNTER framework:\n1. Thank them enthusiastically: 'I'm very excited about this opportunity.'\n2. Ask for time: 'Can I have 2 days to review the full package?'\n3. Counter professionally: 'Based on my research, engineers at this level typically earn $X. Given my background in [Key Skill], would you be able to meet me at $Y?'\n4. Negotiate total comp: salary, equity, remote flexibility, signing bonus, and learning budget.",
    jobTypes: ["General", "Backend", "Frontend", "Full Stack", "DevOps", "Data", "CyberSecurity"],
    difficulty: "Intermediate"
  },
  {
    id: 228,
    category: "12. Salary Negotiation & Offers",
    question: "How do you evaluate whether a job offer is fair?",
    answer: "Evaluate 7 dimensions beyond base salary:\n1. Base Salary vs. Market Rate (Glassdoor, Levels.fyi)\n2. Equity / Stock Options (vesting schedule, cliff, strike price)\n3. Bonus (annual %, signing, performance)\n4. Benefits (health, dental, pension, learning budget)\n5. Career Growth (promotion timeline, management track)\n6. Work-Life Balance (remote policy, vacation days)\n7. Company Stability (funding runway, revenue, churn rate)",
    jobTypes: ["General", "Backend", "Frontend", "Full Stack", "DevOps", "Data", "CyberSecurity"],
    difficulty: "Beginner"
  },
  {
    id: 229,
    category: "12. Salary Negotiation & Offers",
    question: "What do you do if the company says 'This is our best offer, we can't go higher'?",
    answer: "Negotiate non-salary benefits instead:\n- 'I understand. Could we revisit after my first performance review in 6 months?'\n- 'Could we explore a signing bonus or additional equity instead?'\n- 'Can I get an extra week of PTO or a remote-first arrangement?'\n- If you want the role, accept gracefully. If not meeting your minimum, politely decline: 'Thank you for considering me. Unfortunately this doesn't meet my current target.'",
    jobTypes: ["General", "Backend", "Frontend", "Full Stack", "DevOps", "Data", "CyberSecurity"],
    difficulty: "Intermediate"
  },
  {
    id: 230,
    category: "12. Salary Negotiation & Offers",
    question: "When is the best time to discuss salary in the interview process?",
    answer: "Wait until you have an offer — never volunteer your number first:\n- Early stage: deflect with 'I'm open to discussing compensation once I understand the full role and scope.'\n- Mid-stage: ask 'What is the budget range for this position?'\n- Offer stage: negotiate from a position of strength. They want you — use that leverage.\n- Multiple offers: ethically inform company A that you have a competing offer from B.",
    jobTypes: ["General", "Backend", "Frontend", "Full Stack", "DevOps", "Data", "CyberSecurity"],
    difficulty: "Beginner"
  },
  {
    id: 231,
    category: "12. Salary Negotiation & Offers",
    question: "How do you handle a job offer with a lower salary than your current role?",
    answer: "Evaluate total career value, not just immediate pay:\n1. Is there faster career growth, better tech, or larger scale?\n2. Negotiate: 'The base is lower than I expected. Is there flexibility on equity or signing bonus?'\n3. Consider cost of living, remote work savings, and learning opportunities.\n4. If it's a strategic move (e.g. startup → growth → IPO), lower base + equity may be better long-term.",
    jobTypes: ["General", "Backend", "Frontend", "Full Stack", "DevOps", "Data", "CyberSecurity"],
    difficulty: "Intermediate"
  },
  {
    id: 232,
    category: "12. Salary Negotiation & Offers",
    question: "How do you politely decline a job offer?",
    answer: "Always decline graciously — the industry is small:\n- 'Thank you so much for the offer and for taking the time to get to know me. After careful consideration, I've decided to pursue another opportunity that aligns more closely with my career goals at this time.'\n- Never ghost an offer. Always send a written response.\n- Keep the door open: 'I'd love to stay connected and explore opportunities in the future.'",
    jobTypes: ["General", "Backend", "Frontend", "Full Stack", "DevOps", "Data", "CyberSecurity"],
    difficulty: "Beginner"
  },

  // ── 13. Leadership & Management (Q233 - Q238) ──
  {
    id: 233,
    category: "13. Leadership & Management",
    question: "How do you manage underperforming team members?",
    answer: "Use a structured, empathetic approach:\n1. Identify root cause: Is it skill gap, personal issue, unclear expectations, or motivation?\n2. Have a private 1-on-1 conversation: focus on behavior, not personality.\n3. Create a Performance Improvement Plan (PIP) with clear, measurable goals.\n4. Provide coaching, pair programming, or mentoring support.\n5. Follow up regularly — celebrate small wins to rebuild confidence.\n6. If no improvement after a defined period, escalate through HR processes.",
    jobTypes: ["General", "Backend", "Frontend", "Full Stack", "DevOps"],
    difficulty: "Advanced"
  },
  {
    id: 234,
    category: "13. Leadership & Management",
    question: "How do you prioritize technical debt vs. feature development?",
    answer: "Balance business velocity with engineering health:\n1. Quantify impact: 'This debt costs us X hours/sprint due to Y.'\n2. Use a debt ledger — categorize debt by severity (critical, moderate, low).\n3. Negotiate a 20% rule: 20% of each sprint dedicated to tech debt.\n4. Frame debt as a business risk, not just technical: 'This slows our release cadence by 30%.'\n5. Tie refactoring to feature work: 'While building Feature X, we'll refactor Module Y alongside it.'",
    codeSnippet: "// Technical Debt Prioritization Matrix:\n// HIGH SEVERITY + HIGH FREQUENCY = Immediate fix (Block sprint)\n// HIGH SEVERITY + LOW FREQUENCY  = Schedule in next 2 sprints\n// LOW SEVERITY  + HIGH FREQUENCY = Tackle incrementally alongside features\n// LOW SEVERITY  + LOW FREQUENCY  = Document and monitor",
    jobTypes: ["General", "Backend", "Frontend", "Full Stack", "DevOps"],
    difficulty: "Advanced"
  },
  {
    id: 235,
    category: "13. Leadership & Management",
    question: "Describe your leadership style as a tech lead.",
    answer: "Effective tech leads combine technical authority with servant leadership:\n- Servant Leadership: Remove blockers, protect the team from organizational noise.\n- Lead by Example: Write clean code, document well, handle code reviews rigorously.\n- Empower, Don't Micromanage: Assign ownership to individuals and trust them.\n- Communicate Context: Engineers perform best when they understand WHY they're building something.\n- Psychological Safety: Create an environment where it's safe to fail fast and learn.",
    jobTypes: ["General", "Backend", "Frontend", "Full Stack", "DevOps"],
    difficulty: "Advanced"
  },
  {
    id: 236,
    category: "13. Leadership & Management",
    question: "How do you handle technical disagreements within your team?",
    answer: "Use a structured decision framework:\n1. Acknowledge both perspectives and separate facts from opinions.\n2. Drive towards data: 'Let's prototype both solutions and benchmark performance.'\n3. Use RFC (Request for Comments) documents for architectural decisions.\n4. If deadlocked: use timeboxing — 'Let's pick the simplest solution now and revisit after Sprint 3.'\n5. Always document the decision and rationale in an ADR (Architecture Decision Record).",
    jobTypes: ["General", "Backend", "Frontend", "Full Stack", "DevOps"],
    difficulty: "Intermediate"
  },
  {
    id: 237,
    category: "13. Leadership & Management",
    question: "How do you mentor junior engineers?",
    answer: "Structured mentorship approach:\n1. Pair Programming: Work side-by-side on real tasks, explain reasoning as you code.\n2. Code Reviews: Give detailed, constructive feedback explaining the 'why'.\n3. Guided Problem Solving: Ask leading questions instead of giving direct answers.\n4. Growth Plans: Define 3-month, 6-month, and 1-year technical milestones.\n5. Build Confidence: Assign challenging but achievable ownership tasks with your backup support.",
    jobTypes: ["General", "Backend", "Frontend", "Full Stack", "DevOps"],
    difficulty: "Intermediate"
  },
  {
    id: 238,
    category: "13. Leadership & Management",
    question: "How do you approach system design decisions at scale?",
    answer: "Follow the PEDALS framework for senior-level system design:\nP - Problem Scope: Clarify functional and non-functional requirements.\nE - Estimate Scale: QPS, data volume, read/write ratio, storage requirements.\nD - Design Core Services: Microservices, API contracts, data models.\nA - Architecture Diagram: Draw components, connections, and data flows.\nL - Long-Tail Issues: Handle edge cases, race conditions, and failover.\nS - Scale & Optimize: Caching (Redis), sharding, CDNs, load balancing, async queues.",
    codeSnippet: "// System Design Checklist (30-min interview):\n// [0-5 min]  Clarify requirements + estimate scale\n// [5-15 min] Core API design + data models\n// [15-25 min] High-level architecture diagram\n// [25-30 min] Deep-dive: bottlenecks + trade-offs",
    jobTypes: ["Backend", "Full Stack", "System Architecture", "DevOps"],
    difficulty: "Expert"
  },

  // ── 14. Remote Work & Collaboration (Q239 - Q241) ──
  {
    id: 239,
    category: "14. Remote Work & Collaboration",
    question: "How do you stay productive and accountable when working remotely?",
    answer: "Remote productivity requires intentional systems:\n1. Dedicated workspace: Separate physical space for work, not the bedroom.\n2. Time-blocking: Use calendar blocking for deep work (90-minute focus sessions).\n3. Daily standups: Async video updates (Loom) or written updates in Slack/Discord.\n4. Output-based accountability: Track deliverables, not hours.\n5. Communicate proactively: Over-communicate status, blockers, and wins.\n6. Set clear end-of-day boundaries to prevent burnout.",
    jobTypes: ["General", "Backend", "Frontend", "Full Stack", "DevOps", "Data", "CyberSecurity"],
    difficulty: "Beginner"
  },
  {
    id: 240,
    category: "14. Remote Work & Collaboration",
    question: "How do you collaborate effectively with cross-timezone distributed teams?",
    answer: "Async-first collaboration strategies:\n1. Document everything: Decisions, context, and meeting notes in Confluence/Notion.\n2. Async standups: Use tools like Geekbot, Slack status, or Loom videos.\n3. Overlap windows: Find a 2-hour overlap with each timezone and protect it for sync meetings.\n4. Respect time zones: Use tools like World Time Buddy, never schedule meetings outside of 8am–6pm local.\n5. Recorded demos: Always record sprint demos for team members in different time zones.",
    jobTypes: ["General", "Backend", "Frontend", "Full Stack", "DevOps", "Data", "CyberSecurity"],
    difficulty: "Intermediate"
  },
  {
    id: 241,
    category: "14. Remote Work & Collaboration",
    question: "How do you build trust and relationships in a fully remote team?",
    answer: "Intentional relationship-building in remote environments:\n1. Virtual coffee chats: Schedule 15-minute informal 1-on-1s with teammates.\n2. Team channels for non-work topics: #random, #wins, #recommendations.\n3. Be a reliable communicator: Always respond within agreed SLAs (e.g. 4 hours).\n4. Celebrate wins publicly in team channels.\n5. Be vulnerable: Share challenges, not just successes — it builds psychological safety.\n6. Occasional in-person meetups: Quarterly offsites dramatically accelerate remote team cohesion.",
    jobTypes: ["General", "Backend", "Frontend", "Full Stack", "DevOps", "Data", "CyberSecurity"],
    difficulty: "Beginner"
  }
];
