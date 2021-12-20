#!/usr/bin/env node

const WEB_3_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkaWQ6ZXRocjoweEI5YTAxYTI1MjE2MTJkMjY2NDQ4NDMyMjlGMzk2QzljNzU0N0IyY0IiLCJpc3MiOiJ3ZWIzLXN0b3JhZ2UiLCJpYXQiOjE2Mzk5MzIyMTM3NzAsIm5hbWUiOiJrZXNoYXR2LXVwbG9hZGVyIn0.gpB0pHd9apCG_H3BAiI65LSdqbd9F3TVdiWRE1FBf9I"

import {getFilesFromPath} from 'web3.storage'
import {Web3Storage} from 'web3.storage'
import { packToFs } from 'ipfs-car/pack/fs'
import { FsBlockStore } from 'ipfs-car/blockstore/fs'
import { CarIndexedReader } from '@ipld/car'

const carPath = `${process.cwd()}/../output.car`

function getAccessToken() {
    return WEB_3_TOKEN
}

function makeStorageClient() {
    return new Web3Storage({token: getAccessToken()})
}

async function getFiles(path) {
    const files = await getFilesFromPath(path)
    console.log(`read ${files.length} file(s) from ${path}`)
    return files
}

async function storeWithProgress(files) {
    const onRootCidReady = cid => {
        console.log('uploading files with cid:', cid)
    }
    const totalSize = files.map(f => f.size).reduce((a, b) => a + b, 0)
    let uploaded = 0
    const onStoredChunk = size => {
        uploaded += size
        const pct = (uploaded / totalSize) * 100
        process.stdout.write(`Uploading... ${pct.toFixed(2)}% complete\r`)
    }
    const client = makeStorageClient()
    console.log("start pack files");
    const a = await packToFs({
        input: process.cwd(),
        output: carPath,
        blockstore: new FsBlockStore(),
        wrapWithDirectory: false,
    });
    onRootCidReady(a.root.toString())
    const car = await CarIndexedReader.fromFile(carPath)
    return client.putCar(car, {onStoredChunk})
}

async function run() {
    return getFiles(process.cwd()).then(files => {
        return storeWithProgress(files)
    }).then(value => {
        console.log("done upload", value);
        return value;
    });
}

run().catch(console.log).finally(() => process.exit(0));