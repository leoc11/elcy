import { BigIntColumn, Entity, IdentifierColumn, IntegerColumn, PrimaryKey, Relation, StringColumn } from "../../../src/Decorator";
import { Table3 } from "./Table3";
import { Table2 } from "./Table2";
import { Uuid } from "packages/elcy-core/src/Data/Uuid";

@Entity({
    name: "Table1_Table3s"
})
export class Table2Table3 {
    @PrimaryKey()
    @BigIntColumn({ autoIncrement: true })
    id!: bigint;
    @IntegerColumn()
    table2Id!: number;
    @IdentifierColumn()
    table3Id: Uuid;
    @StringColumn()
    option13: string;

    @Relation(() => Table2, o => o.table2Id, o => o.id)
    table2?: Table2;
    @Relation(() => Table3, o => o.table3Id, o => o.id)
    table3?: Table3;
}