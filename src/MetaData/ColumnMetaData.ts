
export type dbType = "string" | "text" | "number" | "int" | "smallint" | "bigint"
    | "float" | "double" | "decimal" | "date" | "time" | "datetime" | "boolean"
    | "json" | "jsonb" | "simple_array";

export class ColumnMetaData<T> {
    public name: string;
    public indexed: boolean;
    public unique: boolean;
    public nullable: boolean;
    public default: T;
    public description: string;
    public dbtype: dbType;
    constructor(public type: { new(): T }) {
    }
}
