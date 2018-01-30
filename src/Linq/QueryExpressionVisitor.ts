import { JoinType, OrderDirection, RelationType } from "../Common/Type";
import { entityMetaKey, relationMetaKey } from "../Decorator/DecoratorKey";
import {
    AdditionExpression, AndExpression, ArrayValueExpression, BitwiseAndExpression,
    BitwiseNotExpression, BitwiseOrExpression, BitwiseSignedRightShiftExpression,
    BitwiseXorExpression, BitwiseZeroLeftShiftExpression, BitwiseZeroRightShiftExpression,
    DivisionExpression, EqualExpression, FunctionCallExpression, FunctionExpression,
    GreaterEqualExpression, GreaterThanExpression, IBinaryOperatorExpression, IExpression,
    InstanceofExpression, IUnaryOperatorExpression, LeftDecrementExpression,
    LeftIncrementExpression, LessEqualExpression, LessThanExpression, MemberAccessExpression,
    MethodCallExpression, NotEqualExpression, NotExpression, ObjectValueExpression, OrExpression,
    ParameterExpression, RightDecrementExpression, RightIncrementExpression,
    StrictEqualExpression, StrictNotEqualExpression, SubtractionExpression, TernaryExpression,
    TimesExpression, TypeofExpression, ValueExpression
} from "../ExpressionBuilder/Expression";
import { ModulusExpression } from "../ExpressionBuilder/Expression/ModulusExpression";
import { ExpressionFactory } from "../ExpressionBuilder/ExpressionFactory";
import { TransformerParameter } from "../ExpressionBuilder/TransformerParameter";
import { IEntityMetaData, IRelationMetaData } from "../MetaData/Interface/index";
import { MasterRelationMetaData } from "../MetaData/Relation/index";
import { NamingStrategy } from "./NamingStrategy";
import { EntityExpression } from "./Queryable/QueryExpression/EntityExpression";
import { GroupByExpression } from "./Queryable/QueryExpression/GroupByExpression";
import { IColumnExpression } from "./Queryable/QueryExpression/IColumnExpression";
import { ColumnExpression, ComputedColumnExpression, ExceptExpression, IEntityExpression, IJoinRelationMap, IntersectExpression, ProjectionEntityExpression, UnionExpression } from "./Queryable/QueryExpression/index";
import { JoinEntityExpression } from "./Queryable/QueryExpression/JoinEntityExpression";
import { SelectExpression } from "./Queryable/QueryExpression/SelectExpression";
import { SqlFunctionCallExpression } from "./Queryable/QueryExpression/SqlFunctionCallExpression";
import { Column } from "../Decorator/Column/Column";
import { isPrimitive } from "util";
import { isValueType } from "../Helper/Util";
import { SingleSelectExpression } from "./Queryable/QueryExpression/SingleSelectExpression";
import { ColumnEntityExpression } from "./Queryable/QueryExpression/ColumnEntityExpression";
import { Queryable } from "./Queryable/index";
import { GroupedExpression } from "./Queryable/QueryExpression/GroupedExpression";

