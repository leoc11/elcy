import { GenericType } from "../../../Common/Type";
import { QueryBuilder } from "../../QueryBuilder";
import { IColumnExpression } from "./IColumnExpression";
import { ProjectionEntityExpression, SelectExpression } from "./index";
export class ColumnEntityExpression<T = any, K = any> extends ProjectionEntityExpression<T> {
    public columnType: GenericType<K>;
    public get column(): IColumnExpression<K, T> {
        return this.columns[0];
    }
    constructor(public select: SelectExpression) {
        super(select, select.entity.alias);
        this.select.parent = this;
    }
    public toString(queryBuilder: QueryBuilder): string {
        return queryBuilder.getExpressionString(this);
    }
    public execute(queryBuilder: QueryBuilder): any {
        throw new Error("Method not implemented.");
    }
}
