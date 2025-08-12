---
title: Reflections on the Growth Path of an ACMer
description: >-
  More than just a technical checklist, this is a map and travel guide for the
  long and fascinating journey of competitive programming.
published: 2025-08-10T00:00:00.000Z
tags:
  - Algorithms
  - ACM
  - Learning Path
  - Reflections
lang: en
---

## Where is Your North Star?

Many people dive headfirst into the world of competitive programming, clutching a long "list of knowledge points" like a treasure map, always feeling that following it will lead them to treasure. But they often overlook the most important question: **Why are you embarking on this journey?**

The destination of this map differs vastly for everyone.

If your goal is to join a desirable tech company, then your course is relatively clear. You need to master the most core and classic data structures and algorithms, such as trees, graphs, and basic dynamic programming. Interviewers value the robustness of your code, the clarity of your logic, and how you communicate and handle edge cases. In this scenario, those "dragon-slaying techniques" on the list—like Pólya's theorem or Link-Cut Tree—might truly be just that, offering a low cost-benefit ratio for your purpose.

But if your journey is towards the stars and the sea, aiming directly for the ICPC World Finals stage, then you cannot miss a single corner of this map. You need extreme speed, absolute precision, and a strong heart that can perform consistently under pressure. Those seemingly niche knowledge points might be the key factors that decide victory or defeat in the arena.

Of course, there's another group of people, more like pure travelers, driven by curiosity and a love for wisdom itself. They might linger in the deep valleys of number theory or lose themselves in the starry beauty outlined by computational geometry. For them, learning itself is the goal, and the process is the best reward.

So, before setting off, be sure to find your own North Star. It will determine your direction, your equipment, and what you experience along the way.

## A Not-So-Standard Map

With your direction clear, let's look at the map. Traditional knowledge checklists always try to organize everything clearly, but I prefer to see it as a continent full of opportunities and challenges, primarily composed of several sections.

### Core Methodologies: Your Craft

These are your fundamental skills, the essential tools you must master to navigate this world.

#### Dynamic Programming (DP): The Weaver of Time

In my opinion, DP is an art of conversing with time. Its core lies in solving problems with "optimal substructure" and "overlapping subproblems." You "memorize" the past (store solutions to subproblems) to elegantly predict the future (solve the final problem).

State design is the soul of DP, and also the most tormenting part. From the most basic linear DP and knapsack DP, to more complex **tree DP** (recursive state transitions on trees, often used to solve problems like maximum independent set on trees, diameter of a tree), **bitmask DP** (using binary bits to represent set states, a powerful tool for small-scale combinatorial optimization problems), and then to **digit DP** and **probability DP**, each is a great test of your problem modeling ability.

Sometimes you feel like you understand a certain model, but then a different problem statement instantly baffles you—this is completely normal. What's worse, naive DP often runs into time limits, which is when DP optimization comes in. **Monotonic queue optimization** and **convex hull trick (slope optimization)** are like turbochargers for your weaving machine. They utilize the monotonicity or geometric properties of decisions to optimize O(N^2) complexity to O(N) or O(N log N), serving as a key watershed between DP practitioners and masters. From "knowing about" DP to "being able to use" DP, there's a gap filled by hundreds of problems, practice, and deep insights into the problem's essence.

#### Graph Theory: The Architect of Relationships

Graph theory is the philosophy of "connections." Everything in the world, from social networks to transportation hubs, can be abstracted into nodes and edges. Learning graph theory is like learning to be an urban planner in an abstract world.

Your toolbox will contain various powerful tools. For example, **shortest path algorithms** (Dijkstra/SPFA) help you plan the fastest routes; **connectivity algorithms** (strong/biconnected components, articulation points/bridges) help you analyze network stability and critical nodes; **bipartite matching** (Hungarian algorithm/Hopcroft-Karp algorithm) can solve various pairing problems.

And **network flow** is the culmination of graph theory. **Maximum flow** can not only solve transportation problems but also cleverly transform into models like bipartite matching and project assignment. Its dual problem—**minimum cut**—is an incredibly powerful tool for solving minimum cost problems related to "partitioning," with applications in areas like image segmentation. When you also need to consider costs, **minimum cost maximum flow** can help you find the lowest cost solution.

But remember, the essence of graph theory often lies not in whether you can recite the Dinic algorithm template, but in **graph construction**. How to transform a problem that seemingly has nothing to do with graphs into a graph theory model—that is what truly tests your wisdom.

#### Data Structures: The Sculptor of Information

If data is uncarved jade, then data structures are the tools and techniques for sculpting it. They bring order to chaotic data and make slow queries swift.

