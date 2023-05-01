// TODO: return immutable values with structuredClone() if it is readonly.
export class JsonManager {
    private _data: JsonElement;
    public get data(): JsonElement {
        return this._data;
    }
    public set data(value: JsonElement) {
        if (this.readonly) throw new EditReadonlyError();
        this._data = value;
    }
    readonly readonly: boolean;
    readonly route: (string | number)[];

    constructor(data: JsonElement, readonly = false, route: (string | number)[] = []) {
        this._data = data;
        this.readonly = readonly;
        this.route = route;
    }

    set(key: string | number, value: JsonElement): this {
        if (this.readonly) throw new EditReadonlyError();
        this.get(key).setHere(value);
        return this;
    }

    add(value: JsonElement): this {
        if (this.readonly) throw new EditReadonlyError();
        if (!Array.isArray(this.getValue())) this.setHere([]);

        (this.getValue() as JsonElement[]).push(value);

        return this;
    }

    getValue(key?: string | number | undefined): JsonElement | undefined {
        if (key === undefined) {
            if (this.route.length === 0) return this.data;

            const parent = this.getObjectByRoute(this.route.slice(0, -1));
            if (parent === null || parent === undefined) return undefined;

            const lastRouteKey = this.route.slice(-1)[0];

            if (Array.isArray(parent)) {
                if (typeof lastRouteKey !== "number") return undefined;
                return parent[lastRouteKey as number];
            } else {
                if (typeof lastRouteKey !== "string") return undefined;
                return (parent as { [s: string]: JsonElement })[lastRouteKey as string];
            }
        } else {
            const currentObject = this.getObjectByRoute(this.route);
            if (currentObject === null || currentObject === undefined) return undefined;

            if (Array.isArray(currentObject)) {
                if (typeof key !== "number") return undefined;
                return currentObject[key as number];
            } else {
                if (typeof key !== "string") return undefined;
                return (currentObject as { [s: string]: JsonElement })[key as string];
            }
        }
    }

    getAs<T extends JsonElement | undefined>(key?: string | number | undefined): T {
        return this.getValue(key) as T;
    }

    get(...keys: (string | number)[]): PathResolver {
        const newRoute = [...this.route, ...keys];
        return new PathResolver(this, newRoute);
    }

    has(...keys: (string | number)[]): boolean {
        const newRoute = [...this.route, ...keys];
        let obj = this.data;
        for (let i = 0; i < newRoute.length; i++) {
            if (obj === null || typeof obj !== "object") return false;

            if (Array.isArray(obj)) {
                if (typeof keys[i] !== "number") return false;
                obj = obj[keys[i] as number];
            } else {
                if (typeof keys[i] !== "string") return false;
                obj = (obj as { [s: string]: JsonElement })[keys[i] as string];
            }

            if (obj === undefined) {
                return false;
            }
        }
        return true;
    }

    exists(): boolean {
        return this.has(...this.route);
    }

    resetPath(): this {
        this.route.splice(0, this.route.length);
        return this;
    }

    private setHere(value: JsonElement) {
        if (this.readonly) throw new EditReadonlyError();
        if (this.route.length === 0) {
            this.data = value;
            return;
        }

        this.createPath(this.route);
        const parent = this.getObjectByRoute(this.route.slice(0, -1));

        const lastRouteKey = this.route.slice(-1)[0];

        if (Array.isArray(parent)) {
            parent[lastRouteKey as number] = value;
        } else {
            (parent as { [s: string]: JsonElement })[lastRouteKey as string] = value;
        }
    }

    /**
     * @param route
     * @returns Returns null if it is not an object and undefined if it does not exist.
     */
    private getObjectByRoute(route: (string | number)[]): object | null | undefined {
        if (this.data === null || typeof this.data !== "object") return undefined;
        let obj: JsonElement = this.data;
        for (let i = 0; i < route.length; i++) {
            if (typeof obj !== "object" || obj === null) return undefined;
            if (Array.isArray(obj)) {
                if (typeof route[i] !== "number") return undefined;
                obj = obj[route[i] as number];
            } else {
                if (typeof route[i] !== "string") return undefined;
                obj = (obj as { [s: string]: JsonElement })[route[i] as string];
            }
            if (obj === undefined) return undefined;
        }
        if (typeof obj !== "object" || obj === null) return null;
        return obj;
    }

