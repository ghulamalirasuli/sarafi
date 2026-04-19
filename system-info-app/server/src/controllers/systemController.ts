import { Request, Response } from 'express';
import { System } from '../models/System';

export class SystemController {
    private systemModel: System;

    constructor() {
        this.systemModel = new System();
    }

    public async createSystem(req: Request, res: Response): Promise<Response> {
        try {
            const { name, email, phone, address } = req.body;
            const logo = req.file?.path; // Assuming logo is uploaded and stored in req.file

            const newSystem = await this.systemModel.create({
                name,
                email,
                phone,
                address,
                logo,
            });

            return res.status(201).json(newSystem);
        } catch (error) {
            return res.status(500).json({ message: 'Error creating system', error });
        }
    }

    public async getSystem(req: Request, res: Response): Promise<Response> {
        try {
            const systemData = await this.systemModel.getSystem();
            return res.status(200).json(systemData);
        } catch (error) {
            return res.status(500).json({ message: 'Error retrieving system data', error });
        }
    }
}