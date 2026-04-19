export interface SystemInfo {
    systemName: string;
    email: string;
    phone: string;
    address: string;
    logoUrl: string;
}

export interface UploadResponse {
    success: boolean;
    message: string;
    logoUrl?: string;
}