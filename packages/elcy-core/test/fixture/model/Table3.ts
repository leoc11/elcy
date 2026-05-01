import { Uuid } from "../../../src/Data/Uuid";
import { Entity, IdentifierColumn, PrimaryKey, RealColumn, Relationship, SerializeColumn, StringColumn } from "../../../src/Decorator";
import { Json1 } from "./Json1";
import { Table1Table3 } from "./Table1Table3";
import { Table2Table3 } from "./Table2Table3";

@Entity({
    name: "Table3s",
    schema: "fixture"
})
export class Table3 {
    @PrimaryKey()
    @IdentifierColumn({
        default: () => Uuid.new()
    })
    id: Uuid;
    @StringColumn()
    t3Name: string;
    @RealColumn()
    t3Number: number;
    @SerializeColumn(Json1)
    serialize: Json1;

    @Relationship("Table1Table3")
    table1Table3s: Table1Table3[];
    @Relationship("Table2Table3")
    table2Table3s: Table2Table3[];
}
