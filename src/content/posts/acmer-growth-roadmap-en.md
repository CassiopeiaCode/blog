---
title: "Thoughts on the ACMer's Journey"
description: "This is more than just a technical checklist; it's like a map and travel guide for the long and fascinating journey of competitive programming."
published: 2025-08-10
tags: ["Algorithms", "ACM", "Learning Path", "Reflections"]
---

## Where is Your North Star?

Many people dive headfirst into the world of competitive programming, clutching a long "knowledge point list" like a treasure map, always feeling that following it will lead them to treasure. But they often overlook the most important question: **Why are you setting out?**

The destination on this map is vastly different for everyone.

If your goal is to join a desirable tech company, your course is relatively clear. You need to master the most core and classic data structures and algorithms, such as trees, graphs, and basic dynamic programming. Interviewers value the robustness of your code, the clarity of your logic, and how you communicate and handle edge cases. In this scenario, those "dragon-slaying skills" on the list—like Pólya theorem or LCT—might truly be overkill for you, offering little return on investment.

But if your journey is towards the stars and the sea, aiming directly for the ICPC World Finals stage, then you cannot miss a single corner of this map. You need extreme speed, absolute precision, and a strong heart that can perform steadily under pressure. Those seemingly obscure knowledge points might be the key factors determining victory in the arena.

Of course, there's another group of people who are more like pure travelers, driven by curiosity and a love for wisdom itself. They might linger in the deep valleys of number theory or be enchanted by the stellar beauty outlined by computational geometry. For them, learning itself is the goal, and the process is the best reward.

So, before you set off, be sure to find your own North Star. It will determine your direction, your equipment, and everything you encounter on this path.

## A Not-So-"Standard" Map

Once the direction is clear, let's look at the map. Traditional knowledge checklists always try to organize everything clearly, but I prefer to see it as a continent full of opportunities and challenges, mainly composed of several sections.

### Core Methodologies: Your Craft

These are your fundamental skills, the essential toolkit you must master to navigate this world.

#### Dynamic Programming (DP): The Weaver of Time

In my opinion, DP is an art of conversing with time. Its core lies in solving problems with "optimal substructure" and "overlapping subproblems." You "memorize" the past (store solutions to subproblems) to elegantly predict the future (solve the final problem).

State design is the soul of DP, and also the most challenging part. From basic linear DP and knapsack DP, to more complex **Tree DP** (recursive state transitions on trees, often used to solve problems like maximum independent set on trees, diameter of a tree), **Bitmask DP** (using binary bits to represent set states, a powerful tool for small-scale combinatorial optimization problems), and then to **Digit DP** and **Probability DP**, each is a great test of your problem modeling ability.

It's completely normal to feel like you understand a model, only to be instantly baffled by a different problem statement. What's worse, naive DP often times out, which is when DP optimization comes into play. **Monotonic Queue** and **Convex Hull Trick (Slope Optimization)** are like installing acceleration engines on your weaving machine. They utilize the monotonicity or geometric properties of decisions to optimize O(N^2) complexity to O(N) or O(N log N), serving as a key differentiator between DP practitioners and masters. From "knowing" DP to "being able to use" DP, lies the grueling practice of hundreds of problems and a deep insight into the problem's essence.

#### Graph Theory: The Architect of Relationships

Graph theory is the philosophy of "connections." Everything in the world, from social networks to transportation hubs, can be abstracted into nodes and edges. Learning graph theory is like learning to become an urban planner in an abstract world.

Your toolbox will contain various powerful tools. For example, **Shortest Path Algorithms** (Dijkstra/SPFA) help you plan the fastest routes; **Connectivity Algorithms** (strongly/biconnected components, articulation points/bridges) help you analyze network stability and critical nodes; **Bipartite Matching** (Hungarian/HK algorithm) can solve various pairing problems.

And **Network Flow** is the culmination of graph theory. **Max Flow** can not only solve transportation problems but also cleverly transform into models like bipartite matching and project assignment. Its dual problem—**Min Cut**—is an even more powerful tool for solving minimum cost problems related to "partitioning," with applications in image segmentation and other fields. When you also need to consider costs, **Min Cost Max Flow** can help you find the lowest cost solution.

But remember, the essence of graph theory often lies not in whether you can recite the Dinic algorithm template, but in **graph construction**. How to transform a seemingly non-graph problem into a graph theory model is what truly tests your wisdom.

#### Data Structures: The Sculptor of Information

If data is uncarved jade, then data structures are the tools and techniques for carving it. They make chaotic data orderly and slow queries swift.

