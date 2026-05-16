import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '10s', target: 10 },   // ramp up to 10 VUs
    { duration: '20s', target: 50 },   // ramp up to 50 VUs
    { duration: '30s', target: 50 },   // sustain 50 VUs for 30s
    { duration: '10s', target: 0 },    // ramp down to 0
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'], // 95% of requests under 2s
    http_req_failed: ['rate<0.05'],    // <5% failure rate
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export default function () {
  // Hit homepage
  const home = http.get(`${BASE_URL}/`);
  check(home, { 'homepage OK': (r) => r.status === 200 });
  sleep(1);

  // Search API
  const search = http.get(`${BASE_URL}/api/alumni/search?q=%E5%BC%A0`);
  check(search, { 'search OK': (r) => r.status === 200 });
  sleep(0.5);

  // Map API
  const map = http.get(`${BASE_URL}/api/alumni/map`);
  check(map, { 'map OK': (r) => r.status === 200 });
  sleep(0.5);

  // Admin stats
  const stats = http.get(`${BASE_URL}/api/admin/stats`);
  check(stats, { 'stats OK': (r) => r.status === 200 });
  sleep(1);
}
