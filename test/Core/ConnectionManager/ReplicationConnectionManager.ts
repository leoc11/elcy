import { expect } from "chai";
import "mocha";
import { ReplicationConnectionManager } from "../../../src/Connection/ReplicationConnectionManager";
import { MockDriver } from "../../../src/Mock/MockDriver";

describe("REPLICATION CONNECTION MANAGER", () => {
    const driver = new MockDriver({ database: "Master" });
    const driver2 = new MockDriver({ database: "Replica" });
    const connectionManager = new ReplicationConnectionManager(driver, [driver2], { idleTimeout: 10 });

    it("should return master connection", async () => {
        const con = await connectionManager.getConnection(true);
        await con.close();
        expect(con.database).to.equal("Master");
    });
    it("should return replica connection", async () => {
        const con = await connectionManager.getConnection();
        await con.close();
        expect(con.database).to.equal("Replica");
    });
    it("should return all connections", async () => {
        const cons = await connectionManager.getAllConnections();
        for (const o of cons) {
            await o.close();
        }
        expect(cons).has.lengthOf(2);
    });
});
