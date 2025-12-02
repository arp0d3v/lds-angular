# Advanced Configuration 🔧

Advanced configuration patterns and examples for ListDataSource.

---

## Advanced Middleware Examples

### Example 1: Add Authentication Headers

```typescript
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router, ActivatedRoute } from '@angular/router';
import { LdsConfig } from '@arp0d3v/lds-core';
import { ListDataSourceProvider } from '@arp0d3v/lds-angular';

@Injectable()
export class AuthListDataSourceProvider extends ListDataSourceProvider {
    constructor(
        private http: HttpClient,
        private router: Router,
        private route: ActivatedRoute,
        private authService: AuthService,
        @Inject('ldsConfig') ldsConfig: LdsConfig
    ) {
        super(ldsConfig);
    }

    override navigate(filters: any): void {
        this.router.navigate([], {
            relativeTo: this.route,
            queryParams: filters,
            queryParamsHandling: 'merge'
        });
    }

    override httpGet(url: string, queryString: string, body: any, callback: any): void {
        // Add auth token to all requests
        const headers = new HttpHeaders({
            'Authorization': `Bearer ${this.authService.getToken()}`
        });
        
        this.http.get<any>(url + '?' + queryString, { headers }).subscribe({
            next: result => callback(result.Data || result),
            error: () => callback({ items: [], total: 0 })
        });
    }
}
```

---

### Example 2: Add Global Loading Indicator

```typescript
import { HttpClient } from '@angular/common/http';
import { Router, ActivatedRoute } from '@angular/router';
import { LdsConfig } from '@arp0d3v/lds-core';
import { ListDataSourceProvider } from '@arp0d3v/lds-angular';

@Injectable()
export class LoadingListDataSourceProvider extends ListDataSourceProvider {
    constructor(
        private http: HttpClient,
        private router: Router,
        private route: ActivatedRoute,
        private loadingService: LoadingService,
        @Inject('ldsConfig') ldsConfig: LdsConfig
    ) {
        super(ldsConfig);
    }

    override navigate(filters: any): void {
        this.router.navigate([], {
            relativeTo: this.route,
            queryParams: filters,
            queryParamsHandling: 'merge'
        });
    }

    override httpGet(url: string, queryString: string, body: any, callback: any): void {
        // Show global loading indicator
        this.loadingService.show();
        
        this.http.get<any>(url + '?' + queryString).subscribe({
            next: result => {
                this.loadingService.hide();
                callback(result.Data || result);
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
import { HttpClient } from '@angular/common/http';
import { Router, ActivatedRoute } from '@angular/router';
import { LdsConfig } from '@arp0d3v/lds-core';
import { ListDataSourceProvider } from '@arp0d3v/lds-angular';

@Injectable()
export class AnalyticsListDataSourceProvider extends ListDataSourceProvider {
    constructor(
        private http: HttpClient,
        private router: Router,
        private route: ActivatedRoute,
        private analytics: AnalyticsService,
        @Inject('ldsConfig') ldsConfig: LdsConfig
    ) {
        super(ldsConfig);
    }

    override navigate(filters: any): void {
        this.router.navigate([], {
            relativeTo: this.route,
            queryParams: filters,
            queryParamsHandling: 'merge'
        });
    }

    override httpGet(url: string, queryString: string, body: any, callback: any): void {
        const startTime = Date.now();
        
        this.http.get<any>(url + '?' + queryString).subscribe({
            next: result => {
                const duration = Date.now() - startTime;
                const data = result.Data || result;
                
                // Track API performance
                this.analytics.trackEvent('DataSource_Load', {
                    url: url,
                    duration: duration,
                    itemCount: data.items?.length || 0
                });
                
                callback(data);
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
import { HttpClient } from '@angular/common/http';
import { Router, ActivatedRoute } from '@angular/router';
import { LdsConfig } from '@arp0d3v/lds-core';
import { ListDataSourceProvider } from '@arp0d3v/lds-angular';

@Injectable()
export class TransformingListDataSourceProvider extends ListDataSourceProvider {
    constructor(
        private http: HttpClient,
        private router: Router,
        private route: ActivatedRoute,
        @Inject('ldsConfig') ldsConfig: LdsConfig
    ) {
        super(ldsConfig);
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
                const data = result.Data || result;
                // Transform data before passing to DataSource
                const transformedData = {
                    items: data.items.map((item: any) => ({
                        ...item,
                        // Add computed properties
                        FullName: `${item.FirstName} ${item.LastName}`,
                        // Convert timestamps
                        CreatedDate: new Date(item.CreatedTimestamp),
                        // Add display flags
                        IsNew: this.isRecent(item.CreatedTimestamp)
                    })),
                    total: data.total
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

For apps with multiple backend APIs:

```typescript
// Primary API
@Injectable()
export class PrimaryApiProvider extends ListDataSourceProvider {
    constructor(
        private http: HttpService,
        @Inject('ldsConfig') config: LdsConfig
    ) {
        super(config);
    }
    
