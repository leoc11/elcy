import { IQuery } from "./IQuery";

export interface ISchemaQuery {
    commit: IQuery[];
    rollback: IQuery[];
}
