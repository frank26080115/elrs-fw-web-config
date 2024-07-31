from flask import Flask, request, jsonify
import threading, queue
import subprocess, os
import datetime
import re
import shutil
import gc

repo_dir = "repos"
fw_dir = "fw"
task_cnt_limit = 100

'''
This is a daemon that builds ExpressLRS firmware
Tasks are given by the front-end_time
If the file that's required already exists, it is provided back to the front-end immediately
If the file that's requested is currently in the middle of being built, or is queued for being built later, then the front-end is notified
Otherwise, a new build task is queued up and then executed later
Only one build is done at a time no matter how many clients are requesting builds
'''

home_dir = os.getcwd()
app = Flask(__name__)
build_queue = queue.Queue()
build_list = {}
current_task = None

def build_expresslrs(env_target, dirpath = "."):
    env = os.environ.copy()
    env["PYTHONUNBUFFERED"] = "1"
    command = ["pio", "run", "-e", env_target, "-d", os.path.abspath(dirpath)]
    process = None
    stdout_output = ""
    stderr_output = ""
    success = False
    text = ""
    try:
        process = subprocess.Popen(command, stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, env=env)
        stdout_output, stderr_output = process.communicate(input='\r', timeout=60*5)
        if process.returncode == 0:
            success = True
            text += "Build Success\n"
        else:
            text += f"Build Failed, code {process.returncode}\n"
        text += stdout_output + '\n' + stderr_output
    except subprocess.TimeoutExpired as e:
        if process is not None:
            process.kill()
            stdout_output, stderr_output = process.communicate()
        else:
            stdout_output = e.stdout
            stderr_output = e.stderr
        text += "ERROR: PIO build process timed out\n" + stdout_output + '\n' + stderr_output
    except Exception as ex:
        text += "ERROR: exception occured during PIO build\n" + str(ex)
    fwpath = os.path.abspath(os.path.join(dirpath, f".pio/build/{env_target}/firmware.bin"))
    if os.path.exists(fwpath) == False:
        text += f"ERROR: \"{fwpath}\" is missing"
        fwpath = None
    return success, text, fwpath

def git_refresh_gethash(ver):
    git_url = "https://github.com/ExpressLRS/ExpressLRS.git"
    repo_name = "ExpressLRS"
    checkout = ver
    if ver is not None and ver == "shrew":
        git_url = "https://github.com/frank26080115/ExpressLRS.git"
        repo_name = "shrew"
        checkout = "-b shrew"
    if ver is not None and ver == "targets":
        git_url = "https://github.com/ExpressLRS/targets.git"
        repo_name = "targets"
        checkout = None

    repo_path = os.path.join(repo_dir, repo_name)
    if not os.path.exists(repo_path):
        subprocess.run(["git", "clone", git_url, repo_name], cwd=repo_dir, capture_output=True, text=True, check=True)
        repo_fullpath = os.path.abspath(repo_path)
        cmd = "git config --global --add safe.directory {repo_fullpath}"
        cmd = cmd.split(' ')
        subprocess.run(cmd, cwd=repo_fullpath, capture_output=True, text=True, check=True)

    #original_directory = os.getcwd()
    last_modified_time = os.path.getmtime(repo_path)
    last_modified_datetime = datetime.datetime.fromtimestamp(last_modified_time)
    current_time = datetime.datetime.now()
    time_difference = current_time - last_modified_datetime
    if time_difference.days >= 1:
        os.utime(repo_path, None)
        #os.chdir(repo_path)
        subprocess.run(["git", "pull"], cwd=repo_path, capture_output=True, text=True, check=True)

    if checkout is not None:
        cmd = ["git", "checkout"]
        cmd.extend(checkout.split(' '))
        subprocess.run(cmd, cwd=repo_path, capture_output=True, text=True, check=True)

    txt = subprocess.run(["git", "rev-parse", "HEAD"], cwd=repo_path, capture_output=True, text=True, check=True)
    txt = txt.stdout.strip()
    return txt

