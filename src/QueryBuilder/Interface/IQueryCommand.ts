export interface IQueryCommand {
    query: string;
    parameters?: { [key: string]: any };
    type: "DDL" | "DML" | "DQL" | "DCL" | "DTL";
}
