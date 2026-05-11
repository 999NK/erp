export interface LoginDTO {
  email: string;
  passwordString: string;
  companyId: string; // Garantindo contexto de tenant até no login para segurança estrita
}

export interface AuthResponseDTO {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    name: string;
    roleId?: string | null;
    roleName?: string;
    permissions?: string[];
    companyId: string;
  };
}
