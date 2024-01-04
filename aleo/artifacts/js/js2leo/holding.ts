import {
  TokenAccount,
  TokenAccountLeo,
} from "../types";

import * as js2leo from "./common";
export function getTokenAccountLeo(tokenAccount: TokenAccount): TokenAccountLeo {
  const result: TokenAccountLeo = {
    user: js2leo.address(tokenAccount.user),
    token_id: js2leo.address(tokenAccount.token_id),
  }
  return result;
}