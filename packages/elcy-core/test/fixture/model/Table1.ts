import { Temporal } from "@js-temporal/polyfill";
import Decimal from "decimal.js";
import { TimeSpan } from "../../../src/Data/TimeSpan";
import { Uuid } from "../../../src/Data/Uuid";
import { BigIntColumn, BinaryColumn, BooleanColumn, ComputedColumn, CreatedDateColumn, DateColumn, DateTimeColumn, DecimalColumn, DeletedColumn, Entity, IdentifierColumn, IntegerColumn, ModifiedDateColumn, PrimaryKey, RealColumn, Relationship, StringColumn, TimeColumn } from "../../../src/Decorator";
import { Table1Table2 } from "./Table1Table2";
import { Table1One } from "./Table1One";
import { Table1Table3 } from "./Table1Table3";
import { Table1Many } from "./Table1Many";

// TODO: Enum
// missing one side relation (one, many, reverse_one, revers_many)
@Entity({
    name: "Table1s",
    schema: "fixture"
})
export class Table1 {
    @PrimaryKey()
    @BigIntColumn({ autoIncrement: true })
    id!: bigint;
    @BigIntColumn()
    bigint: bigint;
    @BinaryColumn()
    binary: Uint8Array;
    @BooleanColumn()
    boolean: boolean;
    @DateColumn()
    date: Date;
    @DateColumn({ type: Temporal.PlainDate })
    plainDate: Temporal.PlainDate;
    @DateTimeColumn()
    dateTime: Date;
    @DateTimeColumn({ type: Temporal.Instant })
    instant: Temporal.Instant;
    @DecimalColumn()
    decimal: string;
    @DecimalColumn({ type: Number })
    decimalNumber: number;
    @DecimalColumn({ type: Decimal })
    decimalDecimal: Decimal;
    @DeletedColumn()
    deleted!: boolean;
    @IdentifierColumn()
    identifier: Uuid;
    @IdentifierColumn({ type: String })
    identifierString: string;
    @IntegerColumn()
    integer: number;
    @RealColumn()
    real: number;
    @StringColumn()
    string: string;
    @TimeColumn()
    time: TimeSpan;
    @TimeColumn({ type: Temporal.PlainTime })
    plainTime: Temporal.PlainTime;
    @CreatedDateColumn({ type: Temporal.Instant, timeZoneHandling: "utc" })
    createdDate!: Temporal.Instant;
    @ModifiedDateColumn({ type: Temporal.Instant, timeZoneHandling: "utc" })
    modifiedDate!: Temporal.Instant;
    @ComputedColumn(o => o.integer + o.decimalNumber)
    public accessor computed: number;

    @Relationship("Table1Table2", "table1_relation")
    table1Table2s: Table1Table2[];
    @Relationship("Table1Table3")
    table1Table3s: Table1Table3[];
    @Relationship("Table1One")
    table1One: Table1One;
    @Relationship("Table1Many")
    table1Manies: Table1Many[];
}