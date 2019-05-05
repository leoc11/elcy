import { JoinRelation } from "./JoinRelation";
import { IExpression } from "../../ExpressionBuilder/Expression/IExpression";
import { resolveClone } from "../../Helper/Util";

export class PagingJoinRelation<T = any, TChild = any> extends JoinRelation<T, TChild> {
    public start: IExpression<boolean>;
    public end: IExpression<boolean>;
    public clone(replaceMap: Map<IExpression, IExpression>) {
        const child = resolveClone(this.child, replaceMap);
        const parent = resolveClone(this.parent, replaceMap);
        const relation = resolveClone(this.relation, replaceMap);
        const clone = new PagingJoinRelation(parent, child, relation, this.type);
        if (child !== this.child) child.parentRelation = clone;

        clone.start = resolveClone(this.start, replaceMap);
        clone.end = resolveClone(this.end, replaceMap);
        return clone;
    }
}