import { ExecutionMode } from '@doko-js/core';
import { Token_service_dev_v2Contract } from '../artifacts/js/token_service_dev_v2';
import {evm2AleoArr} from './ethAddress';

const address = evm2AleoArr("0xD99e898842c566be038bf898b3e406f028a031E0");
// let i=0;
// let result = "[";
// for (i=0; i< address.length;i++){
//     let add = address[i].toString();
//     add += "u8, ";
//     result+= add;
// }
// result+="]";
// console.log(result);

// const tokenService = new Token_service_v0003Contract({mode:ExecutionMode.SnarkExecute});


console.log(address);