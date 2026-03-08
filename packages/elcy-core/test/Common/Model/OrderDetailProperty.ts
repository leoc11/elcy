import { Uuid } from "../../../src/Data/Uuid";
import { DecimalColumn } from "../../../src/Decorator/Column/DecimalColumn";
import { IdentifierColumn } from "../../../src/Decorator/Column/IdentifierColumn";
import { PrimaryKey } from "../../../src/Decorator/Column/PrimaryKey";
import { StringColumn } from "../../../src/Decorator/Column/StringColumn";
import { Entity } from "../../../src/Decorator/Entity/Entity";
import { Relationship } from "../../../src/Decorator/Relation/Relationship";
import { OrderDetail } from "./OrderDetail";

@Entity("OrderDetailProperties")
export class OrderDetailProperty {
    @PrimaryKey()
    @IdentifierColumn()
    public OrderDetailPropertyId: Uuid;

    @IdentifierColumn()
    public OrderDetailId: Uuid;
    @StringColumn({ columnType: "nvarchar", columnName: "Name" })
    public name: string;
    @DecimalColumn({ columnType: "decimal", columnName: "Amount" })
    public amount: number;
    @Relationship<OrderDetailProperty>("has", "by", "one", OrderDetail || "OrderDetail", [(o) => o.OrderDetailId])
    public OrderDetail: OrderDetail;
}
