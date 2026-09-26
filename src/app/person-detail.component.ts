import { DatePipe } from '@angular/common';
import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Person, RelatedItem, displayValue } from './people.model';
import { PeopleService } from './people.service';

interface RelatedRecords {
  homeworld: RelatedItem[];
  species: RelatedItem[];
  films: RelatedItem[];
  vehicles: RelatedItem[];
  starships: RelatedItem[];
}

@Component({
  selector: 'app-person-detail',
  standalone: true,
  imports: [DatePipe, RouterLink],
  templateUrl: './person-detail.component.html',
})
export class PersonDetailComponent implements OnInit {
  private readonly peopleService = inject(PeopleService);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private requestNumber = 0;
  readonly person = signal<Person | null>(null);
  readonly loading = signal(true);
  readonly relatedLoading = signal(false);
  readonly error = signal(false);
  readonly displayValue = displayValue;
  readonly related = signal<RelatedRecords>({
    homeworld: [], species: [], films: [], vehicles: [], starships: [],
  });
  readonly backQueryParams = {
    q: this.route.snapshot.queryParamMap.get('q'),
    gender: this.route.snapshot.queryParamMap.get('gender'),
    page: this.route.snapshot.queryParamMap.get('page'),
  };

  ngOnInit(): void {
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      void this.loadPerson(params.get('id') ?? '');
    });
  }

  async retry(): Promise<void> {
    await this.loadPerson(this.route.snapshot.paramMap.get('id') ?? '');
  }

  private async loadPerson(id: string): Promise<void> {
    const requestNumber = ++this.requestNumber;
    this.person.set(null);
    this.loading.set(true);
    this.error.set(false);
    this.relatedLoading.set(false);
    if (!/^\d+$/.test(id)) {
      this.error.set(true);
      this.loading.set(false);
      return;
    }
    try {
      const person = await this.peopleService.getPerson(id);
      if (requestNumber !== this.requestNumber) return;
      this.person.set(person);
      this.loading.set(false);
      this.relatedLoading.set(true);
      const [homeworld, species, films, vehicles, starships] = await Promise.all([
        this.peopleService.getRelatedItems(person.homeworld ? [person.homeworld] : []),
        this.peopleService.getRelatedItems(person.species),
        this.peopleService.getRelatedItems(person.films),
        this.peopleService.getRelatedItems(person.vehicles),
        this.peopleService.getRelatedItems(person.starships),
      ]);
      if (requestNumber !== this.requestNumber) return;
      this.related.set({ homeworld, species, films, vehicles, starships });
    } catch {
      if (requestNumber === this.requestNumber) this.error.set(true);
    } finally {
      if (requestNumber === this.requestNumber) {
        this.loading.set(false);
        this.relatedLoading.set(false);
      }
    }
  }
}
