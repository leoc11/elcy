import { GenericType } from "../../Common/Type";
import { IExpression } from "../../ExpressionBuilder/Expression/IExpression";
import { ParameterExpression } from "../../ExpressionBuilder/Expression/ParameterExpression";
import { resolveClone } from "../../Helper/Util";
import { IColumnMetaData } from "../../MetaData/Interface/IColumnMetaData";

export class SqlParameterExpression<T = any> extends ParameterExpression<T> {
    constructor(public name: string, public valueExp: IExpression<T>, public readonly column?: IColumnMetaData) {
        super(name, valueExp.type);
    }
    public type: GenericType<T>;
    public isReplacer: boolean;
    public clone(replaceMap?: Map<IExpression, IExpression>): SqlParameterExpression<T> {
        if (!replaceMap) {
            replaceMap = new Map();
        }
        const valueGetter = resolveClone(this.valueExp, replaceMap);
        const clone = new SqlParameterExpression(this.name, valueGetter, this.column);
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
