// tests focused on database population and manipulation

const request = require('supertest');
const app = require('../../index');
const mongoose = require('mongoose');
const { createTestUser, createTestCampground, populateCampgrounds } = require('../testingData');
const Campground = require('../../models/campground');



describe('Populating campgrounds', () => {
    
    test('Seed database with some initial location-based data', async () => {
        const agent = request.agent(app);
        const user = await createTestUser('a@a.ca', 'testUser');
        const campgrounds = await populateCampgrounds(user);
        
        await agent
            .post('/login')
            .type('form')
            .send({
                userName: 'testUser',
                password: 'password123'
        });
        // confirm the database was actually seeded by performing lookups of all the campgrounds
        for (const campground of campgrounds) {
            const foundCampground = await Campground
            .findById(campground._id)
            expect(foundCampground.description).toBe("A campground used for testing");
            expect(foundCampground.author.toString()).toBe(user._id.toString());
        };     
    });

    test('GET /campgrounds returns HTTP 200 and lists existing campgrounds', async () => {
        const user = await createTestUser('index@test.com', 'indexUser');
        const campground = await createTestCampground(user);

        const response = await request(app).get('/campgrounds');

        expect(response.statusCode).toBe(200);
        expect(response.text).toContain(campground.title);
    });

    test('GET /campgrounds/:id returns HTTP 200 for an existing campground', async () => {
        const user = await createTestUser('show@test.com', 'showUser');
        const campground = await createTestCampground(user);

        const response = await request(app).get(`/campgrounds/${campground._id}`);

        expect(response.statusCode).toBe(200);
        expect(response.text).toContain(campground.title);
    });

    test('GET /campgrounds/:id redirects for a nonexistent campground', async () => {
        const fakeId = new mongoose.Types.ObjectId();
        const response = await request(app).get(`/campgrounds/${fakeId}`);

        expect(response.statusCode).toBe(302);
        expect(response.headers.location).toBe('/campgrounds');
    });

    test('Malformed campground id does not hang or crash the server', async () => {
        // primarily here because isAuthor is an async function and this app did not previously implement safety measures against this 
        const agent = request.agent(app);
        await createTestUser('malformed@test.com', 'malformedUser');
        await agent.post('/login').type('form').send({ userName: 'malformedUser', password: 'password123' });

        const response = await agent.delete('/campgrounds/500-invalid');
        expect(response.statusCode).toBe(500);  // confirming that the unhandled promise rejection was caught here
    });

        

});

