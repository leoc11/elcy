import "../../src/Startup";
import { IQueryCacheManager } from "../../src/Cache/IQueryCacheManager";
import { IResultCacheManager } from "../../src/Cache/IResultCacheManager";
import { IDriver } from "../../src/Connection/IDriver";
import { MockDriver } from "../Mock/MockDriver";
import { Table1, Table1Many, Table1One, Table1Table2, Table1Table2Many, Table1Table2One, Table1Table3, Table2, Table2Table3, Table3 } from "./model";
import { entityTypes, ITestContext } from "./ITestContext";
import { SqliteDbContext } from "../../src/Provider/Sqlite/SqliteDbContext";

export class SqliteContext extends SqliteDbContext implements ITestContext {
    constructor(factory: () => IDriver<any> = () => new MockDriver()) {
        super(factory, entityTypes);
    }
    public get table1s() {
        return this.set(Table1);
    }
    public get table2s() {
        return this.set(Table2);
    }
    public get table3s() {
        return this.set(Table3);
    }
    public get table1Table2s() {
        return this.set(Table1Table2);
    }
    public get table1Table3s() {
        return this.set(Table1Table3);
    }
    public get table2Table3s() {
        return this.set(Table2Table3);
    }
    public get table1Ones() {
        return this.set(Table1One);
    }
    public get table1Manies() {
        return this.set(Table1Many);
    }
    public get table1table2Ones() {
        return this.set(Table1Table2One);
    }
    public get table1table2Manies() {
        return this.set(Table1Table2Many);
    }
    
    declare public queryCacheManagerFactory?: () => IQueryCacheManager;
    declare public resultCacheManagerFactory?: () => IResultCacheManager;
}
