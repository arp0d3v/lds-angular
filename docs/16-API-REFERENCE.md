# API Reference 📖

Complete reference for ListDataSource methods, properties, and events.

---

## ListDataSource Class

### Constructor

```typescript
constructor(
    id: string,
    type: string,
    config: LdsConfig,
    cache?: LdsCacheModel
)
```

**Parameters:**
- `id` - Unique identifier for this data source
- `type` - 'remote' or 'local'
- `config` - Configuration object
- `cache` - Optional cached state

**Note:** Use `ListDataSourceProvider` to create instances instead of calling directly.

---

## Core Methods

### `reload(eventName?: string): void`

Reloads data from source.

```typescript
this.dataSource.reload();
this.dataSource.reload('search');  // With custom event name
```

**Triggers:** `onDataRequested` event

---

### `setFields(fields: LdsField[], callStateChanged?: boolean): void`

Sets field definitions for the data source.

```typescript
this.dataSource.setFields([
    new LdsField('Id', 'ID', 'number'),
    new LdsField('Name', 'Name', 'string'),
]);
```

**Parameters:**
- `fields` - Array of LdsField objects
- `callStateChanged` - Whether to emit state change event (default: false)

---

### `setData(data: LdsInputModel): void`

Sets the data for the current page.

```typescript
this.dataSource.setData({
    items: [...],
    total: 100
});
```

**Parameters:**
- `data.items` - Array of items for current page
- `data.total` - Total number of items across all pages

---

### `setItems(items: T[]): void`

Sets items for the current page (updates page cache).

```typescript
this.dataSource.setItems([...items]);
```

---

### `setSourceItems(items: T[]): void`

Sets source items for local data source (all items).

```typescript
// Local data source only
this.dataSource.setSourceItems([...allItems]);
```

---

### `field(name: string, condition?: boolean): LdsField | undefined`

Gets a field by name, optionally setting visibility condition.

```typescript
const nameField = this.dataSource.field('Name');
this.dataSource.field('Email', userIsAdmin);  // Conditional visibility
```

**Returns:** LdsField or undefined if not found

---

### `dispose(): void`

Cleans up all resources and completes event emitters.

**⚠️ IMPORTANT:** Always call in `ngOnDestroy()`

```typescript
ngOnDestroy() {
    this.dataSource.dispose();
}
```

**What it does:**
- Completes all event emitters
- Clears item arrays
- Clears field map
- Prevents memory leaks

---

### `reset(): void`

Completely resets the data source.

```typescript
this.dataSource.reset();
```

**What it resets:**
- Filters
- Sort state
- Page index
- All data

---

## Pagination Methods

### `loadPage(pageIndex: number): void`

Loads a specific page (0-based index).

```typescript
this.dataSource.loadPage(0);  // First page
this.dataSource.loadPage(2);  // Third page
```

---

### `setPageSize(size: number): void`

Sets the page size (items per page).

```typescript
this.dataSource.setPageSize(20);
```

---

### `changePageSize(value: number): void`

Changes page size and reloads data.

```typescript
this.dataSource.changePageSize(50);
```

---

### `loadNextPage(): void`

Loads the next page.

```typescript
this.dataSource.loadNextPage();
```

**Use case:** Infinite scroll / "Load More" buttons

---

## Sorting Methods

### `changeSort(fieldName?: string, direction?: string): void`

Changes sort column and/or direction.

```typescript
// Toggle sort on Name column
this.dataSource.changeSort('Name');

// Set specific sort
this.dataSource.changeSort('Name', 'desc');
```

**Direction:** `'asc'` or `'desc'`

---

## Filter Methods

### `clearFilters(): void`

Clears all filters without reloading.

```typescript
this.dataSource.clearFilters();
```

---

### `resetFilters(): void`

Clears all filters and reloads data.

```typescript
this.dataSource.resetFilters();
```

---

### `search(): void`

Resets to page 0 and reloads (useful after applying filters).

```typescript
this.dataSource.filters.SearchText = 'query';
this.dataSource.search();
```

---

## State Methods

### `clearState(): void`

Clears sort and pagination state.

```typescript
this.dataSource.clearState();
```

---

### `clearData(): void`

Clears all loaded data.

```typescript
this.dataSource.clearData();
```

---

### `toggleAreaExpanded(): void`

Toggles expanded state (for expandable filter areas).

```typescript
this.dataSource.toggleAreaExpanded();
```

---

## Properties (Getters)

### `items: T[]`

Current page items.

```typescript
<tr *ngFor="let item of dataSource.items">
```

**Read-only**

---

### `sourceItems: T[]`

