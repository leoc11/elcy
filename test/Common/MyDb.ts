import { IObjectType } from "../../src/Common/Type";
import { MssqlDbContext } from "../../src/Driver/Mssql/MssqlDbContext";
import { DbSet } from "../../src/Linq/DbSet";
import { Order, OrderDetail } from "./Model";

export class MyDb extends MssqlDbContext {
    public entities: IObjectType[] = [Order, OrderDetail];
    public get orders(): DbSet<Order> {
        return this.set(Order);
    }
    public get orderDetails(): DbSet<OrderDetail> {
        return this.set(OrderDetail);
    }
}
