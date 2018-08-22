import { MssqlDbContext } from "../../src/Driver/Mssql/MssqlDbContext";
import { Order, OrderDetail, Product, OrderDetailProperty, Test, Collection, CollectionProductData } from "./Model";
import { DbSet } from "../../src/Data/DbSet";
import { MssqlDriver } from "../../src/Driver/Mssql/MssqlDriver";

export class MyDb extends MssqlDbContext {
    constructor() {
        super(() => new MssqlDriver({
            host: "localhost\\SQLEXPRESS",
            database: "iSeller_Data_Lotte",
            port: 1433,
            user: "sa",
            password: "i1111991",
            // options: {
            //     trustedConnection: true
            // }
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
