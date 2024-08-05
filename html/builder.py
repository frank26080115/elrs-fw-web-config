from flask import Flask, request, jsonify
import logging
from logging.handlers import RotatingFileHandler
import threading, queue
import subprocess, os
import datetime
import re
import shutil
import gc

repo_dir = "/var/www/private/repos"
fw_dir = "fw"
task_cnt_limit = 100
pio_path = "/var/www/private/piovenv/piovenv/bin/pio"

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
script_path = None
script_modified_time = None

log_file = '/var/www/private/logs/builder.log'
log_dir = os.path.dirname(log_file)
os.makedirs(log_dir, exist_ok=True)
log_format = '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
log_level = logging.INFO
handler = RotatingFileHandler(log_file, maxBytes=10000, backupCount=3)
handler.setLevel(log_level)
handler.setFormatter(logging.Formatter(log_format))
app.logger.addHandler(handler)
app.logger.setLevel(log_level)

build_queue = queue.Queue()
build_tasks = {}
current_task = None

def build_expresslrs(env_target, dirpath = ".", clean = True):
    app.logger.info(f"Starting build \"{env_target}\" dir \"{dirpath}\"")
    env = os.environ.copy()
    env["PYTHONUNBUFFERED"] = "1"
    if clean:
        try:
            command = [pio_path, "run", "--target", "clean", "-e", env_target, "-d", os.path.abspath(dirpath)]
            process = subprocess.Popen(command, cwd=os.path.abspath(dirpath), stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, env=env)
            stdout_output, stderr_output = process.communicate(timeout=60*10)
        except Exception as ex:
            app.logger.error("Build clean caused exception: " + str(e))
            pass
    command = [pio_path, "run", "-e", env_target, "-d", os.path.abspath(dirpath)]
    process = None
    stdout_output = ""
    stderr_output = ""
    success = False
    text = ""
    try:
        process = subprocess.Popen(command, cwd=os.path.abspath(dirpath), stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, env=env)
        stdout_output, stderr_output = process.communicate(timeout=60*10)
        if process.returncode == 0:
            success = True
            s = "Build Success\n"
            text += s
            app.logger.info(s)
        else:
            s = f"Build Failed, code {process.returncode}\n"
            text += s
            app.logger.error(s)
        text += stdout_output + '\n' + stderr_output
    except subprocess.TimeoutExpired as e:
        if process is not None:
            process.kill()
            stdout_output, stderr_output = process.communicate()
        else:
            stdout_output = e.stdout
            stderr_output = e.stderr
        s = "ERROR: PIO build process timed out\n" + stdout_output + '\n' + stderr_output
        text += s
        app.logger.error(s)
    except Exception as ex:
        text += "ERROR: exception occured during PIO build\n" + str(ex) + "\n"
    fwpath = os.path.abspath(os.path.join(dirpath, f".pio/build/{env_target}/firmware.bin"))
    if success and os.path.exists(fwpath) == False:
        s = f"ERROR: \"{fwpath}\" is missing\n"
        text += s
        fwpath = None
        app.logger.error(s)
    return success, text, fwpath

def git_reset_repo(dir_path):
    cmd = ["git", "reset", "--hard", "HEAD"]
    try:
        subprocess.run(cmd, cwd=os.path.abspath(dir_path), capture_output=True, text=True, check=True)
    except subprocess.CalledProcessError as e:
        s = f"Command '{e.cmd}' returned non-zero exit status {e.returncode}. Command output: {e.output}"
        print(s)
        app.logger.error(s)
    cmd = ["git", "clean", "-f", "-d"]
    try:
        subprocess.run(cmd, cwd=os.path.abspath(dir_path), capture_output=True, text=True, check=True)
    except subprocess.CalledProcessError as e:
        s = f"Command '{e.cmd}' returned non-zero exit status {e.returncode}. Command output: {e.output}"
        print(s)
        app.logger.error(s)

def git_refresh_gethash(ver):
    git_url = "https://github.com/ExpressLRS/ExpressLRS.git"
    repo_name = "ExpressLRS"
    checkout = ver
    if ver is not None and ver == "shrew":
        git_url = "https://github.com/frank26080115/ExpressLRS.git"
        repo_name = "shrew"
        checkout = "shrew"
    if ver is not None and ver == "targets":
        git_url = "https://github.com/ExpressLRS/targets.git"
        repo_name = "targets"
        checkout = None

    repo_path = os.path.join(repo_dir, repo_name)
    repo_fullpath = os.path.abspath(repo_path)
    if not os.path.exists(repo_path):
        try:
            os.makedirs(repo_fullpath, mode=0o777)
            subprocess.run(["git", "clone", git_url, repo_fullpath], cwd=repo_dir, capture_output=True, text=True, check=True)
        except subprocess.CalledProcessError as e:
            s = f"Command '{e.cmd}' returned non-zero exit status {e.returncode}. Command output: {e.output}"
            print(s)
            app.logger.error(s)
            return None
        cmd = f"git config --global --add safe.directory {repo_fullpath}"
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
        git_reset_repo(repo_fullpath)
        try:
            subprocess.run(["git", "pull"], cwd=repo_fullpath, capture_output=True, text=True, check=True)
        except subprocess.CalledProcessError as e:
            s = f"Command '{e.cmd}' returned non-zero exit status {e.returncode}. Command output: {e.output}"
            print(s)
            app.logger.error(s)

    if checkout is not None:
        git_reset_repo(repo_fullpath)
        cmd = ["git", "checkout"]
        cmd.extend(checkout.split(' '))
        try:
            subprocess.run(cmd, cwd=repo_fullpath, capture_output=True, text=True, check=True)
        except subprocess.CalledProcessError as e:
            s = f"Command '{e.cmd}' returned non-zero exit status {e.returncode}. Command output: {e.output}"
            print(s)
            app.logger.error(s)

    txt = ver
    try:
        p = subprocess.run(["git", "rev-parse", "HEAD"], cwd=repo_fullpath, capture_output=True, text=True, check=True)
        txt = p.stdout.strip()
    except subprocess.CalledProcessError as e:
        s = f"Command '{e.cmd}' returned non-zero exit status {e.returncode}. Command output: {e.output}"
        print(s)
        app.logger.error(s)
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

            if fwpath is not None and os.path.exists(fwpath):
                if not os.path.exists(fw_dir):
                    os.makedirs(fw_dir)
                shutil.move(fwpath, saved_fw_path)
                self.file_path = saved_fw_path
        except Exception as ex:
            s = f"Task Error Exception: {str(ex)}"
            self.message += "\n" + s + "\n"
            app.logger.error(s)

        try:
            start_next_task(poke = False)
        except Exception as ex:
            s = f"Task Next Start Error Exception: {str(ex)}"
            self.message += f"\n{s}\n"
            app.logger.error(s)

        while "\n\n" in self.message:
            self.message = self.message.replace("\n\n", "\n")

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
            del build_tasks[i]
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

