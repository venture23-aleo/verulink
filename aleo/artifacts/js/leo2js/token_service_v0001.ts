import {
  OutgoingPercentageInTime,
  OutgoingPercentageInTimeLeo,
} from "../types";

import * as leo2js from "./common";
export function getOutgoingPercentageInTime(outgoingPercentageInTime: OutgoingPercentageInTimeLeo): OutgoingPercentageInTime {
  const result: OutgoingPercentageInTime = {
    outgoing_percentage: leo2js.u16(outgoingPercentageInTime.outgoing_percentage),
    timeframe: leo2js.u32(outgoingPercentageInTime.timeframe),
  }
  return result;
}