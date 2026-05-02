import { DbContext } from "packages/elcy-core/src/Data/DbContext";
import { Table1, Table1Many, Table1One, Table1Table2, Table1Table2Many, Table1Table2One, Table1Table3, Table2, Table2Table3, Table3 } from "./model";
import type { DbSet } from "packages/elcy-core/src/Data/DbSet";

export interface ITestContext extends DbContext {
    get table1s(): DbSet<Table1>;
    get table2s(): DbSet<Table2>;
    get table3s(): DbSet<Table3>;
    get table1Table2s(): DbSet<Table1Table2>;
    get table1Table3s(): DbSet<Table1Table3>;
    get table2Table3s(): DbSet<Table2Table3>;
    get table1Ones(): DbSet<Table1One>;
    get table1Manies(): DbSet<Table1Many>;
    get table1table2Ones(): DbSet<Table1Table2One>;
    get table1table2Manies(): DbSet<Table1Table2Many>;
}

export const entityTypes = [Table1, Table2, Table3, Table1Table2, Table1Table3, Table2Table3, Table1One, Table1Many, Table1Table2One, Table1Table2Many];