def get_busy_message():
    global build_queue
    time_str = datetime.datetime.now().strftime("%b/%d/%Y-%H:%M:%S")
    return f"{build_queue.qsize()} in build queue, last check time: {time_str}"

@app.route('/builder', methods=['POST'])
def handle_json():
    global build_queue
    global build_tasks
    global current_task
    global last_activity_time

    last_activity_time = datetime.datetime.now()

    data = request.get_json()
    if data:
        try:
            if data["action"] == "build":
                task_name = get_taskname(data)
                if task_name in build_tasks:
                    task = build_tasks[task_name]
                    response = {"status": "busy queued", "message": get_busy_message()}
                    if task.is_done:
                        response = {"status": "done", "version": task.data["version"], "firmware": task.data["firmware"], "file": task.file_path, "message": task.message}
                    elif task.start_time is not None:
                        time_diff = datetime.datetime.now() - task.start_time
                        response = {"status": "busy started", "message": f"{round(time_diff.total_seconds())} seconds elapsed"}
                    else:
                        #response["message"] = task.get_status();
                        pass
                    return jsonify(response), 200

                fw_path, fw_exists = get_fwpath(task_name)
                if fw_exists:
                    return jsonify({"status": "done", "version": data["version"], "firmware": data["firmware"], "file": fw_path, "message": "old build"}), 200

                if build_queue.qsize() >= task_cnt_limit:
                    prune_queue()
                    response = {"status": "busy full", "message": get_busy_message()}
                    return jsonify(response), 200

                task = BuildTask(data, task_name)
                build_tasks[task_name] = task
                build_queue.put(task_name)
                if current_task is not None:
                    if current_task.is_done:
                        current_task = None
                if current_task is None:
                    start_next_task(poke = True)
                response = {"status": "busy new", "message": get_busy_message()}
                return jsonify(response), 200
            elif data["action"] == "clear":
                task_name = get_taskname(data)
                while task_name in build_tasks:
                    del build_tasks[task_name]
                if current_task is None:
                    start_next_task(poke = True)
                response = {"status": "ok"}
                return jsonify(response), 200
            elif data["action"] == "report":
                response = {"report": get_busy_message()}
                return jsonify(response), 200
            elif data["action"] == "quit":
                os._exit(0)
        except Exception as ex:
            app.logger.error("handle_json exception: " + str(ex))
            response = {"error": "Python exception: " + str(ex)}
            return jsonify(response), 200
    else:
        return jsonify({'error': 'Python error: invalid or missing JSON'}), 400

@app.route('/builder_prep', methods=['GET', 'POST'])
def handle_prep():
    if not os.path.exists(repo_dir):
        os.makedirs(repo_dir, mode=0o777)
    git_refresh_gethash(None)
    git_refresh_gethash("shrew")
    git_refresh_gethash("targets")
    response = {"status": "ok"}
    return jsonify(response), 200

@app.route('/quit')
def quit_server():
    os._exit(0)

def monitoring_task():
    global last_activity_time
    global script_path
    global script_modified_time
    while True:
        to_kill = False
        now = datetime.datetime.now()
        if build_queue.empty() and all(obj.is_done for obj in build_tasks):
            if last_activity_time is not None:
                time_diff = now - last_activity_time
                if time_diff.total_seconds() > 60 * 10:
                    to_kill = True
            else if script_path is not None and script_modified_time is not None:
                modified_time = os.path.getmtime(script_path)
                if modified_time > script_modified_time:
                    to_kill = True
        if to_kill:
            app.logger.info("Server Suicide")
            os.kill(os.getpid(), signal.SIGINT)
        time.sleep(60)

if __name__ == '__main__':
    #global home_dir
    script_path = os.path.abspath(__file__)
    script_modified_time = os.path.getmtime(script_path)
    home_dir = os.getcwd()
    monitoring_thread = threading.Thread(target=monitoring_task)
    monitoring_thread.start()
    app.logger.info("Server Launched")
    app.run(host='0.0.0.0', port=5000)
