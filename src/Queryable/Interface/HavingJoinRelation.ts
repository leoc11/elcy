import { JoinRelation } from "./JoinRelation";
import { IExpression } from "../../ExpressionBuilder/Expression/IExpression";
import { resolveClone } from "../../Helper/Util";

export class HavingJoinRelation<T = any, TChild = any> extends JoinRelation<T, TChild> {
    public clone(replaceMap: Map<IExpression, IExpression>) {
        const child = resolveClone(this.child, replaceMap);
        const parent = resolveClone(this.parent, replaceMap);
        const relation = resolveClone(this.relation, replaceMap);
        const clone = new HavingJoinRelation(parent, child, relation, this.type);
        if (child !== this.child) child.parentRelation = clone;
        return clone;
    }
}