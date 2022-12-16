interface element {
    observedAttributes?: string[];
    onattributechanged?: Function;
    onconnected?: Function;
    ondisconnected?: Function;
    oninit?: Function;
    render: Function;
    style?: Function;
    [x: string]: any;
}

declare module "heresy" {
    export function define(elementName: string, element: element): void;
    export function ref(): boolean;
}
