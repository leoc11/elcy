import { Entity } from "../../../src/Decorator/Entity/Entity";
import { OrderDetail } from "./OrderDetail";
import { Relationship } from "../../../src/Decorator/Relation/Relationship";
import { PrimaryKey } from "../../../src/Decorator/Column/PrimaryKey";
import { NumberColumn } from "../../../src/Decorator/Column/NumberColumn";
import { DateColumn } from "../../../src/Decorator/Column/DateColumn";
import { IdentifierColumn } from "../../../src/Decorator/Column/IdentifierColumn";
import { UUID } from "../../../src/Data/UUID";
// import { TimestampColumn } from "../../../src/Decorator/Column/TimestampColumn";

export enum OrderStatus {
    Void = "void",
    Draft = "draft",
    Completed = "completed"
}

@Entity("Orders")
export class Order {
    @PrimaryKey()
    @IdentifierColumn()
    public OrderId: UUID;

    @NumberColumn({ columnType: "bigint" })
    public TotalAmount: number;

    @DateColumn()
    public OrderDate: Date;

    // @TimestampColumn()
    // public Timestamp: string;
    @Relationship<Order>("has", "many", OrderDetail || "OrderDetail", [(o) => o.OrderId])
    public OrderDetails: OrderDetail[];
}
