import { IQueryCacheManager } from "../../src/Cache/IQueryCacheManager";
import { IResultCacheManager } from "../../src/Cache/IResultCacheManager";
import { IDriver } from "../../src/Connection/IDriver";
import { DbSet } from "../../src/Data/DbSet";
import { MockDriver } from "../../src/Mock/MockDriver";
import { MssqlDbContext } from "../../src/Provider/Mssql/MssqlDbContext";
import { AutoDetail, AutoParent, Collection, CollectionProductData, Order, OrderDetail, OrderDetailProperty, Product } from "./Model";

export class MyDb extends MssqlDbContext {
    public queryCacheManagerFactory?: () => IQueryCacheManager;
    public resultCacheManagerFactory?: () => IResultCacheManager;
    public entityTypes = [Order, OrderDetail, Product, OrderDetailProperty,
        Collection, AutoParent, AutoDetail
    ];
    public relationDataTypes = [CollectionProductData];
    public orders: DbSet<Order> = this.set(Order);
    public orderDetails: DbSet<OrderDetail> = this.set(OrderDetail);
    public orderDetailProperties: DbSet<OrderDetailProperty> = this.set(OrderDetailProperty);
    public products: DbSet<Product> = this.set(Product);
    public collections = this.set(Collection);
    public autoParents = this.set(AutoParent);
    public autoDetails = this.set(AutoDetail);
    constructor(factory: () => IDriver<any> = () => new MockDriver()) {
        super(factory);
    }
}
