import { IObjectType, } from "../../Common/Type";
import { entityMetaKey } from "../../Decorator/DecoratorKey";
import { EntityMetaData } from "../../MetaData";
import { QueryBuilder } from "../../QueryBuilder/QueryBuilder";
import { ColumnExpression } from "./ColumnExpression";
import { IColumnExpression } from "./IColumnExpression";
import { IEntityExpression } from "./IEntityExpression";
import { IOrderExpression } from "./IOrderExpression";
import { SelectExpression } from "./SelectExpression";

export class EntityExpression<T = any> implements IEntityExpression<T> {
    public name: string;
    public select?: SelectExpression<T>;
    protected get metaData() {
        if (!this._metaData)
            this._metaData = Reflect.getOwnMetadata(entityMetaKey, this.type);
        return this._metaData;
    }
    public get deleteColumn() {
        if (typeof this._deleteColumn === "undefined") {
            this._deleteColumn = !this.metaData ? null : this.columns.first(o => o.propertyName === this.metaData.deleteProperty);
        }
        return this._deleteColumn;
    }
    public get columns(): IColumnExpression[] {
        if (!this._columns) {
            if (this.metaData)
                this._columns = this.metaData.properties.select((o) => new ColumnExpression(this, o, this.metaData.primaryKeys.contains(o))).toArray();
            else
                this._columns = [];
        }
        return this._columns;
    }
    public set columns(value) {
        this._columns = value;
    }
    public get primaryColumns(): IColumnExpression[] {
        if (!this._primaryColumns) {
            if (this.metaData)
                this._primaryColumns = this.metaData.primaryKeys.select((o) => this.columns.first((c) => c.propertyName === o)).toArray();
            else
                this._primaryColumns = [];
        }
        return this._primaryColumns;
    }
    public set primaryColumns(value) {
        this._primaryColumns = value;
    }
    public get defaultOrders(): IOrderExpression[] {
        if (!this._defaultOrders) {
            if (this.metaData.defaultOrder)
                this._defaultOrders = this.metaData.defaultOrder!.select((o) => ({
                    column: this.columns.first((c) => c.propertyName === o.property),
                    direction: o.direction
                })).toArray();
            else
                this._defaultOrders = [];
        }
        return this._defaultOrders;
    }
    private _metaData: EntityMetaData<T>;
    private _columns: IColumnExpression[];
    private _primaryColumns: IColumnExpression[];
    private _defaultOrders: IOrderExpression[];
    private _deleteColumn: IColumnExpression;
    constructor(public readonly type: IObjectType<T>, public alias: string) {
        if (this.metaData)
            this.name = this.metaData.name;
    }
    public toString(queryBuilder: QueryBuilder): string {
        return queryBuilder.getExpressionString(this);
    }
    public execute(queryBuilder: QueryBuilder): any {
        return queryBuilder.getExpressionString(this);
    }
    public clone(): IEntityExpression<T> {
        const clone = new EntityExpression(this.type, this.alias);
        clone.columns = this.columns.select(o => {
            const colClone = o.clone();
            colClone.entity = clone;
            return colClone;
        }).toArray();
        clone.name = this.name;
        return clone;
    }
}
