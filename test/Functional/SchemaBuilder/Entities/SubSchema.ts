import { Uuid } from "../../../../src/Data/Uuid";
import { PrimaryKey } from "../../../../src/Decorator/Column/PrimaryKey";
import { StringColumn } from "../../../../src/Decorator/Column/StringColumn";
import { IdentifierColumn } from "../../../../src/Decorator/Column/IdentifierColumn";
import { Entity } from "../../../../src/Decorator/Entity/Entity";
import { Schema } from "./Schema";
import { Relationship } from "../../../../src/Decorator/Relation/Relationship";

@Entity()
export class SubSchema {
    @PrimaryKey()
    @IdentifierColumn()
    public identifier: Uuid;

    @StringColumn()
    public name: string;

    @Relationship("own", "by", "one", Schema || "Schema", [(o: SubSchema) => o.identifier])
    public schema: Schema;
}
