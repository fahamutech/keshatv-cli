#!/usr/bin/env node

import * as Readline from 'readline';
import {cid} from 'is-ipfs'
import {storeJsonWithProgress} from "./web3.mjs";
import {createRequire} from "module";
import bfast from "bfast";

const {database, init} = bfast;

const require = createRequire(import.meta.url);
init({
    applicationId: 'keshatv',
    projectId: 'keshatv'
});

const readline = Readline.createInterface({
    input: process.stdin,
    output: process.stdout
});
const movie = {};
const validValuePattern = new RegExp('[a-zA-Z0-9\\s]+', 'ig');
const validValuePatternSearchKeyword = new RegExp('([a-zA-Z0-9])+', 'ig');
const validValuePatternCategory = new RegExp('([a-zA-Z0-9])+', 'ig');
const validValuePatternCover = new RegExp('([a-zA-Z0-9.\/])+', 'ig');
const validValuePatternCid = new RegExp('([a-zA-Z0-9]+)', 'ig');
const validValuePatternYear = new RegExp('[0-9]{4}', 'ig');
const validValuePatternType = new RegExp('(single)|(series)', 'ig');
const validValuePatternEpisode = new RegExp('([0-9])+', 'ig');

async function question(query) {
    return new Promise(resolve => {
        readline.question(query, resolve);
    });
}

async function movieTitle() {
    const title = await question('movie title: ');
    const pattern = title.toString().match(validValuePattern);
    if (!pattern) {
        console.log("movie title required.");
        return movieTitle();
    }
    movie.title = pattern.join('').trim()
}

async function movieCategory() {
    const title = await question('movie category: ');
    const pattern = title.toString().match(validValuePatternCategory);
    if (!pattern || pattern.length > 1) {
        console.log("movie category required and must be only one input and alphanumeric only.");
        return movieCategory();
    }
    movie.category = pattern.join('').trim().replace(new RegExp('\\s', 'ig'), '');
}

async function movieCover() {
    const cover = await question('movie cover: ');
    const pattern = cover.toString().match(validValuePatternCover);
    if (!pattern || pattern.length > 1) {
        console.log("movie cover required and must be only one input and alphanumeric and dot only.");
        return movieCover();
    }
    movie.cover = pattern.join('').trim().replace(new RegExp('\\s', 'ig'), '');
}

async function movieDescription() {
    const title = await question('movie description ( optional ): ');
    const pattern = title.toString().match(validValuePattern);
    movie.description = pattern ? pattern.join('').trim() : null;
}

async function movieYear() {
    const year = await question('movie year: ');
    const pattern = year.toString().match(validValuePatternYear);
    if (!pattern) {
        console.log("movie year required");
        return movieYear();
    }
    movie.year = pattern.join('').trim();
}

async function movieType() {
    const year = await question('movie type [single,series]: ');
    const pattern = year.toString().match(validValuePatternType);
    if (!pattern || pattern.length > 1) {
        console.log("movie type required and must either be 'single' or 'series'");
        return movieType();
    }
    movie.type = pattern.join('').trim();
}

async function totalEpisode() {
    const year = await question('movie episodes count: ');
    const pattern = year.toString().match(validValuePatternEpisode);
    if (!pattern || pattern.length > 1) {
        console.log("episode required and must be a one group of number");
        return totalEpisode();
    }
    movie.episodes = pattern.join('').trim();
}

async function movieCid() {
    const cidV = await question('movie cid: ');
    const pattern = cidV.toString().match(validValuePatternCid);
    const isCid = cid(cidV);
    if (isCid === false) {
        console.log("movie valid cid required");
        return movieCid();
    }
    movie.cid = pattern.join('').trim();
}

async function prevMovieCid() {
    const cidV = await question('movie prev cid: ');
    const pattern = cidV.toString().match(validValuePatternCid);
    const isCid = cid(cidV);
    if (pattern == null) {
        movie.prev = null;
        return;
    }
    if (isCid === false) {
        console.log("movie valid prev cid required");
        return prevMovieCid();
    }
    movie.prev = pattern ? pattern.join('').trim() : null;
}

