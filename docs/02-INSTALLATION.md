# Installation & Setup 🔧

How to install and configure ListDataSource in your Angular application.

---

## Installation

### Step 1: Import the Module

In your `shared.module.ts` or `app.module.ts`:

```typescript
import { NgModule } from '@angular/core';
import { ListDataSourceModule, ListDataSourceProvider } from 'src/list-data-source';
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
        pagination: {
          enabled: true,
          pageSize: 10,
          buttonCount: 7
        },
        sort: {
          defaultDir: 'desc'
        },
        saveState: true,
        debugMode: 0,
        cacheType: 'local'
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
    pagination?: {
        enabled: boolean;      // Enable pagination (default: true)
        pageSize: number;      // Default page size (default: 10)
        buttonCount?: number;  // Number of page buttons (default: 7)
    };
    sort: {
        defaultName?: string;  // Default sort column
        defaultDir: 'asc' | 'desc';  // Default sort direction (default: 'asc')
    };
    saveState: boolean;        // Cache state in localStorage (default: true)
    cacheType: 'local' | 'session';  // Storage type (default: 'local')
    debugMode?: number;        // Debug level 0-3 (default: 0)
}
```

### Example Configurations

#### Minimal Configuration

```typescript
ListDataSourceModule.forRoot([], {
    sort: {
        defaultDir: 'asc'
    },
    saveState: false
})
```

#### Production Configuration

```typescript
ListDataSourceModule.forRoot([], {
    pagination: {
        enabled: true,
        pageSize: 20,
        buttonCount: 7
    },
    sort: {
        defaultDir: 'desc'
    },
    saveState: true,
    cacheType: 'local',
    debugMode: 0
})
```

#### Development Configuration

```typescript
ListDataSourceModule.forRoot([], {
    pagination: {
        enabled: true,
        pageSize: 10
    },
    sort: {
        defaultDir: 'asc'
    },
    saveState: false,  // Don't cache during development
    debugMode: 2       // Verbose logging
})
```

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
import { LdsConfig, ListDataSourceProvider } from "src/list-data-source";
import { HttpService } from "../http.service";

@Injectable()
export class AppListDataSourceProvider extends ListDataSourceProvider {
    constructor(
        private http: HttpService,  // Your custom HTTP service
        @Inject('ldsConfig') private ldsConfig: LdsConfig
    ) {
        super(ldsConfig);  // Pass config to base class
    }

    /**
     * Override GET method to use your HttpService
     */
    override httpGet(
        dataSourceUrl: string,
        queryString: string,
        body: any,
        callBack: ((result: any) => any)
    ): void {
        const URL = dataSourceUrl + '?' + queryString;
        
        this.http.get(URL, {
            success: result => {
                // Transform your API response format
                // Your API: { Data: { items: [], total: 0 } }
                // ListDataSource needs: { items: [], total: 0 }
                callBack(result.Data);
            },
            error: err => {
                // Handle errors gracefully
                console.error('DataSource GET error:', err);
                callBack({ items: [], total: 0 });
            }
        });
    }

