import { FunctionExpression, MethodCallExpression, ObjectValueExpression } from "../../ExpressionBuilder/Expression/index";
import { ExpressionFactory } from "../../ExpressionBuilder/ExpressionFactory";
import { Enumerable } from "../Enumerable/Enumerable";
import { QueryBuilder } from "../QueryBuilder";
import { Queryable } from "./Queryable";
import { SelectExpression } from "./QueryExpression/SelectExpression";

export class PivotQueryable<T, TD extends { [key: string]: FunctionExpression<T, any> }, TM extends { [key: string]: FunctionExpression<T[] | Enumerable<T>, any> }, TResult extends {[key in (keyof TD & keyof TM)]: any }
    , TD1 extends { [key: string]: (o: T) => any } = any, TM1 extends { [key: string]: (o: T[] | Enumerable<T>) => any } = any> extends Queryable<TResult> {
    protected readonly dimensionFn: TD1;
    protected readonly metricFn: TM1;
    private _dimensions: ObjectValueExpression<TD>;
    protected get dimensions() {
        if (!this._dimensions && this.dimensionFn)
            this._dimensions = ExpressionFactory.prototype.ToObjectValueExpression(this.dimensionFn, Object);
        return this._dimensions;
    }
    protected set dimensions(value) {
        this._dimensions = value;
    }
    private _metrics: ObjectValueExpression<TM>;
    protected get metrics() {
        if (!this._metrics && this.metricFn)
            this._metrics = ExpressionFactory.prototype.ToObjectValueExpression(this.metricFn, Object);
        return this._metrics;
    }
    protected set metrics(value) {
        this._metrics = value;
    }
    constructor(public readonly parent: Queryable<T>, dimensions: TD1 | ObjectValueExpression<TD>, metrics: TM1 | ObjectValueExpression<TM>) {
        super(Object);
        if (dimensions instanceof ObjectValueExpression)
            this.dimensions = dimensions;
        else
            this.dimensionFn = dimensions;
        if (metrics instanceof ObjectValueExpression)
            this.metrics = metrics;
        else
            this.metricFn = metrics;
    }
    public buildQuery(queryBuilder: QueryBuilder): SelectExpression<TResult> {
        if (!this.expression) {
            if (!(this.dimensions instanceof ObjectValueExpression)) {
                const dimension: TD = {} as any;
                for (const key in this.dimensions) {
                    const val: ((item: T) => any) = (this.dimensions as any)[key];
                    dimension[key] = val instanceof FunctionExpression ? val : ExpressionFactory.prototype.ToExpression(val, this.parent.type);
                }
                this.dimensions = new ObjectValueExpression(dimension);
            }
            if (!(this.metrics instanceof ObjectValueExpression)) {
                const metric: TM = {} as any;
                // tslint:disable-next-line:forin
                for (const key in this.metrics) {
                    const val: ((o: T[] | Enumerable<T>) => any) = (this.metrics as any)[key];
                    metric[key] = val instanceof FunctionExpression ? val : ExpressionFactory.prototype.ToExpression<T[] | Enumerable<T>, any, any>(val, Array);
                }
                this.metrics = new ObjectValueExpression(metric);
            }

            const objectOperand = this.parent.buildQuery(queryBuilder).clone() as SelectExpression;
            const methodExpression = new MethodCallExpression(objectOperand, "pivot", [this.dimensions, this.metrics]);
            const visitParam = { parent: objectOperand, type: "pivot" };
            this.expression = queryBuilder.visit(methodExpression, visitParam) as SelectExpression;
        }
        return this.expression as any;
    }
    public getHashCode() {
        const dimen = this.dimensionFn || this.dimensions.object;
        let code = Object.keys(dimen).sum((o: any) => Array.from(o + dimen[o].toString()).sum((p) => p.charCodeAt(0)));
        const metric = this.metricFn || this.metrics.object;
        code += Object.keys(metric).sum((o: any) => Array.from(o + metric[o].toString()).sum((p) => p.charCodeAt(0)));
        return this.parent.getHashCode() + "-PV" + code;
    }
}
