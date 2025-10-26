export interface ActiveUserType {
  sub: number;
  email: string;
  tokenType: 'access' | 'refresh';
}
