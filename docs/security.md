## Measures For Security Concerns
Following measures will be taken to address security concerns related to this kind of bridge architecture. The primary focus will be to keep funds secure and obviate all points whereby a single actor could compromise the funds.

### MultiSig Verification
 Ensures that the majority of validators have verified and signed the message before the message is allowed to be consumed. This ensures that for a malicious action to be executed it has to be approved by a majority of validators which will be highly unlikely as all validators will be publicly identifiable and thus accountable for their behavior. As mentioned previously we’re proposing venture23, Aleo and Demox team to run a validator each.

### Geo-Distributed Validators
Ensures that the validators are hosted on different regions and different cloud providers so as to prevent single point of compromise , failure and attack.

### Decentralized Authority
Ensures that any major changes on the smart contracts like upgrades, adding/removing validators happens via decentralized mechanism where the majority of validators will need to approve the action. We will explore industry standard tools such as Gnosis safe.

### Permissioned Access
To be compliant with current blockchain ethos and also to prevent malicious activity on the bridge the contracts will maintain an updated copy of blacklisted addresses and forbid them from utilizing the bridge. This list will be actively managed. Updates to the list will be managed via a multi signature process. This is on top of the USDT/ USDC blacklist maintained by the respective tokens.

### OFAC Compliance
We rely on Circle's and Tether's sanction lists as a means to streamline compliance efforts and alleviate the necessity of maintaining our proprietary sanction list.

### Segregate Disputed Funds
Funds from blacklisted addresses will be held separately by a holding contract to prevent it from being mixed along with funds of other users. This will help us prevent clean funds to be freezed in case of dispute or litigation.

### Circuit Breakers
Implementation of circuit breaker using Aleo program involves setting a withdrawal limit, typically a certain percentage of the Total Value Locked (TVL) per day, to prevent large-scale losses in case of a breach. A TVL threshold is also established; below this threshold, the circuit breaker will disallow any further withdrawals. Moreover, there are minimum and maximum limits per transaction per token, ensuring controlled movement of assets across the bridge. 

### Wallet Screening
There is a provision for third party wallet screening services to be implemented to monitor and detect any suspicious activity within the 24 hours delay of bridging of assets to ensure security posture of the bridge.
