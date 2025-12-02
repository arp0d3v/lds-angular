# Middleware Provider Guide 🔌

Deep dive into creating and customizing middleware providers for ListDataSource.

---

## ⚠️ What's New in v2.1.0

- **Routing Support:** Added `navigate()` method for URL-based state management
- **Breaking Changes:** Query parameters now use `sort1Name`/`sort1Dir` instead of `order1Name`/`order1Dir`
- **Updated Imports:** Use `@arp0d3v/lds-core` and `@arp0d3v/lds-angular` packages
- **Angular HttpClient:** All examples now use Angular's `HttpClient` instead of custom `HttpService`

**Migration:** If you have existing middleware, you must:
1. Add `navigate()` method implementation
2. Update imports to use `@arp0d3v/lds-angular`
3. Switch from custom `HttpService` to Angular `HttpClient`
4. Update query parameter handling for new sort field names

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
import { ActivatedRoute, Router } from "@angular/router";
import { HttpClient } from "@angular/common/http";
import { LdsConfig } from "@arp0d3v/lds-core";
import { ListDataSourceProvider } from "@arp0d3v/lds-angular";

@Injectable()
export class AppListDataSourceProvider extends ListDataSourceProvider {
    constructor(
        private http: HttpClient,
        private router: Router,
        private route: ActivatedRoute,
        @Inject('ldsConfig') private ldsConfig: LdsConfig
    ) {
        super(ldsConfig);
    }

