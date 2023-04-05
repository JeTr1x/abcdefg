import { Ed25519Keypair, JsonRpcProvider, RawSigner, TransactionBlock, Connection } from '@mysten/sui.js';
import fs from 'fs';
import axios from 'axios';
import randUserAgent from 'rand-user-agent';
import HttpsProxyAgent from 'https-proxy-agent';
import { config } from './config.js';






const parseFile = fileName => fs.readFileSync(fileName, "utf8").split('\n').map(str => str.trim()).filter(str => str.length > 10);



const saveAddr = address => fs.appendFileSync("address_ch.txt", `${address}\n`, "utf8");






let mnemonics = parseFile('mnemonics.txt');
console.log(`Loaded ${mnemonics.length} wallets`);

//console.log(`${address}:${mnemonic}`)
for (let i = 0; i < mnemonics.length; i++) {
    try {
        const mnemonic = mnemonics[i]
        const keypair = Ed25519Keypair.deriveKeypair(mnemonic);
        const address = keypair.getPublicKey().toSuiAddress()
        console.log(`${address}:${mnemonic}`)
        saveAddr(address)
   } catch (err) { console.log(err.message) }
}
