import type { PyodideInterface } from 'pyodide';
import type { PyCallable } from 'pyodide/ffi';
import { GridWorld } from './grid';
import { MAX_ERROR_MESSAGE, clampStdin, clipText } from './limits';
import { explainError, kindForError, refineExplanation } from './errors';
import { DEFAULT_MAX_OUTPUT, MAX_TRACE_FRAMES, MAX_TRACE_STEPS, OutputLimitError, type ExecError, type ExecOptions, type ExecResult, type InputEvent, type TraceFrame, type TraceStep } from './types';

/** Pull "NameError: name 'x' is not defined" and the learner's line number out of a traceback. */
export function parsePythonError(traceback: string): Omit<ExecError, 'kind' | 'friendly'> {
  const lines = traceback.trim().split('\n');
  let line: number | undefined;
  for (const l of lines) {
    const m = l.match(/File "<exec>", line (\d+)/);
    if (m) line = Number(m[1]);
  }
  const last = lines.at(-1) ?? 'Error';
  // "NameError: name 'x' is not defined", or a bare "ValueError" with no message.
  const m = last.match(/^(\w+(?:\.\w+)*)(?::\s?(.*))?$/);
  const name = m ? m[1]!.split('.').at(-1)! : 'Error';
  return { name, message: m ? (m[2] ?? '') : last, line };
}

/**
 * Snapshot of interpreter state taken once per Pyodide instance, restored after every run,
 * so a learner who patches `print`, `sys.stdout`, or the recursion limit can't break later runs.
 */
const SNAPSHOT = `
import builtins, sys, importlib
# Stdlib modules learners commonly import (and sometimes modify, e.g. math.pi = 3).
# Extension modules stay cached even if removed from sys.modules, so their attributes
# are snapshotted and restored instead.
_GUARDED = ["math", "random", "string", "time", "itertools", "functools", "collections", "__main__"]
for _name in _GUARDED:
    try:
        importlib.import_module(_name)
    except Exception:
        pass
_guarded = {n: (sys.modules[n], dict(sys.modules[n].__dict__)) for n in _GUARDED if n in sys.modules}
_random_state = sys.modules["random"].getstate() if "random" in sys.modules else None
_builtins_snapshot = dict(builtins.__dict__)
_modules_snapshot = set(sys.modules)
_streams = (sys.stdout, sys.stderr, sys.stdin)
_limit = sys.getrecursionlimit()

def _restore(d, snapshot):
    for k in list(d):
        if k not in snapshot:
            del d[k]
    d.update(snapshot)

def reset():
    global _streams
    _restore(builtins.__dict__, _builtins_snapshot)
    for name, (module, snapshot) in _guarded.items():
        sys.modules[name] = module
        _restore(module.__dict__, snapshot)
    if _random_state is not None:
        # Fresh randomness by default; runs that need reproducibility seed explicitly.
        sys.modules["random"].seed()
    for name in list(sys.modules):
        if name not in _modules_snapshot:
            del sys.modules[name]
    sys.stdout, sys.stderr, sys.stdin = _streams
    if sys.stdin.closed:
        # Belt and braces: learner code closed stdin (e.g. sys.stdin.close()); reopen it.
        import io
        sys.stdin = io.TextIOWrapper(io.FileIO(0, "r", closefd=False))
        _streams = (_streams[0], _streams[1], sys.stdin)
    sys.setrecursionlimit(_limit)
`;

/**
 * Definitions placed in each run's globals:
 * - \`input(prompt)\` reads a line WITHOUT echoing the prompt, so \`input("Name: ")\` and
 *   \`input()\` produce the same output (the prompt is for humans; tests ignore it).
 * - Robot commands pass the learner's current line number so the UI can highlight it.
 */
