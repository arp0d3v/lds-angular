import { Directive, Input } from '@angular/core';
import { ListDataSource } from '@arp0d3v/lds-core';

@Directive({
    selector: 'table[ldsTable]',
    standalone: true,
    exportAs: 'ldsTable'
})
export class LdsTableDirective {
    @Input('ldsTable') dataSource!: ListDataSource<any>;
}

