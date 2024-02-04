
import { js2leo as js2leoCommon} from '@aleojs/core';
import { sign, sign_verify } from "aleo-signer"

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

// console.log(sign_verify(
//   "sign1cpk5uknzfydxmfhs2tarq8f8wzwk9fqkkend8usxrjpl9dq2lqqhjx9pndu7lymdkfs58626qz09wjsrf3wen62s3p5nspnwd62xvqyr22qjwn4zc0pzv87twjygsz9m7ekljmuw4jpzf68rwuq99r0tp735vs6220q7tp60nr7llkwstcvu49wdhydx5x2s3sftjskzawhqvgh5w2e", 
//   "aleo1rhgdu77hgyqd3xjj8ucu3jj9r2krwz6mnzyd80gncr5fxcwlh5rsvzp9px", 
//   "6031562985299802822965992981672819841115963364550440625340601187042064093542field"
// ))