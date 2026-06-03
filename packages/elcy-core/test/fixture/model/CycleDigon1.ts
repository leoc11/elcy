import { BigIntColumn, Entity, PrimaryKey, Relation, ReverseRelation } from "../../../src/Decorator";
import { Table1 } from "./Table1";
import { CycleDigon2 } from "./CycleDigon2";

@Entity("CycleDigon1")
export class CycleDigon1 {
    @PrimaryKey()
    @BigIntColumn()
    id: bigint;

    @BigIntColumn()
    table1Id: bigint;

    @BigIntColumn({ nullable: true })
    cycleDigon2Id?: bigint;

    @Relation(() => Table1, [[o => o.table1Id, o => o.id]])
    table1: Table1;

    @Relation(() => CycleDigon2, [[o => o.cycleDigon2Id, o => o.id]])
    cycleDigon2: CycleDigon2;
    
    @ReverseRelation(() => CycleDigon2, o => o.cycleDigon1)
    cycleDigon2s: CycleDigon2[];
}