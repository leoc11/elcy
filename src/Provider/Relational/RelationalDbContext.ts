import { DbType } from "../../Common/StringType";
import { DbContext } from "../../Data/DbContext";

export abstract class RelationalDbContext<TDB extends DbType> extends DbContext<TDB> { }
