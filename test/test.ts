import "../src/Startup";
// tslint:disable-next-line: ordered-imports
// import "./test.debug";

describe("Core", () => {
    require("./Core/ConnectionManager/PooledConnectionManager");
    require("./Core/ConnectionManager/ReplicationConnectionManager");
    require("./Core/DbContext/DbContext");
    require("./Core/DefferedQuery/DeferredQuery");
    require("./Core/Enumerable/Enumerable");
    require("./Core/ExpressionBuilder/ExpressionBuilder");
    require("./Core/QueryBuilder/Querybuilder");
});

describe("Mssql", async () => {
    require("./Provider/Mssql/SchemaBuilder");
    require("./Provider/Mssql/DataManipulation");
    require("./Provider/Mssql/Queryable");
});
// describe("Sqlite", async () => {
//     //
// });
