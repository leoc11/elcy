import { Enumerable } from "@elcy/enumerable";
import { OrderDirection } from "../../Common/StringType";
import { GenericType, IObjectType, ValueType } from "../../Common/Type";
import { ArrayValueExpression } from "../../ExpressionBuilder/Expression/ArrayValueExpression";
import { IExpression } from "../../ExpressionBuilder/Expression/IExpression";
import { hashCode, hashCodeAdd } from "../../Helper/Util";
import { ColumnExpression } from "./ColumnExpression";
import { IColumnExpression } from "./IColumnExpression";
import { IEntityExpression } from "./IEntityExpression";
import { SelectExpression } from "./SelectExpression";
import { SqlParameterExpression } from "./SqlParameterExpression";

export abstract class ProjectionEntityExpression<T extends object = object> implements IEntityExpression<T> {
    public get primaryColumns(): IColumnExpression<T>[] {
        if (!this._primaryColumns) {
            this._primaryColumns = this.columns.filter((o) => o.isPrimary);
        }
        return this._primaryColumns;
    }
    public get relationColumns() {
        return this.subSelect.relationColumns.map((o) => this.columns.find((c) => c.columnName === o.columnName));
    }
    public get selectedColumns() {
        if (!this._selectedColumns) {
            this._selectedColumns = this.subSelect.selects.map((o) => this.columns.find((c) => c.columnName === o.columnName));
        }
        return this._selectedColumns;
    }
    constructor(public subSelect: SelectExpression<T>, type?: GenericType<T>) {
        subSelect.isSubSelect = true;
        this.alias = subSelect.entity.alias;
        this.name = subSelect.entity.name;
        this.columns = Enumerable.from(subSelect.projectedColumns).map((o) => {
            const col = new ColumnExpression<T, ValueType>(this, o.type, o.propertyName, o.columnName, o.isPrimary, o.isNullable);
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
    public columns: IColumnExpression<T>[];
    public defaultOrders: Array<ArrayValueExpression<((...param: T[]) => ValueType) | OrderDirection>> = [];
    public readonly entityTypes: IObjectType[];
    public name: string = "";
    public paramExps: SqlParameterExpression[] = [];
    public select?: SelectExpression<T>;
    public readonly type: GenericType<T>;
    private _primaryColumns: IColumnExpression<T>[];
    private _selectedColumns: IColumnExpression<T>[];
    public abstract clone(replaceMap?: Map<IExpression, IExpression>): ProjectionEntityExpression<T>;
    public hashCode() {
        return hashCodeAdd(hashCode("PROJECTION", this.subSelect.hashCode()), this.columns.reduce((r, o) => r + o.hashCode(), 0));
    }
    public toString(): string {
        return `ProjectionEntity(${this.subSelect.toString()})`;
    }
}
