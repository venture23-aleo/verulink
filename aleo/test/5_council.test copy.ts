describe("Council", () => {
    describe("Deployment and initialization", () => {
        test.todo("Deployment")
        test.todo("Initialization")
    })
    describe("Transfer Ownership to Council", () => {
        test.todo("Token Bridge Program")
        test.todo("Token Service Program")
        test.todo("Token Program")
        test.todo("Holding Program")
    })
    describe("Propose", () => {
        test.todo("Valid propose")
        test.todo("Proposal can only be created from member")
        test.todo("Member should not have voted the proposal earlier")
        test.todo("Proposal Id must be correct")
    })
    describe("Vote", () => {
        test.todo("Vote can only be casted by member")
        test.todo("Only existing proposal can be voted")
        test.todo("Member should not be able to vote the same proposal twice")
    })
    describe("Add New Member", () => {
        test.todo("Propose")
        test.todo("Vote")
        test.todo("Execute")
    })
    describe("Remove Member", () => {
        test.todo("Propose")
        test.todo("Vote")
        test.todo("Execute")
    })
    describe("Update threshold", () => {
        test.todo("Propose")
        test.todo("Vote")
        test.todo("Execute")
    })
    describe("Call to external programs", () => {
        describe("Token Bridge", () => {
            test.todo("Update Governance")
            test.todo("Add attestor")
            test.todo("Remove attestor")
            test.todo("Update threshold")
            test.todo("Enable Chain")
            test.todo("Disable Chain")
            test.todo("Enable Service")
            test.todo("Disable Service")
        })

        describe("Token Service", () => {
            test.todo("Update Governance")
            test.todo("Support Chain")
            test.todo("Remove Chain")
            test.todo("Support Token")
            test.todo("Remove Token")
            test.todo("Update Connector")
            test.todo("Update Minimum Transfer")
            test.todo("Update Outgoing Percentage")
        })
    })
})