import { QueryBuilder } from "../QueryBuilder";
import { ColumnExpression } from "./ColumnExpression";
import { ISelectExpression } from "./ISelectExpression";
import { TableExpression } from "./TableExpression";

export class SelectExpression<T = any>  implements ISelectExpression {
    public columns: ColumnExpression[] = [];
    public entity: TableExpression;
    public distinct: boolean = false;
    public top?: number;
    constructor(entity: TableExpression<T>, public alias: string) {
        this.entity = entity;
    }

    public toString(queryBuilder: QueryBuilder): string {
        return queryBuilder.toSelectString(this);
    }
}
