import {
    HttpInterceptorFn,
    provideHttpClient,
    withInterceptors,
  } from '@angular/common/http';

export const testInterceptor: HttpInterceptorFn = (request, next) => {
    console.log('INTERCEPTOR')
}