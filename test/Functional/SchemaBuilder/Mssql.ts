import { SchemaContext } from "./Entities/SchemaContext";
import * as sinon from "sinon";
import * as chai from "chai";
import { MockConnection } from "../../../src/Connection/Mock/MockConnection";
import { Schema } from "./Entities/Schema";
import { QueryType } from "../../../src/Common/Type";
import { SubSchema } from "./Entities/SubSchema";

const db = new SchemaContext();
beforeEach(async () => {
    db.connection = await db.getConnection();
});
afterEach(() => {
    db.clear();
    sinon.restore();
    db.closeConnection();
});

describe("SCHEMA BUILDER", () => {
    describe("ENTITY", () => {
        it("should create new table correctly", async () => {
            const mockConnection = db.connection as MockConnection;
            mockConnection.results = [
                { rows: [{ "SCHEMA": "dbo" }], effectedRows: 1 },
                { rows: [], effectedRows: 0 },
                { rows: [], effectedRows: 0 },
                { effectedRows: 0 },
                { rows: [], effectedRows: 0 },
                { rows: [], effectedRows: 0 },
                { effectedRows: 0 },
                { rows: [], effectedRows: 0 },
                { rows: [], effectedRows: 0 }
            ];

            const schemaQuery = await db.getUpdateSchemaQueries([Schema, SubSchema]);

            chai.should();
            schemaQuery.should.deep.equal({
                commit: [
                    {
                        query: "CREATE TABLE [dbo].[Schema]\n(\n\t[primaryKey] int NOT NULL IDENTITY(1,1),\n\t[boolean] bit NOT NULL,\n\t[decimal] decimal(13) NOT NULL,\n\t[enum] nvarchar(255) NOT NULL,\n\t[identifier] uniqueidentifier NOT NULL,\n\t[integer] int NOT NULL,\n\t[nullable] bit,\n\t[real] real NOT NULL,\n\t[rowVersion] timestamp NOT NULL,\n\t[string] nvarchar(150) DEFAULT 'empty' NOT NULL,\n\t[date] date NOT NULL,\n\t[time] time(7) NOT NULL,\n\t[timeUTC] time(7) NOT NULL,\n\t[dateTime] date NOT NULL,\n\t[dateTimeUTC] date NOT NULL,\n\t[createdDate] date DEFAULT CURRENT_TIMESTAMP NOT NULL,\n\t[modifiedDate] date DEFAULT CURRENT_TIMESTAMP NOT NULL,\n\t[deleted] bit DEFAULT 0 NOT NULL,\n\tCONSTRAINT [PK_Schema] PRIMARY KEY ([primaryKey]),\n\tCONSTRAINT [CK_Schema_decimal] CHECK (([decimal] >= 0)),\n\tCONSTRAINT [UQ_Schema_identifier] UNIQUE ([identifier]),\n\tCONSTRAINT [Schema_entity_unique] UNIQUE ([decimal],[real]),\n\tCONSTRAINT [Schema_entity_check] CHECK (([decimal] > [integer]))\n)",
                        type: QueryType.DDL
                    },
                    {
                        query: "CREATE INDEX IX_deleted ON [Schema] ([deleted])",
                        type: QueryType.DDL
                    },
                    {
                        query: "CREATE TABLE [dbo].[SubSchema]\n(\n\t[identifier] uniqueidentifier NOT NULL,\n\t[name] nvarchar(255) NOT NULL,\n\tCONSTRAINT [PK_SubSchema] PRIMARY KEY ([identifier])\n)",
                        type: QueryType.DDL
                    },
                    {
                        query: "ALTER TABLE [dbo].[SubSchema] ADD CONSTRAINT [own_Schema_SubSchema] FOREIGN KEY ([identifier]) REFERENCES [dbo].[Schema] ([identifier])",
                        type: QueryType.DDL
                    }
                ],
                rollback: [
                    {
                        query: "ALTER TABLE [dbo].[SubSchema] DROP CONSTRAINT [own_Schema_SubSchema]",
                        type: QueryType.DDL
                    },
                    {
                        query: "DROP TABLE [dbo].[Schema]",
                        type: QueryType.DDL
                    },
                    {
                        query: "DROP TABLE [dbo].[SubSchema]",
                        type: QueryType.DDL
                    }
                ]
            });
        });
        it("should update table accordingly", () => {
            // update table collation/charset
        });
    });
    describe("COLUMN", () => {
        it("should add new column", () => {
            // add simple and identity column
        });
        it("should update column", () => {
            // add default, column type, identity, nullable, and options
        });
        it("should update column 2", () => {
            // remove default, column type, identity, nullable, and options
        });
        it("should remove column", () => {
            // remove simple and identity column
        });
        it("should add implicit fk column", () => {
            // check naming
        });
        it("should add implicit created, update, delete column", () => {
            // check naming
        });
        it("should remove implicit created, update, delete column", () => {
            // check naming
        });
    });
    describe("INDEX", () => {
        it("should add index", () => {
            // index defined in entity and column
        });
        it("should remove index", () => {
            // index defined in entity and column
        });
    });
    describe("CHECK CONSTRAINT", () => {
        it("should add check", () => {
            // index defined in entity and column
        });
        it("should update check", () => {
            // index defined in entity and column
        });
        it("should remove check", () => {
            // index defined in entity and column
        });
    });
    describe("UNIQUE CONSTRAINT", () => {
        it("should add unique", () => {
            // index defined in entity and column
        });
        it("should update unique", () => {
            // index defined in entity and column
        });
        it("should remove unique", () => {
            // index defined in entity and column
        });
    });
    describe("RELATION", () => {
        it("should add fk", () => {
            // all relation type
        });
        it("should update fk", () => {
            // index defined in entity and column
        });
        it("should remove fk", () => {
            // index defined in entity and column
        });
        it("should add relation data table", () => {
            // index defined in entity and column
        });
    });
});