import * as ejs from 'ejs';

import * as fs from 'fs';
import { encodeNetworkChainId} from '../../utils/chainId';
import { to_address } from 'aleo-program-to-address';
import { evm2AleoArr} from '../../utils/ethAddress';
import { string2AleoArr } from '../../utils/string';
import { ethTsContractAddr, usdcContractAddr } from '../../utils/testnet.data';

const tokenTemplate = fs.readFileSync('programs/templates/token_program.ejs').toString();
const holdingTemplate = fs.readFileSync('programs/templates/token_holding.ejs').toString();
const connectorTemplate = fs.readFileSync('programs/templates/token_connector.ejs').toString();

const sepoliaChainId = 11155111
const ethChainId = encodeNetworkChainId("eth", sepoliaChainId);

const name = "USD Coin"
const symbol = "USDC"
const decimals = 6
const ethTokenAddr = usdcContractAddr

const tokenData = {
    ticker: "wusdc",
    tokenVersion: "_v0002",
    name,
    symbol,
    decimals,
    nameInArray: '[' + string2AleoArr(name, name.length).map((x) => x.toString() + 'u8').join(',') + ']',
    symbolInArray: '[' + string2AleoArr(symbol, symbol.length).map((x) => x.toString() + 'u8').join(',') + ']',
}

const holdingData = {
    holdingVersion: "_v0002",
    ...tokenData
}

const connectorVersion = "_v0002"
const connectorData = {
    connectorVersion,
    tokenServiceVersion: "_v0002",
    councilVersion: "_v0004",
    originChainId: ethChainId.toString() + 'u128',
    originTokenAddress: '[' + evm2AleoArr(ethTokenAddr).map((x) => x.toString() + 'u8').join(',') + ']',
    originTokenServiceAddress: '[' + evm2AleoArr(ethTsContractAddr).map((x) => x.toString() + 'u8').join(',') + ']',
    aleoTokenAddr: to_address(`${tokenData.ticker}_token${tokenData.tokenVersion}.aleo`),
    aleoTokenHoldingAddr: to_address(`${tokenData.ticker}_holding${holdingData.holdingVersion}.aleo`),
    aleoTokenConnectorAddr: to_address(`${tokenData.ticker}_connector${connectorVersion}.aleo`),
    ...holdingData
}

const tokenProgram = ejs.render(tokenTemplate, tokenData);
const holdingProgram = ejs.render(holdingTemplate, holdingData);
const connectorProgram = ejs.render(connectorTemplate, connectorData);

fs.writeFileSync(`programs/${tokenData.ticker}_token${tokenData.tokenVersion}.leo`, tokenProgram);
fs.writeFileSync(`programs/${tokenData.ticker}_holding${holdingData.holdingVersion}.leo`, holdingProgram);
fs.writeFileSync(`programs/${tokenData.ticker}_connector${connectorData.connectorVersion}.leo`, connectorProgram);