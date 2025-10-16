# Middleware Provider Guide 🔌

Deep dive into creating and customizing middleware providers for ListDataSource.

---

## What is Middleware?

Middleware sits between ListDataSource and your backend API, allowing you to:

✅ **Adapt API response formats** - Convert your API structure to ListDataSource format  
✅ **Inject custom services** - Use your HttpService, AuthService, etc.  
✅ **Handle errors globally** - Provide fallback data on errors  
✅ **Transform data** - Pre-process before passing to DataSource  
✅ **Add headers** - Authentication, tracking, etc.  
✅ **Log requests** - Analytics and debugging  

---

## Architecture

```
Component
    ↓
ListDataSource
    ↓
ListDataSourceProvider (Abstract Base)
    ↓
AppListDataSourceProvider (Your Middleware) ← You implement this
    ↓
HttpService (Your HTTP Layer)
    ↓
Backend API
```

---

## Basic Middleware Implementation

### Step 1: Create Provider Class

```typescript
// services/server/datasource.provider.ts
import { Inject, Injectable } from "@angular/core";
import { LdsConfig, ListDataSourceProvider } from "src/list-data-source";
import { HttpService } from "../http.service";

@Injectable()
export class AppListDataSourceProvider extends ListDataSourceProvider {
    constructor(
        private http: HttpService,
        @Inject('ldsConfig') private ldsConfig: LdsConfig
    ) {
        super(ldsConfig);
    }

    /**
     * Override GET method
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
                // Your API format: { Data: { items: [], total: 0 } }
                // Extract and pass to DataSource
                callBack(result.Data);
            },
            error: err => {
                // Safe fallback
                callBack({ items: [], total: 0 });
            }
        });
    }

    /**
     * Override POST method
     */
    override httpPost(
        dataSourceUrl: string,
        queryString: string,
        body: any,
        callBack: ((result: any) => any)
    ): void {
        this.http.post(dataSourceUrl, body, {
            success: result => {
                callBack(result.Data);
            },
            error: err => {
                callBack({ items: [], total: 0 });
            }
        });
    }
}
```

### Step 2: Register in Module

```typescript
// shared.module.ts
import { NgModule } from '@angular/core';
import { ListDataSourceModule, ListDataSourceProvider } from 'src/list-data-source';
import { AppListDataSourceProvider } from './services/server/datasource.provider';

@NgModule({
  imports: [
    ListDataSourceModule.forRoot(
      [
        // Register your middleware
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
        cacheType: 'local',
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

### Step 3: Use in Components

```typescript
// No changes needed in components!
// They continue to use ListDataSourceProvider
import { ListDataSourceProvider } from 'src/list-data-source';

constructor(private ldsProvider: ListDataSourceProvider) {
    // Angular DI automatically uses AppListDataSourceProvider
    this.dataSource = this.ldsProvider.getRemoteDataSource(...);
}
```

---

## Real-World Example: Your App's Pattern

### Your API Response Format

```json
{
    "Success": true,
    "Message": "OK",
    "Data": {
        "items": [
            { "UserId": 1, "UserName": "john" },
            { "UserId": 2, "UserName": "jane" }
        ],
        "total": 150
    }
}
```

### Middleware Extracts `result.Data`

```typescript
override httpGet(url: string, queryString: string, body: any, callback: any): void {
    this.http.get(url + '?' + queryString, {
        success: result => {
            // Extract Data property
            // result.Data = { items: [...], total: 150 }
            callback(result.Data);
        },
        error: err => {
            callback({ items: [], total: 0 });
        }
    });
}
```

### ListDataSource Receives

```json
{
    "items": [...],
    "total": 150
}
```

**Perfect!** Now it works seamlessly.

---

## Advanced Middleware Patterns

### Pattern 1: Add Request Interceptor

```typescript
@Injectable()
export class InterceptingProvider extends ListDataSourceProvider {
    constructor(
        private http: HttpService,
        @Inject('ldsConfig') config: LdsConfig
    ) {
        super(config);
    }

