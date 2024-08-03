#/usr/bin/sh

sudo swapoff /swapfile
sudo fallocate -l 2G /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
