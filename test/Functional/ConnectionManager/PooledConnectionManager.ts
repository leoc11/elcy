import "mocha";
import * as chaiPromise from "chai-as-promised";
import { PooledConnectionManager } from "../../../src/Connection/PooledConnectionManager";
import { expect, use } from "chai";
import { ConnectionError } from "../../../src/Error/ConnectionError";
import { IConnectionPoolOption } from "../../../src/Data/Interface/IConnectionOption";
import { MockDriver } from "../../../src/Connection/Mock/MockDriver";

describe("POOLED CONNECTION MANAGER", () => {
    use(chaiPromise);
    const getManager = (option?: IConnectionPoolOption) => {
        if (!option) {
            option = {};
        }
        option = Object.assign({ maxConnection: 3, idleTimeout: 1000, max: 2, min: 0, queueType: "fifo", acquireTimeout: 2000 }, option);
        const manager = new PooledConnectionManager(new MockDriver({ allowPooling: true }), option);
        return manager;
    };

    it("should used pooled connection", async () => {
        const connectionManager = getManager();
        const con = await connectionManager.getConnection();
        await con.close();
        const con2 = await connectionManager.getConnection();
        await con2.close();

        expect(con2).equal(con);
    });
    it("should check maximum allowed connection", async () => {
        const connectionManager = getManager();
        const con1 = await connectionManager.getConnection();
        const con2 = await connectionManager.getConnection();
        const con3 = await connectionManager.getConnection();

        const promise = connectionManager.getConnection();
        expect(promise).to.eventually.be.rejectedWith(ConnectionError).then(async () => {
            await con1.close();
            await con2.close();
            await con3.close();
        });
    });
    it("should release idle connection after exceed idle timeout", async () => {
        const connectionManager = getManager();
        const con1 = await connectionManager.getConnection();
        await con1.close();
        await new Promise((resolve) => {
            setTimeout(() => {
                resolve();
            }, 1001);
        });
        const con2 = await connectionManager.getConnection();
        await con2.close();

        expect(con1).not.equal(con2);
    });
    it("should used maximum queued idle connection", async () => {
        const connectionManager = getManager();
        const con1 = await connectionManager.getConnection();
        const con2 = await connectionManager.getConnection();
        const con3 = await connectionManager.getConnection();
        await con1.close();
        await con2.close();
        expect(connectionManager.poolSize).to.equal(2);

        await con3.close();
        expect(connectionManager.poolSize).to.equal(2);
    });
    it("should used minimum queued idle connection", async () => {
        const connectionManager = getManager({ min: 1 });
        const con1 = await connectionManager.getConnection();
        await con1.close();
        const con2 = await connectionManager.getConnection();
        await con2.close();
        expect(con1).not.equal(con2);
        const con3 = await connectionManager.getConnection();
        await con3.close();
        expect(con3).to.be.oneOf([con1, con2]);
    });
    it("should used lifo queue type", async () => {
        const connectionManager = getManager({ max: 2, queueType: "lifo" });
        const con1 = await connectionManager.getConnection();
        const con2 = await connectionManager.getConnection();
        await con1.close();
        await con2.close();
        expect(connectionManager.poolSize).to.equal(2);
        const con3 = await connectionManager.getConnection();
        await con3.close();
        expect(con3).to.equal(con2);
    });
    it("should throw error when exceed acquiretimeout", async () => {
        const connectionManager = getManager();
        const con1 = await connectionManager.getConnection();
        const con2 = await connectionManager.getConnection();
        const con3 = await connectionManager.getConnection();
        expect(connectionManager.getConnection()).to.be.eventually.rejectedWith(ConnectionError);
        setTimeout(async () => {
            await con1.close();
            await con2.close();
            await con3.close();
        }, 2100);
    });
    it("should prioritize longest waiting client", async () => {
        const connectionManager = getManager({ maxConnection: 2, acquireTimeout: Infinity });
        const con1 = await connectionManager.getConnection();
        const con2 = await connectionManager.getConnection();
        const con2Promise = connectionManager.getConnection();
        const con3Promise = connectionManager.getConnection();
        let rejectedCount = 0;
        const aquires: string[] = [];
        con2Promise.then(() => {
            aquires.push("2");
        }, () => { rejectedCount++; });
        con3Promise.then(() => {
            aquires.push("3");
        }, () => { rejectedCount++; });
        await con1.close();
        expect(connectionManager.poolSize).to.equal(0);
        await con2.close();
        expect(connectionManager.poolSize).to.equal(0);
        await Promise.all([con2Promise, con3Promise]);
        expect(rejectedCount).to.equal(0);
        expect(aquires).to.have.ordered.members(["2", "3"]);
        await con1.close();
        await con2.close();
    });
});