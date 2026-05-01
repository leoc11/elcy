import { GenericType } from "../../Common/Type";
import { IExpression } from "../../ExpressionBuilder/Expression/IExpression";
import { resolveClone } from "../../Helper/Util";
import { IColumnMetaData } from "../../MetaData/Interface/IColumnMetaData";
import { ISqlParameterExpression } from "./ISqlParameterExpression";

export class SqlParameterExpression<T = unknown> implements ISqlParameterExpression<T> {
    constructor(public readonly valueExp: IExpression<T>, public readonly column?: IColumnMetaData<any, T>) {
        this.type = this.valueExp.type;
    }
    public type: GenericType<T>;
    public clone(replaceMap?: Map<IExpression, IExpression>): SqlParameterExpression<T> {
        if (!replaceMap) {
            replaceMap = new Map();
        }
        const valueGetter = resolveClone(this.valueExp, replaceMap);
        const clone = new SqlParameterExpression(valueGetter, this.column);
        replaceMap.set(this, clone);
        return clone;
    }
    public hashCode() {
        return this.valueExp.hashCode();
    }
    public toString(): string {
        return this.valueExp.toString();
    }
}
