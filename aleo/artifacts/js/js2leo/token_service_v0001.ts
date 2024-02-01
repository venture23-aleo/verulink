import {
  WithdrawalLimit,
  leoWithdrawalLimitSchema,
  WithdrawalLimitLeo
} from "../types";

import {
  js2leo
} from "@aleojs/core";
export function getWithdrawalLimitLeo(withdrawalLimit: WithdrawalLimit): WithdrawalLimitLeo {
  const result: WithdrawalLimitLeo = {
    percentage: js2leo.u16(withdrawalLimit.percentage),
    duration: js2leo.u32(withdrawalLimit.duration),
    threshold_no_limit: js2leo.u128(withdrawalLimit.threshold_no_limit),
  }
  return result;
}