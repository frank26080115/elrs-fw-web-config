import paramiko
import os
import argparse

def download_files(hostname, port, username, password, remote_directories, local_directories):
    # Create an SSH client
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())

    # Connect to the SFTP server
    ssh.connect(hostname, port, username, password)
    sftp = ssh.open_sftp()

    for remote_dir, local_dir in zip(remote_directories, local_directories):
        # Ensure the local directory exists
        os.makedirs(local_dir, exist_ok=True)

        # List files in the remote directory
        for filename in sftp.listdir(remote_dir):
            remote_file_path = remote_dir + "/" + filename
            if sftp.stat(remote_file_path).st_mode & 0o170000 == 0o100000:
                local_file_path = os.path.join(local_dir, filename)

                # Download the file
                sftp.get(remote_file_path, local_file_path)
                print(f"Downloaded {remote_file_path} to {local_file_path}")

    # Close the SFTP connection
    sftp.close()
    ssh.close()

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Download files from an SFTP server.')
    parser.add_argument('--hostname', default="expresslrsconfig.eleccelerator.com", help='SFTP server hostname')
    parser.add_argument('--port', type=int, default=22, help='SFTP server port')
    parser.add_argument('--username', required=True, help='SFTP server username')
    parser.add_argument('--password', required=True, help='SFTP server password')

    args = parser.parse_args()

    print(f"current working dir: {os.getcwd()}")

    VAR_WWW = "/var/www"
    DIR_HTML = VAR_WWW + "/html"
    DIR_PRIVATE = VAR_WWW + "/private"
    remote_dirs = [
        DIR_HTML,
        DIR_HTML + "/js",
        DIR_HTML + "/css",
        DIR_PRIVATE,
        DIR_PRIVATE + "/config_backups"
    ]
    REPO_LOC = os.path.abspath(os.path.dirname(os.path.abspath(os.getcwd())))
    local_dirs = []
    for i in remote_dirs:
        j = os.path.normpath(os.path.join(REPO_LOC, i[len(VAR_WWW) + 1:]))
        local_dirs.append(j)
        print(f"'{i}' => '{j}'")

    download_files(args.hostname, args.port, args.username, args.password, remote_dirs, local_dirs)
    print("All Done")
