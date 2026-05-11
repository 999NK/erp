export interface CreateCompanyDTO {
  businessName: string;
  tradeName?: string;
  document: string; // CNPJ
}

export interface UpdateCompanyDTO extends Partial<CreateCompanyDTO> {
  isActive?: boolean;
}
