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
new LdsField('name', 'Name', 'string', true, true)  // orderable
dataSource.state.order1Name

// New (v2.1.0)
new LdsField('name', 'Name', 'string', true, true)  // sortable
dataSource.state.sort1Name
```

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

---

## Documentation

- [Quick Start Guide](https://github.com/arp0d3v/lds-angular/blob/main/docs/01-QUICK-START.md)
- [Component API](https://github.com/arp0d3v/lds-angular/blob/main/docs/10-TABLE-COMPONENTS.md)
- [Performance Guide](https://github.com/arp0d3v/lds-angular/blob/main/docs/13-PERFORMANCE.md)
- [Examples](https://github.com/arp0d3v/lds-angular/blob/main/docs/18-EXAMPLES.md)

---

## Routing Support

Enable URL-based state management for shareable links and browser back/forward support:

```typescript
// In your component
this.dataSource = this.ldsProvider.getRemoteDataSource('api/users', 'UserList', {
    useRouting: true,  // Enable routing
    pagination: {
        enabled: true,
        pageSize: 20
    }
});

// Apply query params from route
this.route.queryParams.subscribe(params => {
    this.dataSource.applyQueryParams(params);
    this.dataSource.reload();
});
```

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

