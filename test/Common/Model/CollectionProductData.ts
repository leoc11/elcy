import { Product, Collection } from ".";
import { RelationshipData } from "../../../src/Decorator/Relation/RelationshipData";
import { IdentifierColumn } from "../../../src/Decorator/Column/IdentifierColumn";
@RelationshipData<CollectionProductData>(Collection || "Collection", "Contain", Product || "Product", [(o) => o.CollectionId], [(o) => o.ProductId], "CollectionProducts")
export class CollectionProductData {
    @IdentifierColumn()
    public CollectionId: string;
    @IdentifierColumn()
    public ProductId: string;
}
