import { Entity } from "../../../src/Decorator/Entity/Entity";
import { PrimaryKey } from "../../../src/Decorator/Column/PrimaryKey";
import { NumberColumn } from "../../../src/Decorator/Column/NumberColumn";
import { StringColumn } from "../../../src/Decorator/Column/StringColumn";
import { BooleanColumn } from "../../../src/Decorator/Column/BooleanColumn";
// import { TimestampColumn } from "../../../src/Decorator/Column/TimestampColumn";

@Entity("Test")
export class Test {
    @PrimaryKey()
    @NumberColumn({ columnType: "int", autoIncrement: true })
    public ID: number;
    @StringColumn()
    public name: string;
    @BooleanColumn({ columnType: "bit", default: () => false })
    public isDefault: boolean;
}
