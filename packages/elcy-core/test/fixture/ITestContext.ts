import { DbContext } from "packages/elcy-core/src/Data/DbContext";
import type { DbSet } from "packages/elcy-core/src/Data/DbSet";
import { Table1 } from "./model/Table1";
import { Table2 } from "./model/Table2";
import { Table1Many } from "./model/Table1Many";
import { Table1One } from "./model/Table1One";
import { Table1Table2 } from "./model/Table1Table2";
import { Table1Table2Many } from "./model/Table1Table2Many";
import { Table1Table2One } from "./model/Table1Table2One";
import { Table1Table3 } from "./model/Table1Table3";
import { Table2Table3 } from "./model/Table2Table3";
import { Table3 } from "./model/Table3";
import { CycleDigon1 } from "./model/CycleDigon1";
import { CycleDigon2 } from "./model/CycleDigon2";
import { CyclePolygon1 } from "./model/CyclePolygon1";
import { CyclePolygon2 } from "./model/CyclePolygon2";
import { CyclePolygon4 } from "./model/CyclePolygon4";
import { CyclePolygon5 } from "./model/CyclePolygon5";
import { CycleSelf } from "./model/CycleSelf";
import { CycleSelfAuto } from "./model/CycleSelfAuto";
import { CycleTriangle1 } from "./model/CycleTriangle1";
import { CycleTriangle2 } from "./model/CycleTriangle2";
import { CycleTriangle3 } from "./model/CycleTriangle3";
import { CycleSelfAutoNull } from "./model/CycleSelfAutoNull";
import { Unblock } from "./model/Unblock";

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

export const entityTypes = () => [
    Table1, Table2, Table3, Table1Table2, Table1Table3, Table2Table3, Table1One, Table1Many, Table1Table2One, Table1Table2Many,
    CycleDigon1, CycleDigon2, 
    CycleTriangle1, CycleTriangle2, CycleTriangle3, 
    CyclePolygon1, CyclePolygon2, CyclePolygon4, CyclePolygon5, CycleSelf, CycleSelfAuto, CycleSelfAutoNull, Unblock
];