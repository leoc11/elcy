import { QueryBuilder } from "../QueryBuilder";
import { GroupByExpression } from "./GroupByExpression";
import { IOrderExpression } from "./IOrderExpression";
import { ISelectExpression } from "./ISelectExpression";
import { SelectExpression } from "./SelectExpression";
import { UnionExpression } from "./UnionExpression";
import { WhereExpression } from "./WhereExpression";

export class OrderByExpression<T = any> implements ISelectExpression {
    public select: SelectExpression<T> | WhereExpression<T> | UnionExpression | GroupByExpression<T>;
    public orders: IOrderExpression[] = [];
    constructor(select: SelectExpression<T>, public alias: string) {
        this.select = select;
    }

    public toString(queryBuilder: QueryBuilder) {
        return queryBuilder.toOrderString(this);
    }
}
