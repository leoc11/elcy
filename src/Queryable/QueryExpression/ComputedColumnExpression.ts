import { GenericType } from "../../Common/Type";
import { IExpression } from "../../ExpressionBuilder/Expression/index";
import { QueryBuilder } from "../../QueryBuilder/QueryBuilder";
import { IColumnExpression } from "./IColumnExpression";
import { IEntityExpression } from "./IEntityExpression";
import { ColumnType } from "../../Common/ColumnType";

export class ComputedColumnExpression<TE = any, T = any> implements IColumnExpression<TE, T> {
    public get type(): GenericType<T> {
        return this.expression.type;
    }
    public columnType: ColumnType;
    public propertyName: string;
    public isPrimary = false;
    constructor(public entity: IEntityExpression<TE>, public expression: IExpression, public columnName: string) {
        if (expression instanceof ComputedColumnExpression) {
            this.expression = expression.expression;
        }
        this.propertyName = columnName;
    }
    public clone() {
        const clone = new ComputedColumnExpression(this.entity, this.expression, this.columnName);
        clone.isPrimary = this.isPrimary;
        clone.columnType = this.columnType;
        clone.propertyName = this.propertyName;
        return clone;
    }
    public toString(transformer: QueryBuilder): string {
        return transformer.getExpressionString(this);
    }
    public execute(transformer: QueryBuilder) {
        return this.toString(transformer) as any;
    }
}
