exports.DATABASE_URL = process.env.DATABASE_URL ||
                       global.DATABASE_URL ||
                      'mongodb://chasingSublimity:lavalamp1@ds035740.mlab.com:35740/blog-posts';
exports.TEST_DATABASE_URL = (
	process.env.TEST_DATABASE_URL ||
	'mongodb://localhost/test-blog-posts');
exports.PORT = process.env.PORT || 8080;