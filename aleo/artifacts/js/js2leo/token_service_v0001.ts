import {
  OutgoingPercentageInTime,
  OutgoingPercentageInTimeLeo,
} from "../types";

import * as js2leo from "./common";
export function getOutgoingPercentageInTimeLeo(outgoingPercentageInTime: OutgoingPercentageInTime): OutgoingPercentageInTimeLeo {
  const result: OutgoingPercentageInTimeLeo = {
    outgoing_percentage: js2leo.u16(outgoingPercentageInTime.outgoing_percentage),
    timeframe: js2leo.u32(outgoingPercentageInTime.timeframe),
    max_no_cap: js2leo.u128(outgoingPercentageInTime.max_no_cap),
  }
  return result;
}