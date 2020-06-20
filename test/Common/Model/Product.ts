import { Collection, OrderDetail } from ".";
import { Uuid } from "../../../src/Common/Uuid";
import { IdentifierColumn } from "../../../src/Decorator/Column/IdentifierColumn";
import { IntegerColumn } from "../../../src/Decorator/Column/IntegerColumn";
import { PrimaryKey } from "../../../src/Decorator/Column/PrimaryKey";
import { Entity } from "../../../src/Decorator/Entity/Entity";
import { Relationship } from "../../../src/Decorator/Relation/Relationship";

@Entity("Products")
export class Product {
    @PrimaryKey()
    @IdentifierColumn()
    public ProductId: Uuid;

    @IntegerColumn({ columnType: "bigint" })
    public Price: number;
    @Relationship<Product>("has", "many", OrderDetail || "OrderDetail", [(o) => o.ProductId])
    public OrderDetails: OrderDetail[];
    @Relationship<Product>("Contain", "by", "many", Collection || "Collection", [(o) => o.ProductId])
    public Collections: Collection[];
}
