import {
  UpdateConnector,
  UpdateConnectorLeo,
  WUsdcRelease,
  WUsdcReleaseLeo,
} from "../types";

import * as js2leo from "./common";
export function getUpdateConnectorLeo(updateConnector: UpdateConnector): UpdateConnectorLeo {
  const result: UpdateConnectorLeo = {
    new_connector: js2leo.address(updateConnector.new_connector),
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