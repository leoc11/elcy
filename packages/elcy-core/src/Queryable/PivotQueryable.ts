import { MethodKey, Pivot, SetterObj, StringKeyOf, ValueType } from "../Common/Type";
import { FunctionExpression } from "../ExpressionBuilder/Expression/FunctionExpression";
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
import { QueryableChain } from "./Interface/QueryableChain";

export type TExpObject<T> = FunctionExpression<SetterObj<T>>;
export class PivotQueryable<T,
    TD extends { [key: string]: (o: QueryableChain<T>) => ValueType },
    TM extends { [key: string]: (o: QueryableChain<T[]>) => ValueType }>
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
    constructor(public override readonly parent: Queryable<T>, dimensions: TD | TExpObject<TD>, metrics: TM | TExpObject<TM>) {
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
    private _dimensions: TExpObject<TD>;
    private _metrics: TExpObject<TM>;
    public buildQuery(queryVisitor: IQueryVisitor) {
        const objectOperand = this.parent.buildQuery(queryVisitor) as SelectExpression<object, T>;
        const methodExpression = new MethodCallExpression(objectOperand, "pivot" as MethodKey<T[]>, [this.dimensions.clone(), this.metrics.clone()]);
        const visitParam: IQueryVisitParameter = { selectExpression: objectOperand as SelectExpression, scope: "queryable" };
        return queryVisitor.visit(methodExpression, visitParam) as IQueryExpression<Pivot<T, TD, TM>>;
    }
    public hashCode() {
        let code = this.dimensions.hashCode();
        code += this.metrics.hashCode();
        return hashCodeAdd(hashCode("PIVOT", this.parent.hashCode()), code);
    }
    protected toObjectValueExpression<K, KE extends { [KP in StringKeyOf<K>]: FunctionExpression<K[KP] & ValueType> | ((item: T) => K[KP]) }>(objectFn: KE, paramName: string): TExpObject<KE> {
        const param = new ParameterExpression(paramName, this.parent.type);
        const objectValue: SetterObj<KE> = {};
        for (const prop in objectFn) {
            let fnExpression: FunctionExpression<KE[StringKeyOf<KE>] & ValueType, unknown[]>;
            const value = objectFn[prop] as FunctionExpression<KE[StringKeyOf<KE>] & ValueType, unknown[]>;
            if (value instanceof FunctionExpression) {
                fnExpression = value;
            }
            else {
                fnExpression = ExpressionBuilder.parse(value, [this.parent.type], this.parameters);
            }
            if (fnExpression.params.length > 0) {
                (fnExpression.params[0]).name = paramName;
            }
            objectValue[prop] = fnExpression.body;
        }
        const objExpression = new ObjectValueExpression(objectValue);
        return new FunctionExpression(objExpression, [param]) as unknown as TExpObject<KE>;
    }
}
