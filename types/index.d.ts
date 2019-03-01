export interface Sticky {
    refresh(): void
    remove(): void
}

type SingleOrMany<T> = T | Iterable<T> | NodeListOf<T>

export function addOne(element: SingleOrMany<Element>): Sticky
export function add(elements: SingleOrMany<Element>): Sticky[]

export function refreshAll(): void

export function removeOne(element: SingleOrMany<Element>): void
export function remove(elements: SingleOrMany<Element>): void
export function removeAll(): void

export const stickies: Sticky[]
