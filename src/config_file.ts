import fs from "fs";
import { JsonArray, JsonElement, JsonManager, JsonObject, PathResolver } from "./json_utils";

interface IConfigFile extends JsonManager {
    readonly filePath: string | null;
    readonly defaultConfig: JsonElement;

    get(...keys: (string | number)[]): ConfigPathResolver;

    map<T>(callback: (entry: ConfigPathResolver) => T): T[]

    find(predicate: (entry: ConfigPathResolver) => boolean): ConfigPathResolver | undefined

    filter(predicate: (entry: ConfigPathResolver) => boolean): ConfigPathResolver[]

    forEach(callback: (entry: ConfigPathResolver) => void): void

    saveSync(compact: boolean): ConfigFile;

    loadSync(): ConfigFile;

    save(compact: boolean): Promise<ConfigFile>;

    load(): Promise<ConfigFile>;

    resetData(): ConfigFile;
}

export class ConfigFile extends JsonManager implements IConfigFile {
    readonly filePath: string | null;
    readonly defaultConfig: JsonElement;

    constructor(filePath: string | null, defaultConfig: JsonElement, readonly = false, fastMode = false, route: (string | number)[] = []) {
        super(JSON.parse(JSON.stringify(defaultConfig)), readonly, fastMode, route);
        this.filePath = filePath;
        this.defaultConfig = defaultConfig;
    }

    override get(...keys: (string | number)[]): ConfigPathResolver {
        const newRoute = [...this.route, ...keys];
        const currentData = (this.fastMode && this._currentData !== undefined) ? new JsonManager(this._currentData, true, false).get(...keys).getValue() : undefined;
        return new ConfigPathResolver(this, newRoute, currentData);
    }

    override map<T>(callback: (entry: ConfigPathResolver) => T): T[] {
        const dataHere = this.getAs<JsonObject | JsonArray>();
        const keys: number[] | string[] = Array.isArray(dataHere) ? dataHere.map((_, i) => i) : Object.keys(dataHere);
        const pathResolvers: ConfigPathResolver[] = keys.map(key => new ConfigPathResolver(this, [...this.route, key]));
        return pathResolvers.map(callback);
    }

    override find(predicate: (entry: ConfigPathResolver) => boolean): ConfigPathResolver | undefined {
        const dataHere = this.getAs<JsonObject | JsonArray>();
        const keys: number[] | string[] = Array.isArray(dataHere) ? dataHere.map((_, i) => i) : Object.keys(dataHere);
        const pathResolvers: ConfigPathResolver[] = keys.map(key => new ConfigPathResolver(this, [...this.route, key]));
        const found = pathResolvers.find(predicate);
        return found;
    }

    override filter(predicate: (entry: ConfigPathResolver) => boolean): ConfigPathResolver[] {
        const dataHere = this.getAs<JsonObject | JsonArray>();
        const keys: number[] | string[] = Array.isArray(dataHere) ? dataHere.map((_, i) => i) : Object.keys(dataHere);
        const pathResolvers: ConfigPathResolver[] = keys.map(key => new ConfigPathResolver(this, [...this.route, key]));
        const filtered = pathResolvers.filter(predicate);
        return filtered;
    }

    override forEach(callback: (entry: ConfigPathResolver) => void) {
        const dataHere = this.getAs<JsonObject | JsonArray>();
        const keys: number[] | string[] = Array.isArray(dataHere) ? dataHere.map((_, i) => i) : Object.keys(dataHere);
        const pathResolvers: ConfigPathResolver[] = keys.map(key => new ConfigPathResolver(this, [...this.route, key]));
        const len = pathResolvers.length;
        for (let i = 0; i < len; i++) {
            callback(pathResolvers[i]);
        }
    }

    saveSync(compact = false): this {
        if (this.filePath === null) return this;
        const text = compact ? JSON.stringify(this.data) : JSON.stringify(this.data, null, 4);
        fs.writeFileSync(this.filePath, text);
        return this;
    }

    loadSync(): this {
        if (this.filePath === null) return this;
        if (!fs.existsSync(this.filePath)) {
            this.saveSync();
        }
        const text = fs.readFileSync(this.filePath, "utf-8");
        try {
            this.data = JSON.parse(text);
        } catch (e) {
            console.error(e);
        }
        return this;
    }

