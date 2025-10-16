import { Component, Input, ChangeDetectionStrategy, ChangeDetectorRef, OnInit, OnDestroy, ElementRef, AfterContentChecked, Attribute, Optional, Host } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ListDataSource, LdsField } from '@arp0d3v/lds-core';
import { LdsTableDirective } from '../../directives/lds-table.directive';

@Component({
    selector: 'th[lds-th]',
    standalone: true,
    imports: [CommonModule],
    template: `
        <ng-content></ng-content>
        <span *ngIf="isContentEmpty && column">{{ column.title }}</span>
        <i *ngIf="column?.dataSource?.state.order1Name === column?.name" 
           [ngClass]="{
               'bi bi-arrow-up': column?.dataSource?.state.order1Dir === 'asc',
               'bi bi-arrow-down': column?.dataSource?.state.order1Dir === 'desc'
           }"></i>
    `,
    host: {
        '[class.lds-th-sortable]': 'column?.orderable !== false',
        '[class.lds-th-sorted-asc]': 'column?.dataSource?.state.order1Name === column?.name && column?.dataSource?.state.order1Dir === "asc"',
        '[class.lds-th-sorted-desc]': 'column?.dataSource?.state.order1Name === column?.name && column?.dataSource?.state.order1Dir === "desc"',
        '[hidden]': 'column && column.visible === false',
        '(click)': 'onSort()'
    },
    exportAs: 'ldsTh',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class LdsThComponent implements OnInit, OnDestroy, AfterContentChecked {
    column?: LdsField;
    isContentEmpty = false;
    private _col?: string;
    private _dataSource?: ListDataSource<any>;
    private _unsubscribers: Array<() => void> = [];

    constructor(
        private cdr: ChangeDetectorRef,
        private elementRef: ElementRef,
        @Attribute('lds-th') private colAttribute: string | null,
        @Optional() @Host() private tableDirective?: LdsTableDirective
    ) {}

    @Input()
    set col(value: string | undefined) {
        if (value !== this._col) {
            this._col = value;
            this.updateColumn();
        }
    }
    get col(): string | undefined {
        return this._col || this.colAttribute || undefined;
    }

    @Input()
    set dataSource(value: ListDataSource<any> | undefined) {
        if (value !== this._dataSource) {
            this.cleanupSubscriptions();
            this._dataSource = value;
            this.updateColumn();
            this.setupSubscriptions();
        }
    }
    get dataSource(): ListDataSource<any> | undefined {
        return this._dataSource || this.tableDirective?.dataSource;
    }

    ngOnInit() {
        this.updateColumn();
        this.setupSubscriptions();
    }

    ngAfterContentChecked() {
        this.checkContentEmpty();
    }

    ngOnDestroy() {
        this.cleanupSubscriptions();
    }

    private updateColumn() {
        const ds = this.dataSource;
        const col = this.col;

        if (ds && col) {
            this.column = ds.field(col);
            this.cdr.markForCheck();
        }
    }

    private setupSubscriptions() {
        const ds = this.dataSource;
        if (!ds) return;

        const fieldChangedUnsub = ds.onFieldChanged.subscribe(() => {
            this.cdr.markForCheck();
        });
        this._unsubscribers.push(fieldChangedUnsub);

        const sortChangedUnsub = ds.onSortChanged.subscribe(() => {
            this.cdr.markForCheck();
        });
        this._unsubscribers.push(sortChangedUnsub);
    }

    private cleanupSubscriptions() {
        this._unsubscribers.forEach(unsub => unsub());
        this._unsubscribers = [];
    }

    private checkContentEmpty() {
        const element = this.elementRef.nativeElement as HTMLElement;
        let textContent = element.textContent || '';
        
        const sortIconText = textContent.match(/[\u2191\u2193]/g);
        if (sortIconText) {
            textContent = textContent.replace(/[\u2191\u2193]/g, '');
        }
        
        const isEmpty = textContent.trim() === '';
        
        if (isEmpty !== this.isContentEmpty) {
            this.isContentEmpty = isEmpty;
            this.cdr.markForCheck();
        }
    }

    onSort() {
        if (this.column && this.column.orderable !== false && this.dataSource) {
            this.dataSource.changeSort(this.column.name);
        }
    }
}

