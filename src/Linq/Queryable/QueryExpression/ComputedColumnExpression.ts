import { genericType } from "../../../Common/Type";
import { IExpression } from "../../../ExpressionBuilder/Expression/index";
import { QueryBuilder } from "../../QueryBuilder";
import { IColumnExpression } from "./IColumnExpression";
import { IEntityExpression } from "./IEntityExpression";

export class ComputedColumnExpression<T = any, TE = any> implements IColumnExpression<T, TE> {
    public property: string;
    public get type(): genericType<T>{
        return this.expression.type;
    }
    constructor(public entity: IEntityExpression<TE>, public expression: IExpression, public alias?: string) {
    }
    public toString(transformer: QueryBuilder): string {
        return transformer.getColumnString(this);
    }
    public execute(transformer: QueryBuilder) {
        return this.toString(transformer);
    }
}
