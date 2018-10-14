import { Queryable } from "./Queryable";
import { QueryVisitor } from "../QueryBuilder/QueryVisitor";
import { IQueryCommandExpression } from "./QueryExpression/IQueryCommandExpression";
import { ISelectQueryOption, IQueryOption } from "../QueryBuilder/Interface/IQueryOption";

export class OptionQueryable<T> extends Queryable<T> {
    constructor(public readonly parent: Queryable<T>, option: ISelectQueryOption) {
        super(parent.type, parent);
        this.option(this.parent.queryOption);
        this.option(option);
    }
    public queryOption: IQueryOption = {};
    public option(option: ISelectQueryOption) {
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
    public buildQuery(queryVisitor: QueryVisitor): IQueryCommandExpression<T> {
        return this.parent.buildQuery(queryVisitor);
    }
    public hashCode() {
        return this.parent.hashCode();
    }
}
