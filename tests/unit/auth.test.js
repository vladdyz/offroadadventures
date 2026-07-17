const { isLoggedIn } = require('../../middleware');


// Unauthenticated users should be redirected by middleware
test('redirects unauthenticated users', () => {
    const req = {
        isAuthenticated: jest.fn(() => false),
        session: {},
        originalUrl: '/campgrounds/123',
        flash: jest.fn()
    };

    const res = {
        redirect: jest.fn()
    };

    const next = jest.fn();

    isLoggedIn(req, res, next);

    expect(res.redirect).toHaveBeenCalledWith('/login');
    expect(next).not.toHaveBeenCalled();
});