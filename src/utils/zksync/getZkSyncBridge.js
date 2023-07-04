import axios from "axios";
import {ethers} from "ethers";

const CONTRACR_SYNCSWAP = "0x2da10A1e27bF85cEdD8FFb1AbBe97e53391C0295".toLowerCase();
const CONTRACR_IZUMI = "0x9606eC131EeC0F84c95D82c9a63959F2331cF2aC".toLowerCase(); // liquidity 0x936c9A1B8f88BFDbd5066ad08e5d773BC82EB15F
const CONTRACR_RUBIC = "0x8E70e517057e7380587Ea6990dAe81cB1Ba405ce".toLowerCase();
const CONTRACR_MUTE = "0x8B791913eB07C32779a16750e3868aA8495F5964".toLowerCase();
const CONTRACR_SPCACEFI = "0xbE7D1FD1f6748bbDefC4fbaCafBb11C6Fc506d1d".toLowerCase();

const CONTRACR_MAV = "0x39E098A153Ad69834a9Dac32f0FCa92066aD03f4".toLowerCase();
const CONTRACR_CARV = "0x089b353642E6f066bAD44A6a854Ef4e3bCb0dC9C".toLowerCase();
const CONTRACR_ZKNS = "0xAE23B6E7f91DDeBD3B70d74d20583E3e674Bd94f".toLowerCase();



function getDayNumber(d) {
    return `${d.getUTCFullYear()}-${d.getUTCMonth() + 1}-${d.getUTCDate()}`;
}

function getWeekNumber(d) {
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    let yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    let weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    return d.getUTCFullYear() + "W" + weekNo;
}

function getMonthNumber(d) {
    // console.log("getMonthNumber", d.getUTCFullYear() + "-" + (d.getUTCMonth() + 1))
    return d.getUTCFullYear() + "-" + (d.getUTCMonth() + 1);
}

async function processTransactions(
    address,
    totalFee,
    contract,
    days,
    weeks,
    months,
    list,
    l1Tol2Times,
    l1Tol2Amount,
    l2Tol1Times,
    l2Tol1Amount,
    contractsMap
) {
    for (let i = 0; i < list.length; i++) {
        if (list[i]['balanceChanges'][0]['from'].toLowerCase() === address.toLowerCase()) {
            const receivedAt = new Date(Date.parse(list[i]['receivedAt']));
            const contractAddress = list[i].data.contractAddress;
            const fee = (parseInt(list[i].fee, 16) / 10 ** 18).toFixed(5)
            totalFee += parseFloat(fee);
            contract.add(contractAddress)
            days.add(getDayNumber(receivedAt));
            weeks.add(getWeekNumber(receivedAt));
            months.add(getMonthNumber(receivedAt));
        }
        if (list[i].isL1Originated === true) {
            l1Tol2Times++;
            const value = ethers.formatEther(list[i].data.value, "ether");
            l1Tol2Amount += parseFloat(value);
        } else if (
            list[i].data.contractAddress ===
            "0x000000000000000000000000000000000000800a"
        ) {
            l2Tol1Times++;
            const value = ethers.formatEther(list[i].data.value, "ether");
            l2Tol1Amount += parseFloat(value);
        }

        // 遍历 contractsMap
        for (let [key, contract] of contractsMap) {
            if (list[i].data.contractAddress.toLowerCase() === contract.address.toLowerCase()) {
                contract.times++;
                const erc20TransfersList = list[i].erc20Transfers;
                for (let j = 0; j < erc20TransfersList.length; j++) {
                    if ( erc20TransfersList[j].from.toLowerCase() === address.toLowerCase() 
                        && erc20TransfersList[j].tokenInfo.symbol == "ETH"
                        && erc20TransfersList[j].to.toLowerCase() != "0x0000000000000000000000000000000000008001") {
                        
                        const value = ethers.formatEther(erc20TransfersList[j].amount, "ether");
                        contract.amount += parseFloat(value);
                    }else if ( erc20TransfersList[j].to.toLowerCase() === address.toLowerCase() 
                        && erc20TransfersList[j].tokenInfo.symbol == "ETH"
                        && erc20TransfersList[j].from.toLowerCase() != "0x0000000000000000000000000000000000008001") {
                        
                        const value = ethers.formatEther(erc20TransfersList[j].amount, "ether");
                        contract.amount += parseFloat(value);
                    }
                }
            }
        }
    }
    return [totalFee, contract, days, weeks, months, l1Tol2Times, l1Tol2Amount, l2Tol1Times,
            l2Tol1Amount, contractsMap];
}

