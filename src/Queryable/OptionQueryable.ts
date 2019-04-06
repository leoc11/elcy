import { Queryable } from "./Queryable";
import { IQueryExpression } from "./QueryExpression/IQueryExpression";
import { IQueryVisitor } from "../Query/IQueryVisitor";
import { IQueryOption } from "../Query/IQueryOption";

export class OptionQueryable<T> extends Queryable<T> {
    constructor(public readonly parent: Queryable<T>, option: IQueryOption) {
        super(parent.type, parent);
        this.option(this.parent.queryOption);
        this.option(option);
    }
    public queryOption: IQueryOption = {};
    public option(option: IQueryOption) {
        for (const prop in option) {
            const value = (option as any)[prop];
            if (value instanceof Object) {
                if (!(this.queryOption as any)[prop])
                    (this.queryOption as any)[prop] = {};
                Object.assign((this.queryOption as any)[prop], value);
            }
            else {
                (this.queryOption as any)[prop] = value;
            }
        }
        return this;
    }
    public buildQuery(queryVisitor: IQueryVisitor): IQueryExpression<T> {
        return this.parent.buildQuery(queryVisitor);
    }
    public hashCode() {
        return this.parent.hashCode();
    }
}
