import { describe } from "node:test";
import { dataManipulationTest } from "./DataManipulation.shared.test";
import { SqliteContext } from "../../fixture/SqliteContext";

const db = new SqliteContext();
describe("Sqlite", () => {
    dataManipulationTest(db);
});