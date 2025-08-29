import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createMachine } from './state-machine'
import { interpret } from './service'
import { type EventObject, type TypeState } from './state-machine-types'

// Define types for our test machine
interface TestContext {
  count: number
}

interface TestEvent extends EventObject {
  type: 'START' | 'STOP' | 'RESET'
}

interface TestState extends TypeState {
  value: 'idle' | 'running' | 'stopped' | 'completed'
}

describe('StateMachineService with timers', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.clearAllTimers()
    vi.useRealTimers()
  })

  it('should transition after specified delay', () => {
    const machine = createMachine<TestContext, TestEvent, TestState>({
      initial: 'idle',
      context: { count: 0 },
      states: {
        idle: {
          on: {
            START: 'running'
          }
        },
        running: {
          after: {
            2000: { target: 'completed' }
          }
        },
        completed: {},
        stopped: {}
      }
    })

    const service = interpret(machine)
    service.start()

    expect(service.state.value).toBe('idle')

    // Transition to running state
    service.send('START')
    expect(service.state.value).toBe('running')

    // Timer should not have fired yet
    vi.advanceTimersByTime(1000)
    expect(service.state.value).toBe('running')

    // Timer should fire after 2000ms
    vi.advanceTimersByTime(1000)
    expect(service.state.value).toBe('completed')
  })

  it('should execute actions when timer transitions', () => {
    const actionSpy = vi.fn()

    const machine = createMachine<TestContext, TestEvent, TestState>({
      initial: 'idle',
      context: { count: 0 },
      states: {
        idle: {
          on: {
            START: 'running'
          }
        },
        running: {
          after: {
            1500: {
              target: 'completed',
              actions: ['onComplete']
            }
          }
        },
        completed: {},
        stopped: {}
      }
    })

    const service = interpret(machine, {
      actions: {
        onComplete: actionSpy
      }
    })
    service.start()

    service.send('START')
    expect(actionSpy).not.toHaveBeenCalled()

    vi.advanceTimersByTime(1500)
    expect(actionSpy).toHaveBeenCalledTimes(1)
    expect(service.state.value).toBe('completed')
  })

  it('should cancel timers when transitioning to another state', () => {
    const machine = createMachine<TestContext, TestEvent, TestState>({
      initial: 'idle',
      states: {
        idle: {
          on: {
            START: 'running'
          }
        },
        running: {
          after: {
            3000: { target: 'completed' }
          },
          on: {
            STOP: 'stopped'
          }
        },
        completed: {},
        stopped: {}
      }
    })

    const service = interpret(machine)
    service.start()

    service.send('START')
    expect(service.state.value).toBe('running')

    // Advance time but not enough to trigger timer
    vi.advanceTimersByTime(1500)
    expect(service.state.value).toBe('running')

    // Transition to stopped state should cancel the timer
    service.send('STOP')
    expect(service.state.value).toBe('stopped')

    // Even if we advance time, timer should not fire
    vi.advanceTimersByTime(2000)
    expect(service.state.value).toBe('stopped')
  })

  it('should support multiple timers with different delays', () => {
    const action1Spy = vi.fn()
    const action2Spy = vi.fn()

    const machine = createMachine<TestContext, TestEvent, TestState>({
      initial: 'idle',
      states: {
        idle: {
          on: {
            START: 'running'
          }
        },
        running: {
          after: {
            1000: {
              target: 'stopped',
              actions: ['action1']
            },
            2000: {
              target: 'completed',
              actions: ['action2']
            }
          }
        },
        completed: {},
        stopped: {}
      }
    })

    const service = interpret(machine, {
      actions: {
        action1: action1Spy,
        action2: action2Spy
      }
    })
    service.start()

    service.send('START')

    // First timer should fire at 1000ms
    vi.advanceTimersByTime(1000)
    expect(action1Spy).toHaveBeenCalledTimes(1)
    expect(action2Spy).not.toHaveBeenCalled()
    expect(service.state.value).toBe('stopped')
  })

  it('should cancel timers when service is stopped', () => {
    const machine = createMachine<TestContext, TestEvent, TestState>({
      initial: 'idle',
      states: {
        idle: {
          on: {
            START: 'running'
          }
        },
        running: {
          after: {
            2000: { target: 'completed' }
          }
        },
        completed: {},
        stopped: {}
      }
    })

    const service = interpret(machine)
    service.start()

    service.send('START')
    expect(service.state.value).toBe('running')

    // Stop the service
    service.stop()

    // Timer should not fire even after delay
    vi.advanceTimersByTime(3000)
    expect(service.state.value).toBe('running') // State should not change
  })

  it('should setup new timers when entering a state with after config', () => {
    const machine = createMachine<TestContext, TestEvent, TestState>({
      initial: 'idle',
      states: {
        idle: {
          after: {
            1000: { target: 'running' }
          }
        },
        running: {
          after: {
            1500: { target: 'completed' }
          }
        },
        completed: {},
        stopped: {}
      }
    })

    const service = interpret(machine)
    service.start()

    // Should be in idle initially
    expect(service.state.value).toBe('idle')

    // First timer fires after 1000ms
    vi.advanceTimersByTime(1000)
    expect(service.state.value).toBe('running')

    // Second timer fires after 1500ms more
    vi.advanceTimersByTime(1500)
    expect(service.state.value).toBe('completed')
  })

  it('should handle state with no after config', () => {
    const machine = createMachine<TestContext, TestEvent, TestState>({
      initial: 'idle',
      states: {
        idle: {
          on: {
            START: 'running'
          }
        },
        running: {
          // No after config
          on: {
            STOP: 'stopped'
          }
        },
        completed: {},
        stopped: {}
      }
    })

    const service = interpret(machine)
    service.start()

    service.send('START')
    expect(service.state.value).toBe('running')

    // No timer should fire
    vi.advanceTimersByTime(5000)
    expect(service.state.value).toBe('running')
  })
})
