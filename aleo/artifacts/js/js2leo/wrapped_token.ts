import {
  token,
  tokenLeo,
  Approval,
  ApprovalLeo,
} from "../types";

import * as js2leo from "./common";
export function gettokenLeo(token: token): tokenLeo {
  const result: tokenLeo = {
    owner: js2leo.privateField(js2leo.address(token.owner)),
    amount: js2leo.privateField(js2leo.u64(token.amount)),
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