import {
  UpdateConnector,
  UpdateConnectorLeo,
  WUsdcRelease,
  WUsdcReleaseLeo,
} from "../types";

import * as leo2js from "./common";
export function getUpdateConnector(updateConnector: UpdateConnectorLeo): UpdateConnector {
  const result: UpdateConnector = {
    new_connector: leo2js.address(updateConnector.new_connector),
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