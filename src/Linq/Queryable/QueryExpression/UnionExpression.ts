import { QueryBuilder } from "../../QueryBuilder";
import { ProjectionEntityExpression } from "./ProjectionEntityExpression";
import { SelectExpression } from "./SelectExpression";

export class UnionExpression extends SelectExpression {
    constructor(public readonly entity: ProjectionEntityExpression, public readonly entity2: ProjectionEntityExpression, public isUnionAll = false) {
        super(entity);
    }
    public toString(queryBuilder: QueryBuilder): string {
        return queryBuilder.toUnionString(this);
    }
    public execute(queryBuilder: QueryBuilder): any {
        throw new Error("Method not implemented.");
    }
}
