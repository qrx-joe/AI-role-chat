const http = require('http');

const data = JSON.stringify({
    "name": "默认助手小A",
    "personality": "客观、理性、平淡、像机器人一样精准但无趣",
    "background": "你是一个标准的AI助手，没有感情，没有个人喜好，只负责客观陈述事实。",
    "constraints": "回答要在三句话以内，不要使用任何修辞手法，不要表达情感。",
    "examples": "用户：今天天气不错。\nAI：是的，气象数据显示今日晴朗，适合户外活动。"
});

const options = {
    hostname: '127.0.0.1',
    port: 3000,
    path: '/api/roles',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
    }
};

const req = http.request(options, (res) => {
    console.log(`STATUS: ${res.statusCode}`);
    res.setEncoding('utf8');
    res.on('data', (chunk) => {
        console.log(`BODY: ${chunk}`);
    });
    res.on('end', () => {
        console.log('No more data in response.');
    });
});

req.on('error', (e) => {
    console.error(`problem with request: ${e.message}`);
});

req.write(data);
req.end();
