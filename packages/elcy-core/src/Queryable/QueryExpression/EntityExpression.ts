import { Enumerable } from "@elcy/enumerable";
import type { OrderDirection } from "../../Common/StringType";
import type { IObjectType, ValueType } from "../../Common/Type";
import { ArrayValueExpression } from "../../ExpressionBuilder/Expression/ArrayValueExpression";
import type { IExpression } from "../../ExpressionBuilder/Expression/IExpression";
import { hashCode, resolveClone } from "../../Helper/Util";
import { ComputedColumnMetaData } from "../../MetaData/ComputedColumnMetaData";
import { ColumnExpression } from "./ColumnExpression";
import { IColumnExpression } from "./IColumnExpression";
import { IEntityExpression } from "./IEntityExpression";
import { SelectExpression } from "./SelectExpression";
import { getEntityMetadata } from "src/MetaData/MetaDataMapper";
import { IEntityMetaData } from "src/MetaData/Interface/IEntityMetaData";

export class EntityExpression<TE extends object = object> implements IEntityExpression<TE> {
    public get columns(): Array<IColumnExpression<TE>> {
        if (!this._columns) {
            if (this.metaData) {
                this._columns = Enumerable.from(this.metaData.columns)
                    .filter((o) => !(o instanceof ComputedColumnMetaData))
                    .map((o) => new ColumnExpression(this, o, this.metaData.primaryKeys.includes(o)))
                    .toArray();
            }
            else {
                this._columns = [];
            }
        }
        return this._columns;
    }
    public set columns(value) {
        this._columns = value;
    }
    public get defaultOrders(): Array<ArrayValueExpression<((...param: TE[]) => ValueType) | OrderDirection>> {
        if (!this._defaultOrders) {
            if (this.metaData && this.metaData.defaultOrders) {
                this._defaultOrders = this.metaData.defaultOrders.slice();
            }
            else {
                this._defaultOrders = [];
            }
        }
        return this._defaultOrders;
    }
    public get deleteColumn() {
        if (typeof this._deleteColumn === "undefined") {
            this._deleteColumn = !this.metaData || !this.metaData.deletedColumn ? null : this.columns.find((o) => o.propertyName === this.metaData.deletedColumn.propertyName) as IColumnExpression<TE, boolean>;
        }
        return this._deleteColumn;
    }
    public get metaData() {
        if (!this._metaData) {
            this._metaData = getEntityMetadata(this.type);
        }
        return this._metaData;
    }
    public get modifiedColumn() {
        if (typeof this._modifiedColumn === "undefined") {
            this._modifiedColumn = !this.metaData || !this.metaData.modifiedDateColumn ? null : this.columns.find((o) => o.propertyName === this.metaData.modifiedDateColumn.propertyName) as IColumnExpression<TE, Date>;
        }
        return this._modifiedColumn;
    }
    public get primaryColumns(): Array<IColumnExpression<TE>> {
        if (!this._primaryColumns) {
            if (this.metaData) {
                this._primaryColumns = this.metaData.primaryKeys.map((o) => this.columns.find((c) => c.columnName === o.columnName));
            }
            else {
                this._primaryColumns = [];
            }
        }
        return this._primaryColumns;
    }
    public set primaryColumns(value) {
        this._primaryColumns = value;
    }
    public get versionColumn() {
        if (typeof this._versionColumn === "undefined") {
            this._versionColumn = !this.metaData || !this.metaData.versionColumn ? null : this.columns.find((o) => o.propertyName === this.metaData.versionColumn.propertyName) as IColumnExpression<TE, Uint8Array>;
        }
        return this._versionColumn;
    }
    constructor(public readonly type: IObjectType<TE>, public alias: string, public isRelationData?: boolean) {
        if (this.metaData) {
            this.name = this.metaData.name;
            this.schema = this.metaData.schema;
            this.entityTypes = [this.metaData.type];
        }
        else {
            this.entityTypes = [this.type];
        }
    }
    public readonly entityTypes: IObjectType[];
    public name: string;
    public schema?: string;
    public select?: SelectExpression<TE>;
    private _columns: Array<IColumnExpression<TE>>;
    private _defaultOrders: Array<ArrayValueExpression<((...param: TE[]) => ValueType) | OrderDirection>>;
    private _deleteColumn: IColumnExpression<TE, boolean>;
    private _metaData: IEntityMetaData<TE>;
    private _modifiedColumn: IColumnExpression<TE, Date>;
    private _primaryColumns: IColumnExpression<TE>[];
    private _versionColumn: IColumnExpression<TE, Uint8Array>;
    public clone(replaceMap?: Map<IExpression, IExpression>): EntityExpression<TE> {
        if (!replaceMap) {
            replaceMap = new Map();
        }
        const clone = new EntityExpression(this.type, this.alias);
        replaceMap.set(this, clone);
        clone.columns = this.columns.map((o) => {
            let cloneCol = clone.columns.find((c) => c.propertyName === o.propertyName);
            if (!cloneCol) {
                cloneCol = resolveClone(o, replaceMap);
            }
            replaceMap.set(o, cloneCol);
            return cloneCol;
        });
        clone.name = this.name;
        return clone;
    }
    public hashCode() {
        return hashCode(this.name);
    }
    public toString(): string {
        return `Entity(${this.name})`;
    }
}
