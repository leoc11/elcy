import { describe } from "bun:test";
import { MssqlContext } from "../../fixture";
import { dataManipulationTest } from "./DataManipulation.shared.test";

const db = new MssqlContext();
describe("Mssql", () => {
    dataManipulationTest(db);
});