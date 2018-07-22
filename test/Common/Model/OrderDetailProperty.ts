import { OrderDetail } from "./OrderDetail";
import { DecimalColumn } from "../../../src/Decorator/Column/DecimalColumn";
import { Relationship } from "../../../src/Decorator/Relation/Relationship";
import { Entity } from "../../../src/Decorator/Entity/Entity";
import { PrimaryKey } from "../../../src/Decorator/Column/PrimaryKey";
import { StringColumn } from "../../../src/Decorator/Column/StringColumn";
import { IdentifierColumn } from "../../../src/Decorator/Column/IdentifierColumn";
import { UUID } from "../../../src/Data/UUID";

@Entity("OrderDetailProperties")
export class OrderDetailProperty {
    @PrimaryKey()
    @IdentifierColumn()
    public OrderDetailPropertyId: UUID;

    @IdentifierColumn()
    public OrderDetailId: UUID;
    @StringColumn({ columnType: "nvarchar", columnName: "Name" })
    public name: string;
    @DecimalColumn({ columnType: "decimal", columnName: "Amount" })
    public amount: number;
    @Relationship<OrderDetailProperty>("has", "by", "one", OrderDetail || "OrderDetail", [(o) => o.OrderDetailId])
    public OrderDetail: OrderDetail;
}