const PRELUDE = `
import builtins as _builtins, sys as _sys
def input(prompt=""):
    _sys.stdout.flush()
    _record_input(str(prompt))
    return _builtins.input()
def exit(code=None):
    # The built-in exit()/quit() close stdin, which would break input() in every later run.
    raise SystemExit(code)
quit = exit
`;

const ROBOT_PRELUDE = `
def move(): _robot.move(_sys._getframe(1).f_lineno)
def turn_left(): _robot.turnLeft(_sys._getframe(1).f_lineno)
def collect(): _robot.collect(_sys._getframe(1).f_lineno)
def is_blocked(): return _robot.isBlocked()
def on_gem(): return _robot.onGem()
def at_flag(): return _robot.atFlag()
`;

/**
 * Step-through tracing: report each line of the learner's code (filename '<exec>') with the
 * call stack: one frame per active learner call, newest first, each with its own variables.
 * - These helpers live in their own namespace (`_tstart(learner_globals)` starts tracing), so
 *   none of them appears in, or can be overwritten from, the learner's globals.
 * - Names defined before the learner's code (prelude, robot commands) are left out by identity,
 *   so a learner's own `input` or `_count` still shows. Functions, modules and internal names
 *   like `.0` are left out too.
 * - Values are formatted by `_tfmt` without calling any learner code: built-in values look like
 *   `repr`, anything else (a learner's class, even with its own `__repr__`) shows as `Pet object`.
 * - At `_TMAX` steps the tracer raises `_TraceLimit` (a BaseException, so `except Exception`
 *   doesn't catch it) and CPython removes the tracer: the run stops straight away.
 * - The final "finished" step is only recorded when the module ends without an exception.
 * The format strings `{MAX}`/`{FRAMES}`/`{LINES}` are filled in per run.
 */
