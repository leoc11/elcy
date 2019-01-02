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
            const mockConnection = (db.connection instanceof PooledConnection ? db.connection.connection : db.connection) as MockConnection;
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
        it("should not detect any changes", async () => {
            const mockConnection = (db.connection instanceof PooledConnection ? db.connection.connection : db.connection) as MockConnection;
            mockConnection.results = [
                {
                    "rows": [{
                        "TABLE_CATALOG": "Database",
                        "TABLE_SCHEMA": "dbo",
                        "TABLE_NAME": "Schema",
                        "TABLE_TYPE": "BASE TABLE"
                    }, {
                        "TABLE_CATALOG": "Database",
                        "TABLE_SCHEMA": "dbo",
                        "TABLE_NAME": "SubSchema",
                        "TABLE_TYPE": "BASE TABLE"
                    }],
                    "effectedRows": 2
                }, {
                    "rows": [{
                        "TABLE_CATALOG": "Database",
                        "TABLE_SCHEMA": "dbo",
                        "TABLE_NAME": "Schema",
                        "COLUMN_NAME": "primaryKey",
                        "ORDINAL_POSITION": 1,
                        "COLUMN_DEFAULT": null,
                        "IS_NULLABLE": "NO",
                        "DATA_TYPE": "int",
                        "CHARACTER_MAXIMUM_LENGTH": null,
                        "CHARACTER_OCTET_LENGTH": null,
                        "NUMERIC_PRECISION": 10,
                        "NUMERIC_PRECISION_RADIX": 10,
                        "NUMERIC_SCALE": 0,
                        "DATETIME_PRECISION": null,
                        "CHARACTER_SET_CATALOG": null,
                        "CHARACTER_SET_SCHEMA": null,
                        "CHARACTER_SET_NAME": null,
                        "COLLATION_CATALOG": null,
                        "COLLATION_SCHEMA": null,
                        "COLLATION_NAME": null,
                        "DOMAIN_CATALOG": null,
                        "DOMAIN_SCHEMA": null,
                        "DOMAIN_NAME": null,
                        "IS_IDENTITY": true
                    }, {
                        "TABLE_CATALOG": "Database",
                        "TABLE_SCHEMA": "dbo",
                        "TABLE_NAME": "Schema",
                        "COLUMN_NAME": "boolean",
                        "ORDINAL_POSITION": 2,
                        "COLUMN_DEFAULT": null,
                        "IS_NULLABLE": "NO",
                        "DATA_TYPE": "bit",
                        "CHARACTER_MAXIMUM_LENGTH": null,
                        "CHARACTER_OCTET_LENGTH": null,
                        "NUMERIC_PRECISION": null,
                        "NUMERIC_PRECISION_RADIX": null,
                        "NUMERIC_SCALE": null,
                        "DATETIME_PRECISION": null,
                        "CHARACTER_SET_CATALOG": null,
                        "CHARACTER_SET_SCHEMA": null,
                        "CHARACTER_SET_NAME": null,
                        "COLLATION_CATALOG": null,
                        "COLLATION_SCHEMA": null,
                        "COLLATION_NAME": null,
                        "DOMAIN_CATALOG": null,
                        "DOMAIN_SCHEMA": null,
                        "DOMAIN_NAME": null,
                        "IS_IDENTITY": false
                    }, {
                        "TABLE_CATALOG": "Database",
                        "TABLE_SCHEMA": "dbo",
                        "TABLE_NAME": "Schema",
                        "COLUMN_NAME": "decimal",
                        "ORDINAL_POSITION": 3,
                        "COLUMN_DEFAULT": null,
                        "IS_NULLABLE": "NO",
                        "DATA_TYPE": "decimal",
                        "CHARACTER_MAXIMUM_LENGTH": null,
                        "CHARACTER_OCTET_LENGTH": null,
                        "NUMERIC_PRECISION": 10,
                        "NUMERIC_PRECISION_RADIX": 10,
                        "NUMERIC_SCALE": 2,
                        "DATETIME_PRECISION": null,
                        "CHARACTER_SET_CATALOG": null,
                        "CHARACTER_SET_SCHEMA": null,
                        "CHARACTER_SET_NAME": null,
                        "COLLATION_CATALOG": null,
                        "COLLATION_SCHEMA": null,
                        "COLLATION_NAME": null,
                        "DOMAIN_CATALOG": null,
                        "DOMAIN_SCHEMA": null,
                        "DOMAIN_NAME": null,
                        "IS_IDENTITY": false
                    }, {
                        "TABLE_CATALOG": "Database",
                        "TABLE_SCHEMA": "dbo",
                        "TABLE_NAME": "Schema",
                        "COLUMN_NAME": "enum",
                        "ORDINAL_POSITION": 4,
                        "COLUMN_DEFAULT": null,
                        "IS_NULLABLE": "NO",
                        "DATA_TYPE": "nvarchar",
                        "CHARACTER_MAXIMUM_LENGTH": 255,
                        "CHARACTER_OCTET_LENGTH": 510,
                        "NUMERIC_PRECISION": null,
                        "NUMERIC_PRECISION_RADIX": null,
                        "NUMERIC_SCALE": null,
                        "DATETIME_PRECISION": null,
                        "CHARACTER_SET_CATALOG": null,
                        "CHARACTER_SET_SCHEMA": null,
                        "CHARACTER_SET_NAME": "UNICODE",
                        "COLLATION_CATALOG": null,
                        "COLLATION_SCHEMA": null,
                        "COLLATION_NAME": "SQL_Latin1_General_CP1_CI_AS",
                        "DOMAIN_CATALOG": null,
                        "DOMAIN_SCHEMA": null,
                        "DOMAIN_NAME": null,
                        "IS_IDENTITY": false
                    }, {
                        "TABLE_CATALOG": "Database",
                        "TABLE_SCHEMA": "dbo",
                        "TABLE_NAME": "Schema",
                        "COLUMN_NAME": "identifier",
                        "ORDINAL_POSITION": 5,
                        "COLUMN_DEFAULT": null,
                        "IS_NULLABLE": "NO",
                        "DATA_TYPE": "uniqueidentifier",
                        "CHARACTER_MAXIMUM_LENGTH": null,
                        "CHARACTER_OCTET_LENGTH": null,
                        "NUMERIC_PRECISION": null,
                        "NUMERIC_PRECISION_RADIX": null,
                        "NUMERIC_SCALE": null,
                        "DATETIME_PRECISION": null,
                        "CHARACTER_SET_CATALOG": null,
                        "CHARACTER_SET_SCHEMA": null,
                        "CHARACTER_SET_NAME": null,
                        "COLLATION_CATALOG": null,
                        "COLLATION_SCHEMA": null,
                        "COLLATION_NAME": null,
                        "DOMAIN_CATALOG": null,
                        "DOMAIN_SCHEMA": null,
                        "DOMAIN_NAME": null,
                        "IS_IDENTITY": false
                    }, {
                        "TABLE_CATALOG": "Database",
                        "TABLE_SCHEMA": "dbo",
                        "TABLE_NAME": "Schema",
                        "COLUMN_NAME": "integer",
                        "ORDINAL_POSITION": 6,
                        "COLUMN_DEFAULT": null,
                        "IS_NULLABLE": "NO",
                        "DATA_TYPE": "int",
                        "CHARACTER_MAXIMUM_LENGTH": null,
                        "CHARACTER_OCTET_LENGTH": null,
                        "NUMERIC_PRECISION": 10,
                        "NUMERIC_PRECISION_RADIX": 10,
                        "NUMERIC_SCALE": 0,
                        "DATETIME_PRECISION": null,
                        "CHARACTER_SET_CATALOG": null,
                        "CHARACTER_SET_SCHEMA": null,
                        "CHARACTER_SET_NAME": null,
                        "COLLATION_CATALOG": null,
                        "COLLATION_SCHEMA": null,
                        "COLLATION_NAME": null,
                        "DOMAIN_CATALOG": null,
                        "DOMAIN_SCHEMA": null,
                        "DOMAIN_NAME": null,
                        "IS_IDENTITY": false
                    }, {
                        "TABLE_CATALOG": "Database",
                        "TABLE_SCHEMA": "dbo",
                        "TABLE_NAME": "Schema",
                        "COLUMN_NAME": "nullable",
                        "ORDINAL_POSITION": 7,
                        "COLUMN_DEFAULT": null,
                        "IS_NULLABLE": "YES",
                        "DATA_TYPE": "bit",
                        "CHARACTER_MAXIMUM_LENGTH": null,
                        "CHARACTER_OCTET_LENGTH": null,
                        "NUMERIC_PRECISION": null,
                        "NUMERIC_PRECISION_RADIX": null,
                        "NUMERIC_SCALE": null,
                        "DATETIME_PRECISION": null,
                        "CHARACTER_SET_CATALOG": null,
                        "CHARACTER_SET_SCHEMA": null,
                        "CHARACTER_SET_NAME": null,
                        "COLLATION_CATALOG": null,
                        "COLLATION_SCHEMA": null,
                        "COLLATION_NAME": null,
                        "DOMAIN_CATALOG": null,
                        "DOMAIN_SCHEMA": null,
                        "DOMAIN_NAME": null,
                        "IS_IDENTITY": false
                    }, {
                        "TABLE_CATALOG": "Database",
                        "TABLE_SCHEMA": "dbo",
                        "TABLE_NAME": "Schema",
                        "COLUMN_NAME": "real",
                        "ORDINAL_POSITION": 8,
                        "COLUMN_DEFAULT": null,
                        "IS_NULLABLE": "NO",
                        "DATA_TYPE": "real",
                        "CHARACTER_MAXIMUM_LENGTH": null,
                        "CHARACTER_OCTET_LENGTH": null,
                        "NUMERIC_PRECISION": 24,
                        "NUMERIC_PRECISION_RADIX": 2,
                        "NUMERIC_SCALE": null,
                        "DATETIME_PRECISION": null,
                        "CHARACTER_SET_CATALOG": null,
                        "CHARACTER_SET_SCHEMA": null,
                        "CHARACTER_SET_NAME": null,
                        "COLLATION_CATALOG": null,
                        "COLLATION_SCHEMA": null,
                        "COLLATION_NAME": null,
                        "DOMAIN_CATALOG": null,
                        "DOMAIN_SCHEMA": null,
                        "DOMAIN_NAME": null,
                        "IS_IDENTITY": false
                    }, {
                        "TABLE_CATALOG": "Database",
                        "TABLE_SCHEMA": "dbo",
                        "TABLE_NAME": "Schema",
                        "COLUMN_NAME": "rowVersion",
                        "ORDINAL_POSITION": 9,
                        "COLUMN_DEFAULT": null,
                        "IS_NULLABLE": "NO",
                        "DATA_TYPE": "timestamp",
                        "CHARACTER_MAXIMUM_LENGTH": null,
                        "CHARACTER_OCTET_LENGTH": null,
                        "NUMERIC_PRECISION": null,
                        "NUMERIC_PRECISION_RADIX": null,
                        "NUMERIC_SCALE": null,
                        "DATETIME_PRECISION": null,
                        "CHARACTER_SET_CATALOG": null,
                        "CHARACTER_SET_SCHEMA": null,
                        "CHARACTER_SET_NAME": null,
                        "COLLATION_CATALOG": null,
                        "COLLATION_SCHEMA": null,
                        "COLLATION_NAME": null,
                        "DOMAIN_CATALOG": null,
                        "DOMAIN_SCHEMA": null,
                        "DOMAIN_NAME": null,
                        "IS_IDENTITY": false
                    }, {
                        "TABLE_CATALOG": "Database",
                        "TABLE_SCHEMA": "dbo",
                        "TABLE_NAME": "Schema",
                        "COLUMN_NAME": "string",
                        "ORDINAL_POSITION": 10,
                        "COLUMN_DEFAULT": "('empty')",
                        "IS_NULLABLE": "NO",
                        "DATA_TYPE": "nvarchar",
                        "CHARACTER_MAXIMUM_LENGTH": 150,
                        "CHARACTER_OCTET_LENGTH": 300,
                        "NUMERIC_PRECISION": null,
                        "NUMERIC_PRECISION_RADIX": null,
                        "NUMERIC_SCALE": null,
                        "DATETIME_PRECISION": null,
                        "CHARACTER_SET_CATALOG": null,
                        "CHARACTER_SET_SCHEMA": null,
                        "CHARACTER_SET_NAME": "UNICODE",
                        "COLLATION_CATALOG": null,
                        "COLLATION_SCHEMA": null,
                        "COLLATION_NAME": "SQL_Latin1_General_CP1_CI_AS",
                        "DOMAIN_CATALOG": null,
                        "DOMAIN_SCHEMA": null,
                        "DOMAIN_NAME": null,
                        "IS_IDENTITY": false
                    }, {
                        "TABLE_CATALOG": "Database",
                        "TABLE_SCHEMA": "dbo",
                        "TABLE_NAME": "Schema",
                        "COLUMN_NAME": "date",
                        "ORDINAL_POSITION": 11,
                        "COLUMN_DEFAULT": null,
                        "IS_NULLABLE": "NO",
                        "DATA_TYPE": "date",
                        "CHARACTER_MAXIMUM_LENGTH": null,
                        "CHARACTER_OCTET_LENGTH": null,
                        "NUMERIC_PRECISION": null,
                        "NUMERIC_PRECISION_RADIX": null,
                        "NUMERIC_SCALE": null,
                        "DATETIME_PRECISION": 0,
                        "CHARACTER_SET_CATALOG": null,
                        "CHARACTER_SET_SCHEMA": null,
                        "CHARACTER_SET_NAME": null,
                        "COLLATION_CATALOG": null,
                        "COLLATION_SCHEMA": null,
                        "COLLATION_NAME": null,
                        "DOMAIN_CATALOG": null,
                        "DOMAIN_SCHEMA": null,
                        "DOMAIN_NAME": null,
                        "IS_IDENTITY": false
                    }, {
                        "TABLE_CATALOG": "Database",
                        "TABLE_SCHEMA": "dbo",
                        "TABLE_NAME": "Schema",
                        "COLUMN_NAME": "time",
                        "ORDINAL_POSITION": 12,
                        "COLUMN_DEFAULT": null,
                        "IS_NULLABLE": "NO",
                        "DATA_TYPE": "time",
                        "CHARACTER_MAXIMUM_LENGTH": null,
                        "CHARACTER_OCTET_LENGTH": null,
                        "NUMERIC_PRECISION": null,
                        "NUMERIC_PRECISION_RADIX": null,
                        "NUMERIC_SCALE": null,
                        "DATETIME_PRECISION": 7,
                        "CHARACTER_SET_CATALOG": null,
                        "CHARACTER_SET_SCHEMA": null,
                        "CHARACTER_SET_NAME": null,
                        "COLLATION_CATALOG": null,
                        "COLLATION_SCHEMA": null,
                        "COLLATION_NAME": null,
                        "DOMAIN_CATALOG": null,
                        "DOMAIN_SCHEMA": null,
                        "DOMAIN_NAME": null,
                        "IS_IDENTITY": false
                    }, {
                        "TABLE_CATALOG": "Database",
                        "TABLE_SCHEMA": "dbo",
                        "TABLE_NAME": "Schema",
                        "COLUMN_NAME": "timeUTC",
                        "ORDINAL_POSITION": 13,
                        "COLUMN_DEFAULT": null,
                        "IS_NULLABLE": "NO",
                        "DATA_TYPE": "time",
                        "CHARACTER_MAXIMUM_LENGTH": null,
                        "CHARACTER_OCTET_LENGTH": null,
                        "NUMERIC_PRECISION": null,
                        "NUMERIC_PRECISION_RADIX": null,
                        "NUMERIC_SCALE": null,
                        "DATETIME_PRECISION": 5,
                        "CHARACTER_SET_CATALOG": null,
                        "CHARACTER_SET_SCHEMA": null,
                        "CHARACTER_SET_NAME": null,
                        "COLLATION_CATALOG": null,
                        "COLLATION_SCHEMA": null,
                        "COLLATION_NAME": null,
                        "DOMAIN_CATALOG": null,
                        "DOMAIN_SCHEMA": null,
                        "DOMAIN_NAME": null,
                        "IS_IDENTITY": false
                    }, {
                        "TABLE_CATALOG": "Database",
                        "TABLE_SCHEMA": "dbo",
                        "TABLE_NAME": "Schema",
                        "COLUMN_NAME": "dateTime",
                        "ORDINAL_POSITION": 14,
                        "COLUMN_DEFAULT": null,
                        "IS_NULLABLE": "NO",
                        "DATA_TYPE": "date",
                        "CHARACTER_MAXIMUM_LENGTH": null,
                        "CHARACTER_OCTET_LENGTH": null,
                        "NUMERIC_PRECISION": null,
                        "NUMERIC_PRECISION_RADIX": null,
                        "NUMERIC_SCALE": null,
                        "DATETIME_PRECISION": 0,
                        "CHARACTER_SET_CATALOG": null,
                        "CHARACTER_SET_SCHEMA": null,
                        "CHARACTER_SET_NAME": null,
                        "COLLATION_CATALOG": null,
                        "COLLATION_SCHEMA": null,
                        "COLLATION_NAME": null,
                        "DOMAIN_CATALOG": null,
                        "DOMAIN_SCHEMA": null,
                        "DOMAIN_NAME": null,
                        "IS_IDENTITY": false
                    }, {
                        "TABLE_CATALOG": "Database",
                        "TABLE_SCHEMA": "dbo",
                        "TABLE_NAME": "Schema",
                        "COLUMN_NAME": "dateTimeUTC",
                        "ORDINAL_POSITION": 15,
                        "COLUMN_DEFAULT": null,
                        "IS_NULLABLE": "NO",
                        "DATA_TYPE": "date",
                        "CHARACTER_MAXIMUM_LENGTH": null,
                        "CHARACTER_OCTET_LENGTH": null,
                        "NUMERIC_PRECISION": null,
                        "NUMERIC_PRECISION_RADIX": null,
                        "NUMERIC_SCALE": null,
                        "DATETIME_PRECISION": 0,
                        "CHARACTER_SET_CATALOG": null,
                        "CHARACTER_SET_SCHEMA": null,
                        "CHARACTER_SET_NAME": null,
                        "COLLATION_CATALOG": null,
                        "COLLATION_SCHEMA": null,
                        "COLLATION_NAME": null,
                        "DOMAIN_CATALOG": null,
                        "DOMAIN_SCHEMA": null,
                        "DOMAIN_NAME": null,
                        "IS_IDENTITY": false
                    }, {
                        "TABLE_CATALOG": "Database",
                        "TABLE_SCHEMA": "dbo",
                        "TABLE_NAME": "Schema",
                        "COLUMN_NAME": "createdDate",
                        "ORDINAL_POSITION": 16,
                        "COLUMN_DEFAULT": "(getutcdate())",
                        "IS_NULLABLE": "NO",
                        "DATA_TYPE": "date",
                        "CHARACTER_MAXIMUM_LENGTH": null,
                        "CHARACTER_OCTET_LENGTH": null,
                        "NUMERIC_PRECISION": null,
                        "NUMERIC_PRECISION_RADIX": null,
                        "NUMERIC_SCALE": null,
                        "DATETIME_PRECISION": 0,
                        "CHARACTER_SET_CATALOG": null,
                        "CHARACTER_SET_SCHEMA": null,
                        "CHARACTER_SET_NAME": null,
                        "COLLATION_CATALOG": null,
                        "COLLATION_SCHEMA": null,
                        "COLLATION_NAME": null,
                        "DOMAIN_CATALOG": null,
                        "DOMAIN_SCHEMA": null,
                        "DOMAIN_NAME": null,
                        "IS_IDENTITY": false
                    }, {
                        "TABLE_CATALOG": "Database",
                        "TABLE_SCHEMA": "dbo",
                        "TABLE_NAME": "Schema",
                        "COLUMN_NAME": "modifiedDate",
                        "ORDINAL_POSITION": 17,
                        "COLUMN_DEFAULT": "(getutcdate())",
                        "IS_NULLABLE": "NO",
                        "DATA_TYPE": "date",
                        "CHARACTER_MAXIMUM_LENGTH": null,
                        "CHARACTER_OCTET_LENGTH": null,
                        "NUMERIC_PRECISION": null,
                        "NUMERIC_PRECISION_RADIX": null,
                        "NUMERIC_SCALE": null,
                        "DATETIME_PRECISION": 0,
                        "CHARACTER_SET_CATALOG": null,
                        "CHARACTER_SET_SCHEMA": null,
                        "CHARACTER_SET_NAME": null,
                        "COLLATION_CATALOG": null,
                        "COLLATION_SCHEMA": null,
                        "COLLATION_NAME": null,
                        "DOMAIN_CATALOG": null,
                        "DOMAIN_SCHEMA": null,
                        "DOMAIN_NAME": null,
                        "IS_IDENTITY": false
                    }, {
                        "TABLE_CATALOG": "Database",
                        "TABLE_SCHEMA": "dbo",
                        "TABLE_NAME": "Schema",
                        "COLUMN_NAME": "deleted",
                        "ORDINAL_POSITION": 18,
                        "COLUMN_DEFAULT": "((0))",
                        "IS_NULLABLE": "NO",
                        "DATA_TYPE": "bit",
                        "CHARACTER_MAXIMUM_LENGTH": null,
                        "CHARACTER_OCTET_LENGTH": null,
                        "NUMERIC_PRECISION": null,
                        "NUMERIC_PRECISION_RADIX": null,
                        "NUMERIC_SCALE": null,
                        "DATETIME_PRECISION": null,
                        "CHARACTER_SET_CATALOG": null,
                        "CHARACTER_SET_SCHEMA": null,
                        "CHARACTER_SET_NAME": null,
                        "COLLATION_CATALOG": null,
                        "COLLATION_SCHEMA": null,
                        "COLLATION_NAME": null,
                        "DOMAIN_CATALOG": null,
                        "DOMAIN_SCHEMA": null,
                        "DOMAIN_NAME": null,
                        "IS_IDENTITY": false
                    }, {
                        "TABLE_CATALOG": "Database",
                        "TABLE_SCHEMA": "dbo",
                        "TABLE_NAME": "SubSchema",
                        "COLUMN_NAME": "identifier",
                        "ORDINAL_POSITION": 1,
                        "COLUMN_DEFAULT": null,
                        "IS_NULLABLE": "NO",
                        "DATA_TYPE": "uniqueidentifier",
                        "CHARACTER_MAXIMUM_LENGTH": null,
                        "CHARACTER_OCTET_LENGTH": null,
                        "NUMERIC_PRECISION": null,
                        "NUMERIC_PRECISION_RADIX": null,
                        "NUMERIC_SCALE": null,
                        "DATETIME_PRECISION": null,
                        "CHARACTER_SET_CATALOG": null,
                        "CHARACTER_SET_SCHEMA": null,
                        "CHARACTER_SET_NAME": null,
                        "COLLATION_CATALOG": null,
                        "COLLATION_SCHEMA": null,
                        "COLLATION_NAME": null,
                        "DOMAIN_CATALOG": null,
                        "DOMAIN_SCHEMA": null,
                        "DOMAIN_NAME": null,
                        "IS_IDENTITY": false
                    }, {
                        "TABLE_CATALOG": "Database",
                        "TABLE_SCHEMA": "dbo",
                        "TABLE_NAME": "SubSchema",
                        "COLUMN_NAME": "name",
                        "ORDINAL_POSITION": 2,
                        "COLUMN_DEFAULT": null,
                        "IS_NULLABLE": "NO",
                        "DATA_TYPE": "nvarchar",
                        "CHARACTER_MAXIMUM_LENGTH": 255,
                        "CHARACTER_OCTET_LENGTH": 510,
                        "NUMERIC_PRECISION": null,
                        "NUMERIC_PRECISION_RADIX": null,
                        "NUMERIC_SCALE": null,
                        "DATETIME_PRECISION": null,
                        "CHARACTER_SET_CATALOG": null,
                        "CHARACTER_SET_SCHEMA": null,
                        "CHARACTER_SET_NAME": "UNICODE",
                        "COLLATION_CATALOG": null,
                        "COLLATION_SCHEMA": null,
                        "COLLATION_NAME": "SQL_Latin1_General_CP1_CI_AS",
                        "DOMAIN_CATALOG": null,
                        "DOMAIN_SCHEMA": null,
                        "DOMAIN_NAME": null,
                        "IS_IDENTITY": false
                    }],
                    "effectedRows": 20
                }, {
                    "effectedRows": 7
                }, {
                    "rows": [{
                        "CONSTRAINT_CATALOG": "Database",
                        "CONSTRAINT_SCHEMA": "dbo",
                        "CONSTRAINT_NAME": "PK_Schema",
                        "TABLE_CATALOG": "Database",
                        "TABLE_SCHEMA": "dbo",
                        "TABLE_NAME": "Schema",
                        "CONSTRAINT_TYPE": "PRIMARY KEY",
                        "IS_DEFERRABLE": "NO",
                        "INITIALLY_DEFERRED": "NO",
                        "CHECK_CLAUSE": null
                    }, {
                        "CONSTRAINT_CATALOG": "Database",
                        "CONSTRAINT_SCHEMA": "dbo",
                        "CONSTRAINT_NAME": "Schema_entity_unique",
                        "TABLE_CATALOG": "Database",
                        "TABLE_SCHEMA": "dbo",
                        "TABLE_NAME": "Schema",
                        "CONSTRAINT_TYPE": "UNIQUE",
                        "IS_DEFERRABLE": "NO",
                        "INITIALLY_DEFERRED": "NO",
                        "CHECK_CLAUSE": null
                    }, {
                        "CONSTRAINT_CATALOG": "Database",
                        "CONSTRAINT_SCHEMA": "dbo",
                        "CONSTRAINT_NAME": "UQ_Schema_identifier",
                        "TABLE_CATALOG": "Database",
                        "TABLE_SCHEMA": "dbo",
                        "TABLE_NAME": "Schema",
                        "CONSTRAINT_TYPE": "UNIQUE",
                        "IS_DEFERRABLE": "NO",
                        "INITIALLY_DEFERRED": "NO",
                        "CHECK_CLAUSE": null
                    }, {
                        "CONSTRAINT_CATALOG": "Database",
                        "CONSTRAINT_SCHEMA": "dbo",
                        "CONSTRAINT_NAME": "CK_Schema_decimal",
                        "TABLE_CATALOG": "Database",
                        "TABLE_SCHEMA": "dbo",
                        "TABLE_NAME": "Schema",
                        "CONSTRAINT_TYPE": "CHECK",
                        "IS_DEFERRABLE": "NO",
                        "INITIALLY_DEFERRED": "NO",
                        "CHECK_CLAUSE": "([decimal]>=(0))"
                    }, {
                        "CONSTRAINT_CATALOG": "Database",
                        "CONSTRAINT_SCHEMA": "dbo",
                        "CONSTRAINT_NAME": "Schema_entity_check",
                        "TABLE_CATALOG": "Database",
                        "TABLE_SCHEMA": "dbo",
                        "TABLE_NAME": "Schema",
                        "CONSTRAINT_TYPE": "CHECK",
                        "IS_DEFERRABLE": "NO",
                        "INITIALLY_DEFERRED": "NO",
                        "CHECK_CLAUSE": "([decimal]>[integer])"
                    }, {
                        "CONSTRAINT_CATALOG": "Database",
                        "CONSTRAINT_SCHEMA": "dbo",
                        "CONSTRAINT_NAME": "PK_SubSchema",
                        "TABLE_CATALOG": "Database",
                        "TABLE_SCHEMA": "dbo",
                        "TABLE_NAME": "SubSchema",
                        "CONSTRAINT_TYPE": "PRIMARY KEY",
                        "IS_DEFERRABLE": "NO",
                        "INITIALLY_DEFERRED": "NO",
                        "CHECK_CLAUSE": null
                    }, {
                        "CONSTRAINT_CATALOG": "Database",
                        "CONSTRAINT_SCHEMA": "dbo",
                        "CONSTRAINT_NAME": "own_Schema_SubSchema",
                        "TABLE_CATALOG": "Database",
                        "TABLE_SCHEMA": "dbo",
                        "TABLE_NAME": "SubSchema",
                        "CONSTRAINT_TYPE": "FOREIGN KEY",
                        "IS_DEFERRABLE": "NO",
                        "INITIALLY_DEFERRED": "NO",
                        "CHECK_CLAUSE": null
                    }],
                    "effectedRows": 7
                }, {
                    "rows": [{
                        "CONSTRAINT_CATALOG": "Database",
                        "CONSTRAINT_SCHEMA": "dbo",
                        "CONSTRAINT_NAME": "own_Schema_SubSchema",
                        "UNIQUE_CONSTRAINT_CATALOG": "Database",
                        "UNIQUE_CONSTRAINT_SCHEMA": "dbo",
                        "UNIQUE_CONSTRAINT_NAME": "UQ_Schema_identifier",
                        "MATCH_OPTION": "SIMPLE",
                        "UPDATE_RULE": "NO ACTION",
                        "DELETE_RULE": "NO ACTION"
                    }],
                    "effectedRows": 1
                }, {
                    "effectedRows": 0
                }, {
                    "rows": [{
                        "TABLE_CATALOG": "Database",
                        "TABLE_SCHEMA": "dbo",
                        "TABLE_NAME": "SubSchema",
                        "COLUMN_NAME": "identifier",
                        "CONSTRAINT_CATALOG": "Database",
                        "CONSTRAINT_SCHEMA": "dbo",
                        "CONSTRAINT_NAME": "own_Schema_SubSchema"
                    }, {
                        "TABLE_CATALOG": "Database",
                        "TABLE_SCHEMA": "dbo",
                        "TABLE_NAME": "Schema",
                        "COLUMN_NAME": "primaryKey",
                        "CONSTRAINT_CATALOG": "Database",
                        "CONSTRAINT_SCHEMA": "dbo",
                        "CONSTRAINT_NAME": "PK_Schema"
                    }, {
                        "TABLE_CATALOG": "Database",
                        "TABLE_SCHEMA": "dbo",
                        "TABLE_NAME": "SubSchema",
                        "COLUMN_NAME": "identifier",
                        "CONSTRAINT_CATALOG": "Database",
                        "CONSTRAINT_SCHEMA": "dbo",
                        "CONSTRAINT_NAME": "PK_SubSchema"
                    }, {
                        "TABLE_CATALOG": "Database",
                        "TABLE_SCHEMA": "dbo",
                        "TABLE_NAME": "Schema",
                        "COLUMN_NAME": "decimal",
                        "CONSTRAINT_CATALOG": "Database",
                        "CONSTRAINT_SCHEMA": "dbo",
                        "CONSTRAINT_NAME": "Schema_entity_unique"
                    }, {
                        "TABLE_CATALOG": "Database",
                        "TABLE_SCHEMA": "dbo",
                        "TABLE_NAME": "Schema",
                        "COLUMN_NAME": "real",
                        "CONSTRAINT_CATALOG": "Database",
                        "CONSTRAINT_SCHEMA": "dbo",
                        "CONSTRAINT_NAME": "Schema_entity_unique"
                    }, {
                        "TABLE_CATALOG": "Database",
                        "TABLE_SCHEMA": "dbo",
                        "TABLE_NAME": "Schema",
                        "COLUMN_NAME": "identifier",
                        "CONSTRAINT_CATALOG": "Database",
                        "CONSTRAINT_SCHEMA": "dbo",
                        "CONSTRAINT_NAME": "UQ_Schema_identifier"
                    }, {
                        "TABLE_CATALOG": "Database",
                        "TABLE_SCHEMA": "dbo",
                        "TABLE_NAME": "Schema",
                        "COLUMN_NAME": "decimal",
                        "CONSTRAINT_CATALOG": "Database",
                        "CONSTRAINT_SCHEMA": "dbo",
                        "CONSTRAINT_NAME": "CK_Schema_decimal"
                    }, {
                        "TABLE_CATALOG": "Database",
                        "TABLE_SCHEMA": "dbo",
                        "TABLE_NAME": "Schema",
                        "COLUMN_NAME": "decimal",
                        "CONSTRAINT_CATALOG": "Database",
                        "CONSTRAINT_SCHEMA": "dbo",
                        "CONSTRAINT_NAME": "Schema_entity_check"
                    }, {
                        "TABLE_CATALOG": "Database",
                        "TABLE_SCHEMA": "dbo",
                        "TABLE_NAME": "Schema",
                        "COLUMN_NAME": "integer",
                        "CONSTRAINT_CATALOG": "Database",
                        "CONSTRAINT_SCHEMA": "dbo",
                        "CONSTRAINT_NAME": "Schema_entity_check"
                    }],
                    "effectedRows": 9
                }, {
                    "rows": [{
                        "TABLE_SCHEMA": "dbo",
                        "TABLE_NAME": "Schema",
                        "INDEX_NAME": "IX_deleted",
                        "IS_UNIQUE": false,
                        "TYPE": "NONCLUSTERED",
                        "COLUMN_NAME": "pid"
                    }, {
                        "TABLE_SCHEMA": "dbo",
                        "TABLE_NAME": "Schema",
                        "INDEX_NAME": "IX_deleted",
                        "IS_UNIQUE": false,
                        "TYPE": "NONCLUSTERED",
                        "COLUMN_NAME": "pclass"
                    }, {
                        "TABLE_SCHEMA": "dbo",
                        "TABLE_NAME": "Schema",
                        "INDEX_NAME": "IX_deleted",
                        "IS_UNIQUE": false,
                        "TYPE": "NONCLUSTERED",
                        "COLUMN_NAME": "thumbprint"
                    }, {
                        "TABLE_SCHEMA": "dbo",
                        "TABLE_NAME": "Schema",
                        "INDEX_NAME": "IX_deleted",
                        "IS_UNIQUE": false,
                        "TYPE": "NONCLUSTERED",
                        "COLUMN_NAME": "deleted"
                    }],
                    "effectedRows": 4
                }
            ];

            const schemaQuery = await db.getUpdateSchemaQueries([Schema, SubSchema]);

            chai.should();
            schemaQuery.should.deep.equal({
                commit: [],
                rollback: []
            });
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