import { v4 as uuidv4 } from "uuid";

import sha256 from "sha256"; // No destructuring needed

const currentNodeUrl = process.argv[3];

export class HorizonBlockchain {
    constructor() {
        this.chain = [];
        this.pendingTransactions = [];

        this.currentNodeUrl = currentNodeUrl;
        this.networkNodes = [];

        this.createNewBlock(100, "0", "0");
    }

    createNewBlock(nonce, previousBlockHash, hash) {
        const newBlock = {
            index: this.chain.length + 1,
            timestamp: Date.now(),
            transactions: this.pendingTransactions,
            nonce: nonce,
            hash: hash,
            previousBlockHash: previousBlockHash,
        };

        this.pendingTransactions = [];
        this.chain.push(newBlock);

        return newBlock;
    }

    getLastBlock = function () {
        return this.chain[this.chain.length - 1];
    };

    createNewTransaction = function (amount, sender, recipient) {
        const newTransaction = {
            amount: amount,
            sender: sender,
            recipient: recipient,
            transactionId: uuidv4().split("-").join(""),
        };

        return newTransaction;
    };

    addTransactionToPendingTransactions = function (transactionObj) {
        this.pendingTransactions.push(transactionObj);
        return this.getLastBlock()["index"] + 1;
    };

    hashBlock = function (previousBlockHash, currentBlockData, nonce) {
        const dataAsString =
            previousBlockHash +
            nonce.toString() +
            JSON.stringify(currentBlockData);
        const hash = sha256(dataAsString);

        return hash;
    };

    proofOfWork = function (previousBlockHash, currentBlockData) {
        let nonce = 0;
        let hash = this.hashBlock(previousBlockHash, currentBlockData, nonce);
        while (hash.substring(0, 4) !== "0000") {
            nonce++;
            hash = this.hashBlock(previousBlockHash, currentBlockData, nonce);
        }

        return nonce;
    };

    chainIsValid = function (blockchain) {
        let validChain = true;
        for (var i = 1; i < blockchain.length; i++) {
            const currentBlock = blockchain[i];
            const prevBlock = blockchain[i - 1];
            const blockHash = this.hashBlock(
                prevBlock["hash"],
                {
                    transactions: currentBlock["transactions"],
                    index: currentBlock["index"],
                },
                currentBlock["nonce"]
            );

            if (blockHash.substring(0, 4) !== "0000") validChain = false;
            if (currentBlock["previousBlockHash"] !== prevBlock["hash"])
                validChain = false;
            console.log("previousBlockHash =>", prevBlock["hash"]);
            console.log("currentBlockHash =>", currentBlock["hash"]);
        }

        const genesisBlock = blockchain[0];
        const correctNonce = genesisBlock["nonce"] === 100;
        const correctPreviousBlockHash =
            genesisBlock["previousBlockHash"] === "0";
        const correctHash = genesisBlock["hash"] === "0";
        const correctTransactions = genesisBlock["transactions"].length === 0;

        if (
            !correctNonce ||
            !correctPreviousBlockHash ||
            !correctHash ||
            !correctTransactions
        )
            validChain = false;

        return validChain;
    };

    getBlock = function (blockHash) {
        let correctBlock = null;
        this.chain.forEach((block) => {
            if (block.hash === blockHash) correctBlock = block;
        });

        return correctBlock;
    };

    getTransaction = function (transactionId) {
        let correctTransaction = null;
        let correctBlock = null;

        this.chain.forEach((block) => {
            block.transactions.forEach((transaction) => {
                if (transaction.transactionId === transactionId) {
                    correctTransaction = transaction;
                    correctBlock = block;
                }
            });
        });

        return {
            transaction: correctTransaction,
            block: correctBlock,
        };
    };

    getAddressData = function (address) {
        const addressTransactions = [];
        this.chain.forEach((block) => {
            block.transactions.forEach((transaction) => {
                if (
                    transaction.sender === address ||
                    transaction.recipient === address
                ) {
                    addressTransactions.push(transaction);
                }
            });
        });

        let balance = 0;
        addressTransactions.forEach((transaction) => {
            if (transaction.recipient === address)
                balance += transaction.amount;
            else if (transaction.sender === address)
                balance -= transaction.amount;
        });

        return {
            addressTransactions: addressTransactions,
            addressBalance: balance,
        };
    };
}