    override httpGet(url: string, queryString: string, body: any, callback: any): void {
        // Modify request before sending
        const modifiedQS = this.addGlobalFilters(queryString);
        const fullUrl = `${url}?${modifiedQS}`;
        
        console.log('📡 DataSource Request:', fullUrl);
        
        this.http.get(fullUrl, {
            success: result => {
                console.log('✅ DataSource Response:', result.Data.items.length, 'items');
                callback(result.Data);
            },
            error: err => {
                console.error('❌ DataSource Error:', err);
                callback({ items: [], total: 0 });
            }
        });
    }
    
    private addGlobalFilters(queryString: string): string {
        // Add tenant ID to all requests
        const tenantId = localStorage.getItem('tenantId');
        return queryString + `&tenantId=${tenantId}`;
    }
}
```

---

### Pattern 2: Response Caching Middleware

```typescript
@Injectable()
export class CachingProvider extends ListDataSourceProvider {
    private requestCache = new Map<string, any>();
    
    constructor(
        private http: HttpService,
        @Inject('ldsConfig') config: LdsConfig
    ) {
        super(config);
    }

    override httpGet(url: string, queryString: string, body: any, callback: any): void {
        const cacheKey = `${url}?${queryString}`;
        
        // Check cache
        if (this.requestCache.has(cacheKey)) {
            const cached = this.requestCache.get(cacheKey);
            const age = Date.now() - cached.timestamp;
            
            // Use cache if less than 30 seconds old
            if (age < 30000) {
                console.log('📦 Using cached response');
                callback(cached.data);
                return;
            }
        }
        
        // Fetch fresh data
        this.http.get(url + '?' + queryString, {
            success: result => {
                // Cache the response
                this.requestCache.set(cacheKey, {
                    data: result.Data,
                    timestamp: Date.now()
                });
                
                callback(result.Data);
            },
            error: () => {
                callback({ items: [], total: 0 });
            }
        });
    }
    
    clearCache() {
        this.requestCache.clear();
    }
}
```

---

### Pattern 3: Multi-Tenant Middleware

```typescript
@Injectable()
export class MultiTenantProvider extends ListDataSourceProvider {
    constructor(
        private http: HttpService,
        private tenantService: TenantService,
        @Inject('ldsConfig') config: LdsConfig
    ) {
        super(config);
    }

    override httpGet(url: string, queryString: string, body: any, callback: any): void {
        const tenantId = this.tenantService.getCurrentTenantId();
        const baseUrl = this.tenantService.getApiBaseUrl(tenantId);
        
        // Build tenant-specific URL
        const fullUrl = `${baseUrl}/${url}?${queryString}&tenantId=${tenantId}`;
        
        this.http.get(fullUrl, {
            headers: {
                'X-Tenant-ID': tenantId.toString()
            },
            success: result => {
                callback(result.Data);
            },
            error: () => {
                callback({ items: [], total: 0 });
            }
        });
    }
}
```

---

### Pattern 4: Retry Logic Middleware

```typescript
@Injectable()
export class RetryProvider extends ListDataSourceProvider {
    private maxRetries = 3;
    private retryDelay = 1000;
    
    constructor(
        private http: HttpService,
        @Inject('ldsConfig') config: LdsConfig
    ) {
        super(config);
    }

    override httpGet(url: string, queryString: string, body: any, callback: any): void {
        this.httpGetWithRetry(url, queryString, 0, callback);
    }
    
    private httpGetWithRetry(
        url: string,
        queryString: string,
        attempt: number,
        callback: any
    ): void {
        this.http.get(url + '?' + queryString, {
            success: result => {
                callback(result.Data);
            },
            error: err => {
                if (attempt < this.maxRetries) {
                    console.warn(`Retry attempt ${attempt + 1}/${this.maxRetries}`);
                    
                    setTimeout(() => {
                        this.httpGetWithRetry(url, queryString, attempt + 1, callback);
                    }, this.retryDelay * (attempt + 1));  // Exponential backoff
                } else {
                    console.error('Max retries reached');
                    callback({ items: [], total: 0 });
                }
            }
        });
    }
}
```

---

### Pattern 5: Data Validation Middleware

```typescript
@Injectable()
export class ValidatingProvider extends ListDataSourceProvider {
    constructor(
        private http: HttpService,
        @Inject('ldsConfig') config: LdsConfig
    ) {
        super(config);
    }

