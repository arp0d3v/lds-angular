import { Component, Input, Attribute, Optional, Host, ChangeDetectionStrategy, ChangeDetectorRef, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ListDataSource, LdsField } from '@arp0d3v/lds-core';
import { LdsTableDirective } from '../../directives/lds-table.directive';

@Component({
    selector: 'td[lds-td]',
    standalone: true,
    imports: [CommonModule],
    exportAs: 'ldsTd',
    template: `
        <ng-content></ng-content>
    `,
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: {
        '[style.display]': 'column?.visible === false ? "none" : null'
    }
})
export class LdsTdComponent implements OnInit, OnDestroy {
    @Input() column?: LdsField;

    private _dataSource?: ListDataSource<any>;
    private _col?: string;
    private _unsubscribers: Array<() => void> = [];

    constructor(
        private cdr: ChangeDetectorRef,
        @Attribute('lds-td') private attributeValue?: string,
        @Optional() @Host() private tableDirective?: LdsTableDirective
    ) {}

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
        // 1. <td lds-td="fieldName"> (attribute value)
        // 2. <td lds-td col="fieldName"> (col input)
        
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

        // Listen to field visibility changes and trigger OnPush detection
        this._unsubscribers.push(
            ds.onFieldChanged.subscribe(() => {
                this.cdr.markForCheck();
            })
        );
    }

    ngOnDestroy(): void {
        this._unsubscribers.forEach(unsub => unsub());
        this._unsubscribers = [];
    }
}
