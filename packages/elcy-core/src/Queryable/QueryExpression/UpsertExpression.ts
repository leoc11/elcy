import { Enumerable } from "@elcy/enumerable";
import { IObjectType, SetterObj, StringKeyOf } from "../../Common/Type";
import { IExpression } from "../../ExpressionBuilder/Expression/IExpression";
import { resolveClone } from "../../Helper/Expression";
import { hashCode, hashCodeAdd } from "../../Helper/Hash";
import { EntityExpression } from "./EntityExpression";
import { IColumnExpression } from "./IColumnExpression";
import { IQueryExpression } from "./IQueryExpression";
import { SqlParameterExpression } from "./SqlParameterExpression";
import { ColumnGeneration } from "src/Common/Enum";
import { IQueryIncludeRelation } from "./IQueryIncludeRelation";

export interface IUpsertIncludeRelation<TE extends object = any, TChild extends object = any> extends IQueryIncludeRelation<TE, TChild, UpsertExpression<TChild>, UpsertExpression<TE>> { }
export class UpsertExpression<TE extends object = object> implements IQueryExpression<TE> {
    public get insertColumns(): Array<IColumnExpression<TE>> {
        if (!this._insertColumns) {
            this._insertColumns = Enumerable.from(this.entity.metaData.columns)
                .except(this.entity.metaData.insertGeneratedColumns)
                .map((o) => this.entity.columns.find((c) => c.propertyName === o.propertyName)).toArray();
        }

        return this._insertColumns;
    }
    public get type() {
        return undefined as IObjectType<void>;
    }

    constructor(public readonly entity: EntityExpression<TE>, public readonly values: Array<SetterObj<TE>>, setter?: SetterObj<TE>, returnings?: Array<IColumnExpression<TE>>) {
        if (setter) {
            this.setter = setter;
        }
        else {
            this.setter = this.entity.columns
                .filter(o => !(o.columnMeta?.generation & ColumnGeneration.Update) && !o.isPrimary)
                .reduce((r, o) => {
                    r[o.propertyName] = null;
                    return r;
                }, {} as SetterObj<TE>);
        }

        if (returnings) {
            this.returnings = returnings;
        }
    }

    public includes: Array<IUpsertIncludeRelation<TE>> = [];
    public returnings: Array<IColumnExpression<TE>> = [];
    public paramExps: SqlParameterExpression[] = [];
    public readonly setter: Readonly<SetterObj<TE>>;
    private _insertColumns: Array<IColumnExpression<TE>>;

    public clone(replaceMap?: Map<IExpression, IExpression>): UpsertExpression<TE> {
        if (!replaceMap) {
            replaceMap = new Map();
        }
        const entity = resolveClone(this.entity, replaceMap);
        const values = this.values.map((o) => {
            const item: SetterObj<TE> = {};
            for (const prop in o) {
                item[prop as StringKeyOf<TE>] = resolveClone(o[prop as StringKeyOf<TE>], replaceMap);
            }
            return item;
        });

        const setter: SetterObj<TE> = {};
        for (const prop in this.setter) {
            setter[prop] = resolveClone(this.setter[prop], replaceMap);
        }
        const returning = this.returnings.map(o => resolveClone(o, replaceMap));
        const clone = new UpsertExpression(entity, values, setter, returning);
        replaceMap.set(this, clone);
        return clone;
    }
    public getEffectedEntities(): IObjectType[] {
        return this.entity.entityTypes;
    }
    public hashCode() {
        const insertHash = Enumerable.from(this.values).map((o) => {
            let hash = 0;
            for (const prop in o) {
                hash += hashCode(prop, o[prop as StringKeyOf<TE>].hashCode());
            }
            return hash;
        }).sum();

        let updateHash = 0;
        for (const prop in this.setter) {
            updateHash += hashCode(prop, this.setter[prop]?.hashCode() ?? 0);
        }
        return hashCode("UPSERT", hashCode(this.entity.name, hashCodeAdd(insertHash, updateHash)));
    }
    public toString(): string {
        let setter = "";
        for (const prop in this.setter) {
            setter += `${prop},\n`;
        }
        return `Upsert(${this.entity.toString()}, {${setter}})`;
    }
}
