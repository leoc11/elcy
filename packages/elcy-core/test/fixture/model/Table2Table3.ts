import { BigIntColumn, Entity, IntegerColumn, PrimaryKey, Relationship, StringColumn } from "../../../src/Decorator";
import { Table3 } from "./Table3";
import { Table2 } from "./Table2";

@Entity({
    name: "Table1_Table3s"
})
export class Table2Table3 {
    @PrimaryKey()
    @BigIntColumn({ autoIncrement: true })
    id!: bigint;
    @BigIntColumn()
    table2Id!: bigint;
    @IntegerColumn()
    table3Id!: number;
    @StringColumn()
    option13: string;

    @Relationship(Table2, new Map([
        [o => o.table2Id, o => o.id]
    ]))
    table2?: Table2;
    @Relationship(Table3, new Map([
        [o => o.table3Id, o => o.id]
    ]))
    table3?: Table3;
}