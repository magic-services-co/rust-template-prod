declare module '*.json' {
    const value: any;
    export default value;
}

declare namespace JSX {
    interface IntrinsicElements {
        'rustalyzer-widget': React.DetailedHTMLProps<
            React.HTMLAttributes<HTMLElement> & { 'server-id'?: string },
            HTMLElement
        >;
    }
}
