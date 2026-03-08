import { describe, it } from "bun:test";
import { QueryType } from "@elcy/core/src/Common/Enum";
import { BunPosgresqlDriver } from "../src/BunPosgresqlDriver";

describe("DRIVER", async () => {
    const driver = new BunPosgresqlDriver("");
    
    it("should execute query", async () => {
        const connection = await driver.getConnection();
        await connection.open();
        const result = await connection.query({
            query: "SELECT TOP 10 * FROM ORDERS",
            type: QueryType.DQL
        });
        await connection.close();
    });
    it("should commit transaction", async () => {
        const connection = await driver.getConnection();
        await connection.open();
        await connection.startTransaction();
        const result = await connection.query({
            query: "SELECT TOP 10 * FROM ORDERS",
            type: QueryType.DQL
        });
        await connection.commitTransaction();
        await connection.close();
    });
    it("should rollback transaction", async () => {
        const connection = await driver.getConnection();
        await connection.open();
        await connection.startTransaction();
        const result = await connection.query("SELECT TOP 10 * FROM ORDERS");
        await connection.rollbackTransaction();
        await connection.close();
    });
    it("should support nested transaction", async () => {
        const connection = await driver.getConnection();
        await connection.open();
        await connection.startTransaction();
        const result = await connection.query({
            query: "SELECT TOP 10 * FROM ORDERS",
            type: QueryType.DQL
        });
        await connection.startTransaction();
        const result2 = await connection.query({
            query: "SELECT TOP 10 * FROM ORDERS",
            type: QueryType.DQL
        });
        await connection.rollbackTransaction();
        await connection.commitTransaction();
        await connection.close();
    });
    it("should set isolation level", async () => {
        const connection = await driver.getConnection();
        await connection.open();
        await connection.setIsolationLevel("READ UNCOMMITTED");
        await connection.close();
    });
});