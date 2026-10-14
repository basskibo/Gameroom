#!/usr/bin/env python3
"""Play Remi Vita rounds in the real (system) Firefox and report whether the browser survives.

BUG-001: Firefox's WebRender panicked ("unexpected case - please open a bug and talk to #gfx team!")
right after "Save round" and took the whole browser down. Playwright here drives Chrome only,
so this script drives the installed Firefox over Marionette. One Firefox at a time, always closed.

  python3 -m http.server 4180            # from the repo root, in another terminal
  python3 tests/tools/firefox-rounds.py  # [--url URL] [--rounds 4] [--runs 3]

Exit code 0 = every run survived, 1 = Firefox crashed in some run.
"""
import argparse, json, os, random, shutil, socket, subprocess, sys, tempfile, time

ROUND_JS = """
const [i, done] = arguments;
const $ = s => document.querySelector(s), sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  if (i === 0) { window.__remi.start(['Ana', 'Marko', 'Jovana', 'Nikola']); await sleep(2500); }
  $('#enterBtn').click(); await sleep(1200);
  const ids = window.__remi.match.players.map(p => p.id);
  $(`.wbtn[data-pid=${ids[i % ids.length]}]`).click(); await sleep(600);
  for (let k = 0; k < ids.length - 1; k++) { $('#keypad [data-k="7"]').click(); $('#keypad [data-k="next"]').click(); }
  $('#saveRound').click(); await sleep(5000);
  done(window.__remi.derive(window.__remi.match).roundNo);
})().catch(e => done('error: ' + e.message));
"""


class Marionette:
    def __init__(self, port, wait=40):
        t0 = time.time()
        while True:
            try:
                self.sock = socket.create_connection(('127.0.0.1', port), timeout=2); break
            except OSError:
                if time.time() - t0 > wait: raise SystemExit('Firefox did not open Marionette on port %d' % port)
                time.sleep(0.5)
        self.sock.settimeout(90); self.buf = b''; self.id = 0; self._read()

    def _read(self):
        while b':' not in self.buf: self.buf += self._recv()
        n, rest = self.buf.split(b':', 1); n = int(n)
        while len(rest) < n: rest += self._recv()
        self.buf = rest[n:]; return json.loads(rest[:n])

    def _recv(self):
        d = self.sock.recv(65536)
        if not d: raise EOFError('Firefox closed the connection (crashed)')
        return d

    def cmd(self, name, params=None):
        self.id += 1; m = json.dumps([0, self.id, name, params or {}]).encode()
        self.sock.sendall(str(len(m)).encode() + b':' + m)
        r = self._read()
        if r[2]: raise RuntimeError(r[2])
        return r[3]


def run_once(url, rounds, port):
    # the profile lives in $HOME, not hidden: the snap Firefox reads neither /tmp nor dot-folders
    prof = tempfile.mkdtemp(prefix='remi-ff-test-', dir=os.path.expanduser('~'))
    with open(os.path.join(prof, 'user.js'), 'w') as f: f.write('user_pref("marionette.port", %d);\n' % port)
    env = dict(os.environ, MOZ_CRASHREPORTER_NO_REPORT='1')
    ff = subprocess.Popen(['firefox', '--headless', '--marionette', '--no-remote', '--profile', prof, 'about:blank'],
                          stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, env=env)
    m = None
    try:
        m = Marionette(port)
        m.cmd('WebDriver:NewSession', {'capabilities': {}})
        m.cmd('WebDriver:SetTimeouts', {'script': 60000})
        sep = '&' if '?' in url else '?'
        m.cmd('WebDriver:Navigate', {'url': '%s%sv=%d' % (url, sep, random.randrange(1 << 30))})  # no stale cache
        time.sleep(5)
        for i in range(rounds):
            r = m.cmd('WebDriver:ExecuteAsyncScript', {'script': ROUND_JS, 'args': [i]})
            print('  round %d saved -> %s' % (i + 1, r.get('value')))
        return True
    except (EOFError, ConnectionError) as e:
        print('  CRASH:', e)
        return False
    finally:
        try: m and m.cmd('Marionette:Quit', {'flags': ['eForceQuit']})
        except Exception: pass
        try: ff.wait(15)
        except subprocess.TimeoutExpired: ff.kill()
        shutil.rmtree(prof, ignore_errors=True)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--url', default='http://127.0.0.1:4180/games/remi-vita/')
    ap.add_argument('--rounds', type=int, default=4)
    ap.add_argument('--runs', type=int, default=3)
    a = ap.parse_args()
    ok = 0
    for n in range(a.runs):
        print('run %d/%d' % (n + 1, a.runs))
        ok += run_once(a.url, a.rounds, 2828 + 10 + n)
        time.sleep(2)
    print('%d/%d runs survived' % (ok, a.runs))
    sys.exit(0 if ok == a.runs else 1)


if __name__ == '__main__':
    main()
