import { GenericType, IObjectType } from "../../Common/Type";
import { entityMetaKey } from "../../Decorator/DecoratorKey";
import { IExpression } from "../../ExpressionBuilder/Expression/IExpression";
import { hashCode } from "../../Helper/Util";
import { ComputedColumnMetaData } from "../../MetaData/ComputedColumnMetaData";
import { IEntityMetaData } from "../../MetaData/Interface/IEntityMetaData";
import { IOrderQueryDefinition } from "../Interface/IOrderQueryDefinition";
import { ColumnExpression } from "./ColumnExpression";
import { IColumnExpression } from "./IColumnExpression";
import { IEntityExpression } from "./IEntityExpression";
import { SelectExpression } from "./SelectExpression";

export class RawEntityExpression<T = any> implements IEntityExpression<T> {
    constructor(public readonly type: IObjectType<T>, public readonly sql: string, public alias: string) {
        this.entityTypes = [this.type];

        this.metaData = Reflect.getOwnMetadata(entityMetaKey, this.type);
        if (this.metaData) {
            this.columns = this.metaData.columns
                .where((o) => !(o instanceof ComputedColumnMetaData))
                .select((o) => new ColumnExpression<T>(this, o, this.metaData.primaryKeys.contains(o)))
                .toArray();
            this.defaultOrders = this.metaData.defaultOrders.slice();
            this.primaryColumns = this.metaData.primaryKeys.select((o) => this.columns.first((c) => c.columnName === o.columnName)).toArray();
        }
        else {
            this.defaultOrders = [];
            this.primaryColumns = [];
            // set columns based on default value
            const defaultItem = new this.type();
            this.columns = [];
            for (const propertyName of Object.keys(defaultItem).union(Object.keys(this.type.prototype))) {
                const value = defaultItem[propertyName];
                const valueType: GenericType = value ? value.constructor : String;
                const columnExp = new ColumnExpression<T>(this, valueType, propertyName as keyof T, propertyName, false, true);
                this.columns.push(columnExp);
            }
        }
    }
    public metaData: IEntityMetaData<T>;
    public readonly entityTypes: IObjectType[];
    public name: string;
    public select?: SelectExpression<T>;
    public readonly columns: Array<IColumnExpression<T>>;
    public readonly primaryColumns: IColumnExpression[];
    public readonly defaultOrders: IOrderQueryDefinition[];
    public clone(replaceMap?: Map<IExpression, IExpression>): RawEntityExpression<T> {
        const clone = new RawEntityExpression(this.type, this.sql, this.alias);
        replaceMap.set(this, clone);
        clone.name = this.name;
        return clone;
    }
    public hashCode() {
        return hashCode(this.name);
    }
    public toString(): string {
        return `Entity(${this.name}:${this.sql})`;
    }
}
