# Real-World Examples 💼

Complete implementation examples based on actual usage patterns.

---

## Example 1: Admin Data Table

**Use Case:** Standard admin table with sorting, pagination, and CRUD actions.

### Component (package-list.page.ts)

```typescript
import { Component, OnInit, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { ListDataSource, ListDataSourceProvider, LdsField } from 'src/list-data-source';

@Component({
    selector: 'package-list-page',
    templateUrl: 'package-list.page.html',
    changeDetection: ChangeDetectionStrategy.Default
})
export class PackageListPageComponent implements OnInit, OnDestroy {
    dataSource: ListDataSource<PackageDto>;

    constructor(
        private ldsProvider: ListDataSourceProvider,
        private router: Router
    ) {
        // Create remote data source
        this.dataSource = this.ldsProvider.getRemoteDataSource(
            'api/admin/Package/List',
            'AdminPackageListGrid'
        );
        
        // Configure
        this.dataSource.setFields(this.createDsFields());
    }

    ngOnInit(): void {
        this.dataSource.reload();
    }

    ngOnDestroy() {
        this.dataSource.dispose();
    }
    
    trackByFn(index: number, item: PackageDto): number {
        return item.PackageId || index;
    }
    
    createDsFields(): LdsField[] {
        return [
            new LdsField('PackageId', 'ID', 'number'),
            new LdsField('PackageName', 'Name', 'string'),
            new LdsField('Description', 'Description', 'string'),
            new LdsField('PersonType', 'Person Type', 'number'),
            new LdsField('CategoryLimit', 'Category Limit', 'number'),
            new LdsField('IsCustomizable', 'Customizable', 'boolean'),
            new LdsField('IsActive', 'Active', 'boolean'),
        ];
    }
    
    get filterModel(): any {
        return this.dataSource.filters;
    }
    
    search() {
        this.dataSource.search();
    }
    
    editPackage(item: PackageDto) {
        this.router.navigate(['/admin/package/edit', item.PackageId]);
    }
    
    deletePackage(item: PackageDto) {
        if (confirm('Are you sure?')) {
            // Delete logic
        }
    }
}

interface PackageDto {
    PackageId: number;
    PackageName: string;
    Description: string;
    PersonType: number;
    CategoryLimit: number;
    IsCustomizable: boolean;
    IsActive: boolean;
}
```

### Template (package-list.page.html)

```html
<!-- Filter Panel -->
<div class="card mb-3">
    <div class="card-body">
        <div class="row">
            <div class="col-md-4">
                <label>Package Name</label>
                <input type="text" class="form-control" 
                       [(ngModel)]="filterModel.PackageName">
            </div>
            <div class="col-md-4">
                <label>Status</label>
                <select class="form-control" [(ngModel)]="filterModel.IsActive">
                    <option value="">All</option>
                    <option [ngValue]="true">Active</option>
                    <option [ngValue]="false">Inactive</option>
                </select>
            </div>
            <div class="col-md-4 d-flex align-items-end">
                <button class="btn btn-primary" (click)="search()">Search</button>
                <button class="btn btn-secondary ms-2" 
                        (click)="dataSource.resetFilters()">Clear</button>
            </div>
        </div>
    </div>
</div>

<!-- Data Table -->
<div class="table-responsive">
    <table class="table table-bordered table-hover" [ldsTable]="dataSource">
        <thead>
            <tr class="thead-dark">
                <th lds-th="PackageId"></th>
                <th lds-th="PackageName"></th>
                <th lds-th="Description"></th>
                <th lds-th="PersonType"></th>
                <th lds-th="CategoryLimit"></th>
                <th lds-th="IsCustomizable"></th>
                <th lds-th="IsActive"></th>
                <th style="width: 150px">Actions</th>
            </tr>
        </thead>
        <tbody>
            <tr *ngFor="let item of dataSource.items; trackBy: trackByFn">
                <td lds-td="PackageId">{{ item.PackageId }}</td>
                <td lds-td="PackageName">{{ item.PackageName }}</td>
                <td lds-td="Description">{{ item.Description }}</td>
                <td lds-td="PersonType">{{ item.PersonType }}</td>
                <td lds-td="CategoryLimit">{{ item.CategoryLimit }}</td>
                <td lds-td="IsCustomizable">
                    <input type="checkbox" [checked]="item.IsCustomizable" disabled>
                </td>
                <td lds-td="IsActive">
                    <span *ngIf="item.IsActive" class="badge bg-success">Active</span>
                    <span *ngIf="!item.IsActive" class="badge bg-danger">Inactive</span>
                </td>
                <td>
                    <button class="btn btn-sm btn-primary" 
                            (click)="editPackage(item)">
                        Edit
                    </button>
                    <button class="btn btn-sm btn-danger ms-1" 
                            (click)="deletePackage(item)">
                        Delete
                    </button>
                </td>
            </tr>
        </tbody>
    </table>
    
    <!-- Empty State -->
    <div *ngIf="!dataSource.isLoading && !dataSource.hasData" 
         class="alert alert-info text-center">
        No items found
    </div>
</div>

<!-- Pagination -->
<lds-grid-pager [dataSource]="dataSource"></lds-grid-pager>
```

