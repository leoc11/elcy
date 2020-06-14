import { Uuid } from "../../../src/Data/Uuid";
import { IdentifierColumn } from "../../../src/Decorator/Column/IdentifierColumn";
import { PrimaryKey } from "../../../src/Decorator/Column/PrimaryKey";
import { StringColumn } from "../../../src/Decorator/Column/StringColumn";
import { Entity } from "../../../src/Decorator/Entity/Entity";
import { Relationship } from "../../../src/Decorator/Relation/Relationship";
import { Schema } from "./Schema";

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
