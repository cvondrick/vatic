# -*- mode: ruby -*-
# vi: set ft=ruby :

Vagrant.configure("2") do |config|
  config.vm.box = "hashicorp/precise64"

  config.vm.network "forwarded_port", guest: 80, host: 8080

  config.vm.provision "shell", path: "vatic-install.sh", env: {"INSTALL_WITH_EXAMPLE_DATA" => "true"}

  config.vm.synced_folder "data", "/home/vagrant/vagrant_data"
end
