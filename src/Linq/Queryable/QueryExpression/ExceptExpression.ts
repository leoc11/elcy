import { QueryBuilder } from "../../QueryBuilder";
import { ProjectionEntityExpression } from "./ProjectionEntityExpression";
import { SelectExpression } from "./SelectExpression";
import { IObjectType } from "../../../Common/Type";

export class ExceptExpression<T> extends ProjectionEntityExpression<T> {
    constructor(public readonly select: SelectExpression<T>, public readonly select2: SelectExpression, public readonly alias: string, public readonly type: IObjectType<T> = Object as any) {
        super(select, alias, type);
    }
    public toString(queryBuilder: QueryBuilder): string {
        return queryBuilder.getExpressionString(this);
    }
    public execute(queryBuilder: QueryBuilder): any {
        throw new Error("Method not implemented.");
    }
}
