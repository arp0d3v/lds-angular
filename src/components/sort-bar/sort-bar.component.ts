import { Component, HostListener, Input } from '@angular/core';
import { ListDataSource, LdsField } from '@arp0d3v/lds-core';

@Component({
    selector: 'lds-sort-bar',
    templateUrl: 'sort-bar.component.html',
    styles: [`
        :host {
            position: relative;
            z-index: 110;
        }
        .lds-sort-bar {
            display: flex;
            align-items: center;
            flex-wrap: wrap;
            gap: 6px;
            margin: 0 0 8px;
            min-height: 32px;
        }
        .lds-sort-caption,
        .lds-sort-then {
            color: #6c757d;
            font-size: 12px;
        }
        .lds-sort-chip,
        .lds-sort-add {
            display: inline-flex;
            align-items: center;
            gap: 4px;
            border: 1px solid #ced4da;
            background: #fff;
            border-radius: 16px;
            padding: 2px 8px;
            font-size: 12px;
            line-height: 20px;
            cursor: pointer;
        }
        .lds-sort-chip:hover,
        .lds-sort-add:hover {
            border-color: #6ea8fe;
            background: #f8fbff;
        }
        .lds-sort-add {
            border-style: dashed;
            color: #495057;
        }
        .lds-sort-rank {
            display: inline-block;
            min-width: 16px;
            height: 16px;
            border-radius: 50%;
            background: #52575c;
            color: #fff;
            font-size: 10px;
            line-height: 16px;
            text-align: center;
        }
        .lds-sort-x {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 16px;
            height: 16px;
            margin-right: 2px;
            border-radius: 50%;
            color: #6c757d;
            font-size: 14px;
            line-height: 1;
        }
        .lds-sort-x:hover {
            background: #f8d7da;
            color: #842029;
        }
        .lds-sort-add-wrap {
            position: relative;
        }
        .lds-sort-menu {
            position: absolute;
            z-index: 2;
            inset-inline-start: 0;
            top: calc(100% + 4px);
            max-height: 280px;
            overflow: auto;
            min-width: 160px;
            margin: 0;
            padding: 4px 0;
            list-style: none;
            background: #fff;
            border: 1px solid rgba(0, 0, 0, 0.15);
            border-radius: 4px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
        }
        .lds-sort-menu button {
            display: block;
            width: 100%;
            padding: 4px 12px;
            border: 0;
            background: transparent;
            text-align: start;
            font-size: 13px;
            cursor: pointer;
            white-space: nowrap;
        }
        .lds-sort-menu button:hover {
            background: #f8f9fa;
        }
    `]
})
export class LdsSortBarComponent {
    @Input() caption = 'مرتب‌سازی';
    @Input() thenLabel = 'سپس';
    @Input() addLabel = 'مرتب‌سازی دوم';
    menuOpen = false;
    private _dataSource?: ListDataSource<any>;

    @Input()
    set dataSource(value: ListDataSource<any> | undefined) {
        this._dataSource = value;
        if (value?.config?.sort) {
            value.config.sort.showRank = true;
        }
    }
    get dataSource(): ListDataSource<any> | undefined {
        return this._dataSource;
    }

    get sort1(): LdsField | undefined {
        return this.field(this._dataSource?.state.sort1Name);
    }
    get sort2(): LdsField | undefined {
        return this.field(this._dataSource?.state.sort2Name);
    }
    get secondaryFields(): LdsField[] {
        const primary = this._dataSource?.state.sort1Name;
        if (!this._dataSource) { return []; }
        return this._dataSource.fields.filter(field => field.sortable !== false && field.name !== primary);
    }

    sortIcon(dir?: string): string {
        return dir === 'asc' ? 'bi-arrow-up' : 'bi-arrow-down';
    }
    toggleSort(level: 1 | 2) {
        this._dataSource?.toggleSortLevel(level);
    }
    removeSort(level: 1 | 2, event: Event) {
        event.stopPropagation();
        event.preventDefault();
        this._dataSource?.removeSort(level);
    }
    toggleMenu(event: Event) {
        event.stopPropagation();
        this.menuOpen = !this.menuOpen;
    }
    selectSort2(fieldName: string) {
        this.menuOpen = false;
        this._dataSource?.setSort2(fieldName);
    }
    @HostListener('document:click')
    closeMenu() {
        this.menuOpen = false;
    }

    private field(name?: string): LdsField | undefined {
        if (!name || !this._dataSource) { return undefined; }
        return this._dataSource.fields.find(item => item.name === name);
    }
}
