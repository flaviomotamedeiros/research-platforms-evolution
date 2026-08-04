import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()
const PASSWORD = 'Moodle@2025'

// ── Deterministic RNG (mulberry32) — same dataset on every run ──────────────
function rng(seed: number) {
  let a = seed >>> 0
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const rand = rng(20261)
const gauss = () => {
  const u = Math.max(rand(), 1e-9)
  const v = Math.max(rand(), 1e-9)
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
}

// ── People ──────────────────────────────────────────────────────────────────
type Profile = 'excellent' | 'regular' | 'atrisk' | 'critical'
const PROFILE_GRADE: Record<Profile, [number, number]> = {
  excellent: [88, 7], regular: [74, 10], atrisk: [58, 12], critical: [42, 14],
}
const PROFILE_PRESENCE: Record<Profile, number> = {
  excellent: 0.96, regular: 0.85, atrisk: 0.74, critical: 0.55,
}

const teachers = [
  { id: 'u-ana',    username: 'ana.cavalcante', first: 'Ana',    last: 'Cavalcante' },
  { id: 'u-helio',  username: 'helio.torres',   first: 'Hélio',  last: 'Torres' },
  { id: 'u-renata', username: 'renata.costa',   first: 'Renata', last: 'Costa' },
]

const students: Array<{ id: string; username: string; first: string; last: string; profile: Profile }> = [
  { id: 's-pedro',    username: 'pedro.ferreira',  first: 'Pedro',    last: 'Ferreira',   profile: 'regular' },
  { id: 's-maria',    username: 'maria.santos',    first: 'Maria',    last: 'Santos',     profile: 'excellent' },
  { id: 's-lucas',    username: 'lucas.almeida',   first: 'Lucas',    last: 'Almeida',    profile: 'critical' },
  { id: 's-aline',    username: 'aline.ribeiro',   first: 'Aline',    last: 'Ribeiro',    profile: 'excellent' },
  { id: 's-bruno',    username: 'bruno.carvalho',  first: 'Bruno',    last: 'Carvalho',   profile: 'regular' },
  { id: 's-carla',    username: 'carla.pereira',   first: 'Carla',    last: 'Pereira',    profile: 'regular' },
  { id: 's-daniel',   username: 'daniel.araujo',   first: 'Daniel',   last: 'Araújo',     profile: 'atrisk' },
  { id: 's-elisa',    username: 'elisa.moreira',   first: 'Elisa',    last: 'Moreira',    profile: 'excellent' },
  { id: 's-felipe',   username: 'felipe.cunha',    first: 'Felipe',   last: 'Cunha',      profile: 'regular' },
  { id: 's-gabriela', username: 'gabriela.melo',   first: 'Gabriela', last: 'Melo',       profile: 'regular' },
  { id: 's-henrique', username: 'henrique.batista',first: 'Henrique', last: 'Batista',    profile: 'atrisk' },
  { id: 's-isabela',  username: 'isabela.correia', first: 'Isabela',  last: 'Correia',    profile: 'excellent' },
  { id: 's-jonas',    username: 'jonas.freitas',   first: 'Jonas',    last: 'Freitas',    profile: 'regular' },
  { id: 's-karina',   username: 'karina.dias',     first: 'Karina',   last: 'Dias',       profile: 'regular' },
  { id: 's-marina',   username: 'marina.rocha',    first: 'Marina',   last: 'Rocha',      profile: 'atrisk' },
  { id: 's-natan',    username: 'natan.aguiar',    first: 'Natan',    last: 'Aguiar',     profile: 'critical' },
]
const profileOf = new Map(students.map((s) => [s.id, s.profile]))

// ── Content types ───────────────────────────────────────────────────────────
interface MaterialDef { pluginId: 'mod_page' | 'mod_video' | 'mod_url'; title: string; content: string; note?: string }
interface UnitDef { name: string; summary: string; materials: MaterialDef[]; activityIdx: number[] }
interface CourseDef {
  id: string; shortName: string; fullName: string; teacherId: string
  activities: Array<{ name: string; plugin: string; max: number; graded: boolean }>
  topics: string[]
  days: number[]
  units: UnitDef[]
}

const page = (title: string, html: string): MaterialDef => ({ pluginId: 'mod_page', title, content: html })
const video = (title: string, ytId: string, note?: string): MaterialDef => ({ pluginId: 'mod_video', title, content: ytId, note })
const link = (title: string, url: string): MaterialDef => ({ pluginId: 'mod_url', title, content: url })

// ── Courses with real lecture content ───────────────────────────────────────
const courses: CourseDef[] = [
  {
    id: 'c-oop', shortName: 'OOP-201', fullName: 'Object-Oriented Programming', teacherId: 'u-ana',
    days: [1, 3],
    activities: [
      { name: 'Assignment 1 — Classes and Encapsulation', plugin: 'mod_assign', max: 100, graded: true },
      { name: 'Quiz — Inheritance and Polymorphism',      plugin: 'mod_quiz',   max: 100, graded: true },
      { name: 'Project — Library Management System',      plugin: 'mod_assign', max: 100, graded: true },
      { name: 'Assignment 2 — Interfaces and Collections',plugin: 'mod_assign', max: 100, graded: true },
      { name: 'Final Project — REST API in Java',         plugin: 'mod_assign', max: 100, graded: false },
    ],
    topics: [
      'Course overview and the Java environment', 'Classes, attributes and methods', 'Constructors and encapsulation',
      'Inheritance and method overriding', 'Polymorphism and abstract classes', 'Interfaces', 'Collections: List and Map',
      'Exception handling', 'Streams and lambda expressions', 'JDBC and persistence', 'Design patterns: Factory',
      'Design patterns: Observer', 'REST APIs with Spring', 'Unit testing with JUnit', 'Final project review',
      'Project presentations — part 1', 'Project presentations — part 2', 'Exam review',
      'Midterm exam', 'Feedback session and wrap-up',
    ],
    units: [
      {
        name: 'Unit 1 — Object-Oriented Fundamentals',
        summary: 'Classes, objects, attributes, methods, and encapsulation.',
        activityIdx: [0],
        materials: [
          page('Lecture 01 — Classes and Objects', `
<h3>Why objects?</h3>
<p>Procedural programs organise code around <em>functions that operate on shared data</em>. As systems grow, every function can touch every piece of data, and a change in one place breaks another. Object orientation inverts this: data and the operations that are allowed to touch it live together in a <strong>class</strong>, and the rest of the program interacts with it only through a public interface.</p>
<h3>Classes are blueprints, objects are instances</h3>
<p>A class describes <em>structure</em> (attributes) and <em>behaviour</em> (methods). An object is one concrete instance with its own state:</p>
<pre><code>public class Student {
    private String registration;   // state — hidden from the outside
    private String name;
    private double[] grades = new double[3];

    public Student(String registration, String name) {
        this.registration = registration;
        this.name = name;
    }

    public double average() {                  // behaviour
        double sum = 0;
        for (double g : grades) sum += g;
        return sum / grades.length;
    }

    public void setGrade(int unit, double value) {
        if (unit >= 0 && unit < 3 && value >= 0 && value <= 100) {
            grades[unit] = value;              // validation lives WITH the data
        }
    }
}</code></pre>
<p>Two students are two independent objects: <code>new Student("2026001", "Maria")</code> and <code>new Student("2026002", "Pedro")</code> each carry their own grades. Calling <code>maria.average()</code> never touches Pedro's state.</p>
<h3>Encapsulation is a contract</h3>
<p>Notice that <code>grades</code> is <code>private</code> and the only way to write it is <code>setGrade</code>, which enforces the valid range. This is the heart of encapsulation: <strong>invariants are guaranteed by the class, not by the discipline of every caller</strong>. When we study the platform architecture later in the programme, you will see the same principle at system scale — modules expose contracts, not internals.</p>
<h3>Before next class</h3>
<ul>
<li>Install JDK 21 (Adoptium) and IntelliJ IDEA Community.</li>
<li>Reproduce the <code>Student</code> class and write a <code>main</code> that creates three students and prints their averages.</li>
<li>Think: what breaks if <code>grades</code> were <code>public</code>?</li>
</ul>`),
          video('Video — Learn Java: Full Beginner Course', 'grEKMHGYyns', 'Watch sections 1–4 (environment, variables, methods, classes) before Unit 1 ends.'),
          link('Official Java documentation', 'https://docs.oracle.com/en/java/'),
        ],
      },
      {
        name: 'Unit 2 — Inheritance and Polymorphism',
        summary: 'Code reuse, method overriding, abstract classes, and interfaces.',
        activityIdx: [1],
        materials: [
          page('Lecture 05 — Polymorphism in Practice', `
<h3>One call, many behaviours</h3>
<p>Polymorphism lets us treat different subclasses through the type of their superclass, and the JVM picks the right method <em>at runtime</em>. This is what makes frameworks possible: the framework calls <code>activity.grade()</code> without knowing which concrete activity it is.</p>
<pre><code>public abstract class Activity {
    private final String title;
    protected Activity(String title) { this.title = title; }
    public String getTitle() { return title; }

    /** Each activity type decides how it is graded. */
    public abstract double grade(Submission s);
}

public class Quiz extends Activity {
    public Quiz(String title) { super(title); }
    @Override public double grade(Submission s) {
        return s.correctAnswers() * 100.0 / s.totalQuestions();
    }
}

public class Essay extends Activity {
    public Essay(String title) { super(title); }
    @Override public double grade(Submission s) {
        return s.rubricScore();     // graded by rubric, not by counting
    }
}</code></pre>
<p>Client code now works for every present <em>and future</em> activity type:</p>
<pre><code>List&lt;Activity&gt; activities = List.of(new Quiz("HTTP basics"), new Essay("OSI vs TCP/IP"));
for (Activity a : activities) {
    System.out.println(a.getTitle() + " → " + a.grade(submission));
}</code></pre>
<h3>Abstract class or interface?</h3>
<ul>
<li><strong>Abstract class</strong>: shares state and partial implementation (<code>title</code> above). A class extends only one.</li>
<li><strong>Interface</strong>: pure contract, no state. A class can implement many — this is how a <code>Quiz</code> can also be <code>Timeable</code> and <code>Exportable</code>.</li>
</ul>
<p>Rule of thumb: model <em>what something is</em> with classes, <em>what something can do</em> with interfaces.</p>
<h3>Check yourself</h3>
<ol>
<li>Why can't we instantiate <code>Activity</code> directly?</li>
<li>What happens if <code>Essay</code> forgets to override <code>grade</code>?</li>
<li>Rewrite <code>grade</code> as an interface <code>Gradable</code> — what changes for the client loop?</li>
</ol>`),
          link('Baeldung — Inheritance in Java', 'https://www.baeldung.com/java-inheritance'),
        ],
      },
      {
        name: 'Unit 3 — Collections and Exceptions',
        summary: 'List, Map, Streams, and robust error handling.',
        activityIdx: [2, 3],
        materials: [
          page('Lecture 09 — Streams and Lambda Expressions', `
<h3>From how to what</h3>
<p>Classic loops describe <em>how</em> to traverse; the Streams API describes <em>what</em> you want. Compare computing the class average of approved students:</p>
<pre><code>// imperative
double sum = 0; int n = 0;
for (Student s : students) {
    if (s.average() >= 70) { sum += s.average(); n++; }
}
double result = n > 0 ? sum / n : 0;

// declarative
double result = students.stream()
    .mapToDouble(Student::average)
    .filter(avg -> avg >= 70)
    .average()
    .orElse(0);</code></pre>
<p>The declarative version reads like the requirement itself, and each step (<code>map</code>, <code>filter</code>, <code>average</code>) is independently testable.</p>
<h3>The pipeline model</h3>
<ul>
<li><strong>Source</strong>: a collection, file lines, or a generator.</li>
<li><strong>Intermediate operations</strong> (<code>map</code>, <code>filter</code>, <code>sorted</code>): lazy — nothing runs yet.</li>
<li><strong>Terminal operation</strong> (<code>collect</code>, <code>average</code>, <code>forEach</code>): triggers the whole pipeline once.</li>
</ul>
<pre><code>Map&lt;String, List&lt;Student&gt;&gt; byStatus = students.stream()
    .collect(Collectors.groupingBy(
        s -> s.average() >= 70 ? "approved" : "recovery"));</code></pre>
<h3>Common pitfalls</h3>
<ol>
<li>Reusing a consumed stream — build a new one from the source.</li>
<li>Side effects inside <code>map</code>/<code>filter</code> — keep them pure; mutate only in the terminal step.</li>
<li>Streams for everything — a plain loop is still clearer for tiny cases with early exits.</li>
</ol>
<p><strong>Exercise:</strong> using the grade records from Assignment 1, produce (a) the top-3 students by average, (b) a map from letter grade (A/B/C/D) to count of students, in a single pipeline each.</p>`),
          link('Java Collections — official tutorial', 'https://docs.oracle.com/javase/tutorial/collections/'),
        ],
      },
      {
        name: 'Unit 4 — Final Project',
        summary: 'Design patterns and a REST API with Spring Boot.',
        activityIdx: [4],
        materials: [
          page('Final Project Guide — REST API in Java', `
<h3>Goal</h3>
<p>Build, in pairs, a small REST API that manages <strong>courses, enrolments, and grades</strong> — a miniature of the platform you use every day. The project consolidates the whole semester: encapsulated domain classes, polymorphic grading strategies, collections, exceptions, and persistence.</p>
<h3>Required endpoints</h3>
<pre><code>POST   /courses               create course
GET    /courses/{id}          course detail
POST   /courses/{id}/enrol    enrol student
POST   /activities/{id}/grades   post grade  (teacher only)
GET    /students/{id}/report  consolidated grades + feedback</code></pre>
<h3>Architecture requirements</h3>
<ul>
<li><strong>Layers:</strong> controller → service → repository. Controllers hold no business rules.</li>
<li><strong>Domain first:</strong> validation lives in the domain classes (e.g. a grade outside 0–100 must be impossible to persist).</li>
<li><strong>Grading strategies:</strong> at least two (<code>points</code>, <code>pass/fail</code>) selected polymorphically — no <code>if (type == ...)</code> chains.</li>
<li><strong>Errors:</strong> domain violations map to HTTP 400 with a machine-readable code; unknown ids map to 404.</li>
</ul>
<h3>Evaluation rubric (100 pts)</h3>
<ul>
<li>Domain model and encapsulation — 30</li>
<li>Correct polymorphic design — 20</li>
<li>API contract and error handling — 20</li>
<li>Tests (JUnit, happy path + 2 edge cases per endpoint) — 20</li>
<li>Code style and README — 10</li>
</ul>
<p>Deliver the repository link by <strong>June 11</strong>. Presentations run in the last two lecture slots — 10 minutes per pair: 5 for a live demo, 5 for design questions.</p>`),
          link('Spring Boot — getting started guide', 'https://spring.io/guides/gs/spring-boot'),
        ],
      },
    ],
  },
  {
    id: 'c-db', shortName: 'DB-202', fullName: 'Relational Databases', teacherId: 'u-helio',
    days: [2, 4],
    activities: [
      { name: 'Problem Set 1 — ER Modelling',              plugin: 'mod_assign', max: 100, graded: true },
      { name: 'Assignment — Normalisation to 3NF',         plugin: 'mod_assign', max: 100, graded: true },
      { name: 'Quiz — SQL: Queries and Joins',             plugin: 'mod_quiz',   max: 100, graded: true },
      { name: 'Project — Academic System Data Model',      plugin: 'mod_assign', max: 100, graded: true },
      { name: 'Problem Set 2 — Procedures and Triggers',   plugin: 'mod_assign', max: 100, graded: false },
    ],
    topics: [
      'Course overview and DBMS landscape', 'ER model: entities and attributes', 'Relationships and cardinality',
      'The relational model', 'Relational algebra', 'SQL: DDL', 'SQL: basic queries', 'JOINs',
      'Aggregation and grouping', 'Subqueries', 'Normalisation: 1NF and 2NF', '3NF and BCNF',
      'Indexes and performance', 'Transactions and ACID', 'Procedures and functions', 'Triggers',
      'Backup and recovery', 'Project checkpoint', 'General review', 'Practical exam',
    ],
    units: [
      {
        name: 'Unit 1 — Data Modelling',
        summary: 'ER model, cardinality, and mapping to the relational model.',
        activityIdx: [0],
        materials: [
          page('Lecture 02 — Entities, Relationships, Cardinality', `
<h3>Model the domain, not the screens</h3>
<p>A data model outlives every interface built on top of it. We start from the <em>domain</em>: which things exist (entities), what we must remember about them (attributes), and how they relate (relationships).</p>
<h3>A worked example — this platform</h3>
<p>Consider the academic platform you are using right now:</p>
<ul>
<li><strong>Entities:</strong> Student, Teacher, Course, Activity, Grade, AttendanceSession.</li>
<li><strong>Attributes:</strong> a Grade has a value, a maximum, written feedback; a Session has a date and a topic.</li>
<li><strong>Relationships:</strong> a Student <em>enrols in</em> Courses (N:M — so it becomes its own table, Enrolment); a Course <em>offers</em> Activities (1:N); an Enrolment <em>receives</em> Grades (1:N).</li>
</ul>
<h3>Cardinality decides the tables</h3>
<pre><code>1:1  → same table or a foreign key with UNIQUE
1:N  → foreign key on the "N" side
N:M  → association table (often with its own attributes!)</code></pre>
<p>The association table is not a trick — it is usually a <em>real concept</em>. Enrolment is not "the join of student and course": it has its own life (enrolment date, status, role) and its own rules (a student enrols at most once per course → <code>UNIQUE(student_id, course_id)</code>).</p>
<h3>From ER to relations</h3>
<pre><code>students(id PK, name, email)
courses(id PK, code, title)
enrolments(id PK, student_id FK, course_id FK,
           enrolled_at, status,
           UNIQUE(student_id, course_id))
grades(id PK, enrolment_id FK, activity_id FK,
       value CHECK (value BETWEEN 0 AND 100),
       feedback,
       UNIQUE(enrolment_id, activity_id))</code></pre>
<p>Notice how each business rule became a <strong>constraint the database enforces</strong> — the same encapsulation idea you met in OOP, now guaranteed by the engine.</p>
<h3>Problem Set 1</h3>
<p>Model a municipal library: works, physical copies, members, loans, fines. Deliver the ER diagram plus the mapped relations with all keys and constraints. Every cardinality decision must carry a one-line justification.</p>`),
          video('Video — SQL: Full Database Course', 'HXV3zeQKqGY', 'Chapters 1–5 cover the material of Units 1 and 2.'),
          link('PostgreSQL documentation', 'https://www.postgresql.org/docs/'),
        ],
      },
      {
        name: 'Unit 2 — SQL',
        summary: 'DDL, queries, joins, and aggregation.',
        activityIdx: [2],
        materials: [
          page('Lecture 08 — JOINs, Properly', `
<h3>Joins are set operations with a shape</h3>
<p>Every report you will ever write is a join. The difference between a correct report and a silently wrong one is almost always the join type.</p>
<pre><code>-- Which students got which grades? (only matches)
SELECT s.name, a.title, g.value
FROM grades g
JOIN enrolments e ON e.id = g.enrolment_id
JOIN students   s ON s.id = e.student_id
JOIN activities a ON a.id = g.activity_id;

-- Every student, WITH OR WITHOUT a grade  ← report semantics!
SELECT s.name, a.title, g.value
FROM students s
JOIN enrolments e ON e.student_id = s.id
CROSS JOIN activities a
LEFT JOIN grades g
       ON g.enrolment_id = e.id AND g.activity_id = a.id
WHERE a.course_id = e.course_id;</code></pre>
<p>The second query answers "who is <em>missing</em> a grade?" — the rows where <code>g.value IS NULL</code>. An <code>INNER JOIN</code> would hide exactly the students the teacher most needs to see. This is the single most common reporting bug in production systems.</p>
<h3>Aggregation: the grain rule</h3>
<p>Before writing <code>GROUP BY</code>, say out loud what <strong>one row of the result means</strong> ("one row per student per course"). Every non-aggregated column in the SELECT must belong to that grain:</p>
<pre><code>SELECT e.course_id, s.name,
       AVG(g.value)            AS average,
       COUNT(g.value)          AS graded,
       COUNT(*) - COUNT(g.value) AS pending   -- COUNT ignores NULLs!
FROM enrolments e
JOIN students s ON s.id = e.student_id
LEFT JOIN grades g ON g.enrolment_id = e.id
GROUP BY e.course_id, s.name;</code></pre>
<h3>Practice</h3>
<ol>
<li>Attendance rate per student per course, counting <code>present</code> and <code>late</code> as attended.</li>
<li>Students below 75% attendance — the legal minimum under Brazilian education law.</li>
<li>For each activity, the class average and how many submissions are still ungraded.</li>
</ol>`),
          link('SQLBolt — interactive exercises', 'https://sqlbolt.com/'),
        ],
      },
      {
        name: 'Unit 3 — Normalisation',
        summary: '1NF to BCNF and schema quality.',
        activityIdx: [1, 3],
        materials: [
          page('Lecture 12 — Third Normal Form in Practice', `
<h3>Redundancy is a future bug</h3>
<p>Every redundant copy of a fact will eventually disagree with the original. Normalisation is the systematic removal of redundancy by analysing <em>functional dependencies</em> — "attribute B is determined by attribute A".</p>
<h3>A denormalised horror</h3>
<pre><code>report(student_id, student_name, course_code, course_title,
       teacher_name, teacher_email, grade)</code></pre>
<ul>
<li><code>student_name</code> depends only on <code>student_id</code> → repeated for every course.</li>
<li><code>course_title, teacher_*</code> depend only on <code>course_code</code> → repeated for every student.</li>
<li>Rename a teacher and you must update thousands of rows — miss one and the database now lies.</li>
</ul>
<h3>The forms, informally</h3>
<ol>
<li><strong>1NF</strong> — atomic values: no lists inside a column ("grades: 80,75,90" is a violation).</li>
<li><strong>2NF</strong> — no partial dependency: nothing depends on <em>part</em> of a composite key.</li>
<li><strong>3NF</strong> — no transitive dependency: non-key attributes depend on the key, the whole key, and nothing but the key.</li>
</ol>
<h3>When to stop</h3>
<p>Normalise to 3NF by default. Denormalise <em>consciously</em>, only for measured read-performance needs, and treat every denormalised copy as a cache with an owner and an update rule. In this course, unjustified redundancy in the project model costs points; justified, documented denormalisation does not.</p>
<p><strong>Assignment:</strong> the report table above, plus the library model from Unit 1, normalised step by step — show the dependency analysis at each stage, not only the final schema.</p>`),
          link('Use The Index, Luke — indexing guide', 'https://use-the-index-luke.com/'),
        ],
      },
      {
        name: 'Unit 4 — Programming the DBMS',
        summary: 'Transactions, procedures, and triggers.',
        activityIdx: [4],
        materials: [
          page('Lecture 15 — Transactions and ACID', `
<h3>The problem: partial success</h3>
<p>Enrolling a student touches three tables: insert the enrolment, create empty grade slots, log the event. If the process dies between steps, the database is <em>inconsistent</em> — an enrolment with no grade slots. Transactions make the three steps <strong>one atomic unit</strong>: all or nothing.</p>
<pre><code>BEGIN;
INSERT INTO enrolments (student_id, course_id, status)
VALUES (42, 'DB-202', 'active');

INSERT INTO grades (enrolment_id, activity_id, value)
SELECT currval('enrolments_id_seq'), a.id, NULL
FROM activities a WHERE a.course_id = 'DB-202';

INSERT INTO audit_log (event, payload)
VALUES ('enrolment.created', '{"student":42}');
COMMIT;   -- or ROLLBACK on any error</code></pre>
<h3>ACID, one letter at a time</h3>
<ul>
<li><strong>Atomicity</strong> — the block above commits entirely or not at all.</li>
<li><strong>Consistency</strong> — constraints hold before and after (a CHECK can never be "temporarily" violated at commit).</li>
<li><strong>Isolation</strong> — two teachers grading at once do not see each other's half-done work; know your isolation level (<code>READ COMMITTED</code> is PostgreSQL's default).</li>
<li><strong>Durability</strong> — once committed, a crash does not undo it (WAL).</li>
</ul>
<h3>Isolation in practice</h3>
<p>Classic anomaly: two concurrent "count then insert" enrolment checks both read 29/30 seats and both insert — 31 enrolled. Fixes: a <code>UNIQUE</code>/<code>CHECK</code> the engine enforces, <code>SELECT ... FOR UPDATE</code>, or a <code>SERIALIZABLE</code> transaction with retry. We will run this race live in the lab and watch each fix work.</p>
<p><strong>Problem Set 2</strong> asks you to implement the seat-limit rule twice — once with a trigger, once with an advisory approach — and to write a paragraph on when each is appropriate.</p>`),
          link('PostgreSQL — transactions tutorial', 'https://www.postgresql.org/docs/current/tutorial-transactions.html'),
        ],
      },
    ],
  },
  {
    id: 'c-net', shortName: 'NET-203', fullName: 'Computer Networks', teacherId: 'u-ana',
    days: [1, 5],
    activities: [
      { name: 'Assignment 1 — OSI vs TCP/IP',        plugin: 'mod_assign', max: 100, graded: true },
      { name: 'Lab — Subnetting and CIDR',           plugin: 'mod_assign', max: 100, graded: true },
      { name: 'Quiz — Transport Protocols',          plugin: 'mod_quiz',   max: 100, graded: true },
      { name: 'Project — Campus Lab Network Design', plugin: 'mod_assign', max: 100, graded: true },
      { name: 'Lab — VLAN Configuration',            plugin: 'mod_assign', max: 100, graded: false },
    ],
    topics: [
      'Course overview and a short history of networking', 'The OSI model', 'The TCP/IP model', 'IPv4 addressing',
      'Subnetting and CIDR', 'IPv6', 'HTTP, DNS and DHCP', 'TCP and UDP', 'Structured cabling',
      'Switches and routers', 'VLANs', 'Static routing', 'Dynamic routing', 'Wi-Fi standards',
      'Security: firewalls and ACLs', 'VPNs', 'Monitoring with SNMP', 'Project presentations',
      'Review', 'Final assessment',
    ],
    units: [
      {
        name: 'Unit 1 — Foundations',
        summary: 'OSI and TCP/IP models; how layering makes the Internet possible.',
        activityIdx: [0],
        materials: [
          page('Lecture 02 — The OSI Model, Layer by Layer', `
<h3>Why layers at all?</h3>
<p>Your browser does not know whether you are on Wi-Fi or fibre, and your network card does not know what HTTP is. Layering is the contract that makes this mutual ignorance <em>safe</em>: each layer offers a service to the one above and consumes the one below, through a fixed interface. Replace any layer's implementation and nothing else changes — the same architectural idea behind modular software.</p>
<h3>The seven layers, with real examples</h3>
<pre><code>7  Application   HTTP, DNS, SMTP        "GET /grades"
6  Presentation  TLS, encodings         encrypt, compress
5  Session       connection dialogues   (mostly folded into 7/4 today)
4  Transport     TCP, UDP               ports, reliability
3  Network       IP, ICMP               routing between networks
2  Data Link     Ethernet, Wi-Fi        frames inside one network
1  Physical      cables, radio          bits as signals</code></pre>
<h3>Follow one request down the stack</h3>
<p>When you open this platform: the browser writes an HTTP request (7), TLS encrypts it (6), TCP splits it into segments with port 443 (4), IP wraps each segment with source and destination addresses (3), Ethernet frames it with MAC addresses for the <em>next hop only</em> (2), and the medium carries the bits (1). Every router unwraps to layer 3, decides the next hop, and re-wraps layer 2 — which is why MAC addresses change every hop but IP addresses do not.</p>
<h3>OSI vs TCP/IP</h3>
<p>The Internet actually runs the 4-layer TCP/IP model (application, transport, internet, link). OSI survives as <em>vocabulary</em>: when an engineer says "that's a layer 2 problem", everyone knows to look at switches and frames, not routing tables. Assignment 1 asks you to map five real protocols onto both models and defend the mapping.</p>`),
          video('Video — Computer Networking Full Course', 'qiQR5rTSshw', 'The first 90 minutes map directly onto Units 1 and 2.'),
          link('Cisco Networking Academy', 'https://www.netacad.com/'),
        ],
      },
      {
        name: 'Unit 2 — Addressing',
        summary: 'IPv4, subnetting, CIDR, and IPv6.',
        activityIdx: [1, 2],
        materials: [
          page('Lecture 05 — Subnetting Without Tears', `
<h3>CIDR: the slash is a ruler</h3>
<p>An IPv4 address is 32 bits. The prefix length (<code>/24</code>) says how many of those bits name the <em>network</em>; the rest name hosts. <code>10.20.30.0/24</code> = 24 network bits, 8 host bits → 2⁸−2 = 254 usable hosts (all-zeros names the network, all-ones is broadcast).</p>
<h3>Splitting a network, bit by bit</h3>
<p>Campus scenario: you receive <code>172.16.40.0/24</code> and must serve four labs of up to 50 machines each. Borrow 2 bits (2² = 4 subnets), leaving 6 host bits (2⁶−2 = 62 hosts — fits):</p>
<pre><code>172.16.40.0/26     lab A   hosts .1  – .62   bcast .63
172.16.40.64/26    lab B   hosts .65 – .126  bcast .127
172.16.40.128/26   lab C   hosts .129– .190  bcast .191
172.16.40.192/26   lab D   hosts .193– .254  bcast .255</code></pre>
<h3>The three questions of every subnetting exercise</h3>
<ol>
<li><strong>How many subnets?</strong> → bits borrowed (⌈log₂ n⌉).</li>
<li><strong>How many hosts each?</strong> → remaining host bits (2ʰ−2 ≥ need).</li>
<li><strong>Where are the boundaries?</strong> → block size = 256 − mask octet; ranges advance in that step.</li>
</ol>
<p>In the lab you will verify every calculation by configuring the addresses on real interfaces and watching <code>ping</code> succeed inside a subnet and fail across subnets until a router is added — the moment layer 3 becomes concrete.</p>
<h3>A note on IPv6</h3>
<p>The same prefix logic applies with 128 bits and no broadcast; a standard LAN is a <code>/64</code> and the scarcity mindset disappears. We cover the notation and SLAAC next week — the subnetting <em>reasoning</em> you learn today transfers unchanged.</p>`),
          link('Subnet calculator (verify your lab answers)', 'https://www.subnet-calculator.com/'),
        ],
      },
      {
        name: 'Unit 3 — Infrastructure',
        summary: 'Cabling, switching, routing, and VLANs.',
        activityIdx: [4],
        materials: [
          page('Lecture 11 — VLANs: One Switch, Many Networks', `
<h3>The broadcast problem</h3>
<p>A switch floods broadcasts (ARP, DHCP discover) to every port. With 200 machines on one flat network, every machine hears every broadcast — noise, and worse, a security surface: the finance printer should not be reachable from the student lab at layer 2.</p>
<h3>VLANs segment logically</h3>
<p>A VLAN turns one physical switch into several <em>logical</em> switches. Port-based assignment is the common case:</p>
<pre><code>vlan 10
 name STAFF
vlan 20
 name STUDENTS
interface range gi0/1-12
 switchport mode access
 switchport access vlan 10
interface range gi0/13-24
 switchport mode access
 switchport access vlan 20</code></pre>
<p>Frames in VLAN 10 never reach VLAN 20 ports — the broadcast domain is split without buying hardware.</p>
<h3>Trunks carry many VLANs</h3>
<p>Between switches (or to a router), a <strong>trunk</strong> port carries all VLANs, tagging each frame with its VLAN id (IEEE 802.1Q — 4 bytes inserted in the Ethernet header):</p>
<pre><code>interface gi0/24
 switchport mode trunk
 switchport trunk allowed vlan 10,20</code></pre>
<h3>Inter-VLAN routing</h3>
<p>Two VLANs are two IP networks — traffic between them must be <em>routed</em> (router-on-a-stick with subinterfaces, or a layer-3 switch). This is where an ACL naturally sits: students reach the web server VLAN on port 443 only, and nothing else. Your project network must justify every VLAN and every inter-VLAN rule in exactly these terms.</p>`),
          link('Packet Tracer — network simulator', 'https://www.netacad.com/courses/packet-tracer'),
        ],
      },
      {
        name: 'Unit 4 — Security and Management',
        summary: 'Firewalls, VPNs, and SNMP monitoring.',
        activityIdx: [3],
        materials: [
          page('Lecture 15 — Firewalls and ACLs', `
<h3>Default deny is the only sane default</h3>
<p>A firewall policy is a list of rules evaluated top-down with an implicit <em>deny everything else</em> at the end. Security is not "block the bad" — it is "permit exactly the known-good, explicitly":</p>
<pre><code>10 permit tcp student_lab -> web_dmz   port 443
20 permit udp any        -> dns_srv    port 53
30 permit tcp staff_net  -> db_srv     port 5432
40 deny   ip  any        -> any        log</code></pre>
<h3>Stateful beats stateless</h3>
<p>A <em>stateless</em> ACL evaluates each packet alone, so return traffic needs its own mirrored rule. A <em>stateful</em> firewall records the outgoing connection and automatically admits its replies — fewer rules, fewer mistakes. Modern practice: stateful at network edges, lightweight ACLs inside (the inter-VLAN rules from Unit 3).</p>
<h3>Placement is architecture</h3>
<ul>
<li><strong>Edge</strong>: between campus and the Internet — NAT, stateful inspection.</li>
<li><strong>DMZ</strong>: public services live in their own segment; a compromised web server must not see the internal network.</li>
<li><strong>Internal segmentation</strong>: the VLAN boundaries you designed are enforcement points, not drawings.</li>
</ul>
<h3>Verification mindset</h3>
<p>Every rule in your project must answer three questions: who needs it, which destination and port, and what confirms it works (a test from the permitted source <em>and</em> a blocked probe from a denied one). "It seems to work" is not a network engineering statement — bring the two test outputs.</p>`),
          link('Wireshark — user documentation', 'https://www.wireshark.org/docs/'),
        ],
      },
    ],
  },
  {
    id: 'c-web', shortName: 'WEB-204', fullName: 'Web Development', teacherId: 'u-renata',
    days: [2, 3],
    activities: [
      { name: 'Assignment — Semantic HTML and CSS Layout', plugin: 'mod_assign', max: 100, graded: true },
      { name: 'Quiz — JavaScript: DOM and Events',         plugin: 'mod_quiz',   max: 100, graded: true },
      { name: 'Project — Single-Page App in React',        plugin: 'mod_assign', max: 100, graded: true },
      { name: 'Assignment — Forms and Validation',         plugin: 'mod_assign', max: 100, graded: true },
      { name: 'Final Project — Full-Stack Application',    plugin: 'mod_assign', max: 100, graded: false },
    ],
    topics: [
      'Course overview and tooling', 'Semantic HTML', 'CSS: the box model', 'Flexbox and Grid',
      'Responsive design', 'JavaScript fundamentals', 'The DOM and events', 'Fetch and APIs', 'Modern JavaScript (ES6+)',
      'React: components', 'React: state and props', 'React: hooks', 'Client-side routing', 'Forms',
      'Front-end authentication', 'Deployment', 'Accessibility', 'Project presentations', 'Review', 'Assessment',
    ],
    units: [
      {
        name: 'Unit 1 — Web Foundations',
        summary: 'Semantic HTML, CSS layout, and responsive design.',
        activityIdx: [0],
        materials: [
          page('Lecture 03 — The Box Model and Modern Layout', `
<h3>Everything is a box</h3>
<p>Every element the browser paints is a rectangle with four nested regions: <em>content</em>, <em>padding</em>, <em>border</em>, <em>margin</em>. Half of all CSS confusion disappears once you internalise one setting:</p>
<pre><code>*, *::before, *::after { box-sizing: border-box; }</code></pre>
<p>With <code>border-box</code>, <code>width: 300px</code> means the <em>visible box</em> is 300px — padding and border included. Without it, they are added on top, and your "300px card" is 340px and breaks the row.</p>
<h3>Flexbox: distribute along one axis</h3>
<pre><code>.toolbar {
  display: flex;
  justify-content: space-between;  /* main axis  */
  align-items: center;             /* cross axis */
  gap: 12px;                       /* modern: no margin hacks */
}</code></pre>
<p>Use flex when the content should decide sizes: toolbars, tag lists, card footers.</p>
<h3>Grid: design the two-dimensional skeleton</h3>
<pre><code>.dashboard {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 16px;
}</code></pre>
<p>That one rule is a whole responsive card layout: as many 280px-minimum columns as fit, stretching equally — no media query needed. Rule of thumb: <strong>grid for the page skeleton, flex inside the components</strong>.</p>
<h3>Assignment 1</h3>
<p>Rebuild the course dashboard of this platform as a static page: semantic landmarks (<code>header</code>, <code>nav</code>, <code>main</code>, <code>section</code>), a responsive card grid, and a toolbar — no CSS frameworks, DevTools open the whole time. Screenshots at 360px, 768px and 1280px are part of the delivery.</p>`),
          video('Video — React: Full Beginner Course', 'bMknfKXIFA8', 'Start after Unit 2; the component sections pair with Unit 3.'),
          link('MDN Web Docs', 'https://developer.mozilla.org/'),
        ],
      },
      {
        name: 'Unit 2 — JavaScript',
        summary: 'The DOM, events, fetch, and modern syntax.',
        activityIdx: [1, 3],
        materials: [
          page('Lecture 07 — The DOM and the Event Model', `
<h3>The DOM is a live tree</h3>
<p>HTML is text; the DOM is the <em>object tree</em> the browser builds from it. JavaScript never edits your file — it edits the tree, and the browser repaints:</p>
<pre><code>const list = document.querySelector('#grades');
const item = document.createElement('li');
item.textContent = 'OOP-201 — 96%';
list.append(item);</code></pre>
<h3>Events bubble — use it</h3>
<p>A click on a button travels down (capture) and back up (bubble) through its ancestors. Instead of one listener per row, attach <strong>one</strong> listener to the container and ask what was clicked — event delegation:</p>
<pre><code>document.querySelector('#grades').addEventListener('click', (e) => {
  const row = e.target.closest('li[data-course]');
  if (!row) return;
  openCourse(row.dataset.course);
});</code></pre>
<p>Delegation keeps working when rows are added later — which they will be, because data arrives asynchronously.</p>
<h3>Fetch: the network is asynchronous</h3>
<pre><code>async function loadGrades() {
  const res = await fetch('/api/me/grades', {
    headers: { Authorization: \`Bearer \${token}\` },
  });
  if (!res.ok) throw new Error(\`HTTP \${res.status}\`);
  const report = await res.json();
  render(report.items);
}</code></pre>
<p>Three habits from day one: always check <code>res.ok</code>; always render a loading state; always render an error state. The quiz includes one question for each, from real broken snippets.</p>`),
          link('JavaScript.info — the modern tutorial', 'https://javascript.info/'),
        ],
      },
      {
        name: 'Unit 3 — React',
        summary: 'Components, state, hooks, and routing.',
        activityIdx: [2],
        materials: [
          page('Lecture 11 — Thinking in Hooks', `
<h3>UI as a function of state</h3>
<p>React's contract: you describe the UI for the <em>current state</em>, and React reconciles the DOM when state changes. You never imperatively add rows — you change data, the list re-renders:</p>
<pre><code>function GradeList() {
  const [report, setReport] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('/api/me/grades')
      .then(r => { if (!r.ok) throw new Error('failed'); return r.json(); })
      .then(setReport)
      .catch(e => setError(e.message));
  }, []);                       // ← empty deps: run once after mount

  if (error)   return &lt;ErrorBanner message={error} /&gt;;
  if (!report) return &lt;Skeleton /&gt;;
  return report.items.map(item => &lt;GradeRow key={item.id} {...item} /&gt;);
}</code></pre>
<h3>The two hooks that matter first</h3>
<ul>
<li><code>useState</code> — a value that survives re-renders; <em>changing it triggers a render</em>. Never mutate: replace (<code>setItems([...items, next])</code>).</li>
<li><code>useEffect</code> — synchronise with the outside world (network, timers, subscriptions). The dependency array is a contract: everything the effect reads must be listed.</li>
</ul>
<h3>State goes where it is shared</h3>
<p>Two components need the same data? Lift the state to their nearest common parent and pass it down as props. Reaching for a global store before feeling that pain is premature — your SPA project is deliberately sized so lifting state is enough.</p>
<h3>Project checkpoint</h3>
<p>The SPA consumes this platform's real API (login, course list, grade report). Rubric highlights: loading/error states everywhere (20 pts), no prop-drilling deeper than two levels (15 pts), and a README explaining the component tree (10 pts).</p>`),
          link('React — official documentation', 'https://react.dev/'),
        ],
      },
      {
        name: 'Unit 4 — Full-Stack',
        summary: 'Authentication, deployment, and accessibility.',
        activityIdx: [4],
        materials: [
          page('Lecture 16 — Shipping: Build, Environment, Deploy', `
<h3>Development is not production</h3>
<p>Your dev server recompiles on save and serves unminified code with source maps. Production wants the opposite: a <strong>build</strong> — minified, tree-shaken, hashed filenames for immutable caching. Know what <code>npm run build</code> produces before you deploy it.</p>
<h3>Configuration lives in the environment</h3>
<pre><code># .env.local  (never committed)
DATABASE_URL=postgres://…
JWT_SECRET=long-random-string</code></pre>
<ul>
<li>Secrets never enter the repository — the platform (Vercel, Railway…) injects them at build/run time.</li>
<li>Anything exposed to the browser is <em>public by definition</em> — only non-secrets may be prefixed for client access.</li>
<li>The same build must run in staging and production; only the environment changes.</li>
</ul>
<h3>The deploy pipeline you will use</h3>
<pre><code>git push → platform builds → preview URL → checks pass → promote to production</code></pre>
<p>Preview deployments per branch mean every pull request has a clickable URL — reviews discuss the running app, not screenshots. Your final project must be delivered as a production URL <em>plus</em> the repository; "works on my machine" is not a deliverable.</p>
<h3>Accessibility is part of done</h3>
<p>Before submitting: keyboard-only pass (can you reach and operate everything?), labels on every input, contrast ≥ 4.5:1 for text, and alt text that says what the image <em>means</em>. We audit two projects live in class with a screen reader — volunteers earn 5 bonus points and, historically, ship the most accessible apps.</p>`),
          link('web.dev — performance and quality', 'https://web.dev/'),
        ],
      },
    ],
  },
  {
    id: 'c-os', shortName: 'OS-205', fullName: 'Operating Systems', teacherId: 'u-helio',
    days: [4, 5],
    activities: [
      { name: 'Problem Set — Processes and Threads', plugin: 'mod_assign', max: 100, graded: true },
      { name: 'Quiz — CPU Scheduling',               plugin: 'mod_quiz',   max: 100, graded: true },
      { name: 'Lab — Shell Scripting',               plugin: 'mod_assign', max: 100, graded: true },
      { name: 'Assignment — Memory Management',      plugin: 'mod_assign', max: 100, graded: false },
    ],
    topics: [
      'Course overview and history', 'OS structure', 'Processes', 'Threads', 'CPU scheduling',
      'Synchronisation', 'Deadlocks', 'Memory management', 'Virtual memory', 'File systems',
      'Input/output', 'Virtualisation', 'Containers', 'Shell and automation', 'Security',
      'Case study: Linux', 'Review', 'Assessment',
    ],
    units: [
      {
        name: 'Unit 1 — Processes',
        summary: 'OS structure, processes, and threads.',
        activityIdx: [0],
        materials: [
          page('Lecture 03 — Processes: Programs in Motion', `
<h3>Program vs process</h3>
<p>A program is a file; a <strong>process</strong> is that program <em>running</em>: its code, heap, stack, open files, and CPU registers. Run the same editor twice and you have two processes — same code, fully independent state.</p>
<h3>The process control block</h3>
<p>The kernel keeps one PCB per process: PID, state, saved registers, memory map, open file table, owner. A <em>context switch</em> is the kernel saving one PCB's registers and restoring another's — fast, but not free, which is why scheduling policy (next lecture) matters.</p>
<h3>The state machine every process lives in</h3>
<pre><code>        admitted            dispatch
  NEW ──────────► READY ◄──────────► RUNNING ──► TERMINATED
                    ▲                   │
                    │   I/O finished    │  I/O requested
                    └────── WAITING ◄───┘</code></pre>
<p>Key reading of the diagram: a process that asks for disk or network <em>leaves the CPU voluntarily</em> (RUNNING → WAITING). The CPU is never idle while any READY process exists — that overlap of one process's I/O with another's computation is the entire performance story of multiprogramming.</p>
<h3>Watch it live</h3>
<pre><code>ps -eo pid,stat,comm | head    # states right now: R, S, D, Z…
top                            # the scheduler's view, refreshing
strace -f ls /tmp              # every syscall a process makes</code></pre>
<p>A <code>Z</code> (zombie) is a terminated child whose parent has not yet read its exit status — the PCB lingers so the exit code is not lost. The problem set has you create one on purpose, observe it, and reap it correctly.</p>
<h3>Threads preview</h3>
<p>Threads share the address space but keep private stacks and registers — cheaper switches, instant data sharing, and therefore race conditions, which is Unit 2's opening problem.</p>`),
          video('Video — Operating Systems (Crash Course CS #18)', '26QPDBe-NB8', 'A 12-minute overview that frames Units 1 and 2.'),
          link('OSTEP — Operating Systems: Three Easy Pieces (free book)', 'https://pages.cs.wisc.edu/~remzi/OSTEP/'),
        ],
      },
      {
        name: 'Unit 2 — Scheduling and Synchronisation',
        summary: 'Scheduling policies, semaphores, and deadlocks.',
        activityIdx: [1],
        materials: [
          page('Lecture 05 — CPU Scheduling Policies', `
<h3>The question</h3>
<p>Ten processes are READY; one CPU core is free. Which runs? The answer is a <em>policy</em>, and every policy trades off throughput, latency, and fairness differently.</p>
<h3>The classic policies</h3>
<ul>
<li><strong>FCFS</strong> — run in arrival order. Simple; one long job makes everyone wait (convoy effect).</li>
<li><strong>SJF</strong> — shortest job first. Provably optimal for average wait; requires predicting the future, and long jobs can starve.</li>
<li><strong>Round-Robin</strong> — each process runs for a quantum (~10ms), then back of the queue. Great responsiveness; context-switch overhead grows as the quantum shrinks.</li>
<li><strong>MLFQ</strong> — multiple queues by priority; new jobs start high, CPU-hungry jobs sink, I/O-bound jobs stay high. This is the shape of real desktop schedulers.</li>
</ul>
<h3>Work one example by hand</h3>
<pre><code>Process  Arrival  Burst
P1       0        24
P2       1        3
P3       2        3

FCFS  → waits: P1=0, P2=23, P3=25   avg = 16.0
RR(4) → waits: P1=6, P2=3,  P3=5    avg ≈ 4.7</code></pre>
<p>Same workload, threefold difference in average wait — policy is not a detail. The quiz gives you two workloads and asks which policy each favours, <em>with the timeline drawn</em>.</p>
<h3>Why I/O-bound jobs deserve priority</h3>
<p>An I/O-bound process uses the CPU for microseconds and then waits for the disk again. Running it first costs almost nothing and keeps the disk busy; making it wait behind a CPU-bound job idles the disk. MLFQ encodes exactly this instinct. Connect this to Unit 1's state diagram and the whole design falls into place.</p>`),
          link('Linux man pages — sched(7)', 'https://man7.org/linux/man-pages/man7/sched.7.html'),
        ],
      },
      {
        name: 'Unit 3 — Memory and Files',
        summary: 'Virtual memory and file systems.',
        activityIdx: [3],
        materials: [
          page('Lecture 09 — Virtual Memory: The Grand Illusion', `
<h3>Every process believes it owns the machine</h3>
<p>Virtual memory gives each process a private address space starting at zero. The MMU translates every virtual address to a physical frame through <em>page tables</em>; two processes using "the same" address touch different physical memory, and neither can read the other's pages. Protection and relocation, solved by one mechanism.</p>
<h3>Paging</h3>
<p>Memory is managed in fixed-size <strong>pages</strong> (4 KiB). The page table maps virtual page → physical frame, with permission bits (read/write/execute) per page — writing a read-only page traps into the kernel, which is how copy-on-write and shared libraries work.</p>
<h3>Demand paging and page faults</h3>
<pre><code>process touches page ──► present? ── yes ──► proceed (fast path)
                          │
                          no (page fault)
                          ▼
              kernel loads page from disk,
              updates table, restarts instruction</code></pre>
<p>Programs start fast because <em>nothing</em> is loaded until touched. The cost model matters: RAM access ~100ns, SSD page-in ~100µs — a thousandfold. A program whose working set exceeds RAM page-faults continuously (<em>thrashing</em>): the CPU is busy, yet nothing progresses because everyone waits on the disk.</p>
<h3>Replacement: who leaves?</h3>
<p>When RAM is full, the kernel evicts a page. Optimal ("evict the page used farthest in the future") is unimplementable but is the benchmark; <strong>LRU</strong> approximates it using recency; the <strong>clock algorithm</strong> approximates LRU cheaply with one reference bit per page — the version real kernels ship. Your assignment simulates all three on the same trace and compares fault counts; the write-up explains <em>why</em> the ordering comes out as it does.</p>`),
          link('Linux man pages — mmap(2)', 'https://man7.org/linux/man-pages/man2/mmap.2.html'),
        ],
      },
      {
        name: 'Unit 4 — Virtualisation and Automation',
        summary: 'VMs, containers, and shell scripting.',
        activityIdx: [2],
        materials: [
          page('Lecture 13 — Containers: Isolation Without a Guest OS', `
<h3>VMs virtualise hardware; containers virtualise the OS</h3>
<p>A virtual machine boots a whole guest kernel on emulated hardware — strong isolation, gigabytes and minutes. A container is just a <em>process group</em> on the host kernel, wearing isolation glasses. Same kernel, different view. Startup in milliseconds, overhead near zero.</p>
<h3>Two kernel features make it work</h3>
<ul>
<li><strong>Namespaces</strong> — what the process <em>sees</em>. PID namespace: it believes it is PID 1. Mount namespace: its own filesystem root. Network namespace: its own interfaces and ports.</li>
<li><strong>cgroups</strong> — what the process <em>may use</em>: caps on CPU, memory, and I/O for the whole group.</li>
</ul>
<pre><code># see it with your own eyes
docker run -d --name lab --memory 256m nginx
docker exec lab ps aux          # inside: nginx is PID 1
ps aux | grep nginx             # outside: an ordinary host process
cat /sys/fs/cgroup/…/memory.max # the 256m limit, as a file</code></pre>
<h3>Images are layered filesystems</h3>
<p>An image is a stack of read-only layers (base OS, runtime, your app) plus one writable layer per container. Layers are shared: ten containers from one image occupy the image once. This is why the lab environment for this course — the same one that runs this very platform — is distributed as a compose file: identical stacks for every student, on any machine.</p>
<h3>Shell lab tie-in</h3>
<p>The shell lab automates a container workflow end to end: build, run with limits, health-check with retries and a timeout, collect logs on failure, tear down. Idempotency is graded — running your script twice must not fail the second time. That property has a name you will meet again in infrastructure work: <em>convergence</em>.</p>`),
          link('Docker — get started', 'https://docs.docker.com/get-started/'),
        ],
      },
    ],
  },
]

// Enrolment map
const enrolmentPlan: Record<string, string[]> = {
  'c-oop': ['s-pedro', 's-maria', 's-lucas', 's-aline', 's-bruno', 's-carla', 's-daniel', 's-elisa', 's-felipe', 's-gabriela', 's-henrique', 's-isabela'],
  'c-db':  ['s-pedro', 's-maria', 's-lucas', 's-bruno', 's-carla', 's-elisa', 's-felipe', 's-jonas', 's-karina', 's-marina', 's-natan', 's-isabela'],
  'c-net': ['s-pedro', 's-maria', 's-aline', 's-daniel', 's-gabriela', 's-henrique', 's-jonas', 's-karina', 's-marina', 's-natan'],
  'c-web': ['s-pedro', 's-lucas', 's-aline', 's-bruno', 's-elisa', 's-gabriela', 's-isabela', 's-jonas', 's-marina', 's-felipe'],
  'c-os':  ['s-maria', 's-carla', 's-daniel', 's-henrique', 's-karina', 's-natan', 's-lucas', 's-bruno'],
}

// Feedback pools by grade band
const FB = {
  high: [
    'Excellent work. Complete command of the topic — clear structure and sound technical justification throughout.',
    'Very strong submission. Every criterion met above expectations; the edge-case analysis was a highlight.',
    'Great organisation and precise reasoning. I used part of your solution as a reference example in class.',
    'Outstanding: correct, well-documented, and idiomatic. Keep this standard for the final project.',
  ],
  mid: [
    'Good work overall, but revisit the edge cases flagged in my inline comments.',
    'Mostly correct; the final section is superficial. Review the unit 3 material and strengthen the justification.',
    'Solid solution with minor naming and structure issues — see the annotations in your file.',
    'Requirements met, but the documentation needs real explanations rather than restating the code.',
  ],
  low: [
    'Incomplete submission. Redo questions 2 and 4 and resubmit during the recovery window.',
    'There are important conceptual errors here. Please attend office hours before the next deadline.',
    'The work does not meet the minimum criteria yet. Let us talk during office hours this week.',
    'Most items lack development. Rework them using the unit material and the worked examples from class.',
  ],
}
const pick = <T,>(arr: T[]) => arr[Math.floor(rand() * arr.length)]

// ── Semester calendar: Mar 2 – Jun 26, 2026, skipping holidays ──────────────
const HOLIDAYS = new Set(['2026-04-03', '2026-04-21', '2026-05-01', '2026-06-04'])
function sessionDates(days: number[], count: number): Date[] {
  const out: Date[] = []
  const d = new Date(2026, 2, 2)
  while (out.length < count && d < new Date(2026, 5, 27)) {
    const iso = d.toISOString().slice(0, 10)
    if (days.includes(d.getDay()) && !HOLIDAYS.has(iso)) out.push(new Date(d))
    d.setDate(d.getDate() + 1)
  }
  return out
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))