**Segment trees** and **Fenwick trees (BITs)** are your right and left hands for handling range problems; one is powerful, the other lightweight and fast. For more complex tree problems, **heavy-light decomposition** can transform tree path operations into familiar sequence range operations, a stroke of genius. When you need to dynamically maintain the connectivity of a forest, **LCT (Link-Cut Tree)** can shine.

But don't fall into blind worship of "advanced" data structures. Sometimes, an "elegant brute force," like **block decomposition** or **Mo's algorithm**, due to its simplicity of implementation and broad applicability, can instead become a powerful tool for scoring in contests. And ideas like **persistence** (e.g., persistent segment tree, also known as主席树 or "chairman tree") open up a new world, giving data "history" and "memory," allowing you to query states from any historical version, solving even more incredible problems. Remember, in a competitive programming contest, being able to write correct code stably and quickly to earn points is paramount.

### Theoretical Foundations: Internal Cultivation

If methodologies are your moves, then mathematics is your internal cultivation. Deep internal power can multiply the effectiveness of your moves.

**Number theory** and **combinatorics** are the core of this internal cultivation. From greatest common divisor (GCD/extended Euclidean algorithm) to **modular arithmetic** (modular inverse, Fermat's Little Theorem, Chinese Remainder Theorem), and various **sieve methods** and **Möbius inversion**, these tools may seem abstract, but they can deliver a fatal blow at crucial moments. Especially when dealing with counting problems and problems involving modular arithmetic, solid mathematical foundations allow you to see landscapes others cannot. And combinatorial tools like the **inclusion-exclusion principle**, **generating functions**, and **Pólya enumeration theorem** are the epitome of the "art of counting."

**Linear algebra** and **polynomials** are like higher-level internal cultivation. **Gaussian elimination** for solving linear equations and **matrix exponentiation** for accelerating linear recurrences are standard operations. The emergence of **FFT/NTT** has brought polynomial multiplication into the O(N log N) era, providing powerful computational support for algorithms that require polynomial operations, such as generating functions, truly a "nuclear weapon" in competitive programming.

### Specialized Domains: Dungeon Challenges

Once your craft is exquisite and your internal cultivation deep, you can challenge some distinct "dungeons."

The world of **strings** is full of ingenious matching and query algorithms. From **KMP** to **Aho-Corasick automaton**, and then to the powerful suffix family—**suffix array (SA)** and **suffix automaton (SAM)**, as well as **Manacher's algorithm** and **Palindromic Automaton (PAM)** for palindromes. But don't forget, in most cases, simple and effective **string hashing** is your most loyal friend. Although it occasionally betrays you (gets stuck), it's incredibly fast and offers a very high cost-benefit ratio.

**Computational geometry** is a beautiful yet dangerous place. Its beauty lies in the perfect fusion of logic and form; algorithms like **convex hull**, **half-plane intersection**, and **rotating calipers** all sparkle with wisdom. But its danger lies in the omnipresent precision issues. Before venturing into this field, be sure to prepare a thoroughly tested and absolutely reliable geometry template, otherwise you will be tormented by various `eps` values to the point of self-doubt.

**Game theory** is a pure dance of logic. **SG function** and **Nim sum** are powerful theoretical tools for analyzing impartial games, helping you discern the transitions between winning/losing states. But often, finding the intrinsic patterns of the game or simplifying the model is more effective than blindly applying the SG function.

### The Invisible Continent: Competitive Programming Engineering

Finally, there's a crucial continent usually not marked on the map—**competitive programming engineering**. This includes your debugging skills (stress testing is a divine technique!), your sensitivity to boundary data, your habits of managing and using your code template library, and your strategy for time allocation during contests. These "soft skills" determine your baseline, deciding whether you can consistently perform at 80% or more of your 100% knowledge level.

## The Journey to Mastery: "Shu, Ha, Ri"

Receiving the map does not signify the end of the journey. On the contrary, it's just the beginning. Mastering any field involves an ancient and classic path: "Shu, Ha, Ri."

**Shu (守)**: This is the apprentice stage. You strictly follow rules, imitate previous code, and understand standard solutions to classic problems. This process might be tedious but is indispensable. You must learn to walk before you can run.

**Ha (破)**: This is the artisan stage. You begin to understand the principles behind the rules, attempt to break conventions, and integrate knowledge from different domains. You no longer rigidly apply templates but start to think for yourself and adapt.

**Ri (離)**: This is the master stage. All knowledge and techniques have been internalized into your intuition. You are no longer confined to any fixed moves; you can even start from first principles and create your own solutions.

The fascination of competitive programming lies precisely here. It's not just about piling up code and logic; it's a long journey of learning, growth, and self-transcendence. May you, on this path, both gaze at the stars and keep your feet firmly on the ground.
