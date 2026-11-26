/** 平面清單 → 樹;以及帶層級的攤平(供樹狀表格/下拉縮排) */
export interface TreeNode<T> {
  data: T
  children: TreeNode<T>[]
}

export function buildTree<T>(
  list: T[],
  getId: (t: T) => number,
  getParentId: (t: T) => number,
  rootId = 0,
): TreeNode<T>[] {
  const build = (pid: number): TreeNode<T>[] =>
    list.filter((t) => getParentId(t) === pid).map((t) => ({ data: t, children: build(getId(t)) }))
  return build(rootId)
}

export function flattenTree<T>(nodes: TreeNode<T>[], level = 0): { data: T; level: number }[] {
  const out: { data: T; level: number }[] = []
  for (const n of nodes) {
    out.push({ data: n.data, level })
    out.push(...flattenTree(n.children, level + 1))
  }
  return out
}

export interface FlatRow<T> {
  data: T
  level: number
  prefix: string // 樹狀前綴,如 "│ ├ "(照 prototype 表格樣式)
}

/** 攤平並產生 │ ├ └ 樹狀前綴 */
export function flattenTreeWithPrefix<T>(nodes: TreeNode<T>[], ancestors: boolean[] = []): FlatRow<T>[] {
  const out: FlatRow<T>[] = []
  nodes.forEach((n, i) => {
    const isLast = i === nodes.length - 1
    const level = ancestors.length
    const prefix =
      level === 0
        ? ''
        : ancestors.slice(1).map((last) => (last ? '　 ' : '│ ')).join('') + (isLast ? '└ ' : '├ ')
    out.push({ data: n.data, level, prefix })
    out.push(...flattenTreeWithPrefix(n.children, [...ancestors, isLast]))
  })
  return out
}

/** 依條件修剪樹:節點符合或有符合的子孫才保留 */
export function pruneTree<T>(nodes: TreeNode<T>[], pred: (t: T) => boolean): TreeNode<T>[] {
  const out: TreeNode<T>[] = []
  for (const n of nodes) {
    const kids = pruneTree(n.children, pred)
    if (pred(n.data) || kids.length) out.push({ data: n.data, children: kids })
  }
  return out
}
