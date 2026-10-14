# @arp0d3v/lds-angular

> Angular components and directives for @arp0d3v/lds-core

[![npm version](https://badge.fury.io/js/%40arp0d3v%2Flds-angular.svg)](https://www.npmjs.com/package/@arp0d3v/lds-angular)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Angular 17+ components that provide a beautiful UI layer for [@arp0d3v/lds-core](https://www.npmjs.com/package/@arp0d3v/lds-core) data sources.

---

## Features

- ✅ **Standalone Components** - Modern Angular architecture
- ✅ **lds-th** - Sortable table headers with auto-title display
- ✅ **lds-td** - Visibility-controlled table cells
- ✅ **ldsTable** - Directive for dependency injection
- ✅ **lds-grid-pager** - Beautiful pagination component with routing support
- ✅ **lds-grid-sorter** - Column sorting UI
- ✅ **lds-sort-bar** - Two-column sort chips (v2.2.0)
- ✅ **Routing Integration** - URL-based state management with Angular Router
- ✅ **OnPush Compatible** - Optimized change detection
- ✅ **TypeScript** - Full type safety
- ✅ **55% Less Code** - Compared to traditional directives

---

## Installation

```bash
npm install @arp0d3v/lds-core @arp0d3v/lds-angular
```

Or with yarn:

```bash
yarn add @arp0d3v/lds-core @arp0d3v/lds-angular
```

---

## ⚠️ Breaking Changes in v2.1.0

If you're upgrading from v2.0.0 or earlier:

- **Field Properties:** `orderable` → `sortable`
- **State Properties:** `order1Name`/`order1Dir` → `sort1Name`/`sort1Dir`
- **Requires:** `@arp0d3v/lds-core ^2.1.0`

**Migration:**
```typescript
// Old (v2.0.0)
new LdsField('name', 'Name', 'string', true, true)  // sortable
dataSource.state.sort1Name

// New (v2.1.0)
new LdsField('name', 'Name', 'string', true, true)  // sortable
dataSource.state.sort1Name
```

---

## v2.2.0

Two-column sorting. `lds-sort-bar` adds a second column from the headers, and `setSort2`, `toggleSortLevel`, and `removeSort` do the same in code. Requires `@arp0d3v/lds-core` ^2.2.0.

See [docs/07-SORTING.md](docs/07-SORTING.md).

---

## Quick Start

### 1. Import Module

```typescript
// app.module.ts or shared.module.ts
import { NgModule } from '@angular/core';
import { ListDataSourceModule, ListDataSourceProvider } from '@arp0d3v/lds-angular';
import { AppListDataSourceProvider } from './services/datasource.provider';

@NgModule({
  imports: [
    ListDataSourceModule.forRoot(
      [{ provide: ListDataSourceProvider, useClass: AppListDataSourceProvider }],
      {
        pagination: {
          enabled: true,
          pageSize: 20,
          buttonCount: 7
        },
        sort: {
          defaultDir: 'desc'
        },
        saveState: true,
        cacheType: 'local'
      }
    )
  ],
  exports: [ListDataSourceModule]
})
export class SharedModule { }
```

### 2. Create Component

```typescript
import { Component, OnInit, OnDestroy } from '@angular/core';
import { ListDataSource, LdsField } from '@arp0d3v/lds-core';
import { ListDataSourceProvider } from '@arp0d3v/lds-angular';

@Component({
  selector: 'app-user-list',
  templateUrl: './user-list.component.html'
})
export class UserListComponent implements OnInit, OnDestroy {
  dataSource: ListDataSource<User>;

  constructor(private ldsProvider: ListDataSourceProvider) {
    this.dataSource = this.ldsProvider.getRemoteDataSource(
      'api/users',
      'UserListGrid'
    );
    
    this.dataSource.setPageSize(20);
    this.dataSource.setFields([
      new LdsField('id', 'ID', 'number'),
      new LdsField('name', 'Name', 'string'),
      new LdsField('email', 'Email', 'string'),
      new LdsField('createdAt', 'Created', 'datetime')
    ]);
  }

  ngOnInit() {
    this.dataSource.reload();
  }

  ngOnDestroy() {
    this.dataSource.dispose();
  }

  trackByFn(index: number, user: User): number {
    return user.id || index;
  }
}

interface User {
  id: number;
  name: string;
  email: string;
  createdAt: string;
}
```

### 3. Create Template

```html
<table class="table table-bordered" [ldsTable]="dataSource">
  <thead>
    <tr>
      <th lds-th="id"></th>
      <th lds-th="name"></th>
      <th lds-th="email"></th>
      <th lds-th="createdAt"></th>
    </tr>
  </thead>
  <tbody>
    <tr *ngFor="let user of dataSource.items; trackBy: trackByFn">
      <td lds-td="id">{{ user.id }}</td>
      <td lds-td="name">{{ user.name }}</td>
      <td lds-td="email">{{ user.email }}</td>
      <td lds-td="createdAt">{{ user.createdAt | date }}</td>
    </tr>
  </tbody>
</table>

<lds-grid-pager [dataSource]="dataSource"></lds-grid-pager>
```

---

## Components

### lds-th (Table Header)

Sortable table header component with auto-title display.

```html
<th lds-th="fieldName"></th>
<!-- Automatically displays field title and handles sorting -->
```

### lds-td (Table Cell)

Visibility-controlled table cell component.

```html
<td lds-td="fieldName">{{ item.fieldName }}</td>
<!-- Automatically hidden when field is not visible -->
```

### ldsTable (Directive)

Provides dataSource to all child lds-th and lds-td components via DI.

```html
<table [ldsTable]="dataSource">
  <!-- No need to pass dataSource to each component -->
</table>
```

### lds-grid-pager (Component)

Pagination UI component.

```html
<lds-grid-pager [dataSource]="dataSource"></lds-grid-pager>
```

### lds-grid-sorter (Component)

Sort configuration UI component.

```html
<lds-grid-sorter [dataSource]="dataSource"></lds-grid-sorter>
```

### lds-sort-bar (Component)

Two-column sort chips. A header click sets the first column. The bar adds and removes the second column.

```html
<lds-sort-bar [dataSource]="dataSource"></lds-sort-bar>
```

See [Sorting](docs/07-SORTING.md).

---

## Documentation

- [Quick Start Guide](https://github.com/arp0d3v/lds-angular/blob/main/docs/01-QUICK-START.md)
- [Component API](https://github.com/arp0d3v/lds-angular/blob/main/docs/10-TABLE-COMPONENTS.md)
- [Performance Guide](https://github.com/arp0d3v/lds-angular/blob/main/docs/13-PERFORMANCE.md)
- [Examples](https://github.com/arp0d3v/lds-angular/blob/main/docs/18-EXAMPLES.md)

---

## Routing Support

Enable URL-based state management for shareable links and browser back/forward support:

### Step 1: Enable Routing in Config

```typescript
// In your module or component
this.dataSource = this.ldsProvider.getRemoteDataSource('api/users', 'UserList', {
    useRouting: true,  // Enable routing
    pagination: {
        enabled: true,
        pageSize: 20
    }
});
```

### Step 2: Subscribe to Query Params in Component

**⚠️ REQUIRED:** When `useRouting` is `true`, you must subscribe to route query params:

```typescript
import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ListDataSource } from '@arp0d3v/lds-core';
import { ListDataSourceProvider } from '@arp0d3v/lds-angular';

export class UserListComponent implements OnInit, OnDestroy {
    dataSource: ListDataSource<User>;

    constructor(
        private ldsProvider: ListDataSourceProvider,
        private route: ActivatedRoute  // Required for routing
    ) {
        this.dataSource = this.ldsProvider.getRemoteDataSource('api/users', 'UserList', {
            useRouting: true
        });
    }

    ngOnInit(): void {
        // ⚠️ REQUIRED when useRouting is true
        this.route.queryParams.subscribe(params => {
            this.dataSource.applyQueryParams(params);
            this.dataSource.reload();
        });
    }

    ngOnDestroy(): void {
        this.dataSource.dispose();
    }
}
```

**What this does:**
- Reads query parameters from URL (e.g., `?pageIndex=2&sort1Name=name&Search=john`)
- Applies them to the DataSource filters and pagination
- Reloads data with the applied parameters
- Enables browser back/forward navigation
- Makes URLs shareable with current state

The `lds-grid-pager` component automatically uses `routerLink` when `useRouting` is enabled.

---

## Requirements

- Angular 17.0.0 or higher
- @arp0d3v/lds-core 2.1.0 or higher
- @angular/router (for routing support)

---

## License

MIT © [Arash Pouya](https://github.com/arp0d3v)

---

## Author

**Arash Pouya** ([@arp0d3v](https://github.com/arp0d3v))

C# ASP.NET developer with expertise in Angular, TypeScript, and web development.

---

## Related Packages

- [@arp0d3v/lds-core](https://www.npmjs.com/package/@arp0d3v/lds-core) - Framework-independent core

---

## Support

- 🐛 [Report a bug](https://github.com/arp0d3v/lds-angular/issues)
- 💡 [Request a feature](https://github.com/arp0d3v/lds-angular/issues)
- 📖 [Read the docs](https://github.com/arp0d3v/lds-angular/blob/main/docs/README.md)

