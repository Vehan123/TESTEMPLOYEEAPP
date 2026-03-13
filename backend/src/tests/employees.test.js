const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');

// Use in-memory DB for tests
process.env.DB_PATH = ':memory:';

const app = require('../app');

let server;
let baseUrl;

before(() => new Promise((resolve) => {
  server = http.createServer(app);
  server.listen(0, () => {
    const { port } = server.address();
    baseUrl = `http://localhost:${port}/api/employees`;
    resolve();
  });
}));

after(() => new Promise((resolve) => {
  server.close(resolve);
}));

function request(method, url, body) {
  return new Promise((resolve, reject) => {
    const opts = new URL(url);
    const options = {
      hostname: opts.hostname,
      port: opts.port,
      path: opts.pathname + opts.search,
      method,
      headers: { 'Content-Type': 'application/json' },
    };
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data || 'null') });
        } catch {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

const sample = {
  name: 'Alice Smith',
  email: 'alice@example.com',
  department: 'Engineering',
  role: 'Developer',
  hire_date: '2023-01-15',
};

test('POST /api/employees creates a new employee', async () => {
  const res = await request('POST', baseUrl, sample);
  assert.equal(res.status, 201);
  assert.equal(res.body.name, sample.name);
  assert.equal(res.body.email, sample.email);
  assert.ok(res.body.id);
});

test('POST /api/employees returns 400 when fields are missing', async () => {
  const res = await request('POST', baseUrl, { name: 'Bob' });
  assert.equal(res.status, 400);
  assert.ok(res.body.error);
});

test('POST /api/employees returns 400 for invalid email', async () => {
  const res = await request('POST', baseUrl, { ...sample, email: 'not-an-email' });
  assert.equal(res.status, 400);
});

test('POST /api/employees returns 409 for duplicate email', async () => {
  await request('POST', baseUrl, { ...sample, email: 'dup@example.com' });
  const res = await request('POST', baseUrl, { ...sample, email: 'dup@example.com' });
  assert.equal(res.status, 409);
});

test('GET /api/employees returns list of employees', async () => {
  const res = await request('GET', baseUrl, null);
  assert.equal(res.status, 200);
  assert.ok(Array.isArray(res.body));
  assert.ok(res.body.length >= 1);
});

test('GET /api/employees?department= filters by department', async () => {
  await request('POST', baseUrl, { ...sample, email: 'hr1@example.com', department: 'HR' });
  const res = await request('GET', `${baseUrl}?department=HR`, null);
  assert.equal(res.status, 200);
  assert.ok(res.body.every((e) => e.department === 'HR'));
});

test('GET /api/employees/:id returns a single employee', async () => {
  const created = await request('POST', baseUrl, { ...sample, email: 'getbyid@example.com' });
  const res = await request('GET', `${baseUrl}/${created.body.id}`, null);
  assert.equal(res.status, 200);
  assert.equal(res.body.id, created.body.id);
});

test('GET /api/employees/:id returns 404 for unknown id', async () => {
  const res = await request('GET', `${baseUrl}/99999`, null);
  assert.equal(res.status, 404);
});

test('PUT /api/employees/:id updates an employee', async () => {
  const created = await request('POST', baseUrl, { ...sample, email: 'update@example.com' });
  const res = await request('PUT', `${baseUrl}/${created.body.id}`, {
    ...sample,
    email: 'update@example.com',
    name: 'Updated Name',
  });
  assert.equal(res.status, 200);
  assert.equal(res.body.name, 'Updated Name');
});

test('PUT /api/employees/:id returns 404 for unknown id', async () => {
  const res = await request('PUT', `${baseUrl}/99999`, sample);
  assert.equal(res.status, 404);
});

test('DELETE /api/employees/:id deletes an employee', async () => {
  const created = await request('POST', baseUrl, { ...sample, email: 'delete@example.com' });
  const del = await request('DELETE', `${baseUrl}/${created.body.id}`, null);
  assert.equal(del.status, 204);
  const get = await request('GET', `${baseUrl}/${created.body.id}`, null);
  assert.equal(get.status, 404);
});

test('DELETE /api/employees/:id returns 404 for unknown id', async () => {
  const res = await request('DELETE', `${baseUrl}/99999`, null);
  assert.equal(res.status, 404);
});
