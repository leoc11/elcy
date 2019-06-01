import "../../src/Startup";
// tslint:disable-next-line: ordered-imports
import { IQueryCacheManager } from "../../src/Cache/IQueryCacheManager";
import { IResultCacheManager } from "../../src/Cache/IResultCacheManager";
import { IDriver } from "../../src/Connection/IDriver";
import { DbSet } from "../../src/Data/DbSet";
import { MockDriver } from "../../src/Mock/MockDriver";
import { MssqlDbContext } from "../../src/Provider/Mssql/MssqlDbContext";
import { AutoDetail, AutoParent, Collection, CollectionProductData, Order, OrderDetail, OrderDetailProperty, Product } from "./Model";
import { AutoDetailDesc } from "./Model/AutoDetailDesc";
const entityTypes = [Order, OrderDetail, Product, OrderDetailProperty,
    Collection, AutoParent, AutoDetail, AutoDetailDesc
];

export class MyDb extends MssqlDbContext {
    constructor(factory: () => IDriver<any> = () => new MockDriver()) {
        super(factory, entityTypes);
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
