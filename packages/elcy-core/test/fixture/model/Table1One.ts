import { BigIntColumn, Entity, IntegerColumn, PrimaryKey, Relation, StringColumn } from "../../../src/Decorator";
import { Table1 } from "./Table1";

@Entity("Table1One")
export class Table1One {
    @PrimaryKey()
    @BigIntColumn()
    table1Id: bigint;
    @StringColumn()
    name: string;
    @IntegerColumn()
    number: number;

    @Relation(() => Table1, o => o.table1Id, o => o.id)
    table1: Table1;
}