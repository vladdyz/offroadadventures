const request = require('supertest');
const app = require('../../index');
const http = require('http');
const server = http.createServer(app);

describe('Server health check', () => {
    test('GET /health should return HTTP 200 response', async () => {
        const res = await request(server).get('/health');

        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({ status: 'ok' });
    });
});