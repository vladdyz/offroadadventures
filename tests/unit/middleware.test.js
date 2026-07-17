jest.mock('../../models/campground');
const request = require('supertest');
const app = require('../../index');
const Campground = require('../../models/campground');
const { isAuthor } = require('../../middleware');
const { createTestUser, createTestCampground, populateCampgrounds } = require('../testingData');

describe('isAuthor middleware', () => {
    test('calls next() when the logged-in user is the campground author', async () => {
        const req = { params: { id: 'someid' }, user: { _id: 'user1' }, flash: jest.fn() };
        const res = { redirect: jest.fn() };
        const next = jest.fn();

        Campground.findById.mockResolvedValue({ author: { equals: (id) => id === 'user1' } });

        await isAuthor(req, res, next);

        expect(next).toHaveBeenCalled();
        expect(res.redirect).not.toHaveBeenCalled();
    });

    test('redirects when the logged-in user is not the author', async () => {
        const req = { params: { id: 'someid' }, user: { _id: 'user2' }, flash: jest.fn() };
        const res = { redirect: jest.fn() };
        const next = jest.fn();

        Campground.findById.mockResolvedValue({ author: { equals: (id) => id === 'user1' } });

        await isAuthor(req, res, next);

        expect(res.redirect).toHaveBeenCalledWith('/campgrounds/someid');
        expect(next).not.toHaveBeenCalled();
    });

    test('redirects to /campgrounds when the campground does not exist', async () => {
        const req = { params: { id: 'ghost' }, user: { _id: 'user1' }, flash: jest.fn() };
        const res = { redirect: jest.fn() };
        const next = jest.fn();

        Campground.findById.mockResolvedValue(null);

        await isAuthor(req, res, next);

        expect(res.redirect).toHaveBeenCalledWith('/campgrounds');
        expect(next).not.toHaveBeenCalled();
    });

});