const TRACE_SETUP = `
import sys as _tsys, json as _tjson, types as _ttypes, itertools as _tit
class _TraceLimit(BaseException):
    pass
_TMAX, _TFRAMES, _TLINES = {MAX}, {FRAMES}, {LINES}
_tglobals = None
_tstate = {"n": 0, "next": 1, "exc": False}
_tids = {}
# Values are formatted without ever calling the learner's code (round-8 P1-4): a __repr__ or
# __str__ with side effects (printing, mutating, input()) would change the traced program. Only
# exact built-in types are shown (a subclass could override __repr__); anything else is
# "Pet object". Only Exception is caught, so the timeout interrupt still stops the run.
_TPLAIN = (bool, int, float, complex, type(None), range, str)
_TBOXES = (list, tuple, set, frozenset, dict)
def _tis(t, types):
    # Identity, not ==: a learner's metaclass could define __eq__.
    return any(t is x for x in types)
# Big values are cut while formatting (round-8 P1-6): every step formats every variable, so a
# 100,000-item list must cost the same as a short one.
_TITEMS, _TCHARS = 50, 200
def _tfmt(v, depth, seen):
    t = type(v)
    if t is str and len(v) > _TCHARS:
        return repr(v[:_TCHARS]) + f" … {len(v) - _TCHARS} more chars"
    if _tis(t, _TPLAIN):
        return repr(v)
    if _tis(t, _TBOXES):
        if id(v) in seen or depth > 3:
            return "[...]" if t is list else "{...}" if t in (dict, set, frozenset) else "(...)"
        seen.add(id(v))
        try:
            if t is dict:
                items = [_tfmt(k, depth + 1, seen) + ": " + _tfmt(x, depth + 1, seen) for k, x in _tit.islice(v.items(), _TITEMS)]
            else:
                items = [_tfmt(x, depth + 1, seen) for x in _tit.islice(v, _TITEMS)]
        finally:
            seen.discard(id(v))
        hidden = len(v) - len(items)
        body = ", ".join(items + ([f"... {hidden} more item" + ("s" if hidden > 1 else "")] if hidden > 0 else []))
        if t is list:
            return "[" + body + "]"
        if t is tuple:
            return "(" + body + ("," if len(items) == 1 else "") + ")"
        if t is dict:
            return "{" + body + "}"
        if not items:
            return "set()" if t is set else "frozenset()"
        return ("{" + body + "}") if t is set else ("frozenset({" + body + "})")
    return t.__name__ + " object"
def _tshow(v):
    try:
        r = _tfmt(v, 0, set())
    except Exception:
        r = type(v).__name__ + " object"
    return r if len(r) <= 80 else r[:77] + "..."
def _tlearner(f):
    return f.f_code.co_filename == "<exec>" and f.f_globals is _tglobals
def _tvars(f):
    top = f.f_code.co_name == "<module>"
    out = []
    for k, v in list(f.f_locals.items()):
        if not k.isidentifier() or (k.startswith("__") and k.endswith("__")):
            continue
        if top and k in _tpre and _tpre[k] is v:
            continue
        # issubclass on the type, not isinstance: isinstance can read a learner's __class__ property.
        if callable(v) or issubclass(type(v), _ttypes.ModuleType):
            continue
        out.append([k, _tshow(v)])
    return out
def _tname(f):
    name = f.f_code.co_name
    if name == "<module>":
        return ""
    if not f.f_code.co_flags & 1:  # not CO_OPTIMIZED: a class body, not a call
        return "class " + name
    qual = getattr(f.f_code, "co_qualname", name)
    return name if "<" in qual else qual  # methods read "Dog.speak"; nested functions keep their own name
def _ttracer(frame, event, arg):
    # Only the learner's code: other Pyodide calls also use the "<exec>" filename.
    if not _tlearner(frame):
        return None
    top = frame.f_code.co_name == "<module>"
    if event == "call":
        _tids[id(frame)] = _tstate["next"]
        _tstate["next"] += 1
        return _ttracer
    if event == "exception":
        if top:
            _tstate["exc"] = True
        return _ttracer
    if event == "return":
        _tids.pop(id(frame), None)
        if not top or _tstate["exc"] or _tstate["n"] >= _TMAX:
            return _ttracer
    elif event != "line" or frame.f_lineno > _TLINES:
        return _ttracer
    if top:
        _tstate["exc"] = False
    if _tstate["n"] >= _TMAX:
        raise _TraceLimit()
    _tstate["n"] += 1
    frames = []
    f = frame
    while f is not None:
        if _tlearner(f):
            frames.append(f)
        f = f.f_back
    stack = [[_tname(f), 0 if f.f_code.co_name == "<module>" else _tids.get(id(f), -1), _tvars(f)] for f in frames[:_TFRAMES]]
    _trace_rec(_tjson.dumps([frame.f_lineno if event == "line" else -1, stack, len(frames)]))
    return _ttracer
_tpre = {}
def _tstart(learner_globals):
    # The tracer lives in its own namespace; only the learner's globals are watched.
    global _tglobals
    _tglobals = learner_globals
    _tpre.update(learner_globals)
    _tsys.settrace(_ttracer)
`;

/**
 * Learner code must not reach the browser through Pyodide (round-8 P1-1/P1-2): `import js`
 * is the worker's global (postMessage, fetch), `pyodide_js`/`pyodide.code.run_js` run
 * JavaScript. For each run, `install(learner_globals)` hides `js`/`pyodide_js` from
 * `sys.modules`, blocks fresh imports of them, and refuses `js`/`pyodide*` imports made by
 * the learner's code (identified by its globals dict, so Pyodide's own imports still work). The
 * returned function undoes all of it. Python can't be fully sandboxed, so the web worker also
 * deletes `postMessage` and the network from its global (engine/lockdown.ts).
 */
