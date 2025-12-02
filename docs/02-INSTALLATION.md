# Installation & Setup 🔧

How to install and configure ListDataSource in your Angular application.

---

## ⚠️ What's New in v2.1.0

- **Routing Support:** Added `useRouting` config option and `navigate()` method
- **Breaking Changes:** Query parameters now use `sort1Name`/`sort1Dir` instead of `order1Name`/`order1Dir`
- **Updated Imports:** Use `@arp0d3v/lds-angular` package
- **Angular HttpClient:** Default provider uses Angular's `HttpClient` directly

---

## Installation

### Step 1: Import the Module

In your `shared.module.ts` or `app.module.ts`:

```typescript
import { NgModule } from '@angular/core';
import { ListDataSourceModule, ListDataSourceProvider } from '@arp0d3v/lds-angular';
import { AppListDataSourceProvider } from './services/server/datasource.provider';

@NgModule({
  imports: [
    // Import with forRoot() for global configuration
    ListDataSourceModule.forRoot(
      [
        // Provide custom middleware (optional)
        { provide: ListDataSourceProvider, useClass: AppListDataSourceProvider }
      ],
      {
        // Global configuration
        useRouting: true,  // Enable URL-based state management (optional)
        pagination: {
          enabled: true,
          pageSize: 10,
          buttonCount: 7
        },
        sort: {
          defaultDir: 'desc'
        },
        saveState: true,
        storage: 'local',  // 'local' or 'session' (was 'cacheType' in v2.0.0)
        debugMode: 0
      }
    )
  ],
  exports: [
    ListDataSourceModule
  ]
})
export class SharedModule { }
```

---

## Configuration Options

### Global Config Object

```typescript
interface LdsConfig {
    useRouting?: boolean;      // Enable URL-based state management (default: false)
    pagination?: {
        enabled: boolean;      // Enable pagination (default: false)
        pageSize: number;      // Default page size (default: 10)
        buttonCount?: number;  // Number of page buttons (default: 7)
    };
    sort: {
        defaultName?: string;  // Default sort column
        defaultDir: 'asc' | 'desc';  // Default sort direction (default: 'desc')
    };
    saveState?: boolean;       // Cache state in storage (default: false)
    storage: 'local' | 'session';  // Storage type (default: 'session')
    debugMode?: number;        // Debug level 0-3 (default: 0)
}
```

### Example Configuration

```typescript
ListDataSourceModule.forRoot([], {
    useRouting: true,  // Enable URL-based state management
    pagination: {
        enabled: true,
        pageSize: 20,
        buttonCount: 7
    },
    sort: {
        defaultDir: 'desc'
    },
    saveState: true,
    storage: 'local',  // 'local' or 'session'
    debugMode: 0
})
```

> **💡 Need environment-specific config?** See [Advanced Configuration](./21-ADVANCED-CONFIGURATION.md) for development vs production setups.

---

## Creating a Middleware Provider

### Why Use Middleware?

The middleware pattern allows you to:
- ✅ Adapt your app's HTTP response format to ListDataSource
- ✅ Inject your custom HttpService
- ✅ Handle errors globally
- ✅ Add authentication headers
- ✅ Transform data before/after API calls
- ✅ Add logging/analytics

### Creating AppListDataSourceProvider

Create `services/server/datasource.provider.ts`:

