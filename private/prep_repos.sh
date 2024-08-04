#!/usr/bin/sh

sudo -u www-data mkdir -p /var/www/private/repos
sudo -u www-data git clone https://github.com/ExpressLRS/ExpressLRS.git /var/www/private/repos/ExpressLRS
sudo -u www-data git clone https://github.com/frank26080115/ExpressLRS.git /var/www/private/repos/shrew
sudo -u www-data git clone https://github.com/ExpressLRS/targets.git /var/www/private/repos/targets
cd /var/www/private/repos/ExpressLRS
sudo git config --global --add safe.directory /var/www/private/repos/ExpressLRS
cd /var/www/private/repos/shrew
sudo git config --global --add safe.directory /var/www/private/repos/shrew
sudo -u www-data git checkout shrew
cd /var/www/private/repos/targets
sudo git config --global --add safe.directory /var/www/private/repos/targets
