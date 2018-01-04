import { IObjectType } from "../../../Common/Type";
import { entityMetaKey } from "../../../Decorator/DecoratorKey";
import { EntityMetaData } from "../../../MetaData";
import { QueryBuilder } from "../QueryBuilder";
import { ColumnExpression } from "./ColumnExpression";
import { IOrderExpression } from "./IOrderExpression";
import { ISelectExpression } from "./ISelectExpression";

export class TableExpression<T = any> implements ISelectExpression {
    public get name() {
        return this.metaData.name;
    }
    public get metaData() {
        if (!this._metaData)
            this._metaData = Reflect.getOwnMetadata(entityMetaKey, this.type);
        return this._metaData;
    }
    public columns: ColumnExpression[] = [];
    public get defaultOrders(): IOrderExpression[] {
        if (!this._defaultOrders) {
            if (this.metaData.defaultOrder)
                this._defaultOrders = this.metaData.defaultOrder!.select((o) => ({
                    column: new ColumnExpression(this, o.property),
                    direction: o.direction
                })).toArray();
            else
                this._defaultOrders = [];
        }
        return this._defaultOrders;
    }
    public type: IObjectType<T>;
    public alias: string;
    // tslint:disable-next-line:variable-name
    private _metaData: EntityMetaData<T>;
    // tslint:disable-next-line:variable-name
    private _defaultOrders: IOrderExpression[];
    constructor(type: IObjectType<T>, alias: string) {
        this.type = type;
        this.alias = alias;
    }
    public toString(queryBuilder: QueryBuilder): string {
        return queryBuilder.toEntityString(this);
    }
}
