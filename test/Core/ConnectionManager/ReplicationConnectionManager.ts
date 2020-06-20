import { expect } from "chai";
import "mocha";
import { ReplicationConnectionManager } from "../../../src/Connection/ReplicationConnectionManager";
import { MockDriver } from "../../../src/Mock/MockDriver";

describe("REPLICATION CONNECTION MANAGER", () => {
    const driver = new MockDriver({ database: "Master" });
    const rdriver1 = new MockDriver({ database: "Replica1" });
    const rdriver2 = new MockDriver({ database: "Replica2" });
    const connectionManager = new ReplicationConnectionManager(driver, [rdriver1, rdriver2], { idleTimeout: 10 });

    it("should return master connection", async () => {
        const con = await connectionManager.getConnection(true);
        await con.close();
        expect(con.database).to.equal("Master");
    });
    it("should return replica connection", async () => {
        const con = await connectionManager.getConnection();
        await con.close();
        expect(con.database).to.equal("Replica1");
    });
    it("should return all connections", async () => {
        const cons = await connectionManager.getAllConnections();
        for (const o of cons) {
            await o.close();
        }
        expect(cons).has.lengthOf(3);
    });
    it("should use round robin", async () => {
        const con1 = await connectionManager.getConnection();
        const con2 = await connectionManager.getConnection();
        await con1.close();
        await con2.close();
        expect(con1.database).to.not.equal("Master");
        expect(con2.database).to.not.equal("Master");
        expect(con1.database).to.not.equal(con2.database);
    });
    it("should use use idle server", async () => {
        const con1 = await connectionManager.getConnection();
        const con2 = await connectionManager.getConnection();
        await con2.close();
        const con3 = await connectionManager.getConnection();
        await con1.close();
        await con3.close();
        expect(con1.database).to.not.equal("Master");
        expect(con2.database).to.not.equal("Master");
        expect(con3.database).to.not.equal("Master");
        expect(con1.database).to.not.equal(con2.database);
        expect(con2.database).to.not.equal(con3.database);
    });
});
