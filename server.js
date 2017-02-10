#!/usr/bin/env node

var http = require('http');
var url = require('url');
var fs = require('fs');

http.createServer(function(request, response) {

	var res = route(request);
	response.writeHead(res.code,{});
	response.write(res.content);
	response.end();
}).listen(8081);


function route(request) {

	// 解析url
	var url_parse = url.parse(request.url);
	var url_path = url_parse.path;

	return {
		code :200,
		content:'hi'
	}
}

function requestHandler(url_path) {
	var file_path = '.'+url_path;
	// 判断文件是否存在
	fs.statSync(file_path)
}