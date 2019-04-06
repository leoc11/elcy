import { GenericType } from "../../Common/Type";
import { IExpression } from "../../ExpressionBuilder/Expression/IExpression";
import { hashCode } from "../../Helper/Util";

export class RawSqlExpression<T = any> implements IExpression<T> {
    constructor(public readonly type: GenericType<T>, public readonly sqlStatement: string) { }
    public toString(){
        return `Sql(${this.sqlStatement})`;
    }
    public clone(replaceMap?: Map<IExpression, IExpression>) {
        if (!replaceMap) replaceMap = new Map();
        const clone = new RawSqlExpression<T>(this.type, this.sqlStatement);
        replaceMap.set(this, clone);
        return clone;
    }
    public hashCode() {
        return hashCode(this.sqlStatement);
    }
}
