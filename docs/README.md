# ListDataSource Documentation 📚

Welcome to the **ListDataSource** documentation! This library provides a powerful, framework-independent data management system for tables, lists, and grids in Angular applications.

---

## 📖 Table of Contents

### Getting Started
- [Quick Start Guide](./01-QUICK-START.md) - Get up and running in 5 minutes
- [Installation & Setup](./02-INSTALLATION.md) - Module setup and middleware configuration
- [Middleware Guide](./20-MIDDLEWARE-GUIDE.md) - Deep dive into middleware patterns ⭐

### Core Concepts
- [Basic Usage](./03-BASIC-USAGE.md) - Understanding the fundamentals
- [Data Source Types](./04-DATA-SOURCE-TYPES.md) - Remote vs Local data sources
- [Field Management](./05-FIELD-MANAGEMENT.md) - Defining and managing fields

### Features
- [Pagination](./06-PAGINATION.md) - Page navigation and configuration
- [Sorting](./07-SORTING.md) - Single and multi-column sorting
- [Filtering](./08-FILTERING.md) - Search and filter capabilities
- [State Management](./09-STATE-MANAGEMENT.md) - Caching and persistence

### Component API
- [Table Components](./10-TABLE-COMPONENTS.md) - lds-th, lds-td, ldsTable, lds-sort-bar
- [Grid Pager](./11-GRID-PAGER.md) - Pagination UI component
- [Grid Sorter](./12-GRID-SORTER.md) - Column sorting UI

### Advanced
- [Performance Optimization](./13-PERFORMANCE.md) - TrackBy, OnPush, and best practices
- [Custom Events](./14-EVENTS.md) - Handling data events
- [Memory Management](./15-MEMORY-MANAGEMENT.md) - Preventing leaks with dispose()
- [API Reference](./16-API-REFERENCE.md) - Complete method and property reference

### Patterns & Examples
- [Advanced Patterns](./17-ADVANCED-PATTERNS.md) - Complex scenarios and techniques
- [Real-World Examples](./18-EXAMPLES.md) - Complete implementation examples
- [Migration Guide](./19-MIGRATION-GUIDE.md) - Upgrading from old directives

---

## 🚀 Quick Example

```typescript
// Component
import { ListDataSource, ListDataSourceProvider, LdsField } from 'src/list-data-source';

@Component({
    selector: 'my-page',
    templateUrl: 'my-page.html'
})
export class MyPageComponent implements OnInit, OnDestroy {
    dataSource: ListDataSource<MyDto>;
    
    constructor(private ldsProvider: ListDataSourceProvider) {
        this.dataSource = this.ldsProvider.getRemoteDataSource(
            'api/my-endpoint',
            'MyDataSourceId'
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
    
    trackByFn(index: number, item: MyDto): number {
        return item.Id || index;
    }
    
    createFields(): LdsField[] {
        return [
            new LdsField('Id', 'ID', 'number'),
            new LdsField('Name', 'Name', 'string'),
            new LdsField('Date', 'Date', 'datetime'),
        ];
    }
}
```

```html
<!-- Template -->
<table class="table" [ldsTable]="dataSource">
    <thead>
        <tr>
            <th lds-th="Id"></th>
            <th lds-th="Name"></th>
            <th lds-th="Date"></th>
        </tr>
    </thead>
    <tbody>
        <tr *ngFor="let item of dataSource.items; trackBy: trackByFn">
            <td lds-td="Id">{{ item.Id }}</td>
            <td lds-td="Name">{{ item.Name }}</td>
            <td lds-td="Date">{{ item.Date | localDate }}</td>
        </tr>
    </tbody>
</table>

<lds-grid-pager [dataSource]="dataSource"></lds-grid-pager>
```

---

## ✨ Key Features

