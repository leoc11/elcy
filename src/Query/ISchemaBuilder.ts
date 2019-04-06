import { IConnection } from "../Connection/IConnection";
import { IQueryBuilder } from "./IQueryBuilder";
import { IObjectType } from "../Common/Type";
import { IEntityMetaData } from "../MetaData/Interface/IEntityMetaData";
import { ISchemaQuery } from "./ISchemaQuery";
import { ISchemaBuilderOption } from "./ISchemaBuilderOption";

export interface ISchemaBuilder {
    connection: IConnection;
    queryBuilder: IQueryBuilder;
    option: ISchemaBuilderOption;
    getSchemaQuery(entityTypes: IObjectType[]): Promise<ISchemaQuery>;
    loadSchemas(entities: IEntityMetaData<any>[]): Promise<IEntityMetaData[]>;
}