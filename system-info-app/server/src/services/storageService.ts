export class StorageService {
    private uploadPath: string;

    constructor(uploadPath: string) {
        this.uploadPath = uploadPath;
    }

    public async uploadLogo(file: Express.Multer.File): Promise<string> {
        const filePath = `${this.uploadPath}/${file.originalname}`;
        await this.saveFile(file.buffer, filePath);
        return filePath;
    }

    private async saveFile(buffer: Buffer, filePath: string): Promise<void> {
        return new Promise((resolve, reject) => {
            require('fs').writeFile(filePath, buffer, (err) => {
                if (err) {
                    return reject(err);
                }
                resolve();
            });
        });
    }

    public async getLogo(fileName: string): Promise<Buffer> {
        return new Promise((resolve, reject) => {
            require('fs').readFile(`${this.uploadPath}/${fileName}`, (err, data) => {
                if (err) {
                    return reject(err);
                }
                resolve(data);
            });
        });
    }
}