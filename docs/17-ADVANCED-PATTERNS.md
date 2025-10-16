# Advanced Patterns 🎯

Advanced usage patterns and techniques for ListDataSource.

---

## Pattern 1: Multiple DataSources on One Page

**Use Case:** Dashboard with multiple independent tables/lists.

### Implementation

```typescript
@Component({
    selector: 'dashboard-page',
    templateUrl: 'dashboard.page.html'
})
export class DashboardPageComponent implements OnInit, OnDestroy {
    dataSourceTodayUser: ListDataSource<any>;
    dataSourceOnlineUser: ListDataSource<any>;
    dataSourceError: ListDataSource<any>;

    constructor(private ldsProvider: ListDataSourceProvider) {
        // Today's Users
        this.dataSourceTodayUser = this.ldsProvider.getRemoteDataSource(
            'api/admin/Dashboard/TodayUserList',
            'DashboardTodayUserGrid'
        );
        this.dataSourceTodayUser.setPageSize(200);
        this.dataSourceTodayUser.setFields(this.createUserFields());

        // Online Users
        this.dataSourceOnlineUser = this.ldsProvider.getRemoteDataSource(
            'api/admin/Dashboard/OnlineUserList',
            'DashboardOnlineUserGrid'
        );
        this.dataSourceOnlineUser.setPageSize(200);
        this.dataSourceOnlineUser.setFields(this.createUserFields());

        // Errors
        this.dataSourceError = this.ldsProvider.getRemoteDataSource(
            'api/admin/Dashboard/ErrorList',
            'DashboardErrorGrid'
        );
        this.dataSourceError.setPageSize(20);
        this.dataSourceError.setFields(this.createErrorFields());
    }

    ngOnInit() {
        // Load all data sources
        this.dataSourceTodayUser.reload();
        this.dataSourceOnlineUser.reload();
        this.dataSourceError.reload();
    }

    ngOnDestroy() {
        // Dispose all data sources
        this.dataSourceTodayUser.dispose();
        this.dataSourceOnlineUser.dispose();
        this.dataSourceError.dispose();
    }
    
    trackByUserId(index: number, user: any): number {
        return user.UserId || index;
    }
    
    trackByErrorId(index: number, error: any): number {
        return error.ErrorId || index;
    }

    createUserFields(): LdsField[] {
        return [
            new LdsField('UserId', 'User ID', 'number'),
            new LdsField('UserName', 'Username', 'string'),
            new LdsField('LastActivity', 'Last Activity', 'datetime'),
        ];
    }

    createErrorFields(): LdsField[] {
        return [
            new LdsField('ErrorId', 'ID', 'number'),
            new LdsField('Message', 'Error Message', 'string'),
            new LdsField('Timestamp', 'Time', 'datetime'),
        ];
    }
}
```

```html
<!-- Template -->
<div class="row">
    <!-- Today's Users -->
    <div class="col-md-6">
        <div class="card">
            <div class="card-header">Today's Users</div>
            <div class="card-body">
                <table class="table table-sm" [ldsTable]="dataSourceTodayUser">
                    <thead>
                        <tr>
                            <th lds-th="UserId"></th>
                            <th lds-th="UserName"></th>
                            <th lds-th="LastActivity"></th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr *ngFor="let user of dataSourceTodayUser.items; trackBy: trackByUserId">
                            <td lds-td="UserId">{{ user.UserId }}</td>
                            <td lds-td="UserName">{{ user.UserName }}</td>
                            <td lds-td="LastActivity">{{ user.LastActivity | date }}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>

    <!-- Online Users -->
    <div class="col-md-6">
        <div class="card">
            <div class="card-header">Online Users</div>
            <div class="card-body">
                <table class="table table-sm" [ldsTable]="dataSourceOnlineUser">
                    <!-- Similar structure -->
                </table>
            </div>
        </div>
    </div>
</div>

<!-- Errors -->
<div class="card mt-3">
    <div class="card-header">Recent Errors</div>
    <div class="card-body">
        <table class="table" [ldsTable]="dataSourceError">
            <!-- Error table -->
        </table>
        <lds-grid-pager [dataSource]="dataSourceError"></lds-grid-pager>
    </div>
</div>
```

