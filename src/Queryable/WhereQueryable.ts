import { PredicateSelector } from "../Common/Type";
import { FunctionExpression } from "../ExpressionBuilder/Expression/FunctionExpression";
import { MethodCallExpression } from "../ExpressionBuilder/Expression/MethodCallExpression";
import { ExpressionBuilder } from "../ExpressionBuilder/ExpressionBuilder";
import { hashCode, hashCodeAdd } from "../Helper/Util";
import { IQueryVisitor } from "../Query/IQueryVisitor";
import { IQueryVisitParameter } from "../Query/IQueryVisitParameter";
import { Queryable } from "./Queryable";
import { QueryExpression } from "./QueryExpression/QueryExpression";
import { SelectExpression } from "./QueryExpression/SelectExpression";

export class WhereQueryable<T> extends Queryable<T> {
    protected get predicate() {
        if (!this._predicate && this.predicateFn) {
            this._predicate = ExpressionBuilder.parse(this.predicateFn, [this.parent.type], this.stackTree.node);
        }
        return this._predicate;
    }
    protected set predicate(value) {
        this._predicate = value;
    }
    constructor(public readonly parent: Queryable<T>, predicate: PredicateSelector<T>) {
        super(parent.type, parent);
        if (predicate instanceof FunctionExpression) {
            this.predicate = predicate;
        }
        else {
            this.predicateFn = predicate;
        }
    }
    protected _predicate: FunctionExpression<boolean>;
    protected readonly predicateFn: (item: T) => boolean;
    public buildQuery(visitor: IQueryVisitor): QueryExpression<T[]> {
        const objectOperand = this.parent.buildQuery(visitor) as SelectExpression<T>;
        const methodExpression = new MethodCallExpression(objectOperand, "where", [this.predicate.clone()]);
        const visitParam: IQueryVisitParameter = { selectExpression: objectOperand, scope: "queryable" };
        return visitor.visit(methodExpression, visitParam) as any;
    }
    public hashCode() {
        return hashCodeAdd(hashCode("WHERE", this.parent.hashCode()), this.predicate.hashCode());
    }
}
