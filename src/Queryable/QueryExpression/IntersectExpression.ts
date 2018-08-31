import { IObjectType } from "../../Common/Type";
import { QueryBuilder } from "../../QueryBuilder/QueryBuilder";
import { SelectExpression } from "./SelectExpression";
import { ProjectionEntityExpression } from "./ProjectionEntityExpression";

export class IntersectExpression<T> extends ProjectionEntityExpression<T> {
    public readonly entityTypes: IObjectType[];
    constructor(public readonly select: SelectExpression<T>, public readonly select2: SelectExpression, public readonly type: IObjectType<T> = Object as any) {
        super(select, type);
        this.entityTypes = this.select.entity.entityTypes.concat(this.select2.entity.entityTypes).distinct().toArray();
    }
    public toString(queryBuilder: QueryBuilder): string {
        return queryBuilder.getExpressionString(this);
    }
    public execute(queryBuilder: QueryBuilder): any {
        throw new Error("Method not implemented.");
    }
}
