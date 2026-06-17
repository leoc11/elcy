import { IExpression } from "../../ExpressionBuilder/Expression/IExpression";
import { isNull } from "../../Helper/Util";
import { resolveClone } from "../../Helper/Expression";
import { hashCode } from "../../Helper/Hash";
import { ISqlParameterExpression } from "./ISqlParameterExpression";
import { ParameterExpression } from "src/ExpressionBuilder/Expression/ParameterExpression";
import { IEntityExpression } from "./IEntityExpression";
import { IColumnExpression } from "./IColumnExpression";
import { GenericType, IObjectType, StringKeyOf, ValueType } from "src/Common/Type";
import { SelectExpression } from "./SelectExpression";
import { ColumnExpression } from "./ColumnExpression";
import { OrderDirection } from "@elcy/enumerable";
import { ArrayValueExpression } from "src/ExpressionBuilder/Expression/ArrayValueExpression";
import { ColumnType } from "src/Common/ColumnType";

export type TSchema<TE extends object> = {
    [K in keyof TE]: GenericType<TE[K]> | { type: GenericType<TE[K]>, columnType: ColumnType, isPrimaryKey: boolean };
};
export type TSchemaType<TE> = TE extends TSchema<infer U> ? U : never;

export class SqlTableValueParameterExpression<TE extends object = object> implements ISqlParameterExpression<TE[]>, IEntityExpression<TE> {
    constructor(public readonly valueExp: ParameterExpression<TE[]>, public itemSchema: TSchema<TE>, public readonly parameterIndex?: number, alias?: string) {
        let properties: { [K in keyof TE]?: IColumnExpression<TE> } = {};
        let hasPrimary = false;
        if (itemSchema instanceof Object) {
            for (const prop in itemSchema) {
                if (prop === "constructor") {
                    this.type = itemSchema[prop] as GenericType<TE & TE[]>;
                    continue;
                }
                const propValue = itemSchema[prop];
                if (propValue instanceof Function) {
                    properties[prop] = new ColumnExpression(this, propValue as GenericType<ValueType>, prop, prop, false);
                }
                else {
                    properties[prop] = new ColumnExpression(this, propValue.type as GenericType<ValueType>, prop, prop, propValue.isPrimaryKey, true, propValue.columnType);
                    if (!hasPrimary) {
                        hasPrimary = propValue.isPrimaryKey;
                    }
                }
            }
        }
        else {
            this.type = itemSchema as GenericType<TE & TE[]>;
            const col = new ColumnExpression(this, itemSchema as unknown as GenericType<ValueType>, "__value" as StringKeyOf<TE>, "__value", false);
            properties[col.propertyName] = col;
        }

        if (this.parameterIndex > 0 && !hasPrimary) {
            const col = new ColumnExpression(this, Number, "__index" as StringKeyOf<TE>, "__index", true);
            properties = Object.assign({ [col.propertyName]: col }, properties);
        }

        this.properties = properties;
        this.alias = alias ?? this.name;
    }

    public get primaryColumns(): IColumnExpression<TE>[] {
        if (!this._primaryColumns) {
            this._primaryColumns = Object.values<IColumnExpression<TE>>(this.properties).filter((o) => o.isPrimary);
        }
        return this._primaryColumns;
    }

    public readonly columns: IColumnExpression<TE>[];
    public readonly properties: { [K in keyof TE]?: IColumnExpression<TE> };
    public entityTypes: IObjectType[] = [];
    public readonly defaultOrders: Array<ArrayValueExpression<((...param: TE[]) => ValueType) | OrderDirection>> = [];
    public get name(): string {
        const names = this.valueExp.name.split(':');
        const posfix = isNull(this.parameterIndex) ? "" : `_${this.parameterIndex}`;
        return `${names.pop()}${posfix}`;
    }
    public type: GenericType<TE & TE[]> = Object as any;
    public select?: SelectExpression<TE>;
    public schema?: string;
    private _primaryColumns: IColumnExpression<TE>[];
    public alias: string;
    public asTempTable: boolean;

    public hashCode() {
        return hashCode(this.name, Object.values<IColumnExpression>(this.properties).reduce((r, o) => r + o.hashCode(), 0));
    }
    public clone(replaceMap?: Map<IExpression, IExpression>): SqlTableValueParameterExpression<TE> {
        if (!replaceMap) {
            replaceMap = new Map();
        }
        const parameterExp = resolveClone(this.valueExp, replaceMap);
        const clone = new SqlTableValueParameterExpression(parameterExp, this.itemSchema, this.parameterIndex, this.alias);
        replaceMap.set(this, clone);
        return clone;
    }
}
