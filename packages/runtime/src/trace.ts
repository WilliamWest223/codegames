import { parse } from 'acorn';

/**
 * Step-through support for JavaScript. Two kinds of text are inserted (on existing lines
 * only, so error line numbers are unchanged):
 * - `$$cg_step(line, scope, getVars, frame)` before every statement that sits directly in a
 *   block, recording the line about to run and the variables of the current call;
 * - `$$cg_enter(name)` / `$$cg_leave(frame)` around every function body (try/finally), so the
 *   runner keeps a call stack with one frame per active call;
 * - `$$cg_check()` first in every `catch` block, which re-throws the step-limit stop, so a
 *   learner's `catch` can't swallow it and spin until the timeout (round-8 P2).
 *
 * `getVars` only reads names declared in a block that contains the statement (plus outer
 * function variables the function uses, for closures), so worker globals like `name` never
 * show up as learner variables. Reads are wrapped in try/catch: a `let` further down is simply
 * skipped. Generators and async functions get no frame of their own (a suspended call would
 * stay on the stack); their steps still show their variables.
 * The `$$cg_` names can't clash with anything a learner writes by accident.
 */
type Node = { type: string; start: number; end: number; loc?: { start: { line: number } }; [key: string]: unknown };

export const TRACE_NAMES = { step: '$$cg_step', enter: '$$cg_enter', leave: '$$cg_leave', top: '$$cg_top', check: '$$cg_check' } as const;

const isNode = (x: unknown): x is Node => !!x && typeof x === 'object' && typeof (x as Node).type === 'string';
const FUNCTION = new Set(['FunctionDeclaration', 'FunctionExpression', 'ArrowFunctionExpression']);
const SKIP_STEP = new Set(['FunctionDeclaration', 'ClassDeclaration', 'EmptyStatement']);

function children(node: Node): Node[] {
  const out: Node[] = [];
  for (const key of Object.keys(node)) {
    if (key === 'loc') continue;
    const value = node[key];
    if (Array.isArray(value)) value.forEach((v) => isNode(v) && out.push(v));
    else if (isNode(value)) out.push(value);
  }
  return out;
}

/** Names bound by a declaration pattern: `a`, `{ a, b: c }`, `[a, ...rest]`, `a = 1`. */
function patternNames(p: Node | null | undefined, into: Set<string>) {
  if (!p) return;
  if (p.type === 'Identifier') into.add(p.name as string);
  else if (p.type === 'AssignmentPattern') patternNames(p.left as Node, into);
  else if (p.type === 'RestElement') patternNames(p.argument as Node, into);
  else if (p.type === 'ArrayPattern') (p.elements as (Node | null)[]).forEach((e) => patternNames(e, into));
  else if (p.type === 'ObjectPattern') (p.properties as Node[]).forEach((prop) => patternNames((prop.type === 'RestElement' ? prop : prop.value) as Node, into));
}

/** Function-scoped names: parameters, `var` declarations, and function declarations in the body. */
function functionScoped(fn: Node): Set<string> {
  const names = new Set<string>();
  if (fn.type !== 'Program') (fn.params as Node[]).forEach((p) => patternNames(p, names));
  const body = fn.type === 'Program' ? fn : (fn.body as Node);
  if (body.type === 'BlockStatement' || body.type === 'Program') {
    for (const stmt of body.body as Node[]) if (stmt.type === 'FunctionDeclaration' && stmt.id) names.add((stmt.id as Node).name as string);
  }
  const visit = (node: Node) => {
    if (FUNCTION.has(node.type) || node.type === 'ClassBody') return;
    if (node.type === 'VariableDeclaration' && node.kind === 'var') (node.declarations as Node[]).forEach((d) => patternNames(d.id as Node, names));
    children(node).forEach(visit);
  };
  visit(body);
  return names;
}

/** Block-scoped names declared directly in a list of statements (`let`, `const`, `class`, block functions). */
function lexical(statements: Node[]): Set<string> {
  const names = new Set<string>();
  for (const stmt of statements) {
    if (stmt.type === 'VariableDeclaration' && stmt.kind !== 'var') (stmt.declarations as Node[]).forEach((d) => patternNames(d.id as Node, names));
    if ((stmt.type === 'ClassDeclaration' || stmt.type === 'FunctionDeclaration') && stmt.id) names.add((stmt.id as Node).name as string);
  }
  return names;
}

function identifiers(node: Node, into = new Set<string>()): Set<string> {
  if (node.type === 'Identifier') into.add(node.name as string);
  children(node).forEach((c) => identifiers(c, into));
  return into;
}

function getter(names: Iterable<string>): string {
  const reads = [...names].map((n) => `try{$$cg_v.push(["${n}",${n}])}catch($$cg_e){}`).join('');
  return `()=>{const $$cg_v=[];${reads}return $$cg_v}`;
}

interface Fn {
  name: string;
  isProgram: boolean;
  /** Has its own frame (`$$cg_f`); false for generators and async functions. */
  tracked: boolean;
  /** Function-scoped names (params, var, function declarations). */
  vars: Set<string>;
  /** Outer function variables this function uses (closures). */
  outer: Set<string>;
}

/** A readable name for a function: its own name, or the variable / property it is assigned to. */
function functionName(node: Node, parent: Node | undefined, className: string): string {
  const id = node.id as Node | undefined;
  if (id?.name) return id.name as string;
  if (parent) {
    if (parent.type === 'VariableDeclarator' && (parent.id as Node).type === 'Identifier') return (parent.id as Node).name as string;
    if ((parent.type === 'Property' || parent.type === 'MethodDefinition' || parent.type === 'PropertyDefinition') && !parent.computed) {
      const key = parent.key as Node;
      // Methods read like Python's: `Dog.speak`, `Dog.constructor`.
      if (key.type === 'Identifier') return parent.type === 'Property' || !className ? (key.name as string) : `${className}.${key.name as string}`;
    }
    if (parent.type === 'AssignmentExpression') {
      const left = parent.left as Node;
      if (left.type === 'Identifier') return left.name as string;
      if (left.type === 'MemberExpression' && !left.computed) return ((left.property as Node).name as string) ?? '(anonymous)';
    }
  }
  return '(anonymous)';
}

