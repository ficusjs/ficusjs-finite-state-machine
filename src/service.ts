import {
  type ActionFunction, type AssignActionFunction,
  type AssignmentObject,
  type EventObject,
  type State,
  type StateMachineInterface,
  type TypeState
} from './state-machine-types'
import { type ServiceOptions, ServiceStatus, type StateMachineServiceInterface } from './service-types'
import { toArray } from './util/to-array'

export const ASSIGN_ACTION_TYPE = 'assignment'

class StateMachineService<TContext extends object, TEvent extends EventObject, TState extends TypeState> implements StateMachineServiceInterface<TContext, TEvent, TState> {
  private status: ServiceStatus
  private currentState: State<TContext, TEvent, TState>
  private readonly listeners: any[] = []

  constructor (private readonly machine: StateMachineInterface<TContext, TEvent, TState>, private readonly options?: ServiceOptions<TContext, TEvent>) {
    this.status = ServiceStatus.Stopped
    this.currentState = this.machine.initialState
  }

  get state (): State<TContext, TEvent, TState> {
    return this.currentState
  }

  send (event: TEvent['type'] | TEvent): void {
    if (this.status !== ServiceStatus.Running) {
      return
    }
    const nextState = this.machine.transition(this.currentState, event)
    if (nextState != null) {
      if (nextState.value !== this.currentState.value) {
        this.executeActions(this.machine.exitActions(this.currentState), event, nextState.context)
        this.currentState = nextState
        this.executeActions(this.machine.entryActions(nextState), event, nextState.context)
        this.executeActions(nextState.actions, event, nextState.context)
        this.notifyListeners()
      } else {
        this.currentState = nextState
        this.executeActions(nextState.actions, event, nextState.context)
        if (nextState.changed === true) {
          this.notifyListeners()
        }
      }
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

  private executeActions<TAction> (actions: TAction, event?: TEvent['type'] | TEvent, context?: TContext): void {
    toArray(actions).forEach((action) => {
      let actionFunc: ActionFunction<TContext, TEvent> | AssignActionFunction<TContext, TEvent>
      if (typeof action === 'string') {
        actionFunc = this.options?.actions?.[action as string] as ActionFunction<TContext, TEvent>
      } else {
        actionFunc = action as ActionFunction<TContext, TEvent> | AssignActionFunction<TContext, TEvent>
      }
      if (actionFunc != null) {
        const actionResult = actionFunc(context, event)
        if (actionResult != null && typeof actionResult === 'object' && actionResult.type === ASSIGN_ACTION_TYPE && context != null) {
          this.currentState.context = actionResult.assignment(context)
          this.currentState.changed = true
        }
      }
    })
  }
}

export function interpret<
  TContext extends object,
  TEvent extends EventObject,
  TState extends TypeState
> (machine: StateMachineInterface<TContext, TEvent, TState>, options?: ServiceOptions<TContext, TEvent>): StateMachineServiceInterface<TContext, TEvent, TState> {
  return new StateMachineService(machine, options)
}

export function assign<
  TContext extends object,
> (assigner: Partial<TContext>): AssignmentObject<TContext> {
  return {
    type: ASSIGN_ACTION_TYPE,
    assignment: (context: TContext) => Object.assign({}, context, assigner)
  }
}
