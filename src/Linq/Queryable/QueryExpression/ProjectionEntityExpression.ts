import { GenericType } from "../../../Common/Type";
import { QueryBuilder } from "../../QueryBuilder";
import { IColumnExpression } from "./IColumnExpression";
import { IEntityExpression } from "./IEntityExpression";
import { IOrderExpression } from "./IOrderExpression";
import { SelectExpression } from "./SelectExpression";
import { ColumnExpression } from ".";

export class ProjectionEntityExpression<T = any> implements IEntityExpression<T> {
    public name: string = "";
    public columns: IColumnExpression[];
    public select?: SelectExpression<T>;
    public get primaryColumns(): IColumnExpression[] {
        if (!this._primaryColumns) {
            this._primaryColumns = this.columns.where((o) => o.isPrimary).toArray();
        }
        return this._primaryColumns;
    }
    public defaultOrders: IOrderExpression[] = [];
    protected _columns: IColumnExpression[];
    private _primaryColumns: IColumnExpression[];
    private _selectedColumns: IColumnExpression[];
    public alias: string;
    constructor(public subSelect: SelectExpression, public readonly type: GenericType<T> = Object as any) {
        this.alias = subSelect.entity.alias;
        this.name = subSelect.entity.name;
        this.columns = subSelect.projectedColumns.select(o => {
            const col = new ColumnExpression(this, o.propertyName, o.type, o.isPrimary, o.columnName);
            col.columnType = o.columnType;
            col.columnMetaData = o.columnMetaData;
            return col;
        }).toArray();
        this.defaultOrders = subSelect.orders.slice(0);
    }
    public get selectedColums() {
        if (!this._selectedColumns)
            this._selectedColumns = this.subSelect.selects.select(o => this.columns.first(c => c.columnName === o.columnName)).toArray();
        return this._selectedColumns;
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
        clone.defaultOrders = this.defaultOrders.slice(0);
        clone.name = this.name;
        clone.columns = this.columns.slice(0);
        return clone;
    }
}
