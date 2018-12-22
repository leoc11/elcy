import { GenericType } from "../../Common/Type";
import { IExpression } from "../../ExpressionBuilder/Expression/IExpression";
import { QueryBuilder } from "../../QueryBuilder/QueryBuilder";
import { IColumnExpression } from "./IColumnExpression";
import { IEntityExpression } from "./IEntityExpression";
import { ColumnType } from "../../Common/ColumnType";
import { hashCode, resolveClone, hashCodeAdd } from "../../Helper/Util";

export class ComputedColumnExpression<TE = any, T = any> implements IColumnExpression<TE, T> {
    public get type(): GenericType<T> {
        return this.expression.type;
    }
    public columnType: ColumnType;
    public get columnName() {
        return this.propertyName;
    }
    public alias?: string;
    public get dataPropertyName() {
        return this.alias || this.columnName;
    }
    public isPrimary = false;
    public isNullable = true;
    /**
     * Determined whether column has been declared in select statement.
     */
    public isDeclared = false;
    constructor(public entity: IEntityExpression<TE>, public expression: IExpression, public propertyName: keyof TE) {
        if (expression instanceof ComputedColumnExpression) {
            this.expression = expression.expression;
        }
    }
    public clone(replaceMap?: Map<IExpression, IExpression>) {
        if (!replaceMap) replaceMap = new Map();
        const entity = resolveClone(this.entity, replaceMap);
        const exp = resolveClone(this.expression, replaceMap);
        const clone = new ComputedColumnExpression(entity, exp, this.propertyName);
        replaceMap.set(this, clone);
        clone.isPrimary = this.isPrimary;
        clone.columnType = this.columnType;
        clone.isNullable = this.isNullable;
        clone.alias = this.alias;
        return clone;
    }
    public toString(transformer: QueryBuilder): string {
        return transformer.getExpressionString(this);
    }
    public execute(transformer: QueryBuilder) {
        return this.toString(transformer) as any;
    }
    public hashCode() {
        return hashCode(this.propertyName, hashCodeAdd(this.entity.hashCode(), this.expression.hashCode()));
    }
}
