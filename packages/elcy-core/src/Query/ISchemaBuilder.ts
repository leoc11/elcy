import { IObjectType } from "../Common/Type";
import { IConnection } from "../Connection/IConnection";
import { IQueryBuilder } from "./IQueryBuilder";
import { ISchemaBuilderOption } from "./ISchemaBuilderOption";
import { ISchemaQuery } from "./ISchemaQuery";

export interface ISchemaBuilder {
    connection: IConnection;
    option: ISchemaBuilderOption;
    queryBuilder: IQueryBuilder;
    getSchemaQuery(entityTypes: IObjectType[]): Promise<ISchemaQuery>;
}
