// avoid making real maptiler API calls (especially since the api key is excluded from CI)
jest.mock('@maptiler/client', () => ({
    config: {},
    geocoding: {
        forward: jest.fn().mockResolvedValue({
            features: [{ geometry: { type: 'Point', coordinates: [-79.3832, 43.6532] } }]
        })
    }
}));

const request = require('supertest');
const app = require('../../index');
const mongoose = require('mongoose');
const { createTestUser, createTestCampground } = require('../testingData');
const Review = require('../../models/review');
const Campground = require('../../models/campground');


describe('Review routes', () => {

    test('Unauthenticated users cannot post a review', async () => {
        const user = await createTestUser('a@a.ca', 'testUser');
        const campground = await createTestCampground(user);
        const response = await request(app)
            .post(`/campgrounds/${campground._id}/reviews`)
            .type('form')
            .send({
                review: {
                    body: "i lost my shoes here!",
                    rating: 2
                }
            });

        expect(response.statusCode).toBe(302);
        expect(response.headers.location)
            .toBe('/login');

        // confirm that the above is correct and no review was actually created
        const updatedCampground = await Campground.findById(campground._id);
        expect(updatedCampground.reviews).toHaveLength(0);

    });
    test('Authenticated users allowed to post reviews for existing campgrounds', async () => {
        const agent = request.agent(app);
        const user = await createTestUser('a@a.ca', 'testUser');
        const campground = await createTestCampground(user);
        
        await agent
            .post('/login')
            .type('form')
            .send({
                userName: 'testUser',
                password: 'password123'
        });

        const response = await agent
            .post(`/campgrounds/${campground._id}/reviews`)
            .type('form')
            .send({
                review:{
                    body:"cool place :)",
                    rating:5
                }
            });
        expect(response.statusCode).toBe(302);
        expect(response.headers.location)
            .toBe(`/campgrounds/${campground._id}`);

        // just confirm the review was actually posted to be extra safe
        const updatedCampground = await Campground
            .findById(campground._id)
            .populate('reviews');

        expect(updatedCampground.reviews).toHaveLength(1);
        expect(updatedCampground.reviews[0].body)
            .toBe("cool place :)");

        expect(updatedCampground.reviews[0].rating)
            .toBe(5);

        expect(updatedCampground.reviews[0].author.toString())
            .toBe(user._id.toString());   

    });
    test('Authenticated users cannot post reviews for nonexistent campgrounds', async () => {
        const agent = request.agent(app);
        await createTestUser('b@b.com', 'sneakyUser');
        await agent
            .post('/login')
            .type('form')
            .send({
                userName: 'sneakyUser',
                password: 'password123'
            });

        // instead of using an id from an existing campground (which this test doesn't even attempt to create) just generate an id and post the review
        const fakeId = new mongoose.Types.ObjectId();
        const response = await agent
            .post(`/campgrounds/${fakeId}/reviews`)
            .type('form')
            .send({
                review:{
                    body:"Does this exist?",
                    rating:5
                }
            });

        // attempting this will flash an error on the screen and redirects the user back to the main campgrounds page without actually doing anything (no post request sent)
        expect(response.statusCode).toBe(302);
        expect(response.headers.location)
            .toBe('/campgrounds');

    });
    test('Users cannot delete another users reviews', async()=>{
        const agent = request.agent(app);
        const author = await createTestUser(
            'obiwankenobi@force.com',
            'Obi-wan Kenobi'
        );
        const attacker = await createTestUser(
            'evil@empire.com',
            'Darth Vader'
        );
        const campground = await createTestCampground(author);

        await agent
            .post('/login')
            .type('form')
            .send({
                userName:'Obi-wan Kenobi',
                password:'password123'
            });

        const review = new Review({
            body:"I sure hope nobody evil deletes this review :)",
            rating:5,
            author:author._id
        });

        campground.reviews.push(review);

        await review.save();
        await campground.save();

        // attempting to bypass the UI and delete another user's review triggers the middleware

        await agent
            .post('/logout');

        await agent
            .post('/login')
            .type('form')
            .send({
                userName:'Darth Vader',
                password:'password123'
            });

        const response = await agent
            .delete(
            `/campgrounds/${campground._id}/reviews/${review._id}`
            );
        
        // checking the http code doesn't really tell us much, so actually validate if the review was deleted or not
        expect(response.statusCode).toBe(302);
        const updatedCampground = await Campground
            .findById(campground._id)
            .populate('reviews');
        expect(updatedCampground.reviews).toHaveLength(1); 
        expect(updatedCampground.reviews[0].body)
            .toBe("I sure hope nobody evil deletes this review :)");

        expect(updatedCampground.reviews[0].rating)
            .toBe(5);   

    });
    
    test('Authenticated must post valid reviews for existing campgrounds', async () => {
        const agent = request.agent(app);
        const user = await createTestUser('a@a.ca', 'testUser');
        const campground = await createTestCampground(user);
        
        await agent
            .post('/login')
            .type('form')
            .send({
                userName: 'testUser',
                password: 'password123'
        });

        // this will be rejected as it's not in a form format
        const response = await agent
            .post(`/campgrounds/${campground._id}/reviews`)
            .send({
                review:{
                    body:"cool place :)",
                    rating:5
                }
            });
        expect(response.statusCode).toBe(400);
    });

    test('Authenticated users can delete their own review', async () => {
        const agent = request.agent(app);
        const user = await createTestUser('reviewer@test.com', 'reviewerUser');
        const campground = await createTestCampground(user);

        await agent
            .post('/login')
            .type('form')
            .send({ userName: 'reviewerUser', password: 'password123' });

        await agent
            .post(`/campgrounds/${campground._id}/reviews`)
            .type('form')
            .send({ review: { body: 'Oh no I reviewed the wrong campsite by mistake!', rating: 3 } });

        const withReview = await Campground.findById(campground._id);
        const reviewId = withReview.reviews[0];

        const response = await agent.delete(`/campgrounds/${campground._id}/reviews/${reviewId}`);
        expect(response.statusCode).toBe(302);
        expect(response.headers.location).toBe(`/campgrounds/${campground._id}`); 

        const updated = await Campground.findById(campground._id);
        expect(updated.reviews).toHaveLength(0);
    });

    test('Deleting a nonexistent review does not crash the server', async () => {
        // shouldn't be possible with the UI but the middleware supports safety for this so lets test it
        const agent = request.agent(app);
        const user = await createTestUser('reviewghost@test.com', 'reviewGhostUser');
        const campground = await createTestCampground(user);

        await agent.post('/login').type('form').send({ userName: 'reviewGhostUser', password: 'password123' });

        const fakeReviewId = new mongoose.Types.ObjectId();
        const response = await agent.delete(`/campgrounds/${campground._id}/reviews/${fakeReviewId}`);
        expect(response.statusCode).toBe(302);
    });


});
describe('Campgrounds routes', () => {
    test('Authenticated users allowed to add campgrounds', async () => {
        const agent = request.agent(app);
        const user = await createTestUser('a@a.ca', 'testUser');
        const campground = await createTestCampground(user);
        
        await agent
            .post('/login')
            .type('form')
            .send({
                userName: 'testUser',
                password: 'password123'
        });

        const foundCampground = await Campground
            .findById(campground._id)
        expect(foundCampground.description).toBe("A campground used for testing");
    });

    test('Unauthenticated users are redirected away from the new campground form', async () => {
        const response = await request(app).get('/campgrounds/new');
        expect(response.statusCode).toBe(302);
        expect(response.headers.location).toBe('/login');
    });

    test('Users cannot delete other users campground', async () => {

        const agent = request.agent(app);
        const owner = await createTestUser(
            'jim@email.com',
            'Jim'
        );
        const attacker = await createTestUser(
            'bob123@test.com',
            'bob'
        );
        const campground = await createTestCampground(owner);

        await agent
            .post('/login')
            .type('form')
            .send({
                userName:'bob',
                password:'password123'
            });

        const response = await agent
            .delete(`/campgrounds/${campground._id}`);
        expect(response.statusCode).toBe(302);

        const existingCampground =
            await Campground.findById(campground._id);
        expect(existingCampground).not.toBeNull();

    });
  
    test('Users can delete their own campgrounds', async () => {
        const agent = request.agent(app);

        const owner = await createTestUser(
            'bb@b.com',
            'bob'
        );
        const campground = await createTestCampground(owner);
        await agent
            .post('/login')
            .type('form')
            .send({
                userName:'bob',
                password:'password123'
            });

        const response = await agent.delete(`/campgrounds/${campground._id}`);

        expect(response.statusCode).toBe(302);
        expect(response.headers.location).toBe('/campgrounds');

        expect(await Campground.findById(campground._id)).toBeNull();

    });

    test('Users get redirected when trying to update a nonexistent campground', async () => {
        const agent = request.agent(app);
        await createTestUser('ghost@test.com', 'spooky');
        await agent
            .post('/login')
            .type('form')
            .send({ userName: 'spooky', password: 'password123' });

        const fakeId = new mongoose.Types.ObjectId();
        const response = await agent.put(`/campgrounds/${fakeId}`);

        // just validate that the isAuthor null-check redirects before the req body is read
        expect(response.statusCode).toBe(302);
        expect(response.headers.location).toBe('/campgrounds');
    });

    test('User can update their own campground', async () => {
        const agent = request.agent(app);
        const user = await createTestUser('wile@acmelabs.com', 'wileCoyote');
        const campground = await createTestCampground(user);

        await agent
            .post('/login')
            .type('form')
            .send({ userName: 'wileCoyote', password: 'password123' });

        const response = await agent
            .put(`/campgrounds/${campground._id}`)
            .type('form')
            .send({
                campground: {
                    title: 'Updated Campground Title',
                    location: 'Updated Location',
                    description: 'An updated description for testing',
                    price: 35
                }
            });

        expect(response.statusCode).toBe(302);
        expect(response.headers.location).toBe(`/campgrounds/${campground._id}`);

        const updated = await Campground.findById(campground._id);
        expect(updated.title).toBe('Updated Campground Title');
        expect(updated.price).toBe(35);
    });

    test('Users cannot update other users campground', async () => {
        const agent = request.agent(app);
        const owner = await createTestUser('rr@acmelabs.com', 'roadRunner');
        const user = await createTestUser('wile@acmelabs.com', 'wileCoyote');
        const campground = await createTestCampground(owner);

        await agent
            .post('/login')
            .type('form')
            .send({ userName: 'wileCoyote', password: 'password123' });

        const response = await agent
            .put(`/campgrounds/${campground._id}`)
            .type('form')
            .send({ campground: { title: 'Hijacked Title' } });

        expect(response.statusCode).toBe(302);
        expect(response.headers.location).toBe(`/campgrounds/${campground._id}`);

        const unchanged = await Campground.findById(campground._id);
        expect(unchanged.title).toBe('Test Campground'); // title should remain unchanged here
    });

    test('Unauthenticated users cannot update a campground', async () => {
        const user = await createTestUser('mystery@anon.com', 'someoneUser');
        const campground = await createTestCampground(user);

        const response = await request(app)
            .put(`/campgrounds/${campground._id}`)
            .type('form')
            .send({ campground: { title: 'Sneaky edit' } });

        expect(response.statusCode).toBe(302);
        expect(response.headers.location).toBe('/login');
    });

    test('Authenticated users cannot post invalid campgrounds', async () => {
        const agent = request.agent(app);
        await createTestUser('invalidcamp@test.com', 'invalidCampUser');
        await agent
            .post('/login')
            .type('form')
            .send({ userName: 'invalidCampUser', password: 'password123' });

        const response = await agent
            .post('/campgrounds')
            .type('form')
            .send({
                campground: {
                    title: '',            // missing title when its required 
                    location: 'Nowhere',
                    description: 'Missing a price',
                    price: -5              // negative price unacceptable
                }
            });

        expect(response.statusCode).toBe(400);
    });


});