---

## Example 2: Infinite Scroll List

**Use Case:** Article/blog list with "Load More" button (like social media feeds).

### Component (article-list.page.ts)

```typescript
import { Component, OnInit, OnDestroy } from '@angular/core';
import { ListDataSource, ListDataSourceProvider, LdsField } from 'src/list-data-source';
import { DomSanitizer } from '@angular/platform-browser';

@Component({
    selector: 'article-list-page',
    templateUrl: 'article-list.page.html'
})
export class ArticleListPageComponent implements OnInit, OnDestroy {
    dataSource: ListDataSource<CmsArticleDto>;
    referenceList: ReferenceDto[];
    cat2List: CategoryDto[];

    constructor(
        private ldsProvider: ListDataSourceProvider,
        private sanitizer: DomSanitizer,
        private http: HttpService
    ) {
        this.dataSource = this.ldsProvider.getRemoteDataSource(
            'api/public/article/list',
            'PublicArticleList'
        );
        
        this.dataSource.setPageSize(10);  // Load 10 articles at a time
        this.dataSource.setFields(this.createDsFields());
        this.dataSource.state.sort1Name = 'PublishDate';
        this.dataSource.state.sort1Dir = 'desc';
        
        // Sanitize HTML summaries
        this.dataSource.onDataLoaded.subscribe(data => {
            data.items.forEach((item: CmsArticleDto) => {
                if (item.Summary) {
                    item.Summary_Html = this.sanitizer.bypassSecurityTrustHtml(item.Summary);
                }
            });
        });
    }

    ngOnInit(): void {
        this.loadFilters();
        if (!this.dataSource.hasData) {
            this.dataSource.reload();
        }
    }

    ngOnDestroy(): void {
        this.dataSource.dispose();
    }
    
    trackByArticleId(index: number, article: CmsArticleDto): string | number {
        return article.Id || article.ArticleId || index;
    }
    
    get filterModel(): any {
        return this.dataSource.filters;
    }
    
    search() {
        this.dataSource.search();  // Resets to page 0 and reloads
    }
    
    loadFilters() {
        this.http.get('api/public/article/list/PageData', {
            success: result => {
                this.referenceList = result.Data.ReferenceList;
                this.cat2List = result.Data.Cat2List;
            }
        });
    }
    
    createDsFields(): LdsField[] {
        return [
            new LdsField('ArticleId', 'ID', 'number'),
            new LdsField('Id', 'Id', 'string', false),
            new LdsField('Title', 'Title', 'string'),
            new LdsField('PublishDate', 'Publish Date', 'string'),
            new LdsField('UpdateDate', 'Update Date', 'string'),
            new LdsField('ReferenceId', 'Reference', 'number'),
            new LdsField('UserId', 'Author', 'number'),
            new LdsField('IsFree', 'Free', 'boolean'),
            new LdsField('ArticleStatus', 'Status', 'number'),
        ];
    }
}

interface CmsArticleDto {
    ArticleId: number;
    Id: string;
    Title: string;
    Summary: string;
    Summary_Html?: any;
    PublishDate: string;
    ReferenceName: string;
    ViewCount: number;
    AccessDenied: boolean;
    Attachments?: any[];
}
```

### Template (article-list.page.html)

