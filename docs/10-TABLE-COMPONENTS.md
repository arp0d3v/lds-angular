# Table Components 📊

Modern Angular components for building sortable, filterable data tables.

---

## Overview

ListDataSource provides three main components for tables:

1. **`lds-th`** - Table header component (sortable columns)
2. **`lds-td`** - Table cell component (visibility control)
3. **`ldsTable`** - Table directive (dependency injection)

---

## Component: `lds-th` (Table Header)

### Basic Usage

```html
<table [ldsTable]="dataSource">
    <thead>
        <tr>
            <th lds-th="FieldName"></th>
        </tr>
    </thead>
</table>
```

### Features

✅ **Auto-Title Display** - Automatically shows field title from field definition  
✅ **Sortable** - Click to sort (if field is sortable)  
✅ **Visual Indicators** - Shows sort direction with icons  
✅ **Visibility Control** - Hides when field is not visible  

### Syntax Options

#### Option 1: Attribute Syntax (Recommended)

```html
<th lds-th="UserName"></th>
```

**Pros:**
- Clean and concise
- Auto-displays title from field definition
- Less repetition

#### Option 2: Explicit Content

```html
<th lds-th="UserName">Username</th>
```

**Pros:**
- Custom display text
- Override field title

#### Option 3: With DataSource Binding

```html
<th lds-th="UserName" [dataSource]="dataSource"></th>
```

**When to use:** If not using `[ldsTable]` directive on table

---

## Component: `lds-td` (Table Cell)

### Basic Usage

```html
<tbody>
    <tr *ngFor="let item of dataSource.items; trackBy: trackByFn">
        <td lds-td="FieldName">{{ item.FieldName }}</td>
    </tr>
</tbody>
```

### Features

✅ **Visibility Control** - Automatically hidden when field is invisible  
✅ **Consistent Behavior** - Matches header visibility  
✅ **Flexible Content** - Can contain any HTML  

### Syntax Options

#### Option 1: Simple Content

```html
<td lds-td="UserName">{{ item.UserName }}</td>
```

#### Option 2: Complex Content

```html
<td lds-td="User">
    <div class="user-card">
        <img [src]="item.Avatar">
        <span>{{ item.UserName }}</span>
    </div>
</td>
```

#### Option 3: Conditional Rendering

```html
<td lds-td="Status">
    <span *ngIf="item.IsActive" class="badge badge-success">Active</span>
    <span *ngIf="!item.IsActive" class="badge badge-danger">Inactive</span>
</td>
```

---

## Directive: `ldsTable`

### Purpose

Provides `dataSource` to all `lds-th` and `lds-td` components via dependency injection.

### Basic Usage

```html
<table [ldsTable]="dataSource">
    <!-- No need to pass dataSource to each component -->
    <th lds-th="Name"></th>
    <td lds-td="Name">{{ item.Name }}</td>
</table>
```

### Without `ldsTable`

If you don't use the directive, you must pass `dataSource` to each component:

```html
<table>
    <th lds-th="Name" [dataSource]="dataSource"></th>
    <td lds-td="Name" [dataSource]="dataSource">{{ item.Name }}</td>
</table>
```

**Recommendation:** Always use `[ldsTable]` to avoid repetition.

---

## Complete Example

```typescript
// Component
import { Component, OnInit, OnDestroy } from '@angular/core';
import { ListDataSource, ListDataSourceProvider, LdsField } from 'src/list-data-source';

@Component({
    selector: 'user-table',
    templateUrl: 'user-table.html'
})
export class UserTableComponent implements OnInit, OnDestroy {
    dataSource: ListDataSource<User>;
    
    constructor(private ldsProvider: ListDataSourceProvider) {
        this.dataSource = this.ldsProvider.getRemoteDataSource(
            'api/users',
            'UserTable'
        );
        this.dataSource.setPageSize(20);
        this.dataSource.setFields([
            new LdsField('UserId', 'ID', 'number'),
            new LdsField('UserName', 'Username', 'string'),
            new LdsField('Email', 'Email', 'string'),
            new LdsField('IsActive', 'Status', 'boolean'),
            new LdsField('CreateDate', 'Created', 'datetime'),
        ]);
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
}

interface User {
    UserId: number;
    UserName: string;
    Email: string;
    IsActive: boolean;
    CreateDate: string;
}
```

```html
<!-- Template -->
<table class="table table-bordered table-hover" [ldsTable]="dataSource">
    <thead>
        <tr class="thead-dark">
            <th lds-th="UserId"></th>
            <th lds-th="UserName"></th>
            <th lds-th="Email"></th>
            <th lds-th="IsActive"></th>
            <th lds-th="CreateDate"></th>
            <th>Actions</th>
        </tr>
    </thead>
    <tbody>
        <tr *ngFor="let user of dataSource.items; trackBy: trackByFn">
            <td lds-td="UserId">{{ user.UserId }}</td>
            <td lds-td="UserName">
                <strong>{{ user.UserName }}</strong>
            </td>
            <td lds-td="Email">
                <a href="mailto:{{ user.Email }}">{{ user.Email }}</a>
            </td>
            <td lds-td="IsActive">
                <span *ngIf="user.IsActive" class="badge badge-success">Active</span>
                <span *ngIf="!user.IsActive" class="badge badge-danger">Inactive</span>
            </td>
            <td lds-td="CreateDate">
                {{ user.CreateDate | date:'short' }}
            </td>
            <td>
                <!-- Actions column doesn't need lds-td -->
                <button (click)="edit(user)">Edit</button>
                <button (click)="delete(user)">Delete</button>
            </td>
        </tr>
    </tbody>
</table>

<!-- Pagination -->
<lds-grid-pager [dataSource]="dataSource"></lds-grid-pager>
```

