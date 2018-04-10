import { IColumnExpression } from "../../Linq/Queryable/QueryExpression/IColumnExpression";
import { IEntityExpression } from "../../Linq/Queryable/QueryExpression/IEntityExpression";
import { DbContext } from "../../Linq/DBContext";
import { EntityBase } from "../../Data/EntityBase";
import { IQueryResultParser } from "./IQueryResultParser";
import { IQueryResult } from "../QueryResult";
import { SelectExpression } from "../../Linq/Queryable/QueryExpression";

export interface IColumnParserData<T = any> {
    column: IColumnExpression<T>;
    index: number;
}
export interface IGroupedColumnParser {
    entity: IEntityExpression;
    primaryColumns: IColumnParserData[];
    columns: IColumnParserData[];
}
export class PlainObjectQueryResultParser<T extends EntityBase> implements IQueryResultParser<T> {
    constructor(protected readonly queryExpression: SelectExpression<T>) {
        
    }
    parse(queryResults: IQueryResult[], dbContext: DbContext): T[] {
        return [];
    }
}
