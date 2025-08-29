# Finite state machine

A lightweight finite state machine library.
It is inspired by the [@xstate/fsm](https://xstate.js.org/docs/packages/xstate-fsm/) library.

## What is a finite state machine?

A finite state machine is a finite set of states that can transition to each other deterministically due to events.

A state machine service is responsible for interpreting the state machine and turning it into a running instance.
The service takes care of:
- starting and stopping the state machine
- keeping track of state
- transitioning between states
- updating context data
- executing actions
- invoking callbacks
- notifying subscribers

## Features

- [x] State machine instance
- [x] State machine service (running state machine)
- [x] Subscription to state changes
- [x] Transitions
- [x] Self transitions
- [x] Trigger transitions with string
- [x] Trigger transitions with object
- [x] Transition actions
- [x] Context
- [x] Guards
- [x] Entry and exit actions
- [x] Timer transitions
- [x] Dynamic conditional transitions

## Installation

FicusJS finite state machine is part of [FicusJS](https://docs.ficusjs.org) but can also be installed independently in a number of ways.

### CDN

We recommend using native ES modules in the browser.

```html
<script type="module">
  import {
    createMachine,
    createMachineService,
    assign,
    interpret
  } from 'https://cdn.skypack.dev/@ficusjs/finite-state-machine'
</script>
```

FicusJS finite state machine is available on [Skypack](https://www.skypack.dev/view/@ficusjs/finite-state-machine).

### NPM

FicusJS finite state machine works nicely with build tools such as Parcel, Webpack or Rollup. If you are using a NodeJS tool, you can install the NPM package.

```bash
npm install @ficusjs/finite-state-machine
```

### Available builds

FicusJS finite state machine only provides ES module builds. For legacy browsers or alternative modules such as CommonJS, it is recommended to use a build tool to transpile the code.

## Usage

```js
import { createMachine, createMachineService, assign } from '@ficusjs/finite-state-machine'

const lightMachine = createMachine({
  initial: 'green',
  states: {
    green: {
      on: {
        TIMER: {
          target: 'yellow'
        }
      }
    },
    yellow: {
      on: {
        TIMER: {
          target: 'red'
        }
      }
    },
    red: {
      on: {
        TIMER: {
          target: 'green'
        }
      }
    }
  }
})

const service = createMachineService('lights', lightMachine)
  .subscribe((state) => {
    console.log(state.value);
  })
  .start()

// => 'green'
// => 'yellow'
// => 'red'
// => 'green'

service.send('TIMER')
service.send('TIMER')
service.send('TIMER')
```

## License

This project is licensed under the MIT License - see the [`LICENSE`](LICENSE) file for details.

## Contributing to FicusJS

Any kind of positive contribution is welcome! Please help us to grow by contributing to the project.

If you wish to contribute, you can work on any features you think would enhance the library. After adding your code, please send us a Pull Request.

> Please read [CONTRIBUTING](CONTRIBUTING.md) for details on our [CODE OF CONDUCT](CODE_OF_CONDUCT.md), and the process for submitting pull requests to us.

## Support

We all need support and motivation. FicusJS is not an exception. Please give this project a ⭐️ to encourage and show that you liked it. Don't forget to leave a star ⭐️ before you move away.

If you found the library helpful, please consider [sponsoring us](https://github.com/sponsors/ficusjs).
