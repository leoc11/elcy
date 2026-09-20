import { describe } from "bun:test";
import { queryableTest } from "./Queryable.share.test";
import { MysqlContext } from "../../fixture/MysqlContext";

const db = new MysqlContext();
describe("Mysql", () => {
    queryableTest(db);
});