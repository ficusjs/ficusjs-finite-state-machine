import { type ActionFunction, type EventObject, type State, type Typestate } from './state-machine-types'

export enum ServiceStatus {
  Running = 'running',
  Stopped = 'stopped'
}

export interface ServiceOptions<TEvent extends EventObject> {
  actions?: Record<string, ActionFunction<TEvent>>
}

export interface StateMachineServiceInterface<TEvent extends EventObject, TState extends Typestate> {
  state: State<TEvent, TState>
  send: (event: TEvent['type'] | TEvent) => void
  subscribe: (listener: any) => { unsubscribe: () => void }
  start: () => void
  stop: () => void
}
