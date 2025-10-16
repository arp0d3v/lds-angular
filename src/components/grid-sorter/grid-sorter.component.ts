import { Component, OnInit, Input } from '@angular/core';
import { Router } from '@angular/router';
import { ListDataSource, LdsField } from '@arp0d3v/lds-core';

@Component({
    selector: 'lds-grid-sorter',
    templateUrl: 'grid-sorter.component.html'
})
export class LdsGridSorterComponent implements OnInit {
    private _dataSource!: ListDataSource<any>;
    private _autoReload = false;
    
    constructor(public router: Router) {}
    
    get autoReload(): boolean {
        return this._autoReload;
    }
    
    @Input()
    set autoReload(value: boolean) {
        if (this._autoReload != value) {
            this._autoReload = value;
        }
    }

    get dataSource(): ListDataSource<any> {
        return this._dataSource;
    }
    
    @Input()
    set dataSource(value: ListDataSource<any>) {
        if (this._dataSource != value) {
            this._dataSource = value;
        }
    }
    
    ngOnInit() {
    }
    
    stateChanged(){
        if(this._autoReload){
            this._dataSource.reload('grid-sorter');
        }
    }
    
    toggleVisible(field: LdsField){
        field.toggleVisible(true);
    }
}

