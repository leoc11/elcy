import { IExpression } from "../../ExpressionBuilder/Expression/IExpression";
import { resolveClone } from "../../Helper/Expression";
import { JoinRelation } from "./JoinRelation";

export class HavingJoinRelation<TE extends object = object, TChild extends object = object> extends JoinRelation<TE, TChild> {
    public override clone(replaceMap: Map<IExpression, IExpression>) {
        const child = resolveClone(this.child, replaceMap);
        const parent = resolveClone(this.parent, replaceMap);
        const relation = resolveClone(this.relation, replaceMap);
        const clone = new HavingJoinRelation(parent, child, relation, this.type);
        if (child !== this.child) {
            child.parentRelation = clone;
        }
        return clone;
    }
}
