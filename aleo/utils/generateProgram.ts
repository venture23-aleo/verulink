import * as ejs from 'ejs';

import * as fs from 'fs';
import { encodeNetworkChainId, evm2AleoArr, string2AleoArr } from './utils';
import { to_address } from 'aleo-program-to-address';

const tokenTemplate = fs.readFileSync('programs/templates/token_program.ejs').toString();
const holdingTemplate = fs.readFileSync('programs/templates/token_holding.ejs').toString();
const connectorTemplate = fs.readFileSync('programs/templates/token_connector.ejs').toString();

const name = "USD Coin"
const symbol = "USDC"
const ethMainnetChainId = encodeNetworkChainId("evm", 1);
const ethTokenAddr = "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48"
const ethTsContractAddr = "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48"

const tokenData = {
    symbol: "wusdc",
    tokenVersion: "_v0001",
}

const holdingData = {
    holdingVersion: "_v0001",
    ...tokenData
}

const connectorData = {
    connectorVersion: "_v0001",
    tokenServiceVersion: "_v0001",
    councilVersion: "_v0001",
    originChainId: ethMainnetChainId.toString() + 'u128',
    originTokenAddress: '[' + evm2AleoArr(ethTokenAddr).map((x) => x.toString() + 'u8').join(',') + ']',
    originTokenServiceAddress: '[' + evm2AleoArr(ethTsContractAddr).map((x) => x.toString() + 'u8').join(',') + ']',
    nameInArray: '[' + string2AleoArr(name, 32).map((x) => x.toString() + 'u8').join(',') + ']',
    symbolInArray: '[' + string2AleoArr(symbol, 16).map((x) => x.toString() + 'u8').join(',') + ']',
    decimals: '6u8',
    aleoTokenAddr: to_address(`${tokenData.symbol}_token${tokenData.tokenVersion}.aleo`),
    aleoTokenHoldingAddr: to_address(`${tokenData.symbol}_holding${holdingData.holdingVersion}.aleo`),
    ...holdingData
}

const tokenProgram = ejs.render(tokenTemplate, tokenData);
const holdingProgram = ejs.render(holdingTemplate, holdingData);
const connectorProgram = ejs.render(connectorTemplate, connectorData);

fs.writeFileSync(`programs/${tokenData.symbol}_token${tokenData.tokenVersion}.leo`, tokenProgram);
fs.writeFileSync(`programs/${tokenData.symbol}_holding${holdingData.holdingVersion}.leo`, holdingProgram);
fs.writeFileSync(`programs/${tokenData.symbol}_connector${connectorData.connectorVersion}.leo`, connectorProgram);