```html
<div class="container">
    <!-- Filters -->
    <div class="card mb-3">
        <div class="card-body">
            <div class="row">
                <div class="col-md-4">
                    <label>Reference</label>
                    <select class="form-control" [(ngModel)]="filterModel.ReferenceId">
                        <option value="">All</option>
                        <option *ngFor="let item of referenceList" [ngValue]="item.ReferenceId">
                            {{ item.ReferenceName }}
                        </option>
                    </select>
                </div>
                <div class="col-md-4">
                    <label>Category</label>
                    <select class="form-control" [(ngModel)]="filterModel.CatId2">
                        <option value="">All</option>
                        <option *ngFor="let item of cat2List" [ngValue]="item.CategoryId">
                            {{ item.CategoryName }}
                        </option>
                    </select>
                </div>
                <div class="col-md-4">
                    <label>Search</label>
                    <input type="text" class="form-control" 
                           [(ngModel)]="filterModel.TextQuery"
                           placeholder="Keyword...">
                </div>
            </div>
            <div class="text-end mt-3">
                <button class="btn btn-secondary" (click)="search()">Search</button>
            </div>
        </div>
    </div>

    <!-- Empty State -->
    <div *ngIf="!dataSource.isLoading && !dataSource.hasData" 
         class="alert alert-info text-center">
        No articles found
    </div>

    <!-- Articles (Multi-page rendering) -->
    <div *ngFor="let page of dataSource.pages; trackBy: dataSource.trackByPageIndex">
        <ng-container *ngFor="let article of page.items; trackBy: trackByArticleId">
            <div class="card mb-3">
                <div class="card-body">
                    <div class="d-flex justify-content-between mb-2">
                        <h4>
                            <a routerLink="/article/view/{{ article.Id }}">
                                {{ article.Title }}
                            </a>
                        </h4>
                        <span *ngIf="article.AccessDenied" class="badge bg-warning">
                            Premium
                        </span>
                    </div>
                    <div *ngIf="article.Summary_Html" 
                         [innerHTML]="article.Summary_Html" 
                         class="my-3">
                    </div>
                </div>
                <div class="card-footer">
                    <div class="row text-muted small">
                        <div class="col-md-4">
                            <strong>Reference:</strong> {{ article.ReferenceName }}
                        </div>
                        <div class="col-md-4">
                            <strong>Date:</strong> {{ article.PublishDate | date }}
                        </div>
                        <div class="col-md-4">
                            <strong>Views:</strong> {{ article.ViewCount }}
                        </div>
                    </div>
                </div>
            </div>
        </ng-container>
    </div>

    <!-- Load More Button -->
    <div class="text-center mb-5">
        <button class="btn btn-outline-info" 
                style="min-width: 10rem;"
                (click)="dataSource.loadNextPage()"
                *ngIf="!dataSource.isLastPage" 
                [disabled]="dataSource.isLoading">
            Load More
        </button>
    </div>
</div>
```

---

## Example 3: Log Table with Time Filters

**Use Case:** Admin log viewer with timeframe filtering and charts.

### Component (log-api-list.page.ts)

```typescript
import { Component, OnInit, OnDestroy } from '@angular/core';
import { ListDataSource, ListDataSourceProvider, LdsField } from 'src/list-data-source';

@Component({
    selector: 'log-api-list-page',
    templateUrl: 'log-api-list.page.html'
})
export class LogApiListPageComponent implements OnInit, OnDestroy {
    dataSource: ListDataSource<any>;
    timeFrameList: TimeFrameModel[];
    timeFrameItem: TimeFrameModel;
    activeTabId: number;

    constructor(
        private ldsProvider: ListDataSourceProvider,
        private sharedService: SharedService,
        private http: HttpService
    ) {
        this.dataSource = this.ldsProvider.getRemoteDataSource(
            'api/admin/Logs/ApiList',
            'AdminTrackApiListGrid'
        );
        
        this.dataSource.setPageSize(50);
        this.dataSource.setFields(this.createDsFields());
        
        // Set log type filter
        this.dataSource.filters.LogType = 'api';
        this.dataSource.onDataLoading.subscribe(filters => {
            filters.LogType = 'api';  // Ensure filter is always sent
        });
        
        // Setup timeframe
        this.timeFrameList = this.sharedService.createLogTimeFrames()
            .filter(x => x.DateNumber == 0);
        this.timeFrameItem = this.timeFrameList[2];
        this.dataSource.filters.TimeFrame = this.timeFrameItem.TimeFrame;
    }

    ngOnInit(): void {
        this.search();
    }

    ngOnDestroy() {
        this.dataSource.dispose();
    }
    
    trackByFn(index: number, item: any): number {
        return item.Id || index;
    }
    
    get filterModel(): any {
        return this.dataSource.filters;
    }
    
    search() {
        this.dataSource.reload();
        if (this.activeTabId > 20) {
            this.loadCharts();
        }
    }
    
    loadCharts() {
        // Load chart data...
    }
    
    createDsFields(): LdsField[] {
        return [
            new LdsField('Id', 'Id', 'number'),
            new LdsField('ActorName', 'ActorName', 'string'),
            new LdsField('SubscriptionId', 'SubscriptionId', 'number'),
            new LdsField('CreateDateTime', 'Time', 'datetime'),
            new LdsField('RequestId', 'RequestId', 'string'),
            new LdsField('IpAddress', 'IpAddress', 'string'),
            new LdsField('PageId', 'PageId', 'number'),
            new LdsField('ActionId', 'ActionId', 'number'),
            new LdsField('UrlPath', 'Url/QueryString', 'string'),
            new LdsField('Body', 'Body', 'string'),
        ];
    }
}
```

