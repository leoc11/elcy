import { IObjectType } from "../../../Common/Type";
import { QueryBuilder } from "../../QueryBuilder";
import { SelectExpression } from "./index";
import { ProjectionEntityExpression } from "./ProjectionEntityExpression";

export class IntersectExpression<T> extends ProjectionEntityExpression<T> {
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
