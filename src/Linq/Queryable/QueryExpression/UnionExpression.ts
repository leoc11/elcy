import { QueryBuilder } from "../../QueryBuilder";
import { ProjectionEntityExpression } from "./ProjectionEntityExpression";
import { SelectExpression } from "./SelectExpression";

export class UnionExpression extends SelectExpression {
    public isUnionAll: boolean;
    constructor(public readonly entity: ProjectionEntityExpression, public readonly entity2: ProjectionEntityExpression, public alias: string) {
        super(entity);
    }
    public toString(queryBuilder: QueryBuilder): string {
        return queryBuilder.toUnionString(this);
    }
    public execute(queryBuilder: QueryBuilder): string {
        throw new Error("Method not implemented.");
    }
}
