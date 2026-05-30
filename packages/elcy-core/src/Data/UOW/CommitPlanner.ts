import { IEnumerable, Enumerable } from "@elcy/enumerable";
import { IEntityMetaData, IRelationMetaData } from "../../MetaData/Interface";
import { CommitPlan } from "./CommitPlan";
import { EntityCommitPlan } from "./EntityCommitPlan";
import { UniqueConstraintMetaData } from "src/MetaData";

export class CommitPlanner {
    private entities: Set<IEntityMetaData>;
    private relationMap = new Map<IEntityMetaData, IRelationMetaData[]>();

    constructor(entities: IEnumerable<IEntityMetaData>) {
        this.entities = new Set(entities);

        for (const entity of this.entities) {
            this.relationMap.set(entity, Enumerable.from(entity.relations).filter(o => !o.isMaster && this.entities.has(o.target)).toArray());
        }
    }

    public build() {
        const sccs = this.findSCC();
        const breakEdges = this.selectBreakEdges(sccs);
        const dag = this.buildDAG(breakEdges);
        const order = this.topoSort(dag);

        const m = Enumerable.from(breakEdges).groupBy(o => o.source).toMap(o => o.key, o => new Set(o));
        const plans = order.map<EntityCommitPlan>(o => {
            const m1 = ({
                entityMeta: o,
                config: {
                    selfReferences: new Set(this.relationMap.get(o)?.filter(r => r.target === o && !r.isMaster && !r.nullable)),
                    uniqueColumns: Enumerable.from(o.constraints ?? []).ofType(UniqueConstraintMetaData).flatMap(o => o.columns).map(o => o.propertyName).toSet(),
                    relationBreaks: m.get(o) ?? new Set(),
                }
            });

            for (const sf of m1.config.selfReferences) {
                m1.config.relationBreaks.delete(sf);
            }

            return m1;
        });

        return new CommitPlan(plans);
    }

    // -----------------------------
    // 1. Tarjan SCC
    // -----------------------------
    private findSCC(): Set<IEntityMetaData>[] {
        let index = 0;
        const stack: IEntityMetaData[] = [];
        const indices = new Map<IEntityMetaData, number>();
        const lowlink = new Map<IEntityMetaData, number>();
        const onStack = new Set<IEntityMetaData>();
        const result: Set<IEntityMetaData>[] = [];

        const strongconnect = (v: IEntityMetaData) => {
            indices.set(v, index);
            lowlink.set(v, index);
            index++;

            stack.push(v);
            onStack.add(v);

            for (const e of this.relationMap.get(v) ?? []) {
                const w = e.target;

                if (!indices.has(w)) {
                    strongconnect(w);
                    lowlink.set(v, Math.min(lowlink.get(v)!, lowlink.get(w)!));
                } else if (onStack.has(w)) {
                    lowlink.set(v, Math.min(lowlink.get(v)!, indices.get(w)!));
                }
            }

            if (lowlink.get(v) === indices.get(v)) {
                const scc = new Set<IEntityMetaData>();
                let w: IEntityMetaData;

                do {
                    w = stack.pop()!;
                    onStack.delete(w);
                    scc.add(w);
                } while (w !== v);

                result.push(scc);
            }
        };

        for (const entity of this.entities) {
            if (indices.has(entity)) {
                continue;
            }

            strongconnect(entity);
        }

        return result;
    }

    // -----------------------------
    // 2. Break cycles (minimal-ish)
    // -----------------------------
    private selectBreakEdges(sccs: Set<IEntityMetaData>[]): Set<IRelationMetaData> {
        const breaks = new Set<IRelationMetaData>();

        for (const scc of sccs) {
            if (scc.size <= 0) {
                continue;
            }

            const internalEdges: IRelationMetaData[] = [];

            for (const n of scc) {
                for (const e of this.relationMap.get(n) ?? []) {
                    if (scc.has(e.target)) {
                        internalEdges.push(e);
                    }
                }
            }

            const selected = this.breakCyclesInSCC(scc, internalEdges);
            for (const e of selected) {
                breaks.add(e);
            }
        }

        return breaks;
    }

