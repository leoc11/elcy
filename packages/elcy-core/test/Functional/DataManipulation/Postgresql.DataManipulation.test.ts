import { describe } from "node:test";
import { PgContext } from "../../fixture";
import { dataManipulationTest } from "./DataManipulation.shared.test";

const db = new PgContext();
describe("Postgresql", () => {
    dataManipulationTest(db);
});