// File: src/controllers/shoe.controller.js
const ShoeModel = require('../models/shoe.model');

class ShoeController {
    async getAllShoes(req, res) {
        try {
            const shoes = await ShoeModel.getAllShoes(req.query);
            res.json(shoes);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async getShoeById(req, res) {
        try {
            const shoe = await ShoeModel.getShoeById(req.params.id);
            if (!shoe) {
                return res.status(404).json({ error: 'Shoe not found' });
            }
            res.json(shoe);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async createShoe(req, res) {
        try {
            // Add the authenticated user's ID as creator
            const shoe = await ShoeModel.createShoe(req.body, req.user.id);
            res.status(201).json(shoe);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    // The updateShoe and deleteShoe methods remain mostly the same,
    // as permissions are now handled in middleware

    async updateShoe(req, res) {
        try {
            const shoe = await ShoeModel.updateShoe(req.params.id, req.body);
            res.json(shoe);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async deleteShoe(req, res) {
        try {
            await ShoeModel.deleteShoe(req.params.id);
            res.status(204).send();
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
}

module.exports = new ShoeController();