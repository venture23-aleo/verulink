import { ExecutionMode } from "@doko-js/core";
import { CouncilContract } from "../artifacts/js/council";
import { proposeAddAttestor, execAddAttestor } from "../scripts/council/bridge/addAttestor";
import { proposeRemoveAttestor, execRemoveAttestor } from "../scripts/council/bridge/removeAttestor";
import {
    ALEO_ZERO_ADDRESS,
    COUNCIL_THRESHOLD_INDEX,
    COUNCIL_TOTAL_MEMBERS_INDEX,
    COUNCIL_TOTAL_PROPOSALS_INDEX,
  } from "../utils/constants";

const council = new CouncilContract({ mode:ExecutionMode.SnarkExecute });

const removeAttestor = async() =>{
    const propId = await proposeRemoveAttestor("aleo1fcg4k0sacadavag292p7x9ggm6889aay6wn9m8ftnmynh67cg5xsx8ycu8",1);
    execRemoveAttestor(propId, "aleo1fcg4k0sacadavag292p7x9ggm6889aay6wn9m8ftnmynh67cg5xsx8ycu8", 1);
}

const addAttestor = async() =>{
    const propId = await proposeAddAttestor("aleo1jdncft25gmces2ct3t5zvp4n0a79t6yyvztqs4g9lkggf93dhgrq8tu00a",1);
    execAddAttestor(propId, "aleo1jdncft25gmces2ct3t5zvp4n0a79t6yyvztqs4g9lkggf93dhgrq8tu00a", 1);
}

addAttestor();