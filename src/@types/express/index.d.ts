declare namespace Express {
  export interface Request {
    user: {
      id: string;
      companyId: string;
      role: string;
    }
  }
}
