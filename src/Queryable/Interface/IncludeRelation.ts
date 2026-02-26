import { RelationshipType } from "../../Common/StringType";
import { AndExpression } from "../../ExpressionBuilder/Expression/AndExpression";
import { EqualExpression } from "../../ExpressionBuilder/Expression/EqualExpression";
import { IExpression } from "../../ExpressionBuilder/Expression/IExpression";
import { StrictEqualExpression } from "../../ExpressionBuilder/Expression/StrictEqualExpression";
import { resolveClone, visitExpression } from "../../Helper/Util";
import { IColumnExpression } from "../QueryExpression/IColumnExpression";
import { SelectExpression } from "../QueryExpression/SelectExpression";
import { ISelectRelation } from "./ISelectRelation";

export class IncludeRelation<T extends object = object, TChild extends object = object> implements ISelectRelation<T, TChild> {
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
    public get parentColumns() {
        if (!this._parentColumns) {
            this.analyzeRelation();
        }
        return this._parentColumns;
    }
    constructor();
    constructor(parent: SelectExpression<T, any>, child: SelectExpression<TChild, any>, name: string, type: RelationshipType, relations?: IExpression<boolean>);
    constructor(parent?: SelectExpression<T, any>, child?: SelectExpression<TChild, any>, name?: string, type?: RelationshipType, relations?: IExpression<boolean>) {
        if (parent) {
            this.parent = parent;
            this.child = child;
            this.relation = relations;
            this.type = type;
            this.name = name;
        }
    }
    public child: SelectExpression<TChild>;
    public isEmbedded: boolean;
    public name: string;
    //#endregion

    //#region Properties
    public parent: SelectExpression<T>;
    public relation: IExpression<boolean>;
    public type: RelationshipType;
    private _childColumns: IColumnExpression<TChild>[];
    private _isManyManyRelation: boolean;

    private _parentColumns: IColumnExpression<T>[];
    //#endregion

    //#region Methods
    public addRelation(parentColumn: IColumnExpression, childColumn: IColumnExpression) {
        const logicalExp = new StrictEqualExpression(parentColumn, childColumn);
        this.relation = this.relation ? new AndExpression(this.relation, logicalExp) : logicalExp;
    }
    public clone(replaceMap: Map<IExpression, IExpression>) {
        const child = resolveClone(this.child, replaceMap);
        const parent = resolveClone(this.parent, replaceMap);
        const relation = resolveClone(this.relation, replaceMap);
        const clone = new IncludeRelation(parent, child, this.name, this.type, relation);
        if (child !== this.child) {
            child.parentRelation = clone;
        }
        clone.isEmbedded = this.isEmbedded;
        return clone;
    }
    public * relationMap() {
        for (let i = 0, len = this.parentColumns.length; i < len; i++) {
            yield [this.parentColumns[i], this.childColumns[i]];
        }
    }

    private analyzeRelation() {
        this._parentColumns = [];
        this._childColumns = [];
        this._isManyManyRelation = false;
        visitExpression(this.relation, (exp: IExpression) => {
            if ((exp as IColumnExpression).entity) {
                const colExp = exp as IColumnExpression;
                if (this.child.entity === colExp.entity) {
                    this._childColumns.push(colExp);
                }
                else if (this.parent.entity === colExp.entity) {
                    this._parentColumns.push(colExp);
                }
                else if (this.child.allSelects.map((o) => o.entity).includes(colExp.entity)) {
                    this._childColumns.push(colExp);
                }
                else if (this.parent.allSelects.map((o) => o.entity).includes(colExp.entity)) {
                    this._parentColumns.push(colExp);
                }
            }
            else if (!(exp instanceof AndExpression || exp instanceof EqualExpression || exp instanceof StrictEqualExpression)) {
                this._isManyManyRelation = true;
            }
        });

        if (!this._isManyManyRelation) {
            const childPks = this.child.allSelects.flatMap((o) => o.primaryKeys);
            const parentPks = this.parent.allSelects.flatMap((o) => o.primaryKeys);
            this._isManyManyRelation = this._childColumns.some((o) => !childPks.includes(o)) && this._parentColumns.some((o) => !parentPks.includes(o));
        }
    }
    //#endregion
}
