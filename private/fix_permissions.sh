#!/usr/bin/sh

sudo mkdir -p /var/www/private/repos
sudo chown -R www-data:www-data /var/www/private/repos
sudo chmod -R 0764 /var/www/private/repos
sudo mkdir -p /var/www/html/fw
sudo chown -R www-data:www-data /var/www/html/fw
sudo chmod -R 0764 /var/www/html/fw
sudo chown -R www-data:www-data /var/www/html
sudo chmod -R 0764 /var/www/html
