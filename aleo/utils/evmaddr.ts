import { ExecutionMode } from '@doko-js/core';
import { Token_service_v0003Contract } from '../artifacts/js/token_service_v0003';
import {evm2AleoArr} from './ethAddress';

// const address = evm2AleoArr("0xe8AD1a4149A619F90973eE49E910085196e0F225");
// let i=0;
// let result = "[";
// for (i=0; i< address.length;i++){
//     let add = address[i].toString();
//     add += "u8, ";
//     result+= add;
// }
// result+="]";
// console.log(result);

const tokenService = new Token_service_v0003Contract({mode:ExecutionMode.SnarkExecute});


console.log(tokenService.address());