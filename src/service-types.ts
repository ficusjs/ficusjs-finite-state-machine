import {
  type ActionFunction,
  type AssignActionFunction,
  type EventObject,
  type State,
  type Typestate
} from './state-machine-types'

export enum ServiceStatus {
  Running = 'running',
  Stopped = 'stopped'
}

export interface ServiceOptions<TContext extends object, TEvent extends EventObject> {
  actions?: Record<string, ActionFunction<TContext, TEvent> | AssignActionFunction<TContext, TEvent>>
}

export interface StateMachineServiceInterface<TContext extends object, TEvent extends EventObject, TState extends Typestate> {
  state: State<TContext, TEvent, TState>
  send: (event: TEvent['type'] | TEvent) => void
  subscribe: (listener: any) => { unsubscribe: () => void }
  start: () => void
  stop: () => void
}
