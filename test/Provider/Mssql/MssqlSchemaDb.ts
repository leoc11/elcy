import { DefaultResultCacheManager } from "../../../src/Cache/DefaultResultCacheManager";
import { IObjectType } from "../../../src/Common/Type";
import { IDriver } from "../../../src/Connection/IDriver";
import { MockDriver } from "../../../src/Mock/MockDriver";
import { MssqlDbContext } from "../../../src/Provider/Mssql/MssqlDbContext";
import { Schema } from "../../Common/SchemaModel/Schema";
import { SubSchema } from "../../Common/SchemaModel/SubSchema";

export class MssqlSchemaDb extends MssqlDbContext {
    constructor(factory: () => IDriver<any> = () => new MockDriver()) {
        super(factory);
    }
    public entityTypes = [Schema, SubSchema];
    public relationDataTypes: IObjectType[] = [];
    public schemas = this.set(Schema);
    public resultCacheManagerFactory = () => new DefaultResultCacheManager();
}
