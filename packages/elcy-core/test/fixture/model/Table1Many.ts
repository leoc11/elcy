import { BigIntColumn, Entity, IntegerColumn, PrimaryKey, Relationship, StringColumn } from "../../../src/Decorator";
import { Table1 } from "./Table1";

@Entity("Table1Manies")
export class Table1Many {
    @PrimaryKey()
    @BigIntColumn({ autoIncrement: true })
    id: bigint;
    @BigIntColumn()
    table1Id: bigint;
    @StringColumn()
    name: string;
    @IntegerColumn()
    integer: number;

    @Relationship(Table1, new Map([[o => o.table1Id, o => o.id]]))
    table1: Table1;
}