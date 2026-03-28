import { describe } from "node:test";
import { queryableTest } from "./Queryable.share.test";
import { MysqlContext } from "../../fixture/MysqlContext";

const db = new MysqlContext();
describe("Mysql", () => {
    queryableTest(db);
});