import { Injectable } from '@angular/core';
import { ListDataSource, LdsCacheModel, LdsConfig, LdsField, LdsInputModel, LdsViewState, defaultLdsConfig } from '@arp0d3v/lds-core';

export abstract class ListDataSourceProvider {
    private static readonly MAX_CACHE_SIZE = 50;
    private static readonly CACHE_EXPIRATION_HOURS = 168; // 7 days
    
    config: LdsConfig;
    dsCaches: LdsCacheModel[];
    private _cacheMap: Map<string, LdsCacheModel>;
    
    abstract httpGet(sourceUrl: string, queryString: string, body: any, callBack: (result: LdsInputModel) => any): void;
    abstract httpPost(sourceUrl: string, queryString: string, body: any, callBack: (result: LdsInputModel) => any): void;
    abstract navigate(filters: any): void;
    
    constructor(ldsConfig: Partial<LdsConfig>) {
        this.config = Object.assign({}, defaultLdsConfig);
        if (ldsConfig) {
            if (ldsConfig.saveState !== undefined) { this.config.saveState = ldsConfig.saveState; }
            if (ldsConfig.debugMode !== undefined) { this.config.debugMode = ldsConfig.debugMode; }
            this.copyConfig(this.config, ldsConfig);
        }
        this.dsCaches = [];
        this._cacheMap = new Map();
        this._loadDsCaches();
    }

