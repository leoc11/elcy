import { ColumnType } from "../Common/ColumnType";
import { ColumnGeneration } from "../Common/Enum";
import { DbValue, GenericType, PrimitiveType, StringKeyOf, ValueType } from "../Common/Type";
import { IColumnOption } from "../Decorator/Option/IColumnOption";
import { FunctionExpression } from "../ExpressionBuilder/Expression/FunctionExpression";
import { ExpressionBuilder } from "../ExpressionBuilder/ExpressionBuilder";
import { IColumnMetaData, CustomDataMapper } from "./Interface/IColumnMetaData";
import { IEntityMetaData } from "./Interface/IEntityMetaData";

export abstract class ColumnMetaData<TE extends object = any, T = ValueType, TDb = DbValue> implements IColumnMetaData<TE, T, TDb> {
    public get default() {
        return this._default;
    }
    public set default(value) {
        this._default = value;
        this._defaultExp = null;
    }
    public get defaultExp() {
        if (!this._defaultExp && this.default) {
            this._defaultExp = ExpressionBuilder.parse(this.default);
        }
        return this._defaultExp;
    }
    public get isPrimaryColumn(): boolean {
        return this.entity.primaryKeys.includes(this as IColumnMetaData<TE>);
    }
    constructor(entityMeta?: IEntityMetaData<TE>, type?: PrimitiveType<T>);
    constructor(entityMeta?: IEntityMetaData<TE>, type?: GenericType<T>);
    constructor(entityMeta?: IEntityMetaData<TE>, type?: GenericType<T>) {
        if (typeof type !== "undefined") {
            this.type = type;
        }
        if (entityMeta) {
            this.entity = entityMeta;
        }
    }
    public _defaultExp?: FunctionExpression<T>;
    public charset: string;
    public collation: string;
    public columnName: string;
    public columnType: ColumnType;
    public description: string;
    public entity: IEntityMetaData<TE>;
    public generation?: ColumnGeneration;
    public isProjected: boolean;
    public isReadOnly: boolean;
    public nullable: boolean;
    public propertyName?: StringKeyOf<TE>;
    public type: GenericType<T>;
    private _default?: () => T;

    public customMapper?: CustomDataMapper<T, TDb>;

    public applyOption(columnMeta: IColumnOption<T, TDb> | IColumnMetaData<TE, T, TDb>) {
        if (!this.type && typeof columnMeta.type !== "undefined") {
            this.type = columnMeta.type;
        }
        if (typeof (columnMeta as IColumnMetaData<TE>).propertyName !== "undefined") {
            this.propertyName = (columnMeta as IColumnMetaData<TE>).propertyName;
        }
        if (typeof columnMeta.columnName !== "undefined") {
            this.columnName = columnMeta.columnName;
        }
        if (columnMeta.description) {
            this.description = columnMeta.description;
        }
        if (typeof columnMeta.nullable !== "undefined") {
            this.nullable = columnMeta.nullable;
        }
        if (typeof columnMeta.columnType !== "undefined") {
            this.columnType = columnMeta.columnType;
        }
        if (typeof columnMeta.collation !== "undefined") {
            this.collation = columnMeta.collation;
        }
        if (typeof columnMeta.charset !== "undefined") {
            this.charset = columnMeta.charset;
        }
        if (typeof columnMeta.isProjected !== "undefined") {
            this.isProjected = columnMeta.isProjected;
        }
        if (typeof columnMeta.isReadOnly !== "undefined") {
            this.isReadOnly = columnMeta.isReadOnly;
        }
        if (typeof columnMeta.generation !== "undefined") {
            this.generation = columnMeta.generation;
        }
        if (typeof (columnMeta as IColumnOption).default !== "undefined") {
            this.default = (columnMeta as IColumnOption<T>).default;
        }
        if (columnMeta.customMapper) {
            this.customMapper = columnMeta.customMapper;
        }
    }
}
