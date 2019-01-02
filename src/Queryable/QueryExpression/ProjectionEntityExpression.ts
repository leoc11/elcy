import { GenericType, IObjectType } from "../../Common/Type";
import { QueryBuilder } from "../../QueryBuilder/QueryBuilder";
import { IColumnExpression } from "./IColumnExpression";
import { IEntityExpression } from "./IEntityExpression";
import { SelectExpression } from "./SelectExpression";
import { ColumnExpression } from "./ColumnExpression";
import { IExpression } from "../../ExpressionBuilder/Expression/IExpression";
import { resolveClone, hashCode, hashCodeAdd } from "../../Helper/Util";
import { IOrderQueryDefinition } from "../Interface/IOrderQueryDefinition";
import { Enumerable } from "../../Enumerable/Enumerable";

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
    public defaultOrders: IOrderQueryDefinition[] = [];
    private _primaryColumns: IColumnExpression[];
    private _selectedColumns: IColumnExpression[];
    public alias: string;
    public readonly entityTypes: IObjectType[];
    public readonly type: GenericType<T>;
    constructor(public subSelect: SelectExpression<T>, type?: GenericType<T>) {
        subSelect.isSubSelect = true;
        this.alias = subSelect.entity.alias;
        this.name = subSelect.entity.name;
        this.columns = Enumerable.from(subSelect.projectedColumns).select(o => {
            const col = new ColumnExpression(this, o.type, o.propertyName, o.columnName, o.isPrimary, o.isNullable, o.columnType);
            col.columnMetaData = o.columnMetaData;
            return col;
        }).toArray();
        // TODO
        // this.defaultOrders = subSelect.orders.slice(0) as any;
        this.entityTypes = this.subSelect.entity.entityTypes.slice();
        this.type = type ? type : subSelect.itemType;
    }
    public get selectedColumns() {
        if (!this._selectedColumns)
            this._selectedColumns = this.subSelect.selects.select(o => this.columns.first(c => c.columnName === o.columnName)).toArray();
        return this._selectedColumns;
    }
    public get relationColumns() {
        return Enumerable.from(this.subSelect.relationColumns).select(o => this.columns.first(c => c.columnName === o.columnName)).toArray();
    }
    public toString(queryBuilder: QueryBuilder): string {
        return queryBuilder.getExpressionString(this);
    }
    public execute(queryBuilder: QueryBuilder): any {
        return queryBuilder.getExpressionString(this);
    }
    public clone(replaceMap?: Map<IExpression, IExpression>) {
        if (!replaceMap) replaceMap = new Map();
        const select = resolveClone(this.subSelect, replaceMap);
        const clone = new ProjectionEntityExpression(select, this.type);
        clone.alias = this.alias;
        clone.defaultOrders = this.defaultOrders.slice();
        clone.name = this.name;
        clone.columns = this.columns.select(o => {
            let cloneCol = clone.columns.first(c => c.propertyName === o.propertyName);
            if (!cloneCol) cloneCol = resolveClone(o, replaceMap);
            replaceMap.set(o, cloneCol);
            return cloneCol;
        }).toArray();
        replaceMap.set(this, clone);
        return clone;
    }
    public hashCode() {
        return hashCodeAdd(hashCode("PROJECTION", this.subSelect.hashCode()), this.columns.sum(o => o.hashCode()));
    }
}
