#!/usr/bin/env node

import {getFiles, storeWithProgress} from "./web3.mjs";

async function run() {
    const basePath = process.cwd() + '/ktv_output';
    return getFiles(basePath).then(files => {
        const cover = files.filter(x => x.name.includes('cover.'));
        if (cover?.length === 0) {
            throw Error("cover photo required");
        }
        return storeWithProgress(files);
    }).then(value => {
        console.log("done upload", value);
        return value;
    });
}

run().catch(reason => {
    console.log(reason);
    process.exit(-1)
}).then(_ => process.exit(0));