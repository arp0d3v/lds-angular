import { Component, OnInit, Input, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { ListDataSource, LdsViewState, LdsUnsubscribe } from '@arp0d3v/lds-core';

@Component({
    selector: 'lds-grid-pager',
    templateUrl: 'grid-pager.component.html'
})
export class LdsGridPagerComponent implements OnInit, OnDestroy {
    private _dataSource!: ListDataSource<any>;
    state!: LdsViewState;
    private _stateSubscription?: LdsUnsubscribe;
    
    constructor(public router: Router) {}
    
    get dataSource(): ListDataSource<any> {
        return this._dataSource;
    }
    
    @Input()
    set dataSource(value: ListDataSource<any>) {
        if (this._dataSource != value) {
            // Clean up existing subscription
            if (this._stateSubscription) {
                this._stateSubscription();
            }
            
            this._dataSource = value;
            this._stateSubscription = this._dataSource.onPaginationChanged.subscribe((state) => {
                this.state = state;
            });
            this.state = value.state;
        }
    }
    
    ngOnInit() {
    }
    
    goToPage(index: number) {
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
            this._stateSubscription();
        }
    }
}

