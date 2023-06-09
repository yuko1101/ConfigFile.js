import { JsonArray, JsonElement, JsonObject, isJsonArray, isJsonObject } from "./json_utils";

// TODO: return immutable values with structuredClone() if it is readonly.
export class JsonManager {
    private _data: JsonElement;
    public get data(): JsonElement {
        return this._data;
    }
    public set data(value: JsonElement) {
        if (this.readonly) throw new EditReadonlyError();
        this._data = value;
        if (this.fastMode) this._currentData = this.getValue(undefined, true);
    }
    readonly readonly: boolean;
    readonly fastMode: boolean;
    readonly route: (string | number)[];

    protected _currentData: JsonElement | undefined;

    constructor(data: JsonElement, readonly = false, fastMode = false, route: (string | number)[] = []) {
        this._data = data;
        this.readonly = readonly;
        this.fastMode = fastMode;
        this.route = route;
        this._currentData = this.route.length === 0 ? this._data : undefined;
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

    getValue(key?: string | number | undefined, disableFastMode = false): JsonElement | undefined {
        if (key === undefined) {
            if (this.fastMode && !disableFastMode) return this._currentData;
            if (this.route.length === 0) {
                return this.data;
            }

            const parent = this.getObjectByRoute(this.route.slice(0, -1));
            if (parent === null || parent === undefined) return undefined;

            const lastRouteKey = this.route.slice(-1)[0];

            if (Array.isArray(parent)) {
                if (typeof lastRouteKey !== "number") return undefined;
                return parent[lastRouteKey];
            } else {
                if (typeof lastRouteKey !== "string") return undefined;
                return parent[lastRouteKey];
            }
        } else {
            const currentObject = this.fastMode && !disableFastMode ? this._currentData : this.getObjectByRoute(this.route);
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

    getAsNumber(key?: string | number | undefined): number {
        const value = this.getValue(key);
        if (typeof value !== "number") throw new InvalidTypeError(value);
        return value;
    }

    getAsString(key?: string | number | undefined): string {
        const value = this.getValue(key);
        if (typeof value !== "string") throw new InvalidTypeError(value);
        return value;
    }

    getAsBoolean(key?: string | number | undefined): boolean {
        const value = this.getValue(key);
        if (typeof value !== "boolean") throw new InvalidTypeError(value);
        return value;
    }

    getAsJsonObject(key?: string | number | undefined): JsonObject {
        const value = this.getValue(key);
        if (!isJsonObject(value)) throw new InvalidTypeError(value);
        return value;
    }

    getAsJsonArray(key?: string | number | undefined): JsonArray {
        const value = this.getValue(key);
        if (!isJsonArray(value)) throw new InvalidTypeError(value);
        return value;
    }

    getAsNullableNumber(key?: string | number | undefined): number | null {
        const value = this.getValue(key);
        if (typeof value !== "number" && value !== null) throw new InvalidTypeError(value);
        return value;
    }

    getAsNullableString(key?: string | number | undefined): string | null {
        const value = this.getValue(key);
        if (typeof value !== "string" && value !== null) throw new InvalidTypeError(value);
        return value;
    }

    getAsNullableBoolean(key?: string | number | undefined): boolean | null {
        const value = this.getValue(key);
        if (typeof value !== "boolean" && value !== null) throw new InvalidTypeError(value);
        return value;
    }

    getAsNullableJsonObject(key?: string | number | undefined): JsonObject | null {
        const value = this.getValue(key);
        if (!isJsonObject(value) && value !== null) throw new InvalidTypeError(value);
        return value;
    }

    getAsNullableJsonArray(key?: string | number | undefined): JsonArray | null {
        const value = this.getValue(key);
        if (!isJsonArray(value) && value !== null) throw new InvalidTypeError(value);
        return value;
    }

    get(...keys: (string | number)[]): PathResolver {
        const newRoute = [...this.route, ...keys];
        let currentData: JsonElement | undefined = undefined;
        if (this.fastMode) {
            currentData = this._currentData;
            const keyCount = keys.length;
            for (let i = 0; i < keyCount; i++) {
                const key = keys[i];
                if (Array.isArray(currentData)) {
                    currentData = currentData[key as number];
                } else {
                    currentData = (currentData as JsonObject)[key as string];
                }
            }
        }
        return new PathResolver(this, newRoute, currentData);
    }

    map<T>(callback: (entry: PathResolver) => T): T[] {
        const dataHere = this.getAs<JsonObject | JsonArray>();
        const isArray = Array.isArray(dataHere);
        const keys: number[] | string[] = isArray ? dataHere.map((_, i) => i) : Object.keys(dataHere);
        const pathResolvers: PathResolver[] = keys.map(key => new PathResolver(this, [...this.route, key], this.fastMode ? (isArray ? dataHere[key as number] : dataHere[key as string]) : undefined));
        return pathResolvers.map(callback);
    }

    find(predicate: (entry: PathResolver) => boolean): PathResolver | undefined {
        const dataHere = this.getAs<JsonObject | JsonArray>();
        const isArray = Array.isArray(dataHere);
        const keys: number[] | string[] = isArray ? dataHere.map((_, i) => i) : Object.keys(dataHere);
        const pathResolvers: PathResolver[] = keys.map(key => new PathResolver(this, [...this.route, key], this.fastMode ? (isArray ? dataHere[key as number] : dataHere[key as string]) : undefined));
        const found = pathResolvers.find(predicate);
        return found;
    }

    filter(predicate: (entry: PathResolver) => boolean): PathResolver[] {
        const dataHere = this.getAs<JsonObject | JsonArray>();
        const isArray = Array.isArray(dataHere);
        const keys: number[] | string[] = isArray ? dataHere.map((_, i) => i) : Object.keys(dataHere);
        const pathResolvers: PathResolver[] = keys.map(key => new PathResolver(this, [...this.route, key], this.fastMode ? (isArray ? dataHere[key as number] : dataHere[key as string]) : undefined));
        const filtered = pathResolvers.filter(predicate);
        return filtered;
    }

    forEach(callback: (entry: PathResolver) => void) {
        const dataHere = this.getAs<JsonObject | JsonArray>();
        const isArray = Array.isArray(dataHere);
        const keys: number[] | string[] = isArray ? dataHere.map((_, i) => i) : Object.keys(dataHere);
        const pathResolvers: PathResolver[] = keys.map(key => new PathResolver(this, [...this.route, key], this.fastMode ? (isArray ? dataHere[key as number] : dataHere[key as string]) : undefined));
        const len = pathResolvers.length;
        for (let i = 0; i < len; i++) {
            callback(pathResolvers[i]);
        }
    }

    detach(): JsonManager {
        return new JsonManager((this.fastMode ? this._currentData : this.getValue()) as JsonElement, this.readonly, this.fastMode);
    }

    asObject(): this {
        const dataHere = this.getAs<JsonObject | JsonArray>();
        if (Array.isArray(dataHere)) throw new InvalidTypeError(dataHere);
        return this;
    }

    asArray(): this {
        const dataHere = this.getAs<JsonObject | JsonArray>();
        if (!Array.isArray(dataHere)) throw new InvalidTypeError(dataHere);
        return this;
    }

    has(...keys: (string | number)[]): boolean {
        let obj = this.getValue();
        for (let i = 0; i < keys.length; i++) {
            if (obj === null || typeof obj !== "object") return false;
            const key = keys[i];
            if (Array.isArray(obj)) {
                if (typeof key !== "number") return false;
                obj = obj[key];
            } else {
                if (typeof key !== "string") return false;
                obj = obj[key];
            }

            if (obj === undefined) {
                return false;
            }
        }
        return true;
    }

    exists(): boolean {
        return this.getValue() !== undefined;
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
        const parent = this.getObjectByRoute(this.route.slice(0, -1)) as JsonArray | JsonObject;

        const lastRouteKey = this.route.slice(-1)[0];

        if (Array.isArray(parent)) {
            parent[lastRouteKey as number] = value;
        } else {
            parent[lastRouteKey as string] = value;
        }
    }

    /**
     * @param route
     * @returns Returns null if it is not an object and undefined if it does not exist.
     */
    private getObjectByRoute(route: (string | number)[]): JsonObject | JsonArray | null | undefined {
        if (this.data === null || typeof this.data !== "object") return undefined;
        let obj: JsonElement = this.data;
        for (let i = 0; i < route.length; i++) {
            if (typeof obj !== "object" || obj === null) return undefined;
            const key = route[i];
            if (Array.isArray(obj)) {
                if (typeof key !== "number") return undefined;
                obj = obj[key];
            } else {
                if (typeof key !== "string") return undefined;
                obj = obj[key];
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
                const array: JsonArray = [];
                if (key !== undefined) array[key] = this._createPath(null, arrayAtLastPath, changed, remainingRoute);
                changed();
                return array;
            } else if (isObjectKey || (key === undefined && arrayAtLastPath === false)) {
                const obj: JsonObject = {};
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
                data[key as number] = this._createPath(data[key as number], arrayAtLastPath, changed, remainingRoute);
            } else {
                data[key as string] = this._createPath(data[key as string], arrayAtLastPath, changed, remainingRoute);
            }
            return data;
        }
    }
}

export class PathResolver extends JsonManager {
    readonly manager: JsonManager;

    constructor(manager: JsonManager, route: (string | number)[], currentData: JsonElement | undefined) {
        super(manager.data, manager.readonly, manager.fastMode, route);
        this._currentData = currentData;
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
        let currentData: JsonElement | undefined = undefined;
        if (this.fastMode) {
            currentData = this._currentData;
            const keyCount = keys.length;
            for (let i = 0; i < keyCount; i++) {
                const key = keys[i];
                if (Array.isArray(currentData)) {
                    currentData = currentData[key as number];
                } else {
                    currentData = (currentData as JsonObject)[key as string];
                }
            }
        }
        return new PathResolver(this.manager, newRoute, currentData);
    }

}

export class EditReadonlyError extends Error { }
export class InvalidTypeError extends Error {
    constructor(value: unknown) {
        super(`Unexpected value ${typeof value === "string" ? `"${value}"` : value} (type: ${typeof value}) detected.`);
    }
}