import { Uuid } from "../../../src/Data/Uuid";
import { DateColumn } from "../../../src/Decorator/Column/DateColumn";
import { DecimalColumn } from "../../../src/Decorator/Column/DecimalColumn";
import { IdentifierColumn } from "../../../src/Decorator/Column/IdentifierColumn";
import { PrimaryKey } from "../../../src/Decorator/Column/PrimaryKey";
import { Entity } from "../../../src/Decorator/Entity/Entity";
import { Relationship } from "../../../src/Decorator/Relation/Relationship";
import { OrderDetail } from "./OrderDetail";
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
    public OrderId: Uuid;

    @DecimalColumn({ columnType: "decimal" })
    public TotalAmount: number;

    @DateColumn()
    public OrderDate: Date;

    // @TimestampColumn()
    // public Timestamp: string;
    @Relationship<Order>("has", "many", OrderDetail || "OrderDetail", [(o) => o.OrderId])
    public OrderDetails: OrderDetail[];
    constructor(defValues?: { [key in keyof Order]?: any }) {
        if (defValues) {
            for (const prop in defValues) {
                const value = (defValues as any)[prop];
                this[prop as keyof Order] = value;
            }
        }
    }
}
