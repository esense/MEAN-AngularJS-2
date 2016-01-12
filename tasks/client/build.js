//Modules
var gulp = require("gulp");
var shell = require("gulp-shell");
var replace = require("gulp-replace");
var tslint = require("gulp-tslint");
var jshint = require("gulp-jshint");
var ts = require("gulp-typescript");
var sourcemaps = require("gulp-sourcemaps");
var concat = require("gulp-concat");
var jade = require("gulp-jade");
var stylus = require("gulp-stylus");

/* !Tasks 
- client.build
	
- client.build.copy
- client.build.copy.source
- client.build.copy.libs

- client.build.javascript
- client.build.javascript.lint

- client.build.typescript
- client.build.typescript.lint
- client.build.typescript.compile

- client.build.markup
- client.build.markup.jade
- client.build.markup.stylus
*/

// !Build
gulp.task("client.build", gulp.series(
	gulp.parallel("client.build.javascript", "client.build.typescript"),
	gulp.parallel("client.build.copy", "client.build.markup")
));

// !Copy
gulp.task("client.build.copy", gulp.parallel("client.build.copy.source", "client.build.copy.libs"));

//Copy over client source files
gulp.task("client.build.copy.source", function(){
	return gulp.src([
		"client/**/*",
		"!client/**/*.ts",
		"!client/**/*.jade",
		"!client/**/*.styl",
		"!client/tsd.json",
		"!client/typings",
		"!client/typings/**/*"
	])
	.pipe(gulp.dest("builds/client"));
});

//Copy over library dependancies
gulp.task("client.build.copy.libs", function(){
	return gulp.src([
		//Modules
		"node_modules/systemjs/dist/system-polyfills.js",
		"node_modules/systemjs/dist/system-polyfills.js.map",
		"node_modules/systemjs/dist/system.src.js",
		"node_modules/es6-shim/es6-shim.js",
		"node_modules/rxjs/bundles/Rx.js",
		"node_modules/angular2/bundles/angular2-polyfills.js",
		//AngularJS
		"node_modules/angular2/bundles/angular2.js",
		"node_modules/angular2/bundles/router.dev.js",
		"node_modules/angular2/bundles/http.dev.js",
		"node_modules/angular2/bundles/testing.dev.js",
		//Dependancies
		"bower_components/jquery/dist/jquery.min.js",
		//Semantic UI
		"semantic/dist/semantic.min.js",
		"semantic/dist/semantic.min.css",
		"semantic/dist/*/**/*"
	])
	.pipe(gulp.dest("builds/client/libs"));
});

// !Javascript
gulp.task("client.build.javascript", gulp.series("client.build.javascript.lint"));

//Check javascript for lint
gulp.task("client.build.javascript.lint", function(){
	return gulp.src([
		"client/**/*.js",
		"!client/typings/**/*"
	])
	.pipe(jshint())
    .pipe(jshint.reporter("default"));
});

// !Typescript
gulp.task("client.build.typescript", gulp.series("client.build.typescript.lint", "client.build.typescript.compile"));

//Check typescript lint
gulp.task("client.build.typescript.lint", function(){
	return gulp.src([
		"client/**/*.ts",
		"!client/typings/**/*"
	])
	.pipe(tslint({
        configuration: {
	        rules: {
				"no-duplicate-key": true,
				"no-duplicate-variable": true,
				"semicolon": true,
				"triple-equals": true
	        }
        }
    }))
    .pipe(tslint.report("verbose", {
	    emitError: false
    }));
});

//Compile typescript into javascript
gulp.task("client.build.typescript.compile", function() {
	var output = gulp.src([
			"client/**/*.ts",
			"client/typings/**/*.d.ts"
		])
		.pipe(sourcemaps.init())
		.pipe(ts(ts.createProject({
			typescript: require("typescript"),
			target: "es5",
			module: "system",
			moduleResolution: "node",
			sourceMap: true,
			emitDecoratorMetadata: true,
			experimentalDecorators: true,
			removeComments: true,
			noImplicitAny: false,
			suppressImplicitAnyIndexErrors: true,
			sortOutput: true
		})))
	return output.js
		.pipe(sourcemaps.write("./"))
		.pipe(gulp.dest("builds/client"));
});

// !Markup
gulp.task("client.build.markup", gulp.parallel("client.build.markup.jade", "client.build.markup.stylus"));

//Compile jade into html
gulp.task("client.build.markup.jade", function(){
	return gulp.src("client/**/*.jade")
		.pipe(jade())
		.pipe(gulp.dest("builds/client"));
});

//Compile stylus to css
gulp.task("client.build.markup.stylus", function(){
	return gulp.src("client/**/*.styl")
		.pipe(stylus())
		.pipe(concat("app.css"))
		.pipe(gulp.dest("builds/client/"));
});