import { BigIntColumn, Entity, IntegerColumn, PrimaryKey, Relationship, StringColumn } from "../../../src/Decorator";
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

    @Relationship(Table1Table2, new Map([
        ["relTable1Id", "table1Id"],
        ["relTable2Id", "table2Id"]
    ]))
    table1table2: Table1Table2;
    @Relationship(Table1, new Map([["relTable1Id", o => o.id]]))
    table1: Table1;
    @Relationship(Table2, new Map([["relTable2Id", o => o.id]]))
    table2: Table2;
}