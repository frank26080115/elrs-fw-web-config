#!/usr/bin/sh

sudo apt-get install python3-pip python3-virtualenv

sudo -u www-data mkdir -p /var/www/private/pioenv
sudo chown -R www-data:www-data /var/www/private/pioenv
cd /var/www/private/pioenv
sudo -u python3 -m venv piovenv
sudo -u www-data bash -c "source /var/www/private/pioenv/pioenv/bin/activate && pip3 install -U platformio"
sudo chown -R www-data:www-data /var/www/private/pioenv
