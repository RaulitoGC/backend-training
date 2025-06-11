Task 1: Basic User Registration Event System
Goal
Establish the foundation for event-driven architecture by creating a basic user registration system that emits events when new business accounts are created. This builds toward the business microservice by implementing the core event emission and listening patterns needed for account management.
Description
Create a custom class that extends EventEmitter to handle user registration events. The system should emit a `userRegistered` event when a new business account is successfully created, and implement listeners to handle post-registration tasks like sending welcome emails and logging.
Steps
	1.	Create a `UserRegistrationManager` class that extends EventEmitter and implements a `registerUser` method that validates user data and emits a `userRegistered` event
	2.	Implement event listeners for `userRegistered` that handle welcome email notifications and activity logging
	3.	Add error handling by implementing listeners for `registrationError` events
	4.	Test the system by registering multiple users and verifying all events are properly emitted and handled
Hints
Use descriptive event names that clearly indicate the action being performed. Remember that EventEmitter operations are asynchronous, so avoid blocking operations in event handlers. Implement proper error handling using try-catch blocks within your event handlers.
Follow-up Questions
How would you prevent memory leaks from accumulating event listeners? What considerations would you make for handling high-volume user registrations? How might you implement event persistence for audit trails?