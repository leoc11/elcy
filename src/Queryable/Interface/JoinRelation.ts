import { SelectExpression } from "../QueryExpression/SelectExpression";
import { IExpression } from "../../ExpressionBuilder/Expression/IExpression";
import { JoinType } from "../../Common/Type";
import { IColumnExpression } from "../QueryExpression/IColumnExpression";
import { visitExpression, resolveClone, isColumnExp } from "../../Helper/Util";
import { Enumerable } from "../../Enumerable/Enumerable";
import { ISelectRelation } from "./ISelectRelation";
import { AndExpression } from "../../ExpressionBuilder/Expression/AndExpression";
import { EqualExpression } from "../../ExpressionBuilder/Expression/EqualExpression";
import { StrictEqualExpression } from "../../ExpressionBuilder/Expression/StrictEqualExpression";

export class JoinRelation<T = any, TChild = any> implements ISelectRelation<T, TChild> {
    constructor();
    constructor(parent: SelectExpression<T>, child: SelectExpression<TChild>, relations: IExpression<boolean>, type: JoinType);
    constructor(parent?: SelectExpression<T>, child?: SelectExpression<TChild>, relations?: IExpression<boolean>, type?: JoinType) {
        if (parent) {
            this.parent = parent;
            this.child = child;
            this.relation = relations;
            this.type = type;
        }
    }

    private _parentColumns: IColumnExpression[];
    private _relations: IExpression<boolean>;
    private _childColumns: IColumnExpression[];
    private _isManyManyRelation: boolean;
    private analyzeRelation() {
        this._parentColumns = [];
        this._childColumns = [];
        if (this.relation) {
            visitExpression(this.relation, (exp: IExpression) => {
                if (isColumnExp(exp)) {
                    const colExp = exp as IColumnExpression;
                    if (this.child.entity === colExp.entity) {
                        this._childColumns.push(colExp);
                    }
                    else if (this.parent.entity === colExp.entity) {
                        this._parentColumns.push(colExp);
                    }
                    else if (Enumerable.from(this.child.allJoinedEntities).contains(colExp.entity)) {
                        this._childColumns.push(colExp);
                    }
                    else if (Enumerable.from(this.parent.allJoinedEntities).contains(colExp.entity)) {
                        this._parentColumns.push(colExp);
                    }
                }
                else if (!(exp instanceof AndExpression || exp instanceof EqualExpression || exp instanceof StrictEqualExpression)) {
                    this._isManyManyRelation = true;
                }
            });

            if (!this._isManyManyRelation) {
                this._isManyManyRelation = this._childColumns.any(o => !this.child.primaryKeys.contains(o)) && this._parentColumns.any(o => !this.parent.primaryKeys.contains(o));
            }
        }
    }
    //#endregion

    //#region Properties
    public parent: SelectExpression<T>;
    public child: SelectExpression<TChild>;
    public get relation() {
        return this._relations;
    }
    public set relation(value) {
        this._relations = value;
        this._childColumns = this._parentColumns = this._isManyManyRelation = null;
    }
    public type: JoinType;
    public isEmbedded: boolean;
    public get parentColumns() {
        if (!this._parentColumns) {
            this.analyzeRelation();
        }
        return this._parentColumns;
    }
    public get childColumns() {
        if (!this._childColumns) {
            this.analyzeRelation();
        }
        return this._childColumns;
    }
    public get isManyToManyRelation() {
        if (typeof this._isManyManyRelation !== "boolean") {
            this.analyzeRelation();
        }
        return this._isManyManyRelation;
    }
    //#endregion

    //#region Methods
    public clone(replaceMap?: Map<IExpression, IExpression>) {
        const child = resolveClone(this.child, replaceMap);
        const parent = resolveClone(this.parent, replaceMap);
        const relation = resolveClone(this.relation, replaceMap);
        const clone = new JoinRelation(parent, child, relation, this.type);
        if (child !== this.child) child.parentRelation = clone;
        clone.isEmbedded = this.isEmbedded;
        return clone;
    }
    //#endregion
}