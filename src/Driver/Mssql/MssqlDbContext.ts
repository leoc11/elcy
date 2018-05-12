import { DbContext } from "../../Data/DBContext";
import { MssqlQueryBuilder } from "./MssqlQueryBuilder";
import { PlainObjectQueryResultParser } from "../../QueryBuilder/ResultParser/PlainObjectQueryResultParser";
import { IDriver } from "../IDriver";
import { MssqlSchemaBuilder } from "./MssqlSchemaBuilder";

export abstract class MssqlDbContext extends DbContext {
    public queryParser = PlainObjectQueryResultParser;
    public queryBuilder = MssqlQueryBuilder;
    public schemaBuilder = MssqlSchemaBuilder;
    constructor(driver: IDriver) {
        super(driver);
    }
}
