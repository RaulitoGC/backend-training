import EventEmitter from "events"

const emitter = new EventEmitter();

let counter = 0
emitter.on("newEvent", (data: String)=> {
    console.log(`Iteration #${counter}This is data from new event ${data}`)
    counter += 1
})

emitter.emit("newEvent", "Data of the event 1");
emitter.emit("newEvent", "Data of the event 2");
emitter.emit("newEvent", "Data of the event 3");


emitter.once("newOnceEvent", (data: String)=> {
    console.log(`This is data from new event ${data}`)
})

emitter.emit("newOnceEvent", "Data of only one event 1")
emitter.emit("newOnceEvent", "Data of only one event 2")
emitter.emit("newOnceEvent", "Data of only one event 3")
