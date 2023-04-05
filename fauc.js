import axios from 'axios';



async function requestSuiFromFaucet(recipient) {
    while (true) {
        console.log(`Requesting SUI from faucet for ${recipient}`);

        let data = await axios("https://faucet.testnet.sui.io/gas", {
            headers: {
                'Content-Type': 'application/json'
            },
            data: JSON.stringify({ FixedAmountRequest: { recipient: `${recipient}` } }),
            method: 'POST',
            timeout: 120000
        }).catch(async err => {
            let statusCode = err?.response?.status
            console.log('[FAUCET ERROR]', statusCode > 500 && statusCode < 600 ? 'Faucet down!' : err?.response?.statusText);
        })

        if (data?.data?.error === null) {
            console.log(`Faucet request status: ${data?.statusText || data}`);
            return true
        }
    }
}
await requestSuiFromFaucet("0x53661e66465b0e94f81aa83fef0ad3c6e9f1d3786df81cc0966d1c4e25ddec95")
