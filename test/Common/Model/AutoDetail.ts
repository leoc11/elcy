import { IntegerColumn } from "../../../src/Decorator/Column/IntegerColumn";
import { PrimaryKey } from "../../../src/Decorator/Column/PrimaryKey";
import { RowVersionColumn } from "../../../src/Decorator/Column/RowVersionColumn";
import { StringColumn } from "../../../src/Decorator/Column/StringColumn";
import { Entity } from "../../../src/Decorator/Entity/Entity";
import { Relationship } from "../../../src/Decorator/Relation/Relationship";
import { AutoParent } from "./AutoParent";

@Entity("AutoDetail")
export class AutoDetail {
    @PrimaryKey()
    @IntegerColumn({ columnType: "int", autoIncrement: true })
    public id: number;
    @IntegerColumn({ columnType: "int", default: () => 0 })
    public parentId: number;
    @StringColumn()
    public description: string;
    @RowVersionColumn()
    public version: Uint8Array;

    @Relationship<AutoDetail>("has", "by", "one", AutoParent || "AutoParent", [(o) => o.parentId])
    public parent: AutoParent;
}
