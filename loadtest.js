import http from 'k6/http';

export const options = {
  stages: [
    { duration: '30s', target: 1000 },
    { duration: '30s', target: 5000 },
    { duration: '30s', target: 10000 },
  ],
};

export default function () {
  http.get('https://gigantic-tightness-crayon.ngrok-free.dev');
}