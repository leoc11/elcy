import { BigIntColumn, Entity, IntegerColumn, PrimaryKey, Relation, StringColumn } from "../../../src/Decorator";
import { Table1 } from "./Table1";
import { Table1Table2 } from "./Table1Table2";
import { Table2 } from "./Table2";

@Entity({
    name: "Table1_Table2_Ones"
})
export class Table1Table2One {
    @PrimaryKey()
    @BigIntColumn()
    relTable1Id!: bigint;
    @PrimaryKey()
    @IntegerColumn()
    relTable2Id!: number;
    @StringColumn()
    string: string;
    @IntegerColumn()
    number: number;

    @Relation(() => Table1Table2, [
        ["relTable1Id", "table1Id"],
        ["relTable2Id", "table2Id"]
    ])
    table1table2: Table1Table2;
    @Relation(() => Table1, "relTable1Id", o => o.id)
    table1: Table1;
    @Relation(() => Table2, [["relTable2Id", o => o.id]])
    table2: Table2;
}