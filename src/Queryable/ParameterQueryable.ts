import { INodeTree, ParameterStack } from "../Common/ParameterStack";
import { hashCode, hashCodeAdd } from "../Helper/Util";
import { IQueryVisitor } from "../Query/IQueryVisitor";
import { Queryable } from "./Queryable";
import { QueryExpression } from "./QueryExpression/QueryExpression";

export class ParameterQueryable<T> extends Queryable<T> {
    public get stackTree() {
        return this._param;
    }
    constructor(parent: Queryable<T>, params: { [key: string]: any }) {
        super(parent.type, parent);
        this._param = {
            node: parent.stackTree.node.clone(),
            childrens: Array.from(parent.stackTree.childrens)
        };
        this.parameter(params);
    }
    private _param: INodeTree<ParameterStack>;
    private _parameterHashCode = 0;
    public buildQuery(visitor: IQueryVisitor): QueryExpression<T[]> {
        const command = this.parent.buildQuery(visitor);
        visitor.setStack(this.stackTree.node);
        return command;
    }
    public hashCode() {
        return hashCodeAdd(this._parameterHashCode, this.parent.hashCode());
    }
    public parameter(params: { [key: string]: any }) {
        for (const prop in params) {
            const value = params[prop];
            if (value instanceof Queryable) {
                this._parameterHashCode += value.hashCode();
            }
            else if (value instanceof Function) {
                this._parameterHashCode += hashCode(value.toString());
            }
            this._param.node.push(prop, value);
        }
        this._param.node.set(params);
        return this;
    }
}
