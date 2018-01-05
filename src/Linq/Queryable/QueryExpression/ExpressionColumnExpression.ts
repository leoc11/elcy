import { columnMetaKey } from "../../../Decorator/DecoratorKey";
import { ExpressionBase } from "../../../ExpressionBuilder/Expression/index";
import { ColumnMetaData } from "../../../MetaData/index";
import { QueryBuilder } from "../QueryBuilder";
import { EntityExpression } from "./TableExpression";
import { ColumnExpression } from "./ColumnExpression";

export class ExpressionColumnExpression<TE = any> extends ColumnExpression<any, TE> {
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
    public entity: EntityExpression<TE>; // entity type/table where this column belong to.
    // tslint:disable-next-line:variable-name
    private _columnMetaData: ColumnMetaData<T>;
    constructor(entity: EntityExpression<TE>, propertyName: string, alias?: string) {
        this.entity = entity;
        this.propertyName = propertyName;
        this.alias = alias;
    }
    public toString(queryBuilder: QueryBuilder) {
        return queryBuilder.toColumnString(this);
    }
}