describe('Authenticated E2E routes', () => {

    test('creating, updating, viewing, and deleting works end-to-end for an authenticated user', async () => {
        const agent = request.agent(app);
        const user = await createTestUser('happycamper@mail.ca', 'jerry');
        await agent
            .post('/login')
            .type('form')
            .send({ userName: 'jerry', password: 'password123' });

        const campground = await createTestCampground(user);

        const updateRes = await agent
            .put(`/campgrounds/${campground._id}`)
            .type('form')
            .send({ campground: { title: 'Updated Title', location: 'Test Location', description: 'Updated', price: 40 } });
        expect(updateRes.statusCode).toBe(302);

        const reviewRes = await agent
            .post(`/campgrounds/${campground._id}/reviews`)
            .type('form')
            .send({ review: { body: 'Great during the whole lifecycle!', rating: 4 } });
        expect(reviewRes.statusCode).toBe(302);

        const withReview = await Campground.findById(campground._id);
        expect(withReview.title).toBe('Updated Title');
        expect(withReview.reviews).toHaveLength(1);

        const reviewDeleteRes = await agent.delete(`/campgrounds/${campground._id}/reviews/${withReview.reviews[0]}`);
        expect(reviewDeleteRes.statusCode).toBe(302);

        const deleteRes = await agent.delete(`/campgrounds/${campground._id}`);
        expect(deleteRes.statusCode).toBe(302);

        expect(await Campground.findById(campground._id)).toBeNull();
    });



});
