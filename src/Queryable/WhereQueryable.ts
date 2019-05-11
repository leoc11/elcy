import { Queryable } from "./Queryable";
import { IQueryVisitParameter } from "../Query/IQueryVisitParameter";
import { hashCode, hashCodeAdd } from "../Helper/Util";
import { ExpressionBuilder } from "../ExpressionBuilder/ExpressionBuilder";
import { FunctionExpression } from "../ExpressionBuilder/Expression/FunctionExpression";
import { MethodCallExpression } from "../ExpressionBuilder/Expression/MethodCallExpression";
import { SelectExpression } from "./QueryExpression/SelectExpression";
import { IQueryExpression } from "./QueryExpression/IQueryExpression";
import { IQueryVisitor } from "../Query/IQueryVisitor";

export class WhereQueryable<T> extends Queryable<T> {
    protected readonly predicateFn: (item: T) => boolean;
    protected _predicate: FunctionExpression<boolean>;
    protected get predicate() {
        if (!this._predicate && this.predicateFn)
            this._predicate = ExpressionBuilder.parse(this.predicateFn, [this.parent.type], this.parameters);
        return this._predicate;
    }
    protected set predicate(value) {
        this._predicate = value;
    }
    constructor(public readonly parent: Queryable<T>, predicate: FunctionExpression<boolean> | ((item: T) => boolean)) {
        super(parent.type, parent);
        if (predicate instanceof FunctionExpression)
            this.predicate = predicate;
        else
            this.predicateFn = predicate;
    }
    public buildQuery(queryVisitor: IQueryVisitor): IQueryExpression<T> {
        const objectOperand = this.parent.buildQuery(queryVisitor) as SelectExpression<T>;
        const methodExpression = new MethodCallExpression(objectOperand, "where", [this.predicate.clone()]);
        const visitParam: IQueryVisitParameter = { selectExpression: objectOperand, scope: "queryable" };
        return queryVisitor.visit(methodExpression, visitParam) as any;
    }
    public hashCode() {
        return hashCodeAdd(hashCode("WHERE", this.parent.hashCode()), this.predicate.hashCode());
    }
}
