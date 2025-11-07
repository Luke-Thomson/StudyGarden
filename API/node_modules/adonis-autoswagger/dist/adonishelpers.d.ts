export declare function serializeV6Middleware(mw: any): string[];
export declare function serializeV6Handler(handler: any): Promise<any>;
export declare function parseBindingReference(binding: string | [any | any, any]): Promise<{
    moduleNameOrPath: string;
    method: string;
}>;
