import "../../src/Startup";
// tslint:disable-next-line: ordered-imports
import { DbSet } from "../../src/Data/DbSet";
import { MockDriver } from "../../src/Mock/MockDriver";
import { SqliteDbContext } from "../../src/Provider/Sqlite/SqliteDbContext";
import { AutoDetail, AutoParent, Collection, CollectionProductData, Order, OrderDetail, OrderDetailProperty, Product } from "./Model";

export class SqliteDb extends SqliteDbContext {
    constructor() {
        super(() => new MockDriver());
    }
    public collections = this.set(Collection);
    public entityTypes = [Order, OrderDetail, Product, OrderDetailProperty,
        Collection, AutoParent, AutoDetail
    ];
    public orderDetailProperties: DbSet<OrderDetailProperty> = this.set(OrderDetailProperty);
    public orderDetails: DbSet<OrderDetail> = this.set(OrderDetail);
    public orders: DbSet<Order> = this.set(Order);
    public products: DbSet<Product> = this.set(Product);
    public relationDataTypes = [CollectionProductData];
}
