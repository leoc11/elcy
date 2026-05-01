import { IConnection } from "../../../src/Connection/IConnection";
import { PooledConnection } from "../../../src/Connection/PooledConnection";
import { DbContext } from "../../../src/Data/DbContext";
import { IEnumerable } from "@elcy/enumerable";
import { DeferredQuery } from "../../../src/Query/DeferredQuery";
import { MockConnection } from "./MockConnection";

export interface IMockedContext {
    oriExecuteDeferred?(deferredQueries: IEnumerable<DeferredQuery>): Promise<void>;
    oriGetConnection?(writable?: boolean): Promise<IConnection>;
    oriCloseConnection?(con?: IConnection): Promise<void>;
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
    context.oriCloseConnection = context.closeConnection;
    context.closeConnection = async function (con?: IConnection) {
        if (!con) {
            con = this.connection;
        }
        if (con && !con.inTransaction) {
            await con.close();
        }
    }
    context.executeDeferred = async function (deferredQueries?: IEnumerable<DeferredQuery>) {
        if (!deferredQueries) {
            deferredQueries = context.deferredQueries.splice(0);
        }
        this.connection = await this.getConnection();
        const mockConnection: MockConnection = this.connection instanceof PooledConnection ? this.connection.connection as any : this.connection as any;
        mockConnection.setQueries(deferredQueries);
        return context.oriExecuteDeferred.apply(this, [deferredQueries]);
    };
};

export function restore(context: DbContext & IMockedContext) {
    context.getConnection = context.oriGetConnection;
    context.oriGetConnection = undefined;
    context.executeDeferred = context.oriExecuteDeferred;
    context.oriExecuteDeferred = undefined;
    context.closeConnection = context.oriCloseConnection;
    context.oriCloseConnection = undefined;
}
