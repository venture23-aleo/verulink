import {
  committee_state,
  committee_stateLeo,
  bond_state,
  bond_stateLeo,
  unbond_state,
  unbond_stateLeo,
  credits,
  creditsLeo
} from "../types/credits";
import {
  js2leo
} from "@doko-js/core";


export function getcommittee_stateLeo(committee_state: committee_state): committee_stateLeo {
  const result: committee_stateLeo = {
    is_open: js2leo.boolean(committee_state.is_open),
    commission: js2leo.u8(committee_state.commission),
  }
  return result;
}

export function getbond_stateLeo(bond_state: bond_state): bond_stateLeo {
  const result: bond_stateLeo = {
    validator: js2leo.address(bond_state.validator),
    microcredits: js2leo.u64(bond_state.microcredits),
  }
  return result;
}

export function getunbond_stateLeo(unbond_state: unbond_state): unbond_stateLeo {
  const result: unbond_stateLeo = {
    microcredits: js2leo.u64(unbond_state.microcredits),
    height: js2leo.u32(unbond_state.height),
  }
  return result;
}

export function getcreditsLeo(credits: credits): creditsLeo {
  const result: creditsLeo = {
    owner: js2leo.privateField(js2leo.address(credits.owner)),
    microcredits: js2leo.privateField(js2leo.u64(credits.microcredits)),
    _nonce: js2leo.publicField(js2leo.group(credits._nonce)),
  }
  return result;
}