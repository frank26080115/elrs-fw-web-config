#!/usr/bin/sh

cd /var/www/private/repos/ExpressLRS
sudo -u www-data git prune
sudo -u www-data git gc
cd /var/www/private/repos/shrew
sudo -u www-data git prune
sudo -u www-data git gc
