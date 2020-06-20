import { DefaultQueryCacheManager } from "../../../src/Cache/DefaultQueryCacheManager";
import { IQueryCacheManager } from "../../../src/Cache/IQueryCacheManager";
import { IResultCacheManager } from "../../../src/Cache/IResultCacheManager";
import { IConnectionManager } from "../../../src/Connection/IConnectionManager";
import { IDriver } from "../../../src/Connection/IDriver";
import { PooledConnectionManager } from "../../../src/Connection/PooledConnectionManager";
import { MockDriver } from "../../../src/Mock/MockDriver";
import { MssqlDbContext } from "../../../src/Provider/Mssql/MssqlDbContext";
import { AutoDetail, AutoParent, Collection, CollectionProductData, Order, OrderDetail, OrderDetailProperty, Product } from "../../Common/Model";
import { AutoDetailDesc } from "../../Common/Model/AutoDetailDesc";

const entityTypes = [Order, OrderDetail, Product, OrderDetailProperty,
    Collection, AutoParent, AutoDetail, AutoDetailDesc
];

export class MssqlDb extends MssqlDbContext {
    constructor(factory: () => IConnectionManager | IDriver = () => new PooledConnectionManager(new MockDriver(), { idleTimeout: 1000 })) {
        super(factory, entityTypes);
        this.queryCacheManagerFactory = () => new DefaultQueryCacheManager();
    }
    public get autoDetails() {
        return this.set(AutoDetail);
    }
    public get autoParents() {
        return this.set(AutoParent);
    }
    public get collections() {
        return this.set(Collection);
    }
    public get orderDetailProperties() {
        return this.set(OrderDetailProperty);
    }
    public get orderDetails() {
        return this.set(OrderDetail);
    }
    public get orders() {
        return this.set(Order);
    }
    public get products() {
        return this.set(Product);
    }
    public queryCacheManagerFactory?: () => IQueryCacheManager;
    public relationDataTypes = [CollectionProductData];
    public resultCacheManagerFactory?: () => IResultCacheManager;
}
