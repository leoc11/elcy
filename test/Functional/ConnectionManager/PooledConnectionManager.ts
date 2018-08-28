import { PooledConnectionManager } from "../../../src/Connection/PooledConnectionManager";
import { MssqlDriver } from "../../../src/Driver/Mssql/MssqlDriver";
import "mocha";
import { expect } from "chai";
import "chai-as-promised";
import { ConnectionError } from "../../../src/Error/ConnectionError";

describe("POOLED CONNECTION MANAGER", () => {
    const connectionManager = new PooledConnectionManager(new MssqlDriver({
        host: "localhost\\SQLEXPRESS",
        database: "iSeller_Data_Lotte",
        port: 1433,
        user: "sa",
        password: "password",
        // options: {
        //     trustedConnection: true
        // }
    }), { maxConnection: 2, idleTimeout: 1000, max: 2, min: 1, queueType: "fifo", acquireTimeout: 2000 });

    it("should used pooled connection", async () => {
        const con = await connectionManager.getConnection();
        await con.close();
        const con2 = await connectionManager.getConnection();

        expect(con2).equal(con);
    });
    it("should check maximum allowed connection", async () => {
        await connectionManager.getConnection();
        await connectionManager.getConnection();

        expect(connectionManager.getConnection()).to.be.rejectedWith(ConnectionError);
    });
    it("should release idle connection after exceed idle timeout", async () => {
        const con1 = await connectionManager.getConnection();
        await con1.close();
        await new Promise((resolve) => {
            setTimeout(resolve, 1001);
        });
        const con2 = await connectionManager.getConnection();
        await con2.close();

        expect(con1).not.equal(con2);
    });
    it("should used maximum queued idle connection", async () => {
        const con1 = await connectionManager.getConnection();
        await con1.close();
        const con2 = await connectionManager.getConnection();
        await con2.close();
        expect(connectionManager.pools).has.lengthOf(2);

        const con3 = await connectionManager.getConnection();
        await con3.close();
        expect(connectionManager.pools).has.lengthOf(2);
    });
    it("should used minimum queued idle connection", async () => {
        connectionManager.poolOption.min = 2;
        const con1 = await connectionManager.getConnection();
        await con1.close();
        const con2 = await connectionManager.getConnection();
        await con2.close();
        expect(con1).not.equal(con2);
        const con3 = await connectionManager.getConnection();
        await con3.close();
        expect(con2).to.be.oneOf([con1, con2]);
        connectionManager.poolOption.min = 1;
    });
    it("should used lifo queue type", async () => {
        connectionManager.poolOption.queueType = "lifo";
        const con1 = await connectionManager.getConnection();
        const con2 = await connectionManager.getConnection();
        await con1.close();
        await con2.close();
        const con3 = await connectionManager.getConnection();
        await con3.close();
        expect(con3).to.equal(con2);
        connectionManager.poolOption.queueType = "fifo";
    });
    it("should throw error when exceed acquiretimeout", async () => {
        const con1 = await connectionManager.getConnection();
        const con2 = await connectionManager.getConnection();
        expect(connectionManager.getConnection()).to.eventually.rejectedWith(ConnectionError);
        setTimeout(async () => {
            await con1.close();
            await con2.close();
        }, 2100);
    });
});