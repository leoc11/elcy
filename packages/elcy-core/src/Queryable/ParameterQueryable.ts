import { clone } from "../Helper/Util";
import { IQueryVisitor } from "../Query/IQueryVisitor";
import { Queryable } from "./Queryable";
import { IQueryExpression } from "./QueryExpression/IQueryExpression";

export class ParameterQueryable<T> extends Queryable<T> {
    public get parameters() {
        return this._parameters;
    }
    constructor(public readonly parent: Queryable<T>, parameters: { [key: string]: any }) {
        super(parent.type, parent);
        this._parameters = clone(parent.parameters);
        this.parameter(parameters);
    }
    private _parameters: { [key: string]: any };
    public buildQuery(visitor: IQueryVisitor): IQueryExpression<T> {
        if (typeof visitor.parameterIndex !== "number") {
            visitor.parameterIndex = 0;
        }
        const command = this.parent.buildQuery(visitor);
        visitor.parameterIndex++;
        return command;
    }
    public flatQueryParameter(param?: { index: number }) {
        const flatParam = this.parent.flatQueryParameter(param);
        param.index++;
        for (const prop in this._parameters) {
            flatParam[`${param.index}:${prop}`] = this._parameters[prop];
        }

        return flatParam;
    }
    public hashCode() {
        return this.parent.hashCode();
    }
    public parameter(params: { [key: string]: any }) {
        for (const prop in params) {
            this._parameters[prop] = params[prop];
        }
        return this;
    }
}
