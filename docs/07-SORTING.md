# Sorting

ListDataSource sorts by one column from a header click, and by two columns when you add a second sort.

---

## Single column

Click an `lds-th` header.

- The first click on a column sorts it with `config.sort.defaultDir` (`desc` unless you change it).
- Clicking the same header toggles `asc` and `desc`.
- Clicking a different header replaces the primary sort.

```html
<table [ldsTable]="dataSource">
    <thead>
        <tr>
            <th lds-th="Name"></th>
            <th lds-th="Price"></th>
        </tr>
    </thead>
</table>
```

Primary sort state:

- `state.sort1Name`
- `state.sort1Dir` — `'asc'` or `'desc'`

```typescript
this.dataSource.changeSort('Price');
this.dataSource.changeSort('Price', 'asc');
```

---

## Two columns

Put `lds-sort-bar` above the table.

```html
<lds-sort-bar [dataSource]="dataSource"></lds-sort-bar>

<table [ldsTable]="dataSource">
    <thead>
        <tr>
            <th lds-th="Name"></th>
            <th lds-th="ProducerName"></th>
            <th lds-th="Price"></th>
        </tr>
    </thead>
</table>
```

### How it behaves

1. A header click sets the primary sort, the same as a table without the bar.
2. The bar shows a chip for that column. Click the chip to flip direction. Click × to remove it.
3. **مرتب‌سازی دوم** opens the other columns. The chosen column becomes the secondary sort and is used only when the primary values are equal.
4. The second chip flips or removes that column only.
5. Removing the primary chip promotes the secondary sort when one exists.
6. Clicking a header that is the secondary sort makes it the primary sort and clears the secondary slot.

The bar sets `config.sort.showRank = true`. Headers then show `۱` or `۲` with the direction.

Labels can be replaced:

```html
<lds-sort-bar
    [dataSource]="dataSource"
    caption="Sort"
    thenLabel="then"
    addLabel="Add sort">
</lds-sort-bar>
```

| Input | Default |
| --- | --- |
| `caption` | مرتب‌سازی |
| `thenLabel` | سپس |
| `addLabel` | مرتب‌سازی دوم |

### Programmatic API

```typescript
this.dataSource.changeSort('Price', 'desc');
this.dataSource.setSort2('ProducerName', 'asc');
this.dataSource.toggleSortLevel(1); // flip primary direction
this.dataSource.toggleSortLevel(2); // flip secondary direction
this.dataSource.removeSort(2);      // drop the secondary sort
this.dataSource.removeSort(1);      // drop primary; secondary becomes primary
```

`setSort2` becomes the primary sort when there is no primary yet, or when the field is already the primary column.

Secondary state:

- `state.sort2Name`
- `state.sort2Dir`

---

## Local and remote data

**Local data sources** compare column 1, then column 2. Empty values stay last. Rows that match on both columns keep the order they had when loaded. Clearing both sorts restores that order. Reloading the source items applies the current sort again.

**Remote data sources** send both columns on `getFilters()`:

- `sort1Name`, `sort1Dir`
- `sort2Name`, `sort2Dir`

The API applies the second column. The client does not re-sort a remote page.

---

## Header ranks

`showRank` draws the `۱` / `۲` mark on `lds-th`. `lds-sort-bar` turns it on. Set it yourself when you sort two columns without the bar:

```typescript
this.dataSource.config.sort.showRank = true;
```

---

## lds-grid-sorter

`lds-grid-sorter` is the older two-dropdown sort UI (column and direction for sort 1 and sort 2). Use `lds-sort-bar` when the sort should stay on the headers and only show a chip after the user sorts.

```html
<lds-grid-sorter [dataSource]="dataSource"></lds-grid-sorter>
```

---

## See also

- [Table Components](./10-TABLE-COMPONENTS.md)
- [API Reference](./16-API-REFERENCE.md#sorting-methods)
