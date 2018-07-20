import { Entity } from "../../../src/Decorator/Entity/Entity";
import { OrderDetail } from "./OrderDetail";
import { Relationship } from "../../../src/Decorator/Relation/Relationship";
import { PrimaryKey } from "../../../src/Decorator/Column/PrimaryKey";
import { StringColumn } from "../../../src/Decorator/Column/StringColumn";
import { NumberColumn } from "../../../src/Decorator/Column/NumberColumn";
import { DateColumn } from "../../../src/Decorator/Column/DateColumn";
// import { TimestampColumn } from "../../../src/Decorator/Column/TimestampColumn";

@Entity("Orders")
export class Order {
    @PrimaryKey()
    @StringColumn({ columnType: "nvarchar", length: 100 })
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
