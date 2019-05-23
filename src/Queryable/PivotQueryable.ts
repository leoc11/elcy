import { Pivot } from "../Common/Type";
import { Enumerable } from "../Enumerable/Enumerable";
import { FunctionExpression } from "../ExpressionBuilder/Expression/FunctionExpression";
import { IExpression } from "../ExpressionBuilder/Expression/IExpression";
import { MethodCallExpression } from "../ExpressionBuilder/Expression/MethodCallExpression";
import { ObjectValueExpression } from "../ExpressionBuilder/Expression/ObjectValueExpression";
import { ParameterExpression } from "../ExpressionBuilder/Expression/ParameterExpression";
import { ExpressionBuilder } from "../ExpressionBuilder/ExpressionBuilder";
import { hashCode, hashCodeAdd } from "../Helper/Util";
import { IQueryVisitor } from "../Query/IQueryVisitor";
import { IQueryVisitParameter } from "../Query/IQueryVisitParameter";
import { Queryable } from "./Queryable";
import { IQueryExpression } from "./QueryExpression/IQueryExpression";
import { SelectExpression } from "./QueryExpression/SelectExpression";

type TExpObject<T> = FunctionExpression<{ [key in keyof T]?: IExpression<T[key]> }>;
export class PivotQueryable<T,
    TD extends { [key: string]: (o: T) => any } = any,
    TM extends { [key: string]: (o: T[] | Enumerable<T>) => any } = any>
    extends Queryable<Pivot<T, TD, TM>> {
    protected get dimensions() {
        if (!this._dimensions && this.dimensionFn) {
            this._dimensions = this.toObjectValueExpression(this.dimensionFn, "d");
        }
        return this._dimensions;
    }
    protected set dimensions(value) {
        this._dimensions = value;
    }
    protected get metrics() {
        if (!this._metrics && this.metricFn) {
            this._metrics = this.toObjectValueExpression(this.metricFn, "m");
        }
        return this._metrics;
    }
    protected set metrics(value) {
        this._metrics = value;
    }
    protected readonly dimensionFn: TD;
    protected readonly metricFn: TM;
    private _dimensions: TExpObject<TD>;
    private _metrics: TExpObject<TM>;
    constructor(public readonly parent: Queryable<T>, dimensions: TD | TExpObject<TD>, metrics: TM | TExpObject<TM>) {
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
    public buildQuery(queryVisitor: IQueryVisitor) {
        const objectOperand = this.parent.buildQuery(queryVisitor) as SelectExpression<T>;
        const methodExpression = new MethodCallExpression(objectOperand, "pivot", [this.dimensions.clone(), this.metrics.clone()]);
        const visitParam: IQueryVisitParameter = { selectExpression: objectOperand, scope: "queryable" };
        return queryVisitor.visit(methodExpression, visitParam) as IQueryExpression<Pivot<T, TD, TM>>;
    }
    public hashCode() {
        let code = this.dimensions.hashCode();
        code += this.metrics.hashCode();
        return hashCodeAdd(hashCode("PIVOT", this.parent.hashCode()), code);
    }
    protected toObjectValueExpression<K, KE extends { [key in keyof K]: FunctionExpression | ((item: T) => any) }>(objectFn: KE, paramName: string): TExpObject<KE> {
        const param = new ParameterExpression(paramName, this.parent.type);
        const objectValue: { [key in keyof KE]?: IExpression } = {};
        for (const prop in objectFn) {
            const value = objectFn[prop];
            let fnExpression: FunctionExpression;
            if (value instanceof FunctionExpression) {
                fnExpression = value;
            }
            else {
                fnExpression = ExpressionBuilder.parse(value as (item: T) => any, [this.parent.type], this.parameters);
            }
            if (fnExpression.params.length > 0) {
                (fnExpression.params[0] as any).name = paramName;
            }
            objectValue[prop] = fnExpression.body;
        }
        const objExpression = new ObjectValueExpression(objectValue);
        return new FunctionExpression(objExpression, [param]) as any;
    }
}
