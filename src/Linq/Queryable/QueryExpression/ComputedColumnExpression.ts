import { genericType } from "../../../Common/Type";
import { IExpression } from "../../../ExpressionBuilder/Expression/index";
import { QueryBuilder } from "../QueryBuilder";
import { EntityExpression } from "./EntityExpression";
import { IColumnExpression } from "./IColumnExpression";

export class ComputedColumnExpression<T = any, TE = any> implements IColumnExpression<T, TE> {
    constructor(public readonly type: genericType<T>, public entity: EntityExpression<TE>, public expression: IExpression, public alias?: string) {
    }
    public toString(transformer: QueryBuilder): string {
        return transformer.toColumnString(this);
    }
    public execute(transformer: QueryBuilder) {
        return this.toString(transformer);
    }
}
