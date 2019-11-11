import { INodeTree, ParameterStack } from "../Common/ParameterStack";
import { GenericType, IObjectType } from "../Common/Type";
import { DbContext } from "../Data/DbContext";
import { ParameterExpression } from "../ExpressionBuilder/Expression/ParameterExpression";
import { hashCode } from "../Helper/Util";
import { IQueryVisitor } from "../Query/IQueryVisitor";
import { Queryable } from "./Queryable";
import { QueryExpression } from "./QueryExpression/QueryExpression";
import { RawEntityExpression } from "./QueryExpression/RawEntityExpression";
import { SelectExpression } from "./QueryExpression/SelectExpression";
import { SqlParameterExpression } from "./QueryExpression/SqlParameterExpression";

export class RawQueryable<T> extends Queryable<T> {
    public get stackTree() {
        return this._param;
    }
    constructor(dbContext: DbContext,
                type: GenericType<T>,
                public readonly definingQuery: string,
                parameters?: { [key: string]: any }) {
        super(type);
        this._param = {
            node: new ParameterStack(),
            childrens: []
        };
        this._param.node.set(parameters);
        this._dbContext = dbContext;
        this.parameter(parameters);
    }
    public get dbContext(): DbContext {
        return this._dbContext;
    }
    private _param: INodeTree<ParameterStack>;
    private readonly _dbContext: DbContext;
    public buildQuery(visitor: IQueryVisitor): QueryExpression<T[]> {
        const queryBuilder = this.dbContext.queryBuilder;
        let definingQuery = this.definingQuery;
        const parameterExps: SqlParameterExpression[] = [];
        for (const [key] of this._param.node) {
            const parameterExp = new SqlParameterExpression(visitor.newAlias("param"), new ParameterExpression(key));
            parameterExps.push(parameterExp);
            definingQuery = definingQuery.replace(new RegExp("\\$\\{" + key + "\\}", "g"), queryBuilder.toString(parameterExp));
        }
        const rawEntity = new RawEntityExpression(this.type as IObjectType, definingQuery, visitor.newAlias());
        const result = new SelectExpression(rawEntity);
        result.parameterTree = {
            node: parameterExps,
            childrens: []
        };
        visitor.setDefaultBehaviour(result);
        return result;
    }
    public hashCode() {
        return hashCode(this.type.name!, hashCode(this.definingQuery));
    }
}
