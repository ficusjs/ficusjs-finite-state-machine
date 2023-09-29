import { beforeEach, describe, it } from '@jest/globals'
import { createStateMachineService } from './service'
import { createStateMachine } from './state-machine'
import { type StateMachineConfig } from './state-machine-types'
import { type StateMachineServiceInterface } from './service-types'

interface TestState {
  value: string
}

interface TestEvent {
  type: 'NEXT'
}

describe('state-machine', () => {
  let config: StateMachineConfig<TestEvent, TestState>
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
    const machine = createStateMachine(config)
    const service: StateMachineServiceInterface<TestEvent, TestState> = createStateMachineService(machine)
    service.start()
    expect(service.state).toEqual({ value: 'A' })
    service.send('NEXT')
    expect(service.state).toEqual({ value: 'B' })
    service.send('NEXT')
    expect(service.state).toEqual({ value: 'C' })
    service.send('NEXT')
    expect(service.state).toEqual({ value: 'D' })
    service.send('NEXT')
    expect(service.state).toEqual({ value: 'A' })
  })

  it('should notify on state change', () => {
    const machine = createStateMachine(config)
    const service: StateMachineServiceInterface<TestEvent, TestState> = createStateMachineService(machine)
    const listener = jest.fn()
    service.subscribe(listener)
    service.start()
    expect(service.state).toEqual({ value: 'A' })
    service.send('NEXT')
    expect(service.state).toEqual({ value: 'B' })
    expect(listener).toHaveBeenCalledTimes(1)
  })

  it('should unsubscribe from state change', () => {
    const machine = createStateMachine(config)
    const service: StateMachineServiceInterface<TestEvent, TestState> = createStateMachineService(machine)
    const listener = jest.fn()
    const subscription = service.subscribe(listener)
    service.start()
    expect(service.state).toEqual({ value: 'A' })
    service.send('NEXT')
    expect(service.state).toEqual({ value: 'B' })
    expect(listener).toHaveBeenCalledTimes(1)
    subscription.unsubscribe()
    service.send('NEXT')
    expect(service.state).toEqual({ value: 'C' })
    expect(listener).toHaveBeenCalledTimes(1)
  })

  it('should stop notifying when the state machine has stopped', () => {
    const machine = createStateMachine(config)
    const service: StateMachineServiceInterface<TestEvent, TestState> = createStateMachineService(machine)
    const listener = jest.fn()
    service.subscribe(listener)
    service.start()
    expect(service.state).toEqual({ value: 'A' })
    service.send('NEXT')
    expect(service.state).toEqual({ value: 'B' })
    expect(listener).toHaveBeenCalledTimes(1)
    service.stop()
    service.send('NEXT')
    expect(service.state).toEqual({ value: 'B' })
    expect(listener).toHaveBeenCalledTimes(1)
  })

  it('should execute entry actions', () => {
    const machine = createStateMachine(config)
    const service: StateMachineServiceInterface<TestEvent, TestState> = createStateMachineService(machine)
    const entryAction = jest.fn()
    config.states.A.entry = entryAction
    service.start()
    expect(service.state).toEqual({ value: 'A' })
    expect(entryAction).toHaveBeenCalledTimes(1)
  })

  it('should execute entry actions defined as strings', () => {
    const machine = createStateMachine(config)
    const entryAction = jest.fn()
    const options = {
      actions: {
        entryAction
      }
    }
    const service: StateMachineServiceInterface<TestEvent, TestState> = createStateMachineService(machine, options)
    config.states.A.entry = 'entryAction'
    service.start()
    expect(service.state).toEqual({ value: 'A' })
    expect(entryAction).toHaveBeenCalledTimes(1)
  })

  it('should execute exit actions', () => {
    const machine = createStateMachine(config)
    const service: StateMachineServiceInterface<TestEvent, TestState> = createStateMachineService(machine)
    const exitAction = jest.fn()
    config.states.A.exit = exitAction
    service.start()
    expect(service.state).toEqual({ value: 'A' })
    service.send('NEXT')
    expect(service.state).toEqual({ value: 'B' })
    expect(exitAction).toHaveBeenCalledTimes(1)
  })

  it('should execute exit actions defined as strings', () => {
    const machine = createStateMachine(config)
    const exitAction = jest.fn()
    const options = {
      actions: {
        exitAction
      }
    }
    const service: StateMachineServiceInterface<TestEvent, TestState> = createStateMachineService(machine, options)
    config.states.A.exit = 'exitAction'
    service.start()
    expect(service.state).toEqual({ value: 'A' })
    service.send('NEXT')
    expect(service.state).toEqual({ value: 'B' })
    expect(exitAction).toHaveBeenCalledTimes(1)
  })

  it('should execute exit actions before state change', () => {
    const machine = createStateMachine(config)
    const service: StateMachineServiceInterface<TestEvent, TestState> = createStateMachineService(machine)
    let exitState = { value: 'none' }
    config.states.A.exit = (): void => {
      exitState = service.state
    }
    service.start()
    expect(service.state).toEqual({ value: 'A' })
    service.send('NEXT')
    expect(service.state).toEqual({ value: 'B' })
    expect(exitState.value).toEqual('A')
  })
})
