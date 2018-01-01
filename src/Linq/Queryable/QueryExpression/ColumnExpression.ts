import { columnMetaKey } from "../../../Decorator/DecoratorKey";
import { ColumnMetaData } from "../../../MetaData/index";
import { QueryBuilder } from "../QueryBuilder";
import { TableExpression } from "./TableExpression";

export class ColumnExpression<T = any, TE = any> {
    // Column name on db
    public get name() {
        return this.columnMetaData.name;
    }
    public alias?: string;
    public propertyName: string;
    public get columnMetaData() {
        if (!this._columnMetaData)
            this._columnMetaData = Reflect.getOwnMetadata(columnMetaKey, this.entity.type, this.propertyName);
        return this._columnMetaData;
    }
    public entity: TableExpression<TE>; // entity type/table where this column belong to.
    // tslint:disable-next-line:variable-name
    private _columnMetaData: ColumnMetaData<T>;
    constructor(entity: TableExpression<TE>, propertyName: string, alias?: string) {
        this.entity = entity;
        this.propertyName = propertyName;
        this.alias = alias;
    }
    public toString(queryBuilder: QueryBuilder) {
        return queryBuilder.toColumnString(this);
    }
}