All source items (local data source only).

```typescript
const all = this.dataSource.sourceItems;
```

**Read-only**

---

### `pages: LdsPageData[]`

All loaded pages (for multi-page rendering).

```typescript
<div *ngFor="let page of dataSource.pages; trackBy: dataSource.trackByPageIndex">
    <div *ngFor="let item of page.items">
```

**Read-only**

---

### `fields: LdsField[]`

All field definitions.

```typescript
const fields = this.dataSource.fields;
```

**Read-only**

---

### `hasData: boolean`

Whether data source has items.

```typescript
<div *ngIf="!dataSource.hasData">No data</div>
```

**Read-only**

---

### `isLoading: boolean`

Whether data is currently loading.

```typescript
<div *ngIf="dataSource.isLoading">Loading...</div>
<button [disabled]="dataSource.isLoading">Search</button>
```

**Read-only**

---

### `isDisposed: boolean`

Whether dispose() has been called.

```typescript
if (this.dataSource.isDisposed) {
    console.warn('DataSource already disposed');
}
```

**Read-only**

---

### `isLastPage: boolean`

Whether on the last page.

```typescript
<button (click)="dataSource.loadNextPage()" 
        *ngIf="!dataSource.isLastPage">
    Load More
</button>
```

**Read-only**

---

### `pageIndex: number`

Current page index (0-based).

```typescript
const current = this.dataSource.pageIndex;
```

**Read-only** (use `loadPage()` to change)

---

### `pageSize: number`

Current page size.

```typescript
const size = this.dataSource.pageSize;
```

**Read-only** (use `setPageSize()` or `changePageSize()` to change)

---

### `totalCount: number`

Total number of items across all pages.

```typescript
<div>Showing {{ dataSource.items.length }} of {{ dataSource.totalCount }}</div>
```

**Read-only**

---

### `htmlId: string`

Unique HTML ID for this data source.

```typescript
const id = this.dataSource.htmlId;
```

**Read-only**

---

### `pagination: LdsPaginationState`

Convenient access to pagination state.

```typescript
const currentPage = this.dataSource.pagination.pageIndex;
const totalPages = this.dataSource.pagination.totalPageCount;
const buttonCount = this.dataSource.pagination.buttonCount;
```

**Properties:**
- `enabled: boolean`
- `pageIndex: number`
- `pageSize: number`
- `totalPageCount: number`
- `pages: number[]` - Array of page numbers for UI
- `startPagingIndex: number`
- `endPagingIndex: number`
- `startItemIndex: number`
- `endItemIndex: number`
- `buttonCount: number`

---

### `state: LdsViewState`

Complete state object.

```typescript
const state = this.dataSource.state;
// Access: order1Name, order1Dir, pagination, etc.
```

---

### `filters: any`

Filter object (you define the structure).

```typescript
// Get
const searchText = this.dataSource.filters.SearchText;

// Set
this.dataSource.filters.SearchText = 'query';
this.dataSource.filters.CategoryId = 5;
```

---

## Public Properties (Direct Access)

### `config: LdsConfig`

Configuration object.

```typescript
const sortDir = this.dataSource.config.sort.defaultDir;
const pageSize = this.dataSource.config.pagination?.pageSize;
```

---

### `id: string`

Data source unique ID.

```typescript
const id = this.dataSource.id;
```

---

### `type: string`

Data source type ('remote' or 'local').

```typescript
if (this.dataSource.type === 'remote') {
    // ...
}
```

---

## Events (LdsEventEmitter)

### `onDataRequested`

Emitted when data reload is requested.

```typescript
this.dataSource.onDataRequested.subscribe(eventName => {
    console.log('Data requested:', eventName);
});
```

**Event payload:** `string` (event name like 'reload', 'search', 'loadPage')

---

### `onDataLoading`

Emitted before data is loaded (use to modify filters).

```typescript
this.dataSource.onDataLoading.subscribe(filters => {
    // Modify filters before sending to API
    filters.additionalParam = 'value';
});
```

**Event payload:** `any` (filters object)

---

### `onDataLoaded`

Emitted after data is loaded.

```typescript
this.dataSource.onDataLoaded.subscribe(data => {
    console.log('Loaded', data.items.length, 'items');
    
    // Post-process items
    data.items.forEach(item => {
        item.computed = calculateSomething(item);
    });
});
```

**Event payload:** `LdsInputModel` ({ items, total })

---

### `onSortChanged`

Emitted when sort changes.

```typescript
this.dataSource.onSortChanged.subscribe(fieldName => {
    console.log('Sorted by:', fieldName);
});
```