    /**
     * Override POST method to use your HttpService
     */
    override httpPost(
        dataSourceUrl: string,
        queryString: string,
        body: any,
        callBack: ((result: any) => any)
    ): void {
        const URL = dataSourceUrl;
        
        this.http.post(URL, body, {
            success: result => {
                // Transform your API response format
                callBack(result.Data);
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

## Advanced Middleware Examples

### Example 1: Add Authentication Headers

```typescript
@Injectable()
export class AuthListDataSourceProvider extends ListDataSourceProvider {
    constructor(
        private http: HttpService,
        private authService: AuthService,
        @Inject('ldsConfig') ldsConfig: LdsConfig
    ) {
        super(ldsConfig);
    }

    override httpGet(url: string, queryString: string, body: any, callback: any): void {
        // Add auth token to all requests
        const headers = {
            'Authorization': `Bearer ${this.authService.getToken()}`
        };
        
        this.http.get(url + '?' + queryString, {
            headers: headers,
            success: result => callback(result.Data),
            error: () => callback({ items: [], total: 0 })
        });
    }
}
```

---

### Example 2: Add Global Loading Indicator

```typescript
@Injectable()
export class LoadingListDataSourceProvider extends ListDataSourceProvider {
    constructor(
        private http: HttpService,
        private loadingService: LoadingService,
        @Inject('ldsConfig') ldsConfig: LdsConfig
    ) {
        super(ldsConfig);
    }

    override httpGet(url: string, queryString: string, body: any, callback: any): void {
        // Show global loading indicator
        this.loadingService.show();
        
        this.http.get(url + '?' + queryString, {
            success: result => {
                this.loadingService.hide();
                callback(result.Data);
            },
            error: () => {
                this.loadingService.hide();
                callback({ items: [], total: 0 });
            }
        });
    }
}
```

---

### Example 3: Add Analytics Tracking

```typescript
@Injectable()
export class AnalyticsListDataSourceProvider extends ListDataSourceProvider {
    constructor(
        private http: HttpService,
        private analytics: AnalyticsService,
        @Inject('ldsConfig') ldsConfig: LdsConfig
    ) {
        super(ldsConfig);
    }

    override httpGet(url: string, queryString: string, body: any, callback: any): void {
        const startTime = Date.now();
        
        this.http.get(url + '?' + queryString, {
            success: result => {
                const duration = Date.now() - startTime;
                
                // Track API performance
                this.analytics.trackEvent('DataSource_Load', {
                    url: url,
                    duration: duration,
                    itemCount: result.Data.items.length
                });
                
                callback(result.Data);
            },
            error: err => {
                // Track errors
                this.analytics.trackError('DataSource_Error', {
                    url: url,
                    error: err
                });
                
                callback({ items: [], total: 0 });
            }
        });
    }
}
```

---

### Example 4: Data Transformation Middleware

```typescript
@Injectable()
export class TransformingListDataSourceProvider extends ListDataSourceProvider {
    constructor(
        private http: HttpService,
        @Inject('ldsConfig') ldsConfig: LdsConfig
    ) {
        super(ldsConfig);
    }

    override httpGet(url: string, queryString: string, body: any, callback: any): void {
        this.http.get(url + '?' + queryString, {
            success: result => {
                // Transform data before passing to DataSource
                const transformedData = {
                    items: result.Data.items.map(item => ({
                        ...item,
                        // Add computed properties
                        FullName: `${item.FirstName} ${item.LastName}`,
                        // Convert timestamps
                        CreatedDate: new Date(item.CreatedTimestamp),
                        // Add display flags
                        IsNew: this.isRecent(item.CreatedTimestamp)
                    })),
                    total: result.Data.total
                };
                
                callback(transformedData);
            },
            error: () => {
                callback({ items: [], total: 0 });
            }
        });
    }
    
    private isRecent(timestamp: number): boolean {
        const dayInMs = 24 * 60 * 60 * 1000;
        return (Date.now() - timestamp) < (7 * dayInMs);
    }
}
```

---

## Module Setup in Different Scenarios

### Scenario 1: Single App Module

```typescript
// app.module.ts
@NgModule({
  imports: [
    ListDataSourceModule.forRoot(
      [{ provide: ListDataSourceProvider, useClass: AppListDataSourceProvider }],
      { /* config */ }
    )
  ]
})
export class AppModule { }
```

---

### Scenario 2: Shared Module (Recommended)

```typescript
// shared.module.ts
@NgModule({
  imports: [
    ListDataSourceModule.forRoot(
      [{ provide: ListDataSourceProvider, useClass: AppListDataSourceProvider }],
      { /* config */ }
    )
  ],
  exports: [
    ListDataSourceModule  // Export for use in feature modules
  ]
})
export class SharedModule { }
```

```typescript
// feature.module.ts
@NgModule({
  imports: [
    SharedModule  // Gets ListDataSource automatically
  ]
})
export class FeatureModule { }
```

---

### Scenario 3: Multiple Providers (Different APIs)

```typescript
// For apps with multiple backend APIs

// Primary API
@Injectable()
export class PrimaryApiProvider extends ListDataSourceProvider {
    constructor(
        private http: HttpService,
        @Inject('ldsConfig') config: LdsConfig
    ) {
        super(config);
    }
    
    override httpGet(url: string, qs: string, body: any, cb: any): void {
        this.http.get(`https://api1.example.com/${url}?${qs}`, {
            success: r => cb(r.data),
            error: () => cb({ items: [], total: 0 })
        });
    }
}

// Secondary API
@Injectable()
export class SecondaryApiProvider extends ListDataSourceProvider {
    constructor(
        private http: HttpService,
        @Inject('ldsConfig') config: LdsConfig
    ) {
        super(config);
    }
    