**Key Points:**
- Each data source has unique ID for independent state caching
- All data sources must be disposed
- Each can have different page sizes and configurations

---

## Pattern 2: Master-Detail with Expandable Rows

**Use Case:** Table rows that expand to show detailed information.

### Implementation

```typescript
@Component({
    selector: 'user-list-with-details',
    templateUrl: 'user-list.html'
})
export class UserListWithDetailsComponent implements OnInit, OnDestroy {
    dataSource: ListDataSource<UserWithDetails>;

    constructor(
        private ldsProvider: ListDataSourceProvider,
        private http: HttpService
    ) {
        this.dataSource = this.ldsProvider.getRemoteDataSource(
            'api/users',
            'UserListWithDetails'
        );
        this.dataSource.setPageSize(20);
        this.dataSource.setFields(this.createFields());
    }

    ngOnInit() {
        this.dataSource.reload();
    }

    ngOnDestroy() {
        this.dataSource.dispose();
    }
    
    trackByFn(index: number, user: UserWithDetails): number {
        return user.UserId || index;
    }
    
    toggleRow(user: UserWithDetails) {
        user.IsExpanded = !user.IsExpanded;
        
        // Load details on first expand
        if (user.IsExpanded && !user.Details) {
            this.loadUserDetails(user);
        }
    }
    
    loadUserDetails(user: UserWithDetails) {
        user.LoadingDetails = true;
        this.http.get(`api/users/${user.UserId}/details`, {
            success: result => {
                user.Details = result.Data;
                user.LoadingDetails = false;
            },
            error: () => {
                user.LoadingDetails = false;
            }
        });
    }

    createFields(): LdsField[] {
        return [
            new LdsField('UserId', 'ID', 'number'),
            new LdsField('UserName', 'Username', 'string'),
            new LdsField('Email', 'Email', 'string'),
            new LdsField('Status', 'Status', 'string'),
        ];
    }
}

interface UserWithDetails {
    UserId: number;
    UserName: string;
    Email: string;
    Status: string;
    IsExpanded?: boolean;
    Details?: any;
    LoadingDetails?: boolean;
}
```

```html
<!-- Template -->
<table class="table" [ldsTable]="dataSource">
    <thead>
        <tr>
            <th style="width: 40px"></th>
            <th lds-th="UserId"></th>
            <th lds-th="UserName"></th>
            <th lds-th="Email"></th>
            <th lds-th="Status"></th>
        </tr>
    </thead>
    <tbody>
        <ng-container *ngFor="let user of dataSource.items; trackBy: trackByFn">
            <!-- Main Row -->
            <tr (click)="toggleRow(user)" style="cursor: pointer">
                <td>
                    <i class="bi" 
                       [class.bi-chevron-right]="!user.IsExpanded"
                       [class.bi-chevron-down]="user.IsExpanded"></i>
                </td>
                <td lds-td="UserId">{{ user.UserId }}</td>
                <td lds-td="UserName">{{ user.UserName }}</td>
                <td lds-td="Email">{{ user.Email }}</td>
                <td lds-td="Status">
                    <span class="badge" 
                          [class.bg-success]="user.Status === 'Active'"
                          [class.bg-danger]="user.Status === 'Inactive'">
                        {{ user.Status }}
                    </span>
                </td>
            </tr>
            
            <!-- Expanded Details Row -->
            <tr *ngIf="user.IsExpanded">
                <td colspan="5" class="bg-light">
                    <div class="p-3" *ngIf="user.LoadingDetails">
                        <i class="bi bi-hourglass-split"></i> Loading details...
                    </div>
                    <div class="p-3" *ngIf="user.Details && !user.LoadingDetails">
                        <h5>User Details</h5>
                        <dl class="row">
                            <dt class="col-sm-3">Full Name</dt>
                            <dd class="col-sm-9">{{ user.Details.FullName }}</dd>
                            
                            <dt class="col-sm-3">Phone</dt>
                            <dd class="col-sm-9">{{ user.Details.Phone }}</dd>
                            
                            <dt class="col-sm-3">Created</dt>
                            <dd class="col-sm-9">{{ user.Details.CreateDate | date }}</dd>
                            
                            <dt class="col-sm-3">Last Login</dt>
                            <dd class="col-sm-9">{{ user.Details.LastLogin | date }}</dd>
                        </dl>
                    </div>
                </td>
            </tr>
        </ng-container>
    </tbody>
</table>

<lds-grid-pager [dataSource]="dataSource"></lds-grid-pager>
```

