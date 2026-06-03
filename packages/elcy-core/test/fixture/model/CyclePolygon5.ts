import { BigIntColumn, Entity, PrimaryKey, Relation, ReverseRelation } from "../../../src/Decorator";
import { CyclePolygon1 } from "./CyclePolygon1";
import { CyclePolygon4 } from "./CyclePolygon4";

@Entity("CyclePolygon5")
export class CyclePolygon5 {
    @PrimaryKey()
    @BigIntColumn()
    id: bigint;

    @BigIntColumn({ nullable: true })
    cyclePolygon1Id?: bigint;

    @Relation(() => CyclePolygon1, [[o => o.cyclePolygon1Id, o => o.id]])
    cyclePolygon1: CyclePolygon1;

    @ReverseRelation(() => CyclePolygon4, o => o.cyclePolygon5)
    cyclePolygon4s: CyclePolygon4[];
}