    override httpGet(url: string, qs: string, body: any, cb: any): void {
        this.http.get(`https://api2.example.com/${url}?${qs}`, {
            success: r => cb(r.result),  // Different format
            error: () => cb({ items: [], total: 0 })
        });
    }
}

// In module
@NgModule({
  providers: [
    { provide: 'PrimaryProvider', useClass: PrimaryApiProvider },
    { provide: 'SecondaryProvider', useClass: SecondaryApiProvider }
  ]
})
```

**Usage:**
```typescript
constructor(
    @Inject('PrimaryProvider') private primaryProvider: ListDataSourceProvider,
    @Inject('SecondaryProvider') private secondaryProvider: ListDataSourceProvider
) {
    this.ds1 = this.primaryProvider.getRemoteDataSource(...);
    this.ds2 = this.secondaryProvider.getRemoteDataSource(...);
}
```

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
    this.http.get(url + '?' + qs, {
        success: result => {
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
GET api/users?pageIndex=0&pageSize=20&order1Name=Name&order1Dir=asc&Search=john
```

**Parameters:**
- `pageIndex` - Current page (0-based)
- `pageSize` - Items per page
- `order1Name` - Primary sort column
- `order1Dir` - Sort direction ('asc' or 'desc')
- `order2Name` - Secondary sort column (if multi-sort)
- `order2Dir` - Secondary sort direction
- Plus any custom filters from `dataSource.filters`

**Example:**
```typescript
// Component
this.dataSource.filters.Search = 'john';
this.dataSource.filters.Status = 'active';
this.dataSource.reload();

// Results in API call:
// GET api/users?pageIndex=0&pageSize=20&Search=john&Status=active&order1Name=Name&order1Dir=asc
```

---

## HttpService Integration

### Your Custom HttpService

Your `HttpService` should support this interface:

```typescript
interface HttpService {
    get(url: string, options: {
        success: (result: any) => void;
        error?: (err: any) => void;
    }): void;
    
    post(url: string, body: any, options: {
        success: (result: any) => void;
        error?: (err: any) => void;
    }): void;
}
```

### Example HttpService Implementation

```typescript
@Injectable()
export class HttpService {
    constructor(private httpClient: HttpClient) {}
    
    get(url: string, options: any): void {
        this.httpClient.get(url).subscribe({
            next: (result) => {
                if (options.success) {
                    options.success(result);
                }
            },
            error: (err) => {
                if (options.error) {
                    options.error(err);
                }
            }
        });
    }
    
    post(url: string, body: any, options: any): void {
        this.httpClient.post(url, body).subscribe({
            next: (result) => {
                if (options.success) {
                    options.success(result);
                }
            },
            error: (err) => {
                if (options.error) {
                    options.error(err);
                }
            }
        });
    }
}
```

---

## Environment-Specific Configuration

### Development vs Production

```typescript
// config.service.ts
@Injectable()
export class ConfigService {
    getLdsConfig(): LdsConfig {
        if (environment.production) {
            return {
                pagination: { enabled: true, pageSize: 20 },
                sort: { defaultDir: 'desc' },
                saveState: true,
                cacheType: 'local',
                debugMode: 0
            };
        } else {
            return {
                pagination: { enabled: true, pageSize: 5 },  // Smaller pages in dev
                sort: { defaultDir: 'asc' },
                saveState: false,  // Don't cache in dev
                cacheType: 'session',
                debugMode: 2  // More logging in dev
            };
        }
    }
}
```

```typescript
// app.module.ts
@NgModule({
  imports: [
    ListDataSourceModule.forRoot(
      [{ provide: ListDataSourceProvider, useClass: AppListDataSourceProvider }],
      configService.getLdsConfig()
    )
  ]
})
```

---

## Verification

### Test Your Setup

Create a test component:

```typescript
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
Loading data from: api/test?pageIndex=0&pageSize=10&order1Dir=asc
Data loaded: 10 items
```

---

## Troubleshooting

### Issue: "No provider for ListDataSourceProvider"

**Solution:** Import `ListDataSourceModule.forRoot()` in your module

---

### Issue: "No provider for HttpService"

**Solution:** Add `HttpService` to your module's providers:
```typescript
@NgModule({
  providers: [HttpService]
})
```

---

### Issue: API returns data but DataSource is empty

**Check:**
1. Response format matches `{ items: [], total: 0 }`
2. Middleware is extracting data correctly
3. Check browser console for errors

**Debug:**
```typescript
override httpGet(url: string, qs: string, body: any, callback: any): void {
    this.http.get(url + '?' + qs, {
        success: result => {
            console.log('API Response:', result);  // Check structure
            console.log('Extracted Data:', result.Data);
            callback(result.Data);
        }
    });
}
```

---

### Issue: "Cannot read property 'Data' of undefined"

**Solution:** Check API is returning data in expected format:

```typescript
override httpGet(url: string, qs: string, body: any, callback: any): void {
    this.http.get(url + '?' + qs, {
        success: result => {
            // Safe extraction
            const data = result?.Data || { items: [], total: 0 };
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
2. **Handle errors** gracefully in middleware
3. **Export ListDataSourceModule** from SharedModule
4. **Set global defaults** in forRoot()
5. **Test configuration** with a simple component

### ❌ DON'T:

1. **Don't import forRoot()** in multiple modules
2. **Don't modify** ListDataSourceProvider directly
3. **Don't return** different formats from middleware
4. **Don't forget** to inject dependencies
5. **Don't skip** error handling

---

## Next Steps

- [Middleware Guide](./20-MIDDLEWARE-GUIDE.md) - Deep dive into middleware patterns
- [Quick Start](./01-QUICK-START.md) - First implementation
- [Advanced Patterns](./17-ADVANCED-PATTERNS.md) - Complex scenarios
- [Examples](./18-EXAMPLES.md) - Real-world code

---

## Summary

✅ **Import** `ListDataSourceModule.forRoot()` in your main module  
✅ **Configure** global defaults (pagination, sort, caching)  
✅ **Create middleware** to adapt your API format  
✅ **Override** `httpGet` and `httpPost` methods  
✅ **Handle errors** gracefully  
✅ **Export** module from SharedModule  
✅ **Test** with a simple component  

**Status:** Ready for [Basic Usage](./03-BASIC-USAGE.md)! 🚀

