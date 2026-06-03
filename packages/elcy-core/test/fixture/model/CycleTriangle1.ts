import { BigIntColumn, Entity, PrimaryKey, Relation, ReverseRelation } from "../../../src/Decorator";
import { Table1 } from "./Table1";
import { CycleTriangle2 as CycleTriangle2 } from "./CycleTriangle2";
import { CycleTriangle3 as CycleTriangle3 } from "./CycleTriangle3";

@Entity("CycleTriangle1")
export class CycleTriangle1 {
    @PrimaryKey()
    @BigIntColumn()
    id: bigint;

    @BigIntColumn()
    table1Id: bigint;

    @BigIntColumn({ nullable: true })
    cycleTriangle2Id?: bigint;

    @Relation(() => Table1, o => o.table1Id, o => o.id)
    table1: Table1;

    @Relation(() => CycleTriangle2, o => o.cycleTriangle2Id, o => o.id)
    cycleTriangle2: CycleTriangle2;
    
    //@Relationship("CycleTriangle3")
    @ReverseRelation(() => CycleTriangle3, o => o.cycleTriangle1)
    cycleTriangle3s: CycleTriangle3[];
}