    /**
     * Override navigate method for routing support
     * Required when useRouting is enabled
     */
    override navigate(filters: any): void {
        this.router.navigate([], {
            relativeTo: this.route,
            queryParams: filters,
            queryParamsHandling: 'merge'
        });
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
        
        this.http.get<any>(URL).subscribe({
            next: result => {
                // Your API format: { Data: { items: [], total: 0 } }
                // Extract and pass to DataSource
                callBack(result.Data || result);
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
        this.http.post<any>(dataSourceUrl, body).subscribe({
            next: result => {
                callBack(result.Data || result);
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
import { ListDataSourceModule, ListDataSourceProvider } from '@arp0d3v/lds-angular';
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
        useRouting: true,  // Enable URL-based state management
        pagination: {
          enabled: true,
          pageSize: 10,
          buttonCount: 7
        },
        sort: {
          defaultDir: 'desc'
        },
        saveState: true,
        storage: 'local',  // 'local' or 'session'
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
import { ListDataSourceProvider } from '@arp0d3v/lds-angular';
import { ActivatedRoute } from '@angular/router';

constructor(
    private ldsProvider: ListDataSourceProvider,
    private route: ActivatedRoute
) {
    // Angular DI automatically uses AppListDataSourceProvider
    this.dataSource = this.ldsProvider.getRemoteDataSource('api/users', 'UserList', {
        useRouting: true  // Enable routing if needed
    });
    
    // Apply query params from URL (when useRouting is enabled)
    this.route.queryParams.subscribe(params => {
        this.dataSource.applyQueryParams(params);
        this.dataSource.reload();
    });
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
    this.http.get<any>(url + '?' + queryString).subscribe({
        next: result => {
            // Extract Data property
            // result.Data = { items: [...], total: 150 }
            callback(result.Data || result);
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
import { HttpClient } from '@angular/common/http';
import { Router, ActivatedRoute } from '@angular/router';

@Injectable()
export class InterceptingProvider extends ListDataSourceProvider {
    constructor(
        private http: HttpClient,
        private router: Router,
        private route: ActivatedRoute,
        @Inject('ldsConfig') config: LdsConfig
    ) {
        super(config);
    }

    override navigate(filters: any): void {
        this.router.navigate([], {
            relativeTo: this.route,
            queryParams: filters,
            queryParamsHandling: 'merge'
        });
    }

    override httpGet(url: string, queryString: string, body: any, callback: any): void {
        // Modify request before sending
        const modifiedQS = this.addGlobalFilters(queryString);
        const fullUrl = `${url}?${modifiedQS}`;
        
        console.log('📡 DataSource Request:', fullUrl);
        
        this.http.get<any>(fullUrl).subscribe({
            next: result => {
                console.log('✅ DataSource Response:', (result.Data || result).items.length, 'items');
                callback(result.Data || result);
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
import { HttpClient } from '@angular/common/http';
import { Router, ActivatedRoute } from '@angular/router';

@Injectable()
export class CachingProvider extends ListDataSourceProvider {
    private requestCache = new Map<string, any>();
    
    constructor(
        private http: HttpClient,
        private router: Router,
        private route: ActivatedRoute,
        @Inject('ldsConfig') config: LdsConfig
    ) {
        super(config);
    }

    override navigate(filters: any): void {
        this.router.navigate([], {
            relativeTo: this.route,
            queryParams: filters,
            queryParamsHandling: 'merge'
        });
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
        this.http.get<any>(url + '?' + queryString).subscribe({
            next: result => {
                const data = result.Data || result;
                // Cache the response
                this.requestCache.set(cacheKey, {
                    data: data,
                    timestamp: Date.now()
                });
                
                callback(data);
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
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router, ActivatedRoute } from '@angular/router';

@Injectable()
export class MultiTenantProvider extends ListDataSourceProvider {
    constructor(
        private http: HttpClient,
        private router: Router,
        private route: ActivatedRoute,
        private tenantService: TenantService,
        @Inject('ldsConfig') config: LdsConfig
    ) {
        super(config);
    }

    override navigate(filters: any): void {
        this.router.navigate([], {
            relativeTo: this.route,
            queryParams: filters,
            queryParamsHandling: 'merge'
        });
    }

    override httpGet(url: string, queryString: string, body: any, callback: any): void {
        const tenantId = this.tenantService.getCurrentTenantId();
        const baseUrl = this.tenantService.getApiBaseUrl(tenantId);
        
        // Build tenant-specific URL
        const fullUrl = `${baseUrl}/${url}?${queryString}&tenantId=${tenantId}`;
        
        const headers = new HttpHeaders({
            'X-Tenant-ID': tenantId.toString()
        });
        
        this.http.get<any>(fullUrl, { headers }).subscribe({
            next: result => {
                callback(result.Data || result);
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
import { HttpClient } from '@angular/common/http';
import { Router, ActivatedRoute } from '@angular/router';
import { retry, delay, retryWhen, take, concatMap } from 'rxjs/operators';
import { throwError } from 'rxjs';

@Injectable()
export class RetryProvider extends ListDataSourceProvider {
    private maxRetries = 3;
    private retryDelay = 1000;
    
    constructor(
        private http: HttpClient,
        private router: Router,
        private route: ActivatedRoute,
        @Inject('ldsConfig') config: LdsConfig
    ) {
        super(config);
    }

    override navigate(filters: any): void {
        this.router.navigate([], {
            relativeTo: this.route,
            queryParams: filters,
            queryParamsHandling: 'merge'
        });
    }

    override httpGet(url: string, queryString: string, body: any, callback: any): void {
        const fullUrl = url + '?' + queryString;
        
        this.http.get<any>(fullUrl).pipe(
            retryWhen(errors =>
                errors.pipe(
                    concatMap((error, index) => {
                        if (index < this.maxRetries) {
                            console.warn(`Retry attempt ${index + 1}/${this.maxRetries}`);
                            return delay(this.retryDelay * (index + 1));  // Exponential backoff
                        }
                        return throwError(() => error);
                    }),
                    take(this.maxRetries + 1)
                )
            )
        ).subscribe({
            next: result => {
                callback(result.Data || result);
            },
            error: err => {
                console.error('Max retries reached');
                callback({ items: [], total: 0 });
            }
        });
    }
}
```

---

### Pattern 5: Data Validation Middleware

```typescript
import { HttpClient } from '@angular/common/http';
import { Router, ActivatedRoute } from '@angular/router';

@Injectable()
export class ValidatingProvider extends ListDataSourceProvider {
    constructor(
        private http: HttpClient,
        private router: Router,
        private route: ActivatedRoute,
        @Inject('ldsConfig') config: LdsConfig
    ) {
        super(config);
    }

    override navigate(filters: any): void {
        this.router.navigate([], {
            relativeTo: this.route,
            queryParams: filters,
            queryParamsHandling: 'merge'
        });
    }

    override httpGet(url: string, queryString: string, body: any, callback: any): void {
        this.http.get<any>(url + '?' + queryString).subscribe({
            next: result => {
                // Validate response structure
                const validatedData = this.validateAndSanitize(result.Data || result);
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

#### `navigate(filters: any): void` ⭐ NEW in v2.1.0

Called when navigation is requested (when `useRouting` is enabled).

**Parameters:**
- `filters: any` - Object containing filters, pagination, and sort parameters

**Implementation:**
```typescript
override navigate(filters: any): void {
    this.router.navigate([], {
        relativeTo: this.route,
        queryParams: filters,
        queryParamsHandling: 'merge'
    });
}
```

**When called:**
- When `search()` is called and `useRouting === true`
- When `resetFilters()` is called and `useRouting === true`
- When `onSortChanged` is emitted and `useRouting === true`

**Note:** This method is **required** when `useRouting` is enabled in your config.

---

#### `httpGet(url, queryString, body, callback)`

Called when DataSource needs to fetch data via GET.

**Parameters:**
- `url: string` - API endpoint (e.g., 'api/users/list')
- `queryString: string` - Query parameters (e.g., 'pageIndex=0&pageSize=20&sort1Name=name&sort1Dir=desc')
- `body: any` - Request body (usually empty for GET)
- `callback: (result: any) => any` - Function to call with results

**Expected callback parameter:**
```typescript
{
    items: T[],
    total: number
}
```

**Note:** Query parameters now use `sort1Name`/`sort1Dir` instead of `order1Name`/`order1Dir` (v2.1.0+)

---

#### `httpPost(url, queryString, body, callback)`

Called when DataSource needs to fetch data via POST.

**Parameters:**
- `url: string` - API endpoint
- `queryString: string` - Query parameters (usually empty for POST)
- `body: any` - Request body (contains filters, pagination, sort params, etc.)
- `callback: (result: any) => any` - Function to call with results

**Expected callback parameter:** Same as GET

**Note:** Body now contains `sort1Name`/`sort1Dir` instead of `order1Name`/`order1Dir` (v2.1.0+)

---

### Inherited Methods (Don't Override)

These methods are implemented in the base class and should not be overridden:

- `getRemoteDataSource<T>(url: string, id?: string, config?: LdsConfig): ListDataSource<T>`
- `getLocalDataSource<T>(items?: T[], id?: string, config?: LdsConfig): ListDataSource<T>`
- `newRemoteDataSource<T>(url: string, id?: string, config?: LdsConfig): ListDataSource<T>`
- `newLocalDataSource<T>(items: T[], id?: string, config?: LdsConfig): ListDataSource<T>`
- `clearStorage(): void`

**Note:** The base class handles filter creation, local pagination, and caching automatically.

---

## Testing Your Middleware

### Unit Test Example

```typescript
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { AppListDataSourceProvider } from './datasource.provider';
import { HttpClient } from '@angular/common/http';
import { of, throwError } from 'rxjs';

describe('AppListDataSourceProvider', () => {
    let provider: AppListDataSourceProvider;
    let httpClient: HttpClient;
    
    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [
                HttpClientTestingModule,
                RouterTestingModule
            ],
            providers: [
                AppListDataSourceProvider,
                { 
                    provide: 'ldsConfig', 
                    useValue: { 
                        storage: 'session',
                        sort: { defaultDir: 'asc' } 
                    } 
                }
            ]
        });
        
        provider = TestBed.inject(AppListDataSourceProvider);
        httpClient = TestBed.inject(HttpClient);
    });
    
    it('should convert API response format', (done) => {
        const mockApiResponse = {
            Data: {
                items: [{ Id: 1, Name: 'Test' }],
                total: 1
            }
        };
        
        spyOn(httpClient, 'get').and.returnValue(of(mockApiResponse));
        
        provider.httpGet('api/test', 'pageIndex=0', {}, (result) => {
            expect(result).toEqual({
                items: [{ Id: 1, Name: 'Test' }],
                total: 1
            });
            done();
        });
    });
    
    it('should handle errors gracefully', (done) => {
        spyOn(httpClient, 'get').and.returnValue(
            throwError(() => new Error('Network error'))
        );
        
        provider.httpGet('api/test', 'pageIndex=0', {}, (result) => {
            expect(result).toEqual({ items: [], total: 0 });
            done();
        });
    });
    
    it('should navigate when routing is enabled', () => {
        const router = TestBed.inject(Router);
        spyOn(router, 'navigate');
        
        const filters = { pageIndex: 0, pageSize: 20, sort1Name: 'name' };
        provider.navigate(filters);
        
        expect(router.navigate).toHaveBeenCalledWith([], {
            relativeTo: jasmine.any(Object),
            queryParams: filters,
            queryParamsHandling: 'merge'
        });
    });
});
```

---

## Common Middleware Use Cases

### Use Case 1: GraphQL Backend

```typescript
import { Router, ActivatedRoute } from '@angular/router';
import { Apollo } from 'apollo-angular';
import gql from 'graphql-tag';

@Injectable()
export class GraphQLProvider extends ListDataSourceProvider {
    constructor(
        private apollo: Apollo,
        private router: Router,
        private route: ActivatedRoute,
        @Inject('ldsConfig') config: LdsConfig
    ) {
        super(config);
    }

    override navigate(filters: any): void {
        this.router.navigate([], {
            relativeTo: this.route,
            queryParams: filters,
            queryParamsHandling: 'merge'
        });
    }

    override httpGet(url: string, queryString: string, body: any, callback: any): void {
        // Parse query string into variables
        const variables = this.parseQueryString(queryString);
        
        this.apollo.query({
            query: gql`
                query GetUsers($pageIndex: Int, $pageSize: Int, $sort1Name: String, $sort1Dir: String) {
                    users(pageIndex: $pageIndex, pageSize: $pageSize, sort1Name: $sort1Name, sort1Dir: $sort1Dir) {
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
            // Convert string numbers to actual numbers
            if (key === 'pageIndex' || key === 'pageSize') {
                variables[key] = parseInt(value, 10);
            } else {
                variables[key] = value;
            }
        });
        return variables;
    }
}
```

---

### Use Case 2: REST API with Nested Resources

```typescript
import { HttpClient } from '@angular/common/http';
import { Router, ActivatedRoute } from '@angular/router';

@Injectable()
export class NestedResourceProvider extends ListDataSourceProvider {
    constructor(
        private http: HttpClient,
        private router: Router,
        private route: ActivatedRoute,
        @Inject('ldsConfig') config: LdsConfig
    ) {
        super(config);
    }

    override navigate(filters: any): void {
        this.router.navigate([], {
            relativeTo: this.route,
            queryParams: filters,
            queryParamsHandling: 'merge'
        });
    }

    override httpGet(url: string, queryString: string, body: any, callback: any): void {
        // URL pattern: api/users/{userId}/orders
        // Extract userId from filters and build nested URL
        
        this.http.get<any>(url + '?' + queryString).subscribe({
            next: result => {
                const data = result.Data || result;
                // Flatten nested structure
                const flattenedItems = data.items.map((item: any) => ({
                    ...item,
                    UserId: data.userId,  // Add parent ID
                    UserName: data.userName
                }));
                
                callback({
                    items: flattenedItems,
                    total: data.total
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
import { Router, ActivatedRoute } from '@angular/router';

@Injectable()
export class MockDataSourceProvider extends ListDataSourceProvider {
    constructor(
        private router: Router,
        private route: ActivatedRoute,
        @Inject('ldsConfig') config: LdsConfig
    ) {
        super(config);
    }

    override navigate(filters: any): void {
        // Mock navigation - just log it
        console.log('Mock navigation:', filters);
        this.router.navigate([], {
            relativeTo: this.route,
            queryParams: filters,
            queryParamsHandling: 'merge'
        });
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
import { ListDataSourceModule, ListDataSourceProvider } from '@arp0d3v/lds-angular';
import { MockDataSourceProvider } from './providers/mock-datasource.provider';

@NgModule({
  imports: [
    ListDataSourceModule.forRoot(
      [{ provide: ListDataSourceProvider, useClass: MockDataSourceProvider }],
      {
        useRouting: true,  // Enable routing even in mock mode
        storage: 'session',
        pagination: { enabled: true, pageSize: 10 }
      }
    )
  ]
})
```

---

## Error Handling Strategies

### Strategy 1: Silent Fallback (Current Implementation)

```typescript
this.http.get<any>(url).subscribe({
    next: result => callback(result.Data || result),
    error: err => {
        callback({ items: [], total: 0 });
    }
});
```

**Pros:** Never breaks, always provides data  
**Cons:** Errors are silent

---

### Strategy 2: Error Notification

```typescript
this.http.get<any>(url).subscribe({
    next: result => callback(result.Data || result),
    error: err => {
        this.notificationService.error('Failed to load data');
        callback({ items: [], total: 0 });
    }
});
```

**Pros:** User is informed  
**Cons:** Can be annoying

---

### Strategy 3: Retry with Notification

```typescript
this.http.get<any>(url).pipe(
    retryWhen(errors => /* retry logic */)
).subscribe({
    next: result => callback(result.Data || result),
    error: err => {
        if (this.shouldRetry(err)) {
            this.retryWithDelay(url, queryString, body, callback);
        } else {
            this.notificationService.error('Failed to load data: ' + err.message);
            callback({ items: [], total: 0 });
        }
    }
});
```

**Pros:** Balance between reliability and UX  
**Cons:** More complex

---

### Strategy 4: Error Items

```typescript
this.http.get<any>(url).subscribe({
    next: result => callback(result.Data || result),
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
});
```

**Pros:** Error visible in table  
**Cons:** Requires template handling

---

## Debugging Middleware

### Enable Debug Logging

```typescript
import { HttpClient } from '@angular/common/http';
import { Router, ActivatedRoute } from '@angular/router';

@Injectable()
export class DebugProvider extends ListDataSourceProvider {
    constructor(
        private http: HttpClient,
        private router: Router,
        private route: ActivatedRoute,
        @Inject('ldsConfig') config: LdsConfig
    ) {
        super(config);
    }

    override navigate(filters: any): void {
        console.log('🧭 Navigation requested:', filters);
        this.router.navigate([], {
            relativeTo: this.route,
            queryParams: filters,
            queryParamsHandling: 'merge'
        });
    }

    override httpGet(url: string, queryString: string, body: any, callback: any): void {
        const fullUrl = url + '?' + queryString;
        
        console.group('🔍 DataSource Request');
        console.log('URL:', fullUrl);
        console.log('Query String:', queryString);
        console.log('Timestamp:', new Date().toISOString());
        console.groupEnd();
        
        const startTime = Date.now();
        
        this.http.get<any>(fullUrl).subscribe({
            next: result => {
                const duration = Date.now() - startTime;
                const data = result.Data || result;
                
                console.group('✅ DataSource Response');
                console.log('Duration:', duration + 'ms');
                console.log('Items:', data.items?.length || 0);
                console.log('Total:', data.total || 0);
                console.log('Data:', data);
                console.groupEnd();
                
                callback(data);
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
- ✅ Overrides `navigate()` for routing support (v2.1.0+)
- ✅ Overrides `httpGet` and `httpPost`
- ✅ Converts API format to `{ items: [], total: 0 }`
- ✅ Handles errors gracefully
- ✅ Can add authentication, logging, caching, etc.
- ✅ Registered in module with `useClass`
- ✅ Transparent to components

**Your Pattern (AppListDataSourceProvider):**
```typescript
// Navigate method for routing (required when useRouting is enabled)
override navigate(filters: any): void {
    this.router.navigate([], {
        relativeTo: this.route,
        queryParams: filters,
        queryParamsHandling: 'merge'
    });
}

// Extracts result.Data from API response
httpGet(url, queryString, body, callback): void {
    this.http.get(url + '?' + queryString).subscribe({
        next: result => callback(result.Data || result),
        error: err => callback({ items: [], total: 0 })
    });
}
```

**Perfect for:**
- Adapting existing APIs
- Adding cross-cutting concerns
- Centralizing HTTP logic
- Environment-specific behavior
- Routing integration with Angular Router

**⚠️ Breaking Changes in v2.1.0:**
- Query parameters now use `sort1Name`/`sort1Dir` instead of `order1Name`/`order1Dir`
- `navigate()` method is now required when `useRouting` is enabled
- Config uses `storage` instead of `cacheType`

---

## See Also

- [Installation](./02-INSTALLATION.md) - Module setup
- [Quick Start](./01-QUICK-START.md) - First implementation
- [API Reference](./16-API-REFERENCE.md) - Complete API
- [Advanced Patterns](./17-ADVANCED-PATTERNS.md) - Complex scenarios