async function getZkSyncBridge(address) {
    try {
        let contract = new Set();
        let days = new Set();
        let weeks = new Set();
        let months = new Set();
        let dayActivity;
        let weekActivity;
        let monthActivity;
        let contractActivity;
        let totalFee = 0;
        let l1Tol2Times = 0;
        let l1Tol2Amount = 0;
        let l2Tol1Times = 0;
        let l2Tol1Amount = 0;
        let offset = 0;
        let fromBlockNumber = null;
        let fromTxIndex = null;
        
        let contractsMap = new Map();

        contractsMap.set("syncswap", {
            address: CONTRACR_SYNCSWAP,
            times: 0,
            amount: 0
        });
        contractsMap.set("izumi", {
            address: CONTRACR_IZUMI,
            times: 0,
            amount: 0
        });
        contractsMap.set("rubic", {
            address: CONTRACR_RUBIC,
            times: 0,
            amount: 0
        });
        contractsMap.set("mute", {
            address: CONTRACR_MUTE,
            times: 0,
            amount: 0
        });
        contractsMap.set("spacefi", {
            address: CONTRACR_SPCACEFI,
            times: 0,
            amount: 0
        });
        contractsMap.set("mav", {
            address: CONTRACR_MAV,
            times: 0,
            amount: 0
        });
        contractsMap.set("carv", {
            address: CONTRACR_CARV,
            times: 0,
            amount: 0
        });
        contractsMap.set("zkns", {
            address: CONTRACR_ZKNS,
            times: 0,
            amount: 0
        });


        const initUrl = "https://zksync2-mainnet-explorer.zksync.io/transactions?limit=100&direction=older&accountAddress=" + address;
        const initResponse = await axios.get(initUrl)
        const initDataLength = initResponse.data.total;
        [totalFee, contract, days, weeks, months, l1Tol2Times, l1Tol2Amount, l2Tol1Times, l2Tol1Amount, contractsMap] =
            await processTransactions(
                address,
                totalFee,
                contract,
                days,
                weeks,
                months,
                initResponse.data.list,
                l1Tol2Times,
                l1Tol2Amount,
                l2Tol1Times,
                l2Tol1Amount,
                contractsMap
            );
        
        console.log("mapContracts:", contractsMap);
        if (initDataLength > 100) {
            fromBlockNumber = initResponse.data.list[0].blockNumber;
            fromTxIndex = initResponse.data.list[0].indexInBlock;
            while (true) {
                let url = `https://zksync2-mainnet-explorer.zksync.io/transactions?limit=100&direction=older&accountAddress=${address}`;
                if (fromBlockNumber !== undefined && fromTxIndex !== undefined && offset !== 0) {
                    url += `&fromBlockNumber=${fromBlockNumber}&fromTxIndex=${fromTxIndex}&offset=${offset}`;
                }
                const response = await axios.get(url);
                const ListLength = response.data.list.length;
                [
                    totalFee, contract, days, weeks, months, l1Tol2Times, l1Tol2Amount, l2Tol1Times, l2Tol1Amount, contractsMap] =
                    await processTransactions(
                        address,
                        totalFee,
                        contract,
                        days,
                        weeks,
                        months,
                        response.data.list,
                        l1Tol2Times,
                        l1Tol2Amount,
                        l2Tol1Times,
                        l2Tol1Amount,
                        contractsMap
                    );
                if (ListLength === 100) {
                    offset += ListLength;
                } else {
                    break;
                }
            }
        }
        dayActivity = days.size;
        weekActivity = weeks.size;
        monthActivity = months.size;
        contractActivity = contract.size;

        for (let [key, contract] of contractsMap) {
            contract.amount = contract.amount.toFixed(3);
        }

        return {
            totalFee: totalFee.toFixed(4),
            contractActivity,
            dayActivity,
            weekActivity,
            monthActivity,
            l1Tol2Times,
            l1Tol2Amount: l1Tol2Amount.toFixed(3),
            l2Tol1Times,
            l2Tol1Amount: l2Tol1Amount.toFixed(3),
            contractsMap
        }
    } catch (e) {
        console.log(e);

        for (let [key, contract] of contractsMap) {
            contract.amount = "Error";
        }
        return {
            totalFee: "Error",
            contractActivity: "Error",
            dayActivity: "Error", weekActivity: "Error", monthActivity: "Error",
            l1Tol2Times: "Error", l1Tol2Amount: "Error", l2Tol1Times: "Error", l2Tol1Amount: "Error",
            contractsMap
        }
    }
}

export default getZkSyncBridge;
