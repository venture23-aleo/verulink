import {
  TSForeignContract,
  TSForeignContractLeo,
  TokenOrigin,
  TokenOriginLeo,
  OutgoingPercentageInTime,
  OutgoingPercentageInTimeLeo,
} from "../types";

import * as leo2js from "./common";
export function getTSForeignContract(tSForeignContract: TSForeignContractLeo): TSForeignContract {
  const result: TSForeignContract = {
    chain_id: leo2js.u128(tSForeignContract.chain_id),
    contract_address: leo2js.array(tSForeignContract.contract_address, leo2js.u8),
  }
  return result;
}

export function getTokenOrigin(tokenOrigin: TokenOriginLeo): TokenOrigin {
  const result: TokenOrigin = {
    chain_id: leo2js.u128(tokenOrigin.chain_id),
    token_service_address: leo2js.array(tokenOrigin.token_service_address, leo2js.u8),
    token_address: leo2js.array(tokenOrigin.token_address, leo2js.u8),
  }
  return result;
}

export function getOutgoingPercentageInTime(outgoingPercentageInTime: OutgoingPercentageInTimeLeo): OutgoingPercentageInTime {
  const result: OutgoingPercentageInTime = {
    outgoing_percentage: leo2js.u16(outgoingPercentageInTime.outgoing_percentage),
    timeframe: leo2js.u32(outgoingPercentageInTime.timeframe),
  }
  return result;
}