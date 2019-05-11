import { SqliteDbContext } from "../../src/Provider/Sqlite/SqliteDbContext";
import { Order, OrderDetail, Product, OrderDetailProperty, Collection, CollectionProductData, AutoParent, AutoDetail } from "./Model";
import { DbSet } from "../../src/Data/DbSet";
import { MockDriver } from "../../src/Mock/MockDriver";

export class SqliteDb extends SqliteDbContext {
    constructor() {
        super(() => new MockDriver());
    }
    public entityTypes = [Order, OrderDetail, Product, OrderDetailProperty,
        Collection, AutoParent, AutoDetail
    ];
    public relationDataTypes = [CollectionProductData];
    public orders: DbSet<Order> = this.set(Order);
    public orderDetails: DbSet<OrderDetail> = this.set(OrderDetail);
    public orderDetailProperties: DbSet<OrderDetailProperty> = this.set(OrderDetailProperty);
    public products: DbSet<Product> = this.set(Product);
    public collections = this.set(Collection);
}
