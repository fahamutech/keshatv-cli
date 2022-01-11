#!/usr/bin/env node

import {run} from "./movie.mjs";
const channel = process.argv[2]
if (!channel){
    console.log("channel required");
    process.exit(0)
}
run(channel).catch(console.log).finally(() => process.exit());