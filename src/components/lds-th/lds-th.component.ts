import { Component, Input, Attribute, Optional, Host, ElementRef, ViewChild, ChangeDetectionStrategy, ChangeDetectorRef, OnInit, OnDestroy, AfterContentChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ListDataSource, LdsField } from '@arp0d3v/lds-core';
import { LdsTableDirective } from '../../directives/lds-table.directive';

@Component({
    selector: 'th[lds-th]',
    standalone: true,
    imports: [CommonModule],
    exportAs: 'ldsTh',
    template: `
        <span #content><ng-content></ng-content></span>
        <span *ngIf="shouldShowAutoTitle">{{column?.title}}</span>
        <span 
            class="lds-sort-content" 
            *ngIf="showSortIcon"
            [innerHTML]="sortIcon">
        </span>
    `,
    styles: [`
        :host {
            cursor: pointer;
            user-select: none;
        }
        :host:hover {
            background-color: rgba(0, 0, 0, 0.05);
        }
        .lds-sort-content {
            margin-left: 5px;
            opacity: 0.6;
        }
    `],
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: {
        '[class]': 'sortClass',
        '[class.lds-sortable]': 'column?.sortable !== false',
        '[style.display]': 'column?.visible === false ? "none" : null',
        '(click)': 'onSort()'
    }
})
export class LdsThComponent implements OnInit, OnDestroy, AfterContentChecked {
    @Input() column?: LdsField;
    @ViewChild('content', { static: true }) contentElement?: ElementRef<HTMLElement>;

    private _dataSource?: ListDataSource<any>;
    private _col?: string;
    private _unsubscribers: Array<() => void> = [];
    shouldShowAutoTitle = false;
    private contentChecked = false;

    constructor(
        private cdr: ChangeDetectorRef,
        private elementRef: ElementRef<HTMLElement>,
        @Attribute('lds-th') private attributeValue?: string,
        @Optional() @Host() private tableDirective?: LdsTableDirective
    ) { }

    @Input()
    set dataSource(ds: ListDataSource<any> | undefined) {
        // Only update if datasource actually changed
        if (ds !== this._dataSource) {
            this._dataSource = ds;
            // If col was already set, resolve the column
            if (this._col && ds) {
                this.column = ds.field(this._col);
            }
        }
    }

    get dataSource(): ListDataSource<any> | undefined {
        // Return explicit input first, fallback to table directive
        return this._dataSource || this.tableDirective?.dataSource;
    }

    @Input()
    set col(name: string | undefined) {
        // Only update if the name actually changed
        if (name !== this._col) {
            this._col = name;
            // If dataSource exists, resolve the column
            if (name && this._dataSource) {
                this.column = this._dataSource.field(name);
            }
        }
    }

    get col(): string | undefined {
        return this._col;
    }

    ngOnInit(): void {
        // Support both syntaxes:
        // 1. <th lds-th="fieldName"> (attribute value)
        // 2. <th lds-th col="fieldName"> (col input)
        
        // If col input wasn't provided, try to use attribute value
        if (!this._col && this.attributeValue) {
            this._col = this.attributeValue;
        }
        
        // Get dataSource (explicit or injected)
        const ds = this.dataSource;
        
        // If col was provided but column wasn't resolved yet, try now
        if (this._col && ds && !this.column) {
            this.column = ds.field(this._col);
        }

        if (!ds || !this.column) return;

        // Listen to changes and trigger OnPush detection
        this._unsubscribers.push(
            ds.onSortChanged.subscribe(() => {
                this.cdr.markForCheck();
            })
        );
        
        this._unsubscribers.push(
            ds.onFieldChanged.subscribe(() => {
                this.cdr.markForCheck();
            })
        );
    }

    get sortClass(): string {
        const ds = this.dataSource;
        if (!this.column || !ds) {
            return '';
        }

        const isCurrentSort = ds.state.sort1Name === this.column.sort1Name;

        if (!isCurrentSort) {
            return ds.config.sort.classNameDefault || 'lds-sort';
        }

        return ds.state.sort1Dir === 'asc'
            ? ds.config.sort.classNameAsc || 'lds-sort-asc'
            : ds.config.sort.classNameDesc || 'lds-sort-desc';
    }

    get showSortIcon(): boolean {
        const ds = this.dataSource;
        return !!(this.column?.sortable !== false && ds?.config.sort.icon);
    }

    get sortIcon(): string {
        const ds = this.dataSource;
        return ds?.config.sort.icon || '';
    }

    onSort(): void {
        const ds = this.dataSource;
        if (!ds || !ds.hasData || !this.column) {
            return;
        }

        if (this.column.sortable === false) {
            return;
        }

        ds.changeSort(this.column.sort1Name, this.column.sort1Dir);
    }

    ngAfterContentChecked(): void {
        // Only check once
        if (this.contentChecked) return;
        
        // Check if content is empty after content is projected
        if (this.contentElement) {
            const textContent = this.contentElement.nativeElement.textContent || '';
            this.shouldShowAutoTitle = textContent.trim().length === 0;
            this.contentChecked = true;
        }
    }

    ngOnDestroy(): void {
        this._unsubscribers.forEach(unsub => unsub());
        this._unsubscribers = [];
    }
}
