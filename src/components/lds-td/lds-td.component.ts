import { Component, Input, ChangeDetectionStrategy, ChangeDetectorRef, OnInit, OnDestroy, Attribute, Optional, Host } from '@angular/core';
import { ListDataSource, LdsField } from '@arp0d3v/lds-core';
import { LdsTableDirective } from '../../directives/lds-table.directive';

@Component({
    selector: 'td[lds-td]',
    standalone: true,
    imports: [],
    template: '<ng-content></ng-content>',
    host: {
        '[hidden]': 'column && column.visible === false'
    },
    exportAs: 'ldsTd',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class LdsTdComponent implements OnInit, OnDestroy {
    column?: LdsField;
    private _col?: string;
    private _dataSource?: ListDataSource<any>;
    private _unsubscribers: Array<() => void> = [];

    constructor(
        private cdr: ChangeDetectorRef,
        @Attribute('lds-td') private colAttribute: string | null,
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
    }

    private cleanupSubscriptions() {
        this._unsubscribers.forEach(unsub => unsub());
        this._unsubscribers = [];
    }
}

