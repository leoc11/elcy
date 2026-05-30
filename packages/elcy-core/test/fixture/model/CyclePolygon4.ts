import { BigIntColumn, Entity, PrimaryKey, Relation, ReverseRelation } from "../../../src/Decorator";
import { CyclePolygon5 } from "./CyclePolygon5";
import { CycleTriangle3 } from "./CycleTriangle3";

@Entity("CyclePolygon4")
export class CyclePolygon4 {
    @PrimaryKey()
    @BigIntColumn()
    id: bigint;

    @BigIntColumn({ nullable: true })
    cyclePolygon5Id?: bigint;

    @Relation(() => CyclePolygon5, [[o => o.cyclePolygon5Id, o => o.id]])
    cyclePolygon5: CyclePolygon5;

    @ReverseRelation(() => CycleTriangle3, o => o.cyclePolygon4)
    cycleTriangle3s: CycleTriangle3[];
}