import { GenericType } from "../../../Common/Type";
import { IExpression } from "../../../ExpressionBuilder/Expression/index";
import { QueryBuilder } from "../../QueryBuilder";
import { IColumnExpression } from "./IColumnExpression";
import { IEntityExpression } from "./IEntityExpression";

export class ComputedColumnExpression<TE = any, T = any> implements IColumnExpression<TE, T> {
    public get type(): GenericType<T> {
        return this.expression.type;
    }
    public dbType: string;
    public property: string;
    public isPrimary = false;
    constructor(public entity: IEntityExpression<TE>, public expression: IExpression, public alias?: string) {
    }
    public clone() {
        const clone = new ComputedColumnExpression(this.entity, this.expression, this.alias);
        clone.isPrimary = this.isPrimary;
        clone.property = this.property;
        clone.dbType = this.dbType;
        return clone;
    }
    public toString(transformer: QueryBuilder): string {
        return transformer.getExpressionString(this);
    }
    public execute(transformer: QueryBuilder) {
        return this.toString(transformer) as any;
    }
}
