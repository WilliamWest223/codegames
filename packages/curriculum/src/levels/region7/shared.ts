import { code, dedent } from '../../helpers';

/** Like `code()`, but typed so both programs are known to exist (for `.replace`-derived fixes). */
export function pair(python: string, javascript: string): { python: string; javascript: string } {
  return { python: dedent(python), javascript: dedent(javascript) };
}

/**
 * Region 7 (Trees & Graphs): trees, binary search trees, heaps, graphs and BFS, Dijkstra,
 * backtracking, dynamic programming, greedy interval scheduling, and the Star Courier boss.
 * Spec: docs/specs/regions6-8.md Part B.
 *
 * Content rules: never print a bare Python object or an unordered set; graph adjacency is a
 * dictionary/Map of lists so traversal order is the insertion order and identical in both
 * languages; harness stdin always lets the main program finish.
 */

/**
 * A minimal binary min-heap of `[priority, item]` pairs, given to the Dijkstra levels so the
 * learner spends the level on the algorithm, not on re-deriving the heap from `heaps`.
 */
export const HEAP = code(
  `
  def heap_push(heap, pair):
      heap.append(pair)
      i = len(heap) - 1
      while i > 0 and heap[(i - 1) // 2][0] > heap[i][0]:
          heap[(i - 1) // 2], heap[i] = heap[i], heap[(i - 1) // 2]
          i = (i - 1) // 2

  def heap_pop(heap):
      top = heap[0]
      last = heap.pop()
      if heap:
          heap[0] = last
          i = 0
          while True:
              smallest = i
              for child in (2 * i + 1, 2 * i + 2):
                  if child < len(heap) and heap[child][0] < heap[smallest][0]:
                      smallest = child
              if smallest == i:
                  break
              heap[i], heap[smallest] = heap[smallest], heap[i]
              i = smallest
      return top
  `,
  `
  function heapPush(heap, pair) {
    heap.push(pair);
    let i = heap.length - 1;
    while (i > 0 && heap[Math.floor((i - 1) / 2)][0] > heap[i][0]) {
      const parent = Math.floor((i - 1) / 2);
      [heap[parent], heap[i]] = [heap[i], heap[parent]];
      i = parent;
    }
  }

  function heapPop(heap) {
    const top = heap[0];
    const last = heap.pop();
    if (heap.length > 0) {
      heap[0] = last;
      let i = 0;
      while (true) {
        let smallest = i;
        for (const child of [2 * i + 1, 2 * i + 2]) {
          if (child < heap.length && heap[child][0] < heap[smallest][0]) {
            smallest = child;
          }
        }
        if (smallest === i) {
          break;
        }
        [heap[i], heap[smallest]] = [heap[smallest], heap[i]];
        i = smallest;
      }
    }
    return top;
  }
  `,
);

/** Like `code()`, with the given heap helpers above each language's program. */
export function withHeap(python: string, javascript: string) {
  const c = code(python, javascript);
  return { python: `${HEAP.python}\n\n${c.python}`, javascript: `${HEAP.javascript}\n\n${c.javascript}` };
}
