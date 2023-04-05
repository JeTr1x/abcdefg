import { Ed25519Keypair, JsonRpcProvider, RawSigner, TransactionBlock, Connection } from '@mysten/sui.js';
import fs from 'fs';
import axios from 'axios';
import randUserAgent from 'rand-user-agent';
import HttpsProxyAgent from 'https-proxy-agent';
import { SocksProxyAgent } from 'socks-proxy-agent';
import { config } from './config.js';


const rpc_addr = 'http://65.21.203.204:9000'
const [ip, port, login, password] = config.proxy.split(":");
const proxy = `http://${login}:${password}@${ip}:${port}`;
//const proxy = {hostname: `${ip}:${port}`, userId: login, password: password}
console.log(proxy)
const axiosProxyInstance = axios.create({ httpsAgent: HttpsProxyAgent(proxy) });
const timeout = ms => new Promise(res => setTimeout(res, ms))
const saveMnemonic = mnemonic => fs.appendFileSync("mnemonics.txt", `${mnemonic}\n`, "utf8");
const parseFile = fileName => fs.readFileSync(fileName, "utf8").split('\n').map(str => str.trim()).filter(str => str.length > 10);
const saveAddr = address => fs.appendFileSync("address.txt", `${address}\n`, "utf8");

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function rotateIp() {
    console.log('Rotating IP...');
    return await axios.get(config.proxyLink).catch(err => { })
}

async function rotateAndCheckIp() {
    while (true) {
        let rotate = await rotateIp()
        console.log(rotate?.data.split('\n')[0]);
        await timeout(5000)
        let ip = await checkIp()

        if (ip) {
            console.log(`New IP: ${ip}`);
            await timeout(5000)
            return true
        }
    }
}

async function checkIp() {
    let data = await axiosProxyInstance({
        method: 'GET',
        url: "http://api64.ipify.org/?format=json",
        proxy: {
            host: ip,
            port: Number(port),
            auth: {
                username: login,
                password: password
            },
            protocol: 'http'
        }
    }).catch(err => { console.log('[ERROR]', err.response?.data); })

    if (data) {
        return data?.data?.ip
    }
}

async function requestSuiFromFaucet(recipient) {
    while (true) {
        console.log(`Requesting SUI from faucet for ${recipient}`);

        let data = await axios("https://proxy.scrapeops.io/v1/?api_key=19f4aeab-d057-4bd5-bcfa-92957b9432fa&url=https%3A%2F%2Ffaucet.testnet.sui.io%2Fgas&keep_headers=True", {
            headers: {
                'Content-Type': 'application/json'
            },
            data: JSON.stringify({ FixedAmountRequest: { recipient: `${recipient}` } }),
            method: 'POST',
            timeout: 30000
        }).catch(async err => {
            let statusCode = err?.response?.status
            console.log('[FAUCET ERROR]', statusCode > 500 && statusCode < 600 ? 'Faucet down!' : err?.response?.statusText);
            console.log(statusCode)
        })

        if (data?.data?.error === null) {
            console.log(`Faucet request status: ${data?.statusText || data}`);
            return true
        }
    }
}
async function getCoins(addr){
	const provider = new JsonRpcProvider(new Connection({
              fullnode: rpc_addr,
              faucet: 'https://faucet.testnet.sui.io/gas'
            }), {
                skipDataValidation: true
            }
    );
	const objects = await provider.getCoins({
		owner: addr,
                 coinType: '0x2::sui::SUI'
		});
        return objects.data
}

async function mergeCoins(keypair, arrx) {
    console.log(`Merging: `);
    const provider = new JsonRpcProvider(new Connection({
              fullnode: rpc_addr,
              faucet: 'https://faucet.testnet.sui.io/gas'
            }), {
                skipDataValidation: true
            }
    );
    const txb = new TransactionBlock();
	let objarr = []
	for (let i = 1; i < arrx.length; i++) {
		objarr.push(txb.object(arrx[i]))
	}
	const obj = txb.object(arrx[0])
    const signer = new RawSigner(keypair, provider);
    txb.mergeCoins(obj, objarr);
    return await signer.signAndExecuteTransactionBlock({ transactionBlock: txb });
}

async function mintNft(keypair, trg, obj) {
    console.log(`Minting: `);
    const provider = new JsonRpcProvider(new Connection({
              fullnode: rpc_addr,
              faucet: 'https://faucet.testnet.sui.io/gas'
            }), {
                skipDataValidation: true
            }
    );
    const txb = new TransactionBlock();
    const signer = new RawSigner(keypair, provider);
    txb.moveCall({
    //    packageObjectId: '0xfcb0c2f067d41f0d1da637fe929cfbb5435bf629a059a259c75e60c1ee550f0a',
  //      module: 'nft',
//        function: 'mint',
        target: trg,
        arguments: [
            txb.pure('0x4acf21aab452a13bfdaa40375cfe21bf523fbbc98eddc374d45a58acb68da5e8'),
            txb.pure(obj)
        ],
        typeArguments: [],
        gasBudget: 10000,
    })
    return await signer.signAndExecuteTransactionBlock({ transactionBlock: txb });
}

const provider = new JsonRpcProvider(new Connection({
          fullnode: 'https://fullnode.testnet.sui.io:443',
          faucet: 'https://faucet.testnet.sui.io/gas'
        }), {
            skipDataValidation: true
        }
);


let mnemonics = parseFile('oldWallets.txt');
console.log(`Loaded ${mnemonics.length} wallets`);

const trg = `0xfcb0c2f067d41f0d1da637fe929cfbb5435bf629a059a259c75e60c1ee550f0a::nft::mint`

for (let i = 0; i < mnemonics.length; i++) {
    try {
        const mnemonic = mnemonics[i]
        const keypair = Ed25519Keypair.deriveKeypair(mnemonic);
        const address = keypair.getPublicKey().toSuiAddress()
        console.log(`${address}:${mnemonic}`)
//        await requestSuiFromFaucet(address)
//        console.log(`Faucet  req sent, waiting for token`)
//        await sleep(5000)
        const provider = new JsonRpcProvider(new Connection({
                  fullnode: rpc_addr,
                  faucet: 'https://faucet.testnet.sui.io/gas'
                }), {
                    skipDataValidation: true
                }
        );
        const bal = await provider.getBalance({
            owner: address,
            coinType: '0x2::sui::SUI'})
        await sleep(5000)
        console.log(bal)
        console.log(bal.totalBalance)
        if (bal.totalBalance < 4600000000){

 	    await requestSuiFromFaucet(address)
            console.log(`Faucet  req sent, waiting for token`)
            await sleep(5000)
	    await requestSuiFromFaucet(address)
            console.log(`Faucet  req sent, waiting for token`)
            await sleep(5000)
	    await requestSuiFromFaucet(address)
            console.log(`Faucet  req sent, waiting for token`)
            await sleep(5000)
       	    await requestSuiFromFaucet(address)
            console.log(`Faucet  req sent, waiting for token`)
            await sleep(15000)
}
	const objects = await getCoins(address)
		let arr = []
		for (let i = 0; i < objects.length -1; i++) {
				arr.push(objects[i].coinObjectId)
                }
        console.log(arr)
        if (bal.coinObjectCount > 2){
            await mergeCoins(keypair, arr)}
	const tx = await mintNft(keypair, trg, arr[0])
        console.log(tx)
        console.log(`Minted, saving...`)
        saveMnemonic(mnemonic)
        saveAddr(address)
    } catch (err) { console.log(err.message) 
        i = i-1}
}