const IMPORT_GUARD = `
import builtins, sys
_BLOCKED = ("js", "pyodide_js", "pyodide", "_pyodide", "micropip")
_HIDDEN = ("js", "pyodide_js")
def _refuse(name):
    raise ModuleNotFoundError(f"No module named '{name}'", name=name)
class _BlockJs:
    @classmethod
    def find_spec(cls, name, path=None, target=None):
        if name.split(".")[0] in _HIDDEN:
            _refuse(name)
        return None
def install(learner_globals):
    hidden = {n: sys.modules.pop(n) for n in list(sys.modules) if n.split(".")[0] in _HIDDEN}
    real_import = builtins.__import__
    def guarded(name, globals=None, locals=None, fromlist=(), level=0):
        if level == 0 and globals is learner_globals and name.split(".")[0] in _BLOCKED:
            _refuse(name)
        return real_import(name, globals, locals, fromlist, level)
    builtins.__import__ = guarded
    sys.meta_path.insert(0, _BlockJs)
    def uninstall():
        while _BlockJs in sys.meta_path:
            sys.meta_path.remove(_BlockJs)
        if builtins.__import__ is guarded:
            builtins.__import__ = real_import
        sys.modules.update(hidden)
    return uninstall
`;

/**
 * The output limit, enforced inside Python (round-8 P2): a JS write handler that throws makes
 * Pyodide log "Error thrown in write" with a stack to the console on every runaway. The wrapper
 * stops the program with `OutputLimitError` (a BaseException, so `except Exception` can't
 * hide it) before forwarding anything past the limit. reset() puts the real stream back. The JS
 * handler's own check stays as a backstop for code that swaps `sys.stdout` back.
 */
const OUTPUT_LIMIT = `
import sys
class OutputLimitError(BaseException):
    pass
class _Limited:
    def __init__(self, stream, limit):
        self._stream, self._left = stream, limit
    def write(self, text):
        self._left -= len(text)
        if self._left < 0:
            raise OutputLimitError("Your program printed too much output. Is there an infinite loop?")
        return self._stream.write(text)
    def __getattr__(self, name):
        return getattr(self._stream, name)
def install(limit):
    sys.stdout = _Limited(sys.stdout, limit)
`;

const limiters = new WeakMap<PyodideInterface, PyCallable>();

function outputLimitFor(pyodide: PyodideInterface): PyCallable {
  let install = limiters.get(pyodide);
  if (!install) {
    const ns = pyodide.globals.get('dict')();
    pyodide.runPython(OUTPUT_LIMIT, { globals: ns, filename: '<setup>' });
    install = ns.get('install') as PyCallable;
    limiters.set(pyodide, install);
  }
  return install;
}

const guards = new WeakMap<PyodideInterface, PyCallable>();

function importGuardFor(pyodide: PyodideInterface): PyCallable {
  let install = guards.get(pyodide);
  if (!install) {
    const ns = pyodide.globals.get('dict')();
    pyodide.runPython(IMPORT_GUARD, { globals: ns });
    install = ns.get('install') as PyCallable;
    guards.set(pyodide, install);
  }
  return install;
}

const resetters = new WeakMap<PyodideInterface, PyCallable>();

function resetterFor(pyodide: PyodideInterface): PyCallable {
  let reset = resetters.get(pyodide);
  if (!reset) {
    const ns = pyodide.globals.get('dict')();
    pyodide.runPython(SNAPSHOT, { globals: ns });
    reset = ns.get('reset') as PyCallable;
    resetters.set(pyodide, reset);
  }
  return reset;
}

function flushStreams(pyodide: PyodideInterface) {
  try {
    pyodide.runPython('import sys\nsys.stdout.flush()\nsys.stderr.flush()');
  } catch {
    // A flush can re-raise the output limit; the run already reported it.
  }
}

/**
 * Check the tracer's JSON before the UI sees it: `[line, [[name, id, [[var, value], ...]], ...], depth]`.
 * Anything that does not fit that shape is dropped (returns undefined) rather than trusted.
 */
