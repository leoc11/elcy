import { Queryable } from "./Queryable";
import { IVisitParameter, QueryVisitor } from "../QueryBuilder/QueryVisitor";
import { hashCode } from "../Helper/Util";
import { ExpressionBuilder } from "../ExpressionBuilder/ExpressionBuilder";
import { FunctionExpression } from "../ExpressionBuilder/Expression/FunctionExpression";
import { MethodCallExpression } from "../ExpressionBuilder/Expression/MethodCallExpression";
import { SelectExpression } from "./QueryExpression/SelectExpression";
import { ICommandQueryExpression } from "./QueryExpression/ICommandQueryExpression";

export class WhereQueryable<T> extends Queryable<T> {
    protected readonly predicateFn: (item: T) => boolean;
    protected _predicate: FunctionExpression<T, boolean>;
    protected get predicate() {
        if (!this._predicate && this.predicateFn)
            this._predicate = ExpressionBuilder.parse(this.predicateFn, this.flatParameterStacks);
        return this._predicate;
    }
    protected set predicate(value) {
        this._predicate = value;
    }
    constructor(public readonly parent: Queryable<T>, predicate: FunctionExpression<T, boolean> | ((item: T) => boolean)) {
        super(parent.type, parent);
        if (predicate instanceof FunctionExpression)
            this.predicate = predicate;
        else
            this.predicateFn = predicate;
    }
    public buildQuery(queryVisitor: QueryVisitor): ICommandQueryExpression<T> {
        const objectOperand = this.parent.buildQuery(queryVisitor) as SelectExpression<T>;
        const methodExpression = new MethodCallExpression(objectOperand, "where", [this.predicate]);
        const visitParam: IVisitParameter = { selectExpression: objectOperand, scope: "queryable" };
        return queryVisitor.visit(methodExpression, visitParam) as any;
    }
    public hashCode() {
        return hashCode("WHERE", this.parent.hashCode() + hashCode((this.predicateFn || this.predicate).toString()));
    }
}