**Key Points:**
- Row expansion state stored on the item itself
- Details loaded on-demand (lazy loading)
- Loading state tracked per item
- Expandable row spans all columns

---

## Pattern 3: Preserving UI State on Data Refresh

**Use Case:** Market watch where expanded rows and chart data must persist after refresh.

### Implementation

```typescript
@Component({
    selector: 'market-watch',
    templateUrl: 'market-watch.html'
})
export class MarketWatchComponent implements OnInit, OnDestroy {
    marketWatchDS: ListDataSource<MarketWatchItem>;
    refreshInterval: any;

    constructor(
        private ldsProvider: ListDataSourceProvider,
        private http: HttpService
    ) {
        this.marketWatchDS = this.ldsProvider.getRemoteDataSource(
            'api/marketwatch',
            'MarketWatchGrid'
        );
        this.marketWatchDS.setPageSize(50);
        this.marketWatchDS.setFields(this.createFields());
        
        // Intercept data loading to preserve UI state
        this.marketWatchDS.onDataLoaded.subscribe(data => {
            this.preserveUIState(data.items);
        });
    }

    ngOnInit() {
        this.marketWatchDS.reload();
        
        // Auto-refresh every 5 seconds
        this.refreshInterval = setInterval(() => {
            this.marketWatchDS.reload();
        }, 5000);
    }

    ngOnDestroy() {
        clearInterval(this.refreshInterval);
        this.marketWatchDS.dispose();
    }
    
    trackByFn(index: number, item: MarketWatchItem): number {
        return item.InstrumentId || index;
    }
    
    /**
     * Preserve UI state when data refreshes
     */
    preserveUIState(newItems: MarketWatchItem[]) {
        // Create map of old items by ID for O(1) lookup
        const oldItemsMap = new Map<number, MarketWatchItem>();
        this.marketWatchDS.items.forEach(item => {
            if (item.InstrumentId) {
                oldItemsMap.set(item.InstrumentId, item);
            }
        });
        
        // Transfer UI state from old items to new items
        newItems.forEach(newItem => {
            const oldItem = oldItemsMap.get(newItem.InstrumentId);
            if (oldItem) {
                // Preserve expansion state
                newItem.IsExpanded = oldItem.IsExpanded;
                
                // Preserve chart data
                newItem.ChartData = oldItem.ChartData;
                newItem.ChartDataSource = oldItem.ChartDataSource;
                newItem.LoadedChart = oldItem.LoadedChart;
                newItem.HasChartData = oldItem.HasChartData;
            }
        });
    }
    
    toggleChart(item: MarketWatchItem) {
        item.IsExpanded = !item.IsExpanded;
        
        if (item.IsExpanded && !item.LoadedChart) {
            this.loadChart(item);
        }
    }
    
    loadChart(item: MarketWatchItem) {
        item.LoadedChart = true;
        this.http.get(`api/chart/${item.InstrumentId}`, {
            success: result => {
                item.ChartData = result.Data;
                item.HasChartData = true;
            }
        });
    }

    createFields(): LdsField[] {
        return [
            new LdsField('Symbol', 'Symbol', 'string'),
            new LdsField('LastPrice', 'Last', 'number'),
            new LdsField('Change', 'Change', 'number'),
            new LdsField('ChangePercent', 'Change %', 'number'),
            new LdsField('Volume', 'Volume', 'number'),
        ];
    }
}

interface MarketWatchItem {
    InstrumentId: number;
    Symbol: string;
    LastPrice: number;
    Change: number;
    ChangePercent: number;
    Volume: number;
    
    // UI State (not from API)
    IsExpanded?: boolean;
    ChartData?: any;
    ChartDataSource?: any;
    LoadedChart?: boolean;
    HasChartData?: boolean;
}
```

