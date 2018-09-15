import { Entity } from "../../../src/Decorator/Entity/Entity";
import { OrderDetail, Collection } from ".";
import { Relationship } from "../../../src/Decorator/Relation/Relationship";
import { PrimaryKey } from "../../../src/Decorator/Column/PrimaryKey";
import { IntegerColumn } from "../../../src/Decorator/Column/IntegerColumn";
import { IdentifierColumn } from "../../../src/Decorator/Column/IdentifierColumn";
import { UUID } from "../../../src/Data/UUID";

@Entity("Products")
export class Product {
    @PrimaryKey()
    @IdentifierColumn()
    public ProductId: UUID;

    @IntegerColumn({ columnType: "bigint" })
    public Price: number;
    @Relationship<Product>("has", "many", OrderDetail || "OrderDetail", [(o) => o.ProductId])
    public OrderDetails: OrderDetail[];
    @Relationship<Product>("Contain", "by", "many", Collection || "Collection", [(o) => o.ProductId])
    public Collections: Collection[];
}
