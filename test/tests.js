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

console.log(BlogPost);
// middleware
chai.use(chaiHttp);

// seed functions
function seedBlogPostData() {
	console.info('seeding blog post data');
	const seedData = [];
  for (let i=1; i<=10; i++) {
    seedData.push(generateBlogPostData());
  }
  // this will return a promise
  return BlogPost.insertMany(seedData);
}

function generateBlogPostData() {
	return {
		author: {
			firstName: faker.name.firstName(),
			lastName: faker.name.lastName()
		},
		title: faker.lorem.words,
		content: faker.lorem.sentences,
		created: faker.date.past
	};
}

// called after each test
function tearDownDb() {
  console.warn('Deleting database');
  return mongoose.connection.dropDatabase();
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
				.then(function(_res) {
					res = _res;
					res.should.have.status(200);
					res.body.blogposts.should.have.length.of.at.least(1);
					return BlogPost.count();
				})
				.then(function(count) {
					res.body.blogposts.should.have.length.of(count);
				});
		});

		it('should return blog posts with right fields', function() {
			let resBlogPost;
			return chai.request(app)
				.get('/blog-posts')
				.then(function(res) {
					res.should.have.status(200);
					res.should.be.json;
					res.body.blogposts.should.be.a('array');
					res.body.blogposts.should.have.length.of.at.least(1);
					res.body.blogposts.forEach(function(blogpost) {
						blogpost.should.be.a('object');
						blogpost.should.include.keys('id', 'author', 'title', 'content', 'created');
					});
					resBlogPost = res.body.blogposts[0];
					return BlogPost.findById(resBlogPost.id);
				})
				.then(function(blogpost) {
					resBlogPost.id.should.be.equal(blogpost.id);
					resBlogPost.author.should.be.equal(blogpost.author);
					resBlogPost.title.should.be.equal(blogpost.title);
					resBlogPost.content.should.be.equal(blogpost.content);
					resBlogPost.created.should.be.equal(blogpost.created);
				});
		});
	});

});

