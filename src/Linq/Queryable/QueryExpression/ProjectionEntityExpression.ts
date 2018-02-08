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
    public path?: string;
    public parent?: JoinEntityExpression<any>;
    public get columns(): IColumnExpression[] {
        if (!this._columns) {
            this._columns = this.select.columns.select((o) => {
                if (o instanceof ComputedColumnExpression) {
                    return new ColumnExpression(o.entity.path ? o.entity : this, o.alias!, o.type, o.isPrimary);
                }
                return new ColumnExpression(o.entity.path ? o.entity : this, o.alias ? o.alias : o.property, o.type, o.isPrimary, o.alias === "" ? "" : undefined);
            }).toArray();
        }
        return this._columns;
    }
    public get primaryColumns(): IColumnExpression[] {
        if (!this._primaryColumns) {
            this._primaryColumns = this.columns.where((o) => o.isPrimary).toArray();
        }
        return this._primaryColumns;
    }
    public get defaultOrders(): IOrderExpression[] {
        return this.select.orders;
    }
    protected _columns: IColumnExpression[];
    private _primaryColumns: IColumnExpression[];
    public readonly type: IObjectType<T>;
    constructor(public select: SelectExpression, public alias: string, type?: IObjectType<T>) {
        this.select.parent = this;
        if (type) this.type = type;
        else {
            if (this.select.columns.all((o) => !o.alias)) {
                this.type = this.select.entity.type;
            }
            else {
                this.type = Object as any;
            }
        }
    }
    public toString(queryBuilder: QueryBuilder): string {
        return queryBuilder.getExpressionString(this);
    }
    public execute(queryBuilder: QueryBuilder): any {
        return queryBuilder.getExpressionString(this);
    }
}
