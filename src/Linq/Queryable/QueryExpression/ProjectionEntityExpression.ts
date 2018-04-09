import { GenericType } from "../../../Common/Type";
import { QueryBuilder } from "../../QueryBuilder";
import { IColumnExpression } from "./IColumnExpression";
import { IEntityExpression } from "./IEntityExpression";
import { IOrderExpression } from "./IOrderExpression";
import { SelectExpression } from "./SelectExpression";

export class ProjectionEntityExpression<T = any> implements IEntityExpression<T> {
    public name: string = "";
    public columns: IColumnExpression[];
    public get primaryColumns(): IColumnExpression[] {
        if (!this._primaryColumns) {
            this._primaryColumns = this.columns.where((o) => o.isPrimary).toArray();
        }
        return this._primaryColumns;
    }
    public defaultOrders: IOrderExpression[] = [];
    protected _columns: IColumnExpression[];
    private _primaryColumns: IColumnExpression[];
    public alias: string;
    constructor(public select: SelectExpression, public readonly type: GenericType<T> = Object as any) {
        this.select.parent = this;
        this.alias = this.select.entity.alias;
        this.name = select.entity.name;
        this.columns = select.selects.select(o => {
            const col = o.clone();
            col.entity = this;
            return col;
        }).toArray();
        this.defaultOrders = select.orders.splice(0);
    }
    public toString(queryBuilder: QueryBuilder): string {
        return queryBuilder.getExpressionString(this);
    }
    public execute(queryBuilder: QueryBuilder): any {
        return queryBuilder.getExpressionString(this);
    }
    public clone() {
        const clone = new ProjectionEntityExpression(this.select, this.type);
        clone.alias = this.alias;
        clone.defaultOrders = this.defaultOrders.splice(0);
        clone.name = this.name;
        clone.columns = this.columns.splice(0);
        return clone;
    }
}
