import { js2leo as js2leoCommon } from '@doko-js/core';
import { leo2js as leo2jsCommon } from '@doko-js/core';

import { hash } from "aleo-hasher-web";

export const hashStruct = (struct: any): bigint => {
  const structString = js2leoCommon.json(struct)
  console.log(structString);
  const structHash = hash("bhp256", structString, "field");
  const hashBigInt = leo2jsCommon.field(structHash);
  return hashBigInt
}
