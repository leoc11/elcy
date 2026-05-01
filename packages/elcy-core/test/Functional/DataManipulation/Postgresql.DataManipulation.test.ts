import { describe } from "node:test";
import { PostgresqlContext } from "../../fixture";
import { dataManipulationTest } from "./DataManipulation.shared.test";

const db = new PostgresqlContext();
describe("Postgresql", () => {
    dataManipulationTest(db);
});