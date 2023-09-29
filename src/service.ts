import { type EventObject, type State, type StateMachineInterface, type Typestate } from './state-machine-types'
import { type ServiceOptions, ServiceStatus, type StateMachineServiceInterface } from './service-types'
import { toArray } from './util/to-array'

class StateMachineService<TEvent extends EventObject, TState extends Typestate> implements StateMachineServiceInterface<TEvent, TState> {
  private status: ServiceStatus
  private currentState: State<TEvent, TState>
  private readonly listeners: any[] = []

  constructor (private readonly machine: StateMachineInterface<TEvent, TState>, private readonly options?: ServiceOptions<TEvent>) {
    this.status = ServiceStatus.Stopped
    this.currentState = this.machine.initialState
  }

  get state (): State<TEvent, TState> {
    return this.currentState
  }

  send (event: TEvent['type'] | TEvent): void {
    if (this.status !== ServiceStatus.Running) {
      return
    }
    const nextState = this.machine.transition(this.currentState, event)
    if (nextState != null && nextState !== this.currentState) {
      this.executeActions(this.machine.exitActions(this.currentState))
      this.currentState = nextState
      this.executeActions(this.machine.entryActions(nextState))
      this.notifyListeners()
    }
  }

  subscribe (listener: any): { unsubscribe: () => void } {
    this.listeners.push(listener)
    return {
      unsubscribe: () => this.listeners.splice(this.listeners.indexOf(listener), 1)
    }
  }

  start (): void {
    this.status = ServiceStatus.Running
    this.executeActions(this.machine.entryActions(this.currentState))
  }

  stop (): void {
    this.status = ServiceStatus.Stopped
  }

  private notifyListeners (): void {
    this.listeners.forEach((listener) => listener(this.state))
  }

  private executeActions<TAction> (actions: TAction): void {
    toArray(actions).forEach((action) => {
      if (typeof action === 'function') {
        action()
      } else {
        const actionFn = this.options?.actions?.[action as string]
        if (actionFn != null) {
          actionFn()
        }
      }
    })
  }
}

export function createStateMachineService<
  TEvent extends EventObject,
  TState extends Typestate
> (machine: StateMachineInterface<TEvent, TState>, options?: ServiceOptions<TEvent>): StateMachineServiceInterface<TEvent, TState> {
  return new StateMachineService(machine, options)
}
