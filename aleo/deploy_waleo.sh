#!/bin/bash

# 1. Deploy all contracts
# npx tsx scripts/deployment/waleoProgram.ts

# # 2. Initialize all contracts
# npx tsx scripts/initialization/intialize_waleo.ts

# # 3. Add BSC chain
## check data in beforing runing
# npx tsx scripts/council/bridge/addChain.ts

# # 4. Add token Service
# npx tsx scripts/council/bridge/addService.ts

# 5. Add token Info
## check data in beforing runing
# npx tsx scripts/council/tokenServiceWAleo/addNewToken.ts

#6 . unpause token in tokenService
# npx tsx scripts/council/tokenServiceWAleo/unpause.ts

# 7: unpause bridge in bridgeService
# npx tsx scripts/council/bridge/unpause.ts 