**Key Points:**
- Use `Map` for O(1) state lookup
- Preserve all UI-related properties
- Works with auto-refresh
- TrackBy ensures DOM elements are reused

---

## Pattern 4: Dynamic Field Visibility

**Use Case:** Show/hide columns based on user permissions or settings.

### Implementation

```typescript
@Component({
    selector: 'dynamic-columns',
    templateUrl: 'dynamic-columns.html'
})
export class DynamicColumnsComponent implements OnInit, OnDestroy {
    dataSource: ListDataSource<User>;
    showAdvanced = false;

    constructor(
        private ldsProvider: ListDataSourceProvider,
        private authService: AuthService
    ) {
        this.dataSource = this.ldsProvider.getRemoteDataSource(
            'api/users',
            'UserListDynamic'
        );
        this.dataSource.setFields(this.createFields());
    }

    ngOnInit() {
        this.updateFieldVisibility();
        this.dataSource.reload();
    }

    ngOnDestroy() {
        this.dataSource.dispose();
    }
    
    trackByFn(index: number, user: User): number {
        return user.UserId || index;
    }
    
    updateFieldVisibility() {
        const isAdmin = this.authService.isAdmin();
        
        // Show/hide fields based on permissions
        this.dataSource.field('Email', isAdmin);
        this.dataSource.field('Phone', isAdmin);
        this.dataSource.field('LastLogin', isAdmin);
        this.dataSource.field('IpAddress', isAdmin);
        
        // Show/hide based on user preference
        this.dataSource.field('CreatedDate', this.showAdvanced);
        this.dataSource.field('UpdatedDate', this.showAdvanced);
        this.dataSource.field('LoginCount', this.showAdvanced);
    }
    
    toggleAdvancedColumns() {
        this.showAdvanced = !this.showAdvanced;
        this.updateFieldVisibility();
    }

    createFields(): LdsField[] {
        return [
            new LdsField('UserId', 'ID', 'number'),
            new LdsField('UserName', 'Username', 'string'),
            new LdsField('Email', 'Email', 'string', false),  // Hidden by default
            new LdsField('Phone', 'Phone', 'string', false),
            new LdsField('Status', 'Status', 'string'),
            new LdsField('LastLogin', 'Last Login', 'datetime', false),
            new LdsField('IpAddress', 'IP Address', 'string', false),
            new LdsField('CreatedDate', 'Created', 'datetime', false),
            new LdsField('UpdatedDate', 'Updated', 'datetime', false),
            new LdsField('LoginCount', 'Login Count', 'number', false),
        ];
    }
}

interface User {
    UserId: number;
    UserName: string;
    Email: string;
    Phone: string;
    Status: string;
    LastLogin: string;
    IpAddress: string;
    CreatedDate: string;
    UpdatedDate: string;
    LoginCount: number;
}
```

