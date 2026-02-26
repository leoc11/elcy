import type { IObjectType } from "../../Common/Type";
import type { IExpression } from "../../ExpressionBuilder/Expression/IExpression";
import { hashCode, resolveClone } from "../../Helper/Util";
import { EntityExpression } from "./EntityExpression";
import { SqlParameterExpression } from "./SqlParameterExpression";

export class RawEntityExpression<T extends object = object> extends EntityExpression<T> {
    public readonly parameters: SqlParameterExpression<unknown>[] = [];
    constructor(public readonly type: IObjectType<T>, public alias: string, public readonly sqlTemplateStrings: TemplateStringsArray) {
        super(type, alias);
    }
    public addParameter(paramExp: SqlParameterExpression<unknown>) {
        this.parameters.push(paramExp);
    }
    public clone(replaceMap?: Map<IExpression, IExpression>): RawEntityExpression<T> {
        if (!replaceMap) {
            replaceMap = new Map();
        }
        const clone = new RawEntityExpression(this.type, this.alias, this.sqlTemplateStrings);
        replaceMap.set(this, clone);
        clone.columns = this.columns.map((o) => {
            let cloneCol = clone.columns.find((c) => c.propertyName === o.propertyName);
            if (!cloneCol) {
                cloneCol = resolveClone(o, replaceMap);
            }
            replaceMap.set(o, cloneCol);
            return cloneCol;
        });
        for (const paramExp of this.parameters) {
            clone.addParameter(resolveClone(paramExp, replaceMap));
        }
        clone.name = this.name;
        return clone;
    }
    public hashCode() {
        return hashCode(this.name, hashCode(this.sqlTemplateStrings.join("?")));
    }
    public toString(): string {
        return `RawSql(${this.sqlTemplateStrings.join("?")})`;
    }
}
