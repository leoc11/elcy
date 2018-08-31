import { Queryable } from "./Queryable";
import { QueryVisitor } from "../QueryBuilder/QueryVisitor";
import { IQueryCommandExpression } from "./QueryExpression/IQueryCommandExpression";

export class ParameterQueryable<T> extends Queryable<T> {
    constructor(public readonly parent: Queryable<T>, parameters: { [key: string]: any }) {
        super(parent.type, parent);
        this.parameterStackIndex++;
        this.parameter(parameters);
    }
    public parameter(params: { [key: string]: any }) {
        for (const prop in params) {
            this.parameters[prop] = this.flatParameterStacks[this.parameterStackIndex + ":" + prop] = params[prop];
        }
        return this;
    }
    public buildQuery(queryVisitor: QueryVisitor): IQueryCommandExpression<T> {
        const command = this.parent.buildQuery(queryVisitor);
        queryVisitor.setParameter(this.flatParameterStacks, this.parameterStackIndex, this.parameters);
        return command;
    }
    public hashCode() {
        return this.parent.hashCode();
    }
}
