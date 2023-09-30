import {
  type Actions,
  type EventObject,
  type State,
  type StateMachineConfig,
  type StateMachineInterface,
  type TransitionObject,
  type Typestate
} from './state-machine-types'

class StateMachine<TEvent extends EventObject, TState extends Typestate> implements StateMachineInterface<TEvent, TState> {
  constructor (private readonly config: StateMachineConfig<TEvent, TState>) {
  }

  get initialState (): State<TEvent, TState> {
    return this.toStateObject(this.config.initial ?? Object.keys(this.config.states)[0])
  }

  private toEventObject<TEvent extends EventObject> (event: TEvent['type'] | TEvent): TEvent {
    return (typeof event === 'string' ? { type: event } : event) as TEvent
  }

  private toStateObject<TState extends Typestate> (state: TState['value'] | State<TEvent, TState>): State<TEvent, TState> {
    return (typeof state === 'string' ? { value: state } : state)
  }

  private stateExists (state: TState['value'] | State<TEvent, TState>): boolean {
    const stateObject = this.toStateObject(state)
    return this.config.states[stateObject.value] != null
  }

  transition (state: TState['value'] | State<TEvent, TState>, event: TEvent['type'] | TEvent): State<TEvent, TState> | undefined {
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
    const nextTransition: TransitionObject<TEvent, TState> = {
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
    const nextStateObject = this.toStateObject({ value: nextTransition.target, actions: nextTransition.actions })

    // don't transition if the condition is not met
    if (nextTransition.cond != null && !nextTransition.cond(stateObject, eventObject)) {
      return undefined
    }
    return nextStateObject
  }

  exitActions (state: TState['value'] | State<TEvent, TState>): Actions<TEvent> {
    const stateObject = this.toStateObject(state)
    return this.config.states[stateObject.value].exit ?? []
  }

  entryActions (state: TState['value'] | State<TEvent, TState>): Actions<TEvent> {
    const stateObject = this.toStateObject(state)
    return this.config.states[stateObject.value].entry ?? []
  }
}

export function createStateMachine<
  TEvent extends EventObject,
  TState extends Typestate
> (config: StateMachineConfig<TEvent, TState>): StateMachineInterface<TEvent, TState> {
  return new StateMachine(config)
}
