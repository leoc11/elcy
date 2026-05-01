import { describe } from "node:test";
import { dataManipulationTest } from "./DataManipulation.shared.test";
import { MysqlContext } from "../../fixture/MysqlContext";

const db = new MysqlContext();
describe("Mysql", () => {
    dataManipulationTest(db);
});