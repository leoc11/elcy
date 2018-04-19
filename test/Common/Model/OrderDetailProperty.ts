import { PrimaryKey, StringColumn } from "../../../src/Decorator/Column/index";
import { Entity } from "../../../src/Decorator/Entity/index";
import { EntityBase } from "../../../src/Data/EntityBase";
import { OrderDetail } from "./OrderDetail";
import { DecimalColumn } from "../../../src/Decorator/Column/DecimalColumn";
import { ListRelation } from "../../../src/Decorator/Relation/ListRelation";

@Entity("OrderDetailProperties")
export class OrderDetailProperty extends EntityBase {
    @PrimaryKey()
    @StringColumn({ columnType: "nvarchar" })
    public OrderDetailPropertyId: string;

    @StringColumn({ columnType: "nvarchar" })
    public OrderDetailId: string;
    @StringColumn({ columnType: "nvarchar", columnName: "Name" })
    public name: string;
    @DecimalColumn({ columnType: "float", columnName: "Amount" })
    public amount: number;
    @ListRelation<OrderDetailProperty, OrderDetail>(OrderDetail, [(s) => s.OrderDetailId], [(a) => a.OrderDetailId], (o) => o.OrderDetailProperties)
    public OrderDetail: OrderDetail;
}
