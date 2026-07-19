# OFFROAD ADVENTURES

![Deployment](https://img.shields.io/badge/deployed-Render-success)
![Database](https://img.shields.io/badge/database-MongoDB-green)
![Framework](https://img.shields.io/badge/framework-Express-blue)
[![CI](https://github.com/vladdyz/offroadadventures/actions/workflows/ci.yml/badge.svg)](https://github.com/vladdyz/offroadadventures/actions/workflows/ci.yml)



A full-stack campground review application built with Node.js, Express, MongoDB, and EJS.

The included campground listings are generated seed data and are not intended to represent real businesses or locations. Seeded entries use randomized:
- campground names
- images
- geographic coordinates within the United States

Additional listings may be created by authenticated users to demonstrate the full CRUD workflow.

This project demonstrates a full-stack location-based review platform architecture. The underlying design can be adapted to support other location-based domains such as restaurants, hotels, museums, heritage sites, or attractions.


Live Demo at: https://offroadadventures.onrender.com/ (may take a few seconds to boot up!)

## Preview

![GIF of Offroad Adventures UI](https://github.com/vladdyz/offroadadventures/blob/main/images/offroadadventure.gif)


## Features & Technical Highlights

- Full authentication system using Passport.js and passport-local-mongoose
- Persistent user sessions stored with MongoDB
- RESTful CRUD operations for campgrounds and reviews
- Authorization middleware to restrict resource modification
- Image uploads and cloud storage integration using Cloudinary
- Interactive geospatial maps using MapTiler
- MongoDB document relationships using Mongoose references and population
- Server-side rendering using EJS templates
- Request validation using Joi
- Security middleware using Helmet and express-mongo-sanitize

## Architecture

The application follows an MVC-inspired structure with separation of route definitions, business logic, database models, and presentation:

controllers/
- route handling and business logic

models/
- MongoDB schemas using Mongoose

routes/
- RESTful endpoint definitions

views/
- server-rendered EJS templates

middleware/
- authentication, authorization, validation, and error handling

## Tech Stack

Frontend:
- EJS
- Bootstrap

Backend:
- Node.js
- Express
- MongoDB
- Mongoose

Authentication:
- Passport.js
- passport-local-mongoose

Deployment:
- Render
- MongoDB Atlas

## Project History

Originally developed in 2024 as a full-stack web development project, this application was revisited and enhanced with additional improvements including deployment configuration, environment variable management, authentication fixes, testing infrastructure, and production deployment.

During development, a misconfiguration had been diagnosed and resolved regarding the test suite potentially connecting to the prod database instead of the in-memory instance. The app code and entrypoint was substantially refactored with isolating safeguards put in place to guarantee that test runs cannot reach prod data, one of which being the assertSafeToWipe() guard ensuring that data on the cloud cannot be cleared. 

The project is currently deployed and maintained as a portfolio demonstration.

## Testing

An automated test suite using Jest, Supertest, and MongoDB-Memory-Server is configured to cover authentication, authorization, CRUD operations for managing/updating/reviewing location-based data, and includes edge cases like malformed ID values, cross-user auth attempts and validation failures. 

The configuration is as follows:
- 42+ tests across unit and integration suites
- All tests run against an in-memory MongoDB instance which is fully isolated from prod
- CI runs this suite in its entirety on every push/PR via GitHub actions
- To run this locally, use the following commands:
\`\`\`bash
npm test              # run the suite
npm run test:coverage # generate a coverage report
\`\`\`



## Environment Variables

See `.env.example`

## Deployment

The application is deployed using:

- Render (Node.js application hosting)
- MongoDB Atlas (database hosting)
- Cloudinary (image storage)


## Future Improvements

Potential future enhancements:
- Replace generated seed data with a real campground dataset or API
- Add user profile pages with ratings history
- Add campground search and filtering
- Add pagination for campground listings [✓]
- Add automated test coverage and support for CI/CD [✓]
- Improve mobile-first UI design
