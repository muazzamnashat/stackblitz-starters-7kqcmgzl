import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { PeoplePage, Person, RelatedItem, RelatedResource } from './people.model';

@Injectable({ providedIn: 'root' })
export class PeopleService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'https://swapi.py4e.com/api/';
  private peopleRequest?: Promise<Person[]>;
  private readonly resourceRequests = new Map<string, Promise<RelatedResource>>();

  getAllPeople(): Promise<Person[]> {
    if (!this.peopleRequest) {
      this.peopleRequest = this.loadAllPeople().catch((error) => {
        this.peopleRequest = undefined;
        throw error;
      });
    }
    return this.peopleRequest;
  }

  getPerson(id: string): Promise<Person> {
    return firstValueFrom(this.http.get<Person>(`${this.baseUrl}people/${id}/`));
  }

  async getRelatedItems(urls: string[]): Promise<RelatedItem[]> {
    return Promise.all(urls.map(async (url) => {
      try {
        const item = await this.getResource(url);
        const label = item.title ?? item.name ?? 'Unnamed record';
        const detail = item.episode_id != null
          ? `Episode ${item.episode_id}${item.release_date ? ` · ${item.release_date.slice(0, 4)}` : ''}`
          : item.model ?? item.classification ?? item.climate;
        return { label, detail, url };
      } catch {
        return { label: `Record ${url.match(/\/(\d+)\/?$/)?.[1] ?? ''}`.trim(), url };
      }
    }));
  }

  private async loadAllPeople(): Promise<Person[]> {
    const first = await firstValueFrom(this.http.get<PeoplePage>(`${this.baseUrl}people/?page=1`));
    const pageSize = first.results.length;
    if (!pageSize) return [];
    const pageCount = Math.ceil(first.count / pageSize);
    const remaining = await Promise.all(
      Array.from({ length: pageCount - 1 }, (_, index) =>
        firstValueFrom(this.http.get<PeoplePage>(`${this.baseUrl}people/?page=${index + 2}`))
      )
    );
    return [first, ...remaining].flatMap((page) => page.results);
  }

  private getResource(url: string): Promise<RelatedResource> {
    let request = this.resourceRequests.get(url);
    if (!request) {
      request = firstValueFrom(this.http.get<RelatedResource>(url)).catch((error) => {
        this.resourceRequests.delete(url);
        throw error;
      });
      this.resourceRequests.set(url, request);
    }
    return request;
  }
}
