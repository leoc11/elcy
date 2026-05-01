import { describe } from "node:test";
import { MssqlContext } from "../../fixture";
import { queryableTest } from "./Queryable.share.test";

const db = new MssqlContext();
describe("Mssql", () => {
    queryableTest(db);
});