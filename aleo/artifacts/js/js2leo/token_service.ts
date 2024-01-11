import {
  TSForeignContract,
  TSForeignContractLeo,
  TokenOrigin,
  TokenOriginLeo,
  OutgoingPercentageInTime,
  OutgoingPercentageInTimeLeo,
} from "../types";

import * as js2leo from "./common";
export function getTSForeignContractLeo(tSForeignContract: TSForeignContract): TSForeignContractLeo {
  const result: TSForeignContractLeo = {
    chain_id: js2leo.u128(tSForeignContract.chain_id),
    contract_address: js2leo.array(tSForeignContract.contract_address, js2leo.u8),
  }
  return result;
}

export function getTokenOriginLeo(tokenOrigin: TokenOrigin): TokenOriginLeo {
  const result: TokenOriginLeo = {
    chain_id: js2leo.u128(tokenOrigin.chain_id),
    token_service_address: js2leo.array(tokenOrigin.token_service_address, js2leo.u8),
    token_address: js2leo.array(tokenOrigin.token_address, js2leo.u8),
  }
  return result;
}

export function getOutgoingPercentageInTimeLeo(outgoingPercentageInTime: OutgoingPercentageInTime): OutgoingPercentageInTimeLeo {
  const result: OutgoingPercentageInTimeLeo = {
    outgoing_percentage: js2leo.u16(outgoingPercentageInTime.outgoing_percentage),
    timeframe: js2leo.u32(outgoingPercentageInTime.timeframe),
  }
  return result;
}