---

## Advanced Features

### 1. Controlling Field Visibility

```typescript
// Hide/show columns dynamically
this.dataSource.field('Email').visible = false;  // Hide email column
this.dataSource.field('Email').visible = true;   // Show email column
```

Both `lds-th` and `lds-td` automatically respond to visibility changes.

### 2. Custom Sort Columns

```typescript
// Field definition with custom sort column
new LdsField(
    'UserName',        // Display field
    'Username',        // Title
    'string',          // Type
    true,              // Visible
    true,              // Sortable
    'User.Name'        // Sort by this column in SQL
)
```

### 3. Non-sortable Columns

```typescript
// Make a column non-sortable
new LdsField('Actions', 'Actions', 'string', true, false)
```

Or in template (actions column):
```html
<th>Actions</th>  <!-- No lds-th, not sortable -->
```

### 4. Conditional Visibility

```typescript
// Show field based on condition
const emailField = this.dataSource.field('Email');
emailField.visible = this.currentUser.IsAdmin;
```

---

## Styling

### Default Classes

Components apply these classes automatically:

**`lds-th`:**
- `.lds-th-sortable` - When column is sortable
- `.lds-th-sorted-asc` - When sorted ascending
- `.lds-th-sorted-desc` - When sorted descending

**`lds-td`:**
- (No default classes, use your own)

### Custom Styling

```css
/* Hover effect for sortable headers */
th[lds-th].lds-th-sortable {
    cursor: pointer;
    user-select: none;
}

th[lds-th].lds-th-sortable:hover {
    background-color: #f0f0f0;
}

/* Sort indicator */
th[lds-th].lds-th-sorted-asc::after {
    content: ' ▲';
}

th[lds-th].lds-th-sorted-desc::after {
    content: ' ▼';
}
```

---

## Common Patterns

### Pattern 1: ID Column (Hidden by Default)

```typescript
new LdsField('UserId', 'ID', 'number', false)  // visible: false
```

```html
<th lds-th="UserId"></th>  <!-- Hidden initially -->
<td lds-td="UserId">{{ item.UserId }}</td>
```

### Pattern 2: Actions Column (Not Data-Bound)

```html
<thead>
    <tr>
        <th lds-th="Name"></th>
        <th>Actions</th>  <!-- No lds-th -->
    </tr>
</thead>
<tbody>
    <tr *ngFor="let item of dataSource.items; trackBy: trackByFn">
        <td lds-td="Name">{{ item.Name }}</td>
        <td>  <!-- No lds-td -->
            <button (click)="edit(item)">Edit</button>
        </td>
    </tr>
</tbody>
```

### Pattern 3: Row Number Column

```html
<thead>
    <tr>
        <th style="width:40px">#</th>
        <th lds-th="Name"></th>
    </tr>
</thead>
<tbody>
    <tr *ngFor="let item of dataSource.items; trackBy: trackByFn">
        <td>{{ item.RowNumberLds }}</td>  <!-- Auto-generated by dataSource -->
        <td lds-td="Name">{{ item.Name }}</td>
    </tr>
</tbody>
```

### Pattern 4: Expandable Rows

```html
<tbody>
    <tr *ngFor="let item of dataSource.items; trackBy: trackByFn"
        (click)="item.expanded = !item.expanded">
        <td lds-td="Name">{{ item.Name }}</td>
        <td lds-td="Email">{{ item.Email }}</td>
    </tr>
    <tr *ngIf="item.expanded">
        <td colspan="2">
            <!-- Expanded content -->
            <div>Details for {{ item.Name }}</div>
        </td>
    </tr>
</tbody>
```

---

## Migration from Old Directives

### Old Way (Deprecated)

```html
<th *dtCol="dataSource.field('Name'); let column = field">
    {{ column.title }}
</th>
<td *dtCell="dataSource.field('Name')">
    {{ item.Name }}
</td>
```

### New Way (Current)

```html
<th lds-th="Name"></th>
<td lds-td="Name">{{ item.Name }}</td>
```

**Benefits:**
- 55% less code
- Auto-title display
- Better performance
- Cleaner templates

See [Migration Guide](./19-MIGRATION-GUIDE.md) for full details.

---

## Performance Tips

### 1. Always Use TrackBy

```html
<tr *ngFor="let item of dataSource.items; trackBy: trackByFn">
```

### 2. Use OnPush Change Detection

```typescript
@Component({
    changeDetection: ChangeDetectionStrategy.OnPush
})
```

### 3. Minimize Pipe Usage in Cells

```html
<!-- Less efficient -->
<td lds-td="Date">{{ item.Date | date:'full' | uppercase }}</td>

<!-- More efficient -->
<td lds-td="Date">{{ item.FormattedDate }}</td>
```

Pre-format in component:
```typescript
this.dataSource.onDataLoaded.subscribe(data => {
    data.items.forEach(item => {
        item.FormattedDate = formatDate(item.Date);
    });
});
```

---

## Troubleshooting

### Headers not showing titles?

Make sure fields are defined:
```typescript
this.dataSource.setFields(this.createFields());
```

### Columns not sortable?

Check field is sortable:
```typescript
new LdsField('Name', 'Name', 'string', true, true)  // sortable: true
```

### DataSource undefined in components?

Add `[ldsTable]` to table:
```html
<table [ldsTable]="dataSource">
```

---

## Next Steps

- [Grid Pager Component](./11-GRID-PAGER.md)
- [Grid Sorter Component](./12-GRID-SORTER.md)
- [Performance Optimization](./13-PERFORMANCE.md)
- [Complete Examples](./18-EXAMPLES.md)

