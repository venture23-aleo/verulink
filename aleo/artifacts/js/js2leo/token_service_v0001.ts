import {
  OutgoingPercentageInTime,
  OutgoingPercentageInTimeLeo,
} from "../types";

import * as js2leo from "./common";
export function getOutgoingPercentageInTimeLeo(outgoingPercentageInTime: OutgoingPercentageInTime): OutgoingPercentageInTimeLeo {
  const result: OutgoingPercentageInTimeLeo = {
    outgoing_percentage: js2leo.u16(outgoingPercentageInTime.outgoing_percentage),
    timeframe: js2leo.u32(outgoingPercentageInTime.timeframe),
  }
  return result;
}