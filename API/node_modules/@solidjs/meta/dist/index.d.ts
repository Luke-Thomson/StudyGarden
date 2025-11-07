import { Component, JSX, ParentComponent } from "solid-js";
export declare const MetaContext: import("solid-js").Context<MetaContextType | undefined>;
interface TagDescription {
    tag: string;
    props: Record<string, unknown>;
    setting?: {
        close?: boolean;
        escape?: boolean;
    };
    id: string;
    name?: string;
    ref?: Element;
}
export interface MetaContextType {
    addTag: (tag: TagDescription) => number;
    removeTag: (tag: TagDescription, index: number) => void;
}
export declare const MetaProvider: ParentComponent;
export declare function useHead(tagDesc: TagDescription): void;
export declare const Title: Component<JSX.HTMLAttributes<HTMLTitleElement>>;
export declare const Style: Component<JSX.StyleHTMLAttributes<HTMLStyleElement>>;
export declare const Meta: Component<JSX.MetaHTMLAttributes<HTMLMetaElement>>;
export declare const Link: Component<JSX.LinkHTMLAttributes<HTMLLinkElement>>;
export declare const Base: Component<JSX.BaseHTMLAttributes<HTMLBaseElement>>;
export declare const Stylesheet: Component<Omit<JSX.LinkHTMLAttributes<HTMLLinkElement>, "rel">>;
export {};