```html
<!-- Template -->
<div class="mb-3">
    <button class="btn btn-secondary btn-sm" (click)="toggleAdvancedColumns()">
        <i class="bi" 
           [class.bi-eye]="!showAdvanced"
           [class.bi-eye-slash]="showAdvanced"></i>
        {{ showAdvanced ? 'Hide' : 'Show' }} Advanced Columns
    </button>
</div>

<table class="table" [ldsTable]="dataSource">
    <thead>
        <tr>
            <th lds-th="UserId"></th>
            <th lds-th="UserName"></th>
            <th lds-th="Email"></th>
            <th lds-th="Phone"></th>
            <th lds-th="Status"></th>
            <th lds-th="LastLogin"></th>
            <th lds-th="IpAddress"></th>
            <th lds-th="CreatedDate"></th>
            <th lds-th="UpdatedDate"></th>
            <th lds-th="LoginCount"></th>
        </tr>
    </thead>
    <tbody>
        <tr *ngFor="let user of dataSource.items; trackBy: trackByFn">
            <td lds-td="UserId">{{ user.UserId }}</td>
            <td lds-td="UserName">{{ user.UserName }}</td>
            <td lds-td="Email">{{ user.Email }}</td>
            <td lds-td="Phone">{{ user.Phone }}</td>
            <td lds-td="Status">{{ user.Status }}</td>
            <td lds-td="LastLogin">{{ user.LastLogin | date }}</td>
            <td lds-td="IpAddress">{{ user.IpAddress }}</td>
            <td lds-td="CreatedDate">{{ user.CreatedDate | date }}</td>
            <td lds-td="UpdatedDate">{{ user.UpdatedDate | date }}</td>
            <td lds-td="LoginCount">{{ user.LoginCount }}</td>
        </tr>
    </tbody>
</table>
```

**Key Points:**
- Components (`lds-th`, `lds-td`) automatically hide when field is invisible
- Visibility can change based on permissions or user settings
- State persists in cache

---

## Pattern 5: Data Transformation Pipeline

**Use Case:** Pre-process data after loading (sanitize HTML, format dates, calculate values).

### Implementation

```typescript
@Component({
    selector: 'article-list',
    templateUrl: 'article-list.html'
})
export class ArticleListComponent implements OnInit, OnDestroy {
    dataSource: ListDataSource<Article>;

    constructor(
        private ldsProvider: ListDataSourceProvider,
        private sanitizer: DomSanitizer,
        private currencyService: CurrencyService
    ) {
        this.dataSource = this.ldsProvider.getRemoteDataSource(
            'api/articles',
            'ArticleList'
        );
        this.dataSource.setFields(this.createFields());
        
        // Setup data transformation pipeline
        this.dataSource.onDataLoaded.subscribe(data => {
            this.transformData(data.items);
        });
    }

    ngOnInit() {
        this.dataSource.reload();
    }

    ngOnDestroy() {
        this.dataSource.dispose();
    }
    
    trackByFn(index: number, article: Article): number | string {
        return article.Id || index;
    }
    
    /**
     * Transform data after loading
     */
    transformData(items: Article[]) {
        items.forEach(article => {
            // 1. Sanitize HTML
            if (article.Summary) {
                article.Summary_Html = this.sanitizer.bypassSecurityTrustHtml(
                    article.Summary
                );
            }
            
            // 2. Format dates
            article.FormattedDate = this.formatDate(article.PublishDate);
            
            // 3. Calculate values
            article.ReadingTime = this.calculateReadingTime(article.Content);
            
            // 4. Convert currency
            if (article.Price) {
                article.PriceUSD = this.currencyService.convert(
                    article.Price,
                    'IRR',
                    'USD'
                );
            }
            
            // 5. Add computed properties
            article.IsNew = this.isPublishedRecently(article.PublishDate);
            article.HasAttachments = article.Attachments?.length > 0;
        });
    }
    
    formatDate(date: string): string {
        const d = new Date(date);
        const now = new Date();
        const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;
        return date;
    }
    
    calculateReadingTime(content: string): number {
        const wordsPerMinute = 200;
        const wordCount = content?.split(/\s+/).length || 0;
        return Math.ceil(wordCount / wordsPerMinute);
    }
    
    isPublishedRecently(date: string): boolean {
        const publishDate = new Date(date);
        const now = new Date();
        const diffDays = (now.getTime() - publishDate.getTime()) / (1000 * 60 * 60 * 24);
        return diffDays <= 7;
    }

    createFields(): LdsField[] {
        return [
            new LdsField('Id', 'ID', 'string'),
            new LdsField('Title', 'Title', 'string'),
            new LdsField('PublishDate', 'Published', 'datetime'),
            new LdsField('ViewCount', 'Views', 'number'),
        ];
    }
}

interface Article {
    Id: string;
    Title: string;
    Summary: string;
    Content: string;
    PublishDate: string;
    ViewCount: number;
    Price?: number;
    Attachments?: any[];
    
    // Computed properties
    Summary_Html?: any;
    FormattedDate?: string;
    ReadingTime?: number;
    PriceUSD?: number;
    IsNew?: boolean;
    HasAttachments?: boolean;
}
```

