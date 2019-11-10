import { INodeTree, ParameterStack } from "../Common/ParameterStack";
import { IConnection } from "../Connection/IConnection";
import { PooledConnection } from "../Connection/PooledConnection";
import { DbContext } from "../Data/DbContext";
import { IEnumerable } from "../Enumerable/IEnumerable";
import { ExpressionExecutor } from "../ExpressionBuilder/ExpressionExecutor";
import { Diagnostic } from "../Logger/Diagnostic";
import { DeferredQuery } from "../Query/DeferredQuery/DeferredQuery";
import { IQuery } from "../Query/IQuery";
import { IQueryTemplate } from "../Query/IQueryTemplate";
import { IQueryVisitor } from "../Query/IQueryVisitor";
import { QueryExpression } from "../Queryable/QueryExpression/QueryExpression";
import { SqlTableValueParameterExpression } from "../Queryable/QueryExpression/SqlTableValueParameterExpression";
import { MockConnection } from "./MockConnection";

export interface IMockedContext {
    oriExecuteDeferred?(deferredQueries: IEnumerable<DeferredQuery>): Promise<void>;
    oriGetConnection?(writable?: boolean): Promise<IConnection>;
}
export interface IMockedDeferredQuery {
    ();
    queryExps: Array<QueryExpression<any[]>>;
    dbContext: DbContext;
    resultRange: [number, number];
    tvpMap: Map<SqlTableValueParameterExpression, any[]>;
    buildQueries(visitor: IQueryVisitor): QueryExpression[];
    buildQuery(visitor: IQueryVisitor): QueryExpression;
    toQuery(template: IQueryTemplate, stackTree: INodeTree<ParameterStack>, tvpMap: Map<SqlTableValueParameterExpression, any[]>): IQuery;
    oriToQuery(template: IQueryTemplate, stackTree: INodeTree<ParameterStack>, tvpMap: Map<SqlTableValueParameterExpression, any[]>): IQuery;
}
export const mockContext = function (context: DbContext & IMockedContext) {
    context.oriGetConnection = context.getConnection;
    context.oriExecuteDeferred = context.executeDeferred;
    context.getConnection = async function (writable?: boolean) {
        let connection = await this.oriGetConnection(writable);
        if (connection instanceof PooledConnection) {
            if (!(connection.connection instanceof MockConnection)) {
                connection.connection = new MockConnection(connection.database);
            }
        }
        else if (!(connection instanceof MockConnection)) {
            connection = new MockConnection(connection.database);
        }
        return connection;
    };
    context.executeDeferred = async function (deferredQueries?: IEnumerable<DeferredQuery>) {
        if (!deferredQueries) {
            deferredQueries = context.deferredQueries.splice(0);
        }
        const mockQueries = deferredQueries.select((o) => mockDefer(o)).toArray();
        this.connection = await this.getConnection();
        const mockConnection: MockConnection = this.connection instanceof PooledConnection ? this.connection.connection as any : this.connection as any;
        mockConnection.setQueries(mockQueries);
        return context.oriExecuteDeferred.apply(this, [mockQueries]);
    };
};
function mockDefer(defer: DeferredQuery) {
    const mock: DeferredQuery & IMockedDeferredQuery = defer as any;
    if (mock.buildQueries) {
        mock.queryExps = mock.buildQueries(mock.dbContext.queryVisitor);
    }
    else if (mock.buildQuery) {
        mock.queryExps = [mock.buildQuery(mock.dbContext.queryVisitor)];
    }

    mock.oriToQuery = mock.toQuery;
    mock.toQuery = function (template: IQueryTemplate, stackTree: INodeTree<ParameterStack>, tvpMap: Map<SqlTableValueParameterExpression, any[]>) {
        this.tvpMap = tvpMap;
        const paramTree = template.parameterTree;
        const timer = Diagnostic.timer();
        const result: IQuery = {
            comment: template.comment,
            type: template.type,
            query: template.query,
            parameters: new Map()
        };

        const queryBuilder = this.dbContext.queryBuilder;
        let paramTrees = [paramTree];
        let stackTrees = [stackTree];
        let i = 0;
        while (paramTrees.length > i) {
            const paramNode = paramTrees[i];
            const stackNode = stackTrees[i++];
            const valueTransformer = new ExpressionExecutor(stackNode.node);
            for (const param of paramNode.node) {
                const value = valueTransformer.execute(param);
                if (!this.queryOption.supportTVP && param instanceof SqlTableValueParameterExpression) {
                    tvpMap.set(param, value);
                }
                else if (param.isReplacer) {
                    result.query = result.query.replace(queryBuilder.toString(param), value);
                    // add to parameter so we could mock paging
                    result.parameters.set(param.name, value);
                }
                else {
                    result.parameters.set(param.name, value);
                }
            }
            if (paramNode.childrens.any()) {
                paramTrees = paramTrees.concat(paramNode.childrens);
                stackTrees = stackTrees.concat(stackNode.childrens);
            }
        }
        if (Diagnostic.enabled) {
            Diagnostic.trace(this, `build params time: ${timer.lap()}ms`);
        }
        return result;
    };

    return mock;
}
export function restore(context: DbContext & IMockedContext) {
    context.getConnection = context.oriGetConnection;
    context.oriGetConnection = undefined;
    context.executeDeferred = context.oriExecuteDeferred;
    context.oriExecuteDeferred = undefined;
}
