import { PrimaryKey, DeleteColumn, StringColumn } from "../../../src/Decorator/Column/index";
import { Entity } from "../../../src/Decorator/Entity/index";
import { ListRelation } from "../../../src/Decorator/Relation/ListRelation";
import { Order } from "./Order";

@Entity("OrderDetails")
export class OrderDetail {
    @PrimaryKey()
    @StringColumn({ columnType: "nvarchar" })
    public OrderDetailId: string;
    @StringColumn({ columnType: "nvarchar" })
    public OrderId: string;
    @StringColumn({ columnType: "nvarchar" })
    public name: string;
    @DeleteColumn()
    public isDeleted: boolean;
    @ListRelation<OrderDetail, Order>(Order, [(s) => s.OrderId], [(a) => a.OrderId], (o) => o.OrderDetails)
    public Order: Order;
}
