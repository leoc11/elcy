import { describe } from "node:test";
import { queryableTest } from "./Queryable.share.test";
import { SqliteContext } from "../../fixture/SqliteContext";

const db = new SqliteContext();
describe("Sqlite", () => {
    queryableTest(db);
});