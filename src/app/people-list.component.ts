import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Person, displayValue, personId } from './people.model';
import { PeopleService } from './people.service';

@Component({
  selector: 'app-people-list',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './people-list.component.html',
})
export class PeopleListComponent implements OnInit {
  private readonly peopleService = inject(PeopleService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  readonly people = signal<Person[]>([]);
  readonly loading = signal(true);
  readonly error = signal(false);
  readonly search = signal('');
  readonly gender = signal('all');
  readonly page = signal(1);
  readonly pageSize = 10;
  readonly displayValue = displayValue;
  readonly personId = personId;

  readonly genders = computed(() =>
    [...new Set(this.people().map((person) => person.gender))].sort()
  );
  readonly filteredPeople = computed(() => {
    const query = this.search().trim().toLocaleLowerCase();
    return this.people().filter((person) =>
      (!query || person.name.toLocaleLowerCase().includes(query)) &&
      (this.gender() === 'all' || person.gender === this.gender())
    );
  });
  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.filteredPeople().length / this.pageSize)));
  readonly currentPage = computed(() => Math.min(this.page(), this.totalPages()));
  readonly visiblePeople = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize;
    return this.filteredPeople().slice(start, start + this.pageSize);
  });
  readonly pageNumbers = computed(() =>
    Array.from({ length: this.totalPages() }, (_, index) => index + 1)
  );
  readonly firstResult = computed(() =>
    this.filteredPeople().length ? (this.currentPage() - 1) * this.pageSize + 1 : 0
  );
  readonly lastResult = computed(() =>
    Math.min(this.currentPage() * this.pageSize, this.filteredPeople().length)
  );

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      this.search.set(params.get('q') ?? '');
      this.gender.set(params.get('gender') ?? 'all');
      const requestedPage = Number(params.get('page'));
      this.page.set(Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1);
    });
    void this.loadPeople();
  }

  async loadPeople(): Promise<void> {
    this.loading.set(true);
    this.error.set(false);
    try {
      this.people.set(await this.peopleService.getAllPeople());
    } catch {
      this.error.set(true);
    } finally {
      this.loading.set(false);
    }
  }

  setSearch(value: string): void {
    this.search.set(value);
    this.page.set(1);
    this.updateUrl();
  }

  setGender(value: string): void {
    this.gender.set(value);
    this.page.set(1);
    this.updateUrl();
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages()) return;
    this.page.set(page);
    this.updateUrl();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  clearFilters(): void {
    this.search.set('');
    this.gender.set('all');
    this.page.set(1);
    this.updateUrl();
  }

  detailQueryParams(): Record<string, string | number | null> {
    return {
      q: this.search() || null,
      gender: this.gender() === 'all' ? null : this.gender(),
      page: this.currentPage(),
    };
  }

  private updateUrl(): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: this.detailQueryParams(),
      replaceUrl: true,
    });
  }
}
