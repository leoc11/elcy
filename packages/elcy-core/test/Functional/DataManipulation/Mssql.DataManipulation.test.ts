import { describe } from "node:test";
import { MssqlContext } from "../../fixture";
import { dataManipulationTest } from "./DataManipulation.shared.test";

const db = new MssqlContext();
describe("Mssql", () => {
    dataManipulationTest(db);
});