#!/usr/bin/env node
const WEB_3_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkaWQ6ZXRocjoweEI5YTAxYTI1MjE2MTJkMjY2NDQ4NDMyMjlGMzk2QzljNzU0N0IyY0IiLCJpc3MiOiJ3ZWIzLXN0b3JhZ2UiLCJpYXQiOjE2Mzk5MzIyMTM3NzAsIm5hbWUiOiJrZXNoYXR2LXVwbG9hZGVyIn0.gpB0pHd9apCG_H3BAiI65LSdqbd9F3TVdiWRE1FBf9I"

import {getFilesFromPath} from 'web3.storage'
import {Web3Storage} from 'web3.storage'

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
    return client.put(files, {onRootCidReady, onStoredChunk, wrapWithDirectory: false})
}

async function run() {
    return getFiles(process.cwd()).then(files => {
        return storeWithProgress(files)
    });
}

run().catch(console.log).finally(() => process.exit(0));