    async save(compact = false): Promise<this> {
        if (this.filePath === null) return this;
        const filePath: string = this.filePath;
        const text = compact ? JSON.stringify(this.data) : JSON.stringify(this.data, null, 4);
        await new Promise<void>((resolve, reject) => fs.writeFile(filePath, text, { encoding: "utf-8" }, (err) => {
            if (err) reject(err);
            resolve();
        }));
        return this;
    }

    async load(): Promise<this> {
        if (this.filePath === null) return this;
        const filePath: string = this.filePath;
        if (!fs.existsSync(filePath)) {
            await this.save();
        }
        const text = await new Promise<string>((resolve, reject) => fs.readFile(filePath, { encoding: "utf-8" }, (err, data) => {
            if (err) reject(err);
            resolve(data);
        }));
        try {
            this.data = JSON.parse(text);
        } catch (e) {
            console.error(e);
        }
        return this;
    }

    resetData(): this {
        this.data = JSON.parse(JSON.stringify(this.defaultConfig));
        return this;
    }
}

class ConfigPathResolver extends PathResolver implements IConfigFile {
    readonly configFile: ConfigFile;
    readonly filePath: string | null;
    readonly defaultConfig: JsonElement;

    constructor(configFile: ConfigFile, route: (string | number)[], currentData: JsonElement | undefined = undefined) {
        super(configFile, route, currentData);

        this.configFile = configFile;
        this.filePath = configFile.filePath;
        this.defaultConfig = configFile.defaultConfig;
    }

    override get(...keys: (string | number)[]): ConfigPathResolver {
        const newRoute = [...this.route, ...keys];
        const currentData = (this.fastMode && this._currentData !== undefined) ? new JsonManager(this._currentData, true, false).get(...keys).getValue() : undefined;
        return new ConfigPathResolver(this.configFile, newRoute, currentData);
    }

    override map<T>(callback: (entry: ConfigPathResolver) => T): T[] {
        const dataHere = this.getAs<JsonObject | JsonArray>();
        const keys: number[] | string[] = Array.isArray(dataHere) ? dataHere.map((_, i) => i) : Object.keys(dataHere);
        const pathResolvers: ConfigPathResolver[] = keys.map(key => new ConfigPathResolver(this.configFile, [...this.route, key]));
        return pathResolvers.map(callback);
    }

    override find(predicate: (entry: ConfigPathResolver) => boolean): ConfigPathResolver | undefined {
        const dataHere = this.getAs<JsonObject | JsonArray>();
        const keys: number[] | string[] = Array.isArray(dataHere) ? dataHere.map((_, i) => i) : Object.keys(dataHere);
        const pathResolvers: ConfigPathResolver[] = keys.map(key => new ConfigPathResolver(this.configFile, [...this.route, key]));
        const found = pathResolvers.find(predicate);
        return found;
    }

    override filter(predicate: (entry: ConfigPathResolver) => boolean): ConfigPathResolver[] {
        const dataHere = this.getAs<JsonObject | JsonArray>();
        const keys: number[] | string[] = Array.isArray(dataHere) ? dataHere.map((_, i) => i) : Object.keys(dataHere);
        const pathResolvers: ConfigPathResolver[] = keys.map(key => new ConfigPathResolver(this.configFile, [...this.route, key]));
        const filtered = pathResolvers.filter(predicate);
        return filtered;
    }

    override forEach(callback: (entry: ConfigPathResolver) => void) {
        const dataHere = this.getAs<JsonObject | JsonArray>();
        const keys: number[] | string[] = Array.isArray(dataHere) ? dataHere.map((_, i) => i) : Object.keys(dataHere);
        const pathResolvers: ConfigPathResolver[] = keys.map(key => new ConfigPathResolver(this.configFile, [...this.route, key]));
        const len = pathResolvers.length;
        for (let i = 0; i < len; i++) {
            callback(pathResolvers[i]);
        }
    }

    saveSync(compact = false): ConfigFile {
        return this.configFile.saveSync(compact);
    }

    loadSync(): ConfigFile {
        return this.configFile.loadSync();
    }

    async save(compact = false): Promise<ConfigFile> {
        return await this.configFile.save(compact);
    }

    async load(): Promise<ConfigFile> {
        return await this.configFile.load();
    }

    resetData(): ConfigFile {
        return this.configFile.resetData();
    }

}
