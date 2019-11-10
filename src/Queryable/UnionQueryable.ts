import { INodeTree, ParameterStack } from "../Common/ParameterStack";
import { MethodCallExpression } from "../ExpressionBuilder/Expression/MethodCallExpression";
import { ParameterExpression } from "../ExpressionBuilder/Expression/ParameterExpression";
import { hashCode } from "../Helper/Util";
import { IQueryVisitor } from "../Query/IQueryVisitor";
import { IQueryVisitParameter } from "../Query/IQueryVisitParameter";
import { Queryable } from "./Queryable";
import { QueryExpression } from "./QueryExpression/QueryExpression";
import { SelectExpression } from "./QueryExpression/SelectExpression";

export class UnionQueryable<T> extends Queryable<T> {
    public get stackTree() {
        if (!this._param) {
            this._param = {
                node: this.parent.stackTree.node,
                childrens: Array.from(this.parent.stackTree.childrens)
            };
            this._param.childrens.push(this.parent2.stackTree);
        }
        return this._param;
    }
    constructor(parent: Queryable<T>, protected readonly parent2: Queryable<T>, public readonly isUnionAll = false) {
        super(parent.type, parent.parameter({ union: isUnionAll }));
    }
    private _param: INodeTree<ParameterStack>;
    public buildQuery(visitor: IQueryVisitor) {
        const childOperand = this.parent2.buildQuery(visitor) as SelectExpression<T>;
        const objectOperand = this.parent.buildQuery(visitor) as SelectExpression<T>;
        objectOperand.parameterTree.childrens.push(childOperand.parameterTree);

        const methodExpression = new MethodCallExpression(objectOperand, "union", [childOperand, new ParameterExpression("union", Boolean)]);
        const visitParam: IQueryVisitParameter = { selectExpression: objectOperand, scope: "queryable" };
        const result = visitor.visit(methodExpression, visitParam) as QueryExpression;
        return result;
    }
    public hashCode() {
        return hashCode("UNION", this.parent.hashCode() + this.parent2.hashCode());
    }
}
