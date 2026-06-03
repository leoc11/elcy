import { BigIntColumn, Entity, PrimaryKey, Relation, ReverseRelation } from "../../../src/Decorator";
import { CycleTriangle1 } from "./CycleTriangle1";
import { CycleTriangle2 } from "./CycleTriangle2";
import { CyclePolygon4 } from "./CyclePolygon4";
import { CyclePolygon2 } from "./CyclePolygon2";

@Entity("CycleTriangle3")
export class CycleTriangle3 {
    @PrimaryKey()
    @BigIntColumn()
    id: bigint;

    @BigIntColumn({ nullable: true })
    cycleTriangle1Id?: bigint;

    @BigIntColumn()
    cyclePolygon4Id?: bigint;

    @Relation(() => CycleTriangle1, o => o.cycleTriangle1Id, o => o.id)
    cycleTriangle1: CycleTriangle1;
    
    //@Relationship("CycleTriangle2")
    @ReverseRelation(() => CycleTriangle2, o => o.cycleTriangle3)
    cycleTriangle2s: CycleTriangle2[];
    
    @Relation(() => CyclePolygon4, o => o.cycleTriangle1Id, o => o.id)
    cyclePolygon4: CyclePolygon4;

    //@Relationship("CyclePolygon2")
    @ReverseRelation(() => CyclePolygon2, o => o.CycleTriangle3)
    cyclePolygon2s: CyclePolygon2[];
}