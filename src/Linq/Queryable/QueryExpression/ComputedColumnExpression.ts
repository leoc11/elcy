import { GenericType } from "../../../Common/Type";
import { IExpression } from "../../../ExpressionBuilder/Expression/index";
import { QueryBuilder } from "../../QueryBuilder";
import { IColumnExpression } from "./IColumnExpression";
import { IEntityExpression } from "./IEntityExpression";

export class ComputedColumnExpression<T = any, TE = any> implements IColumnExpression<T, TE> {
    public get type(): GenericType<T> {
        return this.expression.type;
    }
    public property: string;
    constructor(public entity: IEntityExpression<TE>, public expression: IExpression, public alias?: string) {
    }
    public clone() {
        return new ComputedColumnExpression(this.entity, this.expression, this.alias);
    }
    public toString(transformer: QueryBuilder): string {
        return transformer.getExpressionString(this);
    }
    public execute(transformer: QueryBuilder) {
        return this.toString(transformer);
    }
}
