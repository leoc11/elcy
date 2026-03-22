import { Enumerable } from "@elcy/enumerable";
import { OrderDirection } from "../../Common/StringType";
import { GenericType, IObjectType, StringKeyOf, ValueType } from "../../Common/Type";
import { ArrayValueExpression } from "../../ExpressionBuilder/Expression/ArrayValueExpression";
import { IExpression } from "../../ExpressionBuilder/Expression/IExpression";
import { hashCode, hashCodeAdd, resolveClone } from "../../Helper/Util";
import { ColumnExpression } from "./ColumnExpression";
import { IColumnExpression } from "./IColumnExpression";
import { IEntityExpression } from "./IEntityExpression";
import { SelectExpression } from "./SelectExpression";
import { SqlParameterExpression } from "./SqlParameterExpression";

export class ProjectionEntityExpression<TE extends object = object> implements IEntityExpression<TE> {
    public get primaryColumns(): IColumnExpression<TE>[] {
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
    constructor(public subSelect: SelectExpression<TE>, type?: GenericType<TE>) {
        subSelect.isSubSelect = true;
        this.alias = subSelect.entity.alias;
        this.name = subSelect.entity.name;
        this.columns = Enumerable.from(subSelect.projectedColumns).map((o) => {
            const col = new ColumnExpression(this, o.type, o.propertyName as StringKeyOf<TE>, o.columnName, o.isPrimary, o.isNullable);
            col.columnMeta = o.columnMeta;
            return col;
        }).toArray();
        // TODO
        // this.defaultOrders = subSelect.orders.slice(0) as any;
        this.entityTypes = this.subSelect.entity.entityTypes.slice();
        this.type = type ?? subSelect.itemType as GenericType<TE>;
        this.paramExps = subSelect.paramExps;
    }
    public alias: string;
    public columns: IColumnExpression<TE>[];
    public defaultOrders: Array<ArrayValueExpression<((...param: TE[]) => ValueType) | OrderDirection>> = [];
    public readonly entityTypes: IObjectType[];
    public name: string = "";
    public paramExps: SqlParameterExpression[] = [];
    public select?: SelectExpression<TE>;
    public readonly type: GenericType<TE>;
    private _primaryColumns: IColumnExpression<TE>[];
    private _selectedColumns: IColumnExpression<TE>[];

    public clone(replaceMap?: Map<IExpression, IExpression>) {
        if (!replaceMap) {
            replaceMap = new Map();
        }

        const subSelect = resolveClone(this.subSelect, replaceMap);
        const clone = new ProjectionEntityExpression(subSelect, this.type);
        replaceMap.set(this, clone);
        return clone;
    }
    public hashCode() {
        return hashCodeAdd(hashCode("PROJECTION", this.subSelect.hashCode()), this.columns.reduce((r, o) => r + o.hashCode(), 0));
    }
    public toString(): string {
        return `ProjectionEntity(${this.subSelect.toString()})`;
    }
}
