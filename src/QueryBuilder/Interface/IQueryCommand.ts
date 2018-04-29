export interface IQueryCommand {
    query: string;
    parameters?: Map<string, any>;
}
