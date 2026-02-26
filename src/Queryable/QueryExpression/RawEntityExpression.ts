import type { IObjectType } from "../../Common/Type";
import type { IExpression } from "../../ExpressionBuilder/Expression/IExpression";
import { hashCode, resolveClone } from "../../Helper/Util";
import { EntityExpression } from "./EntityExpression";

export class RawEntityExpression<T extends object = object> extends EntityExpression<T> {
    constructor(public readonly type: IObjectType<T>, public alias: string, public readonly sqlStatement: string) {
        super(type, alias);
    }
    
    public clone(replaceMap?: Map<IExpression, IExpression>): RawEntityExpression<T> {
        if (!replaceMap) {
            replaceMap = new Map();
        }
        const clone = new RawEntityExpression(this.type, this.alias, this.sqlStatement);
        replaceMap.set(this, clone);
        clone.columns = this.columns.map((o) => {
            let cloneCol = clone.columns.find((c) => c.propertyName === o.propertyName);
            if (!cloneCol) {
                cloneCol = resolveClone(o, replaceMap);
            }
            replaceMap.set(o, cloneCol);
            return cloneCol;
        });
        clone.name = this.name;
        return clone;
    }
    public hashCode() {
        return hashCode(this.name, hashCode(this.sqlStatement));
    }
    public toString(): string {
        return `RawSql(${this.sqlStatement})`;
    }
}
