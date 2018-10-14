import { DbContext } from "../../Data/DBContext";
import { DeferredQuery } from "../../QueryBuilder/DeferredQuery";
import { IConnection } from "../IConnection";
import { MockConnection } from "./MockConnection";

export interface IMockedContext {
    oriGetConnection?(writable?: boolean): Promise<IConnection>;
    oriExecuteDeferred?(deferredQueries: Iterable<DeferredQuery>): Promise<void>;
}
export const mockContext = function (context: DbContext & IMockedContext) {
    context.oriExecuteDeferred = context.executeDeferred;
    context.oriGetConnection = context.getConnection;
    context.getConnection = async function () {
        if (!this.connection) {
            const con = new MockConnection();
            return con;
        }
        return this.connection;
    };
    context.executeDeferred = async function (deferredQueries: Iterable<DeferredQuery>) {
        const connection: MockConnection = this.connection = await this.getConnection() as any;
        connection.deferredQueries = deferredQueries;
        return context.oriExecuteDeferred.apply(this, arguments);
    };
};
export const restore = function (context: DbContext & IMockedContext) {
    if (context.oriGetConnection) {
        context.getConnection = context.oriGetConnection;
        context.oriGetConnection = undefined;
    }
    if (context.oriExecuteDeferred) {
        context.executeDeferred = context.oriExecuteDeferred;
        context.oriExecuteDeferred = undefined;
    }
};
