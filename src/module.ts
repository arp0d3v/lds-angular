import { NgModule, ModuleWithProviders, ClassProvider } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { LdsConfig } from '@arp0d3v/lds-core';
import { LdsGridPagerComponent, LdsGridSorterComponent } from './components';
import { LdsThComponent } from './components/lds-th/lds-th.component';
import { LdsTdComponent } from './components/lds-td/lds-td.component';
import { LdsTableDirective } from './directives/lds-table.directive';
import { ListDataSourceProvider } from './providers/datasource.provider';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    LdsThComponent,
    LdsTdComponent,
    LdsTableDirective
  ],
  declarations: [
    LdsGridSorterComponent,
    LdsGridPagerComponent
  ],
  exports: [
    LdsGridSorterComponent,
    LdsGridPagerComponent,
    LdsThComponent,
    LdsTdComponent,
    LdsTableDirective
  ]
})
export class ListDataSourceModule {
  static forRoot(
    ldsProviders: ClassProvider[], 
    ldsConfig?: Partial<LdsConfig>
  ): ModuleWithProviders<ListDataSourceModule> {
    return {
      ngModule: ListDataSourceModule,
      providers: [
        { provide: ListDataSourceProvider, useValue: ldsProviders },
        { provide: 'ldsConfig', useValue: ldsConfig },
        ...ldsProviders
      ],
    };
  }
}