    override httpGet(url: string, queryString: string, body: any, callback: any): void {
        this.http.get(url + '?' + queryString, {
            success: result => {
                // Validate response structure
                const validatedData = this.validateAndSanitize(result.Data);
                callback(validatedData);
            },
            error: () => {
                callback({ items: [], total: 0 });
            }
        });
    }
    
    private validateAndSanitize(data: any): any {
        // Ensure data has required structure
        if (!data) {
            console.warn('Invalid data: null or undefined');
            return { items: [], total: 0 };
        }
        
        if (!Array.isArray(data.items)) {
            console.warn('Invalid data: items is not an array');
            return { items: [], total: 0 };
        }
        
        if (typeof data.total !== 'number') {
            console.warn('Invalid data: total is not a number');
            data.total = data.items.length;
        }
        
        // Sanitize items
        data.items = data.items.filter(item => item != null);
        
        return data;
    }
}
```

---

## Middleware Methods Reference

### Methods to Override

#### `httpGet(url, queryString, body, callback)`

Called when DataSource needs to fetch data via GET.

**Parameters:**
- `url: string` - API endpoint (e.g., 'api/users/list')
- `queryString: string` - Query parameters (e.g., 'pageIndex=0&pageSize=20')
- `body: any` - Request body (usually empty for GET)
- `callback: (result: any) => any` - Function to call with results

**Expected callback parameter:**
```typescript
{
    items: T[],
    total: number
}
```

---

#### `httpPost(url, queryString, body, callback)`

Called when DataSource needs to fetch data via POST.

**Parameters:**
- `url: string` - API endpoint
- `queryString: string` - Query parameters (usually empty for POST)
- `body: any` - Request body (contains filters, pagination, etc.)
- `callback: (result: any) => any` - Function to call with results

**Expected callback parameter:** Same as GET

---

### Inherited Methods (Don't Override)

These methods are implemented in the base class and should not be overridden:

- `getRemoteDataSource<T>(url: string, id: string): ListDataSource<T>`
- `getLocalDataSource<T>(id: string): ListDataSource<T>`
- `createFiltersObject(ds: ListDataSource<any>): any`
- `getPageItemsLocally<T>(ds: ListDataSource<T>): T[]`
- `clearStorage(): void`

---

## Testing Your Middleware

### Unit Test Example

```typescript
import { TestBed } from '@angular/core/testing';
import { AppListDataSourceProvider } from './datasource.provider';
import { HttpService } from '../http.service';

describe('AppListDataSourceProvider', () => {
    let provider: AppListDataSourceProvider;
    let httpService: jasmine.SpyObj<HttpService>;
    
    beforeEach(() => {
        const httpSpy = jasmine.createSpyObj('HttpService', ['get', 'post']);
        
        TestBed.configureTestingModule({
            providers: [
                AppListDataSourceProvider,
                { provide: HttpService, useValue: httpSpy },
                { provide: 'ldsConfig', useValue: { sort: { defaultDir: 'asc' } } }
            ]
        });
        
        provider = TestBed.inject(AppListDataSourceProvider);
        httpService = TestBed.inject(HttpService) as jasmine.SpyObj<HttpService>;
    });
    
    it('should convert API response format', (done) => {
        const mockApiResponse = {
            Data: {
                items: [{ Id: 1, Name: 'Test' }],
                total: 1
            }
        };
        
        httpService.get.and.callFake((url, options) => {
            options.success(mockApiResponse);
        });
        
        provider.httpGet('api/test', 'pageIndex=0', {}, (result) => {
            expect(result).toEqual({
                items: [{ Id: 1, Name: 'Test' }],
                total: 1
            });
            done();
        });
    });
    
    it('should handle errors gracefully', (done) => {
        httpService.get.and.callFake((url, options) => {
            options.error(new Error('Network error'));
        });
        
        provider.httpGet('api/test', 'pageIndex=0', {}, (result) => {
            expect(result).toEqual({ items: [], total: 0 });
            done();
        });
    });
});
```

---

## Common Middleware Use Cases

### Use Case 1: GraphQL Backend

```typescript
@Injectable()
export class GraphQLProvider extends ListDataSourceProvider {
    constructor(
        private apollo: Apollo,
        @Inject('ldsConfig') config: LdsConfig
    ) {
        super(config);
    }

