import { PrimaryKey, DateColumn, DeleteColumn, StringColumn } from "../../../src/Decorator/Column/index";
import { Entity } from "../../../src/Decorator/Entity/index";
import { ListRelation } from "../../../src/Decorator/Relation/ListRelation";
import { Order } from "./Order";
import { EntityBase } from "../../../src/Data/EntityBase";

@Entity("OrderDetails")
export class OrderDetail extends EntityBase {
    @PrimaryKey()
    @StringColumn({ columnType: "nvarchar" })
    public OrderDetailId: string;
    @StringColumn({ columnType: "nvarchar" })
    public OrderId: string;
    @StringColumn({ columnType: "nvarchar", columnName: "ProductName" })
    public name: string;
    @DateColumn()
    public CreatedDate: Date;
    
    @DeleteColumn()
    public isDeleted: boolean;
    @ListRelation<OrderDetail, Order>(Order, [(s) => s.OrderId], [(a) => a.OrderId], (o) => o.OrderDetails)
    public Order: Order;
}
