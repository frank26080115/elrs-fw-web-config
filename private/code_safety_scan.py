import hashlib, secrets
import sqlite3
import os, subprocess

def hash_files(file_list):
    hasher = hashlib.sha256()
    for file_name in file_list:
        with open(file_name, 'rb') as f:
            buf = f.read()
            hasher.update(hashlib.sha256(buf).digest())
    return hasher.hexdigest()

def find_interesting_files(directory):
    interesting_files = []
    for root, dirs, files in os.walk(directory):
        for file in files:
            if file.endswith('.py') or file.endswith('.ini'):
                interesting_files.append(os.path.join(root, file))
    return sorted(interesting_files)

def hash_directory(directory):
    return hash_files(find_interesting_files(directory))

def get_git_tags(repo_path):
    result = subprocess.run(['git', 'tag'], cwd=repo_path, capture_output=True, text=True)
    tags = [tag for tag in result.stdout.split('\n') if tag]
    return tags

def get_git_name_and_hash(directory, checkout = None):
    dir_name = os.path.basename(directory)
    if checkout is not None:
        subprocess.run(["git", "checkout", checkout], cwd=os.path.abspath(directory), capture_output=True, text=True, check=True)
    p = subprocess.run(["git", "rev-parse", "HEAD"], cwd=os.path.abspath(directory), capture_output=True, text=True, check=True)
    commit = p.stdout.strip()
    commit = commit[0:8]
    return dir_name, commit

class ApprovedListDatabase(object):
    def __init__(self, table_file = "approved_list.db", table_name = "approved_list"):
        self.table_file = table_file
        self.table_name = table_name

    def connect(self):
        self.conn = sqlite3.connect(self.table_file)
        self.cursor = self.conn.cursor()
        print("db connected")

    def close(self):
        self.conn.close()

    def create_table(self):
        self.cursor.execute(f"CREATE TABLE IF NOT EXISTS {self.table_name} (short_name text, commit_hash text, approved_hash text)")
        self.conn.commit()
        print("db table created")

    def approve_single(self, directory, checkout = None):
        dir_name, commit = get_git_name_and_hash(directory, checkout)
        hash_result = hash_directory(directory)
        x = f"INSERT INTO {self.table_name} VALUES ('{dir_name}','{commit}','{hash_result}')"
        print(x)
        self.cursor.execute(x)
        self.conn.commit()

    def approve_all_tags(self, directory):
        tags = get_git_tags(directory)
        print(f"got {len(tags)} tags from {directory}")
        for t in tags:
            try:
                if not self.entry_exists(directory, t):
                    try:
                        self.approve_single(directory, t)
                    except Exception as ex:
                        print(f"Error while trying to approve tag {t} for {directory}, exception: {ex}")
            except Exception as ex:
                print(f"Error while trying to examine tag {t} for {directory}, exception: {ex}")

    def row_exists(self, column_name, value):
        self.cursor.execute(f"SELECT * FROM {self.table_name} WHERE {column_name}=?", (value,))
        row = self.cursor.fetchone()
        return row is not None

    def is_approved(self, hexdigest):
        return self.row_exists("approved_hash", hexdigest)

    def entry_exists(self, directory, checkout = None):
        dir_name, commit = get_git_name_and_hash(directory, checkout)
        self.cursor.execute(f"SELECT * FROM {self.table_name} WHERE short_name=? AND commit_hash=?", (dir_name, commit))
        row = self.cursor.fetchone()
        return row is not None

    def print_all(self):
        self.cursor.execute(f"SELECT * FROM {self.table_name}")
        rows = self.cursor.fetchall()
        for row in rows:
            print(row)

if __name__ == '__main__':
    db = ApprovedListDatabase()
    db.connect()
    db.create_table()
    dir_path = os.path.join("repos", "ExpressLRS")
    db.approve_all_tags(dir_path)
    dir_path = os.path.join("repos", "shrew")
    if not db.entry_exists(dir_path):
        db.approve_single(dir_path)
    db.print_all()
    db.close()
