import { GenericType, IObjectType } from "../../Common/Type";
import { IExpression } from "../../ExpressionBuilder/Expression/IExpression";
import { hashCode } from "../../Helper/Util";
import { IEntityMetaData } from "../../MetaData/Interface/IEntityMetaData";
import { IOrderQueryDefinition } from "../Interface/IOrderQueryDefinition";
import { ColumnExpression } from "./ColumnExpression";
import { IColumnExpression } from "./IColumnExpression";
import { IEntityExpression } from "./IEntityExpression";
import { SelectExpression } from "./SelectExpression";

export class RawEntityExpression<T = any> implements IEntityExpression<T> {
    constructor(public readonly type: IObjectType<T>,
                protected schema: { [K in keyof T]: GenericType<T[K]> },
                public readonly definingQuery: string,
                public alias: string) {
        this.entityTypes = [this.type];
        this.defaultOrders = [];
        this.primaryColumns = [];
        this.columns = [];
        for (const prop in schema) {
            const valueType = schema[prop] || String;
            const columnExp = new ColumnExpression<T>(this, valueType, prop, prop, false, true);
            this.columns.push(columnExp);
        }
    }
    public metaData: IEntityMetaData<T>;
    public readonly entityTypes: IObjectType[];
    public get name() {
        return this.alias;
    }
    public select?: SelectExpression<T>;
    public readonly columns: Array<IColumnExpression<T>>;
    public readonly primaryColumns: IColumnExpression[];
    public readonly defaultOrders: IOrderQueryDefinition[];
    public clone(replaceMap?: Map<IExpression, IExpression>): RawEntityExpression<T> {
        const clone = new RawEntityExpression(this.type, this.schema, this.definingQuery, this.alias);
        replaceMap.set(this, clone);
        return clone;
    }
    public hashCode() {
        return hashCode(this.name);
    }
    public toString(): string {
        return `Entity(${this.name}:${this.definingQuery})`;
    }
}
