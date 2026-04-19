export class System {
    systemName: string;
    email: string;
    phone: string;
    address: string;
    logo: string;

    constructor(systemName: string, email: string, phone: string, address: string, logo: string) {
        this.systemName = systemName;
        this.email = email;
        this.phone = phone;
        this.address = address;
        this.logo = logo;
    }

    // Method to save system information to the database
    async save() {
        // Implementation for saving the system data to the database
    }

    // Method to retrieve system information from the database
    static async find() {
        // Implementation for retrieving system data from the database
    }
}