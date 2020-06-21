import { IObjectType } from "../../Common/Type";
import { IEnumerable } from "../../Enumerable/IEnumerable";
import { AndExpression } from "../../ExpressionBuilder/Expression/AndExpression";
import { IExpression } from "../../ExpressionBuilder/Expression/IExpression";
import { StrictEqualExpression } from "../../ExpressionBuilder/Expression/StrictEqualExpression";
import { resolveTreeClone } from "../../Helper/ExpressionUtil";
import { hashCode, resolveClone } from "../../Helper/Util";
import { IRelationMetaData } from "../../MetaData/Interface/IRelationMetaData";
import { EntityExpression } from "./EntityExpression";
import { IColumnExpression } from "./IColumnExpression";
import { QueryExpression } from "./QueryExpression";

export class UpsertExpression<T = any> extends QueryExpression<void> {
    public get insertColumns(): Array<IColumnExpression<T>> {
        if (!this._insertColumns) {
            this._insertColumns = this.relations
                .selectMany((o) => o.relationColumns)
                .union(this.entity.metaData.columns)
                .except(this.entity.metaData.insertGeneratedColumns)
                .select((o) => this.entity.columns.first((c) => c.propertyName === o.propertyName)).toArray();
        }

        return this._insertColumns;
    }
    public get relations(): Array<IRelationMetaData<T>> {
        if (!this._relations) {
            this._relations = this.entity.metaData.relations
                .where((o) => !o.nullable && !o.isMaster && o.relationType === "one").toArray();
        }
        return this._relations;
    }
    public get type() {
        return undefined as any;
    }
    public get where(): IExpression<boolean> {
        return this.entity.primaryColumns.select((o) => {
            const valueExp = this.value[o.propertyName];
            return new StrictEqualExpression(o, valueExp);
        }).reduce<IExpression<boolean>>((acc, item) => acc ? new AndExpression(acc, item) : item);
    }
    constructor(public readonly entity: EntityExpression<T>,
                public readonly value: { [key in keyof T]?: IExpression<T[key]> },
                updateColumns: IEnumerable<keyof T>) {
        super();
        this.updateColumns = updateColumns
            .except(this.entity.metaData.updateGeneratedColumns.select((o) => o.propertyName))
            .select((prop) => entity.columns.first((o) => o.propertyName === prop)).toArray();
    }
    public readonly updateColumns: Array<IColumnExpression<T>>;
    private _insertColumns: Array<IColumnExpression<T>>;
    private _relations: Array<IRelationMetaData<T>>;
    public clone(replaceMap?: Map<IExpression, IExpression>): UpsertExpression<T> {
        if (!replaceMap) {
            replaceMap = new Map();
        }
        const entity = resolveClone(this.entity, replaceMap);
        const setter: { [key in keyof T]?: IExpression<T[key]> } = {};
        for (const prop in this.value) {
            setter[prop] = resolveClone(this.value[prop], replaceMap);
        }
        const clone = new UpsertExpression(entity, setter, this.updateColumns.select((o) => o.propertyName));
        clone.parameterTree = resolveTreeClone(this.parameterTree, replaceMap);
        replaceMap.set(this, clone);
        return clone;
    }
    public getEffectedEntities(): IObjectType[] {
        return this.entity.entityTypes;
    }
    public hashCode() {
        let code = 0;
        for (const prop in this.value) {
            code += hashCode(prop, this.value[prop].hashCode());
        }
        return hashCode("UPSERT", hashCode(this.entity.name, code));
    }
    public toString(): string {
        let setter = "";
        for (const prop in this.value) {
            const val = this.value[prop];
            setter += `${prop}:${val.toString()},\n`;
        }
        return `Upsert(${this.entity.toString()}, {${setter}})`;
    }
}
