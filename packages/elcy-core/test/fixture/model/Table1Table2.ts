import { BigIntColumn, Entity, IntegerColumn, PrimaryKey, Relationship, StringColumn } from "../../../src/Decorator";
import { Table1 } from "./Table1";
import { Table1Table2Many } from "./Table1Table2Many";
import { Table1Table2One } from "./Table1Table2One";
import { Table2 } from "./Table2";

@Entity({
    name: "Table1_Table2s"
})
export class Table1Table2 {
    @PrimaryKey()
    @BigIntColumn()
    table1Id!: bigint;
    @PrimaryKey()
    @IntegerColumn()
    table2Id!: number;
    @StringColumn()
    option12: string;

    @Relationship(Table1, {
        name: "table1_relation",
        relationMap: new Map([
            [o => o.table1Id, o => o.id]
        ])
    })
    table1?: Table1;
    @Relationship(Table2, {
        name: "table2_relation",
        relationMap: new Map([
            [o => o.table2Id, o => o.id]
        ])
    })
    table2?: Table2;

    @Relationship("Table1Table2Many")
    table1Table2Manies: Table1Table2Many[];
    @Relationship("Table1Table2One")
    table1Table2One: Table1Table2One;
}