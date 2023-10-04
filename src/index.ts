import {
  type EventObject,
  type StateMachineConfig,
  type StateMachineInterface,
  type TypeState
} from './state-machine-types'
import { type ServiceOptions, type StateMachineServiceInterface } from './service-types'
import { assign, interpret } from './service'
import { createMachine } from './state-machine'

declare global {
  interface Window {
    __ficusjs__: any
  }
}

function createMachineService<
  TContext extends object,
  TEvent extends EventObject,
  TState extends TypeState
> (
  key: string,
  machine: StateMachineInterface<TContext, TEvent, TState>,
  options?: ServiceOptions<TContext, TEvent>): StateMachineServiceInterface<TContext, TEvent, TState> {
  let service = getMachineService<TContext, TEvent, TState>(key)
  if (service != null) {
    return service
  }
  service = interpret(machine, options)
  if (typeof window.__ficusjs__ !== 'object') {
    window.__ficusjs__ = {}
  }
  if (typeof window.__ficusjs__.stateMachine !== 'object') {
    window.__ficusjs__.stateMachine = {}
  }
  window.__ficusjs__.stateMachine[key] = service
  return service
}

function getMachineService<
  TContext extends object,
  TEvent extends EventObject,
  TState extends TypeState
> (key: string): StateMachineServiceInterface<TContext, TEvent, TState> | undefined {
  return window.__ficusjs__.stateMachine[key]
}

export {
  type EventObject,
  type StateMachineConfig,
  type StateMachineInterface,
  type StateMachineServiceInterface,
  type TypeState,
  assign,
  createMachine,
  createMachineService,
  getMachineService,
  interpret
}
