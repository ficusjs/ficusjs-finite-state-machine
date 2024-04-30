export interface TypeState {
  value: string
}

export interface EventObject {
  type: string
}

export interface State<TContext extends object, TEvent extends EventObject, TState extends TypeState> {
  actions?: Actions<TContext, TEvent>
  context?: TContext
  value: TState['value']
  changed?: boolean
  matches: (value: TState['value'] | RegExp) => boolean
}

export interface TransitionObject<TContext extends object, TEvent extends EventObject, TState extends TypeState> {
  target?: TState['value']
  actions?: Actions<TContext, TEvent>
  cond?: (state: State<TContext, TEvent, TState>, event: TEvent) => boolean
}

export type Transition<TContext extends object, TEvent extends EventObject, TState extends TypeState> = TState['value'] | TransitionObject<TContext, TEvent, TState>

export interface AssignmentObject<TContext extends object> {
  type: 'assignment'
  assignment: (context: TContext) => TContext
}

export interface SendObject<TEvent extends EventObject> {
  type: 'send'
  event: TEvent
  delay: number
}

export type ActionFunction<TContext extends object, TEvent extends EventObject> = (context?: TContext, event?: TEvent['type'] | TEvent) => void

export type AssignActionFunction<TContext extends object, TEvent extends EventObject> = (context?: TContext, event?: TEvent['type'] | TEvent) => AssignmentObject<TContext>

export type SendActionFunction<TContext extends object, TEvent extends EventObject> = (context?: TContext, event?: TEvent['type'] | TEvent) => SendObject<TEvent>

export type Action<TContext extends object, TEvent extends EventObject> = string | ActionFunction<TContext, TEvent> | AssignActionFunction<TContext, TEvent> | SendActionFunction<TContext, TEvent>

export type Actions<TContext extends object, TEvent extends EventObject> = Action<TContext, TEvent> | Array<Action<TContext, TEvent>>

export interface AfterTransitionObject<TContext extends object, TEvent extends EventObject, TState extends TypeState> {
  target: TState['value']
  actions?: Actions<TContext, TEvent>
}

export interface AfterConfig<TContext extends object, TEvent extends EventObject, TState extends TypeState> {
  [delay: number]: AfterTransitionObject<TContext, TEvent, TState>
}

export interface AlwaysTransitionObject<TContext extends object, TEvent extends EventObject, TState extends TypeState> {
  target: TState['value']
  actions?: Actions<TContext, TEvent>
  cond?: (state: State<TContext, TEvent, TState>) => boolean
}

export type AlwaysConfig<TContext extends object, TEvent extends EventObject, TState extends TypeState> = AlwaysTransitionObject<TContext, TEvent, TState> | Array<AlwaysTransitionObject<TContext, TEvent, TState>>

export interface StateMachineConfig<TContext extends object, TEvent extends EventObject, TState extends TypeState> {
  initial?: TState['value']
  context?: TContext
  states: {
    [key in TState['value']]: {
      on?: {
        [key in TEvent['type']]?: Transition<TContext, TEvent, TState>
      }
      entry?: Actions<TContext, TEvent>
      exit?: Actions<TContext, TEvent>
      after?: AfterConfig<TContext, TEvent, TState>
      always?: AlwaysConfig<TContext, TEvent, TState>
    }
  }
}

export interface StateMachineInterface<TContext extends object, TEvent extends EventObject, TState extends TypeState> {
  initialState: State<TContext, TEvent, TState>
  transition: (state: TState['value'] | State<TContext, TEvent, TState>, event: TEvent['type'] | TEvent) => State<TContext, TEvent, TState> | undefined
  exitActions: (state: TState['value'] | State<TContext, TEvent, TState>) => Actions<TContext, TEvent>
  entryActions: (state: TState['value'] | State<TContext, TEvent, TState>) => Actions<TContext, TEvent>
  afterConfig: (state: TState['value'] | State<TContext, TEvent, TState>) => AfterConfig<TContext, TEvent, TState> | undefined
  alwaysConfig: (state: TState['value'] | State<TContext, TEvent, TState>) => AlwaysConfig<TContext, TEvent, TState> | undefined
}
