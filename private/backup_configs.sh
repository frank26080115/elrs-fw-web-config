#/usr/bin/sh

sudo mkdir -p config_backups
sudo cp /etc/apache2/apache2.conf ./config_backups/apache2.conf.bak
sudo cp /etc/php/*/apache2/php.ini ./config_backups/php.ini.bak
sudo cp /etc/apache2/sites-available/000-default.conf ./config_backups/000-default.conf.bak
