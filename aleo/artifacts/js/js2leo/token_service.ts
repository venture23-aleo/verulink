import {
  TSForeignContract,
  TSForeignContractLeo,
  TokenOrigin,
  TokenOriginLeo,
} from "../types";

import * as js2leo from "./common";
export function getTSForeignContractLeo(tSForeignContract: TSForeignContract): TSForeignContractLeo {
  const result: TSForeignContractLeo = {
    chain_id: js2leo.u32(tSForeignContract.chain_id),
    contract_address: js2leo.array(tSForeignContract.contract_address, js2leo.u8),
  }
  return result;
}

export function getTokenOriginLeo(tokenOrigin: TokenOrigin): TokenOriginLeo {
  const result: TokenOriginLeo = {
    chain_id: js2leo.u32(tokenOrigin.chain_id),
    token_service_address: js2leo.array(tokenOrigin.token_service_address, js2leo.u8),
    token_address: js2leo.array(tokenOrigin.token_address, js2leo.u8),
  }
  return result;
}