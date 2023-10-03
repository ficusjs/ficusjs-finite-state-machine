import {
  type Actions,
  type EventObject,
  type State,
  type StateMachineConfig,
  type StateMachineInterface,
  type TransitionObject,
  type TypeState
} from './state-machine-types'

class StateMachine<TContext extends object, TEvent extends EventObject, TState extends TypeState> implements StateMachineInterface<TContext, TEvent, TState> {
  constructor (private readonly config: StateMachineConfig<TContext, TEvent, TState>) {
  }

  get initialState (): State<TContext, TEvent, TState> {
    const initial = this.config.initial ?? Object.keys(this.config.states)[0]
    return this.toStateObject(
      this.config.context == null
        ? initial
        : { value: initial, context: this.config.context }
    )
  }

  private toEventObject<TEvent extends EventObject> (event: TEvent['type'] | TEvent): TEvent {
    return (typeof event === 'string' ? { type: event } : event) as TEvent
  }

  private toStateObject<TState extends TypeState> (state: TState['value'] | Partial<State<TContext, TEvent, TState>>): State<TContext, TEvent, TState> {
    const stateObject: State<TContext, TEvent, TState> = {
      value: (typeof state === 'string' ? state : state?.value) as TState['value'],
      changed: false,
      matches: function (value: TState['value'] | RegExp): boolean {
        if (value instanceof RegExp) {
          return value.test(this.value)
        }
        return this.value === value
      }
    }
    if (typeof state !== 'string' && state?.actions != null) {
      stateObject.actions = state.actions
    }
    if (typeof state !== 'string' && state?.context != null) {
      stateObject.context = state.context
    }
    if (typeof state !== 'string' && state?.changed != null) {
      stateObject.changed = state.changed
    }
    return stateObject
  }

  private stateExists (state: TState['value'] | State<TContext, TEvent, TState>): boolean {
    const stateObject = this.toStateObject(state)
    return this.config.states[stateObject.value] != null
  }

  transition (state: TState['value'] | State<TContext, TEvent, TState>, event: TEvent['type'] | TEvent): State<TContext, TEvent, TState> | undefined {
    // don't transition if the state is undefined
    if (state == null) {
      return undefined
    }
    const eventObject = this.toEventObject(event)
    const stateObject = this.toStateObject(state)
    const stateConfig = this.config.states[stateObject.value]

    // don't transition if the state is not defined in the config
    if (stateConfig == null) {
      return undefined
    }

    // don't transition if transitions are not defined in the config
    if (stateConfig.on == null) {
      return undefined
    }

    const transition = stateConfig.on[eventObject.type as TEvent['type']]

    // don't transition if the event is not defined in the config
    if (transition == null) {
      return undefined
    }

    // create the next transition object
    const nextTransition: TransitionObject<TContext, TEvent, TState> = {
      target: stateObject.value, // default to self-transition
      actions: undefined,
      cond: undefined
    }
    if (typeof transition === 'string') {
      nextTransition.target = this.stateExists(transition) ? transition : undefined
    }
    if (typeof transition === 'object') {
      nextTransition.target = transition.target != null && this.stateExists(transition.target) ? transition.target : stateObject.value
      if (transition.actions != null) {
        nextTransition.actions = transition.actions
      }
      if (transition.cond != null) {
        nextTransition.cond = transition.cond
      }
    }

    // don't transition if the target is not defined for the transition
    if (nextTransition.target == null) {
      return undefined
    }

    // don't transition if the target is the same as the current state and there are no actions
    if (nextTransition.target === stateObject.value && nextTransition.actions == null) {
      return undefined
    }

    // create the next state object
    const nextStateObject = this.toStateObject({
      value: nextTransition.target,
      actions: nextTransition.actions,
      context: stateObject.context,
      changed: nextTransition.target !== stateObject.value
    })

    // don't transition if the condition is not met
    if (nextTransition.cond != null && !nextTransition.cond(stateObject, eventObject)) {
      return undefined
    }
    return nextStateObject
  }

  exitActions (state: TState['value'] | State<TContext, TEvent, TState>): Actions<TContext, TEvent> {
    const stateObject = this.toStateObject(state)
    return this.config.states[stateObject.value].exit ?? []
  }

  entryActions (state: TState['value'] | State<TContext, TEvent, TState>): Actions<TContext, TEvent> {
    const stateObject = this.toStateObject(state)
    return this.config.states[stateObject.value].entry ?? []
  }
}

export function createMachine<
  TContext extends object,
  TEvent extends EventObject,
  TState extends TypeState
> (config: StateMachineConfig<TContext, TEvent, TState>): StateMachineInterface<TContext, TEvent, TState> {
  return new StateMachine(config)
}
