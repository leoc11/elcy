import { IObjectType } from "../../../Common/Type";
import { ExpressionBase } from "../../../ExpressionBuilder/Expression/index";
import { QueryBuilder } from "../QueryBuilder";
import { GroupByExpression } from "./GroupByExpression";
import { ISelectExpression } from "./ISelectExpression";
import { SelectExpression } from "./SelectExpression";

export class WhereExpression<T = any> implements ISelectExpression {
    public select: SelectExpression<T> | GroupByExpression<T>;
    public where: ExpressionBase<boolean>;
    public pagging: { skip?: number, take?: number } = {};
    public type: IObjectType<T>;
    constructor(select: SelectExpression<T>, public alias: string) {
        this.select = select;
    }
    public toString(queryBuilder: QueryBuilder) {
        return queryBuilder.toWhereString(this);
    }
}