export function instrumentJavaScript(code: string): string | undefined {
  let program: Node;
  try {
    program = parse(code, { ecmaVersion: 'latest', sourceType: 'script', allowReturnOutsideFunction: true, locations: true }) as unknown as Node;
  } catch {
    return undefined; // a syntax error: run normally and let the error be reported
  }
  // group 0 = closing a function wrapper, 1 = opening one, 2 = a step; nesting depth breaks ties.
  const inserts: { at: number; text: string; group: number; depth: number }[] = [];
  const top: Fn = { name: '', isProgram: true, tracked: true, vars: functionScoped(program), outer: new Set() };
  const frameRef = (fn: Fn) => (fn.isProgram ? TRACE_NAMES.top : fn.tracked ? '$$cg_f' : 'null');
  const visibleIn = (fn: Fn, blocks: Set<string>[]) => new Set([...fn.vars, ...blocks.flatMap((b) => [...b]), ...fn.outer]);

  const steps = (statements: Node[], fn: Fn, blocks: Set<string>[], depth: number) => {
    for (const stmt of statements) {
      if (SKIP_STEP.has(stmt.type) || !stmt.loc) continue;
      inserts.push({
        at: stmt.start,
        text: `${TRACE_NAMES.step}(${stmt.loc.start.line},${JSON.stringify(fn.name)},${getter(visibleIn(fn, blocks))},${frameRef(fn)});`,
        group: 2,
        depth,
      });
    }
  };

  const walk = (node: Node, parent: Node | undefined, fn: Fn, blocks: Set<string>[], depth: number, className = ''): void => {
    if (FUNCTION.has(node.type)) {
      const own = functionScoped(node);
      const used = identifiers(node);
      const outer = new Set(fn.isProgram ? [] : [...visibleIn(fn, blocks)].filter((n) => used.has(n) && !own.has(n)));
      const inner: Fn = { name: functionName(node, parent, className), isProgram: false, tracked: !node.async && !node.generator, vars: own, outer };
      const body = node.body as Node;
      if (inner.tracked) {
        const enter = `const $$cg_f=${TRACE_NAMES.enter}(${JSON.stringify(inner.name)});try{`;
        const leave = `}finally{${TRACE_NAMES.leave}($$cg_f)}`;
        if (body.type === 'BlockStatement' && body.end - body.start === 2) {
          // `{}`: enter and leave would share one offset, and the sort puts closers first, so
          // insert them as one piece (round-8 P0-2).
          inserts.push({ at: body.start + 1, text: enter + leave, group: 1, depth });
        } else if (body.type === 'BlockStatement') {
          inserts.push({ at: body.start + 1, text: enter, group: 1, depth });
          inserts.push({ at: body.end - 1, text: leave, group: 0, depth });
        } else {
          // `x => expr`: wrap the expression (from just after `=>`, so its brackets stay whole).
          const arrow = code.lastIndexOf('=>', body.start);
          if (arrow > node.start) {
            inserts.push({ at: arrow + 2, text: `{${enter}return(`, group: 1, depth });
            inserts.push({ at: node.end, text: `)${leave}}`, group: 0, depth });
          }
        }
      }
      (node.params as Node[]).forEach((p) => walk(p, node, fn, blocks, depth + 1));
      walk(body, node, inner, [], depth + 1);
      return;
    }
    let inner = blocks;
    if (node.type === 'Program' || node.type === 'BlockStatement' || node.type === 'StaticBlock') {
      inner = [...blocks, lexical(node.body as Node[])];
      steps(node.body as Node[], fn, inner, depth);
    } else if (node.type === 'SwitchStatement') {
      const cases = node.cases as Node[];
      inner = [...blocks, lexical(cases.flatMap((c) => c.consequent as Node[]))];
      cases.forEach((c) => steps(c.consequent as Node[], fn, inner, depth));
    } else if (node.type === 'ForStatement' || node.type === 'ForInStatement' || node.type === 'ForOfStatement') {
      const head = (node.type === 'ForStatement' ? node.init : node.left) as Node | null;
      if (head?.type === 'VariableDeclaration' && head.kind !== 'var') inner = [...blocks, lexical([head])];
    } else if (node.type === 'CatchClause') {
      const body = node.body as Node;
      inserts.push({ at: body.start + 1, text: `${TRACE_NAMES.check}();`, group: 1, depth });
      const names = new Set<string>();
      patternNames(node.param as Node | null, names);
      inner = [...blocks, names];
    }
    const cls = node.type === 'ClassDeclaration' || node.type === 'ClassExpression' ? (((node.id as Node | null)?.name as string | undefined) ?? '') : className;
    children(node).forEach((c) => walk(c, node, fn, inner, depth, cls));
  };
  walk(program, undefined, top, [], 0);

  inserts.sort((a, b) => a.at - b.at || a.group - b.group || (a.group === 0 ? b.depth - a.depth : a.depth - b.depth));
  let out = '';
  let from = 0;
  for (const { at, text } of inserts) {
    out += code.slice(from, at) + text;
    from = at;
  }
  out += code.slice(from);
  // The final state, recorded only if the program finishes normally.
  const topNames = new Set([...top.vars, ...lexical(program.body as Node[])]);
  return `${out}\n${TRACE_NAMES.step}(-1,"",${getter(topNames)},${TRACE_NAMES.top});`;
}
