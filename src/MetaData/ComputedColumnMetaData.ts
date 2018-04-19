import { GenericType } from "../Common/Type";
import { IColumnOption } from "../Decorator/Option";
import { FunctionExpression } from "../ExpressionBuilder/Expression/index";
import { ExpressionBuilder } from "../ExpressionBuilder/ExpressionBuilder";

export class ComputedColumnMetaData<TE, T> implements IColumnOption<T> {
    public description: string;
    private _fnExpression: FunctionExpression<TE, T>;
    get functionExpression(): FunctionExpression<TE, T> {
        if (!this._fnExpression)
            this._fnExpression = ExpressionBuilder.parse(this.fn, [this.entityType]);
        return this._fnExpression;
    }
    public get type() {
        return this.functionExpression.type;
    }
    constructor(public entityType: GenericType<TE>, public fn: (item: TE) => T, public columnName: string) {
    }

    public Copy(columnMeta: IColumnOption<any>) {
        if (typeof columnMeta.columnName !== "undefined")
            this.columnName = columnMeta.columnName;
        if (columnMeta.description)
            this.description = columnMeta.description;
    }
}
