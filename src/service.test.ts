import { beforeEach, describe, it, expect, vi } from 'vitest'
import { assign, interpret } from './service'
import { createMachine } from './state-machine'
import { type EventObject, type StateMachineConfig, type TypeState } from './state-machine-types'
import { type StateMachineServiceInterface } from './service-types'

interface TestContext {
  test: string
}

interface TestState {
  value: string
}

interface TestEvent {
  type: 'NEXT'
}

describe('state-machine', () => {
  let config: StateMachineConfig<TestContext, TestEvent, TestState>
  beforeEach(() => {
    config = {
      initial: 'A',
      states: {
        A: {
          on: {
            NEXT: 'B'
          }
        },
        B: {
          on: {
            NEXT: 'C'
          }
        },
        C: {
          on: {
            NEXT: 'D'
          }
        },
        D: {
          on: {
            NEXT: 'A'
          }
        }
      }
    }
  })

  it('should create a state machine service', () => {
    const machine = createMachine(config)
    const service: StateMachineServiceInterface<TestContext, TestEvent, TestState> = interpret(machine)
    service.start()
    expect(service.state).toMatchObject({ value: 'A' })
    service.send('NEXT')
    expect(service.state).toMatchObject({ value: 'B' })
    service.send('NEXT')
    expect(service.state).toMatchObject({ value: 'C' })
    service.send('NEXT')
    expect(service.state).toMatchObject({ value: 'D' })
    service.send('NEXT')
    expect(service.state).toMatchObject({ value: 'A' })
  })

  it('should notify on state change', () => {
    const machine = createMachine(config)
    const service: StateMachineServiceInterface<TestContext, TestEvent, TestState> = interpret(machine)
    const listener = vi.fn()
    service.subscribe(listener)
    service.start()
    expect(service.state).toMatchObject({ value: 'A' })
    service.send('NEXT')
    expect(service.state).toMatchObject({ value: 'B' })
    expect(listener).toHaveBeenCalledTimes(1)
  })

  it('should notify on context change for a self transition', () => {
    const machine = createMachine({
      initial: 'A',
      context: {
        test: 'hello'
      },
      states: {
        A: {
          on: {
            NEXT: {
              actions: 'updateTest'
            }
          }
        },
        B: {
          on: {
            NEXT: 'A'
          }
        }
      }
    })
    const options = {
      actions: {
        updateTest: () => assign({
          test: 'world'
        })
      }
    }
    const service: StateMachineServiceInterface<TestContext, TestEvent, TestState> = interpret(machine, options)
    const listener = vi.fn()
    service.subscribe(listener)
    service.start()
    expect(service.state).toMatchObject({ value: 'A', context: { test: 'hello' } })
    service.send('NEXT')
    expect(service.state).toMatchObject({ value: 'A', context: { test: 'world' } })
    expect(listener).toHaveBeenCalledTimes(1)
  })

  it('should unsubscribe from state change', () => {
    const machine = createMachine(config)
    const service: StateMachineServiceInterface<TestContext, TestEvent, TestState> = interpret(machine)
    const listener = vi.fn()
    const subscription = service.subscribe(listener)
    service.start()
    expect(service.state).toMatchObject({ value: 'A' })
    service.send('NEXT')
    expect(service.state).toMatchObject({ value: 'B' })
    expect(listener).toHaveBeenCalledTimes(1)
    subscription.unsubscribe()
    service.send('NEXT')
    expect(service.state).toMatchObject({ value: 'C' })
    expect(listener).toHaveBeenCalledTimes(1)
  })

  it('should stop notifying when the state machine has stopped', () => {
    const machine = createMachine(config)
    const service: StateMachineServiceInterface<TestContext, TestEvent, TestState> = interpret(machine)
    const listener = vi.fn()
    service.subscribe(listener)
    service.start()
    expect(service.state).toMatchObject({ value: 'A' })
    service.send('NEXT')
    expect(service.state).toMatchObject({ value: 'B' })
    expect(listener).toHaveBeenCalledTimes(1)
    service.stop()
    service.send('NEXT')
    expect(service.state).toMatchObject({ value: 'B' })
    expect(listener).toHaveBeenCalledTimes(1)
  })

  it('should execute entry actions', () => {
    const machine = createMachine(config)
    const service: StateMachineServiceInterface<TestContext, TestEvent, TestState> = interpret(machine)
    const entryAction = vi.fn()
    config.states.A.entry = entryAction
    service.start()
    expect(service.state).toMatchObject({ value: 'A' })
    expect(entryAction).toHaveBeenCalledTimes(1)
  })

  it('should execute entry actions defined as strings', () => {
    const machine = createMachine(config)
    const entryAction = vi.fn()
    const options = {
      actions: {
        entryAction
      }
    }
    const service: StateMachineServiceInterface<TestContext, TestEvent, TestState> = interpret(machine, options)
    config.states.A.entry = 'entryAction'
    service.start()
    expect(service.state).toMatchObject({ value: 'A' })
    expect(entryAction).toHaveBeenCalledTimes(1)
  })

  it('should execute exit actions', () => {
    const machine = createMachine(config)
    const service: StateMachineServiceInterface<TestContext, TestEvent, TestState> = interpret(machine)
    const exitAction = vi.fn()
    config.states.A.exit = exitAction
    service.start()
    expect(service.state).toMatchObject({ value: 'A' })
    service.send('NEXT')
    expect(service.state).toMatchObject({ value: 'B' })
    expect(exitAction).toHaveBeenCalledTimes(1)
  })

  it('should execute exit actions defined as strings', () => {
    const machine = createMachine(config)
    const exitAction = vi.fn()
    const options = {
      actions: {
        exitAction
      }
    }
    const service: StateMachineServiceInterface<TestContext, TestEvent, TestState> = interpret(machine, options)
    config.states.A.exit = 'exitAction'
    service.start()
    expect(service.state).toMatchObject({ value: 'A' })
    service.send('NEXT')
    expect(service.state).toMatchObject({ value: 'B' })
    expect(exitAction).toHaveBeenCalledTimes(1)
  })

  it('should execute exit actions before state change', () => {
    const machine = createMachine(config)
    const service: StateMachineServiceInterface<TestContext, TestEvent, TestState> = interpret(machine)
    let exitState = { value: 'none' }
    config.states.A.exit = (): void => {
      exitState = service.state
    }
    service.start()
    expect(service.state).toMatchObject({ value: 'A' })
    service.send('NEXT')
    expect(service.state).toMatchObject({ value: 'B' })
    expect(exitState.value).toEqual('A')
  })

  it('should execute transition actions', () => {
    const transitionAction = vi.fn()
    const config = {
      initial: 'A',
      states: {
        A: {
          on: {
            NEXT: {
              target: 'B',
              actions: transitionAction
            }
          }
        },
        B: {
          on: {
            NEXT: 'A'
          }
        }
      }
    }
    const machine = createMachine(config)
    const service: StateMachineServiceInterface<object, EventObject, TypeState> = interpret(machine)
    service.start()
    expect(service.state).toMatchObject({ value: 'A' })
    service.send('NEXT')
    expect(service.state).toMatchObject({ value: 'B', actions: expect.any(Function) })
    expect(transitionAction).toHaveBeenCalledTimes(1)
  })

  it('should execute self transition actions', () => {
    const transitionAction = vi.fn()
    const config = {
      initial: 'A',
      states: {
        A: {
          on: {
            NEXT: {
              actions: transitionAction
            }
          }
        }
      }
    }
    const machine = createMachine(config)
    const service: StateMachineServiceInterface<object, EventObject, TypeState> = interpret(machine)
    service.start()
    expect(service.state).toMatchObject({ value: 'A' })
    service.send('NEXT')
    expect(service.state).toMatchObject({ value: 'A', actions: expect.any(Function) })
    expect(transitionAction).toHaveBeenCalledTimes(1)
  })

  it('should execute transition actions defined as strings', () => {
    const transitionAction = vi.fn()
    const options = {
      actions: {
        transitionAction
      }
    }
    const config = {
      initial: 'A',
      states: {
        A: {
          on: {
            NEXT: {
              target: 'B',
              actions: 'transitionAction'
            }
          }
        },
        B: {
          on: {
            NEXT: 'A'
          }
        }
      }
    }
    const machine = createMachine(config)
    const service: StateMachineServiceInterface<object, EventObject, TypeState> = interpret(machine, options)
    service.start()
    expect(service.state).toMatchObject({ value: 'A' })
    service.send('NEXT')
    expect(service.state).toMatchObject({ value: 'B', actions: 'transitionAction' })
    expect(transitionAction).toHaveBeenCalledTimes(1)
  })

  it('should execute many transition action functions', () => {
    const transitionAction1 = vi.fn()
    const transitionAction2 = vi.fn()
    const config = {
      initial: 'A',
      states: {
        A: {
          on: {
            NEXT: {
              target: 'B',
              actions: [transitionAction1, transitionAction2]
            }
          }
        },
        B: {
          on: {
            NEXT: 'A'
          }
        }
      }
    }
    const machine = createMachine(config)
    const service: StateMachineServiceInterface<object, EventObject, TypeState> = interpret(machine)
    service.start()
    expect(service.state).toMatchObject({ value: 'A' })
    service.send('NEXT')
    expect(service.state).toMatchObject({ value: 'B', actions: expect.arrayContaining([transitionAction1, transitionAction2]) })
    expect(transitionAction1).toHaveBeenCalledTimes(1)
    expect(transitionAction2).toHaveBeenCalledTimes(1)
  })

  it('should execute many transition action functions defined as strings', () => {
    const transitionAction1 = vi.fn()
    const transitionAction2 = vi.fn()
    const options = {
      actions: {
        transitionAction1,
        transitionAction2
      }
    }
    const config = {
      initial: 'A',
      states: {
        A: {
          on: {
            NEXT: {
              target: 'B',
              actions: ['transitionAction1', 'transitionAction2']
            }
          }
        },
        B: {
          on: {
            NEXT: 'A'
          }
        }
      }
    }
    const machine = createMachine(config)
    const service: StateMachineServiceInterface<object, EventObject, TypeState> = interpret(machine, options)
    service.start()
    expect(service.state).toMatchObject({ value: 'A' })
    service.send('NEXT')
    expect(service.state).toMatchObject({ value: 'B', actions: expect.arrayContaining(['transitionAction1', 'transitionAction2']) })
    expect(transitionAction1).toHaveBeenCalledTimes(1)
    expect(transitionAction2).toHaveBeenCalledTimes(1)
  })

  it('should execute many transition action functions defined as strings and functions', () => {
    const transitionAction1 = vi.fn()
    const transitionAction2 = vi.fn()
    const options = {
      actions: {
        transitionAction1
      }
    }
    const config = {
      initial: 'A',
      states: {
        A: {
          on: {
            NEXT: {
              target: 'B',
              actions: ['transitionAction1', transitionAction2]
            }
          }
        },
        B: {
          on: {
            NEXT: 'A'
          }
        }
      }
    }
    const machine = createMachine(config)
    const service: StateMachineServiceInterface<object, EventObject, TypeState> = interpret(machine, options)
    service.start()
    expect(service.state).toMatchObject({ value: 'A' })
    service.send('NEXT')
    expect(service.state).toMatchObject({ value: 'B', actions: expect.arrayContaining(['transitionAction1', transitionAction2]) })
    expect(transitionAction1).toHaveBeenCalledTimes(1)
    expect(transitionAction2).toHaveBeenCalledTimes(1)
  })

  it('should assign context', () => {
    const machine = createMachine({
      initial: 'A',
      context: {
        test: 'hello'
      },
      states: {
        A: {
          on: {
            NEXT: {
              target: 'B',
              actions: 'updateTest'
            }
          }
        },
        B: {
          on: {
            NEXT: 'A'
          }
        }
      }
    })
    const options = {
      actions: {
        updateTest: () => assign({
          test: 'world'
        })
      }
    }
    const service: StateMachineServiceInterface<TestContext, TestEvent, TestState> = interpret(machine, options)
    service.start()
    expect(service.state).toMatchObject({ value: 'A', context: { test: 'hello' } })
    service.send('NEXT')
    expect(service.state).toMatchObject({ value: 'B', context: { test: 'world' } })
  })
})
