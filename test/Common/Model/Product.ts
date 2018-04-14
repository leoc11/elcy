import { NumberColumn, PrimaryKey, StringColumn } from "../../../src/Decorator/Column/index";
import { Entity } from "../../../src/Decorator/Entity/index";
import { EntityBase } from "../../../src/Data/EntityBase";

@Entity("Products")
export class Product extends EntityBase {
    @PrimaryKey()
    @StringColumn({ columnType: "nvarchar", maxLength: 100 })
    public ProductId: string;

    @NumberColumn({ columnType: "bigint" })
    public Price: number;
}
