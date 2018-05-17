export interface Sticky {
    refresh(): void
    remove(): void
}

type SingleOrMany<T> = T | Iterable<T>

export function addOne(element: SingleOrMany<HTMLElement>): Sticky
export function add(elements: SingleOrMany<HTMLElement>): Sticky[]

export function refreshAll(): void

export function removeOne(element: SingleOrMany<HTMLElement>): void
export function remove(elements: SingleOrMany<HTMLElement>): void
export function removeAll(): void

export const stickies: Sticky[]
