import { describe } from "node:test";
import { PostgresqlContext } from "../../fixture";
import { queryableTest } from "./Queryable.share.test";

const db = new PostgresqlContext();
describe("Postgresql", () => {
    queryableTest(db);
});