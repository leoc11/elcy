import { NumberColumn, PrimaryKey, StringColumn } from "../../../src/Decorator/Column/index";
import { Entity } from "../../../src/Decorator/Entity/index";
import { OrderDetail } from ".";
import { Relationship } from "../../../src/Decorator/Relation/Relationship";

@Entity("Products")
export class Product {
    @PrimaryKey()
    @StringColumn({ columnType: "nvarchar", maxLength: 100 })
    public ProductId: string;

    @NumberColumn({ columnType: "bigint" })
    public Price: number;
    @Relationship<Product>("has", "many", OrderDetail || "OrderDetail", [(o) => o.ProductId])
    public OrderDetails: OrderDetail[];
}
