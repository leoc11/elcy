import { IObjectType } from "../Common/Type";
import { entityMetaKey } from "../Decorator/DecoratorKey";
import { FunctionExpression } from "../ExpressionBuilder/Expression/index";
import { IEntityMetaData } from "../MetaData/Interface/index";
import { IColumnQueryExpression } from "./Interface/IColumnQueryExpression";
import { IEntityQueryExpression } from "./Interface/IEntityQueryExpression";
import { IOrderQueryExpression } from "./Interface/IOrderQueryExpression";

export class SelectQueryExpression<T> implements IEntityQueryExpression<T> {
    public columns: Array<IColumnQueryExpression<T>> = [];
    public innerQueries: Array<SelectQueryExpression<T>> = [];
    public where?: FunctionExpression<T, boolean>;
    public having?: FunctionExpression<T, boolean>;
    public orderBy: Array<IOrderQueryExpression<T>> = [];
    public groupBy: string[] = [];
    public pagging: { skip?: number, take?: number } = {};
    public parameters: { [key: string]: any } = {};
    public enableEscape: boolean = true;
    public distinct: boolean = false;
    // tslint:disable-next-line:variable-name
    private _defaultOrders: Array<IOrderQueryExpression<T>>;
    constructor(public type: IObjectType<T>, public alias: string) {
    }

    get allOrderBys() {
        if (!this.orderBy || !Object.keys(this.orderBy).length) {
            if (!this._defaultOrders) {
                const entityMetaData: IEntityMetaData<T> = Reflect.getOwnMetadata(entityMetaKey, this.type);
                if (entityMetaData && entityMetaData.defaultOrder) {
                    this._defaultOrders = Object.keys(entityMetaData.defaultOrder).reduce((orderBy, property: keyof T) => {
                        orderBy.add({ entity: this, property, direction: entityMetaData.defaultOrder![property] });
                        return orderBy;
                    }, [] as Array<IOrderQueryExpression<T>>);
                }
            }
            return this._defaultOrders || {};
        }

        return this.orderBy;
    }
}
