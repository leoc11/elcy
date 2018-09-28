import { GenericType } from "../../Common/Type";
import { IExpression } from "../../ExpressionBuilder/Expression/IExpression";
import { QueryBuilder } from "../../QueryBuilder/QueryBuilder";
import { IColumnExpression } from "./IColumnExpression";
import { IEntityExpression } from "./IEntityExpression";
import { ColumnType } from "../../Common/ColumnType";
import { hashCode, getClone } from "../../Helper/Util";

export class ComputedColumnExpression<TE = any, T = any> implements IColumnExpression<TE, T> {
    public get type(): GenericType<T> {
        return this.expression.type;
    }
    public columnType: ColumnType;
    public columnName: string;
    public isPrimary = false;
    constructor(public entity: IEntityExpression<TE>, public expression: IExpression, public propertyName: keyof TE) {
        if (expression instanceof ComputedColumnExpression) {
            this.expression = expression.expression;
        }
        this.columnName = propertyName;
    }
    public clone(replaceMap?: Map<IExpression, IExpression>) {
        if (!replaceMap) replaceMap = new Map();
        const entityExp = getClone(this.entity, replaceMap);
        const exp = getClone(this.expression, replaceMap);
        const clone = new ComputedColumnExpression(entityExp, exp, this.propertyName);
        clone.isPrimary = this.isPrimary;
        clone.columnType = this.columnType;
        clone.columnName = this.columnName;
        replaceMap.set(this, clone);
        return clone;
    }
    public toString(transformer: QueryBuilder): string {
        return transformer.getExpressionString(this);
    }
    public execute(transformer: QueryBuilder) {
        return this.toString(transformer) as any;
    }
    public hashCode() {
        return hashCode(this.propertyName, hashCode(this.expression.toString()));
    }
}
