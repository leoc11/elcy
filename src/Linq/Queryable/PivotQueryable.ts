import { FunctionExpression, MethodCallExpression } from "../../ExpressionBuilder/Expression/index";
import { ExpressionFactory } from "../../ExpressionBuilder/ExpressionFactory";
import { Enumerable } from "../Enumerable/Enumerable";
import { QueryBuilder } from "../QueryBuilder";
import { Queryable } from "./Queryable";
import { SelectExpression } from "./QueryExpression/SelectExpression";
import { IObjectType } from "../../Common/Type";
import { IQueryVisitParameter } from "../QueryExpressionVisitor";

export class PivotQueryable<T,
    TD extends FunctionExpression<T, any>,
    TM extends FunctionExpression<T[] | Enumerable<T>, any>,
    TResult extends { [key in (keyof TD & keyof TM)]: any },
    TD1 extends { [key: string]: (o: T) => any } = any,
    TM1 extends { [key: string]: (o: T[] | Enumerable<T>) => any } = any> extends Queryable<TResult> {
    protected readonly dimensionFn: TD1;
    protected readonly metricFn: TM1;
    private _dimensions: TD;
    protected get dimensions() {
        if (!this._dimensions && this.dimensionFn)
            this._dimensions = ExpressionFactory.prototype.ToFunctionObjectValueExpression(this.dimensionFn, this.parent.type as IObjectType<T>, "d") as any;
        return this._dimensions;
    }
    protected set dimensions(value) {
        this._dimensions = value;
    }
    private _metrics: TM;
    protected get metrics() {
        if (!this._metrics && this.metricFn)
            this._metrics = ExpressionFactory.prototype.ToFunctionObjectValueExpression(this.metricFn, this.parent.type as IObjectType<T>, "m") as any;
        return this._metrics;
    }
    protected set metrics(value) {
        this._metrics = value;
    }
    constructor(public readonly parent: Queryable<T>, dimensions: TD1 | TD, metrics: TM1 | TM) {
        super(Object);
        if (dimensions instanceof FunctionExpression)
            this.dimensions = dimensions;
        else
            this.dimensionFn = dimensions;
        if (metrics instanceof FunctionExpression)
            this.metrics = metrics;
        else
            this.metricFn = metrics;
    }
    public buildQuery(queryBuilder: QueryBuilder): SelectExpression<TResult> {
        if (!this.expression) {
            const objectOperand = this.parent.buildQuery(queryBuilder).clone();
            const methodExpression = new MethodCallExpression(objectOperand, "pivot", [this.dimensions, this.metrics]);
            const visitParam: IQueryVisitParameter = { commandExpression: objectOperand as SelectExpression, scope: "pivot" };
            this.expression = queryBuilder.visit(methodExpression, visitParam) as SelectExpression;
        }
        return this.expression as any;
    }
    public getHashCode() {
        let code = Array.from(JSON.stringify(this.dimensionFn) || this.dimensions.toString()).sum((p) => p.charCodeAt(0));
        code += Array.from(JSON.stringify(this.metricFn) || this.metrics.toString()).sum((p) => p.charCodeAt(0));
        return this.parent.getHashCode() + "-PV" + code;
    }
}
