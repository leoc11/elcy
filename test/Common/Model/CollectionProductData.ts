import { Collection, Product } from ".";
import { IdentifierColumn } from "../../../src/Decorator/Column/IdentifierColumn";
import { RelationshipData } from "../../../src/Decorator/Relation/RelationshipData";
@RelationshipData<CollectionProductData>(Collection || "Collection", "Contain", Product || "Product", [(o) => o.CollectionId], [(o) => o.ProductId], "CollectionProducts")
export class CollectionProductData {
    @IdentifierColumn()
    public CollectionId: string;
    @IdentifierColumn()
    public ProductId: string;
}
