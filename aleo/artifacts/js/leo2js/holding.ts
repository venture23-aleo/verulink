import {
  TokenAccount,
  TokenAccountLeo,
} from "../types";

import * as leo2js from "./common";
export function getTokenAccount(tokenAccount: TokenAccountLeo): TokenAccount {
  const result: TokenAccount = {
    user: leo2js.address(tokenAccount.user),
    token_id: leo2js.address(tokenAccount.token_id),
  }
  return result;
}