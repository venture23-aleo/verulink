package relay

import "fmt"

func signScreenedPacket(sp *screenedPacket) {
	fmt.Sprintf("%s%v", sp.Packet.GetSha256Hash(), sp.IsWhite)
}
