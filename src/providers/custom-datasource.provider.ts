import { Inject, Injectable } from "@angular/core";
import { ListDataSourceProvider } from "./datasource.provider";
import { HttpClient } from "@angular/common/http";
import { LdsConfig } from '@arp0d3v/lds-core';

@Injectable()
export class CustomListDataSourceProvider extends ListDataSourceProvider  {
    constructor(private _http: HttpClient, @Inject('ldsConfig') private ldsConfig: LdsConfig) {
        super(ldsConfig);
    }
    override httpGet(dataSourceUrl: string, queryString: string, body: any, callBack: ((result: any) => any)): void {
        const URL = dataSourceUrl + '?' + queryString;
        this._http.get<any>(URL).subscribe(result => {
            callBack(result.Data);
        }, err => {
            callBack({ items: [], total: 0 });
        });
    }
    override httpPost(dataSourceUrl: string, queryString: string, body: any, callBack: ((result: any) => any)): void {
        const URL = dataSourceUrl;
        this._http.post<any>(URL, body).subscribe(result => {
            callBack(result.Data);
        }, err => {
            callBack({ items: [], total: 0 });
        });
    }

    
}