async function main() {
  const hash = await bcrypt.hash(PASSWORD, 10)

  await prisma.attendanceLog.deleteMany()
  await prisma.attendanceSession.deleteMany()
  await prisma.grade.deleteMany()
  await prisma.submission.deleteMany()
  await prisma.activity.deleteMany()
  await prisma.material.deleteMany()
  await prisma.courseSection.deleteMany()
  await prisma.enrollment.deleteMany()
  await prisma.user.deleteMany()
  await prisma.course.deleteMany()
  await prisma.category.deleteMany()

  await prisma.category.create({ data: { id: 'cat-cs', name: 'Computing and Information Technology', idnumber: 'CS' } })

  await prisma.course.createMany({
    data: courses.map((c) => ({
      id: c.id, fullName: c.fullName, shortName: c.shortName, categoryId: 'cat-cs', visible: true,
    })),
  })

  await prisma.user.createMany({
    data: [
      { id: 'u-admin', username: 'admin', email: 'admin@institute.edu', firstName: 'System', lastName: 'Admin', role: 'admin', passwordHash: hash },
      ...teachers.map((t) => ({
        id: t.id, username: t.username, email: `${t.username}@institute.edu`,
        firstName: t.first, lastName: t.last, role: 'teacher', passwordHash: hash,
      })),
      ...students.map((s) => ({
        id: s.id, username: s.username, email: `${s.username}@institute.edu`,
        firstName: s.first, lastName: s.last, role: 'student', passwordHash: hash,
      })),
    ],
  })

  const enrolments: Array<{ id: string; userId: string; courseId: string; role: string }> = []
  for (const c of courses) {
    enrolments.push({ id: `e-${c.teacherId}-${c.id}`, userId: c.teacherId, courseId: c.id, role: 'teacher' })
    for (const sid of enrolmentPlan[c.id]) {
      enrolments.push({ id: `e-${sid}-${c.id}`, userId: sid, courseId: c.id, role: 'student' })
    }
  }
  await prisma.enrollment.createMany({
    data: enrolments.map((e) => ({ ...e, status: 'active', enrolledAt: new Date(2026, 1, 10) })),
  })

  // Sections + materials
  const sectionRowsDb: any[] = []
  const materialRows: any[] = []
  const sectionOfActivity = new Map<string, string>()
  for (const c of courses) {
    c.units.forEach((u, ui) => {
      const secId = `sec-${c.id}-${ui}`
      sectionRowsDb.push({ id: secId, courseId: c.id, order: ui, name: u.name, summary: u.summary })
      u.materials.forEach((m, mi) => {
        materialRows.push({
          id: `mat-${secId}-${mi}`, courseId: c.id, sectionId: secId,
          pluginId: m.pluginId, title: m.title,
          content: m.pluginId === 'mod_video' ? JSON.stringify({ ytId: m.content, note: m.note ?? '' }) : m.content,
        })
      })
      for (const ai of u.activityIdx) sectionOfActivity.set(`${c.id}:${ai}`, secId)
    })
  }
  await prisma.courseSection.createMany({ data: sectionRowsDb })
  await prisma.material.createMany({ data: materialRows })

  // Activities + grades
  const activityRows: any[] = []
  const gradeRows: any[] = []
  for (const c of courses) {
    c.activities.forEach((a, i) => {
      const actId = `a-${c.id}-${i}`
      const due = new Date(2026, 2, 23 + i * 20)
      activityRows.push({
        id: actId, courseId: c.id,
        sectionId: sectionOfActivity.get(`${c.id}:${i}`) ?? `sec-${c.id}-0`,
        pluginId: a.plugin, name: a.name, visible: true,
        description: a.graded
          ? 'Individual submission through the platform. See the unit material for the grading rubric.'
          : 'In progress — due at the end of the unit.',
        dueDate: due,
      })
      if (!a.graded) return
      for (const sid of enrolmentPlan[c.id]) {
        const [mean, sd] = PROFILE_GRADE[profileOf.get(sid)!]
        if (rand() < 0.08) continue
        const value = Math.round(clamp(mean + gauss() * sd, 0, a.max) * 10) / 10
        const band = value >= 80 ? 'high' : value >= 60 ? 'mid' : 'low'
        gradeRows.push({
          id: `g-${sid}-${actId}`, enrollmentId: `e-${sid}-${c.id}`, activityId: actId,
          value, maxValue: a.max, feedback: pick(FB[band]), gradingStrategyType: 'points',
        })
      }
    })
  }
  await prisma.activity.createMany({ data: activityRows })
  await prisma.grade.createMany({ data: gradeRows })

  // Attendance
  const sessionRows: any[] = []
  const logRows: any[] = []
  const today = new Date(2026, 5, 10)
  for (const c of courses) {
    const dates = sessionDates(c.days, c.topics.length)
    dates.forEach((date, i) => {
      const sessId = `ss-${c.id}-${i}`
      sessionRows.push({ id: sessId, courseId: c.id, date, description: c.topics[i] ?? `Class ${i + 1}` })
      if (date >= today) return
      for (const sid of enrolmentPlan[c.id]) {
        const p = PROFILE_PRESENCE[profileOf.get(sid)!]
        const r = rand()
        const streak = profileOf.get(sid) === 'critical' && i >= 8 && i <= 12
        const status = streak ? 'absent'
          : r < p ? 'present'
          : r < p + 0.05 ? 'late'
          : r < p + 0.09 ? 'excused'
          : 'absent'
        logRows.push({ id: `lg-${sessId}-${sid}`, sessionId: sessId, userId: sid, status })
      }
    })
  }
  await prisma.attendanceSession.createMany({ data: sessionRows })
  for (let i = 0; i < logRows.length; i += 500) {
    await prisma.attendanceLog.createMany({ data: logRows.slice(i, i + 500) })
  }

  console.log(`Seed complete:
  courses:     ${courses.length}
  users:       ${1 + teachers.length + students.length}
  enrolments:  ${enrolments.length}
  sections:    ${sectionRowsDb.length}
  materials:   ${materialRows.length}
  activities:  ${activityRows.length}
  grades:      ${gradeRows.length}
  sessions:    ${sessionRows.length}
  logs:        ${logRows.length}
Password for all users: ${PASSWORD}`)
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
