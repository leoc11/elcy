import { StringColumn } from "../../../src/Decorator/Column/StringColumn";
import { Product, Collection } from ".";
import { RelationshipData } from "../../../src/Decorator/Relation/RelationshipData";
@RelationshipData<CollectionProductData>(Collection || "Collection", "Contain", Product || "Product", "CollectionProducts", [(o) => o.CollectionId], [(o) => o.ProductId])
export class CollectionProductData {
    @StringColumn({ columnType: "nvarchar", length: 100 })
    public CollectionId: string;
    @StringColumn({ columnType: "nvarchar", length: 100 })
    public ProductId: string;
}
