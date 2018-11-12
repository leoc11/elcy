import { BooleanColumn } from "../../../../src/Decorator/Column/BooleanColumn";
import { CreatedDateColumn } from "../../../../src/Decorator/Column/CreatedDateColumn";
import { UUID } from "../../../../src/Data/UUID";
import { ComputedColumn } from "../../../../src/Decorator/Column/ComputedColumn";
import { IntegerColumn } from "../../../../src/Decorator/Column/IntegerColumn";
import { PrimaryKey } from "../../../../src/Decorator/Column/PrimaryKey";
import { TimeSpan } from "../../../../src/Data/TimeSpan";
import { TimeColumn } from "../../../../src/Decorator/Column/TimeColumn";
import { StringColumn } from "../../../../src/Decorator/Column/StringColumn";
import { RowVersionColumn } from "../../../../src/Decorator/Column/RowVersionColumn";
import { RealColumn } from "../../../../src/Decorator/Column/RealColumn";
import { ModifiedDateColumn } from "../../../../src/Decorator/Column/ModifiedDateColumn";
import { IdentifierColumn } from "../../../../src/Decorator/Column/IdentifierColumn";
import { EnumColumn } from "../../../../src/Decorator/Column/EnumColumn";
import { DeletedColumn } from "../../../../src/Decorator/Column/DeletedColumn";
import { DecimalColumn } from "../../../../src/Decorator/Column/DecimalColumn";
import { DateColumn } from "../../../../src/Decorator/Column/DateColumn";
import { DateTimeColumn } from "../../../../src/Decorator/Column/DateTimeColumn";
import { NullableColumn } from "../../../../src/Decorator/Column/NullableColumn";
import { CheckContraint } from "../../../../src/Decorator/CheckConstraint";
import { ColumnIndex } from "../../../../src/Decorator/ColumnIndex";
import { UniqueConstraint } from "../../../../src/Decorator/UniqueConstraint";
import { Entity } from "../../../../src/Decorator/Entity/Entity";
import { SubSchema } from "./SubSchema";
import { Relationship } from "../../../../src/Decorator/Relation/Relationship";

enum EnumList {
    first = 1,
    second = 2
}

@CheckContraint({ name: "Schema_entity_check", check: (entity: Schema) => entity.decimal > entity.integer })
@UniqueConstraint<Schema>({ name: "Schema_entity_unique", properties: ["decimal", "real"] })
@Entity<Schema>("Schema", [[o => o.createdDate, "DESC"]])
export class Schema {
    @PrimaryKey()
    @IntegerColumn({ autoIncrement: true })
    public primaryKey: number;

    @BooleanColumn()
    public boolean: boolean;

    @CheckContraint((entity: Schema) => entity.decimal >= 0)
    @DecimalColumn({ precision: 10, scale: 2 })
    public decimal: number;

    @EnumColumn({ options: EnumList, type: Number })
    public enum: EnumList;

    @UniqueConstraint()
    @IdentifierColumn()
    public identifier: UUID;

    @IntegerColumn({ length: 4 })
    public integer: number;

    @NullableColumn()
    @BooleanColumn()
    public nullable: boolean;

    @ComputedColumn((o: Schema) => o.integer + o.decimal)
    public computed: number;

    @RealColumn({ precision: 10, scale: 2 })
    public real: number;

    @RowVersionColumn()
    public rowVersion: ArrayBuffer;

    @StringColumn({ length: 150, default: () => "empty" })
    public string: string;

    @DateColumn({ precision: 5 })
    public date: Date;

    @TimeColumn({ timeZoneHandling: "none" })
    public time: TimeSpan;

    @TimeColumn({ precision: 5, timeZoneHandling: "utc" })
    public timeUTC: TimeSpan;

    @DateTimeColumn({ timeZoneHandling: "none" })
    public dateTime: Date;

    @DateTimeColumn({ precision: 5, timeZoneHandling: "utc" })
    public dateTimeUTC: Date;

    @CreatedDateColumn()
    public createdDate: Date;

    @ModifiedDateColumn()
    public modifiedDate: Date;

    @ColumnIndex()
    @DeletedColumn()
    public deleted: boolean;

    @Relationship("own", "one", SubSchema || "SubSchema", [(o: Schema) => o.identifier])
    public subSchema: SubSchema;
}
