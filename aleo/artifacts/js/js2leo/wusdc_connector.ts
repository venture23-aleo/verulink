import {
  UpdateGovernance,
  UpdateGovernanceLeo,
  WUsdcRelease,
  WUsdcReleaseLeo,
} from "../types";

import * as js2leo from "./common";
export function getUpdateGovernanceLeo(updateGovernance: UpdateGovernance): UpdateGovernanceLeo {
  const result: UpdateGovernanceLeo = {
    new_governance: js2leo.address(updateGovernance.new_governance),
  }
  return result;
}

export function getWUsdcReleaseLeo(wUsdcRelease: WUsdcRelease): WUsdcReleaseLeo {
  const result: WUsdcReleaseLeo = {
    receiver: js2leo.address(wUsdcRelease.receiver),
    amount: js2leo.u64(wUsdcRelease.amount),
  }
  return result;
}