---

## Example 4: Local Data Source

**Use Case:** Client-side filtering/sorting of in-memory data.

### Component

```typescript
import { Component, OnInit, OnDestroy } from '@angular/core';
import { ListDataSource, ListDataSourceProvider, LdsField } from 'src/list-data-source';

@Component({
    selector: 'local-grid',
    templateUrl: 'local-grid.html'
})
export class LocalGridComponent implements OnInit, OnDestroy {
    dataSource: ListDataSource<Product>;

    constructor(private ldsProvider: ListDataSourceProvider) {
        this.dataSource = this.ldsProvider.getLocalDataSource('MyLocalProducts');
        this.dataSource.setFields([
            new LdsField('Id', 'ID', 'number'),
            new LdsField('Name', 'Name', 'string'),
            new LdsField('Price', 'Price', 'number'),
            new LdsField('InStock', 'In Stock', 'boolean'),
        ]);
    }

    ngOnInit(): void {
        // Load data from service/API
        const products = this.getProducts();
        
        // Set ALL items (local data source handles pagination/sorting)
        this.dataSource.setSourceItems(products);
    }

    ngOnDestroy() {
        this.dataSource.dispose();
    }
    
    trackByFn(index: number, item: Product): number {
        return item.Id || index;
    }
    
    getProducts(): Product[] {
        return [
            { Id: 1, Name: 'Product A', Price: 100, InStock: true },
            { Id: 2, Name: 'Product B', Price: 200, InStock: false },
            { Id: 3, Name: 'Product C', Price: 150, InStock: true },
            // ... more items
        ];
    }
}

interface Product {
    Id: number;
    Name: string;
    Price: number;
    InStock: boolean;
}
```

### Template

```html
<table class="table" [ldsTable]="dataSource">
    <thead>
        <tr>
            <th lds-th="Id"></th>
            <th lds-th="Name"></th>
            <th lds-th="Price"></th>
            <th lds-th="InStock"></th>
        </tr>
    </thead>
    <tbody>
        <tr *ngFor="let item of dataSource.items; trackBy: trackByFn">
            <td lds-td="Id">{{ item.Id }}</td>
            <td lds-td="Name">{{ item.Name }}</td>
            <td lds-td="Price">{{ item.Price | currency }}</td>
            <td lds-td="InStock">
                <span *ngIf="item.InStock" class="badge bg-success">Yes</span>
                <span *ngIf="!item.InStock" class="badge bg-danger">No</span>
            </td>
        </tr>
    </tbody>
</table>

<lds-grid-pager [dataSource]="dataSource"></lds-grid-pager>
```

---

## Example 5: OnPush Change Detection

**Use Case:** High-performance table with optimized change detection.

```typescript
import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { ListDataSource, ListDataSourceProvider, LdsField } from 'src/list-data-source';

@Component({
    selector: 'optimized-table',
    templateUrl: 'optimized-table.html',
    changeDetection: ChangeDetectionStrategy.OnPush  // ← OnPush
})
export class OptimizedTableComponent implements OnInit, OnDestroy {
    dataSource: ListDataSource<User>;

    constructor(
        private ldsProvider: ListDataSourceProvider,
        private cdr: ChangeDetectorRef  // ← Inject ChangeDetectorRef
    ) {
        this.dataSource = this.ldsProvider.getRemoteDataSource(
            'api/users',
            'UserList'
        );
        this.dataSource.setFields(this.createFields());
        
        // Trigger change detection manually when data loads
        this.dataSource.onDataLoaded.subscribe(data => {
            this.cdr.markForCheck();  // ← Mark for check
        });
        
        this.dataSource.onPaginationChanged.subscribe(() => {
            this.cdr.markForCheck();  // ← Mark for check
        });
    }

    ngOnInit(): void {
        this.dataSource.reload();
    }

    ngOnDestroy() {
        this.dataSource.dispose();
    }
    
    trackByFn(index: number, user: User): number {
        return user.Id || index;
    }
    
    createFields(): LdsField[] {
        return [
            new LdsField('Id', 'ID', 'number'),
            new LdsField('Name', 'Name', 'string'),
            new LdsField('Email', 'Email', 'string'),
        ];
    }
}
```

---

## See Also

- [Quick Start](./01-QUICK-START.md)
- [Table Components](./10-TABLE-COMPONENTS.md)
- [Performance](./13-PERFORMANCE.md)
- [API Reference](./16-API-REFERENCE.md)
- [Common Patterns](./17-COMMON-PATTERNS.md)

