import { IObjectType } from "../../src/Common/Type";
import { MssqlDbContext } from "../../src/Driver/Mssql/MssqlDbContext";
import { Order, OrderDetail, Product, OrderDetailProperty } from "./Model";
import { DbSet } from "../../src/Data/DbSet";

export class MyDb extends MssqlDbContext {
    constructor() {
        super({
            host: "localhost\\SQLEXPRESS",
            database: "iSeller_Data_Lotte",
            port: 1433,
            user: "xxx",
            password: "xxx",
            // options: {
            //     trustedConnection: true
            // }
        });
    }
    public entityTypes: IObjectType[] = [Order, OrderDetail, Product, OrderDetailProperty];
    public orders: DbSet<Order> = this.set(Order);
    public orderDetails: DbSet<OrderDetail> = this.set(OrderDetail);
    public orderDetailProperties: DbSet<OrderDetailProperty> = this.set(OrderDetailProperty);
    public products: DbSet<Product> = this.set(Product);
}
