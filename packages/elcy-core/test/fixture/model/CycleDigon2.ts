import { BigIntColumn, Entity, PrimaryKey, Relation, ReverseRelation } from "../../../src/Decorator";
import { CycleDigon1 } from "./CycleDigon1";

@Entity("CycleDigon2")
export class CycleDigon2 {
    @PrimaryKey()
    @BigIntColumn()
    id: bigint;

    @BigIntColumn({ nullable: true })
    cycleDigon1Id?: bigint;

    @Relation(() => CycleDigon1, [[o => o.cycleDigon1Id, o => o.id]])
    cycleDigon1: CycleDigon1;
    
    @ReverseRelation(() => CycleDigon1, o => o.cycleDigon2)
    cycleDigon1s: CycleDigon1[];
}