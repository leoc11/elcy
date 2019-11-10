import { INodeTree, ParameterStack } from "../Common/ParameterStack";
import { MethodCallExpression } from "../ExpressionBuilder/Expression/MethodCallExpression";
import { hashCode, hashCodeAdd } from "../Helper/Util";
import { IQueryVisitor } from "../Query/IQueryVisitor";
import { IQueryVisitParameter } from "../Query/IQueryVisitParameter";
import { Queryable } from "./Queryable";
import { QueryExpression } from "./QueryExpression/QueryExpression";
import { SelectExpression } from "./QueryExpression/SelectExpression";

export class ExceptQueryable<T> extends Queryable<T> {
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
    constructor(public readonly parent: Queryable<T>, protected readonly parent2: Queryable<T>) {
        super(parent.type, parent);
    }
    private _param: INodeTree<ParameterStack>;
    public buildQuery(visitor: IQueryVisitor): QueryExpression<T[]> {
        const childOperand = this.parent2.buildQuery(visitor) as SelectExpression<T>;
        const objectOperand = this.parent.buildQuery(visitor) as SelectExpression<T>;
        objectOperand.parameterTree.childrens.push(childOperand.parameterTree);

        const methodExpression = new MethodCallExpression(objectOperand, "except", [childOperand]);
        const visitParam: IQueryVisitParameter = { selectExpression: objectOperand, scope: "queryable" };
        const result = visitor.visit(methodExpression, visitParam) as QueryExpression;
        result.parameterTree.childrens.push(childOperand.parameterTree);
        return result;
    }
    public hashCode() {
        return hashCodeAdd(hashCode("EXCLUDE", this.parent.hashCode()), this.parent2.hashCode());
    }
}
