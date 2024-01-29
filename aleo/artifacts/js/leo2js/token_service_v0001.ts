import {
  WithdrawalLimit,
  WithdrawalLimitLeo,
} from "../types";

import * as leo2js from "./common";
export function getWithdrawalLimit(withdrawalLimit: WithdrawalLimitLeo): WithdrawalLimit {
  const result: WithdrawalLimit = {
    percentage: leo2js.u16(withdrawalLimit.percentage),
    duration: leo2js.u32(withdrawalLimit.duration),
    threshold_no_limit: leo2js.u128(withdrawalLimit.threshold_no_limit),
  }
  return result;
}