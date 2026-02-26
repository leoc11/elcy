import { hashCode } from "../Helper/Util";
import { IQueryVisitor } from "../Query/IQueryVisitor";
import { Queryable } from "./Queryable";
import { IQueryExpression } from "./QueryExpression/IQueryExpression";
import { SelectExpression } from "./QueryExpression/SelectExpression";
import { RawEntityExpression } from "./QueryExpression/RawEntityExpression";
import { IObjectType } from "src/Common/Type";
import { DbSet } from "src/Data/DbSet";
import { ParameterExpression } from "src/ExpressionBuilder/Expression/ParameterExpression";

export class RawQueryable<T extends object> extends Queryable<T> {
    declare public type: IObjectType<T>;
    public readonly values: any[];
    constructor(parent: DbSet<T>, public readonly sqlTemplateStrings: TemplateStringsArray, values: any[]) {
        super(parent.type, parent);
        this.values = values;
    }

    public flatQueryParameter(param?: { index: number }) {
        const flatParam = this.parent.flatQueryParameter(param);
        for (const prop in this.values) {
            flatParam[`${param.index}:${prop}`] = this.values[prop];
        }
        return flatParam;
    }
    public buildQuery(visitor: IQueryVisitor): IQueryExpression<T> {
        if (typeof visitor.parameterIndex !== "number") {
            visitor.parameterIndex = 0;
        }
        const valueParameters: ParameterExpression[] = [];
        for (const prop in this.values) {
            const paramExp = new ParameterExpression(`${visitor.parameterIndex}:${prop}`, this.values[prop]?.constructor);
            valueParameters.push(paramExp);
        }
        const entityExp = new RawEntityExpression(this.type, visitor.newAlias(), this.sqlTemplateStrings);
        const result = new SelectExpression(entityExp);
        for (const paramExp of valueParameters) {
            const sqlParamExp = result.addSqlParameter(paramExp);
            entityExp.addParameter(sqlParamExp);
        }
        visitor.setDefaultBehaviour(result);
        return result;
    }
    public hashCode() {
        return hashCode(this.type.name, hashCode(this.sqlTemplateStrings.join("?")));
    }
}
