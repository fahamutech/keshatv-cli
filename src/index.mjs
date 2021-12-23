#!/usr/bin/env node

import {getFiles, storeWithProgress} from "./web3.mjs";

async function run() {
    return getFiles(process.cwd() + '/ktv_output').then(files => {
        return storeWithProgress(files);
    }).then(value => {
        console.log("done upload", value);
        return value;
    });
}

run().catch(console.log).finally(() => process.exit(0));