async function confirm() {
    console.log("This is the movie i will save : ");
    console.log(movie);
    const c = await question("continue ? [y/n] : ");
    if (c === 'y') {
        return;
    }
    if (c === 'n') {
        throw "save canceled";
    }
    console.log("movie prev cid required and make sure its only cid as input");
    return confirm();
}

async function updateSearch(cid, movie) {
    const keywords = movie.title.match(validValuePatternSearchKeyword);
    // const base = process.cwd();
    // const searchPath = base + '/search';
    //
    // function getSearchKeywordPath(kw) {
    //     return searchPath + '/' + kw.toString().toLowerCase().trim() + '.json';
    // }

    if (Array.isArray(keywords)) {
        await database().bulk().update('search', keywords.map(k => {
            return {
                query: {
                    id: k?.toString()?.toLowerCase(),
                    upsert: true,
                },
                upsert: true,
                update: {
                    $addToSet: {
                        "value": {
                            channel: 'keshatv',
                            cid,
                        }
                    }
                }
            }
        })).commit();
        // for (const kw of keywords) {
        // let cids = [];
        // try {
        //     cids = require(getSearchKeywordPath(kw));
        // } catch (e) {
        // }
        // if (Array.isArray(cids)) {
        //     cids.unshift(cid);
        //     await writeFile(getSearchKeywordPath(kw), JSON.stringify(cids, null, 2));
        // } else {
        //     await writeFile(getSearchKeywordPath(kw), JSON.stringify([cid], null, 2));
        // }
        // }
    }
}

async function updateCategory(cid, movie) {
    await database().bulk().update('channels', {
        query: {
            id: 'keshatv',
            upsert: true,
        },
        upsert: true,
        update: {
            $addToSet: {
                "categories.index": movie.category,
                ["categories." + movie.category]: cid,
                "movies": cid,
            }
        }
    }).commit()
    // const base = process.cwd();
    // const indexPath = base + '/categories/index.json';
    // const categoryPath = base + '/categories/' + movie.category + '.json';
    // let main = [];
    // try {
    //     main = require(indexPath);
    // } catch (e) {
    // }
    // if (Array.isArray(main)) {
    //     main.unshift(movie.category);
    //     await writeFile(indexPath, JSON.stringify(main, null, 2));
    // }
    // let specific = [];
    // try {
    //     specific = require(categoryPath);
    // } catch (e) {
    // }
    // if (Array.isArray(specific)) {
    //     specific.unshift(cid);
    //     await writeFile(categoryPath, JSON.stringify(specific, null, 2));
    // } else {
    //     await writeFile(categoryPath, JSON.stringify([cid], null, 2));
    // }
}

// async function updateRecently(cid, movie) {
//     const base = process.cwd();
//     const indexPath = base + '/home/index.json';
//     const allPath = base + '/home/all.json';
//     let main = [];
//     try {
//         main = require(indexPath);
//     } catch (e) {
//     }
//     if (Array.isArray(main)) {
//         main.unshift(movie);
//         await writeFile(indexPath, JSON.stringify(main, null, 2));
//     } else {
//         await writeFile(indexPath, JSON.stringify([movie], null, 2));
//     }
//     let all = [];
//     try {
//         all = require(allPath);
//     } catch (e) {
//     }
//     if (Array.isArray(all)) {
//         all.unshift(cid);
//         await writeFile(allPath, JSON.stringify(all, null, 2));
//     } else {
//         await writeFile(allPath, JSON.stringify([cid], null, 2));
//     }
// }

async function run() {
    await movieTitle();
    await movieCategory();
    await movieDescription();
    await movieCover();
    await movieYear();
    await movieType();
    if (movie.type === 'series') {
        await totalEpisode();
    }
    await movieCid();
    await prevMovieCid();
    await confirm();
    const cid = await storeJsonWithProgress(movie);
    await updateSearch(cid, movie);
    await updateCategory(cid, movie);
    // await updateRecently(cid, movie);
    console.log('save and update indexes');
}

run().catch(console.log).finally(() => process.exit());