**Key Points:**
- All transformations happen once after data load
- Avoids expensive pipes in template
- Pre-computed properties for better performance
- Sanitization handled safely

---

## Pattern 6: Custom Pagination Strategy

**Use Case:** Load more with offset/limit instead of page numbers.

### Implementation

```typescript
@Component({
    selector: 'custom-pagination',
    templateUrl: 'custom-pagination.html'
})
export class CustomPaginationComponent implements OnInit, OnDestroy {
    dataSource: ListDataSource<Item>;
    hasMore = true;
    loadingMore = false;

    constructor(
        private ldsProvider: ListDataSourceProvider,
        private http: HttpService
    ) {
        this.dataSource = this.ldsProvider.getLocalDataSource('CustomPagination');
        this.dataSource.setFields(this.createFields());
    }

    ngOnInit() {
        this.loadMore();
    }

    ngOnDestroy() {
        this.dataSource.dispose();
    }
    
    trackByFn(index: number, item: Item): number {
        return item.Id || index;
    }
    
    loadMore() {
        if (this.loadingMore || !this.hasMore) return;
        
        this.loadingMore = true;
        const offset = this.dataSource.sourceItems.length;
        const limit = 20;
        
        this.http.get(`api/items?offset=${offset}&limit=${limit}`, {
            success: result => {
                const newItems = result.Data.items;
                
                // Append to existing items
                const allItems = [...this.dataSource.sourceItems, ...newItems];
                this.dataSource.setSourceItems(allItems);
                
                this.hasMore = newItems.length === limit;
                this.loadingMore = false;
            },
            error: () => {
                this.loadingMore = false;
            }
        });
    }

    createFields(): LdsField[] {
        return [
            new LdsField('Id', 'ID', 'number'),
            new LdsField('Name', 'Name', 'string'),
            new LdsField('Description', 'Description', 'string'),
        ];
    }
}

interface Item {
    Id: number;
    Name: string;
    Description: string;
}
```

```html
<!-- Template -->
<div class="list-group">
    <div *ngFor="let item of dataSource.sourceItems; trackBy: trackByFn" 
         class="list-group-item">
        <h5>{{ item.Name }}</h5>
        <p>{{ item.Description }}</p>
    </div>
</div>

<div class="text-center mt-3">
    <button class="btn btn-primary" 
            (click)="loadMore()"
            [disabled]="loadingMore || !hasMore">
        <span *ngIf="loadingMore">
            <i class="bi bi-hourglass-split"></i> Loading...
        </span>
        <span *ngIf="!loadingMore && hasMore">
            Load More
        </span>
        <span *ngIf="!hasMore">
            No More Items
        </span>
    </button>
</div>
```

**Key Points:**
- Uses local data source to accumulate items
- Custom load logic with offset/limit
- Tracks loading state
- Knows when no more items available

---

## Pattern 7: Batch Operations

**Use Case:** Select multiple rows and perform bulk actions.

### Implementation

