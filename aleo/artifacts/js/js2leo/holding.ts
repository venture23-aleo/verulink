import {
  TokenAcc,
  TokenAccLeo,
} from "../types";

import * as js2leo from "./common";
export function getTokenAccLeo(tokenAcc: TokenAcc): TokenAccLeo {
  const result: TokenAccLeo = {
    user: js2leo.address(tokenAcc.user),
    token_id: js2leo.address(tokenAcc.token_id),
  }
  return result;
}