class BuildTask(object):
    def __init__(self, data, task_name = None):
        self.data = data
        self.thread = None
        self.is_done = False
        self.create_time = datetime.datetime.now()
        self.start_time = None
        self.end_time = None
        self.task_name = task_name if task_name is not None else get_taskname(data)
        self.message = ""
        self.file_path = ""

    def poke(self):
        if self.start_time is None or self.thread is None:
            self.start()

    def task(self):
        self.start_time = datetime.datetime.now()

        try:
            git_refresh_gethash(self.data["version"])
            repo_name = "ExpressLRS"
            if self.task_name.startswith("shrew"):
                repo_name = "shrew"

            repo_path = os.path.join(repo_dir, repo_name)
            success, text, fwpath = build_expresslrs(self.data["firmware"], os.path.join(repo_path, "src"))

            self.message += text
            saved_fw_path = os.path.join(fw_dir, self.task_name + ".bin")

            if os.path.exists(fwpath):
                if not os.path.exists(fw_dir):
                    os.makedirs(fw_dir)
                shutil.move(fwpath, saved_fw_path)
                self.file_path = saved_fw_path
        except Exception as ex:
            self.message += f"\nTask Error Exception: {str(ex)}\n"

        try:
            start_next_task(poke = False)
        except Exception as ex:
            self.message += f"\nTask Next Start Error Exception: {str(ex)}\n"

        self.end_time = datetime.datetime.now()
        self.is_done = True

    def start(self):
        global current_task
        current_task = self
        self.thread = threading.Thread(target=self.task)
        self.thread.start()

    def get_age(self):
        current_time = datetime.datetime.now()
        time_difference = current_time - self.create_time
        return time_difference

    def get_duration(self):
        if self.start_time is None:
            return 0
        t = self.end_time if self.end_time is not None else datetime.datetime.now()
        time_difference = t - self.start_time
        return time_difference

    def get_totaltime(self):
        t = self.end_time if self.end_time is not None else datetime.datetime.now()
        time_difference = t - self.create_time
        return time_difference

def get_taskname(data):
    global home_dir
    v = data["version"]
    if v == "shrew":
        p = os.path.join(home_dir, os.path.join("repos", "shrew"))
        h = git_refresh_gethash(data["version"])
        v += h[0:8]
    x = v + "_" + data["firmware"]
    invalid_chars = r'[<>:"/\\|?*\x00-\x1F.]'
    sanitized_filename = re.sub(invalid_chars, '_', x)
    return sanitized_filename

def get_fwpath(task_name):
    p = os.path.join("fw", task_name + ".bin")
    return p, os.path.exists(p)

def prune_queue():
    global build_queue
    global build_tasks
    global current_task
    for i in build_tasks:
        if i in build_tasks and build_tasks[i].get_age().days >= 1:
            build_tasks.remove(i)
    gc.collect()

def start_next_task(poke = True):
    global build_queue
    global build_tasks
    global current_task

    if poke:
        if current_task is not None:
            if current_task.is_done:
                current_task = None
            else:
                current_task.poke()
                return

    while True:
        if build_queue.empty():
            break
        next_task_name = build_queue.get()
        if next_task_name in build_tasks:
            next_task = build_tasks[next_task_name]
            next_task.start()
            break
        else:
            continue
    prune_queue()

@app.route('/builder', methods=['POST'])
def handle_json():
    global build_queue
    global build_tasks
    global current_task

    data = request.get_json()
    if data:
        task_name = get_taskname(data)
        fw_path, fw_exists = get_fwpath(task_name)
        if fw_exists:
            return jsonify({"status": "done", "file": fw_path, "message": "old build"}), 200
        if task_name in build_tasks:
            task = build_tasks[task_name]
            response = {"status": "busy"}
            if task.is_done:
                response = {"status": "done", "file": task.file_path, "message": task.message}
                build_tasks.remove(task_name)
            return jsonify(response), 200

        if build_queue.qsize() >= task_cnt_limit:
            prune_queue()
            response = {"status": "full"}
            return jsonify(response), 200

        task = BuildTask(data, task_name)
        build_tasks[task_name] = task
        build_queue.queue(task_name)
        if current_task is None:
            start_next_task(poke = True)
        response = {"status": "busy"}
        return jsonify(response), 200
    else:
        return jsonify({'error': 'Invalid JSON'}), 400

@app.route('/builder_prep', methods=['GET', 'POST'])
def handle_prep():
    git_refresh_gethash(None)
    git_refresh_gethash("shrew")
    git_refresh_gethash("targets")
    response = {"status": "ok"}
    return jsonify(response), 200

if __name__ == '__main__':
    #global home_dir
    home_dir = os.getcwd()
    app.run(host='0.0.0.0', port=5000)