```typescript
@Component({
    selector: 'batch-operations',
    templateUrl: 'batch-operations.html'
})
export class BatchOperationsComponent implements OnInit, OnDestroy {
    dataSource: ListDataSource<User>;
    selectedItems = new Set<number>();

    constructor(
        private ldsProvider: ListDataSourceProvider,
        private http: HttpService
    ) {
        this.dataSource = this.ldsProvider.getRemoteDataSource(
            'api/users',
            'UserBatchList'
        );
        this.dataSource.setPageSize(20);
        this.dataSource.setFields(this.createFields());
        
        // Clear selection on data reload
        this.dataSource.onDataLoaded.subscribe(() => {
            this.clearSelection();
        });
    }

    ngOnInit() {
        this.dataSource.reload();
    }

    ngOnDestroy() {
        this.dataSource.dispose();
    }
    
    trackByFn(index: number, user: User): number {
        return user.UserId || index;
    }
    
    get hasSelection(): boolean {
        return this.selectedItems.size > 0;
    }
    
    get selectedCount(): number {
        return this.selectedItems.size;
    }
    
    get allSelected(): boolean {
        return this.dataSource.items.every(item => 
            this.selectedItems.has(item.UserId)
        );
    }
    
    toggleSelection(userId: number) {
        if (this.selectedItems.has(userId)) {
            this.selectedItems.delete(userId);
        } else {
            this.selectedItems.add(userId);
        }
    }
    
    toggleAll() {
        if (this.allSelected) {
            this.clearSelection();
        } else {
            this.dataSource.items.forEach(item => {
                this.selectedItems.add(item.UserId);
            });
        }
    }
    
    clearSelection() {
        this.selectedItems.clear();
    }
    
    bulkDelete() {
        if (!confirm(`Delete ${this.selectedCount} users?`)) return;
        
        const userIds = Array.from(this.selectedItems);
        
        this.http.post('api/users/bulk-delete', { userIds }, {
            success: () => {
                this.clearSelection();
                this.dataSource.reload();
            }
        });
    }
    
    bulkActivate() {
        const userIds = Array.from(this.selectedItems);
        
        this.http.post('api/users/bulk-activate', { userIds }, {
            success: () => {
                this.clearSelection();
                this.dataSource.reload();
            }
        });
    }

    createFields(): LdsField[] {
        return [
            new LdsField('UserId', 'ID', 'number'),
            new LdsField('UserName', 'Username', 'string'),
            new LdsField('Email', 'Email', 'string'),
            new LdsField('Status', 'Status', 'string'),
        ];
    }
}

interface User {
    UserId: number;
    UserName: string;
    Email: string;
    Status: string;
}
```

```html
<!-- Template -->
<div class="mb-3" *ngIf="hasSelection">
    <div class="alert alert-info">
        <strong>{{ selectedCount }}</strong> item(s) selected
        <div class="btn-group ms-3">
            <button class="btn btn-sm btn-success" (click)="bulkActivate()">
                Activate Selected
            </button>
            <button class="btn btn-sm btn-danger" (click)="bulkDelete()">
                Delete Selected
            </button>
            <button class="btn btn-sm btn-secondary" (click)="clearSelection()">
                Clear
            </button>
        </div>
    </div>
</div>

<table class="table" [ldsTable]="dataSource">
    <thead>
        <tr>
            <th style="width: 40px">
                <input type="checkbox" 
                       [checked]="allSelected"
                       (change)="toggleAll()">
            </th>
            <th lds-th="UserId"></th>
            <th lds-th="UserName"></th>
            <th lds-th="Email"></th>
            <th lds-th="Status"></th>
        </tr>
    </thead>
    <tbody>
        <tr *ngFor="let user of dataSource.items; trackBy: trackByFn">
            <td>
                <input type="checkbox" 
                       [checked]="selectedItems.has(user.UserId)"
                       (change)="toggleSelection(user.UserId)">
            </td>
            <td lds-td="UserId">{{ user.UserId }}</td>
            <td lds-td="UserName">{{ user.UserName }}</td>
            <td lds-td="Email">{{ user.Email }}</td>
            <td lds-td="Status">{{ user.Status }}</td>
        </tr>
    </tbody>
</table>

<lds-grid-pager [dataSource]="dataSource"></lds-grid-pager>
```

