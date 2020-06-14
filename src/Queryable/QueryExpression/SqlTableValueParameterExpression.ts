import { IExpression } from "../../ExpressionBuilder/Expression/IExpression";
import { resolveClone } from "../../Helper/Util";
import { EntityMetaData } from "../../MetaData/EntityMetaData";
import { SqlParameterExpression } from "./SqlParameterExpression";

export class SqlTableValueParameterExpression<T = any> extends SqlParameterExpression<T[]> {
    constructor(name: string, valueExp: IExpression<T[]>, public entityMeta: EntityMetaData<T>) {
        super(name, valueExp);
    }
    public clone(replaceMap?: Map<IExpression, IExpression>): SqlTableValueParameterExpression<T> {
        if (!replaceMap) {
            replaceMap = new Map();
        }
        const valueGetter = resolveClone(this.valueExp, replaceMap);
        const clone = new SqlTableValueParameterExpression(this.name, valueGetter, this.entityMeta);
        replaceMap.set(this, clone);
        return clone;
    }
}
