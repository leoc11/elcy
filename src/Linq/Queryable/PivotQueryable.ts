import { FunctionExpression, MethodCallExpression, ObjectValueExpression } from "../../ExpressionBuilder/Expression/index";
import { ExpressionFactory } from "../../ExpressionBuilder/ExpressionFactory";
import { Enumerable } from "../Enumerable/Enumerable";
import { QueryBuilder } from "../QueryBuilder";
import { Queryable } from "./Queryable";
import { SelectExpression } from "./QueryExpression/SelectExpression";

export class PivotQueryable<T, TD extends { [key: string]: FunctionExpression<T, any> }, TM extends { [key: string]: FunctionExpression<T[] | Enumerable<T>, any> }, TResult extends {[key in (keyof TD & keyof TM)]: any }
    , TD1 extends { [key: string]: (o: T) => any } = any, TM1 extends { [key: string]: (o: T[] | Enumerable<T>) => any } = any> extends Queryable<TResult> {
    public get queryBuilder(): QueryBuilder {
        return this.parent.queryBuilder;
    }
    constructor(public readonly parent: Queryable<T>, public dimensions: TD1 | ObjectValueExpression<TD>, public metrics: TM1 | ObjectValueExpression<TM>) {
        super(Object);
    }

    public buildQuery(queryBuilder: QueryBuilder): SelectExpression<TResult> {
        if (!this.expression) {
            queryBuilder = queryBuilder ? queryBuilder : this.queryBuilder;

            if (!(this.dimensions instanceof ObjectValueExpression)) {
                const dimension: TD = {} as any;
                // tslint:disable-next-line:forin
                for (const key in this.dimensions) {
                    const val: ((item: T) => any) = this.dimensions[key];
                    dimension[key] = val instanceof FunctionExpression ? val : ExpressionFactory.prototype.ToExpression(val, this.parent.type);
                }
                this.dimensions = new ObjectValueExpression(dimension);
            }
            if (!(this.metrics instanceof ObjectValueExpression)) {
                const metric: TM = {} as any;
                // tslint:disable-next-line:forin
                for (const key in this.metrics) {
                    const val: ((o: T[] | Enumerable<T>) => any) = this.metrics[key];
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
}
