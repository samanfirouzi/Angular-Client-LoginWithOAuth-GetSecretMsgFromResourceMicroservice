import {Injectable} from '@angular/core';
import {HttpClient, HttpErrorResponse, HttpHeaders, HttpParams} from '@angular/common/http';
import {Observable, throwError} from 'rxjs';
import {catchError, tap} from 'rxjs/operators';
import {TokenService} from './token.service';


const OAUTH_CLIENT = 'saman';
const OAUTH_SECRET = 'saman-secure-key';

const API_URL = 'http://localhost:9090/';
const SECURE_URL = 'http://localhost:8080/';
const HTTP_OPTIONS = {
  headers: new HttpHeaders({
    'Content-Type': 'application/x-www-form-urlencoded',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, PUT, GET, OPTIONS, DELETE',
    Authorization: 'Basic ' + btoa(OAUTH_CLIENT + ':' + OAUTH_SECRET)
  })
};

const HTTP_OPTIONS_BEARER_AUTH = {
  headers: new HttpHeaders({
    'Content-Type': 'application/x-www-form-urlencoded',
    'Access-Control-Allow-Origin': 'http://localhost:9090/*',
    'Access-Control-Allow-Methods': 'POST, PUT, GET, OPTIONS, DELETE'
  })
};

const HTTP_OPTIONS_BASIC_AUTH = {
  headers: new HttpHeaders({
    'Content-Type': 'application/x-www-form-urlencoded',
    'Access-Control-Allow-Origin': 'http://localhost:9090/*',
    'Access-Control-Allow-Methods': 'POST, PUT, GET, OPTIONS, DELETE',
    'authorization': 'Basic c2FtYW46c2FtYW4tc2VjdXJlLWtleQ=='
  })
};

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  redirectUrl = '';

  private static handleError(error: HttpErrorResponse): any {
    if (error.error instanceof ErrorEvent) {
      console.error('An error occurred:', error.error.message);
    } else {
      console.error(
        `Backend returned code ${error.status}, ` +
        `body was: ${error.error}`);
    }
    return throwError(
      'Something bad happened; please try again later.');
  }

  private static log(message: string): any {
    console.log(message);
  }

  constructor(private http: HttpClient, private tokenService: TokenService) {
  }

  login(loginData: any): Observable<any> {
    this.tokenService.removeToken();
    this.tokenService.removeRefreshToken();
    const body = new HttpParams()
      .set('username', loginData.username)
      .set('password', loginData.password)
      .set('grant_type', 'password');

      console.log(HTTP_OPTIONS_BASIC_AUTH);

    return this.http.post<any>(API_URL + 'oauth/token', body, HTTP_OPTIONS_BASIC_AUTH)
      .pipe(
        tap(res => {
          this.tokenService.saveToken(res.access_token);
          this.tokenService.saveRefreshToken(res.refresh_token);
          

        }),
        catchError(AuthService.handleError)
      );
  }

  refreshToken(refreshData: any): Observable<any> {
    this.tokenService.removeToken();
    this.tokenService.removeRefreshToken();
    const body = new HttpParams()
      .set('refresh_token', refreshData.refresh_token)
      .set('grant_type', 'refresh_token');
    return this.http.post<any>(API_URL + 'oauth/token', body, HTTP_OPTIONS_BASIC_AUTH)
      .pipe(
        tap(res => {
          console.log(res);
          this.tokenService.saveToken(res.access_token);
          this.tokenService.saveRefreshToken(res.refresh_token);
        }),
        catchError(AuthService.handleError)
      );
  }

  logout(): void {
    this.tokenService.removeToken();
    this.tokenService.removeRefreshToken();
  }


  register(data: any): Observable<any> {
    const token = this.tokenService.getToken();
    HTTP_OPTIONS_BEARER_AUTH.headers.append(    'authorization', 'bearer '+ token );
    return this.http.get<any>(API_URL + 'addUser?username='+data.username+'&password='+data.password, HTTP_OPTIONS_BEARER_AUTH)
      .pipe(
        tap(_ => AuthService.log('register')),
        catchError(AuthService.handleError)
      );
  }

  secured(): Observable<any> {
    const token = this.tokenService.getToken();
    console.log("token:  " + token);
    return this.http.get<any>(SECURE_URL + 'secret/'+token)
      .pipe(catchError(AuthService.handleError));
  }
  
}
