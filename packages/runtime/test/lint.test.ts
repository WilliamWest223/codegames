import { describe, expect, it } from 'vitest';
import { lintCode } from '../src';

/** Spec E4: correct Region 5 / security references must not get "never called" or quote warnings. */
describe('lintCode false positives (E4)', () => {
  it('counts functions used as values', () => {
    expect(lintCode('def hp_of(p):\n    return p["hp"]\nprint(sorted([], key=hp_of))', 'python')).toEqual([]);
    expect(lintCode('function byHp(a, b) {\n  return a - b;\n}\nconsole.log([2, 1].sort(byHp));', 'javascript')).toEqual([]);
    expect(lintCode('def make():\n    def add(x):\n        return x\n    return add\nmake()', 'python')).toEqual([]);
    expect(lintCode('function $cost(x) {\n  return x;\n}\nconsole.log([1].map($cost));', 'javascript')).toEqual([]);
    // A definition with no use at all still warns.
    expect(lintCode('def helper():\n    pass\nprint(1)', 'python').join()).toMatch(/never called/);
  });

  it('skips dunder methods', () => {
    expect(lintCode('class Pet:\n    def __init__(self, name):\n        self.name = name\np = Pet("Rex")', 'python')).toEqual([]);
  });

  it('counts calls inside f-strings and template placeholders', () => {
    expect(lintCode('def caesar(t, k):\n    return t\nprint(f"Secret: {caesar(SECRET, -11)}")', 'python')).toEqual([]);
    expect(lintCode('function totalFees(o) {\n  return 1;\n}\nconsole.log(`Fees: ${totalFees([])}`);', 'javascript')).toEqual([]);
    // Plain strings still hide their text.
    expect(lintCode('def turn_right():\n    turn_left()\nprint("turn_right()")', 'python').join()).toMatch(/never called/);
  });

  it('does not mistake a template literal next to a quoted string', () => {
    expect(lintCode('const curved = [];\nconsole.log("Curved: " + curved.map((r) => `${r.name} ${r.score}`).join(", "));', 'javascript')).toEqual([]);
    expect(lintCode('const name = "Ada";\nconsole.log("Hi ${name}");', 'javascript').join()).toMatch(/backticks/);
  });

  it('map-filter-reduce-4 and higher-order-functions-6 references get no warnings', () => {
    const mfr4py = `def to_record(piece):
    name, score = piece.split(":")
    return {"name": name, "score": int(score)}

def parse(line):
    return [to_record(piece) for piece in line.split(",")]

def average(records):
    return sum(r["score"] for r in records) / len(records)

def honor_roll(records, cutoff):
    return sorted([r["name"] for r in records if r["score"] >= cutoff])

def curve(records, bonus):
    return [{"name": r["name"], "score": min(100, r["score"] + bonus)} for r in records]

records = parse(input())
cutoff = int(input())
print(f"Class average: {average(records):.1f}")
print("Honor roll: " + ", ".join(honor_roll(records, cutoff)))
curved = curve(records, 5)
print("Curved: " + ", ".join(f"{r['name']} {r['score']}" for r in curved))`;
    const mfr4js = `function toRecord(piece) {
  const [name, score] = piece.split(":");
  return { name: name, score: Number(score) };
}

function parse(line) {
  return line.split(",").map(toRecord);
}

function average(records) {
  return records.reduce((total, r) => total + r.score, 0) / records.length;
}

function honorRoll(records, cutoff) {
  return records.filter((r) => r.score >= cutoff).map((r) => r.name).sort();
}

function curve(records, bonus) {
  return records.map((r) => ({ name: r.name, score: Math.min(100, r.score + bonus) }));
}

const records = parse(prompt());
const cutoff = Number(prompt());
console.log(\`Class average: \${average(records).toFixed(1)}\`);
console.log("Honor roll: " + honorRoll(records, cutoff).join(", "));
const curved = curve(records, 5);
console.log("Curved: " + curved.map((r) => \`\${r.name} \${r.score}\`).join(", "));`;
    const hof6py = `route = "MMGRMMLMG"

def turn_right():
    for i in range(3):
        turn_left()

actions = {"M": move, "L": turn_left, "R": turn_right, "G": collect}

for letter in route:
    actions[letter]()`;
    const hof6js = `const route = "MMGRMMLMG";

function turnRight() {
  for (let i = 0; i < 3; i++) {
    turnLeft();
  }
}

const actions = { M: move, L: turnLeft, R: turnRight, G: collect };

for (const letter of route) {
  actions[letter]();
}`;
    expect(lintCode(mfr4py, 'python')).toEqual([]);
    expect(lintCode(mfr4js, 'javascript')).toEqual([]);
    expect(lintCode(hof6py, 'python')).toEqual([]);
    expect(lintCode(hof6js, 'javascript')).toEqual([]);
  });
});
