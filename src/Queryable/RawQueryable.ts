import { INodeTree, ParameterStack } from "../Common/ParameterStack";
import { GenericType, IObjectType } from "../Common/Type";
import { DbContext } from "../Data/DbContext";
import { hashCode } from "../Helper/Util";
import { IQueryVisitor } from "../Query/IQueryVisitor";
import { Queryable } from "./Queryable";
import { QueryExpression } from "./QueryExpression/QueryExpression";
import { RawEntityExpression } from "./QueryExpression/RawEntityExpression";
import { SelectExpression } from "./QueryExpression/SelectExpression";

export class RawQueryable<T> extends Queryable<T> {
    public get stackTree() {
        return this._param;
    }
    constructor(dbContext: DbContext,
                type: GenericType<T>,
                public readonly sql: string,
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
        const result = new SelectExpression(new RawEntityExpression(this.type as IObjectType, this.sql, visitor.newAlias()));
        result.parameterTree = {
            node: [],
            childrens: []
        };
        visitor.setDefaultBehaviour(result);
        return result;
    }
    public hashCode() {
        return hashCode(this.type.name!, hashCode(this.sql));
    }
}