    override httpGet(url: string, queryString: string, body: any, callback: any): void {
        // Parse query string into variables
        const variables = this.parseQueryString(queryString);
        
        this.apollo.query({
            query: gql`
                query GetUsers($pageIndex: Int, $pageSize: Int) {
                    users(pageIndex: $pageIndex, pageSize: $pageSize) {
                        items {
                            id
                            name
                            email
                        }
                        totalCount
                    }
                }
            `,
            variables: variables
        }).subscribe({
            next: (result: any) => {
                callback({
                    items: result.data.users.items,
                    total: result.data.users.totalCount
                });
            },
            error: () => {
                callback({ items: [], total: 0 });
            }
        });
    }
    
    private parseQueryString(qs: string): any {
        const params = new URLSearchParams(qs);
        const variables: any = {};
        params.forEach((value, key) => {
            variables[key] = value;
        });
        return variables;
    }
}
```

---

### Use Case 2: REST API with Nested Resources

```typescript
@Injectable()
export class NestedResourceProvider extends ListDataSourceProvider {
    constructor(
        private http: HttpService,
        @Inject('ldsConfig') config: LdsConfig
    ) {
        super(config);
    }

    override httpGet(url: string, queryString: string, body: any, callback: any): void {
        // URL pattern: api/users/{userId}/orders
        // Extract userId from filters and build nested URL
        
        this.http.get(url + '?' + queryString, {
            success: result => {
                // Flatten nested structure
                const flattenedItems = result.Data.items.map(item => ({
                    ...item,
                    UserId: result.Data.userId,  // Add parent ID
                    UserName: result.Data.userName
                }));
                
                callback({
                    items: flattenedItems,
                    total: result.Data.total
                });
            },
            error: () => {
                callback({ items: [], total: 0 });
            }
        });
    }
}
```

---

### Use Case 3: Mock Data Provider (Testing)

```typescript
@Injectable()
export class MockDataSourceProvider extends ListDataSourceProvider {
    constructor(@Inject('ldsConfig') config: LdsConfig) {
        super(config);
    }

    override httpGet(url: string, queryString: string, body: any, callback: any): void {
        // Return mock data immediately
        setTimeout(() => {
            const mockData = this.generateMockData(url, queryString);
            callback(mockData);
        }, 500);  // Simulate network delay
    }
    
    override httpPost(url: string, queryString: string, body: any, callback: any): void {
        setTimeout(() => {
            const mockData = this.generateMockData(url, JSON.stringify(body));
            callback(mockData);
        }, 500);
    }
    
    private generateMockData(url: string, params: string): any {
        // Parse page size from params
        const match = params.match(/pageSize=(\d+)/);
        const pageSize = match ? parseInt(match[1]) : 10;
        
        // Generate mock items
        const items = Array.from({ length: pageSize }, (_, i) => ({
            Id: i + 1,
            Name: `Mock Item ${i + 1}`,
            Date: new Date().toISOString(),
            Status: i % 2 === 0 ? 'Active' : 'Inactive'
        }));
        
        return {
            items: items,
            total: 1000  // Mock total
        };
    }
}
```

**Usage in development:**
```typescript
// app.module.ts (development)
@NgModule({
  imports: [
    ListDataSourceModule.forRoot(
      [{ provide: ListDataSourceProvider, useClass: MockDataSourceProvider }],
      config
    )
  ]
})
```

---

## Error Handling Strategies

### Strategy 1: Silent Fallback (Current Implementation)

```typescript
error: err => {
    callback({ items: [], total: 0 });
}
```

**Pros:** Never breaks, always provides data  
**Cons:** Errors are silent

---

### Strategy 2: Error Notification

```typescript
error: err => {
    this.notificationService.error('Failed to load data');
    callback({ items: [], total: 0 });
}
```

**Pros:** User is informed  
**Cons:** Can be annoying

---

### Strategy 3: Retry with Notification

```typescript
error: err => {
    if (this.shouldRetry(err)) {
        this.retryWithDelay(url, queryString, body, callback);
    } else {
        this.notificationService.error('Failed to load data: ' + err.message);
        callback({ items: [], total: 0 });
    }
}
```

**Pros:** Balance between reliability and UX  
**Cons:** More complex

---

### Strategy 4: Error Items

```typescript
error: err => {
    // Return special error item
    callback({
        items: [{
            _isError: true,
            _errorMessage: err.message
        }],
        total: 0
    });
}
```

**Pros:** Error visible in table  
**Cons:** Requires template handling

---

## Debugging Middleware

### Enable Debug Logging

```typescript
@Injectable()
export class DebugProvider extends ListDataSourceProvider {
    constructor(
        private http: HttpService,
        @Inject('ldsConfig') config: LdsConfig
    ) {
        super(config);
    }

