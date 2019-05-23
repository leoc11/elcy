import { GenericType, IObjectType } from "../../Common/Type";
import { IExpression } from "../../ExpressionBuilder/Expression/IExpression";
import { hashCode, resolveClone } from "../../Helper/Util";
import { IOrderQueryDefinition } from "../Interface/IOrderQueryDefinition";
import { IColumnExpression } from "./IColumnExpression";
import { IEntityExpression } from "./IEntityExpression";
import { SelectExpression } from "./SelectExpression";

export class CustomEntityExpression<T = any> implements IEntityExpression<T> {
    public get primaryColumns(): IColumnExpression[] {
        if (!this._primaryColumns) {
            this._primaryColumns = this.columns.where((o) => o.isPrimary).toArray();
        }
        return this._primaryColumns;
    }
    public isRelationData?: boolean;
    public select?: SelectExpression<T>;
    public columns: IColumnExpression[];
    public entityTypes: IObjectType[] = [];
    private _primaryColumns: IColumnExpression[];
    constructor(public name: string, columns: IColumnExpression[], public readonly type: GenericType<T>, public alias: string, public defaultOrders: IOrderQueryDefinition[] = []) {
        this.columns = columns.select((o) => {
            const clone = o.clone();
            clone.entity = this;
            if (clone.alias) {
                clone.columnName = clone.alias;
                clone.alias = null;
            }
            return clone;
        }).toArray();
    }
    public toString(): string {
        return `CustomEntity(${this.name})`;
    }
    public clone(replaceMap?: Map<IExpression, IExpression>): IEntityExpression<T> {
        if (!replaceMap) { replaceMap = new Map(); }
        const clone = new CustomEntityExpression(this.name, [], this.type, this.alias);
        replaceMap.set(this, clone);
        clone.columns = this.columns.select((o) => resolveClone(o, replaceMap)).toArray();
        return clone;
    }
    public hashCode() {
        return hashCode(this.name, hashCode(this.type.name, this.columns.length));
    }
}
