因为最近在学习vue.js，需要渲染网页。但是搭建php的环境又感觉略复杂，所以用nodejs学习谢了一个server.js 用于方便自己本地的页面调试。要求的功能如下
1. 支持html页面的访问
2. 支持默认index.html、index.htm文件访问
3. 支持路由+完整路径访问

关于第2条，访问`http://localhost.com:8080/vue/` 指向`vue/index.html文件`
### 项目地址
[https://github.com/sunshinev/sunhuajie_node_server](https://github.com/sunshinev/sunhuajie_node_server)
### 目录结构

```
sunhuajie:node sun.huajie$ tree
.
├── index.js // 启动服务的文件
├── lyric.txt // 读写测试的文本文件
├── node_modules
│   └── huajie_server // 自定义模块
│       ├── package.json // 模块配置
│       ├── requesthandler.js // 请求处理脚本
│       ├── router.js // 路由脚本
│       └── server.js // 服务创建脚本
└── vue // 工作目录
    └── index.html

```
### 服务创建过程
#### index.js 启动
因为将server封装为了一个模块，所以每次启动的时候只需要引入，然后node index.js就可以了。
```
#!/usr/bin/env node

var server = require('huajie_server');
server.create();
```
效果如图：

```
sunhuajie:node sun.huajie$ node index.js
the port is 8080

```

#### server.js 创建服务
`_onRequest`实现了对请求的处理，并且作为闭包传递给`http.createServer`。状态码由路由层进行返回。
```
#!/usr/bin/env node

var http = require('http');
var router = require('./router');

// 创建server 默认端口为8080
function create(port = 8080) {
	console.info('the port is '+port);
	http.createServer(_onRequest).listen(port);
}

// 处理请求
function _onRequest(request, response) {
	// 路由
	var res = router.route(request.url);
	// 状态码
	response.writeHead(res.code,{});
	// 响应内容
	response.write(res.content);
	response.end();
}

exports.create = create;
```

#### router.js 路由
路由此处跟php的mvc的`dispatcher`（分发器）很像，分析url参数以及目录，实现文件指向。**这里有个小问题，就是当时写这个router的时候，其实应该将`requesthandler.js`里面的关于文件判断的部分放到router里面才算合理。但是当时为了方便就直接写到requesthandler里面了（后面给大家看这个文件）。**

在路由这一层，实际上还可以添加一个`rewrite`的配置。先分析`url`，通过`rewrite`重新指向后，再把指向后的地址传递给`requesthandler`进行处理。

```
#!/usr/bin/env node

var url = require('url');
var querystring = require('querystring');
var requesthandler = require('./requesthandler');

// todo 后期可以扩展路由部分

function route(request_url) {
	// 解析地址
	var url_parse = url.parse(request_url);
	var url_path = url_parse['path'];
	
	var res = {};
	var code = 200;
	// 判断路径是否存在
	var content = requesthandler.handle(url_path);

	return {
		'code':code,
		'content':content
	}
}

exports.route = route;
```

#### requesthandler.js 请求处理+文件指向

这个文件最简单的目的是实现对html文件的读取以及输出。但是我们加了一层默认文件，所以需要对目录进行遍历，并且判断当前的childnode是dir还是file。

默认可以访问`index.html`和`index.htm`两个文件。

`_findFile`方法，首先判断当前传递的file_path是否是存在的文件，如果不是文件，那么在这个目录层级中进行搜索，是否存在默认可以访问的文件。进行遍历的时候，没有使用`forEach`，因为会遍历所有的文件，无论中间是否有`return`。

`_isFile`方法，使用了try catch ，因为`fs.statSync`在文件不存在的时候，会抛出错误，导致脚本终止。


```
#!/usr/bin/env node

var fs = require('fs');

// 默认检索文件，可以修改为配置项
var default_files = [
	'index.htm',
	'index.html'
];

function handle(url_path) {
	// 文件路径构造
	var file_path = '.' + url_path;
	// 判断路径是否存在
	var f_path = _findFile(file_path);
	
	if(!f_path) {
		return 'the path "'+file_path+'" is not exist';
	}else {
		var content = fs.readFileSync(f_path);
		return content;
	}
}
/**
 * 检索目录下的不同文件名是否存在，建立优先级
 * @return {[type]} [description]
 */
function _findFile(file_path) {
	var is_file = _isFile(file_path);
	// 如果文件存在，直接返回路径
	if(is_file) {
		return file_path;
	}
	// 文件不存在，构造路径寻找文件
	var regex = /^\.\/[\w]*([\/][\w]+)?/;
	var regex_res = file_path.match(regex);
	// 匹配出目录路径 ./vue/test/s => ./vue/test
	if(!regex_res) {
		return '';
	}else {
		// 这里没有使用forEach，因为会遍历所有的值
		for(var i=0; i<default_files.length; i++) {
			var new_path = regex_res[0]+'/'+default_files[i];
			if(_isFile(new_path)) {
				return new_path;
			}
		}
	}
}
/**
 * 文件是否存在
 * @param  {[type]}  file_path [description]
 * @return {Boolean}           [description]
 */
function _isFile(file_path) {
	try {
		// 同步会抛出异常，所以用try来保证正常执行
		var stat = fs.statSync(file_path);
		// 返回是否是文件
		return stat.isFile();
	}catch(e) {
		console.info(e.message);
	}
	
	
}

exports.handle = handle;
```

### 最终效果
#### 启动
```
sunhuajie:node sun.huajie$ node index.js
the port is 8080
```
#### 浏览器访问
访问|实际
--|---
`http://localhost:8080/vue/` | 指向`index.html`
`http://localhost:8080/vue` |  指向`index.html`
`http://localhost:8080/` | `the path "./" is not exist`
`http://localhost:8080/vue/s` | `the path "./vue/s" is not exist`



