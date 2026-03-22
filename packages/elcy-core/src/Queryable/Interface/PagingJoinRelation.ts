import { IExpression } from "../../ExpressionBuilder/Expression/IExpression";
import { resolveClone } from "../../Helper/Util";
import { JoinRelation } from "./JoinRelation";

export class PagingJoinRelation<TE extends object = object, TChild extends object = object> extends JoinRelation<TE, TChild> {
    public end: IExpression<number>;
    public start: IExpression<number>;
    public override clone(replaceMap: Map<IExpression, IExpression>) {
        const child = resolveClone(this.child, replaceMap);
        const parent = resolveClone(this.parent, replaceMap);
        const relation = resolveClone(this.relation, replaceMap);
        const clone = new PagingJoinRelation(parent, child, relation, this.type);
        if (child !== this.child) {
            child.parentRelation = clone;
        }

        clone.start = resolveClone(this.start, replaceMap);
        clone.end = resolveClone(this.end, replaceMap);
        return clone;
    }
}
