import { IExpression } from "../../ExpressionBuilder/Expression/IExpression";
import { IColumnMetaData } from "../../MetaData/Interface/IColumnMetaData";
import { resolveClone } from "../../Helper/Util";
import { GenericType } from "../../Common/Type";

export class SqlParameterExpression<T = any> implements IExpression<T> {
    public type: GenericType<T>;
    constructor(public readonly valueExp: IExpression<T>, public readonly column?: IColumnMetaData) { }
    public toString(): string {
        return this.valueExp.toString();
    }
    public hashCode() {
        return this.valueExp.hashCode();
    }
    public clone(replaceMap?: Map<IExpression, IExpression>): SqlParameterExpression<T> {
        if (!replaceMap) replaceMap = new Map();
        const valueGetter = resolveClone(this.valueExp, replaceMap);
        const clone = new SqlParameterExpression(valueGetter, this.column);
        replaceMap.set(this, clone);
        return clone;
    }
}
