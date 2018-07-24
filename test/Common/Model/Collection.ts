import { Entity } from "../../../src/Decorator/Entity/Entity";
import { Product } from ".";
import { Relationship } from "../../../src/Decorator/Relation/Relationship";
import { PrimaryKey } from "../../../src/Decorator/Column/PrimaryKey";
import { StringColumn } from "../../../src/Decorator/Column/StringColumn";
import { IdentifierColumn } from "../../../src/Decorator/Column/IdentifierColumn";

@Entity("Collections")
export class Collection {
    @PrimaryKey()
    @IdentifierColumn()
    public CollectionId: string;
    @StringColumn({ columnType: "nvarchar", length: 100 })
    public name: string;
    @Relationship<Collection>("Contain", "many", Product || "Product", [(o) => o.CollectionId])
    public Products: Product[];
}
