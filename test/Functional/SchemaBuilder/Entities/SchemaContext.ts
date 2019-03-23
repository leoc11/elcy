import { MssqlDbContext } from "../../../../src/Provider/Mssql/MssqlDbContext";
import { IDriver } from "../../../../src/Connection/IDriver";
import { MockDriver } from "../../../../src/Connection/Mock/MockDriver";
import { Schema } from "./Schema";
import { DefaultResultCacheManager } from "../../../../src/Cache/DefaultResultCacheManager";
import { IObjectType } from "../../../../src/Common/Type";
import { SubSchema } from "./SubSchema";

const resultCacheManager = new DefaultResultCacheManager();
export class SchemaContext extends MssqlDbContext {
    constructor(factory: () => IDriver<any> = () => new MockDriver()) {
        super(factory);
    }
    public entityTypes = [Schema, SubSchema];
    public relationDataTypes: IObjectType[] = [];
    public schemas = this.set(Schema);
    public resultCacheManager = resultCacheManager;
}