export function parseTraceRecord(json: unknown, out: number): TraceStep | undefined {
  if (typeof json !== 'string' || json.length > 1_000_000) return undefined;
  let data: unknown;
  try {
    data = JSON.parse(json);
  } catch {
    return undefined;
  }
  if (!Array.isArray(data) || data.length !== 3) return undefined;
  const [line, stack, depth] = data as [unknown, unknown, unknown];
  if (typeof line !== 'number' || !Number.isFinite(line) || typeof depth !== 'number' || !Number.isFinite(depth)) return undefined;
  if (!Array.isArray(stack) || stack.length === 0 || stack.length > MAX_TRACE_FRAMES) return undefined;
  const frames: TraceFrame[] = [];
  for (const frame of stack) {
    if (!Array.isArray(frame) || frame.length !== 3) return undefined;
    const [name, id, vars] = frame as [unknown, unknown, unknown];
    if (typeof name !== 'string' || typeof id !== 'number' || !Array.isArray(vars) || vars.length > 500) return undefined;
    const pairs: [string, string][] = [];
    for (const pair of vars) {
      if (!Array.isArray(pair) || pair.length !== 2 || typeof pair[0] !== 'string' || typeof pair[1] !== 'string') return undefined;
      pairs.push([pair[0].slice(0, 200), pair[1].slice(0, 400)]);
    }
    frames.push({ name: name.slice(0, 200), id, vars: pairs });
  }
  return { line, scope: frames[0]!.name, vars: frames[0]!.vars, stack: frames, depth, out };
}

/**
 * Run learner Python inside an already-loaded Pyodide instance.
 * Each run gets fresh globals and interpreter state is restored afterwards.
 */
