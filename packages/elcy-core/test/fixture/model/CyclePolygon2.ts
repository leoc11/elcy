import { BigIntColumn, Entity, PrimaryKey, Relation, ReverseRelation } from "../../../src/Decorator";
import { CyclePolygon1 } from "./CyclePolygon1";
import { CycleTriangle3 } from "./CycleTriangle3";

@Entity("CyclePolygon2")
export class CyclePolygon2 {
    @PrimaryKey()
    @BigIntColumn()
    id: bigint;

    @BigIntColumn()
    cycleTriangle3Id?: bigint;

    @Relation(() => CycleTriangle3, [[o => o.cycleTriangle3Id, o => o.id]])
    CycleTriangle3: CycleTriangle3;

    @ReverseRelation(() => CyclePolygon1, o => o.cyclePolygon2)
    CyclePolygon1s: CyclePolygon1[];
}