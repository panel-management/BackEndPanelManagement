export interface JwtPayload {
  sub: number;
  phone: string;
  type: number;
  iat?: number;
  exp?: number;
}