    override navigate(filters: any): void {
        // Custom navigation logic for primary API
        this.router.navigate([], {
            relativeTo: this.route,
            queryParams: filters,
            queryParamsHandling: 'merge'
        });
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
    
    override navigate(filters: any): void {
        // Custom navigation logic for secondary API
        this.router.navigate([], {
            relativeTo: this.route,
            queryParams: filters,
            queryParamsHandling: 'merge'
        });
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
export class AppModule { }
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

## Environment-Specific Configuration

### Development vs Production

```typescript
// config.service.ts
import { LdsConfig } from '@arp0d3v/lds-core';

@Injectable()
export class ConfigService {
    getLdsConfig(): LdsConfig {
        if (environment.production) {
            return {
                useRouting: true,  // Enable routing in production
                pagination: { enabled: true, pageSize: 20 },
                sort: { defaultDir: 'desc' },
                saveState: true,
                storage: 'local',  // Use localStorage in production
                debugMode: 0
            };
        } else {
            return {
                useRouting: false,  // Disable routing in development
                pagination: { enabled: true, pageSize: 5 },  // Smaller pages in dev
                sort: { defaultDir: 'asc' },
                saveState: false,  // Don't cache in dev
                storage: 'session',  // Use sessionStorage if caching
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
export class AppModule { }
```

---

## Advanced HttpClient Integration

### Custom HTTP Interceptors

You can combine ListDataSource with Angular HTTP interceptors:

```typescript
import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler } from '@angular/common/http';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
    intercept(req: HttpRequest<any>, next: HttpHandler) {
        const token = this.authService.getToken();
        const cloned = req.clone({
            headers: req.headers.set('Authorization', `Bearer ${token}`)
        });
        return next.handle(cloned);
    }
}
```

```typescript
// app.module.ts
@NgModule({
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true }
  ]
})
```

---

## Custom Configuration Examples

### Example: Dynamic Page Size Based on Screen Size

```typescript
@Injectable()
export class ResponsiveListDataSourceProvider extends ListDataSourceProvider {
    constructor(
        private http: HttpClient,
        private router: Router,
        private route: ActivatedRoute,
        private breakpointService: BreakpointService,
        @Inject('ldsConfig') ldsConfig: LdsConfig
    ) {
        super(ldsConfig);
    }

    override httpGet(url: string, queryString: string, body: any, callback: any): void {
        // Adjust page size based on screen size
        const isMobile = this.breakpointService.isMobile();
        const pageSize = isMobile ? 10 : 20;
        
        // Modify query string to use appropriate page size
        const modifiedQuery = queryString.replace(/pageSize=\d+/, `pageSize=${pageSize}`);
        
        this.http.get<any>(url + '?' + modifiedQuery).subscribe({
            next: result => callback(result.Data || result),
            error: () => callback({ items: [], total: 0 })
        });
    }
}
```

---

## Next Steps

- [Installation Guide](./02-INSTALLATION.md) - Basic setup
- [Middleware Guide](./20-MIDDLEWARE-GUIDE.md) - Deep dive into middleware patterns
- [Advanced Patterns](./17-ADVANCED-PATTERNS.md) - Complex usage scenarios

