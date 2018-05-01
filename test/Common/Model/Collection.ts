import { PrimaryKey, StringColumn } from "../../../src/Decorator/Column/index";
import { Entity } from "../../../src/Decorator/Entity/index";
import { Product } from ".";
import { Relationship } from "../../../src/Decorator/Relation/Relationship";

@Entity("Collections")
export class Collection {
    @PrimaryKey()
    @StringColumn({ columnType: "nvarchar", maxLength: 100 })
    public CollectionId: string;
    @StringColumn({ columnType: "nvarchar", maxLength: 100 })
    public name: string;
    @Relationship<Collection>("Contain", "many", Product || "Product", [(o) => o.CollectionId])
    public Products: Product[];
}
