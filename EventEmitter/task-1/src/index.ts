import EventEmitter from "events"

const emitter = new EventEmitter();

let counter = 0
emitter.on("newEvent", (data: String)=> {
    let position = counter
    console.log(`Iteration #${counter}This is data from new event ${data}`)
    const processingTime = counter % 2 == 0 ? 100 : 3000;
    counter += 1
    setTimeout(() => {
        console.log(`✓ Registration completed for ${position}`);
    }, processingTime);
})

emitter.emit("newEvent", "Data of the event 1");
emitter.emit("newEvent", "Data of the event 2");
emitter.emit("newEvent", "Data of the event 3");
emitter.emit("newEvent", "Data of the event 4");
emitter.emit("newEvent", "Data of the event 5");
emitter.emit("newEvent", "Data of the event 6");



emitter.once("newOnceEvent", (data: String)=> {
    console.log(`This is data from new event ${data}`)
})

emitter.emit("newOnceEvent", "Data of only one event 1")
emitter.emit("newOnceEvent", "Data of only one event 2")
emitter.emit("newOnceEvent", "Data of only one event 3")
