import { Collection, OrderDetail } from ".";
import { ValueType } from "../../../src/Common/Type";
import { Uuid } from "../../../src/Common/Uuid";
import { IdentifierColumn } from "../../../src/Decorator/Column/IdentifierColumn";
import { IntegerColumn } from "../../../src/Decorator/Column/IntegerColumn";
import { PrimaryKey } from "../../../src/Decorator/Column/PrimaryKey";
import { Entity } from "../../../src/Decorator/Entity/Entity";
import { Relationship } from "../../../src/Decorator/Relation/Relationship";

@Entity("Products")
export class Product {
    constructor(defValues?: { [key in keyof Product]?: ValueType }) {
        if (defValues) {
            for (const prop in defValues) {
                const value = (defValues as any)[prop];
                this[prop as any] = value;
            }
        }
    }
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
