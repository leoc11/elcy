import { IObjectType, } from "../../Common/Type";
import { entityMetaKey } from "../../Decorator/DecoratorKey";
import { QueryBuilder } from "../../QueryBuilder/QueryBuilder";
import { ColumnExpression } from "./ColumnExpression";
import { IColumnExpression } from "./IColumnExpression";
import { IEntityExpression } from "./IEntityExpression";
import { SelectExpression } from "./SelectExpression";
import { RelationDataMetaData } from "../../MetaData/Relation/RelationDataMetaData";
import { IOrderExpression } from ".";

export class RelationDataExpression<T = any> implements IEntityExpression<T> {
    public name: string;
    public select?: SelectExpression<T>;
    protected get metaData() {
        if (!this._metaData)
            this._metaData = Reflect.getOwnMetadata(entityMetaKey, this.type);
        return this._metaData;
    }
    public get columns(): IColumnExpression[] {
        if (!this._columns) {
            if (this.metaData) {
                const primaryKeys = this.metaData.sourceRelationKeys.union(this.metaData.targetRelationKeys);
                this._columns = this.metaData.properties.select((o: keyof T) => new ColumnExpression(this, o, primaryKeys.contains(o))).toArray();
            }
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
                this._primaryColumns = this.columns.where((c) => c.isPrimary).toArray();
            else
                this._primaryColumns = [];
        }
        return this._primaryColumns;
    }
    public set primaryColumns(value) {
        this._primaryColumns = value;
    }
    private _metaData: RelationDataMetaData<T>;
    private _columns: IColumnExpression[];
    private _primaryColumns: IColumnExpression[];
    public defaultOrders: IOrderExpression[] = [];
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
        const clone = new RelationDataExpression(this.type, this.alias);
        clone.columns = this.columns.select(o => {
            const colClone = o.clone();
            colClone.entity = clone;
            return colClone;
        }).toArray();
        clone.name = this.name;
        return clone;
    }
}
