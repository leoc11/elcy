import { IQueryBuilderContext } from "src/Query/IQueryBuilderContext";

export interface IMysqlQueryBuilderContext extends IQueryBuilderContext {
    placeholders?: unknown[];
}