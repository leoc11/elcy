import { PrimaryKey, StringColumn } from "../../../src/Decorator/Column/index";
import { Entity } from "../../../src/Decorator/Entity/index";
import { OrderDetail } from "./OrderDetail";
import { DecimalColumn } from "../../../src/Decorator/Column/DecimalColumn";
import { Relationship } from "../../../src/Decorator/Relation/Relationship";

@Entity("OrderDetailProperties")
export class OrderDetailProperty {
    @PrimaryKey()
    @StringColumn({ columnType: "nvarchar" })
    public OrderDetailPropertyId: string;

    @StringColumn({ columnType: "nvarchar" })
    public OrderDetailId: string;
    @StringColumn({ columnType: "nvarchar", columnName: "Name" })
    public name: string;
    @DecimalColumn({ columnType: "float", columnName: "Amount" })
    public amount: number;
    @Relationship<OrderDetailProperty>("has", "by", "one", OrderDetail || "OrderDetail", [(o) => o.OrderDetailId])
    public OrderDetail: OrderDetail;
}
