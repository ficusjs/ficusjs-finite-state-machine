export interface Typestate {
  value: string
}

export interface EventObject {
  type: string
}

export interface State<TEvent extends EventObject, TState extends Typestate> {
  value: TState['value']
  actions?: Actions<TEvent>
}

export type Transition<TEvent extends EventObject, TState extends Typestate> = TState['value'] | {
  target?: TState['value']
  actions?: Actions<TEvent>
  cond?: (state: State<TEvent, TState>, event: TEvent) => boolean
}

export type ActionFunction<TEvent extends EventObject> = (event?: TEvent['type'] | TEvent) => void

export type Action<TEvent extends EventObject> = string | ActionFunction<TEvent>

export type Actions<TEvent extends EventObject> = Action<TEvent> | Array<Action<TEvent>>

export interface StateMachineConfig<TEvent extends EventObject, TState extends Typestate> {
  id?: string
  initial?: TState['value']
  states: {
    [key in TState['value']]: {
      on?: {
        [key in TEvent['type']]?: Transition<TEvent, TState>
      }
      entry?: Actions<TEvent>
      exit?: Actions<TEvent>
    }
  }
}

export interface StateMachineInterface<TEvent extends EventObject, TState extends Typestate> {
  initialState: State<TEvent, TState>
  transition: (state: TState['value'] | State<TEvent, TState>, event: TEvent['type'] | TEvent) => State<TEvent, TState> | undefined
  exitActions: (state: TState['value'] | State<TEvent, TState>) => Actions<TEvent>
  entryActions: (state: TState['value'] | State<TEvent, TState>) => Actions<TEvent>
}
