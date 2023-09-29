import {
  type Actions,
  type EventObject,
  type State,
  type StateMachineConfig,
  type StateMachineInterface,
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

  transition (state: TState['value'] | State<TEvent, TState>, event: TEvent['type'] | TEvent): State<TEvent, TState> | undefined {
    if (state == null) {
      return undefined
    }
    const eventObject = this.toEventObject(event)
    const stateObject = this.toStateObject(state)
    const stateConfig = this.config.states[stateObject.value]
    if (stateConfig == null) {
      return undefined
    }
    if (stateConfig.on == null) {
      return undefined
    }
    const transition = stateConfig.on[eventObject.type as TEvent['type']]
    if (transition == null) {
      return undefined
    }
    const { target, actions } = typeof transition === 'string'
      ? { target: transition, actions: undefined }
      : transition
    if (target == null) {
      return undefined
    }
    const targetState = this.config.states[target]
    if (targetState == null) {
      return undefined
    }
    return this.toStateObject(actions != null ? { value: target, actions } : target)
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
