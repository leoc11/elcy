import { NumberColumn, PrimaryKey, StringColumn, BooleanColumn } from "../../../src/Decorator/Column/index";
import { Entity } from "../../../src/Decorator/Entity/index";
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
