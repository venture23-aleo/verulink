import {
  WithdrawalLimit,
  WithdrawalLimitLeo,
} from "../types";

import * as js2leo from "./common";
export function getWithdrawalLimitLeo(withdrawalLimit: WithdrawalLimit): WithdrawalLimitLeo {
  const result: WithdrawalLimitLeo = {
    percentage: js2leo.u16(withdrawalLimit.percentage),
    duration: js2leo.u32(withdrawalLimit.duration),
    threshold_no_limit: js2leo.u128(withdrawalLimit.threshold_no_limit),
  }
  return result;
}