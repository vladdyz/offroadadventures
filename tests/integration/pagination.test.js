// campgrounds tests specifically focused on pagination

const request = require('supertest');
const app = require('../../index');
const mongoose = require('mongoose');
const { createTestUser, seedCampgrounds } = require('../testingData');
const Campground = require('../../models/campground');


describe('Campground index pagination', () => {

    test('Defaults to page 1 with a limit of 10 when query params are not given', async () => {
        const user = await createTestUser('page1@test.com', 'page1User');
        await seedCampgrounds(user, 12); // one more than the default limit

        const response = await request(app).get('/campgrounds');

        const cardCount = (response.text.match(/class="card mb-3"/g) || []).length;
        expect(cardCount).toBe(10); // only the first page renders
        expect(response.text).toContain('hasMore: true');
        expect(response.text).toMatch(/\bpage: 1\b/);
        expect(response.text).toMatch(/\blimit: 10\b/);
    });

    test('Once every campground has been loaded hasMore becomes false', async () => {
        const user = await createTestUser('page2@test.com', 'page2User');
        await seedCampgrounds(user, 10);

        const response = await request(app).get('/campgrounds?limit=10');

        const cardCount = (response.text.match(/class="card mb-3"/g) || []).length;
        expect(cardCount).toBe(10);
        expect(response.text).toContain('hasMore: false');
    });

    test('Users cannot exceed the limit query param of 100', async () => {
        const user = await createTestUser('page3@test.com', 'page3User');
        await seedCampgrounds(user, 3);

        const response = await request(app).get('/campgrounds?limit=9999');

        expect(response.text).toMatch(/\blimit: 100\b/); 
    });

    test('Invalid or negative page numbers default to the first page', async () => {
        const user = await createTestUser('page4@test.com', 'page4User');
        await seedCampgrounds(user, 3);

        const response = await request(app).get('/campgrounds?page=-5');

        expect(response.text).toMatch(/\bpage: 1\b/);
    });

    test('The JSON fragment endpoint returns the next page for infinite scroll', async () => {
        const user = await createTestUser('page5@test.com', 'page5User');
        await seedCampgrounds(user, 11); // 11 = 10 on first page and 1 leftover on second page

        const response = await request(app)
            .get('/campgrounds?page=2&limit=10')
            .set('Accept', 'application/json');

        expect(response.statusCode).toBe(200);
        expect(response.body.page).toBe(2);
        expect(response.body.hasMore).toBe(false); // validating this to be false as all campgrounds have already loaded
        const cardCount = (response.body.html.match(/class="card mb-3"/g) || []).length;
        expect(cardCount).toBe(1);
    });

    // added this regression test because an update reverted the mapTiler unpaginated mapdata the paginated list of campgrounds
    // resulting in the API loading only the currently visible cards on the map
    test('MapTiler API map always shows campground regardless of page size', async () => {
        const user = await createTestUser('page6@test.com', 'page6User');
        await seedCampgrounds(user, 15);

        const response = await request(app).get('/campgrounds?limit=5');

        const cardCount = (response.text.match(/class="card mb-3"/g) || []).length;
        expect(cardCount).toBe(5); // visible card templates obey the query string limit

        // mapData is embedded separately from the card list and should still list all 15
        const mapEntryCount = (response.text.match(/"title":"Test Campground"/g) || []).length;
        expect(mapEntryCount).toBe(15);
    });

});