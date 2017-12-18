
export type dbType = "string" | "nvarchar" | "varchar" | "text"
    | "decimal" | "bigint" | "int" | "tinyint" | "smallint" | "number" | "float" | "double"
    | "date" | "time" | "datetime" | "boolean"
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
