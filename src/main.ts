import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter, RouterOutlet } from '@angular/router';
import { PeopleListComponent } from './app/people-list.component';
import { PersonDetailComponent } from './app/person-detail.component';
import { testInterceptor } from './test.interceptor';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: '<router-outlet />',
})
class App {}

bootstrapApplication(App, {
  providers: [
    provideHttpClient(withInterceptor([testInterceptor])),
    provideRouter([
      { path: '', pathMatch: 'full', redirectTo: 'people' },
      { path: 'people', component: PeopleListComponent, title: 'Characters · Galactic Archive' },
      { path: 'people/:id', component: PersonDetailComponent, title: 'Character · Galactic Archive' },
      { path: '**', redirectTo: 'people' },
    ]),
  ],
}).catch(console.error);
