import { BigIntColumn, Entity, PrimaryKey, Relation, ReverseRelation } from "../../../src/Decorator";
import { Table1 } from "./Table1";

@Entity("CycleSelf")
export class CycleSelf {
    @PrimaryKey()
    @BigIntColumn()
    id: bigint;

    @BigIntColumn()
    table1Id: bigint;

    @BigIntColumn({ nullable: true })
    parentId?: bigint;

    @Relation(() => Table1, o => o.table1Id, o => o.id)
    table1: Table1;

    @Relation(() => CycleSelf, o => o.parentId, o => o.id)
    cycleSelf: CycleSelf;

    @ReverseRelation(() => CycleSelf, o => o.cycleSelf)
    cycleSelfs: CycleSelf[];
}