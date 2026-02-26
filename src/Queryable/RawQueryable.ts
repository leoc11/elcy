import { hashCode } from "../Helper/Util";
import { IQueryVisitor } from "../Query/IQueryVisitor";
import { Queryable } from "./Queryable";
import { IQueryExpression } from "./QueryExpression/IQueryExpression";
import { SelectExpression } from "./QueryExpression/SelectExpression";
import { RawEntityExpression } from "./QueryExpression/RawEntityExpression";
import { IObjectType } from "src/Common/Type";
import { DbSet } from "src/Data/DbSet";

export class RawQueryable<T extends object> extends Queryable<T> {
    declare public type: IObjectType<T>;
    constructor(parent: DbSet<T>, public readonly sqlStatement: string) {
        super(parent.type, parent);
    }
    public buildQuery(queryVisitor: IQueryVisitor): IQueryExpression<T> {
        const result = new SelectExpression(new RawEntityExpression(this.type, queryVisitor.newAlias(), this.sqlStatement));
        queryVisitor.setDefaultBehaviour(result);
        return result;
    }
    public hashCode() {
        return hashCode(this.type.name, hashCode(this.sqlStatement));
    }
}
