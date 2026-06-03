import { BigIntColumn, Entity, PrimaryKey, Relation, ReverseRelation } from "../../../src/Decorator";
import { CycleTriangle1 } from "./CycleTriangle1";
import { CycleTriangle3 } from "./CycleTriangle3";

@Entity("CycleTriangle2")
export class CycleTriangle2 {
    @PrimaryKey()
    @BigIntColumn()
    id: bigint;

    @BigIntColumn({ nullable: true })
    cycleTriangle3Id?: bigint;

    @Relation(() => CycleTriangle3, o => o.cycleTriangle3Id, o => o.id)
    cycleTriangle3: CycleTriangle3;
    
    //@Relationship("CycleTriangle1")
    @ReverseRelation(() => CycleTriangle1, o => o.cycleTriangle2)
    cycleTriangle1s: CycleTriangle1[];
}