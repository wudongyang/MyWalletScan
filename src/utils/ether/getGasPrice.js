import axios from "axios";

const getGasPrice = async () => {
    try {
        const options = {
            method: 'POST',
            url: 'https://eth-mainnet.g.alchemy.com/v2/' + import.meta.env.VITE_REACT_ETH_MAINNET_ALCHEMY_KEY,
            headers: {'Content-Type': 'application/json'},
            data: JSON.stringify({"jsonrpc": "2.0", "method": "eth_gasPrice", "id": 0})
        }
        let response = await axios.request(options)
        const gasPrice = parseInt(response.data['result'])
        let gwei = gasPrice / 1000000000;
        // gwei 只保留整数
        gwei = parseInt(gwei);

        return gwei
    } catch (e) {
        console.log(e)
        return "/"
    }

}

export default getGasPrice
