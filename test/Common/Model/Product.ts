import { Entity } from "../../../src/Decorator/Entity/Entity";
import { OrderDetail, Collection } from ".";
import { Relationship } from "../../../src/Decorator/Relation/Relationship";
import { PrimaryKey } from "../../../src/Decorator/Column/PrimaryKey";
import { StringColumn } from "../../../src/Decorator/Column/StringColumn";
import { NumberColumn } from "../../../src/Decorator/Column/NumberColumn";

@Entity("Products")
export class Product {
    @PrimaryKey()
    @StringColumn({ columnType: "nvarchar", length: 100 })
    public ProductId: string;

    @NumberColumn({ columnType: "bigint" })
    public Price: number;
    @Relationship<Product>("has", "many", OrderDetail || "OrderDetail", [(o) => o.ProductId])
    public OrderDetails: OrderDetail[];
    @Relationship<Product>("Contain", "by", "many", Collection || "Collection", [(o) => o.ProductId])
    public Collections: Collection[];
}
