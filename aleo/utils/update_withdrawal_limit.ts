import { ExecutionMode } from "@doko-js/core";
import { Vlink_council_v3Contract } from "../artifacts/js/vlink_council_v3";
import { proposeAddAttestor, execAddAttestor } from "../scripts/council/bridge/addAttestor";
import { proposeRemoveAttestor, execRemoveAttestor } from "../scripts/council/bridge/removeAttestor";
import {
  ALEO_ZERO_ADDRESS,
  COUNCIL_THRESHOLD_INDEX,
  COUNCIL_TOTAL_MEMBERS_INDEX,
  COUNCIL_TOTAL_PROPOSALS_INDEX,
} from "../utils/constants";
import { execUpdateWithdrawalLimit, proposeUpdateOutPercentage } from "../scripts/council/tokenService/updateOutPercentage";

const council = new Vlink_council_v3Contract({ mode: ExecutionMode.SnarkExecute });


const addAttestor = async () => {
  // const propId = await proposeUpdateOutPercentage(BigInt("55450936025960704172805057997335567022183805121624630660225464328946094150"),10_00, 300, BigInt(1_000_000_000_000_000_000));
  await execUpdateWithdrawalLimit(28, BigInt("55450936025960704172805057997335567022183805121624630660225464328946094150"), 10_00, 300, BigInt(1_000_000_000_000_000_000));
}

addAttestor();