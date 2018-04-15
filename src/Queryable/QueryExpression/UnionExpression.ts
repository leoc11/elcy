import { IObjectType } from "../../Common/Type";
import { QueryBuilder } from "../../QueryBuilder/QueryBuilder";
import { ProjectionEntityExpression } from "./ProjectionEntityExpression";
import { SelectExpression } from "./SelectExpression";

export class UnionExpression<T> extends ProjectionEntityExpression {
    constructor(public readonly select: SelectExpression<T>, public readonly select2: SelectExpression, public isUnionAll = false, public readonly type: IObjectType<T> = Object as any) {
        super(select, type);
    }
    public toString(queryBuilder: QueryBuilder): string {
        return queryBuilder.getExpressionString(this);
    }
    public execute(queryBuilder: QueryBuilder): any {
        throw new Error("Method not implemented.");
    }
}
