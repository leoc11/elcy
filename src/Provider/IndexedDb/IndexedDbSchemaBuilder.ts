import { IObjectType } from "../../Common/Type";
import { IConnection } from "../../Connection/IConnection";
import { IEntityMetaData } from "../../MetaData/Interface/IEntityMetaData";
import { IQueryBuilder } from "../../Query/IQueryBuilder";
import { ISchemaBuilder } from "../../Query/ISchemaBuilder";
import { ISchemaBuilderOption } from "../../Query/ISchemaBuilderOption";
import { ISchemaQuery } from "../../Query/ISchemaQuery";

export abstract class IndexedDbSchemaBuilder implements ISchemaBuilder {
    public connection: IConnection;
    public option: ISchemaBuilderOption = {};
    public queryBuilder: IQueryBuilder = null;
    public getSchemaQuery(entityTypes: Array<IObjectType<any>>): Promise<ISchemaQuery> {
        throw new Error("Method not implemented.");
    }
    public loadSchemas(entities: Array<IEntityMetaData<any, any>>): Promise<Array<IEntityMetaData<any, any>>> {
        throw new Error("Method not implemented.");
    }
}
