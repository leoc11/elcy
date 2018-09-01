import { ReplicationConnectionManager } from "../../../src/Connection/ReplicationConnectionManager";
import { MssqlDriver } from "../../../src/Driver/Mssql/MssqlDriver";
import "mocha";
import { expect } from "chai";

describe("REPLICATION CONNECTION MANAGER", () => {
    const driver = new MssqlDriver({
        host: "Master",
        database: "Master",
        port: 1433,
        user: "sa",
        password: "password",
    });
    const driver2 = new MssqlDriver({
        host: "Replica",
        database: "Replica",
        port: 1433,
        user: "sa",
        password: "password",
    });
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
        const cons = await connectionManager.getAllServerConnections();
        await cons.eachAsync(async o => await o.close());
        expect(cons).has.lengthOf(2);
    });
});