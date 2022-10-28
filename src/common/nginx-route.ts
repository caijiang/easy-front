import fs from 'fs';
import { uniq } from 'lodash';

function fetchPaths1(routes: any[]): string[] {
  // 如果它含有 routes 那么就用内部的
  const rs = routes
    .filter((it) => !!it.path)
    .map((it) => {
      if (it.routes) return fetchPaths2(it.routes);
      return [it.path];
    });
  return rs.flatMap((it) => it);
}

function fetchPaths2(routes: any[]): string[] {
  // 如果它含有 routes 那么就用内部的
  const rs = routes
    .filter((it) => !!it.path)
    .map((it) => {
      if (it.routes) return fetchPaths1(it.routes);
      return [it.path];
    });
  return rs.flatMap((it) => it);
}

const p1 = /^(.+):\w+(.+):\w+(.+):\w+(.+)$/;
const p2 = /^(.+):\w+(.+):\w+(.+):\w+$/;
const p3 = /^(.+):\w+(.+):\w+(.+)$/;
const p4 = /^(.+):\w+(.+):\w+$/;
const p5 = /^(.+):\w+(.+)$/;
const p6 = /^(.+):\w+$/;

function nginxLocations(routePath: string[]) {
  // 正则 /project/:id/assets
  const paths = routePath
    .map((it) => {
      const m2 = p2.exec(it);
      if (m2) {
        return `location ~ ^${m2[1]}.+${m2[2]}.+${m2[3]}.+$`;
      }
      const m1 = p1.exec(it);
      if (m1) {
        return `location ~ ^${m1[1]}.+${m1[2]}.+${m1[3]}.+${m1[4]}$`;
      }

      const m4 = p4.exec(it);
      if (m4) {
        return `location ~ ^${m4[1]}.+${m4[2]}.+$`;
      }
      const m3 = p3.exec(it);
      if (m3) {
        return `location ~ ^${m3[1]}.+${m3[2]}.+${m3[3]}$`;
      }

      const m6 = p6.exec(it);
      if (m6) {
        return `location ~ ^${m6[1]}.+$`;
      }
      const m5 = p5.exec(it);
      if (m5) {
        return `location ~ ^${m5[1]}.+${m5[2]}$`;
      }

      return `location = ${it}`;
    })
    .map((it) => `${it} {try_files $uri $uri/ /index.html;}`);

  return paths.join('\n');
}

let executed = false;
export default (routes: any, input: string, output: string) => {
  if (executed) return;
  executed = true;
  const paths = uniq([...fetchPaths1(routes), '/404']);
  const config = nginxLocations(paths);

  const originFile = fs.readFileSync(input, 'utf-8');
  let rs = originFile;
  while (rs.indexOf('#!!!!ROUTES!!!!') !== -1) {
    rs = rs.replace('#!!!!ROUTES!!!!', config);
  }

  fs.writeFileSync(output, rs, { encoding: 'utf-8' });
};
