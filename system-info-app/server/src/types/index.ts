export interface SystemInfo {
    id: number;
    name: string;
    email: string;
    phone: string;
    address: string;
    logoUrl: string;
}

export interface CreateSystemInfo {
    name: string;
    email: string;
    phone: string;
    address: string;
    logo: Express.Multer.File; // Assuming you're using multer for file uploads
}