    getLocalDataSource<T>(items?: T[], dataSourceId?: string, config?: LdsConfig): ListDataSource<T> {
        const cache = this._getCacheById(dataSourceId || '', location.pathname);
        const ds = this.createNewLocalDataSource<T>(dataSourceId, config, cache);
        this.configureLocalDataSource(ds);
        if (items && items.length > 0) {
            ds.setSourceItems(items);
        }
        return ds;
    }
    getRemoteDataSource<T>(url: string, dataSourceId?: string, config?: LdsConfig): ListDataSource<T> {
        const cache = this._getCacheById(dataSourceId || '', location.pathname);
        const ds = this.createNewRemoteDataSource<T>(url, dataSourceId, config, cache);
        this.configureRemoteDataSource(ds);
        return ds;
    }
    newLocalDataSource<T>(items: T[], dataSourceId?: string, config?: LdsConfig): ListDataSource<T> {
        const ds = this.createNewLocalDataSource<T>(dataSourceId, config);
        this.configureLocalDataSource(ds);
        ds.setSourceItems(items);
        return ds;
    }
    newRemoteDataSource<T>(url: string, dataSourceId?: string, config?: LdsConfig): ListDataSource<T> {
        const ds = this.createNewRemoteDataSource<T>(url, dataSourceId, config);
        this.configureRemoteDataSource(ds);
        return ds;
    }
    private createNewRemoteDataSource<T>(sourceUrl: string, dataSourceId?: string, config?: LdsConfig, cache?: LdsCacheModel): ListDataSource<T> {
        if (!dataSourceId) { dataSourceId = location.href; }
        let ldsConfig = Object.assign({}, this.config);
        if (config) {
            this.copyConfig(ldsConfig, config);
        }
        let ds = new ListDataSource<T>(dataSourceId, 'remote', ldsConfig, cache);
        ds.state.sourceUrl = sourceUrl;
        return ds;
    }
    private createNewLocalDataSource<T>(dataSourceId?: string, config?: LdsConfig, cache?: LdsCacheModel): ListDataSource<T> {
        if (!dataSourceId) { dataSourceId = location.href; }
        let ldsConfig = Object.assign({}, this.config);
        if (config) {
            this.copyConfig(ldsConfig, config);
        }
        let ds = new ListDataSource<T>(dataSourceId, 'local', ldsConfig, cache);
        return ds;
    }
    private configureRemoteDataSource(bds: ListDataSource<any>) {
        if (bds.isConfigured) { return; }
        const ds = bds as ListDataSource<any>;
        ds.onStateChanged.subscribe((e) => {
            if (ds.config.saveState) {
                let newCacheData = this._toDataSourceCache(ds);
                this._saveCacheToLocalStorage(newCacheData);
            }
            if (this.config.debugMode! >= 1) {
                console.log(`onStateChanged: ${e} ${new Date().toISOString()}`);
            }
            if (this.config.debugMode! >= 2) {
                console.log(ds.state);
            }
        });
        ds.onNavigateRequested.subscribe((e) => {
            if (this.config.debugMode! >= 1) {
                console.log(`onNavigateRequested: ${e} ${new Date().toISOString()}`);
            }
            let filters = ds.getFilters();
            this.navigate(filters);
        });
        ds.onSortChanged.subscribe((e) => {
            if (this.config.debugMode! >= 1) {
                console.log(`onSortChanged: ${e} ${new Date().toISOString()}`);
            }
            if (ds.config.useRouting === true) {
                let filters = ds.getFilters();
                this.navigate(filters);
            } else {
                this._getDataFromRemote(ds, 'onSortChanged');
            }
        });
        ds.onDataRequested.subscribe((e) => {
            if (this.config.debugMode! >= 1) {
                console.log(`onDataRequested: ${e} ${new Date().toISOString()}`);
            }
            this._getDataFromRemote(ds, 'onDataRequested');
        });
        bds.isConfigured = true;
    }
    private configureLocalDataSource(bds: ListDataSource<any>) {
        if (bds.isConfigured) { return; }
        const ds = bds as ListDataSource<any>;
        ds.onStateChanged.subscribe((e) => {
            if (ds.config.saveState) {
                let newCacheData = this._toDataSourceCache(ds);
                this._saveCacheToLocalStorage(newCacheData);
            }
            if (this.config.debugMode! >= 1) {
                console.log(`onStateChanged: ${e} ${new Date().toISOString()}`);
            }
            if (this.config.debugMode! >= 2) {
                console.log(ds.state);
            }
        });
        ds.onDataRequested.subscribe((e) => {
            if (this.config.debugMode! >= 1) {
                console.log(`onDataRequested: ${e} ${new Date().toISOString()}`);
            }
            this.sortItemsLocally(ds, ds.state.sort1Name);
            const items = this.getPageItemsLocally(ds);
            ds.setItems(items);
            ds.onStateChanged.emit('DataLoaded');
        });
        ds.onSortChanged.subscribe((fieldName) => {
            if (this.config.debugMode! >= 1) {
                console.log(`onSortChanged: ${fieldName} ${new Date().toISOString()}`);
            }
            this.sortItemsLocally(ds, fieldName);
        });

        bds.isConfigured = true;
    }
    private _getDataFromRemoteByGetMethod(ds: ListDataSource<any>) {
        const filters = this.createFiltersObject(ds);
        ds.onDataLoading.emit(filters);
        ds.state.queryString = this.toQueryStringEncoded(filters);
        ds.isLoading = true;
        this.httpGet(ds.state.sourceUrl!, ds.state.queryString!, filters, (result: LdsInputModel) => {
            ds.onDataLoaded.emit(result);
            ds.setData(result);
            ds.onStateChanged.emit('DataLoaded');
            ds.isLoading = false;
            if (result.error) {
                ds.clearState();
            }
        });
    }
    private _getDataFromRemoteByPostMethod(ds: ListDataSource<any>) {
        const filters = this.createFiltersObject(ds);
        ds.onDataLoading.emit(filters);
        ds.state.queryString = this.toQueryStringEncoded(filters);
        ds.isLoading = true;
        this.httpPost(ds.state.sourceUrl!, ds.state.queryString!, filters, (result: LdsInputModel) => {
            ds.onDataLoaded.emit(result);
            ds.setData(result);
            ds.onStateChanged.emit('DataLoaded');
            ds.isLoading = false;
            if (result.error) {
                ds.clearState();
            }
        });
    }
    private _getDataFromRemote(ds: ListDataSource<any>, eventName: string) {
        if (this.config.debugMode! >= 1) {
            console.log(`_getDataFromRemote: ${eventName} ${new Date().toISOString()}`);
        }
        if (ds.config.http.method == 'GET') {
            this._getDataFromRemoteByGetMethod(ds);
        } else {
            this._getDataFromRemoteByPostMethod(ds);
        }
    }
    private createFiltersObject(ds: ListDataSource<any>): any {
        let filters: any = ds.getFilters();
        return filters;
    }
    private _toDataSourceCache(ds: ListDataSource<any>): LdsCacheModel {
        const cache = new LdsCacheModel();
        cache.date = new Date().toISOString();
        cache.id = ds.id;
        cache.pathName = location.pathname;
        cache.type = ds.type;
        cache.state = ds.state;
        cache.filters = ds.filters;
        cache.fieldList = ds.fieldList.map(e => {
            return { name: e.name, visible: e.visible };
        });
        return cache;
    }
    private _saveCacheToLocalStorage(newCache: LdsCacheModel) {
        try {
            const cacheKey = this._getCacheKey(newCache.id, newCache.pathName);
            const cacheItem = this._cacheMap.get(cacheKey);
            
            if (cacheItem) {
                // Update existing cache
                cacheItem.date = newCache.date;
                cacheItem.filters = newCache.filters;
                cacheItem.state = newCache.state;
                cacheItem.type = newCache.type;
                cacheItem.fieldList = newCache.fieldList;
            } else {
                // Add new cache with size limit
                if (this.dsCaches.length >= ListDataSourceProvider.MAX_CACHE_SIZE) {
                    this._cleanOldCaches();
                }
                this.dsCaches.push(newCache);
                this._cacheMap.set(cacheKey, newCache);
            }
            
            const jsonString = JSON.stringify(this.dsCaches);
            const saved = this._safeStorageSet('datasources', jsonString);
            
            if (!saved) {
                // If save failed, try cleanup and retry once
                this._cleanOldCaches();
                const retryJson = JSON.stringify(this.dsCaches);
                this._safeStorageSet('datasources', retryJson);
            }
        } catch (error) {
            console.error('Failed to save datasource cache:', error);
        }
    }
    private _loadDsCaches() {
        try {
            const jsonString = this._safeStorageGet('datasources');
            if (!jsonString) { return; }
            
            const parsed = JSON.parse(jsonString);
            
            if (Array.isArray(parsed)) {
                // Filter out invalid and expired caches
                this.dsCaches = parsed.filter(cache => 
                    cache.id && 
                    cache.pathName && 
                    cache.state &&
                    this._isCacheValid(cache)
                );
                
                // Build Map for fast O(1) lookups
                this._rebuildCacheMap();
            }
        } catch (error) {
            console.error('Failed to load datasource caches, resetting:', error);
            this.dsCaches = [];
            this._cacheMap.clear();
            this.clearStorage();
        }
    }
    private toQueryStringEncoded(obj: any): string {
        if (!obj) { return ''; }
        var queryString = Object.keys(obj).map((key) => {
            if (obj[key] !== null && obj[key] !== undefined && obj[key] !== '') {
                return key + '=' + encodeURIComponent(obj[key]);
            }
            return '';
        }).filter(x => x != '').join('&');
        return queryString;
    }
    private getPageItemsLocally(ds: ListDataSource<any>): any[] {
        const state = ds.state;
        const pag = state.pagination;
        
        if (pag.pageSize <= 0 || pag.pageSize >= state.totalItemCount) {
            return ds.sourceItems;
        }
        const overfolwCount = (pag.startItemIndex + pag.pageSize) - state.totalItemCount;
        if (overfolwCount > 1) {
            pag.startItemIndex -= overfolwCount;
            if (pag.pageIndex > 0) {
                pag.pageIndex -= Math.ceil(overfolwCount / pag.pageSize);
            }
        }
        if (pag.startItemIndex < 0) {
            pag.startItemIndex = 0;
            pag.pageIndex = 0;
        }
        pag.endItemIndex = pag.startItemIndex + pag.pageSize;

        let i = pag.startItemIndex;
        let items = [];
        let item: any;
        while (i < pag.endItemIndex && i < ds.sourceItems.length) {
            item = ds.sourceItems[i];
            item.RowNumberLds = i + 1;
            items.push(item);
            i++;
        }
        return items;
    }
    private sortItemsLocally(ds: ListDataSource<any>, fieldName: string | undefined) {
        if (!fieldName) { return; }
        const field = ds.field(fieldName);
        if (!field) { return; }
        field.dataType = field.dataType || 'number';
        let dir = ds.state.sort1Dir || ds.config.sort.defaultDir;
        const applyingSortName = `${fieldName} ${dir}`;
        if (ds.appliedSortName == applyingSortName) { return; }
        ds.appliedSortName = applyingSortName;
        let sourceItems = [];
        if (dir && dir == 'desc') {
            if (field.dataType == 'string') {
                sourceItems = this.sort_desc_string(ds.sourceItems, fieldName);
            } else {
                sourceItems = this.sort_desc(ds.sourceItems, fieldName);
            }
        }
        else {
            if (field.dataType == 'string') {
                sourceItems = this.sort_asc_string(ds.sourceItems, fieldName);
            } else {
                sourceItems = this.sort_asc(ds.sourceItems, fieldName);
            }
        }
        ds.setSourceItems(sourceItems);
    }
    private sort_asc(arr: any[], sortField: string): any[] {
        return arr.sort((a, b) => {
            const aVal = a[sortField];
            const bVal = b[sortField];
            if (aVal == null || aVal === undefined) return 1;
            if (bVal == null || bVal === undefined) return -1;
            return aVal - bVal;
        });
    };
    private sort_desc(arr: any[], sortField: string): any[] {
        return arr.sort((a, b) => {
            const aVal = a[sortField];
            const bVal = b[sortField];
            if (bVal == null || bVal === undefined) return -1;
            if (aVal == null || aVal === undefined) return 1;
            return bVal - aVal;
        });
    };
    private sort_asc_string(arr: any[], sortField: string): any[] {
        return arr.sort((a, b) => {
            if (a[sortField] == undefined || a[sortField] == null) return 1;
            if (b[sortField] == undefined || b[sortField] == null) return -1;
            return a[sortField].localeCompare(b[sortField]);
        });
    };
    private sort_desc_string(arr: any[], sortField: string): any[] {
        return arr.sort((a, b) => {
            if (b[sortField] == undefined || b[sortField] == null) return -1;
            if (a[sortField] == undefined || a[sortField] == null) return 1;
            return b[sortField].localeCompare(a[sortField]);
        });
    };
    private copyConfigSection(target: any, source: any) {
        Object.keys(source)
            .filter((key) => source[key] !== undefined)
            .forEach((key) => target[key] = source[key]);
    }
    private copyConfig(target: LdsConfig, source: LdsConfig | Partial<LdsConfig>) {
        if (source.pagination) {
            this.copyConfigSection(target.pagination, source.pagination);
        }
        if (source.sort) {
            this.copyConfigSection(target.sort, source.sort);
        }
        if (source.http) {
            this.copyConfigSection(target.http, source.http);
        }
    }
    
