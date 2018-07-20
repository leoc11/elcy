export interface IQueryCommand {
    query: string;
    parameters?: { [key: string]: any };
}