```typescript
import { Inject, Injectable } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { HttpClient } from "@angular/common/http";
import { LdsConfig } from "@arp0d3v/lds-core";
import { ListDataSourceProvider } from "@arp0d3v/lds-angular";

@Injectable()
export class AppListDataSourceProvider extends ListDataSourceProvider {
    constructor(
        private http: HttpClient,  // Angular HttpClient
        private router: Router,
        private route: ActivatedRoute,
        @Inject('ldsConfig') private ldsConfig: LdsConfig
    ) {
        super(ldsConfig);  // Pass config to base class
    }

    /**
     * Override navigate method for routing support (required when useRouting is enabled)
     */
    override navigate(filters: any): void {
        this.router.navigate([], {
            relativeTo: this.route,
            queryParams: filters,
            queryParamsHandling: 'merge'
        });
    }

    /**
     * Override GET method to use Angular HttpClient
     */
    override httpGet(
        dataSourceUrl: string,
        queryString: string,
        body: any,
        callBack: ((result: any) => any)
    ): void {
        const URL = dataSourceUrl + '?' + queryString;
        
        this.http.get<any>(URL).subscribe({
            next: result => {
                // Transform your API response format
                // Your API: { Data: { items: [], total: 0 } }
                // ListDataSource needs: { items: [], total: 0 }
                callBack(result.Data || result);
            },
            error: err => {
                // Handle errors gracefully
                console.error('DataSource GET error:', err);
                callBack({ items: [], total: 0 });
            }
        });
    }

    /**
     * Override POST method to use Angular HttpClient
     */
    override httpPost(
        dataSourceUrl: string,
        queryString: string,
        body: any,
        callBack: ((result: any) => any)
    ): void {
        const URL = dataSourceUrl;
        
        this.http.post<any>(URL, body).subscribe({
            next: result => {
                // Transform your API response format
                callBack(result.Data || result);
            },
            error: err => {
                // Handle errors gracefully
                console.error('DataSource POST error:', err);
                callBack({ items: [], total: 0 });
            }
        });
    }
}
```

### What This Middleware Does

**1. Response Format Conversion:**
```typescript
// Your API returns:
{
    Data: {
        items: [...],
        total: 100
    }
}

// Middleware extracts and passes to ListDataSource:
{
    items: [...],
    total: 100
}
```

**2. Error Handling:**
```typescript
error: err => {
    callBack({ items: [], total: 0 });  // Safe fallback
}
```

**3. Custom HTTP Service:**
```typescript
constructor(private http: HttpService) {
    // Use your app's HttpService instead of Angular's HttpClient
}
```

---

## Routing Setup (When useRouting is Enabled)

**⚠️ IMPORTANT:** When you enable `useRouting: true`, you must add query params subscription to your component.

### Required Code in Component

```typescript
import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ListDataSource } from '@arp0d3v/lds-core';
import { ListDataSourceProvider } from '@arp0d3v/lds-angular';

@Component({
    selector: 'app-user-list',
    templateUrl: './user-list.component.html'
})
export class UserListComponent implements OnInit, OnDestroy {
    dataSource: ListDataSource<User>;

    constructor(
        private ldsProvider: ListDataSourceProvider,
        private route: ActivatedRoute  // Required for routing
    ) {
        this.dataSource = this.ldsProvider.getRemoteDataSource('api/users', 'UserList', {
            useRouting: true  // Enable routing
        });
    }

    ngOnInit(): void {
        // ⚠️ REQUIRED: Subscribe to query params when useRouting is true
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
- Reads query parameters from URL (e.g., `?pageIndex=2&sort1Name=name`)
- Applies them to DataSource filters and pagination
- Reloads data with the correct state
- Enables browser back/forward navigation

**Without this code:** Routing won't work - URL changes won't update the DataSource state.

---

## Alternative: Without Middleware

If your API already returns `{ items: [], total: 0 }` format, you don't need middleware:

```typescript
ListDataSourceModule.forRoot([], {
    pagination: { enabled: true, pageSize: 10 },
    sort: { defaultDir: 'asc' },
    saveState: true
})
```

The default provider will use Angular's `HttpClient` directly.

---

> **💡 Need advanced examples?** See [Advanced Configuration](./21-ADVANCED-CONFIGURATION.md) for:
> - Authentication headers
> - Loading indicators
> - Analytics tracking
> - Data transformation
> - Multiple providers
> - Environment-specific config

---

## API Response Format Requirements

### Expected Format

ListDataSource expects this format from your API:

```json
{
    "items": [
        { "Id": 1, "Name": "Item 1" },
        { "Id": 2, "Name": "Item 2" }
    ],
    "total": 150
}
```

### If Your API Returns Different Format

Use middleware to convert:

**Your API Format:**
```json
{
    "success": true,
    "data": {
        "results": [...],
        "count": 150
    }
}
```

**Middleware:**
```typescript
override httpGet(url: string, qs: string, body: any, callback: any): void {
    this.http.get<any>(url + '?' + qs).subscribe({
        next: result => {
            // Convert your format to ListDataSource format
            callback({
                items: result.data.results,
                total: result.data.count
            });
        },
        error: () => {
            callback({ items: [], total: 0 });
        }
    });
}
```

---

## Request Parameters

### What ListDataSource Sends to Your API

**For Remote DataSource:**

```
GET api/users?pageIndex=0&pageSize=20&sort1Name=Name&sort1Dir=asc&Search=john
```

**Parameters:**
- `pageIndex` - Current page (0-based)
- `pageSize` - Items per page
- `sort1Name` - Primary sort column (was `order1Name` in v2.0.0)
- `sort1Dir` - Sort direction ('asc' or 'desc', was `order1Dir` in v2.0.0)
- `sort2Name` - Secondary sort column (if multi-sort, was `order2Name` in v2.0.0)
- `sort2Dir` - Secondary sort direction (was `order2Dir` in v2.0.0)
- Plus any custom filters from `dataSource.filters`

**Example:**
```typescript
// Component
this.dataSource.filters.Search = 'john';
this.dataSource.filters.Status = 'active';
this.dataSource.reload();

