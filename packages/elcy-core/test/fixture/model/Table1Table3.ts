import { Uuid } from "../../../src/Data/Uuid";
import { BigIntColumn, Entity, IdentifierColumn, PrimaryKey, Relation, StringColumn } from "../../../src/Decorator";
import { Table1 } from "./Table1";
import { Table3 } from "./Table3";

@Entity({
    name: "Table1_Table3s"
})
export class Table1Table3 {
    @PrimaryKey()
    @BigIntColumn({ autoIncrement: true })
    id!: bigint;
    @BigIntColumn()
    table1Id!: bigint;
    @IdentifierColumn()
    table3Id!: Uuid;
    @StringColumn()
    option13: string;

    @Relation(() => Table1, o => o.table1Id, o => o.id)
    table1?: Table1;
    @Relation(() => Table3, o => o.table3Id, o => o.id)
    table3?: Table3;
}