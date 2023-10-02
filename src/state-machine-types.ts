export interface Typestate {
  value: string
}

export interface EventObject {
  type: string
}

export interface State<TContext extends object, TEvent extends EventObject, TState extends Typestate> {
  actions?: Actions<TContext, TEvent>
  context?: TContext
  value: TState['value']
}

export interface TransitionObject<TContext extends object, TEvent extends EventObject, TState extends Typestate> {
  target?: TState['value']
  actions?: Actions<TContext, TEvent>
  cond?: (state: State<TContext, TEvent, TState>, event: TEvent) => boolean
}

export type Transition<TContext extends object, TEvent extends EventObject, TState extends Typestate> = TState['value'] | TransitionObject<TContext, TEvent, TState>

export interface AssignmentObject<TContext extends object> {
  type: 'assignment'
  assignment: (context: TContext) => TContext
}

export type ActionFunction<TContext extends object, TEvent extends EventObject> = (context?: TContext, event?: TEvent['type'] | TEvent) => void

export type AssignActionFunction<TContext extends object, TEvent extends EventObject> = (context?: TContext, event?: TEvent['type'] | TEvent) => AssignmentObject<TContext>

export type Action<TContext extends object, TEvent extends EventObject> = string | ActionFunction<TContext, TEvent> | AssignActionFunction<TContext, TEvent>

export type Actions<TContext extends object, TEvent extends EventObject> = Action<TContext, TEvent> | Array<Action<TContext, TEvent>>

export interface StateMachineConfig<TContext extends object, TEvent extends EventObject, TState extends Typestate> {
  initial?: TState['value']
  context?: TContext
  states: {
    [key in TState['value']]: {
      on?: {
        [key in TEvent['type']]?: Transition<TContext, TEvent, TState>
      }
      entry?: Actions<TContext, TEvent>
      exit?: Actions<TContext, TEvent>
    }
  }
}

export interface StateMachineInterface<TContext extends object, TEvent extends EventObject, TState extends Typestate> {
  initialState: State<TContext, TEvent, TState>
  transition: (state: TState['value'] | State<TContext, TEvent, TState>, event: TEvent['type'] | TEvent) => State<TContext, TEvent, TState> | undefined
  exitActions: (state: TState['value'] | State<TContext, TEvent, TState>) => Actions<TContext, TEvent>
  entryActions: (state: TState['value'] | State<TContext, TEvent, TState>) => Actions<TContext, TEvent>
}
