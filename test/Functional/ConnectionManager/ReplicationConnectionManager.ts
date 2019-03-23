import { ReplicationConnectionManager } from "../../../src/Connection/ReplicationConnectionManager";
import "mocha";
import { expect } from "chai";
import { MockDriver } from "../../../src/Connection/Mock/MockDriver";

describe("REPLICATION CONNECTION MANAGER", () => {
    const driver = new MockDriver({ database: "Master" });
    const driver2 = new MockDriver({ database: "Replica" });
    const connectionManager = new ReplicationConnectionManager(driver, [driver2]);

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
        await cons.eachAsync(async o => await o.close());
        expect(cons).has.lengthOf(2);
    });
});