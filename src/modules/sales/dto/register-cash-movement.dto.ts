export interface RegisterCashMovementDTO {
    companyId: string;
    userId: string;
    sessionId: string;
    type: "SUPPLY" | "WITHDRAW";
    amount: number;
    description: string;
}
