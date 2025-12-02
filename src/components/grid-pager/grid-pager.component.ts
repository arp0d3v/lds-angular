import { Component, OnInit, Input, ViewChild, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { ListDataSource, LdsViewState, LdsUnsubscribe } from '@arp0d3v/lds-core';
import { ListDataSourceProvider } from '../../providers/datasource.provider';

@Component({
    selector: 'lds-grid-pager',
    templateUrl: 'grid-pager.component.html'
})
export class LdsGridPagerComponent implements OnInit, OnDestroy {
    private _dataSource!: ListDataSource<any>;
    state: LdsViewState;
    private _stateSubscription?: LdsUnsubscribe;
    @Input() column1Size = 8;
    constructor(
        public router: Router,
        public route: ActivatedRoute,
        public dsProvider: ListDataSourceProvider
    ) {

    }
    get dataSource(): ListDataSource<any> {
        return this._dataSource;
    }
    @Input()
    set dataSource(value: ListDataSource<any>) {
        if (this._dataSource != value) {
            // Clean up existing subscription
            if (this._stateSubscription) {
                this._stateSubscription();  // Call the unsubscribe function
            }

            this._dataSource = value;
            this._stateSubscription = this._dataSource.onPaginationChanged.subscribe((state) => {
                this.state = state;
            });
            this.state = value.state;
        }
    }
    get buttonCount(): number {
        return this._dataSource.state.pagination.buttonCount;
    }
    @Input()
    set buttonCount(value: number) {
        this._dataSource.state.pagination.buttonCount = value;
    }
    ngOnInit() {
    }
    getQueryParams(pageIndex: number): any {
        // Use dataSource's getQueryParams and override pageIndex
        const queryParams = this._dataSource.getQueryParams(true);
        queryParams.pageIndex = pageIndex;
        return queryParams;
    }
    getFirstPageQueryParams(): any {
        return this.getQueryParams(0);
    }
    getLastPageQueryParams(): any {
        const lastPageIndex = this.state?.pagination?.totalPageCount > 0 
            ? this.state.pagination.totalPageCount - 1 
            : 0;
        return this.getQueryParams(lastPageIndex);
    }
    getPreviousPageQueryParams(): any {
        const prevPageIndex = this._dataSource?.pageIndex > 0 
            ? this._dataSource.pageIndex - 1 
            : 0;
        return this.getQueryParams(prevPageIndex);
    }
    getNextPageQueryParams(): any {
        const nextPageIndex = this._dataSource?.pageIndex + 1;
        return this.getQueryParams(nextPageIndex);
    }
    hasPreviousPage(): boolean {
        return this._dataSource?.pageIndex > 0;
    }
    hasNextPage(): boolean {
        return this.state?.pagination?.totalPageCount > 0 && 
               this._dataSource?.pageIndex < this.state.pagination.totalPageCount - 1;
    }
    get useRouting(): boolean {
        return this._dataSource?.config?.useRouting || false;
    }
    goToPage(index: number) {
        // When useRouting is true, routerLink handles navigation
        // We only need to load the page data
        if (!this.useRouting) {
            // When not using query params, navigate programmatically if needed
            // (currently navigation is handled by loadPage internally)
        }
        this._dataSource.loadPage(index);
    }
    goToFirstPage() {
        this.goToPage(0);
    }
    goToLastPage() {
        if (this.state.pagination.totalPageCount - 1 === this._dataSource.pageIndex) {
            return;
        }
        this.goToPage(this.state.pagination.totalPageCount - 1);
    }
    goToPreviousPage() {
        if (this._dataSource.pageIndex - 1 < 0) {
            return;
        }
        this.goToPage(this._dataSource.pageIndex - 1);
    }
    goToNextPage() {
        if (this.state.pagination.totalPageCount - 1 < this._dataSource.pageIndex + 1) {
            return;
        }
        this.goToPage(this._dataSource.pageIndex + 1);
    }
    get totalCount(): number {
        return this._dataSource.totalCount;
    }
    changePageSize(pageSize: number) {
        this._dataSource.state.pagination.enabled = true;
        this._dataSource.changePageSize(pageSize);
    }
    ngOnDestroy() {
        if (this._stateSubscription) {
            this._stateSubscription();  // Call the unsubscribe function
        }
    }
}
