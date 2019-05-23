import { DbSet } from "../../src/Data/DbSet";
import { MockDriver } from "../../src/Mock/MockDriver";
import { SqliteDbContext } from "../../src/Provider/Sqlite/SqliteDbContext";
import { AutoDetail, AutoParent, Collection, CollectionProductData, Order, OrderDetail, OrderDetailProperty, Product } from "./Model";

export class SqliteDb extends SqliteDbContext {
    public entityTypes = [Order, OrderDetail, Product, OrderDetailProperty,
        Collection, AutoParent, AutoDetail
    ];
    public relationDataTypes = [CollectionProductData];
    public orders: DbSet<Order> = this.set(Order);
    public orderDetails: DbSet<OrderDetail> = this.set(OrderDetail);
    public orderDetailProperties: DbSet<OrderDetailProperty> = this.set(OrderDetailProperty);
    public products: DbSet<Product> = this.set(Product);
    public collections = this.set(Collection);
    constructor() {
        super(() => new MockDriver());
    }
}
