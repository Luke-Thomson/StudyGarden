import { createContext, createRenderEffect, createUniqueId, onCleanup, sharedConfig, useContext } from "solid-js";
import { isServer, spread, escape, useAssets, ssr } from "solid-js/web";
export const MetaContext = createContext();
const cascadingTags = ["title", "meta"];
// https://html.spec.whatwg.org/multipage/semantics.html#the-title-element
const titleTagProperties = [];
const metaTagProperties = 
// https://html.spec.whatwg.org/multipage/semantics.html#the-meta-element
["name", "http-equiv", "content", "charset", "media"]
    // additional properties
    .concat(["property"]);
const getTagKey = (tag, properties) => {
    // pick allowed properties and sort them
    const tagProps = Object.fromEntries(Object.entries(tag.props)
        .filter(([k]) => properties.includes(k))
        .sort());
    // treat `property` as `name` for meta tags
    if (Object.hasOwn(tagProps, "name") || Object.hasOwn(tagProps, "property")) {
        tagProps.name = tagProps.name || tagProps.property;
        delete tagProps.property;
    }
    // concat tag name and properties as unique key for this tag
    return tag.tag + JSON.stringify(tagProps);
};
function initClientProvider() {
    if (!sharedConfig.context) {
        const ssrTags = document.head.querySelectorAll(`[data-sm]`);
        // `forEach` on `NodeList` is not supported in Googlebot, so use a workaround
        Array.prototype.forEach.call(ssrTags, (ssrTag) => ssrTag.parentNode.removeChild(ssrTag));
    }
    const cascadedTagInstances = new Map();
    // TODO: use one element for all tags of the same type, just swap out
    // where the props get applied
    function getElement(tag) {
        if (tag.ref) {
            return tag.ref;
        }
        let el = document.querySelector(`[data-sm="${tag.id}"]`);
        if (el) {
            if (el.tagName.toLowerCase() !== tag.tag) {
                if (el.parentNode) {
                    // remove the old tag
                    el.parentNode.removeChild(el);
                }
                // add the new tag
                el = document.createElement(tag.tag);
            }
            // use the old tag
            el.removeAttribute("data-sm");
        }
        else {
            // create a new tag
            el = document.createElement(tag.tag);
        }
        return el;
    }
    return {
        addTag(tag) {
            if (cascadingTags.indexOf(tag.tag) !== -1) {
                const properties = tag.tag === "title" ? titleTagProperties : metaTagProperties;
                const tagKey = getTagKey(tag, properties);
                //  only cascading tags need to be kept as singletons
                if (!cascadedTagInstances.has(tagKey)) {
                    cascadedTagInstances.set(tagKey, []);
                }
                let instances = cascadedTagInstances.get(tagKey);
                let index = instances.length;
                instances = [...instances, tag];
                // track indices synchronously
                cascadedTagInstances.set(tagKey, instances);
                let element = getElement(tag);
                tag.ref = element;
                spread(element, tag.props);
                let lastVisited = null;
                for (var i = index - 1; i >= 0; i--) {
                    if (instances[i] != null) {
                        lastVisited = instances[i];
                        break;
                    }
                }
                if (element.parentNode != document.head) {
                    document.head.appendChild(element);
                }
                if (lastVisited && lastVisited.ref && lastVisited.ref.parentNode) {
                    document.head.removeChild(lastVisited.ref);
                }
                return index;
            }
            let element = getElement(tag);
            tag.ref = element;
            spread(element, tag.props);
            if (element.parentNode != document.head) {
                document.head.appendChild(element);
            }
            return -1;
        },
        removeTag(tag, index) {
            const properties = tag.tag === "title" ? titleTagProperties : metaTagProperties;
            const tagKey = getTagKey(tag, properties);
            if (tag.ref) {
                const t = cascadedTagInstances.get(tagKey);
                if (t) {
                    if (tag.ref.parentNode) {
                        tag.ref.parentNode.removeChild(tag.ref);
                        for (let i = index - 1; i >= 0; i--) {
                            if (t[i] != null) {
                                document.head.appendChild(t[i].ref);
                            }
                        }
                    }
                    t[index] = null;
                    cascadedTagInstances.set(tagKey, t);
                }
                else {
                    if (tag.ref.parentNode) {
                        tag.ref.parentNode.removeChild(tag.ref);
                    }
                }
            }
        }
    };
}
function initServerProvider() {
    const tags = [];
    useAssets(() => ssr(renderTags(tags)));
    return {
        addTag(tagDesc) {
            // tweak only cascading tags
            if (cascadingTags.indexOf(tagDesc.tag) !== -1) {
                const properties = tagDesc.tag === "title" ? titleTagProperties : metaTagProperties;
                const tagDescKey = getTagKey(tagDesc, properties);
                const index = tags.findIndex(prev => prev.tag === tagDesc.tag && getTagKey(prev, properties) === tagDescKey);
                if (index !== -1) {
                    tags.splice(index, 1);
                }
            }
            tags.push(tagDesc);
            return tags.length;
        },
        removeTag(tag, index) { }
    };
}
export const MetaProvider = props => {
    const actions = !isServer
        ? initClientProvider()
        : initServerProvider();
    return <MetaContext.Provider value={actions}>{props.children}</MetaContext.Provider>;
};
const MetaTag = (tag, props, setting) => {
    useHead({
        tag,
        props,
        setting,
        id: createUniqueId(),
        get name() {
            return props.name || props.property;
        }
    });
    return null;
};
export function useHead(tagDesc) {
    const c = useContext(MetaContext);
    if (!c)
        throw new Error("<MetaProvider /> should be in the tree");
    createRenderEffect(() => {
        const index = c.addTag(tagDesc);
        onCleanup(() => c.removeTag(tagDesc, index));
    });
}
function renderTags(tags) {
    return tags
        .map(tag => {
        const keys = Object.keys(tag.props);
        const props = keys
            .map(k => k === "children"
            ? ""
            : ` ${k}="${
            // @ts-expect-error
            escape(tag.props[k], true)}"`)
            .join("");
        let children = tag.props.children;
        if (Array.isArray(children)) {
            // in JavaScript, strings are concatenated with comma which is not what we want
            // we should join them manually instead
            children = children.join("");
        }
        if (tag.setting?.close) {
            return `<${tag.tag} data-sm="${tag.id}"${props}>${
            // @ts-expect-error
            tag.setting?.escape ? escape(children) : children || ""}</${tag.tag}>`;
        }
        return `<${tag.tag} data-sm="${tag.id}"${props}/>`;
    })
        .join("");
}
export const Title = props => MetaTag("title", props, { escape: true, close: true });
export const Style = props => MetaTag("style", props, { close: true });
export const Meta = props => MetaTag("meta", props);
export const Link = props => MetaTag("link", props);
export const Base = props => MetaTag("base", props);
export const Stylesheet = props => <Link rel="stylesheet" {...props}/>;
