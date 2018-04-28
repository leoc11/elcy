import { NumberColumn, PrimaryKey, StringColumn, DateColumn } from "../../../src/Decorator/Column/index";
import { Entity } from "../../../src/Decorator/Entity/index";
import { OrderDetail } from "./OrderDetail";
import { Relationship } from "../../../src/Decorator/Relation/Relationship";
// import { TimestampColumn } from "../../../src/Decorator/Column/TimestampColumn";

@Entity("Orders")
export class Order {
    @PrimaryKey()
    @StringColumn({ columnType: "nvarchar", maxLength: 100 })
    public OrderId: string;

    @NumberColumn({ columnType: "bigint" })
    public TotalAmount: number;

    @DateColumn()
    public OrderDate: Date;

    // @TimestampColumn()
    // public Timestamp: string;
    @Relationship<Order>("has", "many", OrderDetail || "OrderDetail", [(o) => o.OrderId])
    public OrderDetails: OrderDetail[];
}
