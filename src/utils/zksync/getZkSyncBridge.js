import axios from "axios";
import {ethers} from "ethers";

const CONTRACR_SYNCSWAP = "0x2da10A1e27bF85cEdD8FFb1AbBe97e53391C0295".toLowerCase();
const CONTRACR_IZUMI = "0x9606eC131EeC0F84c95D82c9a63959F2331cF2aC".toLowerCase();
const CONTRACR_RUBIC = "0x8E70e517057e7380587Ea6990dAe81cB1Ba405ce".toLowerCase();



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
    console.log(d.getUTCFullYear() + "-" + (d.getUTCMonth() + 1))
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
    syncswapTimes,
    syncswapAmount
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

        if (
            list[i].data.contractAddress.toLowerCase() == CONTRACR_SYNCSWAP
        ) {
            syncswapTimes++;
            // const value = ethers.formatEther(list[i].data.value, "ether");
            // syncswapAmount += parseFloat(value);

            const erc20TransfersList = list[i].erc20Transfers;
            console.log("erc20TransfersList:", erc20TransfersList);
            for (let j = 0; j < erc20TransfersList.length; j++) {
                if ( erc20TransfersList[j].from.toLowerCase() === address.toLowerCase() 
                    && erc20TransfersList[j].tokenInfo.symbol == "ETH"
                    && erc20TransfersList[j].to.toLowerCase() != "0x0000000000000000000000000000000000008001") {
                    
                    console.log("xxx ", erc20TransfersList[j].amount);
                    const value = ethers.formatEther(erc20TransfersList[j].amount, "ether");
                    syncswapAmount += parseFloat(value);
                }else if ( erc20TransfersList[j].to.toLowerCase() === address.toLowerCase() 
                    && erc20TransfersList[j].tokenInfo.symbol == "ETH"
                    && erc20TransfersList[j].from.toLowerCase() != "0x0000000000000000000000000000000000008001") {
                    
                    console.log("xxx ", erc20TransfersList[j].amount);
                    const value = ethers.formatEther(erc20TransfersList[j].amount, "ether");
                    syncswapAmount += parseFloat(value);
                }
            }
        }



        
    }
    return [totalFee, contract, days, weeks, months, l1Tol2Times, l1Tol2Amount, l2Tol1Times,
            l2Tol1Amount, syncswapTimes, syncswapAmount];
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
        let syncswapTimes = 0;
        let syncswapAmount = 0;
        const initUrl = "https://zksync2-mainnet-explorer.zksync.io/transactions?limit=100&direction=older&accountAddress=" + address;
        const initResponse = await axios.get(initUrl)
        const initDataLength = initResponse.data.total;
        [totalFee, contract, days, weeks, months, l1Tol2Times, l1Tol2Amount, l2Tol1Times, l2Tol1Amount, syncswapTimes, syncswapAmount] =
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
                syncswapTimes,
                syncswapAmount
            );
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
                    totalFee, contract, days, weeks, months, l1Tol2Times, l1Tol2Amount, l2Tol1Times, l2Tol1Amount, syncswapTimes, syncswapAmount] =
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
                        syncswapTimes,
                        syncswapAmount
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
            syncswapTimes,
            syncswapAmount: syncswapAmount.toFixed(3),
        }
    } catch (e) {
        console.log(e);
        return {
            totalFee: "Error",
            contractActivity: "Error",
            dayActivity: "Error", weekActivity: "Error", monthActivity: "Error",
            l1Tol2Times: "Error", l1Tol2Amount: "Error", l2Tol1Times: "Error", l2Tol1Amount: "Error",
            syncswapTimes: "Error", syncswapAmount: "Error"
        }
    }
}

export default getZkSyncBridge;
