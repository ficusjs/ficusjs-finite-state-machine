import { describe, it } from '@jest/globals'
import { createMachine } from './state-machine'
import { type StateMachineConfig, type StateMachineInterface } from './state-machine-types'

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
  it('should create a state machine with initial state', () => {
    const config: StateMachineConfig<TestContext, TestEvent, TestState> = {
      initial: 'A',
      states: {
        A: {
          on: {
            NEXT: 'B'
          }
        },
        B: {
          on: {
            NEXT: 'A'
          }
        }
      }
    }
    const machine: StateMachineInterface<TestContext, TestEvent, TestState> = createMachine(config)
    expect(machine.initialState).toMatchObject({ value: 'A', matches: expect.any(Function) })
    expect(machine.transition(machine.initialState, 'NEXT')).toMatchObject({ value: 'B' })
  })

  it('should create a state machine given no initial state', () => {
    const config: StateMachineConfig<TestContext, TestEvent, TestState> = {
      states: {
        A: {
          on: {
            NEXT: 'B'
          }
        },
        B: {
          on: {
            NEXT: 'A'
          }
        }
      }
    }
    const machine: StateMachineInterface<TestContext, TestEvent, TestState> = createMachine(config)
    expect(machine.initialState).toMatchObject({ value: 'A' })
    expect(machine.transition(machine.initialState, 'NEXT')).toMatchObject({ value: 'B' })
    expect(machine.transition(machine.initialState, 'NEXT')).toMatchObject({ value: 'B' })
  })

  it('should create a state machine given no initial state and no states', () => {
    const config: StateMachineConfig<TestContext, TestEvent, TestState> = {
      states: {}
    }
    const machine: StateMachineInterface<TestContext, TestEvent, TestState> = createMachine(config)
    expect(machine.initialState.value).toBeUndefined()
    expect(machine.transition(machine.initialState, 'NEXT')).toBeUndefined()
  })

  it('should create a state machine given empty states', () => {
    const config: StateMachineConfig<TestContext, TestEvent, TestState> = {
      states: {
        A: {},
        B: {}
      }
    }
    const machine: StateMachineInterface<TestContext, TestEvent, TestState> = createMachine(config)
    expect(machine.initialState).toMatchObject({ value: 'A' })
    expect(machine.transition(machine.initialState, 'NEXT')).toBeUndefined()
  })

  it('should create a state machine given string transitions', () => {
    const config: StateMachineConfig<TestContext, TestEvent, TestState> = {
      states: {
        A: {
          on: {
            NEXT: 'B'
          }
        },
        B: {}
      }
    }
    const machine: StateMachineInterface<TestContext, TestEvent, TestState> = createMachine(config)
    expect(machine.initialState).toMatchObject({ value: 'A' })
    expect(machine.transition(machine.initialState, 'NEXT')).toMatchObject({ value: 'B' })
  })

  it('should create a state machine given object transitions', () => {
    const config: StateMachineConfig<TestContext, TestEvent, TestState> = {
      states: {
        A: {
          on: {
            NEXT: {
              target: 'B'
            }
          }
        },
        B: {}
      }
    }
    const machine: StateMachineInterface<TestContext, TestEvent, TestState> = createMachine(config)
    expect(machine.initialState).toMatchObject({ value: 'A' })
    expect(machine.transition(machine.initialState, 'NEXT')).toMatchObject({ value: 'B' })
  })

  it('should not transition when the event is not defined', () => {
    const config: StateMachineConfig<TestContext, TestEvent, TestState> = {
      states: {
        A: {
          on: {}
        },
        B: {}
      }
    }
    const machine: StateMachineInterface<TestContext, TestEvent, TestState> = createMachine(config)
    expect(machine.initialState).toMatchObject({ value: 'A' })
    expect(machine.transition(machine.initialState, 'NEXT')).toBeUndefined()
  })

  it('should not transition given a null state', () => {
    const config: StateMachineConfig<TestContext, TestEvent, TestState> = {
      states: {}
    }
    const machine: StateMachineInterface<TestContext, TestEvent, TestState> = createMachine(config)
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    expect(machine.transition(null!, 'NEXT')).toBeUndefined()
  })

  it('should not transition given an invalid state', () => {
    const config: StateMachineConfig<TestContext, TestEvent, TestState> = {
      states: {
        A: {
          on: {
            NEXT: 'B'
          }
        }
      }
    }
    const machine: StateMachineInterface<TestContext, TestEvent, TestState> = createMachine(config)
    expect(machine.transition('D', 'NEXT')).toBeUndefined()
  })

  it('should not transition when the target state is not defined', () => {
    const config: StateMachineConfig<TestContext, TestEvent, TestState> = {
      states: {
        A: {
          on: {
            NEXT: 'B'
          }
        }
      }
    }
    const machine: StateMachineInterface<TestContext, TestEvent, TestState> = createMachine(config)
    expect(machine.initialState).toMatchObject({ value: 'A' })
    expect(machine.transition('A', 'NEXT')).toBeUndefined()
  })

  it('should not transition given an empty target', () => {
    const config: StateMachineConfig<TestContext, TestEvent, TestState> = {
      states: {
        A: {
          on: {
            NEXT: {
              target: undefined
            }
          }
        },
        B: {}
      }
    }
    const machine: StateMachineInterface<TestContext, TestEvent, TestState> = createMachine(config)
    expect(machine.initialState).toMatchObject({ value: 'A' })
    expect(machine.transition(machine.initialState, 'NEXT')).toBeUndefined()
  })

  it('should transition given an event string', () => {
    const config: StateMachineConfig<TestContext, TestEvent, TestState> = {
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
    const machine: StateMachineInterface<TestContext, TestEvent, TestState> = createMachine(config)
    expect(machine.initialState).toMatchObject({ value: 'A' })
    expect(machine.transition('A', 'NEXT')).toMatchObject({ value: 'B' })
    expect(machine.transition('B', 'NEXT')).toMatchObject({ value: 'C' })
    expect(machine.transition('C', 'NEXT')).toMatchObject({ value: 'D' })
    expect(machine.transition('D', 'NEXT')).toMatchObject({ value: 'A' })
  })

  it('should transition given an event object', () => {
    const config: StateMachineConfig<TestContext, TestEvent, TestState> = {
      states: {
        A: {
          on: {
            NEXT: {
              target: 'B'
            }
          }
        },
        B: {}
      }
    }
    const machine: StateMachineInterface<TestContext, TestEvent, TestState> = createMachine(config)
    expect(machine.initialState).toMatchObject({ value: 'A' })
    expect(machine.transition(machine.initialState, { type: 'NEXT' })).toMatchObject({ value: 'B' })
  })

  it('should return entry actions as strings', () => {
    const config: StateMachineConfig<TestContext, TestEvent, TestState> = {
      states: {
        A: {
          entry: 'A-entry',
          on: {
            NEXT: {
              target: 'B'
            }
          }
        },
        B: {
          entry: 'B-entry'
        }
      }
    }
    const machine: StateMachineInterface<TestContext, TestEvent, TestState> = createMachine(config)
    expect(machine.entryActions('A')).toEqual('A-entry')
    expect(machine.entryActions('B')).toEqual('B-entry')
  })

  it('should return entry actions as functions', () => {
    const config: StateMachineConfig<TestContext, TestEvent, TestState> = {
      states: {
        A: {
          entry: () => {},
          on: {
            NEXT: {
              target: 'B'
            }
          }
        },
        B: {
          entry: () => {}
        }
      }
    }
    const machine: StateMachineInterface<TestContext, TestEvent, TestState> = createMachine(config)
    expect(machine.entryActions('A')).toEqual(config.states.A.entry)
    expect(machine.entryActions('B')).toEqual(config.states.B.entry)
  })

  it('should return empty entry actions', () => {
    const config: StateMachineConfig<TestContext, TestEvent, TestState> = {
      states: {
        A: {
          on: {
            NEXT: {
              target: 'B'
            }
          }
        },
        B: {}
      }
    }
    const machine: StateMachineInterface<TestContext, TestEvent, TestState> = createMachine(config)
    expect(machine.entryActions('A')).toEqual([])
    expect(machine.entryActions('B')).toEqual([])
  })

  it('should return entry actions as array of strings and functions', () => {
    const config: StateMachineConfig<TestContext, TestEvent, TestState> = {
      states: {
        A: {
          entry: [
            'A-entry-1',
            () => {}
          ],
          on: {
            NEXT: {
              target: 'B'
            }
          }
        },
        B: {
          entry: ['B-entry-1', 'B-entry-2']
        }
      }
    }
    const machine: StateMachineInterface<TestContext, TestEvent, TestState> = createMachine(config)
    expect(machine.entryActions('A')).toEqual(config.states.A.entry)
    expect(machine.entryActions('B')).toEqual(config.states.B.entry)
  })

  it('should return exit actions as strings', () => {
    const config: StateMachineConfig<TestContext, TestEvent, TestState> = {
      states: {
        A: {
          exit: 'A-exit',
          on: {
            NEXT: {
              target: 'B'
            }
          }
        },
        B: {
          exit: 'B-exit'
        }
      }
    }
    const machine: StateMachineInterface<TestContext, TestEvent, TestState> = createMachine(config)
    expect(machine.exitActions('A')).toEqual('A-exit')
    expect(machine.exitActions('B')).toEqual('B-exit')
  })

  it('should return exit actions as functions', () => {
    const config: StateMachineConfig<TestContext, TestEvent, TestState> = {
      states: {
        A: {
          exit: () => {},
          on: {
            NEXT: {
              target: 'B'
            }
          }
        },
        B: {
          exit: () => {}
        }
      }
    }
    const machine: StateMachineInterface<TestContext, TestEvent, TestState> = createMachine(config)
    expect(machine.exitActions('A')).toEqual(config.states.A.exit)
    expect(machine.exitActions('B')).toEqual(config.states.B.exit)
  })

  it('should return empty exit actions', () => {
    const config: StateMachineConfig<TestContext, TestEvent, TestState> = {
      states: {
        A: {
          on: {
            NEXT: {
              target: 'B'
            }
          }
        },
        B: {}
      }
    }
    const machine: StateMachineInterface<TestContext, TestEvent, TestState> = createMachine(config)
    expect(machine.exitActions('A')).toEqual([])
    expect(machine.exitActions('B')).toEqual([])
  })

  it('should return exit actions as array of strings and functions', () => {
    const config: StateMachineConfig<TestContext, TestEvent, TestState> = {
      states: {
        A: {
          exit: [
            'A-exit-1',
            () => {}
          ],
          on: {
            NEXT: {
              target: 'B'
            }
          }
        },
        B: {
          exit: ['B-exit-1', 'B-exit-2']
        }
      }
    }
    const machine: StateMachineInterface<TestContext, TestEvent, TestState> = createMachine(config)
    expect(machine.exitActions('A')).toEqual(config.states.A.exit)
    expect(machine.exitActions('B')).toEqual(config.states.B.exit)
  })

  it('should return actions as strings', () => {
    const config: StateMachineConfig<TestContext, TestEvent, TestState> = {
      states: {
        A: {
          on: {
            NEXT: {
              target: 'B',
              actions: 'A-NEXT'
            }
          }
        },
        B: {}
      }
    }
    const machine: StateMachineInterface<TestContext, TestEvent, TestState> = createMachine(config)
    expect(machine.transition('A', 'NEXT')).toMatchObject({ value: 'B', actions: 'A-NEXT' })
  })

  it('should return actions as strings given an empty target', () => {
    const config: StateMachineConfig<TestContext, TestEvent, TestState> = {
      states: {
        A: {
          on: {
            NEXT: {
              actions: 'A-NEXT'
            }
          }
        }
      }
    }
    const machine: StateMachineInterface<TestContext, TestEvent, TestState> = createMachine(config)
    expect(machine.transition('A', 'NEXT')).toMatchObject({ value: 'A', actions: 'A-NEXT' })
  })

  it('should return actions as functions', () => {
    const actions = (): void => {}
    const config: StateMachineConfig<TestContext, TestEvent, TestState> = {
      states: {
        A: {
          on: {
            NEXT: {
              target: 'B',
              actions
            }
          }
        },
        B: {
        }
      }
    }
    const machine: StateMachineInterface<TestContext, TestEvent, TestState> = createMachine(config)
    expect(machine.transition('A', 'NEXT')).toMatchObject({ value: 'B', actions })
  })

  it('should return actions as array of strings and functions', () => {
    const actions = [
      'A-NEXT-1',
      (): void => {}
    ]
    const config: StateMachineConfig<TestContext, TestEvent, TestState> = {
      states: {
        A: {
          on: {
            NEXT: {
              target: 'B',
              actions
            }
          }
        },
        B: {
        }
      }
    }
    const machine: StateMachineInterface<TestContext, TestEvent, TestState> = createMachine(config)
    expect(machine.transition('A', 'NEXT')).toMatchObject({ value: 'B', actions })
  })

  it('should not transition given a condition that returns false', () => {
    const config: StateMachineConfig<TestContext, TestEvent, TestState> = {
      states: {
        A: {
          on: {
            NEXT: {
              target: 'B',
              cond: () => false
            }
          }
        },
        B: {}
      }
    }
    const machine: StateMachineInterface<TestContext, TestEvent, TestState> = createMachine(config)
    expect(machine.transition('A', 'NEXT')).toBeUndefined()
  })

  it('should transition given a condition that returns true', () => {
    const config: StateMachineConfig<TestContext, TestEvent, TestState> = {
      states: {
        A: {
          on: {
            NEXT: {
              target: 'B',
              cond: () => true
            }
          }
        },
        B: {}
      }
    }
    const machine: StateMachineInterface<TestContext, TestEvent, TestState> = createMachine(config)
    expect(machine.transition('A', 'NEXT')).toMatchObject({ value: 'B' })
  })

  it('should self transition given a condition that returns true', () => {
    const actions = (): void => {}
    const config: StateMachineConfig<TestContext, TestEvent, TestState> = {
      states: {
        A: {
          on: {
            NEXT: {
              actions,
              cond: () => true
            }
          }
        },
        B: {}
      }
    }
    const machine: StateMachineInterface<TestContext, TestEvent, TestState> = createMachine(config)
    expect(machine.transition('A', 'NEXT')).toMatchObject({ value: 'A', actions })
  })

  it('should return state context', () => {
    const config: StateMachineConfig<TestContext, TestEvent, TestState> = {
      initial: 'A',
      context: {
        test: 'test'
      },
      states: {
        A: {
          on: {
            NEXT: 'B'
          }
        },
        B: {
          on: {
            NEXT: 'A'
          }
        }
      }
    }
    const machine: StateMachineInterface<TestContext, TestEvent, TestState> = createMachine(config)
    expect(machine.initialState).toMatchObject({ value: 'A', context: { test: 'test' } })
    expect(machine.transition(machine.initialState, 'NEXT')).toMatchObject({ value: 'B', context: { test: 'test' } })
  })

  it('should return state changed', () => {
    const config: StateMachineConfig<TestContext, TestEvent, TestState> = {
      initial: 'A',
      context: {
        test: 'test'
      },
      states: {
        A: {
          on: {
            NEXT: 'B'
          }
        },
        B: {
          on: {
            NEXT: 'A'
          }
        }
      }
    }
    const machine: StateMachineInterface<TestContext, TestEvent, TestState> = createMachine(config)
    expect(machine.initialState).toMatchObject({ value: 'A', changed: false })
    expect(machine.transition(machine.initialState, 'NEXT')).toMatchObject({ value: 'B', changed: true })
  })

  it('should return state matches', () => {
    const config: StateMachineConfig<TestContext, TestEvent, TestState> = {
      initial: 'A',
      context: {
        test: 'test'
      },
      states: {
        A: {
          on: {
            NEXT: 'B'
          }
        },
        B: {
          on: {
            NEXT: 'A'
          }
        }
      }
    }
    const machine: StateMachineInterface<TestContext, TestEvent, TestState> = createMachine(config)
    const state = machine.transition(machine.initialState, 'NEXT')
    expect(state).toMatchObject({ value: 'B', matches: expect.any(Function) })
    expect(state?.matches('B')).toBe(true)
    expect(state?.matches('A')).toBe(false)
    expect(state?.matches(/B/)).toBe(true)
    expect(state?.matches(/A/)).toBe(false)
  })
})
