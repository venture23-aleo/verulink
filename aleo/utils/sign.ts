
import { js2leo as js2leoCommon} from '@aleojs/core';
import { sign } from "aleo-signer"

import { hashStruct } from "./hash";
import { InPacket, InPacketWithScreening, MsgTokenReceive } from '../artifacts/js/types';
import * as js2leo from "../artifacts/js/js2leo";

export const signPacket = (packet: InPacket, screening_passed: boolean, privateKey: string) => {

    const packetHash = hashStruct(js2leo.getInPacketLeo(packet));
    const packetHashWithScreening: InPacketWithScreening = {
      packet_hash: packetHash,
      screening_passed
    };
    const packetHashWithScreeningHash = hashStruct(js2leo.getInPacketWithScreeningLeo(packetHashWithScreening));
    const signature = sign(privateKey, js2leoCommon.field(packetHashWithScreeningHash))
    return signature
}