import "../../src/Startup";
// tslint:disable-next-line: ordered-imports
import { IQueryCacheManager } from "../../src/Cache/IQueryCacheManager";
import { IResultCacheManager } from "../../src/Cache/IResultCacheManager";
import { IDriver } from "../../src/Connection/IDriver";
import { DbSet } from "../../src/Data/DbSet";
import { MockDriver } from "../../src/Mock/MockDriver";
import { MssqlDbContext } from "../../src/Provider/Mssql/MssqlDbContext";
import { AutoDetail, AutoParent, Collection, CollectionProductData, Order, OrderDetail, OrderDetailProperty, Product } from "./Model";
const entityTypes = [Order, OrderDetail, Product, OrderDetailProperty,
    Collection, AutoParent, AutoDetail
];

export class MyDb extends MssqlDbContext {
    constructor(factory: () => IDriver<any> = () => new MockDriver()) {
        super(factory, entityTypes);
    }
    public autoDetails = this.set(AutoDetail);
    public autoParents = this.set(AutoParent);
    public collections = this.set(Collection);
    public orderDetailProperties: DbSet<OrderDetailProperty> = this.set(OrderDetailProperty);
    public orderDetails: DbSet<OrderDetail> = this.set(OrderDetail);
    public orders: DbSet<Order> = this.set(Order);
    public products: DbSet<Product> = this.set(Product);
    public queryCacheManagerFactory?: () => IQueryCacheManager;
    public relationDataTypes = [CollectionProductData];
    public resultCacheManagerFactory?: () => IResultCacheManager;
}
