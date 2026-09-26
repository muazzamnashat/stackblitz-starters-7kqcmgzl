import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import {
  Observable,
  catchError,
  defer,
  forkJoin,
  map,
  of,
  shareReplay,
  switchMap,
  throwError,
} from 'rxjs';
import { PeoplePage, Person, RelatedItem, RelatedResource } from './people.model';

/** Observable counterpart to PeopleService, kept separate for comparison. */
@Injectable({ providedIn: 'root' })
export class PeopleServiceRxjs {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'https://swapi.py4e.com/api/';
  private peopleRequest$?: Observable<Person[]>;
  private readonly resourceRequests = new Map<string, Observable<RelatedResource>>();

  getAllPeople(): Observable<Person[]> {
    if (!this.peopleRequest$) {
      this.peopleRequest$ = defer(() => this.loadAllPeople()).pipe(
        catchError((error) => {
          this.peopleRequest$ = undefined;
          return throwError(() => error);
        }),
        shareReplay({ bufferSize: 1, refCount: false })
      );
    }
    return this.peopleRequest$;
  }

  getPerson(id: string): Observable<Person> {
    return this.http.get<Person>(`${this.baseUrl}people/${id}/`);
  }

  getRelatedItems(urls: string[]): Observable<RelatedItem[]> {
    if (!urls.length) return of([]);

    return forkJoin(urls.map((url) => this.getResource(url).pipe(
      map((item): RelatedItem => {
        const label = item.title ?? item.name ?? 'Unnamed record';
        const detail = item.episode_id != null
          ? `Episode ${item.episode_id}${item.release_date ? ` · ${item.release_date.slice(0, 4)}` : ''}`
          : item.model ?? item.classification ?? item.climate;
        return { label, detail, url };
      }),
      catchError(() => of({
        label: `Record ${url.match(/\/(\d+)\/?$/)?.[1] ?? ''}`.trim(),
        url,
      }))
    )));
  }

  private loadAllPeople(): Observable<Person[]> {
    return this.http.get<PeoplePage>(`${this.baseUrl}people/?page=1`).pipe(
      switchMap((first) => {
        const pageSize = first.results.length;
        if (!pageSize) return of([]);

        const pageCount = Math.ceil(first.count / pageSize);
        const pages = [
          of(first),
          ...Array.from({ length: pageCount - 1 }, (_, index) =>
            this.http.get<PeoplePage>(`${this.baseUrl}people/?page=${index + 2}`)
          ),
        ];
        return forkJoin(pages).pipe(
          map((results) => results.flatMap((page) => page.results))
        );
      })
    );
  }

  private getResource(url: string): Observable<RelatedResource> {
    let request$ = this.resourceRequests.get(url);
    if (!request$) {
      request$ = defer(() => this.http.get<RelatedResource>(url)).pipe(
        catchError((error) => {
          this.resourceRequests.delete(url);
          return throwError(() => error);
        }),
        shareReplay({ bufferSize: 1, refCount: false })
      );
      this.resourceRequests.set(url, request$);
    }
    return request$;
  }
}
