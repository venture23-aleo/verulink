import {
  UpdateGovernance,
  UpdateGovernanceLeo,
  WUsdcRelease,
  WUsdcReleaseLeo,
} from "../types";

import * as leo2js from "./common";
export function getUpdateGovernance(updateGovernance: UpdateGovernanceLeo): UpdateGovernance {
  const result: UpdateGovernance = {
    new_governance: leo2js.address(updateGovernance.new_governance),
  }
  return result;
}

export function getWUsdcRelease(wUsdcRelease: WUsdcReleaseLeo): WUsdcRelease {
  const result: WUsdcRelease = {
    receiver: leo2js.address(wUsdcRelease.receiver),
    amount: leo2js.u64(wUsdcRelease.amount),
  }
  return result;
}