import { IntegerColumn } from "../../../src/Decorator/Column/IntegerColumn";
import { PrimaryKey } from "../../../src/Decorator/Column/PrimaryKey";
import { StringColumn } from "../../../src/Decorator/Column/StringColumn";
import { Entity } from "../../../src/Decorator/Entity/Entity";
import { Relationship } from "../../../src/Decorator/Relation/Relationship";
import { AutoDetail } from "./AutoDetail";

@Entity("AutoDetailDesc")
export class AutoDetailDesc {
    @StringColumn()
    public desc: string;
    @PrimaryKey()
    @IntegerColumn({ columnType: "int", autoIncrement: true })
    public id: number;
    @Relationship<AutoDetail>("has1", "by", "one", AutoDetail || "AutoDetail", [(o) => o.id])
    public AutoDetail: AutoDetail;
}
