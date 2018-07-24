import { SqliteDbContext } from "../../src/Driver/Sqlite/SqliteDbContext";
import { Order, OrderDetail, Product, OrderDetailProperty, Test, Collection, CollectionProductData } from "./Model";
import { DbSet } from "../../src/Data/DbSet";
import { SqliteDriver } from "../../src/Driver/Sqlite/SqliteDriver";

export class SqliteDb extends SqliteDbContext {
    constructor() {
        super(() => new SqliteDriver({
            database: "./build/test.db"
        }));
    }
    public entityTypes = [Order, OrderDetail, Product, OrderDetailProperty,
        Test,
        Collection
    ];
    public relationDataTypes = [CollectionProductData];
    public orders: DbSet<Order> = this.set(Order);
    public orderDetails: DbSet<OrderDetail> = this.set(OrderDetail);
    public orderDetailProperties: DbSet<OrderDetailProperty> = this.set(OrderDetailProperty);
    public products: DbSet<Product> = this.set(Product);
    public tests = this.set(Test);
    public collections = this.set(Collection);
}