**Segment Trees** and **Fenwick Trees (BITs)** are your right and left arms for handling range problems, one powerful, the other lightweight and fast. For more complex tree problems, **Heavy-Light Decomposition** can transform tree path operations into familiar sequence range operations, a stroke of genius. When you need to dynamically maintain the connectivity of a forest, **Link-Cut Tree (LCT)** can shine.

But never fall into blind worship of "advanced" data structures. Sometimes, an "elegant brute force," such as **Square Root Decomposition** or **Mo's Algorithm**, due to its simple implementation and wide applicability, can instead become a winning tool in competitive programming. And ideas like **Persistency** (e.g., Persistent Segment Tree / Chairman Tree) open up a new world for you, giving data "history" and "memory," allowing you to query the state of any historical version and solve more incredible problems. Remember, in the competitive arena, being able to write correct code stably and quickly to score points is king.

### Theoretical Foundation: Internal Kung Fu

If methodologies are your moves, then mathematics is your internal kung fu. Profound internal strength can multiply the power of your moves.

**Number Theory** and **Combinatorics** are the core of this internal strength. From Greatest Common Divisor (GCD/Extended Euclidean Algorithm) to **Congruence Theory** (modular inverse, Fermat's Little Theorem, Chinese Remainder Theorem), and various **Sieve methods** and **Mobius Inversion**, these tools may seem abstract, but they can deliver a fatal blow at critical moments. Especially when dealing with counting problems and problems involving modulo operations, a solid mathematical foundation allows you to see landscapes others cannot. And combinatorial tools like the **Inclusion-Exclusion Principle**, **Generating Functions**, and **Pólya Enumeration Theorem** are the concentrated embodiment of the "art of counting."

**Linear Algebra** and **Polynomials** are like higher-level internal kung fu. **Gaussian Elimination** to solve linear equations, **Matrix Exponentiation** to accelerate linear recurrences, these are standard operations. And the emergence of **FFT/NTT** has brought polynomial multiplication into the O(N log N) era, providing powerful computational support for algorithms that require polynomial operations, such as generating functions, truly a "nuclear weapon" in competitive programming.

### Specialized Areas: Dungeon Challenges

Once your craft is exquisite and your internal strength profound, you can challenge some distinct "dungeons."

The world of **Strings** is filled with various ingenious matching and querying algorithms. From **KMP** to **Aho-Corasick Automaton**, and then to the powerful suffix suite—**Suffix Array (SA)** and **Suffix Automaton (SAM)**, as well as **Manacher** and **Palindromic Automaton (PAM)** for handling palindromes. But don't forget, in most cases, the simple and easy-to-use **String Hashing** is your most loyal friend. Although it might occasionally betray you (get stuck/collided), it's incredibly fast and extremely cost-effective.

**Computational Geometry** is a beautiful yet dangerous place. Its beauty lies in the perfect blend of logic and form; algorithms like **Convex Hull**, **Half-plane Intersection**, and **Rotating Calipers** all sparkle with the light of wisdom. But its danger lies in the ubiquitous precision issues. Before venturing into this field, be sure to prepare a battle-tested, absolutely reliable geometric template of your own, otherwise, you'll be driven to doubt your existence by various `eps` values.

**Game Theory** is a pure dance of logic. The **SG function** and **Nim-sum** are powerful theoretical tools for analyzing impartial games, helping you gain insight into the transitions of winning/losing states. But often, finding the intrinsic rules of the game or simplifying the model is more effective than blindly applying the SG function.

### The Invisible Continent: Competitive Programming Engineering

Finally, there's a crucial continent usually not marked on maps, but it's vitally important—**Competitive Programming Engineering**. This includes your debugging skills (brute-force verification is a divine skill!), your sensitivity to edge cases, your habit of managing and using your own code template library, and your time management strategies during contests. These "soft skills" determine your lower bound and whether you can consistently perform at over 80% of your knowledge level.

## The Journey to Mastery: "Shu, Ha, Ri"

Getting the map doesn't mean the journey ends. On the contrary, it's just the beginning. Mastery in any field follows an ancient and classic path: "Shu, Ha, Ri."

**Shu (守)**: This is the apprentice stage. You strictly follow rules, imitate predecessors' code, and understand standard solutions to classic problems. This process might be boring, but it's indispensable. You must learn to walk before you can run.

**Ha (破)**: This is the craftsman stage. You begin to understand the principles behind the rules, try to break conventions, and integrate knowledge from different fields. You are no longer