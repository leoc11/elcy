import { DbContext } from "../../Data/DBContext";
import { MssqlQueryBuilder } from "./MssqlQueryBuilder";
import { PlainObjectQueryResultParser } from "../../QueryBuilder/ResultParser/PlainObjectQueryResultParser";
import { IDriver } from "../IDriver";

export abstract class MssqlDbContext extends DbContext {
    public queryParser = PlainObjectQueryResultParser;
    public queryBuilder = MssqlQueryBuilder;
    constructor(driver: IDriver) {
        super(driver);
    }
}
