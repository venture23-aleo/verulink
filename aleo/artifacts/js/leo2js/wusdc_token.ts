import {
  token,
  tokenLeo,
  Approval,
  ApprovalLeo,
} from "../types";

import * as leo2js from "./common";
export function gettoken(token: tokenLeo): token {
  const result: token = {
    owner: leo2js.address(token.owner),
    amount: leo2js.u128(token.amount),
    _nonce: leo2js.group(token._nonce),
  }
  return result;
}

export function getApproval(approval: ApprovalLeo): Approval {
  const result: Approval = {
    approver: leo2js.address(approval.approver),
    spender: leo2js.address(approval.spender),
  }
  return result;
}