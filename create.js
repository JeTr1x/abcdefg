import { JsonRpcProvider, devnetConnection, Ed25519Keypair, Connection } from '@mysten/sui.js';
import bip39 from 'bip39'
import fs from 'fs';

let n = 0;

const provider = new JsonRpcProvider(new Connection({
          fullnode: 'https://fullnode.testnet.sui.io:443',
        }), {
            skipDataValidation: true
        }
);

while (n < 250) {
       const provider = new JsonRpcProvider(new Connection({
                 fullnode: 'https://fullnode.testnet.sui.io:443',
                }), {
                    skipDataValidation: true
                }
        );
	const mnemonic = bip39.generateMnemonic()
	const keypair = Ed25519Keypair.deriveKeypair(mnemonic);
	const address = keypair.getPublicKey().toSuiAddress()
	console.log(`0x${address}:${mnemonic}`)
        fs.appendFileSync("address.txt", `0x${address}\n`, "utf8");
        fs.appendFileSync("oldWallets.txt", `${mnemonic}\n`, "utf8");
	fs.appendFileSync("wallets.txt", `0x${address}:${mnemonic}\n`, "utf8");
	n++;
}
