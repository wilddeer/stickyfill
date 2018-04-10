export interface Sticky {
    refresh(): void
    remove(): void
}

type SingleOrMany<T> = T | Iterable<T>

export function addOne(element: SingleOrMany<HTMLElement>): Sticky
export function add(elements: SingleOrMany<HTMLElement>): Sticky[]

export function refreshAll(): void

export function removeOne(element: SingleOrMany<HTMLElement>)
export function remove(elements: SingleOrMany<HTMLElement>)
export function removeAll()

export const stickies: Sticky[]
