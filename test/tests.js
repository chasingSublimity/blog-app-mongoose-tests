/* jshint esversion:6 */
/* jshint expr:true */

// imports
const chai = require('chai');
const chaiHttp = require('chai-http');
const faker = require('faker');
const mongoose = require('mongoose');

const should = chai.should();

const {BlogPost} = require('../models');
const {app, runServer, closeServer} = require('../server');
const {TEST_DATABASE_URL} = require('../config');

// middleware
chai.use(chaiHttp);

// called after each test
function tearDownDb() {
  console.warn('Deleting database');
  return mongoose.connection.dropDatabase();
}

// seed functions
function seedBlogPostData() {
	console.info('seeding blog post data');
	const seedData = [];
  for (let i=1; i<=10; i++) {
    seedData.push({
    	author: {
				firstName: faker.name.firstName(),
				lastName: faker.name.lastName()
			},
			title: faker.lorem.words,
			content: faker.lorem.sentences,
		});
  }
  // this will return a promise
  return BlogPost.insertMany(seedData);
}

// tests
describe('Blog API Resource', function() {

	// hook functions
	before(function() {
		return runServer(TEST_DATABASE_URL);
	});

  beforeEach(function() {
    return seedBlogPostData();
  });

	afterEach(function() {
		return tearDownDb();
	});

	after(function() {
		return closeServer();
	});

	// GET
	describe('GET endpoint', function() {
		it('should return all existing Blog Posts', function() {
			let res;
			return chai.request(app)
				.get('/blog-posts')
				.then(_res => {
					res = _res;
					res.should.have.status(200);
					res.body.should.have.length.of.at.least(1);
					return BlogPost.count();
				})
				.then(function(count) {
					res.body.should.have.length.of(count);
				});
		});

		it('should return blog posts with right fields', function() {
			let resBlogPost;
			return chai.request(app)
				.get('/blog-posts')
				.then(function(res) {
					res.should.have.status(200);
					res.should.be.json;
					res.body.should.be.a('array');
					res.body.should.have.length.of.at.least(1);
					res.body.forEach(function(blogpost) {
						blogpost.should.be.a('object');
						blogpost.should.include.keys('id', 'author', 'title', 'content', 'created');
					});
					resBlogPost = res.body[0];
					return BlogPost.findById(resBlogPost.id).exec();
				})
				.then(blogpost => {
					resBlogPost.author.should.equal(blogpost.authorName);
					resBlogPost.title.should.equal(blogpost.title);
					resBlogPost.content.should.equal(blogpost.content);
				});
		});
	});

	describe('POST endpoint', function() {
		it('should add a new blog post', function() {
			const newBlogPost = {
          title: faker.lorem.sentence(),
          author: {
            firstName: faker.name.firstName(),
            lastName: faker.name.lastName(),
          },
          content: faker.lorem.text()
      };
			return chai.request(app)
				.post('/blog-posts')
				.send(newBlogPost)
				.then(function(res) {
					res.should.have.status(201);
					res.should.be.json;
					res.body.should.be.a('object');
					res.body.should.include.keys('id', 'author', 'title', 'content', 'created');
					res.body.id.should.not.be.null;
					res.body.title.should.equal(newBlogPost.title);
					res.body.author.should.equal(`${newBlogPost.author.firstName} ${newBlogPost.author.lastName}`);
					res.body.content.should.equal(newBlogPost.content);
					return BlogPost.findById(res.body.id).exec();
				})
				.then(function(blogpost) {
					blogpost.title.should.equal(newBlogPost.title);
					blogpost.author.firstName.should.equal(newBlogPost.author.firstName);
					blogpost.author.lastName.should.equal(newBlogPost.author.lastName);
					blogpost.content.should.equal(newBlogPost.content);
				});
		});
	});

	describe('PUT endpoint', function() {
		it('should update fields you send over', function() {
			const updateData = {
				title: "foofofofofofo",
				content: "barbarbarbar"
			};

			return BlogPost
			.findOne()
			.exec()
			.then(function(blogpost) {
				updateData.id = blogpost.id;
				return chai.request(app)
				.put(`/blog-posts/${blogpost.id}`)
				.send(updateData);
			})
			.then(function(res) {
				res.should.have.status(204);
				return BlogPost.findById(updateData.id).exec();
			})
			.then(function(blogpost) {
				blogpost.title.should.equal(updateData.title);
				blogpost.content.should.equal(updateData.content);
			});
		});
	});

	describe('DELETE endpoint', function() {
		it('delete a blogpost by id', function() {
			let blogpost;
			return BlogPost
				.findOne()
				.exec()
				.then(function(_blogpost) {
					blogpost = _blogpost;
					return chai.request(app).delete(`/blog-posts/${blogpost.id}`);
				})
				.then(function(res) {
					res.should.have.status(204);
					return BlogPost.findById(blogpost.id).exec();
				})
				.then(function(_blogpost) {
					should.not.exist(_blogpost);
				});
		});
	});
});

