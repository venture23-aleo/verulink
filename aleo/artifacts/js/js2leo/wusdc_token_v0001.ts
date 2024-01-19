import {
  token,
  tokenLeo,
  Approval,
  ApprovalLeo,
  TokenInfo,
  TokenInfoLeo,
} from "../types";

import * as js2leo from "./common";
export function gettokenLeo(token: token): tokenLeo {
  const result: tokenLeo = {
    owner: js2leo.privateField(js2leo.address(token.owner)),
    amount: js2leo.privateField(js2leo.u128(token.amount)),
    _nonce: js2leo.publicField(js2leo.group(token._nonce)),
  }
  return result;
}

export function getApprovalLeo(approval: Approval): ApprovalLeo {
  const result: ApprovalLeo = {
    approver: js2leo.address(approval.approver),
    spender: js2leo.address(approval.spender),
  }
  return result;
}

export function getTokenInfoLeo(tokenInfo: TokenInfo): TokenInfoLeo {
  const result: TokenInfoLeo = {
    name: js2leo.array(tokenInfo.name, js2leo.u8),
    symbol: js2leo.array(tokenInfo.symbol, js2leo.u8),
    decimals: js2leo.u8(tokenInfo.decimals),
  }
  return result;
}