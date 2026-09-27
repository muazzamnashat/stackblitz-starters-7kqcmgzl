import { HttpInterceptorFn } from '@angular/common/http';

export const testInterceptor: HttpInterceptorFn = (request, next) => {
  const token = 'test';

  const updatedReq = request.clone({
    setHeaders: {
      Authorization:`Bearer ${token}`
    }
  })
  return next(updatedReq);
};