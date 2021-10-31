const readLine = require('readline-sync');

const robots = {
    input: require("./robots/input"),
    text: require("./robots/text.js"),
    state: require("./robots/state.js"),
    image: require("./robots/image.js"),
    video: require("./robots/video.js"),
    audio: require("./robots/audio.js"),
    youtube: require("./robots/youtube.js")
}
async function start(){
    robots.input();
    await robots.text();
    await robots.image();
    await robots.video();
    // await robots.audio();
    await robots.youtube();
}

start();