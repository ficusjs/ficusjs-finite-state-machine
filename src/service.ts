import {
  type ActionFunction, type AssignActionFunction,
  type AfterConfig,
  type AlwaysConfig,
  type AlwaysTransitionObject,
  type AssignmentObject,
  type EventObject, type SendActionFunction, type SendObject,
  type State,
  type StateMachineInterface,
  type TypeState
} from './state-machine-types'
import { type ServiceOptions, ServiceStatus, type StateMachineServiceInterface } from './service-types'
import { toArray } from './util/to-array'

export const ASSIGN_ACTION_TYPE = 'assignment'
export const SEND_ACTION_TYPE = 'send'

class StateMachineService<TContext extends object, TEvent extends EventObject, TState extends TypeState> implements StateMachineServiceInterface<TContext, TEvent, TState> {
  private status: ServiceStatus
  private currentState: State<TContext, TEvent, TState>
  private readonly listeners: any[] = []
  private readonly activeTimers: Map<number, ReturnType<typeof setTimeout>> = new Map()
  private currentTimer: any = null

  constructor (private readonly machine: StateMachineInterface<TContext, TEvent, TState>, private readonly options?: ServiceOptions<TContext, TEvent>) {
    this.status = ServiceStatus.Stopped
    this.currentState = this.machine.initialState
  }

  get state (): State<TContext, TEvent, TState> {
    return this.currentState
  }

  send (event: TEvent['type'] | TEvent, after?: number): void {
    if (this.status !== ServiceStatus.Running) {
      return
    }
    if (this.currentTimer != null) {
      clearTimeout(this.currentTimer)
      this.currentTimer = null
    }
    if (after != null) {
      this.currentTimer = setTimeout(() => {
        this.send(event)
      }, after)
      return
    }
    const nextState = this.machine.transition(this.currentState, event)
    if (nextState != null) {
      if (nextState.value !== this.currentState.value) {
        this.clearTimers()
        this.executeActions(this.machine.exitActions(this.currentState), event, nextState.context)
        this.currentState = nextState
        this.executeActions(this.machine.entryActions(nextState), event, nextState.context)
        this.executeActions(nextState.actions, event, nextState.context)
        this.notifyListeners()
        this.setupTimers()
        this.checkAlwaysTransitions()
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
    this.setupTimers()
    this.checkAlwaysTransitions()
  }

  stop (): void {
    this.status = ServiceStatus.Stopped
    this.clearTimers()
  }

  private notifyListeners (): void {
    this.listeners.forEach((listener) => listener(this.state))
  }

  private executeActions<TAction> (actions: TAction, event?: TEvent['type'] | TEvent, context?: TContext): void {
    toArray(actions).forEach((action) => {
      let actionFunc: ActionFunction<TContext, TEvent> | AssignActionFunction<TContext, TEvent> | SendActionFunction<TContext, TEvent>
      if (typeof action === 'string') {
        actionFunc = this.options?.actions?.[action as string] as ActionFunction<TContext, TEvent>
      } else {
        actionFunc = action as ActionFunction<TContext, TEvent> | AssignActionFunction<TContext, TEvent> | SendActionFunction<TContext, TEvent>
      }
      if (actionFunc != null) {
        const actionResult = actionFunc(context, event)
        if (actionResult != null && typeof actionResult === 'object' && actionResult.type === ASSIGN_ACTION_TYPE && context != null) {
          this.currentState.context = actionResult.assignment(context)
          this.currentState.changed = true
        } else if (actionResult != null && typeof actionResult === 'object' && actionResult.type === SEND_ACTION_TYPE) {
          this.currentTimer = setTimeout(() => {
            this.send(actionResult.event)
          }, actionResult.delay)
        }
      }
    })
  }

  private setupTimers (): void {
    const afterConfig = this.getAfterConfig(this.currentState)
    if (afterConfig != null) {
      Object.entries(afterConfig).forEach(([delay, transition]) => {
        const delayMs = Number(delay)
        if (!isNaN(delayMs)) {
          const timer = setTimeout(() => {
            this.activeTimers.delete(delayMs)
            // Create a synthetic timer event
            const timerEvent: TEvent = { type: `xstate.after(${delayMs})#${this.currentState.value}` } as any

            // Transition to the target state
            const nextState = this.machine.transition(this.currentState, timerEvent)
            if (nextState != null || transition.target !== this.currentState.value) {
              // Clear any other timers since we're transitioning
              this.clearTimers()

              // Execute exit actions of current state
              this.executeActions(this.machine.exitActions(this.currentState), timerEvent, this.currentState.context)

              // Update state to target
              this.currentState = {
                ...this.currentState,
                value: transition.target,
                changed: true
              }

              // Execute entry actions of new state
              this.executeActions(this.machine.entryActions(this.currentState), timerEvent, this.currentState.context)

              // Execute transition actions
              this.executeActions(transition.actions, timerEvent, this.currentState.context)

              // Notify listeners
              this.notifyListeners()

              // Setup new timers for the new state
              this.setupTimers()

              // Check for always transitions in the new state
              this.checkAlwaysTransitions()
            }
          }, delayMs)
          this.activeTimers.set(delayMs, timer)
        }
      })
    }
  }

  private clearTimers (): void {
    this.activeTimers.forEach((timer) => clearTimeout(timer))
    this.activeTimers.clear()
  }

  private getAfterConfig (state: State<TContext, TEvent, TState>): AfterConfig<TContext, TEvent, TState> | undefined {
    return this.machine.afterConfig(state)
  }

  private checkAlwaysTransitions (visitedStates: Set<TState['value']> = new Set()): void {
    // Prevent infinite loops by tracking visited states
    if (visitedStates.has(this.currentState.value)) {
      return
    }

    const alwaysConfig = this.machine.alwaysConfig(this.currentState)
    if (alwaysConfig == null) {
      return
    }

    const resolvedTransition = this.resolveAlwaysTransition(alwaysConfig)
    if (resolvedTransition != null) {
      // Add current state to visited set
      visitedStates.add(this.currentState.value)

      // Create a synthetic always event
      const alwaysEvent: TEvent = { type: `xstate.always#${this.currentState.value}` } as any

      // Clear timers since we're transitioning
      this.clearTimers()

      // Execute exit actions of current state
      this.executeActions(this.machine.exitActions(this.currentState), alwaysEvent, this.currentState.context)

      // Update state to target
      this.currentState = {
        ...this.currentState,
        value: resolvedTransition.target,
        changed: true
      }

      // Execute entry actions of new state
      this.executeActions(this.machine.entryActions(this.currentState), alwaysEvent, this.currentState.context)

      // Execute transition actions
      this.executeActions(resolvedTransition.actions, alwaysEvent, this.currentState.context)

      // Notify listeners
      this.notifyListeners()

      // Setup timers for the new state
      this.setupTimers()

      // Recursively check for always transitions in the new state
      this.checkAlwaysTransitions(visitedStates)
    }
  }

  private resolveAlwaysTransition (alwaysConfig: AlwaysConfig<TContext, TEvent, TState>): AlwaysTransitionObject<TContext, TEvent, TState> | undefined {
    const transitions = Array.isArray(alwaysConfig) ? alwaysConfig : [alwaysConfig]

    // Find the first transition whose guard passes (or has no guard)
    for (const transition of transitions) {
      if (transition.cond == null || transition.cond(this.currentState)) {
        return transition
      }
    }

    return undefined
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

export function send<
  TEvent extends EventObject,
> (event: TEvent, delay = 0): SendObject<TEvent> {
  return {
    type: SEND_ACTION_TYPE,
    event,
    delay
  }
}