    /**
     * @param route
     * @param arrayAtLastPath Whether to create the last path as array. If null provided, this doesn't create any object at the last path.
     * @returns Whether there have been any changes.
     */
    private createPath(route: (string | number)[], arrayAtLastPath: boolean | null = null) {
        if (this.readonly) throw new EditReadonlyError();
        let isChanged = false;
        function changed() {
            isChanged = true;
        }

        this.data = this._createPath(this.data, arrayAtLastPath, changed, [...route]);

        return isChanged;
    }

    private _createPath(data: JsonElement, arrayAtLastPath: boolean | null, changed: () => void, remainingRoute: (string | number)[] = []): JsonElement {
        if (this.readonly) throw new EditReadonlyError();
        const key = remainingRoute.shift();
        const isArrayKey = typeof key === "number";
        const isObjectKey = !isArrayKey && key !== undefined;
        if (typeof data !== "object" || data === null || data === undefined || (isArrayKey && !Array.isArray(data)) || (isObjectKey && Array.isArray(data))) {
            // probably need fix
            if (isArrayKey || (key === undefined && arrayAtLastPath === true)) {
                const array: JsonElement[] = [];
                if (key !== undefined) array[key] = this._createPath(null, arrayAtLastPath, changed, remainingRoute);
                changed();
                return array;
            } else if (isObjectKey || (key === undefined && arrayAtLastPath === false)) {
                const obj: { [s: string]: JsonElement } = {};
                if (key !== undefined) obj[key] = this._createPath(null, arrayAtLastPath, changed, remainingRoute);
                changed();
                return obj;
            } else if (data === undefined) {
                // key === undefined && arrayAtLastPath === null && data === undefined
                changed();
                return null;
            } else {
                // key === undefined && arrayAtLastPath === null && data !== undefined
                // fix not needed
                return data;
            }
        } else if (key === undefined) {
            // fix not needed
            return data;
        } else {
            // fix not needed

            // Needless if statement but to avoid type errors.
            if (Array.isArray(data)) {

                (data as JsonElement[])[key as number] = this._createPath((data as JsonElement[])[key as number], arrayAtLastPath, changed, remainingRoute);
            } else {
                (data as { [s: string]: JsonElement })[key as string] = this._createPath((data as { [s: string]: JsonElement })[key as string], arrayAtLastPath, changed, remainingRoute);
            }
            return data as { [s: string]: JsonElement } | JsonElement[];
        }
    }
}

export class PathResolver extends JsonManager {
    readonly manager: JsonManager;

    constructor(manager: JsonManager, route: (string | number)[]) {
        super(manager.data, manager.readonly, route);

        this.manager = manager;
    }

    public override get data(): JsonElement {
        return this.manager.data;
    }
    public override set data(value: JsonElement) {
        this.manager.data = value;
    }

    override get(...keys: (string | number)[]): PathResolver {
        const newRoute = [...this.route, ...keys];
        return new PathResolver(this.manager, newRoute);
    }

}

export class EditReadonlyError extends Error { }

export type JsonElement = number | boolean | string | JsonObject | JsonArray | null;
type _JsonObject<T extends JsonElement> = { [s: string]: T };
type _JsonArray<T extends JsonElement> = T[];

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface JsonObject<T extends JsonElement = JsonElement> extends _JsonObject<T> { }
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface JsonArray<T extends JsonElement = JsonElement> extends _JsonArray<T> { }

export function isJsonElement(value: unknown): value is JsonElement {
    const type = typeof value;
    if (type === "number" || type === "boolean" || type === "string" || value === null) return true;
    if (type !== "object" || value === undefined) return false;

    if (Array.isArray(value)) {
        return value.every(e => isJsonElement(e));
    } else {
        return Object.values(value).every(v => isJsonElement(v));
    }
}

export function isJsonObject(value: unknown): value is JsonObject {
    const type = typeof value;
    if (type !== "object" || value === null || value === undefined) return false;

    if (Array.isArray(value)) return false;

    return Object.values(value).every(v => isJsonElement(v));
}

export function isJsonArray(value: unknown): value is JsonArray {
    const type = typeof value;
    if (type !== "object" || value === null || value === undefined) return false;

    if (!Array.isArray(value)) return false;

    return value.every(e => isJsonElement(e));
}
