import { IObjectType } from "../../src/Common/Type";
import { MssqlDbContext } from "../../src/Driver/Mssql/MssqlDbContext";
import { Order, OrderDetail } from "./Model";
import { DbSet } from "../../src/Linq/DbSet";

export class MyDb extends MssqlDbContext {
    public database = "mydb";
    public entityTypes: IObjectType[] = [Order, OrderDetail];
    public orders: DbSet<Order> = this.set(Order);
    public orderDetails: DbSet<OrderDetail> = this.set(OrderDetail);
}