- ✅ **Remote & Local Data** - Fetch from API or work with in-memory arrays
- ✅ **Pagination** - Built-in pagination with customizable page sizes
- ✅ **Sorting** - Single and multi-column sorting support
- ✅ **Filtering** - Flexible filter management
- ✅ **State Persistence** - Automatic caching in localStorage/sessionStorage
- ✅ **Framework Independent** - Custom event system (no RxJS dependency)
- ✅ **Memory Safe** - Built-in dispose() prevents memory leaks
- ✅ **Performance Optimized** - Built-in trackBy functions
- ✅ **Component API** - Modern Angular components (lds-th, lds-td, lds-sort-bar)
- ✅ **TypeScript** - Full type safety and IntelliSense support

---

## 🎯 Use Cases

### Data Tables
```html
<table [ldsTable]="dataSource">
    <!-- Sortable columns with auto-titles -->
    <th lds-th="Name"></th>
    <th lds-th="Date"></th>
</table>
```

### Infinite Scroll Lists
```html
<div *ngFor="let page of dataSource.pages; trackBy: dataSource.trackByPageIndex">
    <div *ngFor="let item of page.items; trackBy: trackByFn">
        <!-- Item card -->
    </div>
</div>
<button (click)="dataSource.loadNextPage()" *ngIf="!dataSource.isLastPage">
    Load More
</button>
```

### Admin Grids
```html
<table [ldsTable]="dataSource">
    <thead>
        <tr>
            <th lds-th="Id"></th>
            <th lds-th="Name"></th>
            <th>Actions</th>
        </tr>
    </thead>
    <tbody>
        <tr *ngFor="let row of dataSource.items; trackBy: trackByFn">
            <td lds-td="Id">{{ row.Id }}</td>
            <td lds-td="Name">{{ row.Name }}</td>
            <td>
                <button (click)="edit(row)">Edit</button>
                <button (click)="delete(row)">Delete</button>
            </td>
        </tr>
    </tbody>
</table>
<lds-grid-pager [dataSource]="dataSource"></lds-grid-pager>
```

---

## 📊 Architecture

```
ListDataSource
├── Data Management
│   ├── Remote Data (API calls)
│   ├── Local Data (in-memory)
│   └── Multi-page Caching
├── State Management
│   ├── Pagination State
│   ├── Sort State
│   └── Filter State
├── Field Management
│   ├── Field Definitions
│   ├── Visibility Control
│   └── Sort Configuration
├── Events (Framework-Independent)
│   ├── onDataRequested
│   ├── onDataLoading
│   ├── onDataLoaded
│   ├── onSortChanged
│   └── onPaginationChanged
└── Components
    ├── lds-th (Table Header)
    ├── lds-td (Table Cell)
    ├── ldsTable (Table Directive)
    ├── lds-grid-pager (Pagination)
    └── lds-grid-sorter (Sort UI)
```

---

## 🎓 Learning Path

1. **Beginner** - Start here!
   - [Quick Start Guide](./01-QUICK-START.md)
   - [Basic Usage](./03-BASIC-USAGE.md)
   - [Table Components](./10-TABLE-COMPONENTS.md)

2. **Intermediate** - Enhance your skills
   - [Data Source Types](./04-DATA-SOURCE-TYPES.md)
   - [Pagination](./06-PAGINATION.md)
   - [Sorting](./07-SORTING.md)
   - [Filtering](./08-FILTERING.md)

3. **Advanced** - Master the system
   - [Performance Optimization](./13-PERFORMANCE.md)
   - [Custom Events](./14-EVENTS.md)
   - [Memory Management](./15-MEMORY-MANAGEMENT.md)
   - [API Reference](./16-API-REFERENCE.md)

---

## 🆘 Need Help?

- **Advanced Scenarios?** Check [Advanced Patterns](./17-ADVANCED-PATTERNS.md)
- **Complete Examples?** See [Real-World Examples](./18-EXAMPLES.md)
- **Upgrading?** Read [Migration Guide](./19-MIGRATION-GUIDE.md)
- **API Reference?** View [API Reference](./16-API-REFERENCE.md)

---

## 📝 Version

**Current Version:** 2.0  
**Last Updated:** October 2025  
**Status:** Production Ready ✅

---

## 🎉 Getting Started

Ready to dive in? Start with the [Quick Start Guide](./01-QUICK-START.md)!

