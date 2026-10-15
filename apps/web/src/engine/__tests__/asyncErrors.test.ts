import { describe, expect, it } from 'vitest';
import { collectAsyncErrors } from '../asyncErrors';

/** Round-8 P2: errors from promises and timers reach the learner instead of vanishing. */
describe('collectAsyncErrors', () => {
  it('collects unhandled rejections and uncaught timer errors, and stops them spreading', () => {
    const scope = new EventTarget();
    const errors = collectAsyncErrors(scope);
    const rejection = Object.assign(new Event('unhandledrejection', { cancelable: true }), { reason: new TypeError('x is undefined') });
    const thrown = Object.assign(new Event('error', { cancelable: true }), { error: new RangeError('too far') });
    scope.dispatchEvent(rejection);
    scope.dispatchEvent(thrown);
    expect(rejection.defaultPrevented).toBe(true);
    expect(thrown.defaultPrevented).toBe(true);
    expect(errors.take()).toEqual(['Uncaught (in promise) TypeError: x is undefined', 'Uncaught RangeError: too far']);
    expect(errors.take()).toEqual([]);
  });

  it('describes non-Error reasons too', () => {
    const scope = new EventTarget();
    const errors = collectAsyncErrors(scope);
    scope.dispatchEvent(Object.assign(new Event('unhandledrejection', { cancelable: true }), { reason: 'nope' }));
    scope.dispatchEvent(Object.assign(new Event('error', { cancelable: true }), { message: 'Script error.' }));
    expect(errors.take()).toEqual(['Uncaught (in promise) nope', 'Uncaught Script error.']);
  });
});
