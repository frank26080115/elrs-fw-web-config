import utils
import sys
import json
import time
import subprocess

import requests

class BuildServerConnection(object):
    def __init__(self):
        self.url = 'http://localhost:5000/'

    def build(self, repo, tag, env_target):
        payload = {
            "action": "build",
            "version": tag,
            "firmware": env_target
        }
        json_payload = json.dumps(payload)
        response = requests.post(self.url + "builder", data=json_payload, headers={'Content-Type': 'application/json'})
        data = response.json()
        return data

    def check_if_online(self):
        try:
            response = requests.get(self.url + "test")
            if response.status_code == 200:
                return True
            else:
                return False
        except requests.exceptions.RequestException as err:
            return False

    def launch_if_not_availabe(self):
        if not self.check_if_online():
            print("launching server")
            p = subprocess.Popen(f"sudo -u www-data python3 /var/www/private/builder.py".split(" "))
            time.sleep(2)

if __name__ == '__main__':
    server = BuildServerConnection()
    server.launch_if_not_availabe()
    repo = "/var/www/private/repos/ExpressLRS"
    utils.git_pull_if_old(repo, force = True)
    tags = utils.get_git_tags(repo)
    all_env_targets = None
    for t in tags:
        env_targets = utils.get_build_targets(repo, t)
        if all_env_targets is None:
            all_env_targets = env_targets
        for i in env_targets:
            if "Unified" not in i or "RX" not in i:
                continue
            if "2400" not in i:
                continue
            if "_via_UART" not in i:
                continue
            print(f"build request {t} - {i}")
            while True:
                try:
                    r = server.build("ExpressLRS", t, i)
                    if r["status"] == "done":
                        print(f"done, file: {r["file"]}")
                        break
                    else:
                        print(f"status: {r["status"]}")
                except Exception as ex:
                    print("Exception when sending request: " + str(ex))
                time.sleep(5)
    repo = "/var/www/private/repos/shrew"
    utils.git_pull_if_old(repo, "origin", "shrew", force = True)
    for i in all_env_targets:
        if "Unified" not in i or "RX" not in i:
            continue
        if "2400" not in i:
            continue
        if "_via_UART" not in i:
            continue
        print(f"build request shrew - {i}")
        while True:
            try:
                r = server.build("shrew", "shrew", i)
                if r["status"] == "done":
                    print(f"done, file: {r["file"]}")
                    break
                else:
                    print(f"status: {r["status"]}")
            except Exception as ex:
                print("Exception when sending request: " + str(ex))
            time.sleep(5)