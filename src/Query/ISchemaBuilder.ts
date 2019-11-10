import { IObjectType } from "../Common/Type";
import { IConnection } from "../Connection/IConnection";
import { IEntityMetaData } from "../MetaData/Interface/IEntityMetaData";
import { IQuery } from "./IQuery";
import { IQueryBuilder } from "./IQueryBuilder";
import { ISchemaBuilderOption } from "./ISchemaBuilderOption";
import { ISchemaQuery } from "./ISchemaQuery";

export interface ISchemaBuilder {
    connection: IConnection;
    option: ISchemaBuilderOption;
    queryBuilder: IQueryBuilder;
    getSchemaQuery(entityTypes: IObjectType[]): Promise<ISchemaQuery>;
    createTable<TE>(entityMetaData: IEntityMetaData<TE>, name?: string): IQuery[];
    dropTable<TE>(entityMeta: IEntityMetaData<TE>): IQuery[];
}
