import { IExpression } from "../ExpressionBuilder/Expression/index";
import { ExpressionFactory } from "../ExpressionBuilder/ExpressionFactory";
import { IColumnMetaData } from "./Interface";
import { genericType } from "./Types";
// tslint:disable-next-line:max-classes-per-file
export class ComputedColumnMetaData<T, R> implements IColumnMetaData<R> {
    public description: string;
    // tslint:disable-next-line:variable-name
    private _fnExpressionFactory: ((item: IExpression<T>) => IExpression<R>);
    get functionExpressionFactory(): ((item: IExpression<T>) => IExpression<R>) {
        if (!this._fnExpressionFactory)
            this._fnExpressionFactory = ExpressionFactory.prototype.GetExpressionFactory(this.fn);
        return this._fnExpressionFactory;
    }
    // tslint:disable-next-line:no-shadowed-variable
    constructor(public type: genericType<R>, public fn: (item: T) => R, public name: string) {
    }

    /**
     * Copy
     */
    public Copy(columnMeta: IColumnMetaData<any>) {
        if (typeof columnMeta.name !== "undefined")
            this.name = columnMeta.name;
        if (columnMeta.description)
            this.description = columnMeta.description;
    }
}
