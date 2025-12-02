# Quick Start Guide 🚀

Get up and running with ListDataSource in 5 minutes!

---

## Step 1: Create a Component (1 min)

```typescript
import { Component, OnInit, OnDestroy } from '@angular/core';
import { ListDataSource, ListDataSourceProvider, LdsField } from 'src/list-data-source';

@Component({
    selector: 'user-list',
    templateUrl: 'user-list.html'
})
export class UserListComponent implements OnInit, OnDestroy {
    dataSource: ListDataSource<User>;
    
    constructor(private ldsProvider: ListDataSourceProvider) {
        // Create a remote data source
        this.dataSource = this.ldsProvider.getRemoteDataSource(
            'api/users/list',  // API endpoint
            'UserListGrid'     // Unique ID for state caching
        );
        
        // Configure
        this.dataSource.setPageSize(20);
        this.dataSource.setFields(this.createFields());
    }
    
    ngOnInit() {
        this.dataSource.reload();  // Load data
    }
    
    ngOnDestroy() {
        this.dataSource.dispose();  // Prevent memory leaks
    }
    
    trackByFn(index: number, user: User): number {
        return user.UserId || index;
    }
    
    createFields(): LdsField[] {
        return [
            new LdsField('UserId', 'ID', 'number'),
            new LdsField('UserName', 'Username', 'string'),
            new LdsField('Email', 'Email', 'string'),
            new LdsField('CreateDate', 'Created', 'datetime'),
        ];
    }
}

interface User {
    UserId: number;
    UserName: string;
    Email: string;
    CreateDate: string;
}
```

---

## Step 2: Create the Template (2 min)

```html
<!-- user-list.html -->

<!-- Filters (Optional) -->
<div class="card mb-3">
    <div class="card-body">
        <input type="text" 
               class="form-control" 
               [(ngModel)]="dataSource.filters.Search"
               placeholder="Search...">
        <button (click)="dataSource.reload()">Search</button>
    </div>
</div>

<!-- Table -->
<table class="table table-bordered" [ldsTable]="dataSource">
    <thead>
        <tr>
            <th lds-th="UserId"></th>
            <th lds-th="UserName"></th>
            <th lds-th="Email"></th>
            <th lds-th="CreateDate"></th>
        </tr>
    </thead>
    <tbody>
        <tr *ngFor="let user of dataSource.items; trackBy: trackByFn">
            <td lds-td="UserId">{{ user.UserId }}</td>
            <td lds-td="UserName">{{ user.UserName }}</td>
            <td lds-td="Email">{{ user.Email }}</td>
            <td lds-td="CreateDate">{{ user.CreateDate | date }}</td>
        </tr>
    </tbody>
</table>

<!-- Empty State -->
<div *ngIf="!dataSource.isLoading && !dataSource.hasData" 
     class="alert alert-info">
    No users found
</div>

<!-- Pagination -->
<lds-grid-pager [dataSource]="dataSource"></lds-grid-pager>
```

---

## Step 3: Backend API (2 min)

Your API should return data in this format:

```json
{
    "items": [
        {
            "UserId": 1,
            "UserName": "john_doe",
            "Email": "john@example.com",
            "CreateDate": "2024-01-15T10:30:00"
        },
        {
            "UserId": 2,
            "UserName": "jane_smith",
            "Email": "jane@example.com",
            "CreateDate": "2024-01-16T14:20:00"
        }
    ],
    "total": 150
}
```

**Request Parameters** (sent automatically):
- `pageIndex` - Current page (0-based)
- `pageSize` - Items per page
- `sort1Name` - Sort column
- `sort1Dir` - Sort direction ('asc' or 'desc')
- Plus any custom filters you add to `dataSource.filters`

**⚠️ Note:** In v2.1.0, `order1Name`/`order1Dir` were renamed to `sort1Name`/`sort1Dir` for consistency.

---

## 🎉 Done! You now have:

✅ **Sortable columns** - Click headers to sort  
✅ **Pagination** - Navigate through pages  
✅ **Filtering** - Custom search filters  
✅ **State caching** - Page/sort state saved in localStorage  
✅ **Memory safe** - Automatic cleanup with dispose()  
✅ **Performance optimized** - Using trackBy functions  

---

## 🎯 Common Patterns

### Pattern 1: Simple Data Table

**Use When:** You have a basic table with pagination

```typescript
// Component
this.dataSource = this.ldsProvider.getRemoteDataSource('api/items', 'ItemList');
this.dataSource.setPageSize(20);
this.dataSource.setFields(this.createFields());
this.dataSource.reload();
```

```html
<!-- Template -->
<table [ldsTable]="dataSource">
    <thead><tr><th lds-th="Name"></th></tr></thead>
    <tbody>
        <tr *ngFor="let item of dataSource.items; trackBy: trackByFn">
            <td lds-td="Name">{{ item.Name }}</td>
        </tr>
    </tbody>
</table>
<lds-grid-pager [dataSource]="dataSource"></lds-grid-pager>
```

---

### Pattern 2: Infinite Scroll List

**Use When:** You want "Load More" instead of page numbers

```typescript
// Component (same setup)
this.dataSource.setPageSize(10);  // Load 10 at a time
```

```html
<!-- Template -->
<div *ngFor="let page of dataSource.pages; trackBy: dataSource.trackByPageIndex">
    <div *ngFor="let item of page.items; trackBy: trackByFn">
        <div class="card">{{ item.Name }}</div>
    </div>
</div>

<button (click)="dataSource.loadNextPage()" 
        *ngIf="!dataSource.isLastPage"
        [disabled]="dataSource.isLoading">
    Load More
</button>
```

---

### Pattern 3: Local Data (No API)

**Use When:** You have data in memory

```typescript
// Component
this.dataSource = this.ldsProvider.getLocalDataSource('MyLocalData');
this.dataSource.setFields(this.createFields());

// Load data
const items = [
    { Id: 1, Name: 'Item 1' },
    { Id: 2, Name: 'Item 2' },
    { Id: 3, Name: 'Item 3' }
];
this.dataSource.setSourceItems(items);
```

```html
<!-- Template (same as remote) -->
<table [ldsTable]="dataSource">
    <tr *ngFor="let item of dataSource.items; trackBy: trackByFn">
        <td lds-td="Name">{{ item.Name }}</td>
    </tr>
</table>
```

---

## 📚 Next Steps

Now that you have the basics:

1. **Add Sorting** → [Sorting Guide](./07-SORTING.md)
2. **Add Filters** → [Filtering Guide](./08-FILTERING.md)
3. **Optimize Performance** → [Performance Guide](./13-PERFORMANCE.md)
4. **See More Examples** → [Examples](./18-EXAMPLES.md)

---

## 🆘 Troubleshooting

### Data not loading?
- Check API endpoint URL
- Check console for errors
- Verify API returns `{ items: [], total: 0 }` format

### Columns not sortable?
- Make sure you're using `<th lds-th="FieldName">`
- Ensure fields are defined in `createFields()`
- Check that field has `sortable: true` (default)

**⚠️ Note:** In v2.1.0, `orderable` was renamed to `sortable`.

### Memory leaks?
- Always call `dataSource.dispose()` in `ngOnDestroy()`
- Don't subscribe manually to events (use built-in components)

### Performance issues?
- Always use `trackBy` functions in `*ngFor`
- Consider `OnPush` change detection
- See [Performance Guide](./13-PERFORMANCE.md)

---

**Ready for more?** Continue to [Basic Usage](./03-BASIC-USAGE.md)

