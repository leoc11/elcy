import { IObjectType } from "../../../Common/Type";
import { QueryBuilder } from "../../QueryBuilder";
import { ColumnExpression } from "./ColumnExpression";
import { IColumnExpression } from "./IColumnExpression";
import { IEntityExpression } from "./IEntityExpression";
import { ComputedColumnExpression } from "./index";
import { IOrderExpression } from "./IOrderExpression";
import { JoinEntityExpression } from "./JoinEntityExpression";
import { SelectExpression } from "./SelectExpression";

export class ProjectionEntityExpression<T = any> implements IEntityExpression<T> {
    public name: string = "";
    public parent?: JoinEntityExpression<any>;
    public get columns(): IColumnExpression[] {
        if (!this._columns) {
            this._columns = this.select.columns.select((o) => {
                if (o instanceof ComputedColumnExpression) {
                    return new ColumnExpression(this, o.alias);
                }
                return new ColumnExpression(this, o.alias ? o.alias : o.property, o.alias === "" ? "" : undefined);
            }).toArray();
        }
        return this._columns;
    }
    public get primaryColumns(): IColumnExpression[] {
        if (!this._primaryColumns) {
            this._primaryColumns = this.columns.where((o) => this.select.entity.primaryColumns.any((c) => c.property === o.property)).toArray();
        }
        return this._primaryColumns;
    }
    public get defaultOrders(): IOrderExpression[] {
        return this.select.orders;
    }
    private _columns: IColumnExpression[];
    private _primaryColumns: IColumnExpression[];
    constructor(public select: SelectExpression, public alias: string, public readonly type: IObjectType<T> = Object as any) {
        this.select.parent = this;
    }
    public toString(queryBuilder: QueryBuilder): string {
        return queryBuilder.getExpressionString(this);
    }
    public execute(queryBuilder: QueryBuilder): any {
        return queryBuilder.getExpressionString(this);
    }
}
