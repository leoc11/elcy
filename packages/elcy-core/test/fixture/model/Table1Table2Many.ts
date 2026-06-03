import { BigIntColumn, Entity, IntegerColumn, PrimaryKey, Relation, StringColumn } from "../../../src/Decorator";
import { Table1 } from "./Table1";
import { Table1Table2 } from "./Table1Table2";
import { Table2 } from "./Table2";

@Entity({
    name: "Table1_Table2_Manies"
})
export class Table1Table2Many {
    @PrimaryKey()
    @BigIntColumn({ autoIncrement: true })
    id: bigint;
    @BigIntColumn()
    table1Id!: bigint;
    @IntegerColumn()
    table2Id!: number;
    @StringColumn()
    string: string;
    @IntegerColumn()
    number: number;

    @Relation(() => Table1Table2, [
        [o => o.table1Id, o => o.table1Id],
        [o => o.table2Id, o => o.table2Id]
    ])
    table1table2: Table1Table2;
    @Relation(() => Table1, "table1Id", "id")
    table1: Table1;
    @Relation(() => Table2, [["table2Id", "id"]])
    table2: Table2;
}