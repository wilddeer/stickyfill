declare namespace Stickyfill {
    function add(el: HTMLElement)
    function remove(el: HTMLElement)
    function rebuild()
    function pause()
    function stop()
    function kill()
    function init()

    let stickies: Array<any>;
}

interface JQuery {
  Stickyfill()
}

declare module "Stickyfill" {
  export = Stickyfill
}
