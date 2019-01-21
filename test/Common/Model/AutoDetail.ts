import { Entity } from "../../../src/Decorator/Entity/Entity";
import { PrimaryKey } from "../../../src/Decorator/Column/PrimaryKey";
import { IntegerColumn } from "../../../src/Decorator/Column/IntegerColumn";
import { StringColumn } from "../../../src/Decorator/Column/StringColumn";
import { AutoParent } from "./AutoParent";
import { Relationship } from "../../../src/Decorator/Relation/Relationship";
import { RowVersionColumn } from "../../../src/Decorator/Column/RowVersionColumn";

@Entity("AutoDetail")
export class AutoDetail {
    @PrimaryKey()
    @IntegerColumn({ columnType: "int", autoIncrement: true })
    public id: number;
    @IntegerColumn({ columnType: "int" })
    public parentId: number;
    @StringColumn()
    public description: string;
    @RowVersionColumn()
    public version: Uint8Array;

    @Relationship<AutoDetail>("has", "by", "one", AutoParent || "AutoParent", [(o) => o.parentId])
    public parent: AutoParent;
}
