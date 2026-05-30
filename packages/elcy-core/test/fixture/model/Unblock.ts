import { BigIntColumn, DeletedColumn, Entity, PrimaryKey, StringColumn, UniqueConstraint } from "../../../src/Decorator";

@Entity("Unblock")
export class Unblock {
    @PrimaryKey()
    @BigIntColumn()
    id: bigint;

    @UniqueConstraint()
    @BigIntColumn({ nullable: true })
    unique: bigint;

    @StringColumn()
    name: string;

    @DeletedColumn()
    deleted: boolean;
}