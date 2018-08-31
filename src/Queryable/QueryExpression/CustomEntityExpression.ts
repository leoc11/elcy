import { GenericType, IObjectType, } from "../../Common/Type";
import { QueryBuilder } from "../../QueryBuilder/QueryBuilder";
import { IColumnExpression } from "./IColumnExpression";
import { IEntityExpression } from "./IEntityExpression";
import { SelectExpression } from "./SelectExpression";
import { IOrderExpression } from "./IOrderExpression";

export class CustomEntityExpression<T = any> implements IEntityExpression<T> {
    public select?: SelectExpression<T>;
    public columns: IColumnExpression[];
    public get primaryColumns(): IColumnExpression[] {
        if (!this._primaryColumns) {
            this._primaryColumns = this.columns.where((o) => o.isPrimary).toArray();
        }
        return this._primaryColumns;
    }
    private _primaryColumns: IColumnExpression[];
    constructor(public name: string, columns: IColumnExpression[], public readonly type: GenericType<T>, public alias: string, public defaultOrders: IOrderExpression[] = []) {
        this.columns = columns.select(o => {
            const clone = o.clone();
            clone.entity = this;
            return clone;
        }).toArray();
    }
    public toString(queryBuilder: QueryBuilder): string {
        return queryBuilder.getExpressionString(this);
    }
    public execute(queryBuilder: QueryBuilder): any {
        return queryBuilder.getExpressionString(this);
    }
    public clone(): IEntityExpression<T> {
        const clone = new CustomEntityExpression(this.name, this.columns, this.type, this.alias);
        return clone;
    }
    public entityTypes: IObjectType[] = [];
}
