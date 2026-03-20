import { describe } from "node:test";
import { PgContext } from "../../fixture";
import { queryableTest } from "./Queryable.share.test";

const db = new PgContext();
describe("Postgresql", () => {
    queryableTest(db);
});