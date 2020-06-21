import { INodeTree, ParameterStack } from "../Common/ParameterStack";
import { IConnection } from "../Connection/IConnection";
import { PooledConnection } from "../Connection/PooledConnection";
import { DbContext } from "../Data/DbContext";
import { IEnumerable } from "../Enumerable/IEnumerable";
import { BulkDeferredQuery } from "../Query/DeferredQuery/BulkDeferredQuery";
import { DeferredQuery } from "../Query/DeferredQuery/DeferredQuery";
import { ExecuteDeferredQuery } from "../Query/DeferredQuery/ExecuteDeferredQuery";
import { IQuery } from "../Query/IQuery";
import { IQueryTemplate } from "../Query/IQueryTemplate";
import { IQueryVisitor } from "../Query/IQueryVisitor";
import { CustomEntityExpression } from "../Queryable/QueryExpression/CustomEntityExpression";
import { DeleteExpression } from "../Queryable/QueryExpression/DeleteExpression";
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
            deferredQueries = context.deferredQueries;
        }
        const mockQueries = deferredQueries.select((o) => mockDefer(o)).toArray();
        this.connection = await this.getConnection();
        const mockConnection: MockConnection = this.connection instanceof PooledConnection ? this.connection.connection as any : this.connection as any;
        mockConnection.setQueries(mockQueries);
        return context.oriExecuteDeferred.apply(this, Array.from(arguments));
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
    else if (mock instanceof BulkDeferredQuery) {
        mock.queryExps = mock.defers.selectMany((o) => mockDefer(o).queryExps).toArray();
    }
    else if (mock instanceof ExecuteDeferredQuery) {
        mock.queryExps = [new DeleteExpression(new CustomEntityExpression("", [], Object, ""), "hard")];
        mock.tvpMap = new Map();
    }

    mock.oriToQuery = mock.toQuery;
    mock.toQuery = function (template: IQueryTemplate, stackTree: INodeTree<ParameterStack>, tvpMap: Map<SqlTableValueParameterExpression, any[]>) {
        this.tvpMap = tvpMap || new Map();
        return mock.oriToQuery(template, stackTree, this.tvpMap);
    };

    return mock;
}
export function restore(context: DbContext & IMockedContext) {
    context.getConnection = context.oriGetConnection;
    context.oriGetConnection = undefined;
    context.executeDeferred = context.oriExecuteDeferred;
    context.oriExecuteDeferred = undefined;
}
