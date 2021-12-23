const WEB_3_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkaWQ6ZXRocjoweEI5YTAxYTI1MjE2MTJkMjY2NDQ4NDMyMjlGMzk2QzljNzU0N0IyY0IiLCJpc3MiOiJ3ZWIzLXN0b3JhZ2UiLCJpYXQiOjE2Mzk5MzIyMTM3NzAsIm5hbWUiOiJrZXNoYXR2LXVwbG9hZGVyIn0.gpB0pHd9apCG_H3BAiI65LSdqbd9F3TVdiWRE1FBf9I"

import {getFilesFromPath, File} from 'web3.storage'
import {Web3Storage} from 'web3.storage'
import {packToFs} from 'ipfs-car/pack/fs'
import {FsBlockStore} from 'ipfs-car/blockstore/fs'
import {CarIndexedReader} from '@ipld/car';
import {rm, writeFile} from 'fs/promises'

const hlsPath = process.cwd() + '/ktv_output';
const cidResultPath = process.cwd() + '/ktv_cid.txt';
const carPath = process.cwd() + '/output.car';

function getAccessToken() {
    return WEB_3_TOKEN
}

function makeStorageClient() {
    return new Web3Storage({token: getAccessToken()})
}

export async function getFiles(path) {
    const files = await getFilesFromPath(path)
    console.log(`read ${files.length} file(s) from ${path}`)
    return files
}

export async function storeWithProgress(files) {
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
        input: hlsPath,
        output: carPath,
        blockstore: new FsBlockStore(),
        wrapWithDirectory: false,
    });
    onRootCidReady(a.root.toString())
    const car = await CarIndexedReader.fromFile(carPath)
    const cid = await client.putCar(car, {onStoredChunk});
    await writeFile(cidResultPath, cid);
    await rm(hlsPath, {recursive: true});
    await rm(carPath);
    return cid;
}

export async function storeJsonWithProgress(data) {
    const onRootCidReady = cid => {
        console.log('uploading with cid:', cid)
    }
    const client = makeStorageClient()
    return client.put([
        new File([Buffer.from(JSON.stringify(data))], data.title + '.json')
    ], {
        wrapWithDirectory: false,
        onRootCidReady
    });
}
