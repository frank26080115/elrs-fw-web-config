# Deployment Procedure

First, start a VPS with Ubuntu on it. SSH into it.

Use SFTP to copy the `html` directory as `/var/www/html` on the server

Use SFTP to copy the `private` directory as `/var/www/private` on the server

There are a bunch of scripts inside the `/var/www/private` directory. Make sure they have execute permissions.

Call `sudo install_packages.sh` first, which should install all the packages you need.

Edit your domain's DNS records to point your domain or subdomain at the VPS's IP address.

Use `certbot` to setup SSL. It should be almost fully automated but you will need to provide a email address and domain URL when prompted.

There are some config files in the `config_backups` directory, compare them against their targets and apply the changes.

Call `sudo set_swapfile.sh` to increase the memory of the server. Otherwise, the compilation process might run out of memory and crash without any displayed cause.

Call `sudo prep_repos.sh` to clone all the relevant git repositories and prepare them.

Call `sudo prep_pio.sh` to install PlatformIO.

# Troubleshooting

View Apache error log with `sudo tail -f /var/log/apache2/error.log`

#### ESP32 builds failing due to missing Arduino.h

Try calling `sudo -u www-data /var/www/private/piovenv/piovenv/bin/pio platform install espressif32@6.4.0 --with-package framework-arduinoespressif32` to install framework-arduinoespressif32

And try finding `[env_common_esp32]` in the file `src\targets\common.ini` (in the git repo) and adding `platform_packages = framework-arduinoespressif32` to it.

#### Apache log file not readable

Make sure directory `/var/log/apache2` has read permissions for everyone.

Open the `logrotate` configuration file for Apache. This file is typically located at `/etc/logrotate.d/apache2`.

Look for the section that refers to `/var/log/apache2/error.log`.

Add or modify the create directive to set the permissions you want. For example, to set the permissions to 644 (readable by everybody), you can use the following directive:
`create 644 root adm`