// Results in API call:
// GET api/users?pageIndex=0&pageSize=20&Search=john&Status=active&sort1Name=Name&sort1Dir=asc
```

**⚠️ Breaking Change:** In v2.1.0, `order1Name`/`order1Dir` were renamed to `sort1Name`/`sort1Dir` for consistency.

---

## HttpClient Integration

The default provider uses Angular's `HttpClient` directly. Make sure `HttpClientModule` is imported in your `app.module.ts`:

```typescript
import { HttpClientModule } from '@angular/common/http';

@NgModule({
  imports: [HttpClientModule, /* ... */]
})
```

**Note:** Your custom middleware provider should also use Angular's `HttpClient` (see basic middleware example above).

> **💡 Advanced HttpClient patterns?** See [Advanced Configuration](./21-ADVANCED-CONFIGURATION.md) for interceptors and custom HTTP patterns.

---

## Verification

### Test Your Setup

Create a test component:

```typescript
import { Component, OnDestroy } from '@angular/core';
import { ListDataSource } from '@arp0d3v/lds-core';
import { ListDataSourceProvider } from '@arp0d3v/lds-angular';

@Component({
    selector: 'test-datasource',
    template: `
        <button (click)="test()">Test DataSource</button>
        <div *ngIf="result">{{ result }}</div>
    `
})
export class TestDataSourceComponent implements OnDestroy {
    dataSource: ListDataSource<any>;
    result: string;

    constructor(private ldsProvider: ListDataSourceProvider) {
        this.dataSource = this.ldsProvider.getRemoteDataSource(
            'api/test',
            'TestDataSource'
        );
        
        this.dataSource.onDataLoaded.subscribe(data => {
            this.result = `Loaded ${data.items.length} items (total: ${data.total})`;
        });
    }

    test() {
        this.dataSource.reload();
    }
    
    ngOnDestroy() {
        this.dataSource.dispose();
    }
}
```

**Expected console output:**
```
DataSource created: TestDataSource
Loading data from: api/test?pageIndex=0&pageSize=10&sort1Dir=desc
Data loaded: 10 items
```

**Note:** Query parameters now use `sort1Dir` instead of `order1Dir` (v2.1.0+)

---

## Troubleshooting

### Issue: "No provider for ListDataSourceProvider"

**Solution:** Import `ListDataSourceModule.forRoot()` in your module

---

### Issue: "No provider for HttpClient"

**Solution:** Import `HttpClientModule` in your module:
```typescript
import { HttpClientModule } from '@angular/common/http';

