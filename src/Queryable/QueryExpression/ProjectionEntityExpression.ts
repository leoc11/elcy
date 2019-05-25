import { GenericType, IObjectType } from "../../Common/Type";
import { IEnumerable } from "../../Enumerable/IEnumerable";
import { IExpression } from "../../ExpressionBuilder/Expression/IExpression";
import { hashCode, hashCodeAdd } from "../../Helper/Util";
import { IOrderQueryDefinition } from "../Interface/IOrderQueryDefinition";
import { ColumnExpression } from "./ColumnExpression";
import { IColumnExpression } from "./IColumnExpression";
import { IEntityExpression } from "./IEntityExpression";
import { SelectExpression } from "./SelectExpression";
import { SqlParameterExpression } from "./SqlParameterExpression";

export abstract class ProjectionEntityExpression<T = any> implements IEntityExpression<T> {
    public get primaryColumns(): IColumnExpression[] {
        if (!this._primaryColumns) {
            this._primaryColumns = this.columns.where((o) => o.isPrimary).toArray();
        }
        return this._primaryColumns;
    }
    public get relationColumns(): IEnumerable<IColumnExpression> {
        return this.subSelect.relationColumns.select((o) => this.columns.first((c) => c.columnName === o.columnName));
    }
    public get selectedColumns() {
        if (!this._selectedColumns) {
            this._selectedColumns = this.subSelect.selects.select((o) => this.columns.first((c) => c.columnName === o.columnName)).toArray();
        }
        return this._selectedColumns;
    }
    constructor(public subSelect: SelectExpression<T>, type?: GenericType<T>) {
        subSelect.isSubSelect = true;
        this.alias = subSelect.entity.alias;
        this.name = subSelect.entity.name;
        this.columns = subSelect.projectedColumns.select((o) => {
            const col = new ColumnExpression(this, o.type, o.propertyName, o.columnName, o.isPrimary, o.isNullable);
            col.columnMeta = o.columnMeta;
            return col;
        }).toArray();
        // TODO
        // this.defaultOrders = subSelect.orders.slice(0) as any;
        this.entityTypes = this.subSelect.entity.entityTypes.slice();
        this.type = type ? type : subSelect.itemType;
        this.paramExps = subSelect.paramExps;
    }
    public alias: string;
    public columns: IColumnExpression[];
    public defaultOrders: IOrderQueryDefinition[] = [];
    public readonly entityTypes: IObjectType[];
    public name: string = "";
    public paramExps: SqlParameterExpression[] = [];
    public select?: SelectExpression<T>;
    public readonly type: GenericType<T>;
    private _primaryColumns: IColumnExpression[];
    private _selectedColumns: IColumnExpression[];
    public abstract clone(replaceMap?: Map<IExpression, IExpression>): ProjectionEntityExpression<T>;
    public hashCode() {
        return hashCodeAdd(hashCode("PROJECTION", this.subSelect.hashCode()), this.columns.sum((o) => o.hashCode()));
    }
    public toString(): string {
        return `ProjectionEntity(${this.subSelect.toString()})`;
    }
}
