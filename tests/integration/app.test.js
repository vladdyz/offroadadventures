const request = require('supertest');
const app = require('../../index');

describe('Valid routes', () => {
    test('GET / renders the home page', async () => {
        const response = await request(app).get('/');
        expect(response.statusCode).toBe(200);
    });

    test('Unknown routes return a 404', async () => {
        const response = await request(app).get('/i-am-so-very-lost-please-send-me-the-correct-status-code');
        expect(response.statusCode).toBe(404);
    });
});