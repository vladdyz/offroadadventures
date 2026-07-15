# OFFROAD ADVENTURES

A full-stack campground review application built with Node.js, Express, MongoDB, and EJS.

The included campground listings are generated seed data and are not intended to represent real businesses or locations. Seeded entries use randomized:
- campground names
- descriptions
- images
- geographic coordinates within the United States

Additional listings may be created by authenticated users to demonstrate the full CRUD workflow.

This project was a proof-of-concept learning exercise and the application architecture can be adapted to support other location-based domains such as restaurants, hotels, museums, heritage sites, or attractions.

## Features

- User authentication with Passport.js
- Create, edit, and delete campgrounds
- Image uploads with Cloudinary
- Interactive maps using MapTiler
- User reviews and ratings
- Authorization middleware
- Persistent sessions using MongoDB

## Architecture

The application follows an MVC-inspired structure:

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

## Environment Variables

See `.env.example`
