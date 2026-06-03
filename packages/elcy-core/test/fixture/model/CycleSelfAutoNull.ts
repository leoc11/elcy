import { BigIntColumn, Entity, PrimaryKey, Relation, ReverseRelation, StringColumn } from "../../../src/Decorator";

@Entity("CycleSelfAutoNull")
export class CycleSelfAutoNull {
    @PrimaryKey()
    @BigIntColumn({ autoIncrement: true })
    id: bigint;
        
    @StringColumn()
    name: string;

    @BigIntColumn({ nullable: true })
    parentId: bigint;

    @Relation(() => CycleSelfAutoNull, o => o.parentId, o => o.id)
    cycleSelfAutoNull: CycleSelfAutoNull;

    @ReverseRelation(() => CycleSelfAutoNull, o => o.cycleSelfAutoNull)
    cycleSelfAutoNulls: CycleSelfAutoNull[];
}