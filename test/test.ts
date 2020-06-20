import "../src/Startup";

describe("Core", () => {
    require("./Core/Cache/QueryCache");
    require("./Core/Cache/ResultCache");
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
