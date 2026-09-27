import { HttpInterceptorFn } from '@angular/common/http';

export const testInterceptor: HttpInterceptorFn = (request, next) => {
  console.log('INTERCEPTOR');
  return next(request);
};