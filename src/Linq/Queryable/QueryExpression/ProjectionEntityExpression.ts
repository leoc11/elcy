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
                    return new ColumnExpression(this, o.alias!, o.type, o.isPrimary);
                }
                return new ColumnExpression(this, o.alias ? o.alias : o.property, o.type, o.isPrimary, o.isShadow);
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
                this.type = this.select.type as any;
            }
            else {
                this.type = Object as any;
            }
        }
        this.path = select.entity.path;
    }
    public toString(queryBuilder: QueryBuilder): string {
        return queryBuilder.getExpressionString(this);
    }
    public execute(queryBuilder: QueryBuilder): any {
        return queryBuilder.getExpressionString(this);
    }
}
