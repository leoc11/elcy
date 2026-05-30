import { BigIntColumn, Entity, PrimaryKey, Relation, ReverseRelation } from "../../../src/Decorator";
import { CyclePolygon2 } from "./CyclePolygon2";
import { CyclePolygon5 } from "./CyclePolygon5";

@Entity("CyclePolygon1")
export class CyclePolygon1 {
    @PrimaryKey()
    @BigIntColumn()
    id: bigint;

    @BigIntColumn({ nullable: true })
    cyclePolygon2Id?: bigint;

    @Relation(() => CyclePolygon2, [[o => o.cyclePolygon2Id, o => o.id]])
    cyclePolygon2: CyclePolygon2;
    
    // @Relationship("CyclePolygon5")
    @ReverseRelation(() => CyclePolygon5, o => o.cyclePolygon1)
    cyclePolygon5s: CyclePolygon5[];
}