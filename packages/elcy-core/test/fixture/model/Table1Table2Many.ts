import { PropertySelector } from "packages/elcy-core/src/Common/Type";
import { BigIntColumn, Entity, IntegerColumn, PrimaryKey, Relationship, StringColumn } from "../../../src/Decorator";
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

    @Relationship(Table1Table2, new Map<PropertySelector<Table1Table2Many>, PropertySelector<Table1Table2>>([
        [o => o.table1Id, o => o.table1Id],
        [o => o.table2Id, o => o.table2Id]
    ]))
    table1table2: Table1Table2;
    @Relationship(Table1, new Map([["table1Id", "id"]]))
    table1: Table1;
    @Relationship(Table2, new Map([["table2Id", "id"]]))
    table2: Table2;
}