export async function runPython(pyodide: PyodideInterface, code: string, options: ExecOptions = {}): Promise<ExecResult> {
  const started = Date.now();
  const maxOutput = options.maxOutput ?? DEFAULT_MAX_OUTPUT;
  const reset = resetterFor(pyodide);
  let stdout = '';
  let stderr = '';
  let outputExceeded = false;
  const decoder = new TextDecoder();
  const write = (buffer: Uint8Array) => {
    stdout += decoder.decode(buffer);
    if (stdout.length > maxOutput) {
      outputExceeded = true;
      throw new OutputLimitError();
    }
    return buffer.length;
  };
  const writeErr = (buffer: Uint8Array) => {
    if (stderr.length < maxOutput) stderr += decoder.decode(buffer);
    return buffer.length;
  };

  // Discard anything a previous (possibly aborted) run left in Python's buffers.
  const discard = (buffer: Uint8Array) => buffer.length;
  pyodide.setStdout({ write: discard });
  pyodide.setStderr({ write: discard });
  flushStreams(pyodide);
  pyodide.setStdout({ write });
  pyodide.setStderr({ write: writeErr });

  const stdinLines = clampStdin(options.stdin);
  pyodide.setStdin({ stdin: () => (stdinLines.length ? stdinLines.shift()! : undefined), autoEOF: true });

  const world = options.grid ? new GridWorld(options.grid) : undefined;
  const globals = pyodide.globals.get('dict')();
  const inputs: InputEvent[] = [];
  // Every read is recorded, including one that finds no input left (a program waiting
  // for the player), so an interactive transcript can show the pending question.
  globals.set('_record_input', (prompt: string) => inputs.push({ offset: stdout.length, prompt }));
  pyodide.runPython(PRELUDE, { globals, filename: '<setup>' });
  if (options.seed !== undefined) pyodide.runPython(`import random\nrandom.seed(${Math.floor(options.seed)})`);
  if (world) {
    globals.set('_robot', world);
    pyodide.runPython(ROBOT_PRELUDE, { globals, filename: '<setup>' });
  }

  const trace: TraceStep[] = [];
  let traceTruncated = false;
  const codeLines = code.split('\n').length;
  // The tracer's helpers run in their own namespace, so none of them shows up in (or can be
  // broken by) the learner's globals (round-8 P1-5).
  const tracer = options.trace ? pyodide.globals.get('dict')() : undefined;
  if (tracer) {
    tracer.set('_trace_rec', (json: string) => {
      if (trace.length >= MAX_TRACE_STEPS + 1) return;
      const step = parseTraceRecord(json, stdout.length);
      if (step) trace.push(step);
    });
    const setup = TRACE_SETUP.replace('{MAX}', String(MAX_TRACE_STEPS)).replace('{FRAMES}', String(MAX_TRACE_FRAMES)).replace('{LINES}', String(codeLines));
    pyodide.runPython(setup, { globals: tracer, filename: '<setup>' });
    const start = tracer.get('_tstart') as PyCallable;
    start(globals);
    start.destroy();
  }

  let error: ExecError | undefined;
  const uninstallGuard = importGuardFor(pyodide)(globals) as PyCallable;
  outputLimitFor(pyodide)(maxOutput);
  try {
    // Synchronous on purpose: learner code never needs top-level await, and the async
    // runner routes SystemExit through the event loop as an unhandled rejection.
    // Tracing: end with a statement, so Pyodide doesn't evaluate a final expression on its
    // own (which shows up as stray line-1 steps); that extra line is dropped from the trace.
    pyodide.runPython(options.trace ? `${code}\npass` : code, { globals, filename: '<exec>' });
  } catch (e) {
    const text = e instanceof Error ? e.message : String(e);
    let parsed = parsePythonError(text);
    const cleanExit = parsed.name === 'SystemExit' && ['', '0', 'None'].includes(parsed.message.trim());
    // The tracer stopped the run at MAX_TRACE_STEPS: not the learner's error.
    const traceLimit = options.trace && parsed.name === '_TraceLimit';
    if (traceLimit) traceTruncated = true;
    if (outputExceeded) parsed = { name: 'OutputLimitError', message: new OutputLimitError().message };
    else if (/GridError/.test(text)) {
      // JS GridError surfaces in Python as a JsException; keep the robot's message.
      const msg = text.match(/GridError: (.*)/)?.[1] ?? parsed.message;
      parsed = { name: 'GridError', message: msg, line: parsed.line };
    }
    // sys.exit() / exit(0) is a normal way to end a program, not a crash.
    if ((!cleanExit && !traceLimit) || outputExceeded) {
      parsed = { ...parsed, name: clipText(parsed.name, 100), message: clipText(parsed.message, MAX_ERROR_MESSAGE) };
      const base = { ...parsed, kind: kindForError(parsed.name), friendly: explainError(parsed.name, parsed.message, 'python') };
      error = { ...base, friendly: refineExplanation(base, code, 'python') };
    }
  } finally {
    try {
      uninstallGuard();
    } catch {
      // reset() below restores builtins either way.
    }
    uninstallGuard.destroy();
    if (options.trace) {
      try {
        pyodide.runPython('import sys\nsys.settrace(None)');
      } catch {
        // Nothing to undo.
      }
    }
    flushStreams(pyodide);
    try {
      reset();
    } catch {
      // Restoring state is best effort; a broken interpreter gets replaced by the host.
    }
    globals.destroy();
    tracer?.destroy();
    pyodide.setStdout();
    pyodide.setStderr();
  }

  // A bare `except:` can swallow the limit; the tracer is gone either way.
  if (trace.length >= MAX_TRACE_STEPS && trace.at(-1)!.line !== -1) traceTruncated = true;

  return {
    stdout: stdout.length > maxOutput ? stdout.slice(0, maxOutput) : stdout,
    stderr: stderr ? stderr.slice(0, maxOutput) : undefined,
    inputs,
    error,
    grid: world?.outcome(error?.kind === 'robot' ? error.message : error ? 'Your program stopped with an error.' : undefined),
    durationMs: Date.now() - started,
    ...(options.trace ? { trace, traceTruncated } : {}),
  };
}