export interface IQueryVisitParameter {
    parent: SelectExpression;
    type?: string;
}
export class QueryExpressionVisitor {
    public parameters = new TransformerParameter();
    private aliasObj: { [key: string]: number } = {};
    constructor(public namingStrategy: NamingStrategy = new NamingStrategy()) {
    }
    public newAlias(type: "entity" | "column" = "entity") {
        if (!this.aliasObj[type])
            this.aliasObj[type] = 0;
        return this.namingStrategy.getAlias(type) + this.aliasObj[type]++;
    }
    public visit(expression: IExpression, param: IQueryVisitParameter): IExpression {
        switch (expression.constructor) {
            case MemberAccessExpression:
                return this.visitMember(expression as any, param);
            case MethodCallExpression:
                return this.visitMethod(expression as any, param);
            case FunctionCallExpression:
                return this.visitFunctionCall(expression as any, param);
            case BitwiseNotExpression:
            case LeftDecrementExpression:
            case LeftIncrementExpression:
            case NotExpression:
            case RightDecrementExpression:
            case RightIncrementExpression:
            case TypeofExpression:
                return this.visitUnaryOperator(expression as any as IUnaryOperatorExpression, param);
            case AdditionExpression:
            case AndExpression:
            case BitwiseAndExpression:
            case BitwiseOrExpression:
            case BitwiseSignedRightShiftExpression:
            case BitwiseXorExpression:
            case BitwiseZeroLeftShiftExpression:
            case BitwiseZeroRightShiftExpression:
            case DivisionExpression:
            case EqualExpression:
            case GreaterEqualExpression:
            case GreaterThanExpression:
            case InstanceofExpression:
            case LessEqualExpression:
            case LessThanExpression:
            case ModulusExpression:
            case NotEqualExpression:
            case OrExpression:
            case StrictEqualExpression:
            case StrictNotEqualExpression:
            case SubtractionExpression:
            case TimesExpression:
                return this.visitBinaryOperator(expression as any as IBinaryOperatorExpression, param);
            case TernaryExpression:
                return this.visitTernaryOperator(expression as TernaryExpression<any>, param);
            case ObjectValueExpression:
                return this.visitObjectLiteral(expression as ObjectValueExpression<any>, param);
            case ArrayValueExpression:
                throw new Error(`literal Array not supported`);
            // Possibly not used
            case FunctionExpression:
                return this.visitFunction(expression as FunctionExpression, param);
            case ParameterExpression:
                return this.visitParameter(expression as any, param);
        }
        return expression;
    }
    protected visitParameter<T>(expression: ParameterExpression<T>, param: IQueryVisitParameter) {
        return this.parameters.get(expression.name);
    }
    protected visitFunction<T, TR>(expression: FunctionExpression<T, TR>, param: IQueryVisitParameter) {
        return this.visit(expression.body, param);
    }
    protected visitMember<TType, KProp extends keyof TType>(expression: MemberAccessExpression<TType, KProp>, param: IQueryVisitParameter): IExpression {
        const res = expression.objectOperand = this.visit(expression.objectOperand, param);
        if (expression.memberName === "prototype" || expression.memberName === "__proto__")
            throw new Error(`property ${expression.memberName} not supported in linq to sql.`);

        switch (res.type) {
            case String:
                switch (expression.memberName) {
                    case "length":
                        return expression;
                }
                break;
            case Function:
                switch (expression.memberName) {
                    case "arguments":
                    case "caller":
                    case "length":
                    case "name":
                    case "prototype":
                        break;
                }
                break;
        }
        if ((res instanceof ValueExpression)) {
            switch (res.value) {
                case Number:
                    switch (expression.memberName) {
                        case "MAX_VALUE":
                        case "MIN_VALUE":
                        case "NEGATIVE_INFINITY":
                        case "NaN":
                        case "POSITIVE_INFINITY":
                        case "constructor":
                        case "prototype":
                            break;
                    }
                    break;
            }
        }
        if (res instanceof SelectExpression && expression.memberName === "length") {
            return this.visit(new MethodCallExpression(res, "count", []), param);
        }

        const parentEntity = res as IEntityExpression;
        const relationMeta: IRelationMetaData<any, any> = Reflect.getOwnMetadata(relationMetaKey, res.type, expression.memberName as string);
        if (relationMeta) {
            switch (param.type) {
                case "select":
                case "selectMany":
                    {
                        const targetType = relationMeta instanceof MasterRelationMetaData ? relationMeta.slaveType! : relationMeta.masterType!;
                        if (relationMeta.relationType === RelationType.OneToMany && param.type === "select") {
                            param.parent.columns = param.parent.entity.primaryColumns.slice();
                            let joinEntity: JoinEntityExpression<any>;
                            if (parentEntity.parent && parentEntity.parent.masterEntity === parentEntity) {
                                joinEntity = parentEntity.parent;
                            }
                            else {
                                joinEntity = new JoinEntityExpression(parentEntity);
                                param.parent.entity = joinEntity;
                            }
                            const child = joinEntity.addRelation(relationMeta, this.newAlias()) as ProjectionEntityExpression;
                            return child.select;
                        }
                        else {
                            const entity = new EntityExpression(targetType, this.newAlias());
                            if (param.parent.where || param.parent.orders.length > 0) {
                                const joinEntity = new JoinEntityExpression(entity);
                                joinEntity.addRelation(relationMeta, param.parent.entity);
                                param.parent.entity = joinEntity;
                                param.parent.columns = joinEntity.columns.slice();
                            }
                            else {
                                param.parent = new SelectExpression(entity);
                            }
                            return entity;
                        }
                    }
                default:
                    {
                        let joinEntity: JoinEntityExpression<any>;
                        if (parentEntity.parent && parentEntity.parent.masterEntity === parentEntity) {
                            joinEntity = parentEntity.parent;
                        }
                        else {
                            const parent = parentEntity.parent;
                            joinEntity = new JoinEntityExpression(parentEntity);
                            if (parent) {
                                parent.changeEntity(parentEntity, joinEntity);
                            }
                            else {
                                param.parent.entity = joinEntity;
                            }
                        }

                        const child = (joinEntity as JoinEntityExpression<any>).addRelation(relationMeta, this.newAlias());
                        if (param.type === "include")
                            Array.prototype.push.apply(param.parent.columns, child.columns);
                        return child instanceof ProjectionEntityExpression ? child.select : child;
                    }
            }
        }
        if (parentEntity) {
            const column = parentEntity.columns.first((c) => c.property === expression.memberName);
            if (column)
                return column;
        }
        throw new Error(`property ${expression.memberName} not supported in linq to sql.`);
    }
    protected visitMethod<TType, KProp extends keyof TType, TResult = any>(expression: MethodCallExpression<TType, KProp, TResult>, param: IQueryVisitParameter): IExpression {
        const objectOperand = expression.objectOperand = this.visit(expression.objectOperand, param);
        if (objectOperand instanceof SelectExpression) {
            let selectOperand = objectOperand as SelectExpression;
            switch (expression.methodName) {
                case "select":
                case "selectMany":
                    {
                        const selectorFn = expression.params[0] as FunctionExpression<TType, TResult>;
                        const visitParam: IQueryVisitParameter = { parent: selectOperand, type: expression.methodName };
                        this.parameters.add(selectorFn.params[0].name, selectOperand.getVisitParam());
                        const selectExp = this.visit(selectorFn, visitParam);
                        this.parameters.remove(selectorFn.params[0].name);

                        if (expression.methodName === "select") {
                            if (selectExp instanceof SelectExpression) {
                                selectOperand = visitParam.parent;
                            }
                            else if ((selectExp as EntityExpression).primaryColumns) {
                                selectOperand = visitParam.parent;
                            }
                            else if (selectExp instanceof ObjectValueExpression) {
                                selectOperand.columns = Object.keys(selectExp.object).select(
                                    (o) => new ComputedColumnExpression(selectOperand.entity, selectExp.object[o], o)
                                ).toArray();
                                const objEntity = new ProjectionEntityExpression(selectOperand, this.newAlias());
                                selectOperand = new SelectExpression(objEntity);
                            }
                            else if ((selectExp as IColumnExpression).entity) {
                                const column = selectExp as IColumnExpression;
                                column.alias = ""; // set alias as empty string to mark that this entity next type will be this column type
                                selectOperand = visitParam.parent;
                                selectOperand.columns = [column];
                                selectOperand = new SelectExpression(new ColumnEntityExpression(selectOperand, this.newAlias()));
                            }
                        }
                        else {
                            if (!(selectExp instanceof SelectExpression)) {
                                throw new Error(`Queryable<${objectOperand.type}>.selectMany required selector with array or queryable or enumerable return value.`);
                            }
                            selectOperand = selectExp;
                        }
                        if (objectOperand.parent) {
                            objectOperand.parent.select = selectOperand;
                        }
                        else {
                            param.parent = selectOperand;
                        }

                        return selectOperand;
                    }
                case "where":
                    {
                        const predicateFn = expression.params[0] as FunctionExpression<TType, boolean>;
                        const visitParam: IQueryVisitParameter = { parent: objectOperand, type: "where" };
                        this.parameters.add(predicateFn.params[0].name, objectOperand.getVisitParam());
                        const whereExp = this.visit(predicateFn, visitParam) as IExpression<boolean>;
                        this.parameters.remove(predicateFn.params[0].name);
                        if (whereExp.type !== Boolean) {
                            throw new Error(`Queryable<${objectOperand.type}>.where required predicate with boolean return value.`);
                        }
                        objectOperand.addWhere(whereExp);
                        return objectOperand;
                    }
                case "orderBy":
                    {
                        const selectorFn = expression.params[0] as FunctionExpression<TType, any>;
                        const direction = expression.params[1] as ValueExpression<OrderDirection>;
                        const visitParam: IQueryVisitParameter = { parent: objectOperand, type: expression.methodName };
                        this.parameters.add(selectorFn.params[0].name, objectOperand.getVisitParam());
                        const selectExp = this.visit(selectorFn, visitParam);
                        this.parameters.remove(selectorFn.params[0].name);

                        if (!isValueType(selectExp.type)) {
                            throw new Error(`Queryable<${objectOperand.type}>.orderBy required select with basic type return value.`);
                        }

                        objectOperand.addOrder(selectExp, direction.execute());
                        return objectOperand;
                    }
                case "groupBy":
                    {
                        // TODO: queryable end with group by.
                        const selectorFn = expression.params[0] as FunctionExpression<TType, any>;
                        const visitParam: IQueryVisitParameter = { parent: selectOperand, type: expression.methodName };
                        this.parameters.add(selectorFn.params[0].name, selectOperand.getVisitParam());
                        const selectExp = this.visit(selectorFn, visitParam);
                        this.parameters.remove(selectorFn.params[0].name);

                        if (selectExp instanceof SelectExpression) {
                            throw new Error(`Queryable<${objectOperand.type}>.groupBy did not support selector with array or queryable or enumerable return value.`);
                        }

                        let groups: IColumnExpression[] = [];
                        if (selectExp instanceof ObjectValueExpression) {
                            groups = Object.keys(selectExp.object).select(
                                (o) => new ComputedColumnExpression(selectOperand.entity, selectExp.object[o], o)
                            ).toArray();
                        }
                        else if ((selectExp as IColumnExpression).entity) {
                            const column = selectExp as IColumnExpression;
                            column.alias = ""; // set alias as empty string to mark that this entity next type will be this column type
                            groups = [column];
                        }
                        selectOperand = new GroupByExpression(selectOperand, groups);
                        if (objectOperand.parent) {
                            objectOperand.parent.select = selectOperand;
                        }
                        else {
                            param.parent = selectOperand;
                        }
                        return selectOperand;
                    }
                case "skip":
                case "take":
                    {
                        const takeExp = expression.params[0] as ValueExpression<number>;
                        objectOperand.paging[expression.methodName] = takeExp.execute();
                        return objectOperand;
                    }
                case "distinct":
                    {
                        if (expression.params.length > 0) {
                            // groupBy select first
                            const selectorFn = expression.params[0] as FunctionExpression<TType, any>;
                            let visitParam: IQueryVisitParameter = { parent: objectOperand, type: expression.methodName };
                            const groupExp = this.visit(new MethodCallExpression(objectOperand, "groupBy" as any, [selectorFn]), visitParam) as GroupByExpression;

                            const paramExp = new ParameterExpression("og", groupExp.getVisitParam().type);
                            const selectFirstFn = new FunctionExpression(new MethodCallExpression(paramExp, "first", []), [paramExp]);
                            visitParam = { parent: groupExp, type: expression.methodName };
                            const groupFirstExp = this.visit(new MethodCallExpression(objectOperand, "select" as any, [selectFirstFn]), visitParam) as SelectExpression;
                            if (objectOperand.parent) {
                                objectOperand.parent.select = groupFirstExp;
                            }
                            else {
                                param.parent = groupFirstExp;
                            }
                            return groupFirstExp;
                        }
                        else {
                            objectOperand.distinct = true;
                            return objectOperand;
                        }
                    }
                case "include":
                    {
                        for (const paramFn of expression.params) {
                            const selectorFn = paramFn as FunctionExpression<TType, TResult>;
                            this.parameters.add(selectorFn.params[0].name, objectOperand.getVisitParam());
                            const visitParam: IQueryVisitParameter = { parent: objectOperand, type: expression.methodName };
                            const selectExpression = this.visit(selectorFn, visitParam);
                            this.parameters.remove(selectorFn.params[0].name);

                            // TODO: place this on member access instead
                            if (selectExpression instanceof ComputedColumnExpression) {
                                objectOperand.columns.add(selectExpression);
                            }
                        }
                        return objectOperand;
                    }
                case "toArray":
                    {
                        return objectOperand;
                    }
                case "count":
                    {
                        const column = new ComputedColumnExpression(objectOperand.entity, new MethodCallExpression(objectOperand, "count" as any, [new ValueExpression("*")], Number), this.newAlias("column"));
                        if (param.parent === selectOperand) {
                            // must be call from Queryable.count()
                            selectOperand.columns = [column];
                            return column;
                        }
                        else {
                            // within function expression
                            const relation = selectOperand.parent!.parent!.getChildRelation(selectOperand.parent!);
                            const groupExp = new GroupByExpression(selectOperand, relation.relationMaps.select((o) => o.childColumn).toArray());
                            groupExp.columns = groupExp.groupBy.slice();
                            groupExp.columns.add(column);
                            objectOperand.parent!.select = groupExp;
                        }

                        return column;
                    }
                case "sum":
                case "avg":
                case "max":
                case "min":
                    {
                        if (expression.params.length > 0) {
                            let visitParam: IQueryVisitParameter = { parent: objectOperand, type: expression.methodName };
                            const columnExp = this.visit(new MethodCallExpression(projectionEntity.select.entity, "select", [expression.params[0]]), { parent: projectionEntity.select, type: "where" }) as ColumnExpression;
                            methodExp.params = [columnExp];
                        }
                        else {
                            if (projectionEntity.select.columns.length !== 1) {
                                throw new Error(`only one column should exist for ${expression.methodName} without parameter`);
                            }
                            methodExp.params = [projectionEntity.select.columns[0]];
                        }
                        const methodExp = new MethodCallExpression(objectOperand, expression.methodName as any, [], Number);
                        const column = new ComputedColumnExpression(objectOperand.entity, methodExp, this.newAlias("column"));

                        // if current parentEntity did not have parent, then it must be call from queryable
                        if (param.parent === selectOperand) {
                            // must be call from Queryable.count()
                            selectOperand.columns = [column];
                            return column;
                        }
                        if (parentEntity.parent) {
                            let projectionEntity: ProjectionEntityExpression;
                            if (!(parentEntity instanceof ProjectionEntityExpression)) {
                                const selectExp = new SelectExpression(parentEntity);
                                projectionEntity = new ProjectionEntityExpression(selectExp, this.newAlias());

                                parentEntity.parent!.changeEntity(parentEntity, projectionEntity);
                                parentEntity = projectionEntity;
                            }
                            else {
                                projectionEntity = parentEntity;
                            }

                            if (expression.params.length > 0) {
                                const columnExp = this.visit(new MethodCallExpression(projectionEntity.select.entity, "select", [expression.params[0]]), { parent: projectionEntity.select, type: "where" }) as ColumnExpression;
                                methodExp.params = [columnExp];
                            }
                            else {
                                if (projectionEntity.select.columns.length !== 1) {
                                    throw new Error(`only one column should exist for ${expression.methodName} without parameter`);
                                }
                                methodExp.params = [projectionEntity.select.columns[0]];
                            }

                            if (!(projectionEntity.select instanceof GroupByExpression)) {
                                projectionEntity.select = new GroupByExpression(projectionEntity.select);
                            }

                            column.entity = projectionEntity;
                            const groupExp = projectionEntity.select as GroupByExpression<any, any>;
                            // soure: expression
                            const relation = projectionEntity.parent!.getChildRelation(projectionEntity);
                            groupExp.groupBy = relation.relationMaps.select((o) => o.childColumn).toArray();
                            groupExp.columns = groupExp.groupBy.slice();
                            groupExp.columns.add(column);
                        }
                        else {
                            if (expression.params.length > 0) {
                                const columnExp = this.visit(new MethodCallExpression(parentEntity, "select", [expression.params[0]]), { parent: param.parent, type: "where" }) as ColumnExpression;
                                methodExp.params = [columnExp];
                            }
                            else {
                                if (param.parent.columns.length !== 1) {
                                    throw new Error(`only one column should exist for ${expression.methodName} without parameter`);
                                }
                                methodExp.params = [param.parent.columns[0]];
                            }

                            param.parent.columns = [column];
                        }
                        return column;
                    }
            }
        }
        // if ((expression.objectOperand as IEntityExpression).columns) {
        //     let parentEntity = expression.objectOperand as IEntityExpression;
        //     const param1: IQueryVisitParameter = { parent: param.parent, type: param.type === expression.methodName ? param.type : undefined };
        //     if (parentEntity instanceof SelectExpression) {
        //         param1.parent = parentEntity;
        //         parentEntity = parentEntity.entity;
        //     }
        //     else if (parentEntity.parent && parentEntity.parent.masterEntity !== parentEntity) {
        //         let projectionEntity: ProjectionEntityExpression;
        //         if (parentEntity.constructor === ProjectionEntityExpression)
        //             projectionEntity = parentEntity as ProjectionEntityExpression;
        //         else {
        //             projectionEntity = new ProjectionEntityExpression(new SelectExpression(parentEntity), this.newAlias(), parentEntity.type);
        //             if (parentEntity.parent) {
        //                 parentEntity.parent.changeEntity(parentEntity, projectionEntity);
        //             }
        //         }
        //         param1.parent = projectionEntity.select;
        //         parentEntity = projectionEntity;
        //     }
        //     switch (expression.methodName) {
        //         case "first":
        //             {
        //                 switch (param.type) {
        //                     case "select":
        //                     case "selectMany":
        //                         {
        //                             const group = new GroupByExpression(param1.parent);
        //                             if (param1.parent.entity instanceof JoinEntityExpression) {
        //                                 group.groupBy = param1.parent.entity.relations.selectMany((o) => o.relationMaps.select((c) => c.parentColumn)).distinct().toArray();
        //                                 let addExpression: IExpression | undefined;
        //                                 for (const pcol of param1.parent.entity.primaryColumns) {
        //                                     if (addExpression) {
        //                                         addExpression = new AdditionExpression(addExpression, pcol);
        //                                     }
        //                                     else {
        //                                         addExpression = pcol;
        //                                     }
        //                                 }

        //                                 group.columns.push(new ComputedColumnExpression(param1.parent.entity, new SqlFunctionCallExpression(String, "MIN", [addExpression!]), this.newAlias("column")));
        //                                 const entity = new EntityExpression(parentEntity.type, this.newAlias());
        //                                 let addExpression2: IExpression | undefined;
        //                                 for (const pcol of entity.primaryColumns) {
        //                                     if (addExpression2) {
        //                                         addExpression2 = new AdditionExpression(addExpression2, pcol);
        //                                     }
        //                                     else {
        //                                         addExpression2 = pcol;
        //                                     }
        //                                 }
        //                                 const selectExp = new SelectExpression(entity);
        //                                 selectExp.where = MethodCallExpression.Create<any, "contains", boolean>(group, [addExpression2!], "contains");
        //                                 param.parent = selectExp;
        //                                 parentEntity = entity;
        //                             }
        //                             else {
        //                                 throw new Error("first in select/selectMany must used again JoinEntityExpression");
        //                             }
        //                             return parentEntity;
        //                         }
        //                     default:
        //                         {
        //                             if (expression.params.length > 0) {
        //                                 if (param1.type) param1.type = "where";
        //                                 parentEntity = this.visit(new MethodCallExpression(parentEntity, "where", [expression.params[0]]), param1) as ProjectionEntityExpression;
        //                                 param.parent = param1.parent;
        //                             }
        //                             param.parent.paging.take = 1;
        //                             return parentEntity;
        //                         }
        //                 }
        //             }
        //         case "sum":
        //         case "avg":
        //         case "max":
        //         case "min":
        //             {
        //                 const methodExp = new MethodCallExpression(parentEntity, expression.methodName, [], Number);
        //                 const column = new ComputedColumnExpression(parentEntity, methodExp, this.newAlias("column"));

        //                 // if current parentEntity did not have parent, then it must be call from queryable
        //                 if (parentEntity.parent) {
        //                     let projectionEntity: ProjectionEntityExpression;
        //                     if (!(parentEntity instanceof ProjectionEntityExpression)) {
        //                         const selectExp = new SelectExpression(parentEntity);
        //                         projectionEntity = new ProjectionEntityExpression(selectExp, this.newAlias());

        //                         parentEntity.parent!.changeEntity(parentEntity, projectionEntity);
        //                         parentEntity = projectionEntity;
        //                     }
        //                     else {
        //                         projectionEntity = parentEntity;
        //                     }

        //                     if (expression.params.length > 0) {
        //                         const columnExp = this.visit(new MethodCallExpression(projectionEntity.select.entity, "select", [expression.params[0]]), { parent: projectionEntity.select, type: "where" }) as ColumnExpression;
        //                         methodExp.params = [columnExp];
        //                     }
        //                     else {
        //                         if (projectionEntity.select.columns.length !== 1) {
        //                             throw new Error(`only one column should exist for ${expression.methodName} without parameter`);
        //                         }
        //                         methodExp.params = [projectionEntity.select.columns[0]];
        //                     }

        //                     if (!(projectionEntity.select instanceof GroupByExpression)) {
        //                         projectionEntity.select = new GroupByExpression(projectionEntity.select);
        //                     }

        //                     column.entity = projectionEntity;
        //                     const groupExp = projectionEntity.select as GroupByExpression<any, any>;
        //                     // soure: expression
        //                     const relation = projectionEntity.parent!.getChildRelation(projectionEntity);
        //                     groupExp.groupBy = relation.relationMaps.select((o) => o.childColumn).toArray();
        //                     groupExp.columns = groupExp.groupBy.slice();
        //                     groupExp.columns.add(column);
        //                 }
        //                 else {
        //                     if (expression.params.length > 0) {
        //                         const columnExp = this.visit(new MethodCallExpression(parentEntity, "select", [expression.params[0]]), { parent: param.parent, type: "where" }) as ColumnExpression;
        //                         methodExp.params = [columnExp];
        //                     }
        //                     else {
        //                         if (param.parent.columns.length !== 1) {
        //                             throw new Error(`only one column should exist for ${expression.methodName} without parameter`);
        //                         }
        //                         methodExp.params = [param.parent.columns[0]];
        //                     }

        //                     param.parent.columns = [column];
        //                 }
        //                 return column;
        //             }
        //         case "all":
        //         case "any":
        //             {
        //                 const isAny = expression.methodName === "any";
        //                 // if current parentEntity did not have parent, then it must be call from queryable
        //                 if (parentEntity.parent) {
        //                     let projectionEntity: ProjectionEntityExpression;
        //                     if (!(parentEntity instanceof ProjectionEntityExpression)) {
        //                         const selectExp = new SelectExpression(parentEntity);
        //                         projectionEntity = new ProjectionEntityExpression(selectExp, this.newAlias());

        //                         parentEntity.parent!.changeEntity(parentEntity, projectionEntity);
        //                         parentEntity = projectionEntity;
        //                     }
        //                     else {
        //                         projectionEntity = parentEntity;
        //                     }

        //                     if (expression.params.length > 0) {
        //                         this.visit(new MethodCallExpression(projectionEntity.select.entity, "where", [expression.params[0]]), { parent: projectionEntity.select, type: "where" });
        //                     }

        //                     const relation = projectionEntity.parent!.getChildRelation(projectionEntity);
        //                     projectionEntity.select.columns = relation.relationMaps.select((o) => o.childColumn).toArray();
        //                     const column = new ComputedColumnExpression(projectionEntity.select.entity, new ValueExpression(isAny), this.newAlias("column"));
        //                     projectionEntity.select.add(column);
        //                     projectionEntity.select.distinct = true;
        //                     if (!isAny) {
        //                         projectionEntity.select.where = new NotExpression(projectionEntity.select.where);
        //                     }

        //                     return new ComputedColumnExpression(projectionEntity, new (isAny ? EqualExpression : NotEqualExpression)(projectionEntity.columns.first((o) => o.property === column.alias), new ValueExpression(isAny)));
        //                 }
        //             }
        //         case "contains":
        //             {
        //                 if (!param.type) {
        //                     return expression;
        //                 }
        //                 else {
        //                     const entityMeta: IEntityMetaData<TType, any> = Reflect.getOwnMetadata(entityMetaKey, expression.params[0].type);
        //                     if (entityMeta) {
        //                         param1.type = "where";
        //                         for (const pk of entityMeta.primaryKeys) {
        //                             const primaryColumn = parentEntity.columns.first((c) => c.property === pk);
        //                             if (!primaryColumn)
        //                                 throw new Error(`primaryColumn not exist`);
        //                             this.visit(new MethodCallExpression(parentEntity, "where", [new EqualExpression(primaryColumn, new MemberAccessExpression(expression.params[0], pk))]), param1);
        //                         }
        //                         return new ComputedColumnExpression(parentEntity, new MethodCallExpression(parentEntity, "any", []), this.newAlias("column"));
        //                     }
        //                     else if (param1.parent.columns.length === 1) {
        //                         const wexp = new EqualExpression(param.parent.columns[0], expression.params[0]);
        //                         param1.parent.where = param1.parent.where ? new AndExpression(param1.parent.where, wexp) : wexp;
        //                         return parentEntity;
        //                     }

        //                     throw new Error(`${expression.methodName} only support entity`);
        //                 }
        //             }
        //         case "innerJoin":
        //         case "leftJoin":
        //         case "rightJoin":
        //         case "fullJoin":
        //             {
        //                 if (param1.type) param1.type = "select";
        //                 const childSelect = this.visit(expression.params[0], param) as SelectExpression;
        //                 let childEntity = this.visit(childSelect.entity, param) as IEntityExpression;
        //                 const param2: IQueryVisitParameter = { parent: new SelectExpression(childEntity), type: (param1.type) ? "select" : undefined };
        //                 if (childEntity.parent && childEntity.parent.masterEntity !== childEntity) {
        //                     let projectionEntity: ProjectionEntityExpression;
        //                     if (childEntity.constructor === ProjectionEntityExpression)
        //                         projectionEntity = childEntity as ProjectionEntityExpression;
        //                     else {
        //                         projectionEntity = new ProjectionEntityExpression(new SelectExpression(childEntity), this.newAlias(), childEntity.type);
        //                         if (childEntity.parent) {
        //                             childEntity.parent.changeEntity(childEntity, projectionEntity);
        //                         }
        //                     }
        //                     param2.parent = projectionEntity.select;
        //                     childEntity = projectionEntity;
        //                 }

        //                 const parentKeySelector = expression.params[1] as FunctionExpression;
        //                 this.parameters.add(parentKeySelector.params[0].name, this.resolveThisArgument(param1.parent, parentEntity));
        //                 const parentKey = this.visit(parentKeySelector, param1) as IColumnExpression;
        //                 this.parameters.remove(parentKeySelector.params[0].name);

        //                 const childKeySelector = expression.params[2] as FunctionExpression;
        //                 this.parameters.add(childKeySelector.params[0].name, this.resolveThisArgument(param2.parent, childEntity));
        //                 const childKey = this.visit(childKeySelector, param2) as IColumnExpression;
        //                 this.parameters.remove(childKeySelector.params[0].name);

        //                 let isPassWhere = false;
        //                 if (param1.parent.columns.any((o) => o instanceof ComputedColumnExpression)) {
        //                     parentEntity = new ProjectionEntityExpression(param1.parent, this.newAlias());
        //                 }
        //                 else {
        //                     // parentEntity =  param1.parent.entity;
        //                     if (param1.parent.where)
        //                         isPassWhere = true;
        //                 }

        //                 const joinEntity = new JoinEntityExpression(parentEntity);
        //                 const selectExp = new SelectExpression(joinEntity);
        //                 const relationMap: Array<IJoinRelationMap<any, any>> = [];
        //                 relationMap.push({
        //                     childColumn: childKey,
        //                     parentColumn: parentKey
        //                 });
        //                 if (isPassWhere) {
        //                     selectExp.addWhere(param1.parent.where);
        //                 }

        //                 isPassWhere = false;
        //                 if (param2.parent.columns.any((o) => o instanceof ComputedColumnExpression)) {
        //                     childEntity = new ProjectionEntityExpression(param2.parent, this.newAlias());
        //                 }
        //                 else {
        //                     // childEntity = parent2Expression.entity;
        //                     if (param2.parent.where)
        //                         isPassWhere = true;
        //                 }
        //                 let jointType: JoinType;
        //                 switch (expression.methodName) {
        //                     case "innerJoin":
        //                         jointType = JoinType.INNER;
        //                         break;
        //                     case "leftJoin":
        //                         jointType = JoinType.LEFT;
        //                         break;
        //                     case "rightJoin":
        //                         jointType = JoinType.RIGHT;
        //                         break;
        //                     case "fullJoin":
        //                         jointType = JoinType.FULL;
        //                         break;
        //                 }
        //                 joinEntity.addRelation(relationMap, childEntity, jointType!);
        //                 if (isPassWhere) {
        //                     selectExp.addWhere(param2.parent.where);
        //                 }

        //                 const param3: IQueryVisitParameter = { parent: selectExp, type: (param1.type) ? "select" : undefined };
        //                 const resultSelector = expression.params[3] as FunctionExpression;
        //                 this.parameters.add(resultSelector.params[1].name, this.resolveThisArgument(param2.parent, childEntity));
        //                 const entityExp = this.visit(new MethodCallExpression(param3.parent.entity, "select", [resultSelector]), param3);
        //                 this.parameters.remove(resultSelector.params[1].name);
        //                 param.parent = param3.parent;
        //                 return entityExp;
        //             }
        //         case "union":
        //             {
        //                 const select2 = expression.params[0] as SelectExpression;
        //                 const param2 = { parent: select2 };
        //                 this.visit(select2, param as any);

        //                 const isUnionAll = expression.params.length <= 1 ? false : expression.params[1].execute();
        //                 const unionEntity = new UnionExpression(param.parent, param2.parent, this.newAlias(), isUnionAll);
        //                 param.parent = new SelectExpression(unionEntity);
        //                 return unionEntity;
        //             }
        //         case "intersect":
        //             {
        //                 const select2 = expression.params[0] as SelectExpression;
        //                 const param2 = { parent: select2 };
        //                 this.visit(select2, param as any);

        //                 const resEntity = new IntersectExpression(param.parent, param2.parent, this.newAlias());
        //                 param.parent = new SelectExpression(resEntity);
        //                 return resEntity;
        //             }
        //         case "except":
        //             {
        //                 const select2 = expression.params[0] as SelectExpression;
        //                 const param2 = { parent: select2 };
        //                 this.visit(select2, param as any);

        //                 const resEntity = new ExceptExpression(param.parent, param2.parent, this.newAlias());
        //                 param.parent = new SelectExpression(resEntity);
        //                 return resEntity;
        //             }
        //         case "pivot":
        //             {
        //                 const dimensions = expression.params[0] as ObjectValueExpression<any>;
        //                 const metrics = expression.params[1] as ObjectValueExpression<any>;
        //                 const groups: any[] = [];
        //                 // tslint:disable-next-line:forin
        //                 for (const dimensionKey in dimensions.object) {
        //                     this.parameters.add(dimensions.object[dimensionKey].params[0].name, parentEntity);
        //                     const selectExpression = this.visit(dimensions.object[dimensionKey], param1);
        //                     this.parameters.remove(dimensions.object[dimensionKey].params[0].name);
        //                     groups.add(new ComputedColumnExpression(parentEntity, selectExpression, dimensionKey, dimensionKey));
        //                 }
        //                 const groupByExpression = new GroupByExpression<any, any>(param1.parent);
        //                 groupByExpression.groupBy = groups;
        //                 groupByExpression.columns = groups.slice();
        //                 // tslint:disable-next-line:forin
        //                 for (const key in metrics.object) {
        //                     this.parameters.add(metrics.object[key].params[0].name, parentEntity);
        //                     const selectExpression = this.visit(metrics.object[key], param1) as ComputedColumnExpression;
        //                     this.parameters.remove(metrics.object[key].params[0].name);
        //                     selectExpression.alias = selectExpression.property = key;
        //                     groupByExpression.columns.add(selectExpression);
        //                 }
        //                 param.parent = groupByExpression;
        //                 return groupByExpression;
        //             }
        //         // case "last":
        //         // {
        //         //     let projectionEntity: ProjectionEntityExpression;
        //         //     if (parentEntity instanceof ProjectionEntityExpression)
        //         //         projectionEntity = parentEntity;
        //         //     else {
        //         //         projectionEntity = new ProjectionEntityExpression(new SelectExpression(parentEntity), this.newAlias(), parentEntity.type);
        //         //         param.parent.replaceEntity(parentEntity, projectionEntity);
        //         //     }
        //         //     if (projectionEntity.select.orders.length > 0) {
        //         //         for (const order of projectionEntity.select.orders) {
        //         //             order.direction = order.direction === "ASC" ? "DESC" : "ASC";
        //         //         }
        //         //     }
        //         //     // TODO: reverse default order.

        //         //     return this.visit(new MethodCallExpression(projectionEntity, "first", expression.params), param);
        //         // }
        //         default:
        //             throw new Error(`${expression.methodName} not supported on expression`);
        //     }
        // }
        // else {
        //     if (expression.objectOperand instanceof ValueExpression) {
        //         if (expression.objectOperand.value === Math) {
        //             switch (expression.methodName) {
        //                 case "max":
        //                 case "min":
        //                     {
        //                         const entity = this.visit(expression.params[0], param) as IEntityExpression;
        //                         return new ComputedColumnExpression(entity, new MethodCallExpression(entity, expression.methodName, []), this.newAlias("column"));
        //                     }
        //             }
        //         }
        //     }
        //     expression.params = expression.params.select((o) => this.visit(o, param)).toArray();
        // }

        return expression;
    }
    protected resolveThisArgument<TT>(select: SelectExpression<TT>, entity: IEntityExpression<TT>) {
        return select.columns.length === 1 && select.columns[0].alias === "" ? select.columns[0] : entity;
    }
    protected visitFunctionCall<T>(expression: FunctionCallExpression<T>, param: IQueryVisitParameter): IExpression {
        expression.params = expression.params.select((o) => this.visit(o, param)).toArray();
        return expression;
    }
    protected visitBinaryOperator(expression: IBinaryOperatorExpression, param: IQueryVisitParameter): IExpression {
        expression.leftOperand = this.visit(expression.leftOperand, param);
        expression.rightOperand = this.visit(expression.rightOperand, param);
        return expression;
    }
    protected visitUnaryOperator(expression: IUnaryOperatorExpression, param: IQueryVisitParameter): IExpression {
        expression.operand = this.visit(expression.operand, param);
        return expression;
    }
    protected visitTernaryOperator(expression: TernaryExpression<any>, param: IQueryVisitParameter): IExpression {
        expression.logicalOperand = this.visit(expression.logicalOperand, param);
        expression.trueResultOperand = this.visit(expression.trueResultOperand, param);
        expression.falseResultOperand = this.visit(expression.falseResultOperand, param);
        return expression;
    }
    protected visitObjectLiteral<T extends { [Key: string]: IExpression } = any>(expression: ObjectValueExpression<T>, param: IQueryVisitParameter) {
        // tslint:disable-next-line:forin
        for (const prop in expression.object) {
            expression.object[prop] = this.visit(expression.object[prop], param);
        }
        return expression;
    }
}
