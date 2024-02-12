import * as ejs from 'ejs';

import * as fs from 'fs';
import { encodeNetworkChainId} from '../../utils/chainId';
import { to_address } from 'aleo-program-to-address';
import { evm2AleoArr} from '../../utils/ethAddress';
import { string2AleoArr } from '../../utils/string';

const tokenTemplate = fs.readFileSync('programs/templates/token_program.ejs').toString();
const holdingTemplate = fs.readFileSync('programs/templates/token_holding.ejs').toString();
const connectorTemplate = fs.readFileSync('programs/templates/token_connector.ejs').toString();

const sepoliaChainId = 11155111
const ethChainId = encodeNetworkChainId("eth", sepoliaChainId);

const name = "USD Coin"
const symbol = "USDC"
const ethTokenAddr = "0xD342C031453c66A6D6c2a23D6dA86c30adA08C79".toLowerCase()
const ethTsContractAddr = "0xFEac0FD32367da944498b39f3D1EbD64cC88E13c".toLowerCase()

const tokenData = {
    symbol: "wusdc",
    tokenVersion: "_v0002",
}

const holdingData = {
    holdingVersion: "_v0002",
    ...tokenData
}

const connectorData = {
    connectorVersion: "_v0003",
    tokenServiceVersion: "_v0002",
    councilVersion: "_v0002",
    originChainId: ethChainId.toString() + 'u128',
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