**Key Points:**
- Use `Set` for efficient selection tracking
- "Select All" only affects current page
- Clear selection on data reload
- Batch operations with confirmation

---

## Pattern 8: Conditional Row Styling

**Use Case:** Highlight rows based on data conditions.

### Implementation

```typescript
@Component({
    selector: 'conditional-styling',
    templateUrl: 'conditional-styling.html'
})
export class ConditionalStylingComponent implements OnInit, OnDestroy {
    dataSource: ListDataSource<Transaction>;

    constructor(private ldsProvider: ListDataSourceProvider) {
        this.dataSource = this.ldsProvider.getRemoteDataSource(
            'api/transactions',
            'TransactionList'
        );
        this.dataSource.setFields(this.createFields());
    }

    ngOnInit() {
        this.dataSource.reload();
    }

    ngOnDestroy() {
        this.dataSource.dispose();
    }
    
    trackByFn(index: number, item: Transaction): number {
        return item.TransactionId || index;
    }
    
    getRowClass(transaction: Transaction): string {
        if (transaction.Status === 'Failed') return 'table-danger';
        if (transaction.Status === 'Pending') return 'table-warning';
        if (transaction.Amount > 10000) return 'table-info';
        if (transaction.IsNew) return 'table-success';
        return '';
    }

    createFields(): LdsField[] {
        return [
            new LdsField('TransactionId', 'ID', 'number'),
            new LdsField('Amount', 'Amount', 'number'),
            new LdsField('Status', 'Status', 'string'),
            new LdsField('Date', 'Date', 'datetime'),
        ];
    }
}

interface Transaction {
    TransactionId: number;
    Amount: number;
    Status: string;
    Date: string;
    IsNew: boolean;
}
```

```html
<!-- Template -->
<table class="table" [ldsTable]="dataSource">
    <thead>
        <tr>
            <th lds-th="TransactionId"></th>
            <th lds-th="Amount"></th>
            <th lds-th="Status"></th>
            <th lds-th="Date"></th>
        </tr>
    </thead>
    <tbody>
        <tr *ngFor="let item of dataSource.items; trackBy: trackByFn"
            [ngClass]="getRowClass(item)">
            <td lds-td="TransactionId">{{ item.TransactionId }}</td>
            <td lds-td="Amount">{{ item.Amount | currency }}</td>
            <td lds-td="Status">
                <span class="badge"
                      [class.bg-success]="item.Status === 'Completed'"
                      [class.bg-danger]="item.Status === 'Failed'"
                      [class.bg-warning]="item.Status === 'Pending'">
                    {{ item.Status }}
                </span>
            </td>
            <td lds-td="Date">{{ item.Date | date }}</td>
        </tr>
    </tbody>
</table>
```

**Key Points:**
- Use `[ngClass]` with function for dynamic styling
- Bootstrap table classes for row highlighting
- Combine multiple conditions
- Method is called once per row

---

## Summary

These advanced patterns demonstrate:

✅ **Multiple DataSources** - Independent tables on one page  
✅ **Expandable Rows** - Master-detail with lazy loading  
✅ **State Preservation** - UI state survives data refresh  
✅ **Dynamic Visibility** - Show/hide columns conditionally  
✅ **Data Pipelines** - Transform data after loading  
✅ **Custom Pagination** - Offset/limit strategies  
✅ **Batch Operations** - Multi-select and bulk actions  
✅ **Conditional Styling** - Dynamic row highlighting  

---

## See Also

- [Quick Start](./01-QUICK-START.md)
- [Table Components](./10-TABLE-COMPONENTS.md)
- [Performance](./13-PERFORMANCE.md)
- [Examples](./18-EXAMPLES.md)
- [API Reference](./16-API-REFERENCE.md)

