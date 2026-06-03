import { GenericType, Pivot, PivotD, PivotM, SetterObj, StringKeyOf, ValueType } from "../Common/Type";
import { FunctionExpression } from "../ExpressionBuilder/Expression/FunctionExpression";
import { ObjectValueExpression } from "../ExpressionBuilder/Expression/ObjectValueExpression";
import { ParameterExpression } from "../ExpressionBuilder/Expression/ParameterExpression";
import { ExpressionBuilder } from "../ExpressionBuilder/ExpressionBuilder";
import { IQueryVisitor } from "../Query/IQueryVisitor";
import { Queryable } from "./Queryable";
import { Querify } from "./Interface/Querify";
import { IGroupArray } from "src/Common/IGroupArray";
import { IExpression } from "src/ExpressionBuilder/Expression/IExpression";
import { MemberAccessExpression } from "src/ExpressionBuilder/Expression/MemberAccessExpression";
import { IEnumerable } from "@elcy/enumerable";

const toFunctionExpression = <TE,
    KE extends { [KP: string]: FunctionExpression<unknown, [TE]> | ((item: TE) => unknown) },
    T extends { [key in keyof KE]:
        KE[key] extends ((item: TE) => unknown) ? ReturnType<KE[key]>
        : KE[key] extends FunctionExpression<infer TKE> ? TKE
        : never }
>(type: GenericType<TE>, objectFn: KE, parameters?: Record<string, unknown>): FunctionExpression<T, [TE]> => {
    const param = new ParameterExpression("o", type);
    const objExp = new ObjectValueExpression<T>({});
    for (const prop in objectFn) {
        let fnExpression: FunctionExpression<T[StringKeyOf<T>], [TE]>;
        const value = objectFn[prop];
        if (value instanceof FunctionExpression) {
            fnExpression = value as FunctionExpression<T[StringKeyOf<T>], [TE]>;
        }
        else {
            fnExpression = ExpressionBuilder.parse(value as ((item: TE) => T[StringKeyOf<T>]), [type], parameters);
        }

        fnExpression.params = [param];
        objExp.object[prop] = fnExpression.body;
    }
    return new FunctionExpression(objExp, [param]);
}

export class PivotQueryable<TE,
    TD extends { [key: string]: (o: Querify<TE>) => ValueType },
    TM extends { [key: string]: (o: Querify<TE[]>) => ValueType }>
    extends Queryable<Pivot<TE, TD, TM>> {
    protected get dimensions() {
        if (!this._dimensions && this.dimensionFn) {
            this._dimensions = toFunctionExpression(this.parent.type as GenericType<Querify<TE>>, this.dimensionFn, this.parameters) as FunctionExpression<PivotD<TE, TD>, [TE]>;
        }
        return this._dimensions;
    }
    protected set dimensions(value) {
        this._dimensions = value;
    }
    protected get metrics() {
        if (!this._metrics && this.metricFn) {
            this._metrics = toFunctionExpression(Array as unknown as GenericType<Querify<IEnumerable<TE>>>, this.metricFn, this.parameters) as unknown as FunctionExpression<PivotM<TE, TM>, [IEnumerable<TE>]>;
        }
        return this._metrics;
    }
    protected set metrics(value) {
        this._metrics = value;
    }
    constructor(public override readonly parent: Queryable<TE>, dimensions: TD | FunctionExpression<PivotD<TE, TD>, [TE]>, metrics: TM | FunctionExpression<PivotM<TE, TM>, [IEnumerable<TE>]>) {
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
    private _dimensions: FunctionExpression<PivotD<TE, TD>, [TE]>;
    private _metrics: FunctionExpression<PivotM<TE, TM>, [IEnumerable<TE>]>;

    private _pivotQueryable: Queryable<Pivot<TE, TD, TM>>;
    protected get pivotQueryable() {
        if (!this._pivotQueryable) {
            const dObject = (this.dimensions.body as ObjectValueExpression<PivotD<TE, TD>>).object;
            const mObject = (this.metrics.body as ObjectValueExpression<PivotM<TE, TM>>).object;
            const setterObj: Record<string, IExpression> = {};
            const paramExp = this.metrics.params[0] as ParameterExpression<IGroupArray<PivotD<TE, TD>, TE>>;
            for (const prop in dObject) {
                const valueExp = dObject[prop];
                setterObj[prop] = new MemberAccessExpression(new MemberAccessExpression(paramExp, "key"), prop as StringKeyOf<TD>, valueExp.type);
            }
            for (const prop in mObject) {
                setterObj[prop] = mObject[prop];
            }

            const pivotObjExp = new ObjectValueExpression<Pivot<TE, TD, TM>>(setterObj as SetterObj<Pivot<TE, TD, TM>>);
            const selectorFn = new FunctionExpression(pivotObjExp, [paramExp]);
            this._pivotQueryable = this.parent.groupBy(this.dimensions).map(selectorFn);
        }
        return this._pivotQueryable;
    }
    protected set pivotQueryable(value) {
        this._pivotQueryable = value;
    }
    public buildQuery(queryVisitor: IQueryVisitor) {
        return this.pivotQueryable.buildQuery(queryVisitor);
    }
    public hashCode() {
        return this.pivotQueryable.hashCode();
    }
}