**Event payload:** `string` (field name)

---

### `onPaginationChanged`

Emitted when pagination state changes.

```typescript
this.dataSource.onPaginationChanged.subscribe(state => {
    console.log('Page:', state.pagination.pageIndex);
    console.log('Size:', state.pagination.pageSize);
});
```

**Event payload:** `LdsViewState`

---

### `onStateChanged`

Emitted when state changes.

```typescript
this.dataSource.onStateChanged.subscribe(reason => {
    console.log('State changed:', reason);
});
```

**Event payload:** `string` (reason like 'setFields', 'clearData', etc.)

---

### `onFieldChanged`

Emitted when field configuration changes.

```typescript
this.dataSource.onFieldChanged.subscribe(fieldName => {
    console.log('Field changed:', fieldName);
});
```

**Event payload:** `string` (field name)

---

## TrackBy Functions

### `trackByPageIndex(index: number, page: LdsPageData): number`

Built-in trackBy function for pages.

```html
<div *ngFor="let page of dataSource.pages; trackBy: dataSource.trackByPageIndex">
```

**Returns:** `page.pageIndex`

---

## Event Subscription Pattern

```typescript
// DON'T DO THIS (memory leak):
this.dataSource.onDataLoaded.subscribe(data => {
    // ...
});

// DO THIS (auto-cleanup):
ngOnDestroy() {
    this.dataSource.dispose();  // Completes all emitters
}
```

**Note:** `dispose()` automatically cleans up ALL event subscriptions.

---

## LdsField Class

### Constructor

```typescript
new LdsField(
    name: string,
    title: string,
    dataType: string,
    visible?: boolean,
    orderable?: boolean,
    order1Name?: string,
    order1Dir?: string,
    order2Name?: string,
    order2Dir?: string
)
```

**Example:**
```typescript
new LdsField('UserName', 'Username', 'string', true, true, 'User.Name', 'asc')
```

### Properties

- `name: string` - Field name (must match data property)
- `title: string` - Display title
- `dataType: string` - 'string', 'number', 'boolean', 'datetime', etc.
- `visible: boolean` - Whether field is visible (default: true)
- `orderable: boolean` - Whether field is sortable (default: true)
- `order1Name?: string` - Custom sort column name (SQL)
- `order1Dir?: string` - Default sort direction
- `order2Name?: string` - Secondary sort column
- `order2Dir?: string` - Secondary sort direction
- `dataSource?: ListDataSource` - Parent data source (set automatically)
- `visibleCondition?: boolean` - Visibility condition

---

## LdsConfig Interface

```typescript
interface LdsConfig {
    sort: {
        defaultName?: string;
        defaultDir: 'asc' | 'desc';
    };
    pagination?: {
        enabled: boolean;
        pageSize: number;
        buttonCount?: number;
    };
    saveState: boolean;
    cacheType: 'local' | 'session';
}
```

**Default values:**
```typescript
{
    sort: {
        defaultDir: 'asc'
    },
    pagination: {
        enabled: true,
        pageSize: 10,
        buttonCount: 7
    },
    saveState: true,
    cacheType: 'local'
}
```

---

## ListDataSourceProvider

### Methods

#### `getRemoteDataSource<T>(url: string, id: string): ListDataSource<T>`

Creates a remote data source (fetches from API).

```typescript
const ds = this.ldsProvider.getRemoteDataSource('api/users', 'UserList');
```

---

#### `getLocalDataSource<T>(id: string): ListDataSource<T>`

Creates a local data source (in-memory data).

```typescript
const ds = this.ldsProvider.getLocalDataSource('MyLocalData');
ds.setSourceItems([...items]);
```

---

#### `clearStorage(): void`

Clears all cached data sources from storage.

```typescript
this.ldsProvider.clearStorage();
```

---

## Type Definitions

### `LdsInputModel`

```typescript
interface LdsInputModel {
    items: T[];
    total: number;
}
```

### `LdsPageData`

```typescript
interface LdsPageData {
    pageIndex: number;
    items: T[];
}
```

### `LdsPaginationState`

```typescript
interface LdsPaginationState {
    enabled: boolean;
    pageIndex: number;
    pageSize: number;
    totalPageCount: number;
    pages: number[];
    startPagingIndex: number;
    endPagingIndex: number;
    startItemIndex: number;
    endItemIndex: number;
    buttonCount: number;
}
```

---

## See Also

- [Quick Start](./01-QUICK-START.md)
- [Basic Usage](./03-BASIC-USAGE.md)
- [Performance](./13-PERFORMANCE.md)
- [Examples](./18-EXAMPLES.md)

