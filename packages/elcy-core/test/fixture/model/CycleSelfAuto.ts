import { BigIntColumn, Entity, PrimaryKey, Relation, ReverseRelation, StringColumn } from "../../../src/Decorator";
import { Table1 } from "./Table1";

@Entity("CycleSelfAuto")
export class CycleSelfAuto {
    @PrimaryKey()
    @BigIntColumn({ autoIncrement: true })
    id: bigint;
    
    @BigIntColumn()
    table1Id: bigint;
    
    @StringColumn()
    name: string;

    @BigIntColumn()
    parentId: bigint;

    @Relation(() => Table1, o => o.table1Id, o => o.id)
    table1: Table1;

    @Relation(() => CycleSelfAuto, o => o.parentId, o => o.id)
    cycleSelfAuto: CycleSelfAuto;

    @ReverseRelation(() => CycleSelfAuto, o => o.cycleSelfAuto)
    cycleSelfAutos: CycleSelfAuto[];
}