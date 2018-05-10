import { FunctionExpression } from "../ExpressionBuilder/Expression/index";
import { ExpressionBuilder } from "../ExpressionBuilder/ExpressionBuilder";
import { IColumnMetaData } from "./Interface/IColumnMetaData";
import { IEntityMetaData } from "./Interface/IEntityMetaData";
import { GenericType } from "../Common/Type";

export class ComputedColumnMetaData<TE = any, T = any> implements IColumnMetaData<TE, T> {
    applyOption(option: ComputedColumnMetaData): void {
        this.fn = option.fn;
        this.propertyName = option.propertyName as any;
    }
    public entity: IEntityMetaData<TE>;
    public description: string;
    private _fnExpression: FunctionExpression<TE, T>;
    get functionExpression(): FunctionExpression<TE, T> {
        if (!this._fnExpression)
            this._fnExpression = ExpressionBuilder.parse(this.fn, [this.entity.type]);
        return this._fnExpression;
    }
    public get type(): GenericType<T> {
        return this.functionExpression.type;
    }
    public fn: (item: TE) => T;
    public propertyName: keyof TE;
    constructor();
    constructor(entity: IEntityMetaData<TE>, fn: (item: TE) => T, propertyName: keyof TE)
    constructor(entity?: IEntityMetaData<TE>, fn?: (item: TE) => T, propertyName?: keyof TE) {
        if (entity)
            this.entity = entity;
        if (fn)
            this.fn = fn;
        if (propertyName)
            this.propertyName = propertyName;
    }

    public Copy(columnMeta: IColumnMetaData<TE>) {
        if (typeof columnMeta.propertyName !== "undefined")
            this.propertyName = columnMeta.propertyName;
        if (columnMeta.description)
            this.description = columnMeta.description;
    }
}
