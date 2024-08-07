import subprocess
import os, shutil
import time, datetime
import re

def get_git_tags(repo_path, min_ver = "3.0.0"):
    result = subprocess.run(['git', 'tag'], cwd=repo_path, capture_output=True, text=True)
    all_tags = [tag for tag in result.stdout.split('\n') if tag]
    relevant_tags = []
    for t in all_tags:
        if compare_versions(t, min_ver) >= 0 and "alpha" not in t.lower() and "rc" not in t.lower():
            relevant_tags.append(t.strip())
    return sort_versions(relevant_tags)

def get_build_targets(repo_path, checkout = None):
    if checkout is not None:
        git_reset_repo(repo_path)
        cmd = ['git', 'checkout']
        cmd.extend(checkout.split(" "))
        subprocess.run(cmd, cwd=repo_path)
        git_reset_repo(repo_path)
    compiled_regex = re.compile(r"\[env:([a-zA-Z0-9_]+)\]")
    matches = []
    for root, dirs, files in os.walk(repo_path):
        for file in files:
            if file.endswith('.ini'):
                with open(os.path.join(root, file), 'r') as f:
                    contents = f.read()
                    for match in compiled_regex.finditer(contents):
                        matches.append(match.group(1))
    return matches

def git_del_hardware_dir(dir_path):
    chown_all_repos()
    hw_path = os.path.join(os.path.abspath(dir_path), "src", "hardware")
    hw_json = os.path.join(hw_path, "targets.json")
    if os.path.exists(hw_path) and not os.path.exists(hw_json):
        try :
            shutil.rmtree(hw_path)
        except:
            pass

def git_reset_repo(dir_path, pull = False):
    chown_all_repos()
    s = ""
    cmd = ["git", "reset", "--hard", "HEAD"]
    try:
        subprocess.run(cmd, cwd=os.path.abspath(dir_path), capture_output=True, text=True, check=True)
    except subprocess.CalledProcessError as e:
        s += f"\nCommand '{e.cmd}' returned non-zero exit status {e.returncode}. Command output: {e.output}"
        print(s)
    cmd = ["git", "clean", "-f", "-d"]
    try:
        subprocess.run(cmd, cwd=os.path.abspath(dir_path), capture_output=True, text=True, check=True)
    except subprocess.CalledProcessError as e:
        s += f"\nCommand '{e.cmd}' returned non-zero exit status {e.returncode}. Command output: {e.output}"
        print(s)
    git_del_hardware_dir(dir_path)
    if pull:
        cmd = ["git", "pull"]
        try:
            subprocess.run(cmd, cwd=os.path.abspath(dir_path), capture_output=True, text=True, check=True)
        except subprocess.CalledProcessError as e:
            s += f"\nCommand '{e.cmd}' returned non-zero exit status {e.returncode}. Command output: {e.output}"
            print(s)
        chown_all_repos()
    return s.strip()

def git_pull_if_old(dir_path, origin = "origin", branch = "master", force = False):
    now = time.time()
    two_days_ago = now - 60*60*24*2
    ts_path = dir_path + ".timestamp"
    if os.path.exists(ts_path):
        mtime = os.path.getmtime(ts_path)
        if mtime < two_days_ago:
            os.utime(dir_path, (now, now))
            force = True
    else:
        with open(ts_path, "a") as f:
            pass

    s = ""
    if force:
        s += git_reset_repo(dir_path)
        cmd = ["git", "pull"]
        if origin is not None and len(origin) > 0 and branch is not None and len(branch) > 0:
            cmd.append(origin)
            cmd.append(branch)
        try:
            subprocess.run(cmd, cwd=os.path.abspath(dir_path), capture_output=True, text=True, check=True)
        except subprocess.CalledProcessError as e:
            s += f"\nCommand '{e.cmd}' returned non-zero exit status {e.returncode}. Command output: {e.output}"
            print(s)
        chown_all_repos()
    return s.strip()

def git_fetch_if_old(dir_path, force = False):
    now = time.time()
    two_days_ago = now - 60*60*24*2
    ts_path = dir_path + ".timestamp"
    if os.path.exists(ts_path):
        mtime = os.path.getmtime(ts_path)
        if mtime < two_days_ago:
            os.utime(dir_path, (now, now))
            force = True
    else:
        with open(ts_path, "a") as f:
            pass

    s = ""
    if force:
        cmd = ["git", "fetch"]
        try:
            subprocess.run(cmd, cwd=os.path.abspath(dir_path), capture_output=True, text=True, check=True)
        except subprocess.CalledProcessError as e:
            s += f"\nCommand '{e.cmd}' returned non-zero exit status {e.returncode}. Command output: {e.output}"
            print(s)
        chown_all_repos()
    return s.strip()

def chown_all_repos():
    owner = "www-data:www-data"
    list_of_dirs = [
        "/var/www/private/repos",
        "/var/www/private/logs",
        "/var/www/html/fw",
    ]
    for i in list_of_dirs:
        try:
            subprocess.run(["sudo", "chown", "-R", owner, i])
        except:
            pass
        try:
            subprocess.run(["chown", "-R", owner, i])
        except:
            pass

def sort_versions(versions):
    return sorted(versions, key=version_key, reverse=True)

def compare_versions(version1, version2):
    key1 = version_key(version1)
    key2 = version_key(version2)
    if key1 > key2:
        return 1
    elif key1 < key2:
        return -1
    else:
        return 0

def version_key(version):
    version = version.strip()
    # Remove leading 'v'
    if version.startswith('v'):
        version = version[1:]
    # Remove suffix starting with '-'
    version = version.split('-')[0]
    sects = version.split('.')
    lst = []
    for s in sects:
        try:
            lst.append(int(s))
        except:
            lst.append(0)
    return lst
