#!/usr/bin/env node

import {getFiles, storeWithProgress} from "./web3.mjs";

async function run() {
    let folder = process.argv[2];
    if (!folder){
        throw new Error("Please set folder to upload as a first argument of a command");
    }else if (!folder.startsWith('/')) {
        folder = process.cwd()+'/'+folder
    }
    return getFiles(folder).then(files => {
        return storeWithProgress(files, folder);
    }).then(value => {
        console.log("done upload", value);
        return value;
    });
}

run().catch(reason => {
    console.log(reason);
    process.exit(-1)
}).then(_ => process.exit(0));