const { createAlchemyWeb3 } = require("@alch/alchemy-web3");
const web3 = createAlchemyWeb3("https://eth-mainnet.alchemyapi.io/v2/jBZ6Ef9ZzK13-YpPVzWF9IT0oNz-t9M0");
const abi = require("./min-abi.json");

async function main() {
    let blockNum = 0;
    while(1) {
        const {err, data} = await getLatestBlockInfo();
        if(!err) {
            if(blockNum == data.number) continue;
            console.log("checking the latest block - " + data.number);
            blockNum = data.number;
            const erc721Array = [];
            for (i = 0; i < data.transactions.length; i ++) {
                const {txErr, isContract, addr} = await getContractAddrIfCreation(data.transactions[i]);
                if(!txErr) {
                    if(isContract) {
                        const is721 = await isERC721(addr);
                        if(is721) {
                            erc721Array.push(addr);
                        }
                    }
                } else {
                    console.log(txErr);
                }
            }
            if(erc721Array.length)
                console.log(erc721Array);
        } else {
            console.log(err);
        }
    }
}

async function getLatestBlockInfo() {
    try {
        const blockNumber = await web3.eth.getBlockNumber();
        const blockInfo = await web3.eth.getBlock(blockNumber);
        return {err:null, data: blockInfo};
    } catch(error) {
        return {err:error, data: null};
    }
}

async function getContractAddrIfCreation(txHash) {
    try {
        const txInfo = await web3.eth.getTransactionReceipt(txHash);
        if(txInfo.contractAddress !== null) { // if the tx is contract creation
            return {err:null, isContract: true, addr: txInfo.contractAddress};
        } else {
            return {err:null, isContract: false, addr: null};
        }
    } catch(error) {
        return {err:error, data: null, addr: null};
    }
}

async function isERC721(contractAddr) {
    try {
        const contractInstance = new web3.eth.Contract(abi, contractAddr);
        const is721 = await contractInstance.methods.supportsInterface('0x80ac58cd').call();
        if(is721) return true;
        else return false;
    } catch(error) {
        return false;
    }
}

main();