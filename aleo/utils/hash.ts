import { js2leo as js2leoCommon} from '@aleojs/core';
import { leo2js as leo2jsCommon } from '@aleojs/core';

import { hash } from "aleo-hasher";

export const hashStruct = (struct: any): bigint => {
  const structString= js2leoCommon.json(struct)
  const structHash = hash("bhp256", structString, "field");
  const hashBigInt = leo2jsCommon.field(structHash);
  return hashBigInt
}
