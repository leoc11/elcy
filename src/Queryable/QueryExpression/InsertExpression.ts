import { IObjectType } from "../../Common/Type";
import { IExpression } from "../../ExpressionBuilder/Expression/IExpression";
import { resolveTreeClone } from "../../Helper/ExpressionUtil";
import { hashCode, resolveClone } from "../../Helper/Util";
import { EntityExpression } from "./EntityExpression";
import { IColumnExpression } from "./IColumnExpression";
import { IEntityExpression } from "./IEntityExpression";
import { QueryExpression } from "./QueryExpression";

// TODO: change to single insert
export class InsertExpression<T = any> extends QueryExpression<void> {
    public get columns(): Array<IColumnExpression<T>> {
        if (!this._columns && this.entity instanceof EntityExpression) {
            this._columns = this.entity.metaData.columns
                .except(this.entity.metaData.insertGeneratedColumns)
                .select((o) => this.entity.columns.first((c) => c.propertyName === o.propertyName)).toArray();
        }
        return this._columns;
    }

    public get type() {
        return undefined as any;
    }
    constructor(public readonly entity: IEntityExpression<T>, public readonly values: Array<{ [key in keyof T]?: IExpression<T[key]> }>, columns?: Array<IColumnExpression<T>>) {
        super();
        if (columns) {
            this._columns = columns;
        }
    }
    private _columns: Array<IColumnExpression<T>>;
    public clone(replaceMap?: Map<IExpression, IExpression>): InsertExpression<T> {
        if (!replaceMap) {
            replaceMap = new Map();
        }
        const entity = resolveClone(this.entity, replaceMap);
        const columns = this.columns.select((o) => resolveClone(o, replaceMap)).toArray();
        const values = this.values.select((o) => {
            const item: { [key in keyof T]?: IExpression<T[key]> } = {};
            for (const prop in o) {
                item[prop] = resolveClone(o[prop], replaceMap);
            }
            return item;
        }).toArray();
        const clone = new InsertExpression(entity, values, columns);
        clone.parameterTree = resolveTreeClone(this.parameterTree, replaceMap);
        replaceMap.set(this, clone);
        return clone;
    }
    public getEffectedEntities(): IObjectType[] {
        return this.entity.entityTypes;
    }
    public hashCode() {
        return hashCode("INSERT", hashCode(this.entity.name, this.values.select((o) => {
            let hash = 0;
            for (const prop in o) {
                hash += hashCode(prop, o[prop].hashCode());
            }
            return hash;
        }).sum()));
    }
    public toString(): string {
        return `Insert(${this.entity.toString()})`;
    }
}
