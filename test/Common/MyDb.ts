import { MssqlDbContext } from "../../src/Driver/Mssql/MssqlDbContext";
import { Order, OrderDetail, Product, OrderDetailProperty, Collection, CollectionProductData, AutoParent, AutoDetail } from "./Model";
import { DbSet } from "../../src/Data/DbSet";
import { IDriver } from "../../src/Connection/IDriver";
import { MockDriver } from "../../src/Connection/Mock/MockDriver";

export class MyDb extends MssqlDbContext {
    constructor(factory: () => IDriver<any> = () => new MockDriver()) {
        super(factory);
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
    public autoParents = this.set(AutoParent);
    public autoDetails = this.set(AutoDetail);
}
