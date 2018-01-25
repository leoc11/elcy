import { DbContext } from "../../Linq/DBContext";
import { MssqlQueryBuilder } from "./MssqlQueryBuilder";

export abstract class MssqlDbContext extends DbContext {
    public queryBuilder = MssqlQueryBuilder;
}
