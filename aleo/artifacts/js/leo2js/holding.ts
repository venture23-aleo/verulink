import {
  TokenAcc,
  TokenAccLeo,
} from "../types";

import * as leo2js from "./common";
export function getTokenAcc(tokenAcc: TokenAccLeo): TokenAcc {
  const result: TokenAcc = {
    user: leo2js.address(tokenAcc.user),
    token_id: leo2js.address(tokenAcc.token_id),
  }
  return result;
}