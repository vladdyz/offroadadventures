const request = require('supertest');
const app = require('../../index');
const User = require('../../models/user');
const { createTestUser } = require('../testingData');

describe('User registration and auth routes', () => {

    test('GET /register renders the registration form', async () => {
        const response = await request(app).get('/register');
        expect(response.statusCode).toBe(200);
    });

    test('Registering a new user logs them in and redirects them to /campgrounds', async () => {
        const agent = request.agent(app);

        const response = await agent
            .post('/register')
            .type('form')
            .send({ email: 'newuser@test.com', userName: 'newUser', password: 'password123' });

        expect(response.statusCode).toBe(302);
        expect(response.headers.location).toBe('/campgrounds');

        const saved = await User.findOne({ userName: 'newUser' });
        expect(saved).not.toBeNull();
        expect(saved.email).toBe('newuser@test.com');

        // new campgrounds can only be created by authenticated users, so this should return 200 OK if the auth worked
        const protectedResponse = await agent.get('/campgrounds/new');
        expect(protectedResponse.statusCode).toBe(200);
    });

    test('Registering with a duplicate email redirects back to /register', async () => {
        await createTestUser('duplicate@test.com', 'firstUser');

        const response = await request(app)
            .post('/register')
            .type('form')
            .send({ email: 'duplicate@test.com', userName: 'secondUser', password: 'password123' });

        expect(response.statusCode).toBe(302);
        expect(response.headers.location).toBe('/register');

        const users = await User.find({ email: 'duplicate@test.com' });
        expect(users).toHaveLength(1); // validate that the second registration never actually persisted
    });

    test('Registering with a duplicate username redirects back to /register', async () => {
        await createTestUser('original@test.com', 'sharedName');

        const response = await request(app)
            .post('/register')
            .type('form')
            .send({ email: 'different@test.com', userName: 'sharedName', password: 'password123' });

        expect(response.statusCode).toBe(302);
        expect(response.headers.location).toBe('/register');
    });

    test('Logging in with correct credentials redirects to /campgrounds', async () => {
        await createTestUser('vindiesel@mail.ca', 'NotVinDiesel');

        const response = await request(app)
            .post('/login')
            .type('form')
            .send({ userName: 'NotVinDiesel', password: 'password123' });

        expect(response.statusCode).toBe(302);
        expect(response.headers.location).toBe('/campgrounds');
    });

    test('Logging in with an incorrect password redirects back to /login', async () => {
        await createTestUser('wrongpass@test.com', 'wrongPassUser');

        const response = await request(app)
            .post('/login')
            .type('form')
            .send({ userName: 'wrongPassUser', password: 'totallyWrongPassword' });

        expect(response.statusCode).toBe(302);
        expect(response.headers.location).toBe('/login');
    });

    test('Logging out ends the session; protected routes redirect to /login again', async () => {
        const agent = request.agent(app);
        await createTestUser('logout@test.com', 'Jack Skellington');
        await agent.post('/login').type('form').send({ userName: 'Jack Skellington', password: 'password123' });

        const beforeLogout = await agent.get('/campgrounds/new');
        expect(beforeLogout.statusCode).toBe(200);

        const logoutResponse = await agent.get('/logout');
        expect(logoutResponse.statusCode).toBe(302);
        expect(logoutResponse.headers.location).toBe('/campgrounds');

        const afterLogout = await agent.get('/campgrounds/new');
        expect(afterLogout.statusCode).toBe(302);
        expect(afterLogout.headers.location).toBe('/login');
    });

});