import { describe, it, expect, vi } from 'vitest'
import { createMachine } from './state-machine'
import { interpret } from './service'
import { type EventObject, type TypeState } from './state-machine-types'

// Define types for our test machine
interface TestContext {
  count: number
  isValid?: boolean
}

interface TestEvent extends EventObject {
  type: 'TRIGGER' | 'RESET' | 'VALIDATE'
}

interface TestState extends TypeState {
  value: 'idle' | 'checking' | 'valid' | 'invalid' | 'processing' | 'done' | 'error'
}

describe('StateMachineService with always transitions', () => {
  it('should immediately transition when always has no guard', () => {
    const machine = createMachine<TestContext, TestEvent, TestState>({
      initial: 'idle',
      context: { count: 0 },
      states: {
        idle: {
          on: {
            TRIGGER: 'checking'
          }
        },
        checking: {
          always: { target: 'done' }
        },
        done: {},
        valid: {},
        invalid: {},
        processing: {},
        error: {}
      }
    })

    const service = interpret(machine)
    service.start()

    expect(service.state.value).toBe('idle')

    // Should immediately transition through checking to done
    service.send('TRIGGER')
    expect(service.state.value).toBe('done')
  })

  it('should evaluate guard and transition when true', () => {
    const machine = createMachine<TestContext, TestEvent, TestState>({
      initial: 'idle',
      context: { count: 5 },
      states: {
        idle: {
          on: {
            TRIGGER: 'checking'
          }
        },
        checking: {
          always: {
            target: 'valid',
            cond: (state) => (state.context?.count ?? 0) > 3
          }
        },
        done: {},
        valid: {},
        invalid: {},
        processing: {},
        error: {}
      }
    })

    const service = interpret(machine)
    service.start()

    service.send('TRIGGER')
    expect(service.state.value).toBe('valid')
  })

  it('should not transition when guard returns false', () => {
    const machine = createMachine<TestContext, TestEvent, TestState>({
      initial: 'idle',
      context: { count: 1 },
      states: {
        idle: {
          on: {
            TRIGGER: 'checking'
          }
        },
        checking: {
          always: {
            target: 'valid',
            cond: (state) => (state.context?.count ?? 0) > 3
          }
        },
        done: {},
        valid: {},
        invalid: {},
        processing: {},
        error: {}
      }
    })

    const service = interpret(machine)
    service.start()

    service.send('TRIGGER')
    // Should stay in checking since guard fails
    expect(service.state.value).toBe('checking')
  })

  it('should evaluate multiple transitions and take first matching', () => {
    const machine = createMachine<TestContext, TestEvent, TestState>({
      initial: 'idle',
      context: { count: 5 },
      states: {
        idle: {
          on: {
            TRIGGER: 'checking'
          }
        },
        checking: {
          always: [
            {
              target: 'error',
              cond: (state) => (state.context?.count ?? 0) < 0
            },
            {
              target: 'valid',
              cond: (state) => (state.context?.count ?? 0) > 3
            },
            {
              target: 'invalid',
              cond: (state) => (state.context?.count ?? 0) <= 3
            }
          ]
        },
        done: {},
        valid: {},
        invalid: {},
        processing: {},
        error: {}
      }
    })

    const service = interpret(machine)
    service.start()

    service.send('TRIGGER')
    // Should transition to 'valid' (second condition matches)
    expect(service.state.value).toBe('valid')
  })

  it('should execute actions during always transition', () => {
    const actionSpy = vi.fn()

    const machine = createMachine<TestContext, TestEvent, TestState>({
      initial: 'idle',
      context: { count: 0 },
      states: {
        idle: {
          on: {
            TRIGGER: 'checking'
          }
        },
        checking: {
          always: {
            target: 'done',
            actions: ['onAlways']
          }
        },
        done: {},
        valid: {},
        invalid: {},
        processing: {},
        error: {}
      }
    })

    const service = interpret(machine, {
      actions: {
        onAlways: actionSpy
      }
    })
    service.start()

    service.send('TRIGGER')
    expect(actionSpy).toHaveBeenCalledTimes(1)
    expect(service.state.value).toBe('done')
  })

  it('should handle chain of always transitions', () => {
    const machine = createMachine<TestContext, TestEvent, TestState>({
      initial: 'idle',
      context: { count: 5 },
      states: {
        idle: {
          on: {
            TRIGGER: 'checking'
          }
        },
        checking: {
          always: { target: 'processing' }
        },
        processing: {
          always: {
            target: 'valid',
            cond: (state) => (state.context?.count ?? 0) > 3
          }
        },
        done: {},
        valid: {},
        invalid: {},
        error: {}
      }
    })

    const service = interpret(machine)
    service.start()

    service.send('TRIGGER')
    // Should transition through checking -> processing -> valid
    expect(service.state.value).toBe('valid')
  })

  it('should handle always with fallback transition', () => {
    const machine = createMachine<TestContext, TestEvent, TestState>({
      initial: 'idle',
      context: { count: 2 },
      states: {
        idle: {
          on: {
            TRIGGER: 'checking'
          }
        },
        checking: {
          always: [
            {
              target: 'valid',
              cond: (state) => (state.context?.count ?? 0) > 5
            },
            {
              target: 'error',
              cond: (state) => (state.context?.count ?? 0) < 0
            },
            {
              // Fallback with no guard - always matches
              target: 'invalid'
            }
          ]
        },
        done: {},
        valid: {},
        invalid: {},
        processing: {},
        error: {}
      }
    })

    const service = interpret(machine)
    service.start()

    service.send('TRIGGER')
    // Should transition to 'invalid' (fallback)
    expect(service.state.value).toBe('invalid')
  })

  it('should check always transitions on initial state', () => {
    const machine = createMachine<TestContext, TestEvent, TestState>({
      initial: 'idle',
      context: { count: 10 },
      states: {
        idle: {
          always: {
            target: 'processing',
            cond: (state) => (state.context?.count ?? 0) > 5
          }
        },
        checking: {},
        processing: {},
        done: {},
        valid: {},
        invalid: {},
        error: {}
      }
    })

    const service = interpret(machine)
    service.start()

    // Should immediately transition from idle to processing on start
    expect(service.state.value).toBe('processing')
  })

  it('should work with always transitions after timer transitions', () => {
    vi.useFakeTimers()

    const machine = createMachine<TestContext, TestEvent, TestState>({
      initial: 'idle',
      context: { count: 7 },
      states: {
        idle: {
          after: {
            100: { target: 'checking' }
          }
        },
        checking: {
          always: {
            target: 'valid',
            cond: (state) => (state.context?.count ?? 0) > 5
          }
        },
        done: {},
        valid: {},
        invalid: {},
        processing: {},
        error: {}
      }
    })

    const service = interpret(machine)
    service.start()

    expect(service.state.value).toBe('idle')

    // Advance time to trigger timer
    vi.advanceTimersByTime(100)

    // Should transition from idle -> checking -> valid
    expect(service.state.value).toBe('valid')

    vi.useRealTimers()
  })

  it('should handle complex guard conditions with context', () => {
    const machine = createMachine<TestContext, TestEvent, TestState>({
      initial: 'idle',
      context: { count: 3, isValid: true },
      states: {
        idle: {
          on: {
            TRIGGER: 'checking'
          }
        },
        checking: {
          always: [
            {
              target: 'valid',
              cond: (state) => state.context?.isValid === true && (state.context?.count ?? 0) > 2
            },
            {
              target: 'invalid'
            }
          ]
        },
        done: {},
        valid: {},
        invalid: {},
        processing: {},
        error: {}
      }
    })

    const service = interpret(machine)
    service.start()

    service.send('TRIGGER')
    expect(service.state.value).toBe('valid')
  })

  it('should not cause infinite loop with circular always transitions', () => {
    const machine = createMachine<TestContext, TestEvent, TestState>({
      initial: 'idle',
      context: { count: 0 },
      states: {
        idle: {
          on: {
            TRIGGER: 'checking'
          }
        },
        checking: {
          always: {
            target: 'processing',
            cond: (state) => (state.context?.count ?? 0) < 10
          }
        },
        processing: {
          always: {
            target: 'checking',
            cond: (state) => (state.context?.count ?? 0) < 5
          }
        },
        done: {},
        valid: {},
        invalid: {},
        error: {}
      }
    })

    const service = interpret(machine)
    service.start()

    // This should not cause an infinite loop
    // The infinite loop protection will stop at 'checking' since it was already visited
    service.send('TRIGGER')
    expect(service.state.value).toBe('checking')
  })

  it('should handle always transition with array of actions', () => {
    const action1Spy = vi.fn()
    const action2Spy = vi.fn()

    const machine = createMachine<TestContext, TestEvent, TestState>({
      initial: 'idle',
      context: { count: 0 },
      states: {
        idle: {
          on: {
            TRIGGER: 'checking'
          }
        },
        checking: {
          always: {
            target: 'done',
            actions: ['action1', 'action2']
          }
        },
        done: {},
        valid: {},
        invalid: {},
        processing: {},
        error: {}
      }
    })

    const service = interpret(machine, {
      actions: {
        action1: action1Spy,
        action2: action2Spy
      }
    })
    service.start()

    service.send('TRIGGER')
    expect(action1Spy).toHaveBeenCalledTimes(1)
    expect(action2Spy).toHaveBeenCalledTimes(1)
    expect(service.state.value).toBe('done')
  })
})
