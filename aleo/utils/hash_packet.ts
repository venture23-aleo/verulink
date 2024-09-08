import { js2leo as js2leoCommon } from '@doko-js/core';
import { leo2js as leo2jsCommon } from '@doko-js/core';
import { InPacket } from '../artifacts/js/types/token_bridge_dev_v2';
import { evm2AleoArr } from './ethAddress';
import { aleoChainId, ethTsContractAddr } from './constants';

 const hash = () => {
  const packet:InPacket = {
      version: 1,
      sequence: BigInt(1),
      source: {
          chain_id: BigInt(28556963657430695),
          addr: evm2AleoArr(ethTsContractAddr)
      },
      destination: {
          chain_id: BigInt(aleoChainId),
          addr: "aleo19250rwuhvzuee3hm7uah4d2a5ghmgvkccnxwq92txudaq4yesgxqh3gfra"
      },
      message: {
          sender_address: evm2AleoArr(ethTsContractAddr),
          dest_token_id: BigInt(7190692537453907461105790569797103513515746302149567971663963167242253971983),
          amount: BigInt(10000),
          receiver_address: 
      },
      height: 
  }
}

hash();