import { EntityMetaData } from "src/MetaData/EntityMetaData";
import type { IExpression } from "../../ExpressionBuilder/Expression/IExpression";
import { resolveClone } from "../../Helper/Expression";
import { hashCode } from "../../Helper/Hash";
import { EntityExpression } from "./EntityExpression";
import { SqlParameterExpression } from "./SqlParameterExpression";
import { IColumnExpression } from "./IColumnExpression";

export class RawEntityExpression<T extends object = object> extends EntityExpression<T> {
    public readonly parameters: SqlParameterExpression<unknown>[] = [];
    constructor(metaData: EntityMetaData<T>, public override alias: string, public readonly sqlTemplateStrings: TemplateStringsArray) {
        super(metaData.type, alias);
        this._rawMetaData = metaData;
    }

    private _rawMetaData: EntityMetaData<T>;
    public override get metaData() {
        return this._rawMetaData;
    }
    public addParameter(paramExp: SqlParameterExpression<unknown>) {
        this.parameters.push(paramExp);
    }
    public override clone(replaceMap?: Map<IExpression, IExpression>): RawEntityExpression<T> {
        if (!replaceMap) {
            replaceMap = new Map();
        }
        const clone = new RawEntityExpression(this.metaData, this.alias, this.sqlTemplateStrings);
        replaceMap.set(this, clone);
        clone.properties = Object.values<IColumnExpression<T>>(this.properties)
            .map((o) => {
                let cloneCol = clone.properties[o.propertyName];
                if (!cloneCol) {
                    cloneCol = resolveClone(o, replaceMap);
                }
                replaceMap.set(o, cloneCol);
                return cloneCol;
            })
            .reduce((r, o) => (r[o.propertyName] = o, r), {} as { [K in keyof T]: IColumnExpression<T> });

        for (const paramExp of this.parameters) {
            clone.addParameter(resolveClone(paramExp, replaceMap));
        }
        clone.name = this.name;
        return clone;
    }
    public override hashCode() {
        return hashCode(this.name, hashCode(this.sqlTemplateStrings.join("?")));
    }
    public override toString(): string {
        return `RawSql(${this.sqlTemplateStrings.join("?")})`;
    }
}
