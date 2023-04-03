const { ConfigFile } = require("config_file.js");

const config = new ConfigFile("./config.json", {});

run();

async function run() {
    await config.load();

    config.set("a", 2); // { "a": 2 }
    config.set("b", 4); // { "a": 2, "b": 4 }

    config.get("c").set("d", []); // { "a": 2, "b": 4, "c": { "d": [] } }
    config.get("c", "d").add(6); // { "a": 2, "b": 4, "c": { "d": [6] } }

    console.log(config.get("c", "d", 0).getValue()); // Output: 6

    await config.save();
}