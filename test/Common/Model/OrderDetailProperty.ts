import { OrderDetail } from "./OrderDetail";
import { DecimalColumn } from "../../../src/Decorator/Column/DecimalColumn";
import { Relationship } from "../../../src/Decorator/Relation/Relationship";
import { Entity } from "../../../src/Decorator/Entity/Entity";
import { PrimaryKey } from "../../../src/Decorator/Column/PrimaryKey";
import { StringColumn } from "../../../src/Decorator/Column/StringColumn";

@Entity("OrderDetailProperties")
export class OrderDetailProperty {
    @PrimaryKey()
    @StringColumn({ columnType: "nvarchar" })
    public OrderDetailPropertyId: string;

    @StringColumn({ columnType: "nvarchar" })
    public OrderDetailId: string;
    @StringColumn({ columnType: "nvarchar", columnName: "Name" })
    public name: string;
    @DecimalColumn({ columnType: "decimal", columnName: "Amount" })
    public amount: number;
    @Relationship<OrderDetailProperty>("has", "by", "one", OrderDetail || "OrderDetail", [(o) => o.OrderDetailId])
    public OrderDetail: OrderDetail;
}
