// This file can be replaced during build by using the `fileReplacements` array.
// `ng build ---prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.
import { IEnvironment } from './environment.interface';
export const environment:IEnvironment = {
  production: false,
  apiUrl: 'http://127.0.0.1:8000/api',
  // siteKey: '6LdHRqspAAAAANIY7xmolyRm1Q7in54qP8t2jzg-',
};
// apiUrl: 'http://127.0.0.1:8000/api'
/*
 * In development mode, for easier debugging, you can ignore zone related error
 * stack frames such as `zone.run`/`zoneDelegate.invokeTask` by importing the
 * below file. Don't forget to comment it out in production mode
 * because it will have a performance impact when errors are thrown
 */
// import 'zone.js/dist/zone-error';  // Included with Angular CLI.
