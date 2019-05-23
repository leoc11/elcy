import { clone } from "../Helper/Util";
import { IQueryOption } from "../Query/IQueryOption";
import { IQueryVisitor } from "../Query/IQueryVisitor";
import { Queryable } from "./Queryable";
import { IQueryExpression } from "./QueryExpression/IQueryExpression";

export class OptionQueryable<T> extends Queryable<T> {
    private _queryOption: IQueryOption;
    public get queryOption() {
        return this._queryOption;
    }
    constructor(parent: Queryable<T>, option: IQueryOption) {
        super(parent.type, parent);
        this._queryOption = clone(this.parent.queryOption);
        this.option(option);
    }
    public option(option: IQueryOption) {
        for (const prop in option) {
            const value = (option as any)[prop];
            if (value instanceof Object) {
                if (!(this.queryOption as any)[prop]) {
                    (this.queryOption as any)[prop] = {};
                }
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
