import { DefaultResultCacheManager } from "../../../../src/Cache/DefaultResultCacheManager";
import { IObjectType } from "../../../../src/Common/Type";
import { IDriver } from "../../../../src/Connection/IDriver";
import { MockDriver } from "../../../../src/Mock/MockDriver";
import { MssqlDbContext } from "../../../../src/Provider/Mssql/MssqlDbContext";
import { Schema } from "./Schema";
import { SubSchema } from "./SubSchema";

export class SchemaContext extends MssqlDbContext {
    public entityTypes = [Schema, SubSchema];
    public relationDataTypes: IObjectType[] = [];
    public schemas = this.set(Schema);
    constructor(factory: () => IDriver<any> = () => new MockDriver()) {
        super(factory);
    }
    public resultCacheManagerFactory = () => new DefaultResultCacheManager();
}