    override httpGet(url: string, queryString: string, body: any, callback: any): void {
        const fullUrl = url + '?' + queryString;
        
        console.group('🔍 DataSource Request');
        console.log('URL:', fullUrl);
        console.log('Timestamp:', new Date().toISOString());
        console.groupEnd();
        
        const startTime = Date.now();
        
        this.http.get(fullUrl, {
            success: result => {
                const duration = Date.now() - startTime;
                
                console.group('✅ DataSource Response');
                console.log('Duration:', duration + 'ms');
                console.log('Items:', result.Data.items.length);
                console.log('Total:', result.Data.total);
                console.log('Data:', result.Data);
                console.groupEnd();
                
                callback(result.Data);
            },
            error: err => {
                const duration = Date.now() - startTime;
                
                console.group('❌ DataSource Error');
                console.log('Duration:', duration + 'ms');
                console.error('Error:', err);
                console.groupEnd();
                
                callback({ items: [], total: 0 });
            }
        });
    }
}
```

---

## Best Practices

### ✅ DO:

1. **Always handle errors** - Return `{ items: [], total: 0 }` on error
2. **Validate response structure** - Check for required properties
3. **Log errors** - For debugging and monitoring
4. **Keep it simple** - Don't add unnecessary complexity
5. **Document your format** - Comment the expected API structure

### ❌ DON'T:

1. **Don't throw errors** - Always call callback
2. **Don't modify DataSource** - Keep middleware focused on HTTP
3. **Don't cache everything** - Be selective about caching
4. **Don't block the UI** - Keep transformations fast
5. **Don't ignore errors** - At least log them

---

## Migration from Default Provider

### Before (No Middleware)

```typescript
// Your API must return: { items: [], total: 0 }
```

### After (With Middleware)

```typescript
// Your API can return: { Data: { items: [], total: 0 } }
// Middleware handles the conversion
```

**Benefit:** No need to change your backend API format!

---

## Summary

**Middleware Provider:**
- ✅ Extends `ListDataSourceProvider`
- ✅ Overrides `httpGet` and `httpPost`
- ✅ Converts API format to `{ items: [], total: 0 }`
- ✅ Handles errors gracefully
- ✅ Can add authentication, logging, caching, etc.
- ✅ Registered in module with `useClass`
- ✅ Transparent to components

**Your Pattern (AppListDataSourceProvider):**
```typescript
// Extracts result.Data from API response
success: result => callback(result.Data)

// Returns empty data on error
error: err => callback({ items: [], total: 0 })
```

**Perfect for:**
- Adapting existing APIs
- Adding cross-cutting concerns
- Centralizing HTTP logic
- Environment-specific behavior

---

## See Also

- [Installation](./02-INSTALLATION.md) - Module setup
- [Quick Start](./01-QUICK-START.md) - First implementation
- [API Reference](./16-API-REFERENCE.md) - Complete API
- [Advanced Patterns](./17-ADVANCED-PATTERNS.md) - Complex scenarios

