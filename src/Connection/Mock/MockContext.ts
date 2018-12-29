import { DbContext } from "../../Data/DBContext";
import { DeferredQuery } from "../../QueryBuilder/DeferredQuery";
import { IConnection } from "../IConnection";
import { MockConnection } from "./MockConnection";
import { IConnectionManager } from "../IConnectionManager";

export interface IMockedContext {
    oriExecuteDeferred?(deferredQueries: Iterable<DeferredQuery>): Promise<void>;
}
export interface IMockedConnectionManager {
    oriGetConnection?(writable?: boolean): Promise<IConnection>;
}
export const mockContext = function (context: DbContext & IMockedContext) {
    mockConnectionManager(context.connectionManager);
    context.oriExecuteDeferred = context.executeDeferred;
    context.executeDeferred = async function (deferredQueries?: Iterable<DeferredQuery>) {
        if (!deferredQueries) deferredQueries = context.deferredQueries.splice(0);
        const connection: MockConnection = this.connection = await this.getConnection() as any;
        connection.deferredQueries = deferredQueries;
        return context.oriExecuteDeferred.apply(this, [deferredQueries]);
    };
};
export const mockConnectionManager = function (conManager: IConnectionManager & IMockedConnectionManager) {
    conManager.oriGetConnection = conManager.getConnection;
    conManager.getConnection = async function () {
        return new MockConnection();
    };
};

export function restore(context: DbContext & IMockedContext): void;
export function restore(conManager: IConnectionManager & IMockedConnectionManager): void;
export function restore(conManagerOrContext: (IConnectionManager & IMockedConnectionManager) | (DbContext & IMockedContext)) {
    if ((conManagerOrContext as DbContext & IMockedContext).oriExecuteDeferred) {
        const context = conManagerOrContext as DbContext & IMockedContext;
        context.executeDeferred = context.oriExecuteDeferred;
        context.oriExecuteDeferred = undefined;
        restore(context.connectionManager);
    }
    else if ((conManagerOrContext as IConnectionManager & IMockedConnectionManager).oriGetConnection) {
        const conManager = conManagerOrContext as IConnectionManager & IMockedConnectionManager;
        conManager.getConnection = conManager.oriGetConnection;
        conManager.oriGetConnection = undefined;
    }
}