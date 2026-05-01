import { Entity, IntegerColumn, PrimaryKey, Relationship, RowVersionColumn, StringColumn } from "../../../src/Decorator";
import { Table1Table2 } from "./Table1Table2";
import { Table2Table3 } from "./Table2Table3";

@Entity({
    name: "Table2s",
    schema: "fixture"
})
export class Table2 {
    @PrimaryKey()
    @IntegerColumn({ autoIncrement: true })
    id!: number;
    @StringColumn()
    t2Name: string;
    @IntegerColumn()
    t2Number: number;
    @RowVersionColumn()
    rowVersion: Uint8Array;
    unmapped?: string;

    @Relationship("TABLE1TABLE2", "TABLE2_RELATION")
    table1Table2s: Table1Table2[];
    @Relationship("Table2Table3")
    table2Table3s: Table2Table3[];
}