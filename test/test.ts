import "../src/Startup";
// tslint:disable-next-line: ordered-imports
import { DefaultLogger } from "../src/Logger/DefaultLogger";
import { Diagnostic } from "../src/Logger/Diagnostic";
// import "./test.debug";

Diagnostic.logger = new DefaultLogger(true);

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