    // Cache management helper methods
    private _getCacheKey(id: string, pathName: string): string {
        return `${id}|${pathName}`;
    }
    
    private _getCacheById(id: string, pathName: string): LdsCacheModel | undefined {
        const key = this._getCacheKey(id, pathName);
        return this._cacheMap.get(key);
    }
    
    private _rebuildCacheMap() {
        this._cacheMap.clear();
        this.dsCaches.forEach(cache => {
            const key = this._getCacheKey(cache.id, cache.pathName);
            this._cacheMap.set(key, cache);
        });
    }
    
    private _isCacheValid(cache: LdsCacheModel): boolean {
        if (!cache.date) { return false; }
        
        try {
            const cacheDate = new Date(cache.date);
            const now = new Date();
            const hoursSinceCached = (now.getTime() - cacheDate.getTime()) / (1000 * 60 * 60);
            
            // Expire caches older than configured hours
            return hoursSinceCached < ListDataSourceProvider.CACHE_EXPIRATION_HOURS;
        } catch {
            return false;
        }
    }
    
    private _cleanOldCaches() {
        // Sort by date descending (newest first)
        this.dsCaches.sort((a, b) => {
            const dateA = new Date(a.date || 0).getTime();
            const dateB = new Date(b.date || 0).getTime();
            return dateB - dateA;
        });
        
        // Keep only the newest 40 caches (remove 10)
        const removed = this.dsCaches.splice(40);
        
        // Update Map
        removed.forEach(cache => {
            const key = this._getCacheKey(cache.id, cache.pathName);
            this._cacheMap.delete(key);
        });
    }
    
    private _safeStorageGet(key: string): string | null {
        try {
            return this.config.storage == 'local'
                ? localStorage.getItem(key)
                : sessionStorage.getItem(key);
        } catch (error) {
            console.warn('Storage access failed:', error);
            return null;
        }
    }
    
    private _safeStorageSet(key: string, value: string): boolean {
        try {
            if (this.config.storage == 'local') {
                localStorage.setItem(key, value);
            } else {
                sessionStorage.setItem(key, value);
            }
            return true;
        } catch (error) {
            if (error instanceof DOMException) {
                if (error.name === 'QuotaExceededError') {
                    console.warn('Storage quota exceeded');
                } else if (error.name === 'SecurityError') {
                    console.warn('Storage access denied (private browsing mode?)');
                }
            } else {
                console.error('Storage operation failed:', error);
            }
            return false;
        }
    }
    
    /**
     * Clears all cached datasource state from storage
     * Useful for debugging or manual cache reset
     */
    public clearStorage() {
        try {
            if (this.config.storage == 'local') {
                localStorage.removeItem('datasources');
            } else {
                sessionStorage.removeItem('datasources');
            }
            this.dsCaches = [];
            this._cacheMap.clear();
        } catch (error) {
            // Silent fail - storage might not be available
        }
    }
}