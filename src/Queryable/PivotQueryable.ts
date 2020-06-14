import { IObjectType, ObjectFunctionExpression, Pivot } from "../Common/Type";
import { Enumerable } from "../Enumerable/Enumerable";
import { FunctionExpression } from "../ExpressionBuilder/Expression/FunctionExpression";
import { MethodCallExpression } from "../ExpressionBuilder/Expression/MethodCallExpression";
import { toObjectFunctionExpression } from "../Helper/ExpressionUtil";
import { hashCode, hashCodeAdd } from "../Helper/Util";
import { IQueryVisitor } from "../Query/IQueryVisitor";
import { IQueryVisitParameter } from "../Query/IQueryVisitParameter";
import { Queryable } from "./Queryable";
import { QueryExpression } from "./QueryExpression/QueryExpression";
import { SelectExpression } from "./QueryExpression/SelectExpression";

export class PivotQueryable<T,
    TD extends { [key: string]: (o: T) => any } = any,
    TM extends { [key: string]: (o: T[] | Enumerable<T>) => any } = any>
    extends Queryable<Pivot<T, TD, TM>> {
    protected get dimensions() {
        if (!this._dimensions && this.dimensionFn) {
            this._dimensions = toObjectFunctionExpression(this.dimensionFn, this.parent.type as IObjectType<T>, "d", this.stackTree.node);
        }
        return this._dimensions;
    }
    protected set dimensions(value) {
        this._dimensions = value;
    }
    protected get metrics() {
        if (!this._metrics && this.metricFn) {
            this._metrics = toObjectFunctionExpression(this.metricFn, this.parent.type as IObjectType<T>, "m", this.stackTree.node);
        }
        return this._metrics;
    }
    protected set metrics(value) {
        this._metrics = value;
    }
    constructor(public readonly parent: Queryable<T>, dimensions: TD | ObjectFunctionExpression<TD>, metrics: TM | ObjectFunctionExpression<TM>) {
        super(Object, parent);
        if (dimensions instanceof FunctionExpression) {
            this.dimensions = dimensions;
        }
        else {
            this.dimensionFn = dimensions;
        }
        if (metrics instanceof FunctionExpression) {
            this.metrics = metrics;
        }
        else {
            this.metricFn = metrics;
        }
    }
    protected readonly dimensionFn: TD;
    protected readonly metricFn: TM;
    private _dimensions: ObjectFunctionExpression<TD>;
    private _metrics: ObjectFunctionExpression<TM>;
    public buildQuery(visitor: IQueryVisitor): QueryExpression<Array<Pivot<T, TD, TM>>> {
        const objectOperand = this.parent.buildQuery(visitor) as SelectExpression<T>;
        const methodExpression = new MethodCallExpression(objectOperand, "pivot", [this.dimensions.clone(), this.metrics.clone()]);
        const visitParam: IQueryVisitParameter = { selectExpression: objectOperand, scope: "queryable" };
        return visitor.visit(methodExpression, visitParam) as any;
    }
    public hashCode() {
        let code = this.dimensions.hashCode();
        code += this.metrics.hashCode();
        return hashCodeAdd(hashCode("PIVOT", this.parent.hashCode()), code);
    }
}