@NgModule({
  imports: [HttpClientModule, /* ... */]
})
```

**Note:** The default provider uses Angular's `HttpClient` directly, so you don't need a custom `HttpService`.

---

### Issue: Routing not working / URL changes don't update DataSource

**Solution:** Make sure you've added the query params subscription in `ngOnInit()`:

```typescript
ngOnInit(): void {
    // ⚠️ REQUIRED when useRouting is true
    this.route.queryParams.subscribe(params => {
        this.dataSource.applyQueryParams(params);
        this.dataSource.reload();
    });
}
```

**Checklist:**
- ✅ `useRouting: true` is set in DataSource config
- ✅ `ActivatedRoute` is injected in constructor
- ✅ Query params subscription is in `ngOnInit()`
- ✅ `RouterModule` is imported in your module
- ✅ Middleware implements `navigate()` method

---

### Issue: API returns data but DataSource is empty

**Check:**
1. Response format matches `{ items: [], total: 0 }`
2. Middleware is extracting data correctly
3. Check browser console for errors

**Debug:**
```typescript
override httpGet(url: string, qs: string, body: any, callback: any): void {
    this.http.get<any>(url + '?' + qs).subscribe({
        next: result => {
            console.log('API Response:', result);  // Check structure
            console.log('Extracted Data:', result.Data);
            callback(result.Data || result);
        },
        error: err => {
            console.error('API Error:', err);
            callback({ items: [], total: 0 });
        }
    });
}
```

---

### Issue: "Cannot read property 'Data' of undefined"

**Solution:** Check API is returning data in expected format:

```typescript
override httpGet(url: string, qs: string, body: any, callback: any): void {
    this.http.get<any>(url + '?' + qs).subscribe({
        next: result => {
            // Safe extraction
            const data = result?.Data || result || { items: [], total: 0 };
            callback(data);
        },
        error: () => {
            callback({ items: [], total: 0 });
        }
    });
}
```

---

## Best Practices

### ✅ DO:

1. **Use middleware** to adapt API format
2. **Implement navigate()** when `useRouting` is enabled
3. **Handle errors** gracefully in middleware
4. **Export ListDataSourceModule** from SharedModule
5. **Set global defaults** in forRoot()
6. **Test configuration** with a simple component
7. **Use Angular HttpClient** for HTTP requests

### ❌ DON'T:

1. **Don't import forRoot()** in multiple modules
2. **Don't modify** ListDataSourceProvider directly
3. **Don't return** different formats from middleware
4. **Don't forget** to inject Router and ActivatedRoute for routing
5. **Don't skip** error handling
6. **Don't use** old field names (`order1Name` → use `sort1Name`)

---

## Next Steps

- [Quick Start](./01-QUICK-START.md) - First implementation
- [Advanced Configuration](./21-ADVANCED-CONFIGURATION.md) - Advanced middleware and setup patterns
- [Middleware Guide](./20-MIDDLEWARE-GUIDE.md) - Deep dive into middleware patterns
- [Advanced Patterns](./17-ADVANCED-PATTERNS.md) - Complex usage scenarios
- [Examples](./18-EXAMPLES.md) - Real-world code

---

## Summary

✅ **Import** `ListDataSourceModule.forRoot()` in your main module  
✅ **Configure** global defaults (pagination, sort, caching, routing)  
✅ **Create middleware** to adapt your API format  
✅ **Override** `navigate()`, `httpGet`, and `httpPost` methods  
✅ **Handle errors** gracefully  
✅ **Export** module from SharedModule  
✅ **Test** with a simple component  

**Status:** Ready for [Basic Usage](./03-BASIC-USAGE.md)! 🚀

**Note:** Make sure to update your API to handle `sort1Name`/`sort1Dir` instead of `order1Name`/`order1Dir` if upgrading from v2.0.0.

