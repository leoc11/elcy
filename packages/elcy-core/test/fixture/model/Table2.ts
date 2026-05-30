import { Entity, IntegerColumn, PrimaryKey, ReverseRelation, RowVersionColumn, StringColumn } from "../../../src/Decorator";
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

    @ReverseRelation(() => Table1Table2, o => o.table2)
    table1Table2s: Table1Table2[];
    @ReverseRelation(() => Table2Table3, o => o.table2)
    table2Table3s: Table2Table3[];
}