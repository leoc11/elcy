import { describe } from "node:test";
import { PgContext } from "../../fixture";
import { queryableTest } from "./Queryable.share";

const db = new PgContext();
describe("Postgresql", () => {
    queryableTest(db);
});