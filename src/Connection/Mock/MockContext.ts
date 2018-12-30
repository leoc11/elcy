import { DbContext } from "../../Data/DBContext";
import { DeferredQuery } from "../../QueryBuilder/DeferredQuery";
import { MockConnection } from "./MockConnection";
import { PooledConnection } from "../PooledConnection";

export interface IMockedContext {
    oriExecuteDeferred?(deferredQueries: Iterable<DeferredQuery>): Promise<void>;
}
export const mockContext = function (context: DbContext & IMockedContext) {
    context.oriExecuteDeferred = context.executeDeferred;
    context.executeDeferred = async function (deferredQueries?: Iterable<DeferredQuery>) {
        if (!deferredQueries) deferredQueries = context.deferredQueries.splice(0);
        let connection = await this.getConnection();
        let mockConnection: MockConnection;
        if (connection instanceof MockConnection) {
            mockConnection = connection;
        }
        else {
            if (connection instanceof PooledConnection) {
                if (!(connection.connection instanceof MockConnection)) {
                    connection.connection = new MockConnection(connection.database);
                }
                mockConnection = connection.connection as MockConnection;
            }
            else if (!(connection instanceof MockConnection)) {
                connection = mockConnection = new MockConnection(connection.database);
            }
        }
        mockConnection.deferredQueries = deferredQueries;
        this.connection = connection;
        return context.oriExecuteDeferred.apply(this, [deferredQueries]);
    };
};

export function restore(context: DbContext & IMockedContext) {
    context.executeDeferred = context.oriExecuteDeferred;
    context.oriExecuteDeferred = undefined;
}