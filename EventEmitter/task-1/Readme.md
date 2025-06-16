# Intro to EventEmitter

## Topic: NodeJs EventEmitter

**pending**

## Goal:

Understand the basics of EventEmitter in Node.js

## Description:

Read the Node.js documentation on EventEmitter and experiment with creating a simple EventEmitter instance, emitting events, and listening for those events.

## Hints:

- Focus on the core methods like .on(), .emit(), and .once()
- Create a simple script that demonstrates emitting and handling events

## Follow-up Questions and Responses:

- What are some real-world use cases for EventEmitter?
  We could use EventEmitter to notify actions for new user registration, register logs, register changes of attributes, basically any notification needed for specific actions.
  Related with real work use cases, instead of waiting for one heavy execution, we can do it based in who reach out first.
- How does EventEmitter enable event-driven architecture in Node.js?
  By using EventEmitter, nodeJs perform requests in asynchronous way like event-drive architure suggests.
  We process the request that are fast in the main thread, but we delegate the heavy task to background thread.
  As soon as this heavy process respond. we fire the callback, on this way we do not delay anything and we can scale multiple system.
  Event driven architure suggest to orchestrate our system by events, this is what EventEmitter class allows and it is how it behaves internnally

## Learning Outcomes:

- Understand the purpose and basic usage of EventEmitter
- Be able to create an EventEmitter instance and use its core methods
