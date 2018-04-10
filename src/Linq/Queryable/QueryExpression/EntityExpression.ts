import { IObjectType,  } from "../../../Common/Type";
import { entityMetaKey } from "../../../Decorator/DecoratorKey";
import { EntityMetaData } from "../../../MetaData";
import { QueryBuilder } from "../../QueryBuilder";
import { ColumnExpression } from "./ColumnExpression";
import { IColumnExpression } from "./IColumnExpression";
import { IEntityExpression } from "./IEntityExpression";
import { IOrderExpression } from "./IOrderExpression";

export class EntityExpression<T = any> implements IEntityExpression<T> {
    public name: string;
    protected get metaData() {
        if (!this._metaData)
            this._metaData = Reflect.getOwnMetadata(entityMetaKey, this.type);
        return this._metaData;
    }
    public get columns(): IColumnExpression[] {
        if (!this._columns) {
            this._columns = this.metaData.properties.select((o) => new ColumnExpression(this, o, this.metaData.primaryKeys.contains(o))).toArray();
        }
        return this._columns;
    }
    public get primaryColumns(): IColumnExpression[] {
        if (!this._primaryColumns) {
            this._primaryColumns = this.metaData.primaryKeys.select((o) => this.columns.first((c) => c.propertyName === o)).toArray();
        }
        return this._primaryColumns;
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
    constructor(public readonly type: IObjectType<T>, public alias: string) {
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
        clone.name = this.name;
        return clone;
    }
}