    private breakCyclesInSCC(nodes: Set<IEntityMetaData>, edges: IRelationMetaData[]): Set<IRelationMetaData> {
        const breaks = new Set<IRelationMetaData>();

        // Early exit for isolated nodes (Size 1 SCC with no self-referencing edges)
        if (edges.length === 0) return breaks;

        const incoming = new Map<IEntityMetaData, Set<IRelationMetaData>>();
        const outgoing = new Map<IEntityMetaData, Set<IRelationMetaData>>();

        for (const n of nodes) {
            incoming.set(n, new Set());
            outgoing.set(n, new Set());
        }

        for (const e of edges) {
            incoming.get(e.target)!.add(e);
            outgoing.get(e.source)!.add(e);
        }

        let remaining: IRelationMetaData[] = [...edges];

        // Remove edges until acyclic
        while (remaining.length > 0) {
            remaining.sort((a, b) => {
                if (a.nullable !== b.nullable) return a.nullable ? -1 : 1;
                return (
                    a.source.name.localeCompare(b.source.name) ||
                    a.target.name.localeCompare(b.target.name)
                );
            });

            const chosen = remaining.shift()!;
            breaks.add(chosen);

            if (!chosen.nullable) {
                console.warn(`Cycle broken on NON-NULLABLE relation: ${chosen.source.name} -> ${chosen.target.name}. DB execution may fail without deferred constraints.`);
            }

            // remove chosen edge from both sides of the graph
            incoming.get(chosen.target)!.delete(chosen);
            outgoing.get(chosen.source)!.delete(chosen);

            // re-run Kahn's pruning
            const queue: IEntityMetaData[] = [];
            for (const n of nodes) {
                if (incoming.get(n)!.size === 0) queue.push(n);
            }

            const visited = new Set<IEntityMetaData>();

            while (queue.length > 0) {
                const n = queue.pop()!;
                if (visited.has(n)) continue;
                visited.add(n);

                for (const e of outgoing.get(n) ?? []) {
                    incoming.get(e.target)!.delete(e);
                    // remove from outgoing so it isn't processed again
                    outgoing.get(n)!.delete(e);

                    if (incoming.get(e.target)!.size === 0) {
                        queue.push(e.target);
                    }
                }
            }

            // Rebuild remaining pool from un-pruned edges
            remaining = [];
            for (const [n, set] of outgoing) {
                if (!visited.has(n)) {
                    remaining.push(...set);
                }
            }
        }

        return breaks;
    }

    // -----------------------------
    // 3. Build DAG
    // -----------------------------
    private buildDAG(breaks: Set<IRelationMetaData>): Map<IEntityMetaData, IEntityMetaData[]> {
        const graph = new Map<IEntityMetaData, IEntityMetaData[]>();

        for (const n of this.entities) {
            graph.set(n, []);
        }

        for (const [from, list] of this.relationMap) {
            for (const e of list) {
                if (!breaks.has(e)) {
                    graph.get(from)!.push(e.target);
                }
            }
        }

        return graph;
    }

    // -----------------------------
    // 4. Topological sort
    // -----------------------------
    private topoSort(graph: Map<IEntityMetaData, IEntityMetaData[]>): IEntityMetaData[] {
        const visited = new Set<IEntityMetaData>();
        const result: IEntityMetaData[] = [];

        const dfs = (n: IEntityMetaData) => {
            if (visited.has(n)) return;
            visited.add(n);

            const next = [...(graph.get(n) ?? [])]
                .sort((a, b) => a.name.localeCompare(b.name)); // deterministic

            for (const m of next) {
                dfs(m);
            }

            result.push(n);
        };

        for (const n of [...this.entities].sort((a, b) => a.name.localeCompare(b.name)
        )) {
            dfs(n);
        }

        return result;
    }
}
